"""
AI order parsing router.
Các endpoint sẽ được implement dần theo SCRUM-48 → SCRUM-56.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

ai_router = APIRouter(tags=["AI Order Parsing"])


class ParseOrderRequest(BaseModel):
    text: str
    store_id: int
    audio_base64: Optional[str] = None  # SCRUM-49 voice-to-text


class ParseOrderResponse(BaseModel):
    success: bool
    draft_order: Optional[dict] = None
    ambiguities: list[str] = []
    message: str = ""


@ai_router.post("/parse-order", response_model=ParseOrderResponse)
async def parse_order(request: ParseOrderRequest):
    """
    Nhận văn bản câu lệnh và trả về Draft Order.
    Implementation: SCRUM-50, SCRUM-51, SCRUM-52, SCRUM-53
    """
    # TODO: Implement NLP parsing pipeline
    return ParseOrderResponse(
        success=False,
        message="AI parser chưa được triển khai — sẽ hoàn thiện ở Sprint 5-6"
    )
