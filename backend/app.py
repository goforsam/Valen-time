"""Social Twin Trainer – FastAPI backend."""

import os
import json
import uuid
import sqlite3
from datetime import datetime
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

DB_PATH = os.getenv("DB_PATH", "sessions.db")

# ---------------------------------------------------------------------------
# DB helpers
# ---------------------------------------------------------------------------

def _get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _init_db():
    conn = _get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS twins (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            personality TEXT NOT NULL,
            interests TEXT NOT NULL,
            communication_style TEXT NOT NULL,
            created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS sessions (
            id TEXT PRIMARY KEY,
            twin_a TEXT NOT NULL,
            twin_b TEXT NOT NULL,
            plan TEXT,
            sim_log TEXT,
            score REAL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (twin_a) REFERENCES twins(id),
            FOREIGN KEY (twin_b) REFERENCES twins(id)
        );
    """)
    conn.commit()
    conn.close()

# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    _init_db()
    yield

app = FastAPI(title="Social Twin Trainer", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class TwinCreate(BaseModel):
    name: str
    personality: str
    interests: str
    communication_style: str


class MatchRequest(BaseModel):
    twin_a_id: str
    twin_b_id: str


class PlanRequest(BaseModel):
    session_id: str
    goal: str


class SimRequest(BaseModel):
    session_id: str
    rounds: int = 6

# ---------------------------------------------------------------------------
# Gemini helper
# ---------------------------------------------------------------------------

def _gemini(prompt: str) -> str:
    if not GEMINI_API_KEY:
        raise HTTPException(503, "GEMINI_API_KEY not set")
    model = genai.GenerativeModel("gemini-2.0-flash")
    resp = model.generate_content(prompt)
    return resp.text

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/twins")
def list_twins():
    conn = _get_db()
    rows = conn.execute("SELECT * FROM twins ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.post("/twins")
def create_twin(body: TwinCreate):
    twin_id = uuid.uuid4().hex[:8]
    conn = _get_db()
    conn.execute(
        "INSERT INTO twins VALUES (?,?,?,?,?,?)",
        (twin_id, body.name, body.personality, body.interests,
         body.communication_style, datetime.utcnow().isoformat()),
    )
    conn.commit()
    conn.close()
    return {"id": twin_id, "name": body.name}


@app.delete("/twins/{twin_id}")
def delete_twin(twin_id: str):
    conn = _get_db()
    conn.execute("DELETE FROM twins WHERE id=?", (twin_id,))
    conn.commit()
    conn.close()
    return {"deleted": twin_id}


@app.post("/match")
def match_twins(body: MatchRequest):
    conn = _get_db()
    a = conn.execute("SELECT * FROM twins WHERE id=?", (body.twin_a_id,)).fetchone()
    b = conn.execute("SELECT * FROM twins WHERE id=?", (body.twin_b_id,)).fetchone()
    if not a or not b:
        conn.close()
        raise HTTPException(404, "Twin not found")

    prompt = f"""You are a social-dynamics expert. Analyse compatibility between two people.

Person A – {a['name']}:
  Personality: {a['personality']}
  Interests: {a['interests']}
  Communication style: {a['communication_style']}

Person B – {b['name']}:
  Personality: {b['personality']}
  Interests: {b['interests']}
  Communication style: {b['communication_style']}

Return JSON with keys: compatibility_score (0-100), strengths (list), challenges (list), tip (string).
Only return valid JSON, no markdown."""

    raw = _gemini(prompt)
    session_id = uuid.uuid4().hex[:8]
    conn.execute(
        "INSERT INTO sessions (id, twin_a, twin_b, created_at) VALUES (?,?,?,?)",
        (session_id, body.twin_a_id, body.twin_b_id, datetime.utcnow().isoformat()),
    )
    conn.commit()
    conn.close()

    try:
        analysis = json.loads(raw)
    except json.JSONDecodeError:
        analysis = {"raw": raw}

    return {"session_id": session_id, "analysis": analysis}


@app.post("/plan")
def generate_plan(body: PlanRequest):
    conn = _get_db()
    sess = conn.execute("SELECT * FROM sessions WHERE id=?", (body.session_id,)).fetchone()
    if not sess:
        conn.close()
        raise HTTPException(404, "Session not found")
    a = conn.execute("SELECT * FROM twins WHERE id=?", (sess['twin_a'],)).fetchone()
    b = conn.execute("SELECT * FROM twins WHERE id=?", (sess['twin_b'],)).fetchone()

    prompt = f"""You are a date-planning AI. Create a step-by-step date plan.

Goal: {body.goal}

Person A – {a['name']}: {a['personality']}, likes {a['interests']}
Person B – {b['name']}: {b['personality']}, likes {b['interests']}

Return JSON with keys:
  title (string), steps (list of {{order, activity, duration_min, vibe}}), tips (list of strings).
Only return valid JSON, no markdown."""

    raw = _gemini(prompt)
    try:
        plan = json.loads(raw)
    except json.JSONDecodeError:
        plan = {"raw": raw}

    conn.execute("UPDATE sessions SET plan=? WHERE id=?", (json.dumps(plan), body.session_id))
    conn.commit()
    conn.close()
    return {"session_id": body.session_id, "plan": plan}


@app.post("/sim")
def simulate(body: SimRequest):
    conn = _get_db()
    sess = conn.execute("SELECT * FROM sessions WHERE id=?", (body.session_id,)).fetchone()
    if not sess:
        conn.close()
        raise HTTPException(404, "Session not found")
    a = conn.execute("SELECT * FROM twins WHERE id=?", (sess['twin_a'],)).fetchone()
    b = conn.execute("SELECT * FROM twins WHERE id=?", (sess['twin_b'],)).fetchone()

    plan_ctx = sess['plan'] or "casual hangout"

    prompt = f"""Simulate a conversation between two people on a date.

Context/Plan: {plan_ctx}

Person A – {a['name']}: personality={a['personality']}, style={a['communication_style']}
Person B – {b['name']}: personality={b['personality']}, style={b['communication_style']}

Generate exactly {body.rounds} exchanges (A speaks, then B responds = 1 exchange).
Return JSON with keys:
  exchanges (list of {{round, speaker, message, mood, engagement_score}}),
  overall_score (0-100),
  summary (string).
Only return valid JSON, no markdown."""

    raw = _gemini(prompt)
    try:
        sim = json.loads(raw)
    except json.JSONDecodeError:
        sim = {"raw": raw}

    conn.execute(
        "UPDATE sessions SET sim_log=?, score=? WHERE id=?",
        (json.dumps(sim), sim.get("overall_score"), body.session_id),
    )
    conn.commit()
    conn.close()
    return {"session_id": body.session_id, "simulation": sim}


@app.get("/health")
def health():
    return {"status": "ok", "ts": datetime.utcnow().isoformat()}
