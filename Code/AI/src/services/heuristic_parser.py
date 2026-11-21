"""Heuristic Vietnamese order extraction fallback parser.

Used when the live AI LLM provider (B.ai / Qwen) is not configured, out of credits,
or unavailable, allowing offline POS sales order creation and resilient system demos.
"""

from decimal import Decimal
import re
from typing import Optional

from src.models import ExtractedItem, ExtractedOrder

# Known units in Vietnamese retail & household businesses
UNITS = [
    "thùng", "hộp", "lon", "chai", "bao", "gói", "cây", "kg", "kilogam", "cân",
    "lạng", "yến", "tạ", "tấn", "lít", "l", "quả", "trái", "cái", "chiếc",
    "bộ", "cuộn", "mét", "m", "túi", "vỉ", "tập", "ram", "lốc", "bình", "can",
]

# Vietnamese number words to digits
NUMBER_WORDS = {
    "nửa": Decimal("0.5"),
    "rưỡi": Decimal("0.5"),
    "một": Decimal("1"),
    "mốt": Decimal("1"),
    "hai": Decimal("2"),
    "ba": Decimal("3"),
    "bốn": Decimal("4"),
    "tư": Decimal("4"),
    "năm": Decimal("5"),
    "sáu": Decimal("6"),
    "bảy": Decimal("7"),
    "bẩy": Decimal("7"),
    "tám": Decimal("8"),
    "chín": Decimal("9"),
    "mười": Decimal("10"),
    "chục": Decimal("10"),
    "trăm": Decimal("100"),
}

# Questions / general queries / non-order intents
OTHER_INTENT_PATTERNS = [
    r"\b(hộ kinh doanh|thông tư 88|luật|nghị định|quy định|kê khai thuế|thuế môn bài|thuế gtgt|sổ kế toán)\b",
    r"\b(hướng dẫn|cách dùng|phần mềm|tính năng|báo cáo tài chính|tra cứu luật)\b",
    r"\b(hủy đơn|xoá đơn|kiểm tra đơn cũ|tra cứu đơn hàng|lịch sử đơn)\b",
    r"^(chào|alo|xin chào|hello|hi)\b",
]

# Payment method keywords (sorted by length descending for greedy match)
DEBT_KEYWORDS = sorted(
    ["ghi nợ", "mua chịu", "trả sau", "cho nợ", "ghi sổ", "treo nợ", "nợ"],
    key=len,
    reverse=True,
)
TRANSFER_KEYWORDS = sorted(
    [
        "thanh toán chuyển khoản", "chuyển qua tài khoản", "chuyển khoản", "bằng chuyển khoản",
        "qua chuyển khoản", "chuyển qua app", "chuyển qua thẻ", "bắn tiền", "banking",
        "quét qr", "vietqr", "ck",
    ],
    key=len,
    reverse=True,
)
CASH_KEYWORDS = sorted(
    [
        "thanh toán bằng tiền mặt", "thanh toán tiền mặt", "trả bằng tiền mặt",
        "trả tiền mặt", "tiền mặt", "trả tiền ngay", "tiền tươi", "thanh toán ngay",
        "trả ngay", "đưa tiền mặt", "đưa tiền", "trả tiền",
    ],
    key=len,
    reverse=True,
)


def _detect_intent(text: str) -> str:
    """Classify if the input text is an order intent or general query (OTHER)."""
    lowered = text.lower().strip()
    for pattern in OTHER_INTENT_PATTERNS:
        if re.search(pattern, lowered):
            return "OTHER"
    return "CREATE_ORDER"


