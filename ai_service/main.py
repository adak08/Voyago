from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.plan import router
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="Voyago AI Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5000",
        "http://localhost:5173",
        "https://voyago.onrender.com",    # update after Render deploy
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/health")
def health():
    return {"status": "ok", "service": "voyago-ai"}
