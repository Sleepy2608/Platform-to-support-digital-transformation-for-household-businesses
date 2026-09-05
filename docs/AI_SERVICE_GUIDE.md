# AI service — B.ai

## Trạng thái và phạm vi

Tích hợp model có sẵn qua **B.ai**, không huấn luyện model.
API dùng giao thức Chat Completions tại `https://api.b.ai/v1/chat/completions`.

Đã có:
- Trích xuất câu đặt hàng tiếng Việt cho Employee và Owner bằng model B.ai được cấu hình.
- Đối chiếu sản phẩm, khách hàng, đơn vị, giá và tồn kho từ backend theo tài khoản đăng nhập.
- Hiển thị bản đề xuất trên trang tạo đơn, đưa vào giỏ để chỉnh sửa và xác nhận.
- Phát hiện dữ liệu thiếu, nhiều kết quả phù hợp và lỗi dịch vụ; luôn có luồng nhập thủ công.

**Bản đề xuất chỉ nằm trong phản hồi/trạng thái giao diện, chưa được lưu thành đơn DRAFT trong database.**
Khi người dùng xác nhận giỏ, giao diện gọi `POST /api/sales-orders` hiện có. Backend kiểm tra lại
và ghi đơn, trừ kho, ghi công nợ theo nghiệp vụ hiện có. Nguồn đơn vẫn là POS/ONLINE;
mã đơn bắt đầu bằng AI và ghi chú cho biết có hỗ trợ nhập bằng AI.

Chưa triển khai trong lần tích hợp này: lưu nháp lâu dài, thông báo nháp thời gian thực,
nhận giọng nói, hỏi đáp luật có dẫn nguồn, tự động lập sổ kế toán và cập nhật biểu mẫu pháp lý.
Câu hỏi luật đi vào endpoint tạo đơn được phân loại OTHER; endpoint này không trả lời luật.

## Dữ liệu đến từ đâu?

1. Frontend gửi **chỉ câu người dùng nhập** tới Spring Boot, kèm phiên đăng nhập hiện có.
2. Spring Boot xác định hộ kinh doanh từ tài khoản. Nó gửi câu tới Python qua kết nối nội bộ có secret.
3. Python gửi câu và hướng dẫn trích xuất tới B.ai `POST /v1/chat/completions`.
4. B.ai trả tên được nhắc tới, số lượng, đơn vị và kiểu thanh toán. Python kiểm tra cấu trúc.
5. Spring Boot gọi trực tiếp ProductService, CustomerService, ProductUnitService và
   ProductPricingService để tra dữ liệu thật. **Không gửi toàn bộ danh mục hoặc database tới B.ai.**
6. Người dùng xem, sửa và xác nhận. B.ai không tự ghi database hoặc tính giá bán.

B.ai không tự có danh sách khách hàng, sản phẩm hoặc bộ văn bản luật riêng của dự án.
Muốn hỏi đáp luật cần nguồn văn bản được kiểm tra, thông tin hiệu lực và bước tìm tài liệu (RAG).
Tên nhà cung cấp không phải bằng chứng về vùng lưu trữ của API; xác nhận vùng xử lý/lưu trữ với B.ai.

## Cấu hình

Tạo `Code/AI/.env` từ `.env.example` nếu chưa có:

```dotenv
BAI_API_KEY=<key tạo tại https://chat.b.ai/key>
BAI_MODEL=qwen3.8-flash
BAI_BASE_URL=https://api.b.ai/v1
BAI_TIMEOUT_SECONDS=25
AI_SERVICE_API_SECRET=<secret ngẫu nhiên dùng chung với backend>
```

