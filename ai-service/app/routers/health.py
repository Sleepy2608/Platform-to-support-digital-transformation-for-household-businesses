from datetime import datetime, timezone

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
def health():
    return {
        "status": "UP",
        "service": "ai-order-service",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
