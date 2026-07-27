from fastapi import APIRouter

from app.models.schemas import ParseRequest, ParseResponse
from app.services.parser import parse_order_text

router = APIRouter()


@router.post("/parse", response_model=ParseResponse)
def parse_text(body: ParseRequest):
    """
    Stub NLP parser (SCRUM-50 sẽ implement đầy đủ).
    Không truy cập DB nghiệp vụ — chỉ trả cấu trúc Draft Order gợi ý.
    """
    return parse_order_text(body)