`BAI_MODEL` phải khớp chính xác ID từ `GET https://api.b.ai/v1/models`.
Cấu hình local hiện dùng `qwen3.8-flash`, có trong danh sách model của key mới.
Model này đang được B.ai miễn phí API theo chương trình ưu đãi, khác với `qwen3.8-27b`.
Xem [chính sách ưu đãi](https://docs.b.ai/llmservice/promotions-and-pricing-notices/)
trước khi đổi model hoặc khi chương trình kết thúc; không mặc định mọi model đều miễn phí.
Danh sách model trả thành công chỉ xác nhận quyền truy cập danh sách;
cần gọi thử để xác nhận model thực sự xử lý được yêu cầu.
Với `qwen3.8-flash`, client gửi `enable_thinking=false` để trích xuất JSON ngắn,
tránh suy luận dài gây quá thời gian chờ. Service chỉ gọi model được cấu hình.
Không ghi key vào tài liệu hoặc mã nguồn. Các biến `FPT_*` cũ không còn được đọc.
Giữ nguyên `AI_SERVICE_API_SECRET` dùng chung giữa Python và backend khi chuyển nhà cung cấp.

Trong `Code/Server/.env`:

```dotenv
AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_API_SECRET=<cùng secret với Code/AI/.env>
AI_SERVICE_TIMEOUT_SECONDS=35
```

Các file `.env` đã được Git bỏ qua. Docker build AI loại trừ `.env` và môi trường Python riêng.
Không đặt B.ai key vào frontend hoặc biến `NEXT_PUBLIC_*`.

## Chạy local trên Windows

Tại thư mục `Code/AI`, dùng Python 3.12:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Môi trường `.venv` đã được tạo và cài thư viện trong phiên tích hợp này.
Có thể bỏ qua hai lệnh đầu nếu đang dùng workspace hiện tại.

Khởi động backend theo cấu hình database của dự án bằng Java 21, sau đó chạy frontend.
Chủ hộ mở `/owner/orders/new`; nhân viên mở `/employee/orders/new`.
AI xuất hiện trực tiếp trên trang tạo đơn của cả hai vai trò. Backend chỉ chấp nhận
BUSINESS_OWNER/OWNER/EMPLOYEE đã đăng nhập trước khi gọi B.ai.
Nhập tên sản phẩm, đơn vị và khách hàng có thật trong cửa hàng, ví dụ:

> Lấy 5 bao xi măng Hà Tiên cho anh Ba, ghi nợ

Nếu không khớp hoặc trùng tên, nhập tên/mã cụ thể hơn hoặc dùng phần chọn hàng thủ công.
Nếu câu không nói đơn vị, backend tự dùng đơn vị cơ sở đã cấu hình của sản phẩm.
Nếu câu có nói đơn vị thì đơn vị đó vẫn phải khớp, hệ thống không tự đổi sang đơn vị khác.
Nếu giỏ đã có hàng, cần hoàn tất hoặc xóa giỏ trước khi đưa bản đề xuất AI mới vào.

Với Docker Compose, truyền file cấu hình khi tạo các container:

```powershell
docker compose --env-file Code/AI/.env up --build
```

Lệnh Compose khởi động cả các dịch vụ của dự án và cần các cấu hình hiện có của chúng.
Chưa xác nhận toàn bộ stack Compose trong phiên này.

## API

Frontend -> Spring Boot:

```http
POST /api/ai/parse-order
Authorization: Bearer <JWT của ứng dụng>
Content-Type: application/json

{"text":"Lấy 5 bao xi măng cho anh Ba, ghi nợ"}
```

Response nằm trong envelope `ApiResponse.data`, theo quy ước hiện có của frontend:
- `readyToApply`: chỉ true khi dữ liệu cần thiết đã được đối chiếu và không còn vấn đề.
- `customer`, `items[].product`, `items[].units`, `items[].price`: dữ liệu backend.
- `ambiguities`: các điểm cần làm rõ; không tự chọn kết quả đầu tiên khi trùng tên.
- `message`: thông báo đây là bản đề xuất chưa lưu.

Không nhận `businessId`/`userId` từ client để chọn dữ liệu cửa hàng.
AI Python chỉ nhận `{text}` và yêu cầu header `X-API-Secret`.
Các API `/api/orders/ai/draft`, `/api/orders/ai/confirm`, `/api/products/list`,
`/api/customers/search` từng được gọi trong bản thử cũ không được sử dụng nữa.
`nlp_parser.py` và `order_builder.py` cũ được giữ để tham khảo, không nằm trong luồng chạy B.ai.

## Kiểm tra và thử API thật

Tại `Code/AI`:

```powershell
# Không gọi B.ai, không sử dụng số dư
.\.venv\Scripts\python.exe -m unittest discover -s tests -v

# Một lần gọi thật; giá theo model và chương trình ưu đãi hiện hành của B.ai
.\.venv\Scripts\python.exe scripts/try_bai.py

# Năm câu mẫu gọi API thật
.\.venv\Scripts\python.exe scripts/try_bai.py --suite
```

Bộ thử mô phỏng kiểm tra xác thực, câu rỗng, audio chưa hỗ trợ, JSON sai, model tự thêm giá,
số lượng âm, kết quả bị cắt, thiếu key, timeout và việc không lộ phản hồi thô của nhà cung cấp.

Tại `Code/Server`:

```powershell
.\mvnw.cmd "-Dtest=AiServiceTest,AiExtractionClientTest,AiQuantityValidationTest,ProductPricingServiceTest" test
```

Backend kiểm tra ghép dữ liệu theo tài khoản, không tự chọn khi trùng, không đổi tạ thành tấn,
kiểm tra tổng tồn kho khi một sản phẩm xuất hiện nhiều dòng và ánh xạ snake_case Python sang Java.
API tính giá chấp nhận tối đa 3 chữ số thập phân; service vẫn chỉ cho phép số lẻ với kg/lít.

Kết quả kiểm tra B.ai ngày 04/09/2026:
- `qwen3.8-flash` đã trích xuất đúng câu mẫu: anh Ba / 5 bao xi măng / DEBT, khoảng 0,95 giây.
- Đã thử thành công câu sửa số lượng, nhiều mặt hàng và số thập phân, phân biệt số ba với tên Ba.
- Câu hỏi luật trả `OTHER`, danh sách hàng rỗng; tổng cộng 5/5 câu thử API thật đạt yêu cầu.
- Lỗi HTTP 400 `insufficient_user_quota` được chuyển thành `BAI_QUOTA_EXCEEDED`;
  lỗi này từng xuất hiện khi thử model `qwen3.8-27b`, không phải bằng chứng model Flash cần nạp tiền.
- Chưa chạy luồng xác nhận đơn trên database thật trong lần chuyển nhà cung cấp này.
Kết quả trên câu mẫu không phải cam kết về độ chính xác hay thời gian phản hồi cho mọi câu.
Các kiểm thử mô phỏng chạy không cần key và không dùng số dư, không thay cho kiểm tra API thật.

## Lỗi thường gặp

| Tình huống | Cách xử lý |
|---|---|
| `BAI_NOT_CONFIGURED` | Điền key và model trong `Code/AI/.env`, khởi động lại Python. |
| `BAI_AUTH_FAILED` | Kiểm tra key còn hiệu lực và model đã được key cấp quyền. |
| `BAI_QUOTA_EXCEEDED` | Kiểm tra model có thuộc ưu đãi miễn phí, số dư nếu dùng model trả phí, hoặc giới hạn lượt gọi; có thể xuất phát từ HTTP 400 `insufficient_user_quota`, 402 hoặc 429. |
| `BAI_OUTPUT_TRUNCATED` | Nhập câu ngắn hơn; phản hồi chưa hoàn chỉnh không được dùng để tạo đơn. |
| `BAI_INVALID_OUTPUT` | Model trả sai cấu trúc; sửa câu hoặc dùng thao tác thủ công. |
| `BAI_TIMEOUT` / `BAI_UNAVAILABLE` | Thử lại thủ công khi cần; service không tự lặp các lượt gọi có tính phí. |
| AI health configured nhưng gọi lỗi | Health chỉ kiểm tra cấu hình, không thử key/số dư bằng lượt gọi có tính phí. |

## Nguồn tích hợp

- [B.ai API reference](https://docs.b.ai/llmservice/api/)
- [Ưu đãi và thay đổi giá](https://docs.b.ai/llmservice/promotions-and-pricing-notices/)
- [Model Qwen3.8-Flash](https://docs.b.ai/llmservice/models/qwen3-8-flash/)
- [Trang quản lý API key](https://chat.b.ai/key)
