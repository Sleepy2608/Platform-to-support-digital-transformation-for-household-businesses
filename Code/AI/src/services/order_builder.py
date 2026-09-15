"""
Order Builder Service
=====================
Legacy prototype retained for reference. The active BAI flow does not use this builder.
"""

from typing import Optional
from datetime import datetime


class OrderBuilder:
    """Builds draft orders for database insertion."""
    
    def __init__(self, business_id: int, requested_by: int):
        self.business_id = business_id
        self.requested_by = requested_by
        self.order_data = {
            "business_id": business_id,
            "created_by": requested_by,
            "status": "DRAFT",
            "source": "AI",
            "order_code": self._generate_order_code(),
        }
        self.items = []
        self.customer = None
        self.payment_type = "CASH"
        self.ambiguities = []
    
    def _generate_order_code(self) -> str:
        """Generate unique order code"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        return f"AI-{timestamp}"
    
    def set_customer(self, customer_id: int, customer_name: str, phone: Optional[str] = None):
        """Set customer for the order"""
        self.customer = {
            "customer_id": customer_id,
            "customer_name": customer_name,
            "phone": phone
        }
        self.order_data["customer_id"] = customer_id
    
    def add_item(self, product: dict, quantity: float, unit_id: int, 
                 unit_price: float, conversion_rate: float = 1.0):
        """Add item to order"""
        base_quantity = quantity * conversion_rate
        line_total = quantity * unit_price
        
        item = {
            "product_id": product["id"],
            "product_name": product.get("product_name", ""),
            "unit_id": unit_id,
            "quantity": quantity,
            "conversion_rate": conversion_rate,
            "base_quantity": base_quantity,
            "unit_price": unit_price,
            "product_price_id": product.get("default_price_id"),
            "line_total": line_total,
        }
        self.items.append(item)
    
    def set_payment_type(self, payment_type: str):
        """Set payment type"""
        self.payment_type = payment_type.upper()
        
        if self.payment_type == "DEBT":
            self.order_data["payment_status"] = "PARTIAL"
            self.order_data["paid_amount"] = 0
            self.order_data["debt_amount"] = sum(item["line_total"] for item in self.items)
        else:
            self.order_data["payment_status"] = "PAID"
            total = sum(item["line_total"] for item in self.items)
            self.order_data["paid_amount"] = total
            self.order_data["debt_amount"] = 0
    
    def set_ambiguities(self, ambiguities: list):
        """Set ambiguities for review"""
        self.ambiguities = ambiguities
        if ambiguities:
            self.order_data["note"] = f"AI ambiguities: {'; '.join(ambiguities)}"
    
    def calculate_totals(self):
        """Calculate order totals"""
        total = sum(item["line_total"] for item in self.items)
        self.order_data["total_amount"] = total
        
        if self.payment_type == "DEBT":
            self.order_data["debt_amount"] = total
            self.order_data["paid_amount"] = 0
        else:
            self.order_data["paid_amount"] = total
            self.order_data["debt_amount"] = 0
    
    def build(self) -> dict:
        """Build final order data"""
        self.calculate_totals()
        
        return {
            "order": self.order_data,
            "items": self.items,
            "customer": self.customer,
            "payment_type": self.payment_type,
            "ambiguities": self.ambiguities
        }
