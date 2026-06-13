"""Agent orchestrator: runs the pipeline nodes in sequence and caches results."""

from datetime import datetime, timezone

from agent.nodes import (
    analyze_market,
    chat_with_advisor,
    check_fairness,
    collect_data,
    generate_scenarios,
    write_output,
)
from storage import save_state

# Module-level in-memory store of the latest agent output per listing id.
LATEST_OUTPUT: dict[str, dict] = {}

# Module-level in-memory store of advisor overrides per listing id.
OVERRIDES: dict[str, dict] = {}

# Module-level in-memory store of chat conversation history per listing id.
# Each entry is {"role": "user" | "assistant", "content": str}.
CHAT_HISTORY: dict[str, list[dict]] = {}


async def run_agent(listing_id: str) -> dict:
    """Run the full agent pipeline for a listing and cache the result."""
    listing = await collect_data(listing_id)
    assessment = await analyze_market(listing)
    scenarios = await generate_scenarios(listing, assessment)
    scenarios = await check_fairness(
        scenarios, listing["neighborhood_median"], listing["original_price"]
    )
    recommendation = await write_output(assessment, scenarios, listing)

    output = {
        "listing": listing,
        "assessment": assessment,
        "scenarios": scenarios,
        "recommendation": recommendation,
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }

    override = OVERRIDES.get(listing_id)
    if override:
        output["override"] = override

    LATEST_OUTPUT[listing_id] = output
    save_state()
    return output


def get_latest_output(listing_id: str) -> dict | None:
    """Return the cached agent output for a listing, if any."""
    return LATEST_OUTPUT.get(listing_id)


def set_override(listing_id: str, override: dict) -> None:
    """Store an advisor override and merge it into the cached output."""
    OVERRIDES[listing_id] = override
    if listing_id in LATEST_OUTPUT:
        LATEST_OUTPUT[listing_id]["override"] = override
    save_state()


def clear_output(listing_id: str) -> None:
    """Remove cached agent output, overrides, and chat history for a listing."""
    LATEST_OUTPUT.pop(listing_id, None)
    OVERRIDES.pop(listing_id, None)
    CHAT_HISTORY.pop(listing_id, None)
    save_state()


def get_chat_history(listing_id: str) -> list[dict]:
    """Return the chat history for a listing (empty list if none yet)."""
    return CHAT_HISTORY.get(listing_id, [])


async def send_chat_message(listing_id: str, message: str) -> str:
    """Send a homeowner message to the AI advisor and return its reply,
    persisting both turns in the listing's conversation history."""
    output = get_latest_output(listing_id)
    if output is None:
        output = await run_agent(listing_id)

    history = CHAT_HISTORY.setdefault(listing_id, [])
    reply = await chat_with_advisor(
        output["listing"],
        output["assessment"],
        output["scenarios"],
        output["recommendation"],
        history,
        message,
    )

    history.append({"role": "user", "content": message})
    history.append({"role": "assistant", "content": reply})
    save_state()
    return reply
