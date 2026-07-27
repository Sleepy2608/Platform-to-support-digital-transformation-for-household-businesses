```
┌────────────────────────────────────────────────────────────────────────────┐
│                LUỒNG NGHIỆP VỤ TỔNG THỂ (END-TO-END)                       │
│                                                                            │
│  ① OWNER: Đăng ký & kích hoạt dịch vụ                                      │
│     └──► Public Portal ──► Xác minh SĐT/Email ──► Chọn gói ──► Thanh toán  │
│          ──► Subscription & Billing kích hoạt Tenant                       │
│                                                                            │
│  ② OWNER: Thiết lập dữ liệu ban đầu                                        │
│     └──► Tạo danh mục sản phẩm (tên, giá, nhiều đơn vị tính)               │
│     └──► Nhập tồn kho ban đầu ──► Inventory ghi StockMovement (loại NHẬP)  │
│     └──► Tạo tài khoản Employee ──► Onboarding & Identity                  │
│                                                                            │
│  ③ KHÁCH HÀNG: Đặt hàng qua 1 trong 2 kênh                                 │
│     ├── (a) Tại quầy: Employee thao tác trực tiếp trên POS                 │
│     └── (b) Từ xa: nhắn Zalo hoặc gọi điện ──► Messaging/Voice Channel     │
│                                                                            │
│  ④ HỆ THỐNG: Nếu kênh (b) — AI Order Service xử lý                         │
│     └──► Channel Adapter chuẩn hoá input, gắn tenantId                     │
│     └──► [Voice] STT chuyển giọng nói → văn bản                            │
│     └──► NLP Parser trích xuất: sản phẩm, số lượng, khách hàng, ghi nợ?    │
│     └──► Matching Product/Customer (gọi Application Tier API)              │
│     └──► Ambiguity Detection + Confidence Scoring                          │
│     └──► Sinh Draft Order, trạng thái PENDING_REVIEW                       │
│                                                                            │
│  ⑤ NOTIFICATION SERVICE: Đẩy thông báo realtime                            │
│     └──► WebSocket/Push tới Employee & Owner đang online                   │
│                                                                            │
│  ⑥ EMPLOYEE/OWNER: Xử lý đơn                                               │
│     ├── Kênh (a): tạo đơn trực tiếp, chọn sản phẩm/số lượng/khách hàng     │
│     └── Kênh (b): mở Draft Order ──► Kiểm tra ──► Sửa/Từ chối/Xác nhận     │
│                                                                            │
│  ⑦ ORDER & CHECKOUT: Xử lý transaction (xem chi tiết mục 13.3)             │
│     └──► Trừ tồn kho, ghi Payment hoặc Customer Debt, tạo Accounting Entry │
│                                                                            │
│  ⑧ HỆ THỐNG: Sinh hoá đơn                                                  │
│     └──► In (nếu có máy in) hoặc xuất ảnh/PDF gửi qua Zalo cho khách hàng  │
│                                                                            │
│  ⑨ ACCOUNTING & COMPLIANCE: Tự động cập nhật sổ sách                       │
│     └──► Ghi Detailed Revenue Ledger, Outstanding Debt Report theo         │
│          Thông tư 88/2021/TT-BTC — không cần Employee/Owner nhập lại       │
│                                                                            │
│  ⑩ OWNER: Theo dõi & thu hồi công nợ                                       │
│     └──► Reporting & Analytics hiển thị doanh thu, tồn kho thấp, công nợ   │
│     └──► Khi khách trả nợ ──► Customer & Debt ghi DebtPayment, cập nhật    │
│          số dư, đồng bộ Accounting Entry tương ứng                         │
└────────────────────────────────────────────────────────────────────────────┘
```
