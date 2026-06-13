"""Fairness guardrail thresholds shared by the agent pipeline and API."""

FLOOR_RATIO = 0.85
MAX_DISCOUNT_PCT = 12.0


def summarize_guardrails() -> dict:
    """Return guardrail thresholds for display in the frontend."""
    return {
        "floor_ratio": FLOOR_RATIO,
        "max_discount_pct": MAX_DISCOUNT_PCT,
    }
