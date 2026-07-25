# API Contract chung

## Response envelope

Moi API tra ve theo cau truc sau (xem `ApiResponse.java` o backend):

```json
{
  "success": true,
  "data": { },
  "message": null,
  "timestamp": "2026-07-26T10:00:00Z"
}
```

- `success = false` khi co loi; `data = null`, `message` mo ta loi.
- Loi validate tra ve `data` la object `{ "tenField": "thong bao loi" }`.

## Ma HTTP status dung thong nhat

| Status | Y nghia                                    |
| ------ | -------------------------------------------- |
| 200    | Thanh cong                                    |
| 400    | Du lieu dau vao khong hop le                  |
| 401    | Chua dang nhap hoac token het han             |
| 403    | Khong du quyen / sai tenant                   |
| 404    | Khong tim thay tai nguyen                     |
| 422    | Vi pham quy tac nghiep vu (BusinessRuleException) |
| 500    | Loi he thong                                  |

## Phan trang (khi API tra ve danh sach)

Query param: `page` (bat dau tu 0), `size`, `sort`.

Response `data`:

```json
{
  "content": [],
  "page": 0,
  "size": 20,
  "totalElements": 0,
  "totalPages": 0
}
```

## Xac thuc

- Header: `Authorization: Bearer <access_token>`.
- Access token het han sau 30 phut, refresh token 7 ngay (xem `application.yml`).
