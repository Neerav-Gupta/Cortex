"""API routes for listing data, refresh, overrides, alerts, and guardrails."""

import asyncio

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from agent.graph import (
    clear_chat_history,
    clear_output,
    get_chat_history,
    get_latest_output,
    run_agent,
    send_chat_message,
    set_override,
)
from agent.guardrails import summarize_guardrails
from data import external_apis
from data.fetchers import REGISTRY, delete_listing, register_listing, update_listing_facts

router = APIRouter(prefix="/api")


class PricePoint(BaseModel):
    week: int
    price: int


class Scenario(BaseModel):
    id: str
    label: str
    recommended_price: int
    price_path: list[PricePoint]
    estimated_days_to_sale: int
    equity_retained_pct: float
    incentives: list[str]
    rationale: str
    fairness_passed: bool
    flag_reason: str | None = None


class MarketAssessment(BaseModel):
    demand_trend: str
    price_band_fit: str
    key_risk: str
    opportunity: str


class Alert(BaseModel):
    severity: str
    message: str


class Recommendation(BaseModel):
    recommended_scenario_id: str
    confidence_score: int
    one_line_summary: str
    why_explanation: str
    alerts: list[Alert]


class ListingData(BaseModel):
    listing_id: str
    address: str
    lat: float | None = None
    lon: float | None = None
    county_name: str
    current_price: int
    original_price: int
    days_on_market: int
    price_cuts: int
    price_cut_history: list[int]
    neighborhood_median: int
    mortgage_rate: float
    local_vacancy_rate: float
    median_rent: int
    median_household_income: int
    school_rating: int
    walk_score: int


class Override(BaseModel):
    floor_price: int
    locked_scenario_id: str
    advisor_note: str


class AgentOutput(BaseModel):
    listing: ListingData
    assessment: MarketAssessment
    scenarios: list[Scenario]
    recommendation: Recommendation
    last_updated: str
    override: Override | None = None


class GuardrailConfig(BaseModel):
    floor_ratio: float
    max_discount_pct: float


class StatusResponse(BaseModel):
    status: str


class CreateListingRequest(BaseModel):
    address: str
    current_price: int
    original_price: int | None = None
    days_on_market: int = 0


class ListingSummary(BaseModel):
    listing_id: str
    address: str
    lat: float | None = None
    lon: float | None = None
    current_price: int
    neighborhood_median: int
    days_on_market: int
    recommended_scenario_id: str
    one_line_summary: str
    last_updated: str


class AddressSuggestion(BaseModel):
    display_name: str
    lat: float
    lon: float


class UpdateListingRequest(BaseModel):
    price_cut_history: list[int] | None = None
    days_on_market: int | None = None


class ChatMessageRequest(BaseModel):
    message: str


class ChatTurn(BaseModel):
    role: str
    content: str


class ChatResponse(BaseModel):
    reply: str
    history: list[ChatTurn]


def _validate_listing_id(listing_id: str) -> None:
    if listing_id not in REGISTRY:
        raise HTTPException(status_code=404, detail=f"Unknown listing id: {listing_id}")


@router.get("/geocode/suggest", response_model=list[AddressSuggestion])
async def geocode_suggest(q: str = ""):
    return await external_apis.search_addresses(q)


@router.post("/listings", response_model=AgentOutput)
async def create_listing(payload: CreateListingRequest):
    address = payload.address.strip()
    if not address:
        raise HTTPException(status_code=400, detail="Address is required")
    if payload.current_price <= 0:
        raise HTTPException(status_code=400, detail="Current price must be greater than 0")

    listing_id = await register_listing(
        address,
        current_price=payload.current_price,
        original_price=payload.original_price,
        days_on_market=payload.days_on_market,
    )
    try:
        return await run_agent(listing_id)
    except Exception as exc:
        delete_listing(listing_id)
        raise HTTPException(status_code=400, detail=f"Could not analyze address: {exc}") from exc


@router.delete("/listings/{listing_id}", response_model=StatusResponse)
async def remove_listing(listing_id: str):
    _validate_listing_id(listing_id)
    delete_listing(listing_id)
    clear_output(listing_id)
    return {"status": "listing deleted"}


@router.get("/listings", response_model=list[ListingSummary])
async def list_listings():
    summaries = []
    for listing_id in REGISTRY:
        output = get_latest_output(listing_id)
        if output is None:
            continue
        listing = output["listing"]
        recommendation = output["recommendation"]
        summaries.append(
            {
                "listing_id": listing_id,
                "address": listing["address"],
                "lat": listing.get("lat"),
                "lon": listing.get("lon"),
                "current_price": listing["current_price"],
                "neighborhood_median": listing["neighborhood_median"],
                "days_on_market": listing["days_on_market"],
                "recommended_scenario_id": recommendation["recommended_scenario_id"],
                "one_line_summary": recommendation["one_line_summary"],
                "last_updated": output["last_updated"],
            }
        )
    return summaries


@router.get("/listing/{listing_id}", response_model=AgentOutput)
async def get_listing(listing_id: str):
    _validate_listing_id(listing_id)
    output = get_latest_output(listing_id)
    if output is None:
        output = await run_agent(listing_id)
    return output


@router.patch("/listing/{listing_id}", response_model=AgentOutput)
async def update_listing(listing_id: str, payload: UpdateListingRequest):
    _validate_listing_id(listing_id)
    if payload.price_cut_history is not None and any(p <= 0 for p in payload.price_cut_history):
        raise HTTPException(status_code=400, detail="Prices must be greater than 0")
    if payload.days_on_market is not None and payload.days_on_market < 0:
        raise HTTPException(status_code=400, detail="Days on market cannot be negative")

    try:
        update_listing_facts(
            listing_id,
            price_cut_history=payload.price_cut_history,
            days_on_market=payload.days_on_market,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return await run_agent(listing_id)


@router.get("/listing/{listing_id}/chat", response_model=list[ChatTurn])
async def get_chat(listing_id: str):
    _validate_listing_id(listing_id)
    return get_chat_history(listing_id)


@router.delete("/listing/{listing_id}/chat", response_model=StatusResponse)
async def clear_chat(listing_id: str):
    _validate_listing_id(listing_id)
    clear_chat_history(listing_id)
    return {"status": "chat cleared"}


@router.post("/listing/{listing_id}/chat", response_model=ChatResponse)
async def post_chat(listing_id: str, payload: ChatMessageRequest):
    _validate_listing_id(listing_id)
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    reply = await send_chat_message(listing_id, message)
    return {"reply": reply, "history": get_chat_history(listing_id)}


@router.post("/listing/{listing_id}/refresh", response_model=StatusResponse)
async def refresh_listing(listing_id: str):
    _validate_listing_id(listing_id)
    asyncio.create_task(run_agent(listing_id))
    return {"status": "refresh triggered"}


@router.post("/listing/{listing_id}/override", response_model=StatusResponse)
async def post_override(listing_id: str, override: Override):
    _validate_listing_id(listing_id)
    set_override(listing_id, override.model_dump())
    return {"status": "override saved"}


@router.get("/listing/{listing_id}/alerts", response_model=list[Alert])
async def get_alerts(listing_id: str):
    _validate_listing_id(listing_id)
    output = get_latest_output(listing_id)
    if output is None:
        output = await run_agent(listing_id)
    return output["recommendation"]["alerts"]


@router.get("/guardrails", response_model=GuardrailConfig)
async def get_guardrails():
    return summarize_guardrails()
