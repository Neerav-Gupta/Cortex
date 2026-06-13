"""Sequential async agent pipeline nodes.

Each node is a plain async function. Gemini calls are synchronous, so they
are wrapped in asyncio.to_thread() to avoid blocking the FastAPI event loop.
Every Gemini call is wrapped in try/except with a fallback so the dashboard
always has data to render even if the model response is malformed.
"""

import asyncio
import json
import logging

import google.generativeai as genai

from agent.guardrails import FLOOR_RATIO, MAX_DISCOUNT_PCT
from data.fetchers import fetch_listing_data

logger = logging.getLogger("cortex.agent")

SYSTEM_CONTEXT = (
    "You are CortexAI, an AI pricing advisor for homeowners in stressed housing markets.\n"
    "You help sellers in disinvested neighborhoods protect their equity and sell on a\n"
    "reasonable timeline. Always respond with valid JSON only — no markdown, no explanation\n"
    "outside the JSON structure. Be specific and data-driven. Use the actual numbers provided.\n"
)


def _get_pipeline_model():
    """Fast, non-reasoning model for the structured-JSON pipeline steps and chat."""
    return genai.GenerativeModel("gemini-3.1-flash-lite")


def _call_gemini(prompt: str, model_factory=_get_pipeline_model) -> str:
    model = model_factory()
    response = model.generate_content(SYSTEM_CONTEXT + "\n" + prompt)
    return response.text


def _parse_json(text: str):
    """Parse JSON out of a model response.

    Reasoning models (e.g. Gemma) often emit chain-of-thought prose before
    the actual JSON answer, and responses may be wrapped in markdown code
    fences. This strips fences, then falls back to extracting the first
    balanced {...} or [...] block in the text.
    """
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    for open_char, close_char in (("{", "}"), ("[", "]")):
        start = cleaned.find(open_char)
        end = cleaned.rfind(close_char)
        if start != -1 and end != -1 and end > start:
            try:
                return json.loads(cleaned[start : end + 1])
            except json.JSONDecodeError:
                continue

    raise json.JSONDecodeError("No JSON object found", cleaned, 0)


async def chat_with_advisor(
    listing_data: dict,
    assessment: dict,
    scenarios: list,
    recommendation: dict,
    history: list[dict],
    message: str,
) -> str:
    """Answer a homeowner's question using the full agent context plus prior
    conversation turns. Returns plain-text advice."""
    history_text = "\n".join(
        f"{turn['role'].capitalize()}: {turn['content']}" for turn in history
    )

    prompt = (
        "Here is the listing and local market data as JSON:\n"
        f"{json.dumps(listing_data, indent=2)}\n\n"
        "Here is the market assessment as JSON:\n"
        f"{json.dumps(assessment, indent=2)}\n\n"
        "Here are the pricing scenarios as JSON:\n"
        f"{json.dumps(scenarios, indent=2)}\n\n"
        "Here is the current recommendation as JSON:\n"
        f"{json.dumps(recommendation, indent=2)}\n\n"
        "Conversation so far:\n"
        f"{history_text or '(no prior messages)'}\n\n"
        f"Homeowner: {message}\n\n"
        "Respond with a JSON object with exactly one key: "
        '{"reply": "string (plain language, conversational, 2-5 sentences, '
        'reference the actual numbers above when relevant)"}'
    )

    fallback = (
        "I'm having trouble reaching the advisor model right now, but based on the "
        f"current data, the {recommendation.get('recommended_scenario_id', 'moderate')} "
        "scenario looks like the best fit. Please try asking again in a moment."
    )

    try:
        text = await asyncio.to_thread(_call_gemini, prompt)
        result = _parse_json(text)
        reply = result.get("reply")
        if not reply:
            raise ValueError("Missing 'reply' key")
        return reply
    except Exception:
        logger.exception("chat_with_advisor: Gemini call failed, using fallback")
        return fallback


async def collect_data(listing_id: str) -> dict:
    """Step 1: gather the listing + local market data."""
    return await fetch_listing_data(listing_id)


