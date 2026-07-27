from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import health, parse

app = FastAPI(
    title="AI Order Service",
    description="Service độc lập: STT, NLP parser, matching → Draft Order (SCRUM-07 skeleton)",
    version="0.0.1",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/v1", tags=["health"])
app.include_router(parse.router, prefix="/v1/ai", tags=["ai"])


@app.get("/")
def root():
    return {
        "service": "ai-order-service",
        "status": "SKELETON",
        "docs": "/docs",
    }
