# Hướng Dẫn Sử Dụng Hệ Thống — Vai Trò Quản Lý / Chuyên Viên (System Manager Manual Guide)

| Thông tin | Nội dung |
|---|---|
| **Tài liệu** | Hướng Dẫn Sử Dụng Hệ Thống – Vai Trò Quản Lý / Chuyên Viên (System Manager) |
| **Dự án** | Nền tảng Hỗ trợ Chuyển đổi Số cho Hộ Kinh doanh (HBDT Platform) |
| **Vai trò áp dụng** | Quản lý / Chuyên viên hỗ trợ (`MANAGER` / System Manager) |
| **Phiên bản** | 1.0 — 07/09/2026 |
| **Cập nhật lần cuối** | 07/09/2026 |

---

## 1. Giới thiệu tổng quan

Tài liệu này hướng dẫn chi tiết các tác nghiệp vận hành và hỗ trợ người dùng dành cho **Quản Lý / Chuyên Viên Hệ Thống (System Manager)** trên Nền tảng HBDT Platform.

Vai trò Quản lý / Chuyên viên hỗ trợ hệ thống chịu trách nhiệm kiểm duyệt hồ sơ Hộ kinh doanh đăng ký, quản lý danh mục dữ liệu chuẩn (loại thuế, biểu mẫu Thông tư 88), xử lý các yêu cầu nâng cấp gói thuê bao và hỗ trợ giải quyết sự cố, tra cứu nhật ký audit log cho khách hàng.

---

## 2. Đăng nhập và Truy cập

### 2.1 Địa chỉ truy cập
- **Đường dẫn đăng nhập:** `http://localhost:3000/admin/login` (hoặc `http://localhost:3000/login` theo phân quyền tài khoản Manager).

### 2.2 Quy trình đăng nhập
1. Truy cập đường dẫn `http://localhost:3000/admin/login`.
2. Nhập **Tên đăng nhập / Email** chuyên viên được cấp.
3. Nhập **Mật khẩu**.
4. Nhấn **Đăng nhập**. Hệ thống điều hướng vào **Manager Portal Dashboard**.

---

## 3. Các chức năng chính của Quản Lý / Chuyên Viên

### 3.1 Tiếp nhận & Kiểm duyệt Hồ sơ Hộ Kinh Doanh mới
Khi có Hộ kinh doanh mới đăng ký hoặc cập nhật hồ sơ giấy phép kinh doanh:
1. Vào menu **Duyệt Hộ kinh doanh** (Business Approvals).
2. Xem danh sách các hồ sơ đang ở trạng thái `PENDING_VERIFICATION`.
3. Nhấp vào từng hồ sơ để đối soát:
   - Tên hộ kinh doanh, Mã số thuế (MST).
   - Ảnh chụp Giấy chứng nhận đăng ký hộ kinh doanh / CCCD chủ hộ.
   - Địa chỉ kinh doanh theo địa giới hành chính.
4. Thao tác xử lý:
   - **Phê duyệt (Approve):** Chuyển trạng thái hộ sang `VERIFIED`. Hộ kinh doanh nhận được thông báo kích hoạt đầy đủ tính năng.
   - **Yêu cầu bổ sung (Request Changes):** Nhập lý do yêu cầu đính kèm lại giấy tờ chưa hợp lệ.
   - **Từ chối (Reject):** Từ chối hồ sơ kèm ghi chú lý do vi phạm.

---

### 3.2 Xử lý Yêu cầu Nâng cấp Gói & Hóa đơn Dịch vụ (Subscription Invoices)
1. Vào menu **Quản lý hóa đơn dịch vụ** (Service Invoices).
2. Lọc danh sách các hóa đơn thanh toán gói thuê bao ở trạng thái `AWAITING_PAYMENT` hoặc `PAID`.
3. Đối soát mã giao dịch chuyển khoản VietQR / MoMo với tài khoản ngân hàng thụ hưởng của nền tảng.
4. Thao tác:
   - Nhấn **Xác nhận thanh toán**: Hệ thống tự động nâng cấp gói dịch vụ (Basic/Pro) và gia hạn thêm số tháng tương ứng cho Hộ kinh doanh.
   - Nhấn **Gửi lại hóa đơn điện tử**: Gửi email biên lai thanh toán dịch vụ cho Chủ hộ kinh doanh.

