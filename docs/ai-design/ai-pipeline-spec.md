# AI pipeline spec

## Mục tiêu

Pipeline AI hiện tại phục vụ cho luồng tạo đơn hàng bằng câu tiếng Việt. Mục tiêu là giảm thao tác nhập tay cho nhân viên/owner bằng cách:

- nhận văn bản từ người dùng
- trích xuất ý định đặt hàng, sản phẩm, số lượng, đơn vị, khách hàng, hình thức thanh toán
- đối chiếu với dữ liệu thật của cửa hàng trong backend
- trả về một proposal có thể xem/chỉnh sửa trước khi đưa vào giỏ
- lưu thành draft AI để có thể duyệt/từ chối lại sau này

Pipeline đang chạy theo hướng tích hợp B.ai làm provider nhận diện và extraction, không huấn luyện model nội bộ.

## Kiến trúc tổng quan

1. Frontend nhận câu người dùng trên trang tạo đơn.
2. Frontend gọi Spring Boot API: `POST /api/ai/parse-order`.
3. Spring Boot kiểm tra quyền theo tài khoản đang đăng nhập và xác định businessId từ context.
4. Spring Boot gọi service AI nội bộ để gửi text tới Python AI gateway.
5. Python service gửi câu và prompt extraction tới B.ai API.
6. B.ai trả JSON cấu trúc về sản phẩm, số lượng, đơn vị, khách hàng, thanh toán.
7. Spring Boot đối chiếu dữ liệu thật với ProductService, CustomerService, ProductUnitService và ProductPricingService.
8. Hệ thống tạo `AiOrderDraft` lưu trạng thái `PENDING` và trả proposal cho người dùng.
9. Người dùng xem, sửa, rồi hoặc đưa proposal vào giỏ, hoặc từ chối nháp.
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

### 5. Tạo draft AI

Khi extraction hợp lệ và đủ dữ liệu, backend tạo `AiOrderDraft`:

- `status = PENDING`
- lưu `sourceText`
- lưu `proposalJson`
- lưu `businessId` và `createdBy`
- gửi notification cho người dùng

Đây là trạng thái chính để người dùng review trước khi đưa vào giỏ.

### 6. Review / accept / reject

API hỗ trợ:

- `GET /api/ai/drafts` — danh sách draft đang chờ
- `POST /api/ai/drafts/{id}/reject` — từ chối
- proposal được display lên UI cho người dùng kiểm tra

Nếu người dùng chấp nhận, frontend đưa proposal vào giỏ hàng và bắt đầu luồng đặt hàng chuẩn của hệ thống.

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

## Kết luận hiện trạng

Luồng AI hiện tại đã đi vào trạng thái production-oriented prototype với các phần chính đã hoạt động:

- nhập văn bản tiếng Việt
- extraction qua B.ai
- resolve dữ liệu thật theo business
- tạo draft AI
- review trên UI
- đưa vào giỏ và tiếp tục order workflow cũ

Các phần chưa tích hợp trong phiên hiện tại:

- AI hỏi đáp pháp lý có dẫn nguồn
- lưu nháp lâu dài trên model nền/AI riêng
- hỏi đáp bằng giọng nói
- tự động lập sổ kế toán theo báo cáo thái độ phân tích nâng cao
- workflow AI hoàn toàn độc lập không cần qua giỏ hàng

## Tài liệu tham khảo

- [docs/ai-design/ai-service-guide.md](docs/ai-design/ai-service-guide.md)
- [docs/ai-design/prompt-templates.md](docs/ai-design/prompt-templates.md)
