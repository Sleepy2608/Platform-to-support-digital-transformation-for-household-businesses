"""
AgriTrade AI Service
====================
Xử lý câu lệnh đặt hàng bằng ngôn ngữ tự nhiên tiếng Việt.

SCRUM-48  AI Text Input
SCRUM-50  Natural Language Order Parser
SCRUM-51  Product & Customer Matching
SCRUM-52  Ambiguity Detection
SCRUM-53  Draft Order Generation
SCRUM-56  AI Fallback & Logging
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.router import ai_router

app = FastAPI(
    title="AgriTrade AI Service",
    description="NLP order parsing service for Vietnamese household businesses",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ai_router, prefix="/api/v1/ai")


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ai-service"}
