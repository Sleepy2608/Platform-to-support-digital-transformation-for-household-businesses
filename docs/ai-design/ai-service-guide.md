# AI hỗ trợ tạo đơn hàng — B.ai

## Trạng thái và phạm vi

Hệ thống AI hỗ trợ tạo đơn hàng bằng **B.ai**, không huấn luyện model riêng.
API dùng giao thức Chat Completions tại `https://api.b.ai/v1/chat/completions`.

Đã có:
- Trích xuất câu đặt hàng tiếng Việt cho Employee và Owner bằng model B.ai được cấu hình.
- Đối chiếu sản phẩm, khách hàng, đơn vị, giá và tồn kho từ backend theo tài khoản đăng nhập.
- Hiển thị gợi ý đơn hàng trên trang tạo đơn, cho phép người dùng đưa vào giỏ để chỉnh sửa và xác nhận.
- Tự chọn khách hàng đã tồn tại; tên viết liền/không dấu vẫn được đối chiếu khi chỉ có một kết quả.
- Nếu khách hàng chưa tồn tại, hệ thống chỉ tạo khách hàng khi người dùng bấm đưa gợi ý vào giỏ.
- Lưu gợi ý đơn hàng dưới dạng đơn nháp AI trong database với trạng thái `PENDING` và cho phép từ chối/duyệt lại.
- Phát hiện dữ liệu thiếu, nhiều kết quả phù hợp và lỗi dịch vụ; luôn có luồng nhập thủ công.

**Gợi ý đơn hàng được lưu thành đơn nháp AI trong database với trạng thái `PENDING`.**
Khi người dùng xác nhận giỏ, giao diện gọi `POST /api/sales-orders` hiện có. Backend kiểm tra lại
và ghi đơn, trừ kho, ghi công nợ theo nghiệp vụ hiện có. Nguồn đơn vẫn là POS/ONLINE;
mã đơn bắt đầu bằng AI và ghi chú cho biết có hỗ trợ nhập bằng AI.

Đã triển khai trong lần tích hợp này: lưu nháp trong `ai_order_drafts`, thông báo thời gian thực cho
Owner/Employee cùng hộ khi có đơn nháp mới (`notifyAiDraftCreated` → lưu `notifications` + publish qua
stream sau khi commit), và API nhận xét báo cáo `POST /api/ai/draft-bookkeeping` (chỉ Owner).

Chưa triển khai: nhận giọng nói (STT), hỏi đáp luật có dẫn nguồn, background sync đơn nháp.
Câu hỏi luật đi vào endpoint tạo đơn được phân loại OTHER; endpoint này không trả lời luật.

> Lưu ý phạm vi: sổ kế toán S1/S2/S4 và việc tự động điền biểu mẫu do **backend** tính từ dữ liệu
> nghiệp vụ (`/api/accounting/books`, `/api/accounting/template-reports`), không do AI. AI chỉ viết
> nhận xét cho báo cáo khi Owner yêu cầu.

## Mức độ hoàn thiện / chưa hoàn thiện

### Đã hoàn thiện trong luồng hiện tại
- `POST /api/ai/parse-order` đã hoạt động ở backend và front-end, dùng để trích xuất đơn hàng từ văn bản tiếng Việt.
- `GET /api/ai/drafts` và `POST /api/ai/drafts/{id}/reject` đã có thực thi cho lưu/trạng thái nháp AI.
- `AiOrderDraft` đã lưu `sourceText`, `proposalJson`, `status`, `businessId`, `createdBy`, `reviewedBy` và `reviewedAt` trong database.
- `AiOrderInput` trên frontend đã có UI cho nhập câu, xem đề xuất, xem danh sách draft đang chờ duyệt và từ chối nháp.
- Spring Boot thực hiện resolve dữ liệu thật từ `ProductService`, `CustomerService`, `ProductUnitService` và `ProductPricingService` trước khi trả proposal.
- Quá trình xác nhận cuối cùng vẫn đi qua luồng đặt hàng hiện có của hệ thống, không tự ghi đơn trực tiếp bằng AI.

### Vẫn còn ở dạng prototype / chưa hoàn thiện hoàn toàn
- AI không phải là hệ thống hỏi đáp pháp lý có nguồn; câu hỏi luật được phân loại `OTHER`.
- Chưa có lưu nháp dài hạn ngoài `AiOrderDraft` của hệ thống hiện tại.
- Đã có thông báo thời gian thực khi tạo đơn nháp (`notifyAiDraftCreated` → lưu `notifications` + publish qua stream); chưa có background sync/đồng bộ định kỳ.
- Chưa có nhận diện giọng nói / speech-to-text.
- Chưa có workflow AI độc lập để tạo báo cáo kế toán, cập nhật biểu mẫu pháp lý hoặc điều hành báo cáo tự động; các phần này do backend tính và Owner duyệt.
- Chưa có kiểm thử end-to-end đầy đủ trên môi trường production data để đảm bảo độ chính xác với mọi câu văn bản.

