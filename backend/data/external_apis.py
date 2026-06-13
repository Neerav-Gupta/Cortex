"""Thin async clients for the external data sources Cortex is grounded in.

- Census Geocoder (free, no key): turns a street address into county/state FIPS
  codes and basic geography.
- Census ACS5 (CENSUS_API_KEY): county-level housing, income, education and
  population stats used to derive neighborhood medians, vacancy rate, and
  proxies for school rating / walkability.
- FRED (FRED_API_KEY): the current 30-year mortgage rate.
- RentCast (RENTCAST_API_KEY): property value estimate, comparable sales, and
  active listing history (price cuts, days on market) when available. The
  RentCast free tier is heavily rate-limited, so callers should cache results
  per address and avoid repeat calls.

Every function raises on failure; callers are responsible for fallbacks.
"""

import logging
import os

import httpx

logger = logging.getLogger("cortex.external_apis")

HTTP_TIMEOUT = 10.0

_geocode_cache: dict[str, dict] = {}
_census_cache: dict[str, dict] = {}
_mortgage_rate_cache: dict[str, float] = {}


async def geocode_address(address: str) -> dict:
    """Resolve an address to state/county FIPS codes and land area via the
    free Census geocoder."""
    if address in _geocode_cache:
        return _geocode_cache[address]

    url = "https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress"
    params = {
        "address": address,
        "benchmark": "Public_AR_Current",
        "vintage": "Current_Current",
        "format": "json",
    }
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    matches = data.get("result", {}).get("addressMatches", [])
    if not matches:
        raise ValueError(f"Could not geocode address: {address}")

    match = matches[0]
    geographies = match["geographies"]
    county = geographies["Counties"][0]
    coordinates = match.get("coordinates", {})

    result = {
        "matched_address": match.get("matchedAddress", address),
        "state_fips": county["STATE"],
        "county_fips": county["COUNTY"],
        "county_name": county["NAME"],
        "county_land_area_sqm": float(county.get("AREALAND", 0)),
        "lat": coordinates.get("y"),
        "lon": coordinates.get("x"),
    }
    _geocode_cache[address] = result
    return result


async def get_census_county_stats(state_fips: str, county_fips: str) -> dict:
    """Fetch county-level ACS5 stats: median home value, vacancy rate,
    median rent, median income, population, and education attainment."""
    cache_key = f"{state_fips}-{county_fips}"
    if cache_key in _census_cache:
        return _census_cache[cache_key]

    api_key = os.environ.get("CENSUS_API_KEY", "")
    variables = [
        "B25077_001E",  # median home value
        "B25002_001E",  # total housing units
        "B25002_003E",  # vacant housing units
        "B25064_001E",  # median gross rent
        "B19013_001E",  # median household income
        "B01003_001E",  # total population
        "B15003_001E",  # population 25+ (education universe)
        "B15003_022E",  # bachelor's degree
        "B15003_023E",  # master's degree
        "B15003_024E",  # professional degree
        "B15003_025E",  # doctorate degree
    ]

    url = "https://api.census.gov/data/2022/acs/acs5"
    params = {
        "get": ",".join(variables),
        "for": f"county:{county_fips}",
        "in": f"state:{state_fips}",
        "key": api_key,
    }
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        rows = resp.json()

    header, values = rows[0], rows[1]
    record = dict(zip(header, values))

    total_units = float(record["B25002_001E"])
    vacant_units = float(record["B25002_003E"])
    vacancy_rate = (vacant_units / total_units * 100) if total_units else 0.0

    population_25_plus = float(record["B15003_001E"])
    bachelors_or_higher = sum(
        float(record[key]) for key in ("B15003_022E", "B15003_023E", "B15003_024E", "B15003_025E")
    )
    bachelor_pct = (bachelors_or_higher / population_25_plus * 100) if population_25_plus else 0.0

    result = {
        "median_home_value": float(record["B25077_001E"]),
        "vacancy_rate": round(vacancy_rate, 1),
        "median_rent": float(record["B25064_001E"]),
        "median_household_income": float(record["B19013_001E"]),
        "population": float(record["B01003_001E"]),
        "bachelor_degree_pct": round(bachelor_pct, 1),
    }
    _census_cache[cache_key] = result
    return result


async def get_mortgage_rate() -> float:
    """Fetch the latest 30-year fixed mortgage rate from FRED, cached for the
    lifetime of the process."""
    if "rate" in _mortgage_rate_cache:
        return _mortgage_rate_cache["rate"]

    api_key = os.environ.get("FRED_API_KEY", "")
    url = "https://api.stlouisfed.org/fred/series/observations"
    params = {
        "series_id": "MORTGAGE30US",
        "api_key": api_key,
        "file_type": "json",
        "sort_order": "desc",
        "limit": 1,
    }
    async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    rate = float(data["observations"][0]["value"])
    _mortgage_rate_cache["rate"] = rate
    return rate


async def get_rentcast_avm(address: str) -> dict | None:
    """Fetch RentCast's automated valuation + comparable sales for an
    address. Returns None if the API call fails (e.g. inactive
    subscription, rate limit, or no data for the address)."""
    api_key = os.environ.get("RENTCAST_API_KEY", "")
    url = "https://api.rentcast.io/v1/avm/value"
    headers = {"X-Api-Key": api_key, "accept": "application/json"}
    params = {"address": address}

    try:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            resp = await client.get(url, headers=headers, params=params)
            resp.raise_for_status()
            return resp.json()
    except Exception:
        logger.warning("RentCast AVM lookup failed for %s", address, exc_info=True)
        return None


async def search_addresses(query: str) -> list[dict]:
    """Return address suggestions for a partial query using the free
    OpenStreetMap Nominatim search API (no key required)."""
    query = query.strip()
    if len(query) < 3:
        return []

    url = "https://nominatim.openstreetmap.org/search"
    params = {
        "q": query,
        "format": "jsonv2",
        "addressdetails": 0,
        "limit": 5,
        "countrycodes": "us",
    }
    headers = {"User-Agent": "CortexPricingApp/1.0"}

    try:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            resp = await client.get(url, params=params, headers=headers)
            resp.raise_for_status()
            data = resp.json()
    except Exception:
        logger.warning("Nominatim address search failed for %r", query, exc_info=True)
        return []

    return [
        {
            "display_name": item["display_name"],
            "lat": float(item["lat"]),
            "lon": float(item["lon"]),
        }
        for item in data
    ]


async def get_rentcast_listing(address: str) -> dict | None:
    """Fetch RentCast's active/recent sale listing for an address, which may
    include price history and days on market. Returns None if unavailable."""
    api_key = os.environ.get("RENTCAST_API_KEY", "")
    url = "https://api.rentcast.io/v1/listings/sale"
    headers = {"X-Api-Key": api_key, "accept": "application/json"}
    params = {"address": address}

    try:
        async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
            resp = await client.get(url, headers=headers, params=params)
            resp.raise_for_status()
            data = resp.json()
            if isinstance(data, list) and data:
                return data[0]
            if isinstance(data, dict) and data:
                return data
            return None
    except Exception:
        logger.warning("RentCast listing lookup failed for %s", address, exc_info=True)
        return None
