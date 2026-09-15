# AI pipeline spec — hỗ trợ tạo đơn hàng

## Mục tiêu

Pipeline AI hiện tại phục vụ cho luồng tạo đơn hàng bằng câu tiếng Việt. Mục tiêu là giảm thao tác nhập tay cho nhân viên/owner bằng cách:

- nhận văn bản từ người dùng
- trích xuất ý định đặt hàng, sản phẩm, số lượng, đơn vị, khách hàng, hình thức thanh toán
- đối chiếu với dữ liệu thật của cửa hàng trong backend
- trả về một gợi ý đơn hàng có thể xem/chỉnh sửa trước khi đưa vào giỏ
- lưu thành đơn nháp AI để có thể duyệt/từ chối lại sau này

Pipeline đang chạy theo hướng tích hợp B.ai làm provider nhận diện và extraction, không huấn luyện model nội bộ.

## Kiến trúc tổng quan

1. Frontend nhận câu người dùng trên trang tạo đơn.
2. Frontend gọi Spring Boot API: `POST /api/ai/parse-order`.
3. Spring Boot kiểm tra quyền theo tài khoản đang đăng nhập và xác định businessId từ context.
4. Spring Boot gọi service AI nội bộ để gửi text tới Python AI gateway.
5. Python service gửi câu và prompt extraction tới B.ai API.
6. B.ai trả JSON cấu trúc về sản phẩm, số lượng, đơn vị, khách hàng, thanh toán.
7. Spring Boot đối chiếu dữ liệu thật với ProductService, CustomerService, ProductUnitService và ProductPricingService.
8. Hệ thống tạo `AiOrderDraft` lưu trạng thái `PENDING` và trả gợi ý đơn hàng cho người dùng.
9. Người dùng xem, sửa, rồi hoặc đưa gợi ý vào giỏ, hoặc từ chối đơn nháp AI.
10. Khi xác nhận, frontend tiếp tục dùng luồng đặt hàng hiện có của hệ thống (`POST /api/sales-orders`).

## Ràng buộc thiết kế hiện tại

- Không nhận `businessId` / `userId` từ client để chọn dữ liệu cửa hàng.
- Python AI service chỉ nhận `{ text }` và header `X-API-Secret`.
- B.ai không được phép tự ghi dữ liệu vào database hoặc tự tạo đơn hàng.
- Mọi kết quả mơ hồ phải để lại luồng nhập thủ công hoặc yêu cầu người dùng xác nhận.
- Nếu nhiều sản phẩm khớp tên, hệ thống không tự chọn gợi ý đầu tiên.
- Nếu khách hàng không tồn tại, hệ thống chỉ tạo khách hàng khi người dùng quyết định đưa proposal vào giỏ.
- Chỉ người dùng đã đăng nhập với vai trò `BUSINESS_OWNER`, `OWNER`, `EMPLOYEE` mới được gọi API.

## Quy trình pipeline

### 1. Nhận input

Input chính là chuỗi văn bản do user nhập:

```json
{
  "text": "Lấy 5 bao xi măng Hà Tiên cho anh Ba, ghi nợ"
}
```

Không gửi dữ liệu danh mục hoặc toàn bộ database sang B.ai. Chỉ gửi câu người dùng và cấu hình prompt.

### 2. Validate cấu hình và auth

Trước khi gọi AI provider, backend kiểm tra:

- JWT/Authentication hợp lệ
- user thuộc business hợp lệ
- `AI_SERVICE_API_SECRET` được cấu hình
- Python AI service đang chạy hoặc có thể auto-start
- model B.ai được cấu hình trong `.env`

Nếu thiếu cấu hình, hệ thống trả lỗi dạng `BAI_NOT_CONFIGURED` hoặc `SERVICE_NOT_CONFIGURED`.

### 3. Trích xuất bằng AI

Python AI gateway gửi prompt trích xuất tới B.ai. Mục tiêu là trả JSON theo schema rõ ràng:

- `intent`
- `customerName`
- `paymentType`
- `items[]`
- `ambiguities[]`
- `readyToApply`

Prompt phải yêu cầu model trả về dữ liệu ngắn, có cấu trúc JSON, không tự suy luận quá xa ngoài câu gốc.