async def analyze_market(data: dict) -> dict:
    """Step 2: ask Gemini for a market assessment."""
    prompt = (
        "Here is the listing and local market data as JSON:\n"
        f"{json.dumps(data, indent=2)}\n\n"
        "Provide a market assessment as a JSON object with exactly these keys:\n"
        "{\n"
        '  "demand_trend": "string describing local buyer demand",\n'
        '  "price_band_fit": "string assessing whether current price matches demand",\n'
        '  "key_risk": "string describing the biggest risk if no action taken",\n'
        '  "opportunity": "string describing the best available opportunity"\n'
        "}"
    )

    fallback = {
        "demand_trend": "Buyer demand in this neighborhood is soft, with inquiries well below typical levels for an actively marketed listing.",
        "price_band_fit": "The current list price sits above the neighborhood median, putting it out of step with realistic buyer demand.",
        "key_risk": "Continued time on market erodes buyer confidence and may signal deeper issues with the property.",
        "opportunity": "A price adjustment closer to recent comps could re-energize interest and attract qualified offers.",
    }

    try:
        text = await asyncio.to_thread(_call_gemini, prompt)
        result = _parse_json(text)
        for key in fallback:
            if key not in result:
                result[key] = fallback[key]
        return result
    except Exception:
        logger.exception("analyze_market: Gemini call failed, using fallback")
        return fallback


async def generate_scenarios(data: dict, assessment: dict) -> list:
    """Step 3: ask Gemini for 3 pricing scenarios."""
    prompt = (
        "Here is the listing and local market data as JSON:\n"
        f"{json.dumps(data, indent=2)}\n\n"
        "Here is the market assessment as JSON:\n"
        f"{json.dumps(assessment, indent=2)}\n\n"
        "Generate exactly 3 pricing scenarios as a JSON array. Each scenario object must have "
        "exactly these keys:\n"
        "{\n"
        '  "id": "aggressive" | "moderate" | "patient",\n'
        '  "label": "Aggressive" | "Moderate" | "Patient",\n'
        '  "recommended_price": integer,\n'
        '  "price_path": [{"week": int, "price": int}, ...] (12 weeks, week 0 through 11 or 1 through 12),\n'
        '  "estimated_days_to_sale": integer,\n'
        '  "equity_retained_pct": float (percentage of original value retained),\n'
        '  "incentives": ["string", ...] (e.g. "Offer closing cost assistance"),\n'
        '  "rationale": "string"\n'
        "}\n"
        "Respond with only the JSON array, nothing else."
    )

    original_price = data.get("original_price", 0)

    def _fallback_path(start_price: int, end_price: int) -> list:
        path = []
        for week in range(12):
            ratio = week / 11
            price = round(start_price + (end_price - start_price) * ratio)
            path.append({"week": week, "price": price})
        return path

    current_price = data.get("current_price", 0)

    fallback = [
        {
            "id": "aggressive",
            "label": "Aggressive",
            "recommended_price": round(current_price * 0.95),
            "price_path": _fallback_path(current_price, round(current_price * 0.95)),
            "estimated_days_to_sale": 21,
            "equity_retained_pct": round((current_price * 0.95 / original_price) * 100, 1) if original_price else 0,
            "incentives": ["Offer closing cost assistance", "Include home warranty"],
            "rationale": "A sharp price cut signals serious motivation and quickly attracts price-sensitive buyers.",
        },
        {
            "id": "moderate",
            "label": "Moderate",
            "recommended_price": round(current_price * 0.98),
            "price_path": _fallback_path(current_price, round(current_price * 0.98)),
            "estimated_days_to_sale": 45,
            "equity_retained_pct": round((current_price * 0.98 / original_price) * 100, 1) if original_price else 0,
            "incentives": ["Offer closing cost assistance"],
            "rationale": "A modest reduction keeps the listing competitive while preserving more equity.",
        },
        {
            "id": "patient",
            "label": "Patient",
            "recommended_price": current_price,
            "price_path": _fallback_path(current_price, current_price),
            "estimated_days_to_sale": 75,
            "equity_retained_pct": round((current_price / original_price) * 100, 1) if original_price else 0,
            "incentives": [],
            "rationale": "Holding the current price preserves maximum equity but risks continued stagnation.",
        },
    ]

    try:
        text = await asyncio.to_thread(_call_gemini, prompt)
        result = _parse_json(text)
        if not isinstance(result, list) or len(result) != 3:
            raise ValueError("Expected a JSON array of 3 scenarios")
        return result
    except Exception:
        logger.exception("generate_scenarios: Gemini call failed, using fallback")
        return fallback


