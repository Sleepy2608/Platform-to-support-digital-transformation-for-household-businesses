# ⚛️ FRONTEND ARCHITECTURE & DIRECTORY MAP (Next.js)

**Root path:** `Code/Client/src/frontend/app`

---

## 1. Cấu trúc Routing (App Router)

### 1.1. Khu vực Công khai & Xác thực (Public & Auth)
- `/` (`app/page.tsx`): Landing page giới thiệu nền tảng HBDT.
- `/login` (`app/login/page.tsx`): Đăng nhập bằng tài khoản/mật khẩu, điều hướng theo Role.
- `/register` (`app/register/page.tsx`): Đăng ký tài khoản chủ hộ kinh doanh mới.
- `/verify-email` (`app/verify-email/page.tsx`): Xác thực OTP qua email.
- `/forgot-password` (`app/forgot-password/page.tsx`): Quên mật khẩu & cấp lại qua OTP.
- `/onboarding/business-profile`: Điền thông tin hộ kinh doanh lần đầu.
- `/onboarding/package-selection`: Chọn gói dịch vụ ban đầu (kèm modal thanh toán QR).

### 1.2. Phân hệ Chủ hộ kinh doanh (Owner Area - `/owner`)
- `/owner`: Tổng quan bảng điều khiển (Dashboard).
- `/owner/account`: Quản lý tài khoản, thông tin hộ kinh doanh.
- `/owner/account/subscription`: Chi tiết gói dịch vụ đang dùng và thời hạn hết hạn.
- `/owner/account/change-plan`: Nâng cấp / Thay đổi gói dịch vụ (kèm thanh toán).
- `/owner/fast-sales`: Bán hàng nhanh tại quầy (POS) với giao diện tối ưu tốc độ.
- `/owner/orders/new`: Lập đơn bán hàng đầy đủ chi tiết.
- `/owner/orders/history`: Lịch sử đơn hàng, chi tiết đơn, in hóa đơn.
- `/owner/products`: Danh mục sản phẩm, biến thể đơn vị và giá bán.
- `/owner/products/stock-import`: Quản lý phiếu nhập kho và nhập hàng từ file Excel.
- `/owner/inventory`: Xem tồn kho theo thời gian thực và điều chỉnh kho.
- `/owner/inventory-alerts`: Cảnh báo các mặt hàng chạm ngưỡng tồn kho tối thiểu.
- `/owner/customers`: Danh sách khách hàng và quản lý công nợ.
- `/owner/employees`: Quản lý nhân viên của cửa hàng, tạo tài khoản và phân quyền.
- `/owner/revenue`: Báo cáo doanh thu bán hàng theo Thông tư 88.
- `/owner/reports`: Tổng hợp báo cáo tài chính và sổ sách kế toán.
- `/owner/feedback`: Gửi ý kiến phản hồi về hệ thống.

### 1.3. Phân hệ Nhân viên (Employee Area - `/employee`)
- `/employee/fast-sales`: Bán hàng nhanh (POS).
- `/employee/orders/new`: Tạo đơn bán hàng.
- `/employee/orders/history`: Xem đơn hàng trong ca.
- `/employee/inventory`: Xem tồn kho thực tế.
- `/employee/inventory-alerts`: Cảnh báo thiếu hàng.
- `/employee/customers`: Tra cứu thông tin khách hàng.
- `/employee/revenue`: Thống kê doanh thu theo ca.

### 1.4. Phân hệ Quản lý & Quản trị (Manager & Admin)
- `/manager/invoices`: Danh sách hóa đơn dịch vụ hệ thống.
- `/manager/analytics`: Phân tích số liệu hộ kinh doanh.
- `/manager/feedback`: Tiếp nhận góp ý của người dùng.
- `/admin/accounts`: Quản lý tài khoản toàn hệ thống.
- `/admin/subscription-plans`: Cấu hình danh mục gói dịch vụ SaaS (giá, tính năng).
- `/admin/features`: Cấu hình danh mục tính năng (`FeatureGate`).
- `/admin/report-templates`: Thiết kế và kích hoạt mẫu báo cáo thuế theo quy định nhà nước.
- `/admin/analytics`: Phân tích tăng trưởng và hiệu năng toàn sàn.
- `/admin/seed`: Quản lý công cụ seed dữ liệu thử nghiệm.

---

## 2. Thư viện Component & ViewModel dùng chung (`components/` & `lib/`)

- `components/payment/PaymentQrModal.tsx`: Modal quét mã QR chuyển khoản ngân hàng (SePay / VietQR):
  * **2 chế độ xem QR:** Chuyển đổi giữa Mã QR gốc chính chủ VietinBank (`/images/qr-code.jpg`) và Mã VietQR động tự động điền tiền (`img.vietqr.io`).
  * **Polling đa tầng:** Tự động lắng nghe biến động số dư qua `GET /api/owner/subscriptions/current` với cờ `{ skipCache: true }` mỗi 3 giây, giải mã dữ liệu an toàn (`res` / `res.data`).
  * **Nút chủ động kiểm tra:** Nút "Kiểm tra giao dịch / Xác nhận" gửi request kiểm tra biến động số dư tức thì.
  * **Timeout & Tự phục hồi:** Giới hạn 10 phút kèm hướng dẫn đối soát; tự động lưu cờ `onboardingCompleted` khi thanh toán thành công trong luồng đăng ký.
  * **Bypass Key:** Khung áp dụng mã giảm giá 100% 20 ký tự kích hoạt tức thì.
- `components/payment/CustomerDebtCard.tsx`: Thẻ hiển thị công nợ khách hàng và lịch sử thanh toán.
- `components/fast-sales/FastSalesView.tsx`: Giao diện POS bán hàng nhanh.
- `lib/apiClient.ts`: Client HTTP trung tâm quản lý tự động làm mới JWT token, đồng bộ tab (`BroadcastChannel`), cache GET (bỏ qua khi dùng `skipCache: true`) và xử lý lỗi 401/403.
- `lib/useEntitlement.ts` & `FeatureGate.tsx`: Hook và wrapper kiểm tra quyền truy cập tính năng theo gói cước hiện tại.