### 4. Normalize và resolve dữ liệu thật

Sau khi nhận kết quả từ AI, backend thực hiện bước resolve dựa trên dữ liệu thực:

- tìm khách hàng theo tên/phone/compact-name
- tìm sản phẩm theo tên hoặc mã
- kiểm tra đơn vị có phù hợp không
- tính giá theo product pricing service
- kiểm tra tồn kho theo tổng số lượng yêu cầu

Nếu không tìm thấy hoặc trùng lặp, item sẽ đưa vào `issues` và `readyToApply = false`.

### 5. Tạo đơn nháp AI

Khi extraction hợp lệ và đủ dữ liệu, backend tạo `AiOrderDraft`:

- `status = PENDING`
- lưu `sourceText`
- lưu `proposalJson`
- lưu `businessId` và `createdBy`
- gửi notification cho người dùng

Đây là trạng thái chính để người dùng review trước khi đưa gợi ý vào giỏ.

### 6. Review / accept / reject

API hỗ trợ:

- `GET /api/ai/drafts` — danh sách đơn nháp AI đang chờ
- `POST /api/ai/drafts/{id}/reject` — từ chối đơn nháp
- gợi ý đơn hàng được hiển thị lên UI cho người dùng kiểm tra

Nếu người dùng chấp nhận, frontend đưa gợi ý vào giỏ hàng và bắt đầu luồng đặt hàng chuẩn của hệ thống.

### 7. Đặt hàng cuối cùng

AI không ghi trực tiếp hóa đơn. Đơn cuối cùng vẫn đi qua:

- `POST /api/sales-orders`
- kiểm tra business logic cũ
- trừ tồn kho
- ghi công nợ / thanh toán theo nghiệp vụ hiện có
- gán nguồn đơn `POS/ONLINE` và ghi chú AI

## Mẫu response

Response của `POST /api/ai/parse-order` nằm trong envelope `ApiResponse.data` và có cấu trúc tương tự:

```json
{
  "data": {
    "draftId": 12,
    "status": "PENDING",
    "provider": "bai",
    "readyToApply": true,
    "customerName": "Ba",
    "customer": {
      "id": 101,
      "customerCode": "KH-001",
      "customerName": "Anh Ba"
    },
    "paymentType": "DEBT",
    "items": [
      {
        "requestedProductName": "xi măng",
        "quantity": 5,
        "requestedUnit": "bao",
        "product": {
          "id": 11,
          "productName": "Xi măng Hà Tiên",
          "productCode": "XMHT"
        },
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

## Xử lý lỗi

Các lỗi chính hiện tại:

- `BAI_NOT_CONFIGURED` — thiếu key/model
- `BAI_AUTH_FAILED` — key hoặc quyền truy cập sai
- `BAI_QUOTA_EXCEEDED` — giới hạn lượt gọi hoặc quota model
- `BAI_OUTPUT_TRUNCATED` — JSON bị cắt
- `BAI_INVALID_OUTPUT` — cấu trúc JSON không hợp lệ
- `BAI_TIMEOUT` / `BAI_UNAVAILABLE` — provider không phản hồi
- `UNAUTHORIZED` — không có quyền gọi AI service

Không tự retry các gọi có tính phí khi provider trả lỗi vì mục tiêu là tránh tốn quota không cần thiết.

## Mức độ hoàn thiện / chưa hoàn thiện

### Đã hoàn thiện
- Nhập câu tiếng Việt trên UI tạo đơn của owner/employee.
- Gọi backend `POST /api/ai/parse-order` để trích xuất dữ liệu.
- Validate auth, business context và cấu hình AI trước khi gọi provider.
- Resolve sản phẩm, khách hàng, đơn vị và giá dựa trên dữ liệu thật của cửa hàng.
- Lưu proposal dưới dạng `AiOrderDraft` với `PENDING` và cho phép từ chối / duyệt lại.
- Trả lại `ambiguities` và `readyToApply` khi dữ liệu chưa đủ hoặc mơ hồ.

### Chưa hoàn thiện / còn ở dạng prototype
- AI không thay đổi trực tiếp database; chỉ tạo đơn nháp AI và gợi ý cho người dùng review.
- Chưa có multi-turn conversational AI với lịch sử hội thoại dài.
- Chưa có RAG/luật có dẫn nguồn cho hỏi đáp pháp lý.
- Chưa có voice input hoặc OCR.
- Chưa có workflow auto-create bookkeeping/reporting tự động.
- Chưa có end-to-end test full suite trên dataset thật cho mọi loại câu.

### Đánh giá trạng thái
Nhánh AI hiện tại đang là một pipeline hỗ trợ tạo đơn bằng AI có thể dùng thực tế ở mức hỗ trợ, nhưng chưa phải là một hệ thống AI tự động hoàn toàn độc lập. Nói cách khác, AI đóng vai trò “assistant cho người dùng”, không phải “thay thế toàn bộ quy trình nghiệp vụ”.

## API contract thực tế (khớp DTO Java)

### `AiParseOrderRequest`

```json
{
  "text": "Lấy 5 bao xi măng Hà Tiên cho anh Ba, ghi nợ"
}
```

Validation thực tế:
- `text` không được null hoặc rỗng
- tối đa 4000 ký tự

### `AiParseOrderResponse`

```json
{
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
        "productName": "Xi măng Hà Tiên"
      },
      "units": [],
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
```

### `AiDraftRejectRequest`

```json
{
  "reason": "Tên khách hàng không rõ, cần nhập thủ công"
}
```

Validation thực tế:
- `reason` không được rỗng
- tối đa 500 ký tự

### `AiBookkeepingDraftResponse`

```json
{
  "summary": "Tổng hợp báo cáo kế toán",
  "observations": ["Lợi nhuận tăng"],
  "warnings": ["Cần kiểm tra số liệu chậm"]
}
```

## Architecture decisions / trade-offs

### Chọn B.ai làm provider chính
- Tăng tốc triển khai vì không cần huấn luyện model nội bộ.
- Giảm sự phụ thuộc vào đội ngũ ML, nhưng tăng phụ thuộc vào quota và thay đổi API của nhà cung cấp.

### Không gửi catalog/database cho AI
- Backend giữ dữ liệu thương mại và chỉ truyền câu người dùng + prompt.
- Điều này giảm rủi ro bảo mật và giúp model không quyết định sai về sản phẩm khách hàng.
- Trade-off: phần resolve dữ liệu chuyển hoàn toàn sang Spring Boot, làm tăng logic thực thi ở backend.

### Human-in-the-loop là ưu tiên
- AI chỉ sinh proposal, người dùng review trước khi đưa vào giỏ.
- Đây là quyết định an toàn nhất cho nghiệp vụ bán hàng trong hệ thống hộ kinh doanh.
- Trade-off: tốc độ giảm nhưng độ tin cậy tăng lên rõ rệt.

### Dùng draft AI thay vì tạo order trực tiếp
- Đảm bảo quy trình tồn kho, giá, công nợ và quyền truy cập vẫn đi qua logic hiện có.
- Trade-off: AI không tự động hóa toàn bộ nghiệp vụ, chỉ hỗ trợ giai đoạn đầu.

### Không dùng AI làm hệ thống luật / RAG ngay lúc này
- Hiện tài liệu và workflow tập trung vào đặt hàng, không phải phân tích pháp lý chuyên sâu.
- Trade-off: không thể giải quyết câu hỏi theo kiểu “hãy tư vấn luật có dẫn nguồn” ở giai đoạn này.

## Rủi ro / hạn chế kiến trúc hiện tại

1. Rely heavily on a single provider (B.ai).
2. Schema JSON từ AI không được code hóa chặt chẽ như Java DTO.
3. Human review là bắt buộc; AI không tự xác nhận hệ thống.
4. Dữ liệu thật của cửa hàng vẫn quyết định độ chính xác cuối cùng.
5. Chưa có RAG hoặc knowledge layer cho câu hỏi pháp lý/chính sách.
6. Cơ chế draft AI hiện tại mạnh về “assistive workflow”, yếu về “full autonomy”.

## Tài liệu tham khảo

- [docs/ai-design/ai-service-guide.md](docs/ai-design/ai-service-guide.md)
- [docs/ai-design/prompt-templates.md](docs/ai-design/prompt-templates.md)
