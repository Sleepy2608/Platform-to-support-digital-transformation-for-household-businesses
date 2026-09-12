"""Internal extraction API. Business data and order writes stay in Spring Boot."""

import secrets
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException

from src.config import Settings, get_settings
from src.models import ExtractedOrder, ParseOrderRequest
from src.services.bai_client import BaiClient, BaiError


def require_service_secret(
    settings: Annotated[Settings, Depends(get_settings)],
    x_api_secret: Annotated[str | None, Header()] = None,
) -> None:
    if not settings.api_secret:
        raise HTTPException(503, detail={"code": "SERVICE_NOT_CONFIGURED",
                                         "message": "Chưa cấu hình AI_SERVICE_API_SECRET."})
    if not x_api_secret or not secrets.compare_digest(
        x_api_secret.encode(), settings.api_secret.encode()
    ):
        raise HTTPException(401, detail={"code": "UNAUTHORIZED",
                                         "message": "Không có quyền gọi AI service."})


ai_router = APIRouter(tags=["BAI AI"], dependencies=[Depends(require_service_secret)])


@ai_router.post("/parse-order", response_model=ExtractedOrder)
async def parse_order(
    request: ParseOrderRequest, settings: Annotated[Settings, Depends(get_settings)]
) -> ExtractedOrder:
    try:
        return await BaiClient(settings).parse_order(request.text)
    except BaiError as error:
        raise HTTPException(error.status_code, detail={
            "code": error.code, "message": error.message
        }) from None


@ai_router.get("/ready")
def readiness(settings: Annotated[Settings, Depends(get_settings)]):
    """Configuration readiness only; this endpoint does not spend provider credits."""
    missing = settings.missing_bai_settings()
    if missing:
        raise HTTPException(503, detail={"code": "BAI_NOT_CONFIGURED",
                                         "message": "Thiếu cấu hình: " + ", ".join(missing)})
    return {"status": "configured", "provider": "bai", "model": settings.model,
            "live_verified": False}
