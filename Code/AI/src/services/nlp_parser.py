"""
Vietnamese NLP Parser for Order Processing
==========================================
Legacy prototype retained for reference. The active router uses BaiClient.
"""

import re
from dataclasses import dataclass, field
from typing import Optional
from difflib import SequenceMatcher


@dataclass
class ParsedOrderItem:
    product_name: str
    quantity: float
    unit: str = "cái"
    pricing_type: str = "normal"


@dataclass
class ParsedOrder:
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    payment_type: str = "cash"
    items: list = field(default_factory=list)
    ambiguities: list = field(default_factory=list)
    confidence: float = 0.0
    raw_text: str = ""


class VietnameseOrderParser:
    """Vietnamese NLP Parser for sales order extraction."""
    
    UNIT_PATTERNS = {
        "bao": ["bao", "túi"],
        "viên": ["viên", "cục"],
        "thùng": ["thùng", "hộp"],
        "kg": ["ki lô gam", "kilogam", "kg", "cân"],
        "tấn": ["tấn", "tạ"],
        "lít": ["lít", "l"],
        "quả": ["quả", "trái"],
        "bộ": ["bộ"],
        "cuộn": ["cuộn"],
        "cái": ["cái", "chiếc"],
    }
    
    PAYMENT_PATTERNS = {
        "debt": ["ghi nợ", "nợ", "mua chịu", "trả sau", "treo"],
        "cash": ["tiền mặt", "thanh toán ngay", "trả tiền"],
        "transfer": ["chuyển khoản", "ck"],
    }
    
    CUSTOMER_PATTERNS = [
        r"(?:cho|mua|lấy|của)\s+(anh|chị|bà|bác|ông|chú)\s+(\w+)",
        r"(?:giao cho)\s+(anh|chị|bà|bác|ông)\s+(\w+)",
    ]
    
    def parse(self, text: str) -> ParsedOrder:
        text = text.lower().strip()
        result = ParsedOrder(raw_text=text)
        
        customer = self._extract_customer(text)
        if customer:
            result.customer_name = customer
        
        result.payment_type = self._extract_payment_type(text)
        result.items = self._extract_items(text)
        result.confidence = self._calculate_confidence(result)
        result.ambiguities = self._detect_ambiguities(result)
        
        return result
    
    def _extract_customer(self, text: str) -> Optional[str]:
        for pattern in self.CUSTOMER_PATTERNS:
            match = re.search(pattern, text)
            if match and len(match.groups()) >= 2:
                title, name = match.groups()
                return f"{title.capitalize()} {name.capitalize()}"
        return None
    
    def _extract_payment_type(self, text: str) -> str:
        for payment_type, patterns in self.PAYMENT_PATTERNS.items():
            for pattern in patterns:
                if pattern in text:
                    return payment_type
        return "cash"
    
    def _extract_items(self, text: str) -> list:
        items = []
        
        # Split by commas and common separators
        segments = re.split(r'[,;]+', text)
        
        for segment in segments:
            segment = segment.strip()
            
            # Extract quantity
            qty_match = re.search(r"(\d+(?:[.,]\d+)?)", segment)
            quantity = float(qty_match.group(1).replace(",", ".")) if qty_match else 1
            
            # Extract unit
            unit = "cái"
            for u, keywords in self.UNIT_PATTERNS.items():
                for keyword in keywords:
                    if keyword in segment:
                        unit = u
                        break
            
            # Extract product name
            product_name = self._extract_product_name(segment)
            
            if product_name:
                items.append(ParsedOrderItem(
                    product_name=product_name,
                    quantity=quantity,
                    unit=unit
                ))
        
        return items
    
    def _extract_product_name(self, segment: str) -> str:
        cleaned = segment
        
        # Remove quantity
        cleaned = re.sub(r"\d+(?:[.,]\d+)?", "", cleaned)
        
        # Remove units
        for keywords in self.UNIT_PATTERNS.values():
            for keyword in keywords:
                cleaned = cleaned.replace(keyword, "")
        
        # Remove customer references
        for pattern in self.CUSTOMER_PATTERNS:
            cleaned = re.sub(pattern, "", cleaned)
        
        # Remove payment references
        for patterns in self.PAYMENT_PATTERNS.values():
            for pattern in patterns:
                cleaned = cleaned.replace(pattern, "")
        
        # Remove common verbs
        for verb in ["cho", "mua", "lấy", "với", "và"]:
            cleaned = cleaned.replace(verb, "")
        
        cleaned = " ".join(cleaned.split()).strip()
        return cleaned if cleaned else None
    
    def _calculate_confidence(self, order: ParsedOrder) -> float:
        score = 0.0
        if order.customer_name:
            score += 0.25
        if order.items:
            score += 0.25
            valid_items = sum(1 for item in order.items if item.quantity > 0)
            score += (valid_items / len(order.items)) * 0.25
        if order.payment_type != "cash":
            score += 0.25
        return min(score, 1.0)
    
    def _detect_ambiguities(self, order: ParsedOrder) -> list:
        ambiguities = []
        if not order.customer_name:
            ambiguities.append("Không xác định được khách hàng")
        if not order.items:
            ambiguities.append("Không tìm thấy sản phẩm nào")
        for item in order.items:
            if item.quantity == 1 and len(order.items) > 1:
                ambiguities.append(f"Sản phẩm '{item.product_name}' không có số lượng cụ thể")
        return ambiguities
    
    def match_products(self, products: list, parsed_items: list) -> list:
        matched = []
        for parsed in parsed_items:
            best_match = None
            best_score = 0.0
            
            for product in products:
                score = self._calculate_similarity(
                    parsed.product_name,
                    product.get("product_name", "")
                )
                if score > best_score and score > 0.4:
                    best_score = score
                    best_match = product
            
            if best_match:
                matched.append({
                    "product": best_match,
                    "quantity": parsed.quantity,
                    "unit": parsed.unit,
                    "confidence": best_score
                })
            else:
                matched.append({
                    "product": {"product_name": parsed.product_name, "id": None},
                    "quantity": parsed.quantity,
                    "unit": parsed.unit,
                    "confidence": 0.0,
                    "unmatched": True
                })
        
        return matched
    
    def _calculate_similarity(self, text1: str, text2: str) -> float:
        text1 = text1.lower().strip()
        text2 = text2.lower().strip()
        
        if text1 == text2:
            return 1.0
        if text1 in text2 or text2 in text1:
            return 0.8
        
        words1 = set(text1.split())
        words2 = set(text2.split())
        
        if words1 and words2:
            return len(words1 & words2) / len(words1 | words2)
        
        return SequenceMatcher(None, text1, text2).ratio()
