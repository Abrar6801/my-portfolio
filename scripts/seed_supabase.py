#!/usr/bin/env python3
"""Seed (or re-sync) the Supabase `content` table from content.json.

Usage:
    python scripts/seed_supabase.py https://YOUR-REF.supabase.co SERVICE_ROLE_KEY

The service_role key bypasses RLS, so this script is for YOUR terminal
only — never commit the key, never ship it client-side. Get it from
Supabase Dashboard -> Project Settings -> API -> service_role.

Stdlib only; no pip installs needed.
"""
import json
import sys
import urllib.request
from pathlib import Path

def main() -> int:
    if len(sys.argv) != 3:
        print(__doc__)
        return 1
    url, service_key = sys.argv[1].rstrip("/"), sys.argv[2]

    content_path = Path(__file__).resolve().parent.parent / "content.json"
    content = json.loads(content_path.read_text(encoding="utf-8"))

    rows = [{"key": key, "data": data} for key, data in content.items()]
    body = json.dumps(rows).encode("utf-8")

    req = urllib.request.Request(
        f"{url}/rest/v1/content",
        data=body,
        method="POST",
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Content-Type": "application/json",
            # upsert: makes the script safe to re-run after editing content.json
            "Prefer": "resolution=merge-duplicates",
        },
    )
    with urllib.request.urlopen(req) as resp:
        print(f"Seeded {len(rows)} sections -> HTTP {resp.status}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
