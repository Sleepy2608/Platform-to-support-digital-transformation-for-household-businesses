"""
B.ai extraction service.
Spring Boot owns catalog matching, pricing, review and order confirmation.
"""

from fastapi import FastAPI

from src.router import ai_router

app = FastAPI(
    title="HBDT AI Service",
    description="B.ai: Vietnamese order extraction",
    version="0.2.0",
)

app.include_router(ai_router, prefix="/api/v1/ai")


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ai-service"}
