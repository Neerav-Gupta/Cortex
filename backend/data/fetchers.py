"""Data fetching layer.

A listing combines two kinds of information:

- Facts only the homeowner/advisor knows: the current asking price, the
  original list price, and how long it's been on the market. These are
  supplied when the listing is registered.
- Live market context pulled from real APIs: geocoded location, county-level
  median home value / vacancy rate / rent / income (Census ACS5), the current
  30-year mortgage rate (FRED), and education/density-based proxies for
  school quality and walkability.

Results are cached per listing id so repeat fetches and AI runs don't repeat
external API calls.
"""

import logging
import re

from data import external_apis
from storage import save_state

logger = logging.getLogger("cortex.fetchers")

# listing_id -> {"address", "current_price", "original_price", "days_on_market"}
REGISTRY: dict[str, dict] = {}

# listing_id -> fully composed listing dict, including live market data.
_listing_cache: dict[str, dict] = {}

DEFAULT_MORTGAGE_RATE = 6.5


def slugify(address: str) -> str:
    """Turn an address into a stable, URL-safe listing id."""
    slug = re.sub(r"[^a-z0-9]+", "-", address.lower()).strip("-")
    return slug or "listing"


async def register_listing(
    address: str,
    current_price: int,
    original_price: int | None = None,
    days_on_market: int = 0,
) -> str:
    """Register a listing for analysis and return its listing id.

    If this listing id has been fetched before, its cached market data is
    cleared so the next fetch reflects the updated facts.
    """
    listing_id = slugify(address)
    original = original_price if original_price is not None else current_price
    if original == current_price:
        price_cut_history = [current_price]
    else:
        price_cut_history = [original, current_price]
    REGISTRY[listing_id] = {
        "address": address,
        "price_cut_history": price_cut_history,
        "days_on_market": days_on_market,
    }
    _listing_cache.pop(listing_id, None)
    save_state()
    return listing_id


def update_listing_facts(
    listing_id: str,
    price_cut_history: list[int] | None = None,
    days_on_market: int | None = None,
) -> None:
    """Update the homeowner-provided facts for a listing and clear its cache
    so the next fetch reflects the updated facts."""
    facts = REGISTRY.get(listing_id)
    if facts is None:
        raise KeyError(f"Unknown listing id: {listing_id}")

    if price_cut_history is not None:
        if not price_cut_history:
            raise ValueError("price_cut_history must contain at least one price")
        facts["price_cut_history"] = price_cut_history
    if days_on_market is not None:
        facts["days_on_market"] = days_on_market

    _listing_cache.pop(listing_id, None)
    save_state()


def delete_listing(listing_id: str) -> None:
    REGISTRY.pop(listing_id, None)
    _listing_cache.pop(listing_id, None)
    save_state()


def known_listing_ids() -> list[str]:
    return list(REGISTRY.keys())


async def fetch_listing_data(listing_id: str) -> dict:
    """Fetch (or return cached) combined listing + local market data for a
    given listing id."""
    if listing_id in _listing_cache:
        return _listing_cache[listing_id]

    facts = REGISTRY.get(listing_id)
    if facts is None:
        raise KeyError(f"Unknown listing id: {listing_id}")

    listing = await _build_listing(listing_id, facts)
    _listing_cache[listing_id] = listing
    return listing


async def _build_listing(listing_id: str, facts: dict) -> dict:
    address = facts["address"]
    geo = await external_apis.geocode_address(address)
    census = await external_apis.get_census_county_stats(geo["state_fips"], geo["county_fips"])

    try:
        mortgage_rate = await external_apis.get_mortgage_rate()
    except Exception:
        logger.warning("FRED mortgage rate lookup failed, using default", exc_info=True)
        mortgage_rate = DEFAULT_MORTGAGE_RATE

    # RentCast AVM/listing data is used automatically when the subscription
    # is active; current_price/original_price stay as the homeowner-provided
    # facts unless RentCast has a live listing for this address.
    avm = await external_apis.get_rentcast_avm(address)
    rc_listing = await external_apis.get_rentcast_listing(address)

    neighborhood_median = round(census["median_home_value"])
    if avm and avm.get("price"):
        neighborhood_median = round(avm["price"])

    # Education-attainment proxy for school quality, scaled to a 1-10 rating.
    school_rating = max(1, min(10, round(1 + census["bachelor_degree_pct"] / 100 * 9)))

    # Population-density proxy for walkability, scaled to 0-100.
    land_area_sqkm = geo["county_land_area_sqm"] / 1_000_000 if geo["county_land_area_sqm"] else 0
    density = (census["population"] / land_area_sqkm) if land_area_sqkm else 0
    walk_score = max(0, min(100, round(density / 100)))

    days_on_market = facts["days_on_market"]
    price_cut_history = list(facts["price_cut_history"])
    original_price = price_cut_history[0]
    current_price = price_cut_history[-1]
    price_cuts = max(0, len(price_cut_history) - 1)

    # Override with RentCast listing history when available (subscription permitting).
    if rc_listing:
        if rc_listing.get("price"):
            current_price = round(rc_listing["price"])
        if rc_listing.get("daysOnMarket") is not None:
            days_on_market = int(rc_listing["daysOnMarket"])
        history = rc_listing.get("history")
        if isinstance(history, dict) and history:
            prices = [round(entry["price"]) for entry in history.values() if entry.get("price")]
            if prices:
                price_cut_history = prices
                price_cuts = max(0, len(prices) - 1)
                original_price = prices[0]
                current_price = prices[-1]

    return {
        "listing_id": listing_id,
        "address": geo["matched_address"],
        "lat": geo["lat"],
        "lon": geo["lon"],
        "county_name": geo["county_name"],
        "current_price": current_price,
        "original_price": original_price,
        "days_on_market": days_on_market,
        "price_cuts": price_cuts,
        "price_cut_history": price_cut_history,
        "neighborhood_median": neighborhood_median,
        "mortgage_rate": round(mortgage_rate, 2),
        "local_vacancy_rate": census["vacancy_rate"],
        "median_rent": round(census["median_rent"]),
        "median_household_income": round(census["median_household_income"]),
        "school_rating": school_rating,
        "walk_score": walk_score,
    }
