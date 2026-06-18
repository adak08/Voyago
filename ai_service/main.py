from dotenv import load_dotenv
from pathlib import Path

load_dotenv(dotenv_path=Path(__file__).with_name(".env"), override=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.plan import router

app = FastAPI(title="Voyago AI Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",
        "http://localhost:5173",
        "https://voyago.onrender.com",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "voyago-ai"}

import os

def get_groq_status():
    """Check if Groq is configured"""
    groq_key = os.getenv("GROQ_API_KEY", "").strip()
    return {"groq": bool(groq_key)}

@app.get("/status")
def status():
    """Check LLM service status"""
    return {
        "service": "voyago-ai",
        "status": "ok",
        "llm": "groq",
        "groq_configured": get_groq_status()["groq"]
    }
