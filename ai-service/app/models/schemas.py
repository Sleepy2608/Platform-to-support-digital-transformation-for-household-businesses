from typing import Any

from pydantic import BaseModel, Field


class ParseRequest(BaseModel):
    tenant_id: int = Field(..., description="business_id / tenant_id")
    text: str = Field(..., min_length=1, description="Câu lệnh đặt hàng tiếng Việt")
    channel: str = Field(default="COUNTER", description="COUNTER | ZALO | VOICE")
    message_id: str | None = Field(default=None, description="Idempotency key")


class ExtractedItem(BaseModel):
    raw_name: str
    quantity: float | None = None
    unit: str | None = None
    product_id: int | None = None
    confidence: float = 0.0


class ParseResponse(BaseModel):
    status: str = "SKELETON"
    tenant_id: int
    raw_text: str
    customer_hint: str | None = None
    debt_requested: bool = False
    items: list[ExtractedItem] = []
    ambiguity: list[str] = []
    confidence: float = 0.0
    meta: dict[str, Any] = {}
