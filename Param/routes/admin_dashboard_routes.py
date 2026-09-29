"""Admin dashboard — live GPU usage + per-user activity metadata.

Both endpoints are admin-only and read-only. Neither persists anything new:
GPU usage is an uncached on-demand hardware probe (see
services/hwfit/hardware.py::get_live_gpu_usage), and user activity is a pure
aggregation over the existing sessions/chat_messages tables — no raw message
content is ever returned.

URL shape: GET /api/admin/gpu-usage, GET /api/admin/user-activity
"""

import logging

from fastapi import APIRouter, Request
from sqlalchemy import func

from core.middleware import require_admin
from core.database import SessionLocal, Session as DbSession, ChatMessage as DbChatMessage

logger = logging.getLogger(__name__)


def _active_models_for_gpu(session_manager):
    """Best-effort correlation of in-flight requests with local GPU load.

    Not proof the GPU utilization shown is caused specifically by these
    models — just "a request to a local endpoint for model X is in flight
    right now." No per-process GPU attribution is available without much
    deeper instrumentation.
    """
    try:
        from routes.chat_routes import get_active_streaming_session_ids
        from src.model_context import is_local_endpoint
    except Exception:
        return []

    models = []
    for session_id in get_active_streaming_session_ids():
        try:
            sess = session_manager.get_session(session_id)
        except Exception:
            continue
        if not sess or not sess.model:
            continue
        if is_local_endpoint(sess.endpoint_url or ""):
            models.append(sess.model)
    return sorted(set(models))


def _get_user_activity(db, auth_manager):
    msg_rows = (
        db.query(
            DbSession.owner,
            func.count(DbChatMessage.id),
            func.min(DbChatMessage.timestamp),
            func.max(DbChatMessage.timestamp),
        )
        .join(DbChatMessage, DbChatMessage.session_id == DbSession.id)
        .group_by(DbSession.owner)
        .all()
    )
    session_rows = (
        db.query(
            DbSession.owner,
            func.count(DbSession.id),
            func.sum(DbSession.total_input_tokens),
            func.sum(DbSession.total_output_tokens),
        )
        .group_by(DbSession.owner)
        .all()
    )
    model_rows = (
        db.query(DbSession.owner, DbSession.model, func.count(DbSession.id))
        .group_by(DbSession.owner, DbSession.model)
        .all()
    )

    def _key(owner):
        return owner if owner else "shared/legacy"

    by_owner = {}

    def _bucket(owner):
        key = _key(owner)
        return by_owner.setdefault(key, {
            "username": key,
            "is_admin": False,
            "session_count": 0,
            "message_count": 0,
            "input_tokens": 0,
            "output_tokens": 0,
            "first_active": None,
            "last_active": None,
            "models_used": [],
        })

    for owner, count, first_ts, last_ts in msg_rows:
        b = _bucket(owner)
        b["message_count"] = count or 0
        b["first_active"] = first_ts.isoformat() if first_ts else None
        b["last_active"] = last_ts.isoformat() if last_ts else None

    for owner, session_count, input_tokens, output_tokens in session_rows:
        b = _bucket(owner)
        b["session_count"] = session_count or 0
        b["input_tokens"] = int(input_tokens or 0)
        b["output_tokens"] = int(output_tokens or 0)

    for owner, model, session_count in model_rows:
        if not model:
            continue
        b = _bucket(owner)
        b["models_used"].append({"model": model, "session_count": session_count or 0})

    # Left-merge with the auth store so zero-activity users still appear.
    try:
        for u in auth_manager.list_users():
            b = _bucket(u["username"])
            b["is_admin"] = bool(u.get("is_admin"))
    except Exception:
        logger.exception("Failed to list users for admin user-activity dashboard")

    users = sorted(by_owner.values(), key=lambda r: r["last_active"] or "", reverse=True)
    return users


def setup_admin_dashboard_routes(session_manager):
    router = APIRouter(prefix="/api/admin")

    @router.get("/gpu-usage")
    def get_gpu_usage(request: Request, host: str = "", ssh_port: str = "", platform: str = ""):
        require_admin(request)
        from services.hwfit.hardware import get_live_gpu_usage

        data = get_live_gpu_usage(host=host, ssh_port=ssh_port, platform=platform)
        if data.get("live_supported") and not host:
            active_models = _active_models_for_gpu(session_manager)
            if active_models:
                for gpu in data.get("gpus", []):
                    gpu["active_models"] = active_models
        return data

    @router.get("/user-activity")
    def get_user_activity_route(request: Request):
        require_admin(request)
        auth_manager = request.app.state.auth_manager
        db = SessionLocal()
        try:
            return {"users": _get_user_activity(db, auth_manager)}
        finally:
            db.close()

    return router
