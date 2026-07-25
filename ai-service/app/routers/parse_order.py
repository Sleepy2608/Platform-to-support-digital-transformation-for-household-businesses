"""
Router xu ly cau lenh dat hang ngon ngu tu nhien.
Logic parser tieng Viet chi tiet (SCRUM-50, SCRUM-51, SCRUM-52) se duoc
trien khai trong Sprint 5-6, hien tai chi tra ve cau truc phan hoi mau.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter()


class ParseOrderRequest(BaseModel):
    tenant_id: int
    raw_text: str


class ParsedLineItem(BaseModel):
    product_name_raw: str
    quantity: Optional[float] = None
    unit: Optional[str] = None
    matched_product_id: Optional[int] = None
    confidence: float = 0.0


class ParseOrderResponse(BaseModel):
    status: str  # "OK" | "AMBIGUOUS" | "FAILED"
    customer_name_raw: Optional[str] = None
    matched_customer_id: Optional[int] = None
    is_debt: bool = False
    items: List[ParsedLineItem] = []
    message: Optional[str] = None


@router.post("/parse-order", response_model=ParseOrderResponse)
def parse_order(payload: ParseOrderRequest) -> ParseOrderResponse:
    """
    TODO SCRUM-50/51/52: goi NLP pipeline thuc te de trich xuat san pham,
    so luong, don vi, khach hang va yeu cau ghi no tu payload.raw_text,
    sau do doi chieu voi du lieu cua tenant_id tuong ung.
    """
    return ParseOrderResponse(
        status="FAILED",
        message="Chuc nang parser chua duoc trien khai (stub Sprint 1).",
        items=[],
    )
