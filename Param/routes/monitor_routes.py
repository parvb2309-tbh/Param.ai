"""Read-only API exposing the in-memory integrity/network monitor log."""
from fastapi import APIRouter, Query

from src.integrity_monitor import monitor


def setup_monitor_routes():
    router = APIRouter(prefix="/api/monitor", tags=["monitor"])

    @router.get("/events")
    async def get_events(since_seq: int = Query(-1, ge=-1)):
        events = monitor.events_since(since_seq)
        chain = monitor.verify_chain()
        return {"events": events, "chain": chain}

    return router
