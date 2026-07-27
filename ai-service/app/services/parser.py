from app.models.schemas import ExtractedItem, ParseRequest, ParseResponse


def parse_order_text(request: ParseRequest) -> ParseResponse:
    """
    Skeleton parser — trả về cấu trúc chuẩn, chưa gọi LLM/STT.
    SCRUM-48..56 sẽ thay thế bằng pipeline thật.
    """
    text = request.text.strip()
    return ParseResponse(
        status="SKELETON",
        tenant_id=request.tenant_id,
        raw_text=text,
        customer_hint=None,
        debt_requested="nợ" in text.lower() or "ghi nợ" in text.lower(),
        items=[
            ExtractedItem(
                raw_name="(chưa trích xuất — skeleton)",
                quantity=None,
                unit=None,
                confidence=0.0,
            )
        ],
        ambiguity=["Parser skeleton chưa triển khai — dùng nhập thủ công (fallback)."],
        confidence=0.0,
        meta={
            "channel": request.channel,
            "message_id": request.message_id,
            "next": "SCRUM-50 Natural Language Order Parser",
        },
    )
