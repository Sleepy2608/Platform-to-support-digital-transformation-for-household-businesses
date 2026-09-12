from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field, StringConstraints

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=255)]
Quantity = Annotated[Decimal, Field(gt=0, max_digits=18, decimal_places=3,
                                    le=Decimal("999999999999999.999"))]


class ParseOrderRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)
    text: str = Field(min_length=1, max_length=4000)


class ExtractedItem(BaseModel):
    model_config = ConfigDict(extra="forbid")
    product_name: Name
    quantity: Quantity | None
    unit: Name | None


class ExtractedOrder(BaseModel):
    model_config = ConfigDict(extra="forbid")
    intent: Literal["CREATE_ORDER", "OTHER"]
    customer_name: Name | None
    payment_type: Literal["CASH", "TRANSFER", "DEBT", "UNKNOWN"]
    items: list[ExtractedItem] = Field(max_length=20)
    ambiguities: list[Name] = Field(max_length=20)
