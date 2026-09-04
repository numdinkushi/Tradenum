from __future__ import annotations

import os
from functools import lru_cache

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from tradenum.agent import TradeNumAgent


@lru_cache
def get_agent() -> TradeNumAgent:
    return TradeNumAgent()


def _cors_origins() -> list[str]:
    raw = os.environ.get("TRADENUM_CORS_ORIGINS", "")
    defaults = ["http://localhost:3000", "http://127.0.0.1:3000"]
    extra = [o.strip() for o in raw.split(",") if o.strip()]
    return defaults + extra


def _cors_origin_regex() -> str | None:
    raw = os.environ.get("TRADENUM_CORS_ORIGIN_REGEX", "").strip()
    if raw:
        return raw
    return r"https://.*\.vercel\.app"


app = FastAPI(title="TradeNum", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins(),
    allow_origin_regex=_cors_origin_regex(),
    allow_methods=["*"],
    allow_headers=["*"],
)


class ConsiderBody(BaseModel):
    symbol: str
    execute: bool = False


class ScanBody(BaseModel):
    execute: bool = False


class SendBody(BaseModel):
    ticket_id: str
    override: bool = False


@app.exception_handler(Exception)
async def unhandled(_request: Request, exc: Exception) -> JSONResponse:
    if isinstance(exc, HTTPException):
        return JSONResponse({"detail": exc.detail}, status_code=exc.status_code)
    return JSONResponse({"error": type(exc).__name__, "detail": str(exc)}, status_code=500)


@app.get("/api/health")
def health() -> dict:
    return {"ok": True}


@app.get("/api/state")
def state() -> dict:
    return get_agent().snapshot()


@app.post("/api/tickets/consider")
def consider(body: ConsiderBody) -> dict:
    ticket = get_agent().consider(body.symbol.upper(), execute=body.execute)
    return {"ticket": None if ticket is None else ticket.model_dump(mode="json")}


@app.post("/api/tickets/send")
def send(body: SendBody) -> dict:
    try:
        ticket = get_agent().send(body.ticket_id, override=body.override)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"ticket": ticket.model_dump(mode="json"), "state": get_agent().snapshot()}


@app.post("/api/scan")
def scan(body: ScanBody) -> dict:
    tickets = get_agent().scan_once(execute=body.execute)
    return {"ids": [t.id for t in tickets], "state": get_agent().snapshot()}


@app.post("/api/supervise")
def supervise() -> dict:
    tickets = get_agent().supervise_open()
    return {"ids": [t.id for t in tickets], "state": get_agent().snapshot()}


@app.get("/api/chart/{symbol}")
def chart(symbol: str) -> dict:
    return get_agent().chart(symbol)


def main() -> None:
    import os

    import uvicorn

    port = int(os.environ.get("PORT", "8000"))
    reload = os.environ.get("TRADENUM_RELOAD", "").lower() in ("1", "true", "yes")
    uvicorn.run("tradenum.api:app", host="0.0.0.0", port=port, reload=reload)
