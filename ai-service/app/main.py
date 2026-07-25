"""
AI Service - xu ly ngon ngu tu nhien tieng Viet cho tinh nang Draft Order (EPIC-09).
Trach nhiem chinh:
  - Nhan cau lenh dat hang bang van ban / giong noi (SCRUM-48, SCRUM-49)
  - Trich xuat san pham, so luong, don vi, khach hang, yeu cau ghi no (SCRUM-50)
  - Doi chieu du lieu cua hang va phat hien mo ho (SCRUM-51, SCRUM-52)
Khung nay moi chi co health check va endpoint stub; logic NLP se duoc
trien khai chi tiet trong Sprint 5-6.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import parse_order

app = FastAPI(
    title="AgriTrade AI Service",
    description="Dich vu AI xu ly don hang bang ngon ngu tu nhien tieng Viet",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: gioi han origin khi len production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(parse_order.router, prefix="/api/v1/ai", tags=["ai"])


@app.get("/api/v1/ai/health")
def health():
    return {"status": "UP", "service": "ai-service"}