async def check_fairness(scenarios: list, neighborhood_median: int, original_price: int) -> list:
    """Step 4: rule-based fairness checks. No Gemini call."""
    floor_price = neighborhood_median * FLOOR_RATIO

    updated = []
    for scenario in scenarios:
        scenario = dict(scenario)
        recommended_price = scenario.get("recommended_price", 0)

        discount_pct = 0.0
        if original_price:
            discount_pct = (original_price - recommended_price) / original_price * 100

        fairness_passed = True
        flag_reason = None

        if recommended_price < floor_price:
            fairness_passed = False
            flag_reason = (
                f"Recommended price (${recommended_price:,}) is below the fairness floor of "
                f"${floor_price:,.0f} ({FLOOR_RATIO * 100:.0f}% of the neighborhood median)."
            )
        elif discount_pct > MAX_DISCOUNT_PCT:
            fairness_passed = False
            flag_reason = (
                f"Discount of {discount_pct:.1f}% from the original price exceeds the "
                f"{MAX_DISCOUNT_PCT:.0f}% maximum discount cap."
            )

        scenario["fairness_passed"] = fairness_passed
        scenario["flag_reason"] = flag_reason
        updated.append(scenario)

    return updated


async def write_output(assessment: dict, scenarios: list, listing_data: dict) -> dict:
    """Step 5: ask Gemini to synthesize a final recommendation and alerts."""
    prompt = (
        "Here is the listing data as JSON:\n"
        f"{json.dumps(listing_data, indent=2)}\n\n"
        "Here is the market assessment as JSON:\n"
        f"{json.dumps(assessment, indent=2)}\n\n"
        "Here are the pricing scenarios (including fairness check results) as JSON:\n"
        f"{json.dumps(scenarios, indent=2)}\n\n"
        "Produce a final output JSON object with exactly these keys:\n"
        "{\n"
        '  "recommended_scenario_id": "aggressive" | "moderate" | "patient",\n'
        '  "confidence_score": integer (0-100),\n'
        '  "one_line_summary": "string",\n'
        '  "why_explanation": "string (2-3 plain language sentences)",\n'
        '  "alerts": [ { "severity": "info" | "warning" | "critical", "message": "string" } ]\n'
        "}\n"
        "Do not recommend a scenario where fairness_passed is false unless no other option exists. "
        "Respond with only the JSON object, nothing else."
    )

    fallback_recommended = "moderate"
    for s in scenarios:
        if s.get("fairness_passed", True):
            fallback_recommended = s.get("id", "moderate")
            break

    fallback = {
        "recommended_scenario_id": fallback_recommended,
        "confidence_score": 70,
        "one_line_summary": "A price adjustment is recommended to align this listing with current market demand.",
        "why_explanation": (
            "The home has been on the market for an extended period with limited buyer interest. "
            "A measured price adjustment aligns the listing more closely with recent comparable sales "
            "while staying within community fairness guardrails."
        ),
        "alerts": [
            {
                "severity": "warning",
                "message": f"This listing has been on the market for {listing_data.get('days_on_market', 'N/A')} days with {listing_data.get('price_cuts', 0)} price cuts.",
            }
        ],
    }

    try:
        text = await asyncio.to_thread(_call_gemini, prompt)
        result = _parse_json(text)
        for key in fallback:
            if key not in result:
                result[key] = fallback[key]
        return result
    except Exception:
        logger.exception("write_output: Gemini call failed, using fallback")
        return fallback
