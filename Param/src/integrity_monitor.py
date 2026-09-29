"""In-memory, hash-chained action/network log for Param.

Every notable action inside Param (chat messages sent, outbound network
calls, tool executions, model switches, settings changes) is appended to a
single append-only, in-process log. Each entry embeds the hash of the entry
before it, so the whole log forms a hash chain: recomputing the chain from
entry zero either reproduces the last recorded hash exactly, or reveals that
something in between was altered or dropped. Nothing is written to disk or a
database — the log lives only for the lifetime of the running process, which
is enough to give the UI a live, tamper-evident view of what the app is
doing.
"""
from __future__ import annotations

import hashlib
import json
import re
import threading
import time
from collections import deque
from typing import Any, Deque, Dict, List, Optional
from urllib.parse import urlparse

_MAX_ENTRIES = 5000

_SECRET_PATTERNS = [
    re.compile(r"sk-[A-Za-z0-9]{10,}"),
    re.compile(r"Bearer\s+[A-Za-z0-9._-]{16,}"),
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"\b[A-Fa-f0-9]{40,}\b"),
]

_LARGE_PAYLOAD_BYTES = 5 * 1024 * 1024

GENESIS_HASH = "0" * 64


def _hash_entry(prev_hash: str, seq: int, ts: float, event_type: str, detail: Dict[str, Any]) -> str:
    payload = json.dumps(
        {"prev": prev_hash, "seq": seq, "ts": ts, "type": event_type, "detail": detail},
        sort_keys=True,
        default=str,
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def _detect_flag(event_type: str, detail: Dict[str, Any], allowed_hosts: Optional[set]) -> Optional[str]:
    if event_type == "network_call":
        host = detail.get("host")
        if host and allowed_hosts is not None and allowed_hosts and host not in allowed_hosts:
            return f"unrecognized host: {host}"
        size = detail.get("bytes")
        if isinstance(size, (int, float)) and size > _LARGE_PAYLOAD_BYTES:
            return f"unusually large transfer: {int(size)} bytes"

    blob = json.dumps(detail, default=str)
    for pattern in _SECRET_PATTERNS:
        if pattern.search(blob):
            return "possible credential/secret in payload"
    return None


class IntegrityMonitor:
    """Process-wide singleton. Thread-safe append + read."""

    def __init__(self, max_entries: int = _MAX_ENTRIES):
        self._lock = threading.Lock()
        self._entries: Deque[Dict[str, Any]] = deque(maxlen=max_entries)
        self._seq = 0
        self._last_hash = GENESIS_HASH
        self._known_hosts: set = set()

    def note_known_host(self, host: str) -> None:
        if host:
            self._known_hosts.add(host)

    def record(self, event_type: str, detail: Optional[Dict[str, Any]] = None, actor: str = "system") -> Dict[str, Any]:
        detail = detail or {}
        host = detail.get("host") or detail.get("url")
        if host and event_type == "network_call":
            try:
                parsed = urlparse(host if "://" in host else f"//{host}")
                host = parsed.hostname or host
                detail = {**detail, "host": host}
            except Exception:
                pass

        with self._lock:
            seq = self._seq
            ts = time.time()
            prev_hash = self._last_hash
            entry_hash = _hash_entry(prev_hash, seq, ts, event_type, detail)
            flag = _detect_flag(event_type, detail, self._known_hosts if event_type == "network_call" else None)
            entry = {
                "seq": seq,
                "ts": ts,
                "actor": actor,
                "type": event_type,
                "detail": detail,
                "prev_hash": prev_hash,
                "hash": entry_hash,
                "flagged": bool(flag),
                "flag_reason": flag,
            }
            self._entries.append(entry)
            self._seq += 1
            self._last_hash = entry_hash
            if event_type == "network_call" and host:
                self._known_hosts.add(host)
            return entry

    def events_since(self, since_seq: int = -1) -> List[Dict[str, Any]]:
        with self._lock:
            return [e for e in self._entries if e["seq"] > since_seq]

    def verify_chain(self) -> Dict[str, Any]:
        with self._lock:
            entries = list(self._entries)

        prev_hash = entries[0]["prev_hash"] if entries else GENESIS_HASH
        valid = True
        for entry in entries:
            expected = _hash_entry(prev_hash, entry["seq"], entry["ts"], entry["type"], entry["detail"])
            if expected != entry["hash"]:
                valid = False
                break
            prev_hash = entry["hash"]

        return {
            "valid": valid,
            "count": len(entries),
            "last_hash": prev_hash if entries else GENESIS_HASH,
            "flagged_count": sum(1 for e in entries if e["flagged"]),
        }


monitor = IntegrityMonitor()