def _extract_customer(text: str) -> tuple[Optional[str], str]:
    """Extract customer name and return clean remaining text."""
    patterns = [
        r"\b(?:giao cho|bán cho|tạo đơn cho|ghi cho|cho)\s+(anh|chị|cô|chú|bác|ông|bà|em)\s+([A-ZÀ-Ỹa-zà-ỹ0-9_]+)\b",
        r"\b(?:khách hàng|khách quen|khách)\s+([A-ZÀ-Ỹa-zà-ỹ0-9_]+)\b",
        r"\b(?:của)\s+(anh|chị|cô|chú|bác|ông|bà|em)\s+([A-ZÀ-Ỹa-zà-ỹ0-9_]+)\b",
        r"\b(anh|chị|cô|chú|bác|ông|bà|em)\s+([A-ZÀ-Ỹa-zà-ỹ0-9_]+)\s+(?:lấy|mua|đặt|cần|lấy hộ)\b",
    ]

    for pat in patterns:
        match = re.search(pat, text, flags=re.IGNORECASE)
        if match:
            groups = match.groups()
            if len(groups) == 2:
                title, name = groups
                # Avoid matching numbers as names e.g. "ba bao"
                if name.lower() in ("ba", "bốn", "năm", "sáu") and re.search(
                    r"\b" + name + r"\s+(bao|thùng|hộp|chai|lon|kg)", text, re.I
                ):
                    continue
                customer = f"{title.strip()} {name.strip()}"
            else:
                customer = groups[0].strip()
            cleaned_text = text[:match.start()] + " " + text[match.end():]
            return customer, cleaned_text.strip()

    return None, text


def _extract_payment_type(text: str) -> tuple[str, str]:
    """Detect payment type (CASH, TRANSFER, DEBT, UNKNOWN) and return remaining text."""
    lowered = text.lower()

    # Negative check: "không ghi nợ", "không nợ"
    if any(neg in lowered for neg in ("không ghi nợ", "không nợ", "đừng ghi nợ")):
        cleaned = re.sub(r"\b(không ghi nợ|không nợ|đừng ghi nợ)\b", "", text, flags=re.IGNORECASE)
        return "UNKNOWN", cleaned.strip()

    for kw in DEBT_KEYWORDS:
        if re.search(r"\b" + re.escape(kw) + r"\b", lowered):
            cleaned = re.sub(r"\b" + re.escape(kw) + r"\b", "", text, flags=re.IGNORECASE)
            return "DEBT", cleaned.strip()

    for kw in TRANSFER_KEYWORDS:
        if re.search(r"\b" + re.escape(kw) + r"\b", lowered):
            cleaned = re.sub(r"\b" + re.escape(kw) + r"\b", "", text, flags=re.IGNORECASE)
            return "TRANSFER", cleaned.strip()

    for kw in CASH_KEYWORDS:
        if re.search(r"\b" + re.escape(kw) + r"\b", lowered):
            cleaned = re.sub(r"\b" + re.escape(kw) + r"\b", "", text, flags=re.IGNORECASE)
            return "CASH", cleaned.strip()

    return "UNKNOWN", text


def _parse_quantity_token(token: str) -> Optional[Decimal]:
    """Parse numeric tokens like '2.5', '2,5', '10' or Vietnamese word 'hai' into Decimal."""
    token = token.strip().lower()
    if token in NUMBER_WORDS:
        return NUMBER_WORDS[token]

    token = token.replace(",", ".")
    try:
        val = Decimal(token)
        if val > 0:
            return val
    except Exception:
        pass
    return None


def _clean_product_name(raw: str) -> str:
    """Strip common order filler words while preserving brand & numbers in product name."""
    filler_words = [
        r"^(?:lấy|bán|mua|đặt|cần|thêm|cho tôi|cho mình|cho em|lấy thêm)\s+",
        r"\s+(?:trả tiền mặt|tiền mặt|chuyển khoản|ghi nợ|trả tiền|thanh toán|trả)$",
        r"\s+(?:nha|nhé|nhe|ạ|luôn|nhanh|nào|giùm|hộ)$",
    ]
    name = raw.strip()
    for pattern in filler_words:
        name = re.sub(pattern, "", name, flags=re.IGNORECASE).strip()
    name = re.sub(r"\s+", " ", name)
    return name


