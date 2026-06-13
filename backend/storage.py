"""JSON-file persistence so listings and AI results survive backend restarts.

Saving the in-memory state to disk means the agent pipeline does not need to
be re-run (and re-spend AI credits) just because the server reloaded.
"""

import json
import logging
import os

logger = logging.getLogger("cortex.storage")

STORE_PATH = os.path.join(os.path.dirname(__file__), "data_store.json")


def save_state() -> None:
    from agent.graph import CHAT_HISTORY, LATEST_OUTPUT, OVERRIDES
    from data.fetchers import REGISTRY, _listing_cache

    state = {
        "registry": REGISTRY,
        "listing_cache": _listing_cache,
        "latest_output": LATEST_OUTPUT,
        "overrides": OVERRIDES,
        "chat_history": CHAT_HISTORY,
    }
    try:
        with open(STORE_PATH, "w") as f:
            json.dump(state, f)
    except Exception:
        logger.exception("Failed to save state to %s", STORE_PATH)


def load_state() -> None:
    from agent.graph import CHAT_HISTORY, LATEST_OUTPUT, OVERRIDES
    from data.fetchers import REGISTRY, _listing_cache

    if not os.path.exists(STORE_PATH):
        return

    try:
        with open(STORE_PATH) as f:
            state = json.load(f)
    except Exception:
        logger.exception("Failed to load state from %s", STORE_PATH)
        return

    REGISTRY.update(state.get("registry", {}))
    _listing_cache.update(state.get("listing_cache", {}))
    LATEST_OUTPUT.update(state.get("latest_output", {}))
    OVERRIDES.update(state.get("overrides", {}))
    CHAT_HISTORY.update(state.get("chat_history", {}))
