# Prompt templates cho AI hỗ trợ tạo đơn hàng

## Mục đích

File này ghi lại các mẫu prompt đang dùng hoặc nên dùng để hỗ trợ tạo đơn hàng từ văn bản tiếng Việt. Mục tiêu là giữ cấu trúc response ổn định, tránh mô tả mơ hồ, và không để model tự sinh thêm thông tin không có trong câu người dùng.

## Prompt hệ thống

```text
Bạn là trợ lý hỗ trợ tạo đơn hàng cho hệ thống quản lý bán hàng của hộ kinh doanh.

Nhiệm vụ:
- Đọc câu tiếng Việt của người dùng.
- Trích xuất thông tin cần thiết để tạo đơn hàng.
- Chỉ trả về dữ liệu theo schema JSON bắt buộc.
- Không suy đoán quá xa câu gốc.
- Nếu không chắc chắn, hãy ghi rõ vào ambiguities thay vì đoán giá trị.
- Nếu câu không yêu cầu tạo đơn, trả intent = "OTHER" hoặc "UNKNOWN".

Yêu cầu:
1. Tách các mặt hàng.
2. Với mỗi mặt hàng: productName, quantity, unit.
3. Xác định customerName nếu câu có nhắc tên người mua / người nhận.
4. Xác định paymentType: CASH, TRANSFER, DEBT, UNKNOWN.
5. Nếu thiếu dữ liệu cần thiết, ghi vào ambiguities.
6. Luôn trả về JSON hợp lệ, không markdown, không giải thích thêm.
```

## Prompt người dùng / input mẫu

```text
Câu người dùng:
"Lấy 5 bao xi măng Hà Tiên cho anh Ba, ghi nợ"

Trả về JSON theo schema sau:
{
  "intent": "CREATE_ORDER",
  "customerName": "Anh Ba",
  "paymentType": "DEBT",
  "items": [
    {
      "productName": "xi măng Hà Tiên",
      "quantity": 5,
      "unit": "bao"
    }
  ],
  "ambiguities": [],
  "readyToApply": true
}
```

## Schema JSON mục tiêu

```json
{
  "intent": "CREATE_ORDER",
  "customerName": "string | null",
  "paymentType": "CASH | TRANSFER | DEBT | UNKNOWN",
  "items": [
    {
      "productName": "string",
      "quantity": 1,
      "unit": "string | null"
    }
  ],
  "ambiguities": ["string"],
  "readyToApply": true
}
```

## Rule cần nhấn mạnh trong prompt

### 1. Không tự tạo thông tin mới

Model không được suy đoán:

- tên khách hàng không có trong câu
- thương hiệu sản phẩm không đúng với câu nói
- đơn vị không được mô tả rõ
- hình thức thanh toán nếu không đủ căn cứ

Khi không chắc, trả về `ambiguities` và `readyToApply: false`.

### 2. Khác biệt giữa name và quantity

Ví dụ câu: `Lấy 5 bao xi măng cho anh Ba` phải phân biệt:

- `quantity = 5`
- `customerName = Anh Ba`
- `productName = xi măng`
- `unit = bao`

Không được lẫn số `Ba` với số lượng.

### 3. Không tự chọn nếu chưa chắc chắn

Khi có nhiều sản phẩm trùng tên hoặc nhiều khách hàng tương đồng, phải dùng `ambiguities` thay vì tự chọn một kết quả ngẫu nhiên.

### 4. Không dùng dữ liệu từ provider để tạo đơn trực tiếp

Provider B.ai chỉ trích xuất; hệ thống phải tiếp tục resolve dữ liệu thật trong database của cửa hàng trước khi đưa gợi ý vào giỏ.

## Mẫu prompt cho trường hợp thiếu dữ liệu

```text
Nếu câu thiếu sản phẩm, đơn vị, số lượng hoặc khách hàng, hãy không đoán. Thay vào đó:
- giữ productName nếu có thể suy ra
- đặt quantity = null nếu thiếu
- đặt customerName = null nếu không xác định
- thêm mô tả vào ambiguities
- đặt readyToApply = false
```

## Mẫu prompt cho trường hợp hỏi luật / không phải đặt hàng

```text
Nếu câu không phải lệnh tạo đơn mua hàng, trả về:
{
  "intent": "OTHER",
  "customerName": null,
  "paymentType": "UNKNOWN",
  "items": [],
  "ambiguities": ["Câu không phải yêu cầu tạo đơn hàng."],
  "readyToApply": false
}
```

## Ghi chú thực thi hiện tại

- Provider đang dùng là B.ai, model `qwen3.8-flash`.
- Service không gửi toàn bộ product catalog hay customer list sang B.ai.
- Prompt cần ngắn, rõ, và kiểm soát JSON để tránh output quá dài hoặc bị cắt.
- Nếu output bị truncation hoặc JSON không hợp lệ, hệ thống phải trả về lỗi `BAI_OUTPUT_TRUNCATED` / `BAI_INVALID_OUTPUT` thay vì cố gắng sửa dữ liệu ẩn.

## Tài liệu liên quan

- [docs/ai-design/ai-service-guide.md](docs/ai-design/ai-service-guide.md)
- [docs/ai-design/ai-pipeline-spec.md](docs/ai-design/ai-pipeline-spec.md)