def _extract_items(text: str) -> tuple[list[ExtractedItem], list[str]]:
    """Extract list of order items and ambiguities using regex heuristics."""
    items: list[ExtractedItem] = []
    ambiguities: list[str] = []

    # Pre-split compound sentences on conjunctions: "," ";" "và" "với" "kèm" "cộng" "\n"
    # Use negative lookaround (?<!\d)[,;](?!\d) so decimal numbers like '2,5' are not split
    segments = re.split(r"(?<!\d)[,;](?!\d)|\n|\s+(?:và|với|cộng thêm|kèm theo)\s+", text, flags=re.IGNORECASE)

    unit_pattern = "|".join(re.escape(u) for u in UNITS)
    num_word_pattern = "|".join(re.escape(w) for w in NUMBER_WORDS.keys())

    pattern_with_unit = re.compile(
        rf"(?:^|\s*)(\d+(?:[.,]\d+)?|{num_word_pattern})\s*({unit_pattern})\s+(.+)$",
        re.IGNORECASE,
    )
    pattern_without_unit = re.compile(
        rf"(?:^|\s*)(\d+(?:[.,]\d+)?|{num_word_pattern})\s+([a-zA-ZÀ-ỹ0-9\s]+)$",
        re.IGNORECASE,
    )

    for seg in segments:
        seg = seg.strip()
        if not seg:
            continue

        # Strip leading verbs before matching quantity
        seg = re.sub(r"^(?:lấy|bán|mua|đặt|cần|thêm|cho tôi|cho mình|cho em|lấy thêm)\s+", "", seg, flags=re.IGNORECASE).strip()
        if not seg:
            continue

        # Try matching with explicit unit
        m_unit = pattern_with_unit.search(seg)
        if m_unit:
            raw_qty, raw_unit, raw_name = m_unit.groups()
            qty = _parse_quantity_token(raw_qty)
            pname = _clean_product_name(raw_name)
            if pname:
                items.append(ExtractedItem(product_name=pname, quantity=qty, unit=raw_unit.lower()))
            continue

        # Try matching without unit (number + product name)
        m_nounit = pattern_without_unit.search(seg)
        if m_nounit:
            raw_qty, raw_name = m_nounit.groups()
            qty = _parse_quantity_token(raw_qty)
            pname = _clean_product_name(raw_name)
            if pname and pname.lower() not in UNITS:
                items.append(ExtractedItem(product_name=pname, quantity=qty, unit=None))
                continue

        # Item mentioned without quantity e.g. "xi măng PCB40"
        cleaned_item = _clean_product_name(seg)
        if cleaned_item and len(cleaned_item) >= 2 and cleaned_item.lower() not in ("tiền mặt", "chuyển khoản", "ghi nợ", "cho"):
            items.append(ExtractedItem(product_name=cleaned_item, quantity=None, unit=None))
            ambiguities.append(f"Sản phẩm '{cleaned_item}' chưa có số lượng cụ thể.")

    return items[:20], ambiguities[:20]


def parse_order_heuristic(text: str) -> ExtractedOrder:
    """Main heuristic parser: extract intent, customer, payment, items, and ambiguities.

    Returns a valid Pydantic ExtractedOrder instance.
    """
    text = text.strip()
    intent = _detect_intent(text)

    if intent == "OTHER":
        return ExtractedOrder(
            intent="OTHER",
            customer_name=None,
            payment_type="UNKNOWN",
            items=[],
            ambiguities=[],
        )

    # Extract customer
    customer_name, text_after_customer = _extract_customer(text)

    # Extract payment type
    payment_type, text_after_payment = _extract_payment_type(text_after_customer)

    # Extract items
    items, ambiguities = _extract_items(text_after_payment)

    if not items:
        cleaned_raw = _clean_product_name(text)
        if cleaned_raw:
            items = [ExtractedItem(product_name=cleaned_raw, quantity=None, unit=None)]
            ambiguities.append(f"Chưa xác định rõ số lượng cho '{cleaned_raw}'.")

    return ExtractedOrder(
        intent="CREATE_ORDER",
        customer_name=customer_name,
        payment_type=payment_type,  # type: ignore[arg-type]
        items=items,
        ambiguities=ambiguities,
    )
