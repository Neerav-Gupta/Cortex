"""Cortex FastAPI application entrypoint."""

import os
from contextlib import asynccontextmanager

import google.generativeai as genai
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))

from agent.graph import LATEST_OUTPUT, run_agent  # noqa: E402
from data.fetchers import REGISTRY  # noqa: E402
from routers.listing import router as listing_router  # noqa: E402
from storage import load_state  # noqa: E402


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_state()
    for listing_id in REGISTRY:
        if listing_id not in LATEST_OUTPUT:
            await run_agent(listing_id)
    yield


app = FastAPI(title="Cortex API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(listing_router)


@app.get("/")
async def root():
    return {"status": "Cortex API running"}
