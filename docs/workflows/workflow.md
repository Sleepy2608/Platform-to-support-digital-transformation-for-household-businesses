# WORKFLOW TỔNG QUÁT
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                LUỒNG NGHIỆP VỤ TỔNG THỂ (END-TO-END)                        │
│                                                                             │
│  ① OWNER: Đăng ký & chọn gói dịch vụ                                        │
│     └──► Public Portal ──► Xác minh SĐT/Email ──► Chọn gói                  │
│          ──► Chuyển sang bước thanh toán hoặc kích hoạt gói miễn phí        │
│                                                                             │
│  ② OWNER: Thanh toán subscription bằng VietQR SePay tự động hoặc Bypass Key │
│     ├──► Gói có phí: Mở modal PaymentQrModal ──► Quét VietQR động SePay     │
│     │    (cú pháp: `HBDT RENEW <businessId> <months>`, STK VietinBank)      │
│     │    └──► Ngân hàng chuyển tiền ──► SePay Webhook bắn về Backend         │
│     │         ──► Backend tự động gia hạn Subscription & sinh ServiceInvoice│
│     │         ──► Frontend Polling tự động phát hiện thành công & reload UI │
│     ├──► Hoặc nhập Bypass Key 20 ký tự ──► Giảm 100% ──► Kích hoạt tức thì  │
│     └──► Gói miễn phí ──► Kích hoạt trực tiếp, không mở modal QR            │
│                                                                             │
│  ③ OWNER: Thiết lập dữ liệu ban đầu                                         │
│     └──► Tạo danh mục sản phẩm (tên, giá, nhiều đơn vị tính)                │
│     └──► Nhập tồn kho ban đầu ──► Inventory ghi StockMovement (loại NHẬP)   │
│     └──► Tạo tài khoản Employee ──► Onboarding & Identity                   │
│                                                                             │
│  ④ KHÁCH HÀNG: Đặt hàng qua 1 trong 2 kênh                                  │
│     ├── (a) Tại quầy: Employee thao tác trực tiếp trên POS                  │
│     └── (b) Từ xa: nhắn Zalo hoặc gọi điện thông qua hệ thống               │
│          └──► Messaging/Voice Channel                                       │
│                                                                             │
│  ⑤ HỆ THỐNG: Nếu kênh (b) — AI Order Service xử lý                          │
│     └──► Channel Adapter chuẩn hoá input, gắn tenantId                      │
│     └──► [Voice] STT chuyển giọng nói → văn bản                             │
│     └──► NLP Parser trích xuất: sản phẩm, số lượng, khách hàng, ghi nợ?     │
│     └──► Matching Product/Customer (gọi Application Tier API)               │
│     └──► Ambiguity Detection + Confidence Scoring                           │
│     └──► Sinh Draft Order → lưu `ai_order_drafts`, trạng thái PENDING       │
│                                                                             │
│  ⚠ Phạm vi đã triển khai: hiện chỉ có kênh (a) tại quầy với ô nhập câu      │
│    văn bản (B.ai). Channel Adapter (Zalo/tổng đài), STT và Confidence       │
│    Scoring mới ở mức thiết kế — xem ghi chú §4.4 của tài liệu kiến trúc.    │
│                                                                             │
│  ⑥ NOTIFICATION SERVICE: Đẩy thông báo realtime                             │
│     └──► WebSocket/Push tới Employee & Owner đang online                    │
│                                                                             │
│  ⑦ EMPLOYEE/OWNER: Xử lý đơn                                                │
│     ├── Kênh (a): tạo đơn trực tiếp, chọn sản phẩm/số lượng/khách hàng      │
│     └── Kênh (b): mở Draft Order ──► Kiểm tra ──► Sửa/Từ chối/Xác nhận      │
│                                                                             │
│  ⑧ ORDER & CHECKOUT: Xử lý transaction (xem chi tiết mục 13.3)              │
│     └──► Trừ tồn kho, ghi Payment hoặc Customer Debt, tạo Accounting Entry  │
│                                                                             │
│  ⑨ HỆ THỐNG: Sinh hoá đơn                                                   │
│     └──► In (nếu có máy in) hoặc xuất ảnh/PDF gửi qua Zalo cho khách hàng   │
│                                                                             │
│  ⑩ ACCOUNTING & COMPLIANCE: Tự động cập nhật sổ sách                        │
│     └──► Ghi Detailed Revenue Ledger, Outstanding Debt Report theo          │
│          Thông tư 88/2021/TT-BTC — không cần Employee/Owner nhập lại        │
│                                                                             │
│  ⑪ OWNER: Theo dõi & thu hồi công nợ                                        │
│     └──► Reporting & Analytics hiển thị doanh thu, tồn kho thấp, công nợ    │
│     └──► Khi khách trả nợ ──► Customer & Debt ghi DebtPayment, cập nhật     │
│          số dư, đồng bộ Accounting Entry tương ứng                          │
└─────────────────────────────────────────────────────────────────────────────┘
```