### Kết luận về trạng thái
Luồng AI hiện tại ở mức “production-oriented prototype”: các phần chính đã hoạt động, nhưng chưa thay thế hoàn toàn quy trình đặt hàng thủ công cho mọi trường hợp. Đây là AI hỗ trợ tạo đơn hàng, không phải một workflow tự động hoàn toàn.

## API contract thực tế (khớp DTO Java hiện có)

### 1) `POST /api/ai/parse-order`
Request:

```json
{
  "text": "Lấy 5 bao xi măng Hà Tiên cho anh Ba, ghi nợ"
}
```

Validation:
- `text` không được rỗng
- `text` tối đa 4000 ký tự

Response body khung:

```json
{
  "data": {
    "draftId": 12,
    "status": "PENDING",
    "createdAt": "2026-09-15T10:00:00",
    "provider": "bai",
    "readyToApply": true,
    "customerName": "Anh Ba",
    "customer": {
      "id": 101,
      "customerCode": "KH-001",
      "customerName": "Anh Ba",
      "phone": "0900000000"
    },
    "customerNeedsCreation": false,
    "paymentType": "DEBT",
    "items": [
      {
        "requestedProductName": "xi măng Hà Tiên",
        "quantity": 5,
        "requestedUnit": "bao",
        "product": {
          "id": 11,
          "productCode": "XMHT",
          "productName": "Xi măng Hà Tiên",
          "quantityOnHand": 100
        },
        "units": [
          {
            "unitId": 3,
            "unitName": "bao",
            "unitCode": "BAO"
          }
        ],
        "price": {
          "baseQuantity": 5,
          "unitName": "bao",
          "lineTotal": 2500000
        },
        "issues": []
      }
    ],
    "ambiguities": [],
    "message": "Đơn nháp đã được lưu. Kiểm tra thông tin và xác nhận tại giỏ hàng."
  }
}
```

Lưu ý thực tế:
- `status` là `PENDING`, `REJECTED`, `CONFIRMED` tương ứng với draft workflow.
- `customer` và `product` đều là dữ liệu đã resolve từ backend thực, không phải dữ liệu bốc thăm từ AI.
- `readyToApply` chỉ true khi đủ dữ liệu và không còn vấn đề nghiêm trọng.

### 2) `GET /api/ai/drafts`
Trả về mảng JSON các proposal đang chờ duyệt theo business của người dùng.

### 3) `POST /api/ai/drafts/{id}/reject`
Request:

```json
{
  "reason": "Tên khách hàng không rõ, cần nhập thủ công"
}
```

Validation:
- `reason` không được trống
- tối đa 500 ký tự

### 4) `POST /api/ai/draft-bookkeeping`
API này dùng để dựng báo cáo kế toán dưới dạng draft từ dữ liệu ledger/revenue hiện có, nhưng đây là luồng phụ và chưa phải trung tâm của AI hỗ trợ tạo đơn hàng.

## Architecture decisions / trade-offs

### 1) Chọn B.ai làm provider chính
- Lý do: triển khai nhanh, không cần huấn luyện từ đầu, dễ tích hợp vào luồng hiện có.
- Trade-off: phụ thuộc vào nhà cung cấp, quota, model lifecycle và schema output không được kiểm soát tuyệt đối.
- Tác động thực tế: hệ thống cần có validation chặt ở backend và không làm AI tự ghi dữ liệu trực tiếp.

### 2) Không gửi toàn bộ catalog/database sang AI
- Lý do: giữ riêng dữ liệu business và tránh rò rỉ thông tin, giảm kích thước payload và tăng độ an toàn.
- Trade-off: AI chỉ làm trích xuất ý định, còn backend mới thực hiện lookup dữ liệu thật.
- Tác động: chi phí xử lý tăng ở backend, nhưng độ chính xác và tính kiểm soát tài liệu/tenant tốt hơn.

### 3) Dùng human-in-the-loop trước khi create order
- Lý do: mặc định chỉ tạo draft và proposal; người dùng phải review, chỉnh sửa và xác nhận.
- Trade-off: tốc độ tạo đơn giảm đi nhưng độ an toàn và khả năng kiểm soát sai lệch tăng lên đáng kể.
- Tác động: đây là quyết định cốt lõi của hệ thống hiện tại, phù hợp với sản phẩm quản lý cửa hàng thực tế.

### 4) Dùng AI draft thay vì AI trực tiếp ghi đơn
- Lý do: giữ nguyên quy trình nghiệp vụ cũ của hệ thống (`POST /api/sales-orders`), không phá vỡ logic tồn kho, công nợ và phân quyền.
- Trade-off: tự động hóa của AI bị giới hạn ở giai đoạn đề xuất, không phải toàn bộ workflow.
- Tác động: hệ thống dễ tích hợp hơn, nhưng không tối ưu về tốc độ tự động hoàn toàn.

