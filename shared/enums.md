# Enums dung chung

Phai giu dong bo giua:
- Backend: `backend/src/main/java/com/agritrade/app/entity/UserRole.java`
- Frontend: `frontend/src/shared/constants/roles.js`

## UserRole

| Gia tri  | Y nghia                                  |
| -------- | ----------------------------------------- |
| OWNER    | Chu ho kinh doanh, mua goi dich vu        |
| EMPLOYEE | Nhan vien ban hang, do Owner tao          |
| ADMIN    | Quan tri vien he thong (Anthropic-internal)|

## SubscriptionPlanType (se hoan thien o SCRUM-19)

| Gia tri  | Y nghia    |
| -------- | ---------- |
| STANDARD | Goi Thuong |
| VIP      | Goi VIP    |

## SubscriptionStatus (se hoan thien o SCRUM-20)

| Gia tri         | Y nghia                        |
| ---------------- | ------------------------------- |
| PENDING_PAYMENT   | Cho thanh toan                  |
| ACTIVE            | Dang su dung                    |
| EXPIRED           | Da het han                      |
| CANCELED          | Da huy                          |

## OrderStatus (se hoan thien o SCRUM-45)

| Gia tri   | Y nghia          |
| --------- | ----------------- |
| DRAFT     | Don nhap tu AI, chua xac nhan |
| CONFIRMED | Da xac nhan        |
| CANCELED  | Da huy             |
