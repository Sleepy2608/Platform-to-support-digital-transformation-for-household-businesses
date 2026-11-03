# 🤖 AI MICROSERVICE ARCHITECTURE & DIRECTORY MAP (Python/FastAPI)

**Root path:** `Code/AI/src`

---

## 1. Cấu trúc Source Code

| File / Folder | Nhiệm vụ |
| :--- | :--- |
| `main.py` | Điểm khởi động FastAPI service (cổng mặc định: `8000`), định nghĩa CORS và exception handlers. |
| `config.py` | Quản lý biến môi trường (`Settings`): Khóa bảo mật giao tiếp giữa Spring Boot và AI (`AI_SERVICE_API_SECRET`), URL BAI API, timeout. |
| `models.py` | Schema dữ liệu Pydantic (`AiOrderParseRequest`, `ExtractedOrder`, `ExtractedItem`, `AiDemandForecastRequest`, v.v.). |
| `router.py` | Định nghĩa các endpoint API phục vụ Spring Boot backend: trích xuất đơn hàng từ văn bản/ảnh, dự báo nhu cầu bán hàng. |
| `services/bai_client.py` | Client giao tiếp với dịch vụ nền tảng BAI/Gemini để thực hiện tác vụ sinh ngôn ngữ và xử lý thị giác máy tính (Vision OCR). |
| `services/nlp_parser.py` | Phân tích cú pháp ngôn ngữ tự nhiên từ tin nhắn hoặc ghi chú mua hàng của khách (ví dụ: "lấy 2 thùng bia tiger, 1 cây thuốc 555"). |
| `services/order_builder.py` | Chuyển đổi kết quả trích xuất từ AI thành định dạng `SalesOrder` và `SalesOrderItem` tương thích với Spring Boot. |

---

## 2. Các liên kết đặc biệt (Surprising Connections phát hiện bởi Graphify)

- `main()` ➔ `BaiError`: Tự động bắt và chuẩn hóa lỗi giao tiếp với AI model.
- `BaiClient` ➔ `Settings`: Tự động nạp cấu hình API Secret và URL mô hình.
- `BaiClient` ➔ `ExtractedOrder`: Trực tiếp ánh xạ dữ liệu phản hồi từ AI thành thực thể đơn hàng đã chuẩn hóa để trả về cho Java Spring Boot.