### 5) Chuyển data resolving về Spring Boot
- Lý do: backend đã có business context, product metadata, pricing và customer resolution logic, nên AI chỉ làm “nhận diện câu” chứ không thay thế toàn bộ nghiệp vụ.
- Trade-off: code business logic được lặp lại ở nhiều layer, và pipeline AI phải biết rõ contract backend.
- Tác động: bảo toàn tính nhất quán dữ liệu, nhưng cần kỹ thuật bảo dưỡng API và schema rõ ràng.

### 6) Dùng `ambiguities` thay vì tự đoán
- Lý do: khi nhiều product/customer khớp hoặc thiếu dữ liệu, hệ thống không tự chọn một phương án ngẫu nhiên.
- Trade-off: người dùng phải làm rõ thêm trong một số trường hợp, tăng thao tác nhưng giảm sai lầm.
- Tác động: chiến lược này hợp với mô hình B2B / Hộ kinh doanh, nơi sai lầm giá hoặc khách hàng rất tốn kém.

### 7) Không xây dựng RAG/luật pháp ngay trong phiên này
- Lý do: hiện tại mục tiêu chính là hỗ trợ đặt hàng, không phải trả lời thông tin pháp lý có dẫn chứng.
- Trade-off: không thể giải quyết câu hỏi liên quan đến luật, biểu mẫu pháp lý hay quyết định dựa trên source text lớn.
- Tác động: AI hiện có giới hạn rõ ràng về chuyên môn và không nên dùng như hệ thống tư vấn pháp lý.

## Rủi ro / hạn chế kiến trúc hiện tại

1. Phụ thuộc mạnh vào provider B.ai
   - Nếu model bị thay đổi, quota hết, hoặc output sai schema, toàn bộ khai thác dữ liệu có thể bị dừng.
   - Cấu hình provider nằm ở biến môi trường và không có lớp abstraction linh hoạt giữa nhiều provider.

2. Không có fallback cho mô hình/khả năng “reasoning đích thực”
   - Hệ thống không có RAG hay bộ tri thức pháp lý rõ ràng; nên các truy vấn luật không thể được xử lý đúng cách theo nghĩa chuyên sâu.

3. Độ tin cậy phụ thuộc vào việc resolve dữ liệu backend
   - Nếu product/customer/pricing service không đồng nhất hoặc dữ liệu cửa hàng không sạch, AI sẽ trả proposal nhưng bất hợp lệ trong thực tiễn.

4. Human-in-the-loop vẫn là bắt buộc
   - AI không tự tạo đơn cuối cùng. Điều này an toàn nhưng làm giảm độ tự động hóa và khiến hiệu suất phụ thuộc nhiều vào thao tác người dùng.

5. Quyết định schema và lỗi có thể bị lệch nếu prompt thay đổi
   - Vì B.ai trả JSON không được code hóa chặt chẽ như contract Java, backend phải thực hiện validate và sanitize dữ liệu rất cẩn thận.

6. Chưa có sự kiểm soát đa business/tenant mạnh mẽ ở mọi layer
   - Mặc dù backend có kiểm tra `businessId`, điểm mòn tiềm ẩn nằm ở việc AI provider hoặc client có thể gửi input nhầm không đúng ngữ cảnh doanh nghiệp nếu không được validate chặt.

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
AI_SERVICE_URL=http://127.0.0.1:8000
AI_SERVICE_API_SECRET=<cùng secret với Code/AI/.env>
AI_SERVICE_TIMEOUT_SECONDS=35
AI_SERVICE_AUTO_START=true
AI_SERVICE_WORK_DIR=../AI
```

Các file `.env` đã được Git bỏ qua. Docker build AI loại trừ `.env` và môi trường Python riêng.
Không đặt B.ai key vào frontend hoặc biến `NEXT_PUBLIC_*`.

## Chạy local trên Windows

Tại thư mục `Code/AI`, dùng Python 3.12 để thiết lập môi trường một lần:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Sau đó chỉ cần chạy `HbdtApplication` trong IntelliJ hoặc khởi động Spring Boot như bình thường.
Ở profile `dev`, backend tự kiểm tra `http://127.0.0.1:8000/health`; nếu AI service chưa chạy,
backend sẽ mở Uvicorn từ `Code/AI/.venv` và đóng tiến trình đó khi backend dừng.
Nếu AI service đã chạy sẵn, backend sử dụng tiến trình hiện có và không mở thêm.

Để tắt cơ chế này, đặt `AI_SERVICE_AUTO_START=false`. Nếu IntelliJ dùng working directory khác,
đặt `AI_SERVICE_WORK_DIR` thành đường dẫn tuyệt đối tới `Code/AI`. Có thể chạy AI thủ công khi cần:

```powershell
.\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000
```

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