---

### 3.3 Quản lý Danh mục Chuẩn & Thuế Thông tư 88 (Master Reference Data)
Chuyên viên có nhiệm vụ cập nhật các danh mục tham chiếu theo quy định mới nhất của Nhà nước:
1. Vào menu **Danh mục chuẩn** (Master Data):
   - **Danh mục Loại Thuế (`tax_types`):** Cập nhật tỷ lệ % thuế GTGT và thuế TNCN áp dụng cho từng ngành nghề (Phân phối hàng hóa 1.5%, Dịch vụ 7%, Sản xuất 4.5%,...).
   - **Danh mục Mẫu Biểu Sổ Kế Toán (`report_templates`):** Quản lý cấu trúc 7 mẫu sổ kế toán S1-HKD đến S7-HKD theo Thông tư 88/2021/TT-BTC.
   - **Danh mục Ngành nghề kinh doanh:** Cập nhật bảng mã ngành nghề kinh tế Việt Nam.

---

### 3.4 Hỗ trợ Kỹ thuật & Tra cứu Nhật ký Sự cố (Support & Audit Logs)
Khi nhận được khiếu nại từ Chủ hộ (ví dụ: mất dữ liệu đơn hàng, nhân viên sửa giá bất thường):
1. Vào menu **Nhật ký thao tác (Audit Logs)**.
2. Lọc theo **Mã Hộ kinh doanh (Business ID)** hoặc **Tên đăng nhập** của người dùng cần tra cứu.
3. Chọn khoảng thời gian phát sinh sự việc.
4. Kiểm tra dòng thời gian các thao tác `CREATE`, `UPDATE`, `DELETE`, `PRICE_OVERRIDE` để đối chất và hướng dẫn khách hàng xử lý sự cố.

---

## 4. Ma trận Phân quyền giữa ADMIN và MANAGER

| Chức năng | Quản trị viên (ADMIN) | Quản lý / Chuyên viên (MANAGER) |
|---|:---:|:---:|
| Khóa / Mở khóa tài khoản Quản trị viên khác | ✅ Toàn quyền | ❌ Không có quyền |
| Phê duyệt hồ sơ Hộ kinh doanh | ✅ Có | ✅ Có |
| Xác nhận hóa đơn thanh toán gói dịch vụ | ✅ Có | ✅ Có |
| Cấu hình giá gói dịch vụ thuê bao | ✅ Toàn quyền | 👁️ Chỉ xem |
| Quản lý danh mục thuế & biểu mẫu TT88 | ✅ Toàn quyền | ✅ Thêm / Cập nhật |
| Tra cứu Nhật ký Audit Log | ✅ Toàn hệ thống | ✅ Tra cứu hỗ trợ Hộ kinh doanh |
| Thao tác Seek Data (Snapshot / Restore) | ✅ Cần Database Key | ❌ Không có quyền |

---

## 5. Xử lý Sự cố Nghiệp vụ Thường gặp

| Vấn đề | Nguyên nhân | Cách xử lý |
|---|---|---|
| Hộ kinh doanh đã chuyển khoản nhưng chưa kích hoạt gói Pro | Tiền chưa vào tài khoản hoặc sai nội dung chuyển khoản | Vào menu Hóa đơn dịch vụ, tra cứu mã giao dịch ngân hàng và bấm "Xác nhận kích hoạt thủ công" |
| MST hộ kinh doanh bị báo trùng lặp trên hệ thống | MST này đã được đăng ký bởi tài khoản khác trước đó | Kiểm tra trong danh sách Hộ kinh doanh xem tài khoản cũ có thuộc cùng chủ hộ hay không để hỗ trợ gộp tài khoản |
| Khách hàng khiếu nại không xuất được sổ kế toán S1-HKD | Hộ kinh doanh chưa thiết lập danh mục thuế cho các sản phẩm | Hướng dẫn Chủ hộ vào Quản lý sản phẩm và gán đúng loại thuế áp dụng cho từng mặt hàng |
