# 📡 HƯỚNG DẪN TRA CỨU & KIỂM THỬ API HBDT PLATFORM
## (API DOCUMENTATION & TESTING GUIDE)

> **Dự án:** Nền tảng Hỗ trợ Chuyển đổi Số cho Hộ Kinh Doanh (HBDT Platform)  
> **Chuẩn đặc tả:** OpenAPI 3.0 (OAS 3) & Postman Collection v2.1  
> **Cổng dịch vụ Backend:** `http://localhost:8080`  
> **Cổng dịch vụ AI Microservice:** `http://localhost:8000`  

---

## 1. Tổng quan Thư mục `docs/api/`

Thư mục này cung cấp toàn bộ tài nguyên phục vụ việc tích hợp, tra cứu và kiểm thử tương tác (Interactive API Testing) cho lập trình viên và hội đồng đánh giá:

| Tệp tin | Định dạng | Mô tả chức năng |
| :--- | :---: | :--- |
| `hbdt-api.postman_collection.json` | Postman v2.1 | Bộ sưu tập hơn 20 API mẫu bao gồm: Auth, POS Bán Hàng, Quản Lý Kho, Sổ Kế Toán TT88, Webhook SePay, AI Parsing. |
| `hbdt-local.postman_environment.json` | Postman Env | Bộ biến môi trường local chứa: `{{baseUrl}}`, `{{token}}`, `{{aiUrl}}`, `{{sepaySecretKey}}`. |

---

## 2. Giao diện Tương tác Swagger UI & OpenAPI 3.0

Khi máy chủ Spring Boot đang chạy, lập trình viên có thể mở trực tiếp trình duyệt để xem và gọi thử API có giao diện trực quan:

- **Swagger UI Interactive Portal:**  
  👉 [`http://localhost:8080/swagger-ui.html`](http://localhost:8080/swagger-ui.html)
- **OpenAPI 3.0 JSON Specification:**  
  👉 [`http://localhost:8080/v3/api-docs`](http://localhost:8080/v3/api-docs)

### 2.1. Phân nhóm API (Grouped API Definitions)
Hệ thống sử dụng `GroupedOpenApi` chia tách thành 6 cụm chức năng chuyên biệt (chọn tại dropdown góc phải trên của Swagger UI):

1. **`all-apis`**: Toàn bộ endpoints của hệ thống HBDT.
2. **`public-apis`**: Các API công khai không yêu cầu đăng nhập: Landing page, Đăng ký, Đăng nhập, Bảng giá gói cước, Xác thực OTP.
3. **`owner-apis`**: Nghiệp vụ Chủ hộ kinh doanh: Bán hàng POS, Quản lý kho, Sổ sách kế toán TT88, Gia hạn gói cước, Quản lý nhân viên.
4. **`employee-apis`**: Nghiệp vụ Nhân viên bán hàng: Bán hàng nhanh (Fast Sales POS), Tra cứu tồn kho ca làm việc.
5. **`manager-apis`**: Nghiệp vụ Quản lý hệ thống: Thẩm định hồ sơ hộ kinh doanh, Đối soát hóa đơn dịch vụ, Xử lý phản hồi.
6. **`admin-apis`**: Nghiệp vụ Quản trị viên: Quản trị tài khoản, Định nghĩa gói thuê bao, Cấp phát mã giảm giá coupon, Quản lý mẫu biểu TT88.

### 2.2. Cơ chế Xác thực JWT Bearer trên Swagger UI
1. Gọi API `POST /api/public/auth/login` với tài khoản mẫu (ví dụ: `owner` / `owner123` hoặc `admin` / `admin`).
2. Copy chuỗi `access_token` từ phản hồi JSON.
3. Bấm nút **"Authorize"** (có biểu tượng ổ khóa màu xanh lá ở góc trên bên phải trang Swagger).
4. Dán token vào ô `Value` (không cần gõ thêm chữ `Bearer `) rồi bấm **Authorize**.
5. Toàn bộ các API yêu cầu quyền (`/api/owner/*`, `/api/admin/*`, `/api/employee/*`) sẽ tự động được gắn Authorization header.

---

## 3. Hướng dẫn Sử dụng Bộ sưu tập Postman (Postman Collection)

### Bước 1: Import vào Postman / Bruno / Insomnia
1. Mở ứng dụng **Postman**.
2. Bấm nút **Import** (góc trên bên trái).
3. Kéo thả 2 tệp tin sau vào:
   - `docs/api/hbdt-api.postman_collection.json`
   - `docs/api/hbdt-local.postman_environment.json`
4. Chọn active environment là **`HBDT Platform (Local Dev)`** ở góc phải trên.

### Bước 2: Cơ chế Tự động Bắt Access Token (Automated Token Capture)
Khi bạn chạy request **`01. Authentication -> Login as Owner`**, script test tự động trích xuất token và gán vào biến môi trường:
```javascript
// Postman Tests Script
var jsonData = pm.response.json();
if (jsonData.data && jsonData.data.access_token) {
    pm.environment.set("token", jsonData.data.access_token);
    console.log("Token updated successfully!");
}
```
Sau đó, mọi request khác trong collection sẽ tự động sử dụng `Bearer {{token}}` mà không cần copy paste thủ công.

---

## 4. Giám sát & Quan trắc Hệ thống (Spring Boot Actuator)

Hệ thống tích hợp `spring-boot-starter-actuator` phục vụ DevOps và Docker healthcheck:

- **Kiểm tra trạng thái sức khỏe (Health Check):**
  ```bash
  curl -X GET http://localhost:8080/actuator/health
  ```
  Phản hồi mẫu:
  ```json
  {
    "status": "UP",
    "components": {
      "db": {
        "status": "UP",
        "details": {
          "database": "MySQL",
          "validationQuery": "isValid()"
        }
      },
      "diskSpace": {
        "status": "UP",
        "details": {
          "total": 510901243904,
          "free": 124982140928,
          "threshold": 10485760,
          "path": "..."
        }
      },
      "ping": {
        "status": "UP"
      }
    }
  }
  ```

- **Xem thông tin ứng dụng (Application Info):**
  ```bash
  curl -X GET http://localhost:8080/actuator/info
  ```

---

## 5. API Phân hệ Trí tuệ Nhân tạo (AI Microservice)

Phân hệ AI chạy độc lập tại cổng `8000` (FastAPI / Python 3.12):

- **Healthcheck:** `GET http://localhost:8000/health` (trả `{"status": "ok"}`)
- **Trạng thái cấu hình LLM:** `GET http://localhost:8000/api/v1/ai/ready`
- **Bóc tách đơn hàng tiếng Việt:**
  ```bash
  curl -X POST http://localhost:8000/api/v1/ai/parse-order \
    -H "Content-Type: application/json" \
    -H "X-API-Secret: <your_ai_service_api_secret>" \
    -d '{"text": "Lấy 2,5 bao xi măng PCB40 cho anh Ba, ghi nợ"}'
  ```
  *Lưu ý: Nếu chưa có `BAI_API_KEY`, hệ thống sẽ kích hoạt bộ phân tích Heuristic Regex Fallback nội bộ để trả kết quả `CREATE_ORDER` trơn tru mà không văng lỗi 503.*
