#!/usr/bin/env python3
"""Build the Interrogation Room's retrieval index from content.json.

Chunks the case file into documents, embeds each chunk with Voyage AI,
and replaces the `documents` table in Supabase. Re-run whenever content
changes (the admin panel's content edits do NOT rebuild this index).

Usage:
    python scripts/build_index.py \
        https://YOUR-REF.supabase.co SERVICE_ROLE_KEY VOYAGE_API_KEY

Environment overrides: EMBED_MODEL (default voyage-3.5-lite — must match
the dimension in supabase/rag-schema.sql and the serverless function).

Stdlib only; no pip installs needed.
"""
import json
import os
import sys
import urllib.request
from pathlib import Path

EMBED_MODEL = os.environ.get("EMBED_MODEL", "voyage-3.5-lite")


def post_json(url: str, headers: dict, payload, method: str = "POST"):
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode("utf-8") if payload is not None else None,
        method=method,
        headers={"Content-Type": "application/json", **headers},
    )
    with urllib.request.urlopen(req) as resp:
        body = resp.read()
        return json.loads(body) if body else None


def build_documents(content: dict) -> list[dict]:
    """One retrieval chunk per logical case-file item, each with the
    citation label and board anchor the UI shows to visitors."""
    docs: list[dict] = []

    def add(source_key: str, label: str, anchor: str, text: str) -> None:
        text = " ".join(text.split())
        if text:
            docs.append({"source_key": source_key, "label": label,
                         "anchor": anchor, "content": text})

    p = content.get("profile", {})
    facts = " · ".join(f"{d['label']}: {d['value']}" for d in p.get("dossier", []))
    add("profile", "SUBJECT PROFILE", "#about",
        f"Subject: {' '.join(p.get('name', []))}. {p.get('occupation', '')}. "
        f"{p.get('bio', '')} Modus operandi: {p.get('modusOperandi', '')} {facts}")

    sk = content.get("skills", {})
    for card in sk.get("cards", []):
        add("skills", "CAPABILITY SHEET", "#skills",
            f"Capability: {card['label']} rated {card['score']}/10. "
            f"Skills: {', '.join(card.get('pills', []))}.")
    steps = "; ".join(f"{s['title']} ({s['tech']}): {s['note']}"
                      for s in sk.get("methodology", []))
    add("skills", "RETRIEVAL METHODOLOGY", "#skills",
        f"His RAG / retrieval pipeline methodology: {steps}")

    for note in content.get("philosophy", []):
        add("philosophy", "PSYCH PROFILE", "#philosophy",
            f"Engineering philosophy {note['title']}: {note['body']}")

    for i, job in enumerate(content.get("experience", []), start=1):
        add("experience", f"SIGHTING №{i:02d}", "#experience",
            f"Work experience: {job['role']} at {job['company']} "
            f"({job['dates']}, {job.get('location', '')}). "
            + " ".join(job.get("bullets", [])))

    pr = content.get("projects", {})
    for proj in pr.get("major", []):
        metrics = "; ".join(
            f"{m.get('static', m.get('value'))}{m.get('suffix', '')} {m['label']}"
            for m in proj.get("metrics", []))
        add("projects", f"EXHIBIT {proj['exhibit']}", "#projects",
            f"Project: {proj['title']} ({proj['classification']}). "
            f"Tech: {', '.join(proj.get('tech', []))}. {proj['description']} "
            f"Results: {metrics}.")
    for m in pr.get("minor", []):
        add("projects", m["tag"].split(" · ")[0].upper(), "#projects",
            f"Minor project: {m['title']}. Tech: {', '.join(m.get('tech', []))}. "
            f"{m['description']}")

    for s in content.get("education", []):
        add("education", s["record"].upper(), "#education",
            f"Education: {s['degree']}, {s['school']} ({s['dates']}, {s['gpa']}). "
            f"Coursework: {s['coursework']}")

    pub = content.get("publications", {})
    for paper in pub.get("papers", []):
        add("publications", "PUBLISHED FINDINGS", "#publications",
            f"Publication: {paper['title']} — {paper['meta']}.")
    certs = "; ".join(f"{c['name']} ({c['issuer']})"
                      for c in pub.get("certifications", []))
    add("publications", "CREDENTIALS ON FILE", "#publications",
        f"Certifications held: {certs}.")

    channels = "; ".join(f"{c['label']}: {c['value']}"
                         for c in content.get("contact", {}).get("channels", []))
    add("contact", "TIP LINE", "#contact", f"Contact channels: {channels}")

    return docs


def main() -> int:
    if len(sys.argv) != 4:
        print(__doc__)
        return 1
    supabase_url, service_key, voyage_key = (
        sys.argv[1].rstrip("/"), sys.argv[2], sys.argv[3])

    content_path = Path(__file__).resolve().parent.parent / "content.json"
    content = json.loads(content_path.read_text(encoding="utf-8"))
    docs = build_documents(content)
    print(f"Chunked case file into {len(docs)} documents.")

    # Embed (single batch — well under Voyage's batch limit)
    embed_resp = post_json(
        "https://api.voyageai.com/v1/embeddings",
        {"Authorization": f"Bearer {voyage_key}"},
        {"model": EMBED_MODEL, "input": [d["content"] for d in docs],
         "input_type": "document"},
    )
    embeddings = sorted(embed_resp["data"], key=lambda e: e["index"])
    for doc, emb in zip(docs, embeddings):
        doc["embedding"] = emb["embedding"]
    dim = len(docs[0]["embedding"])
    print(f"Embedded with {EMBED_MODEL} ({dim} dimensions).")

    sb_headers = {
        "apikey": service_key,
        "Authorization": f"Bearer {service_key}",
        "Prefer": "return=minimal",
    }
    # Replace the index atomically enough for a portfolio: wipe, then insert.
    post_json(f"{supabase_url}/rest/v1/documents?id=not.is.null",
              sb_headers, None, method="DELETE")
    post_json(f"{supabase_url}/rest/v1/documents", sb_headers, docs)
    print(f"Indexed {len(docs)} documents. The Interrogation Room is armed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
