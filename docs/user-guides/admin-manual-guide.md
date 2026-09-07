# Hướng Dẫn Sử Dụng Hệ Thống — Vai Trò Quản Trị Viên (System Admin Manual Guide)

| Thông tin | Nội dung |
|---|---|
| **Tài liệu** | Hướng Dẫn Sử Dụng Hệ Thống – Vai Trò Quản Trị Viên (System Admin) |
| **Dự án** | Nền tảng Hỗ trợ Chuyển đổi Số cho Hộ Kinh doanh (HBDT Platform) |
| **Vai trò áp dụng** | Quản trị viên hệ thống (`ADMIN` / System Administrator) |
| **Phiên bản** | 1.1 |
| **Cập nhật lần cuối** | 07/09/2026 |

---

## 1. Giới thiệu tổng quan

Tài liệu này hướng dẫn chi tiết các thao tác vận hành dành riêng cho **Quản trị viên hệ thống (System Admin)** trên Nền tảng Hỗ trợ Chuyển đổi Số cho Hộ Kinh doanh (HBDT Platform). 

Quản trị viên hệ thống nắm giữ quyền hạn cao nhất (Super Admin), chịu trách nhiệm quản lý toàn bộ tài khoản người dùng, giám sát các Hộ kinh doanh đăng ký, quản lý danh mục gói dịch vụ thuê bao (Subscription Plans), theo dõi nhật ký hoạt động (Audit Logs) và quản lý cơ sở dữ liệu mẫu (Seek Data).

---

## 2. Đăng nhập và Truy cập Hệ thống

### 2.1 Địa chỉ truy cập
- **Đường dẫn đăng nhập Admin Web Portal:** `http://localhost:3000/admin/login` (hoặc URL domain production `/admin/login`).

### 2.2 Quy trình đăng nhập
1. Truy cập đường dẫn `http://localhost:3000/admin/login`.
2. Nhập **Tên đăng nhập / Email** (ví dụ: `admin` hoặc `admin@hbdt.com`).
3. Nhập **Mật khẩu** quản trị (Mật khẩu mặc định dev: `admin`).
4. Nhấn nút **Đăng nhập vào Hệ trị**.
5. Sau khi xác thực thành công, hệ thống chuyển hướng trực tiếp đến **Admin Dashboard**.

> [!IMPORTANT]
> **Bảo mật tài khoản Admin:**
> - Tài khoản Admin có quyền hạn truy cập tất cả dữ liệu hệ thống. Sau khi đăng nhập lần đầu, bắt buộc đổi mật khẩu mặc định tại góc phải màn hình tài khoản.
> - Tuyệt đối không chia sẻ tài khoản hoặc mã JWT token cho người khác.

---

## 3. Các chức năng chính của Quản trị viên

### 3.1 Màn hình Dashboard Tổng quan (System Overview)
Màn hình Dashboard cung cấp cái nhìn toàn cảnh về tình hình vận hành của toàn bộ nền tảng:
- **Chỉ số tổng quan:** Tổng số Hộ kinh doanh đang hoạt động, Tổng số tài khoản người dùng, Doanh thu từ các gói thuê bao trong tháng, Số lượng đơn hàng phát sinh trên toàn nền tảng.
- **Biểu đồ tăng trưởng:** Thống kê số lượng Hộ kinh doanh mới đăng ký theo tuần/tháng.
- **Cảnh báo hệ thống:** Thông báo các Hộ kinh doanh sắp hết hạn gói dịch vụ Pro/Basic.

---

### 3.2 Quản lý Tài khoản Người dùng (User Management — `/admin/accounts`)
Cho phép Quản trị viên tìm kiếm, xem chi tiết, khởi tạo và phân quyền cho người dùng trên toàn hệ thống.

#### a. Xem danh sách và Tìm kiếm Người dùng
1. Vào menu **Quản lý người dùng** (`/admin/accounts`) trên thanh điều hướng bên trái.
2. Sử dụng ô tìm kiếm theo **Tên đăng nhập, Email, Số điện thoại hoặc Tên người dùng**.
3. Bộ lọc theo Vai trò (`ADMIN`, `MANAGER`, `BUSINESS_OWNER`, `EMPLOYEE`) và Trạng thái (`ACTIVE`, `INACTIVE`, `LOCKED`).

#### b. Khóa / Mở khóa Tài khoản Người dùng
1. Tại danh sách người dùng, chọn tài khoản cần thao tác.
2. Nhấn nút **Khóa tài khoản** (nếu phát hiện vi phạm điều khoản hoặc gian lận) hoặc **Kích hoạt lại**.
3. Xác nhận lý do khóa tài khoản. Hệ thống tự động vô hiệu hóa toàn bộ JWT Session đang hoạt động của người dùng đó.

#### c. Phân quyền và Nâng cấp Vai trò
- Khởi tạo tài khoản Quản trị viên mới hoặc Quản lý chuyên viên (`MANAGER`).
- Đặt lại mật khẩu (Reset Password) cấp tốc cho người dùng trong trường hợp mất quyền truy cập email.

---

### 3.3 Quản lý Hộ Kinh doanh (Business Management)
Quản lý thông tin pháp lý và trạng thái vận hành của các Hộ kinh doanh tham gia nền tảng.

1. Vào menu **Hộ kinh doanh**.
2. Danh sách hiển thị: Tên hộ kinh doanh, Mã số thuế (MST), Tên chủ hộ, Số điện thoại, Ngày đăng ký, Gói dịch vụ đang sử dụng và Trạng thái xác minh.
3. Thao tác:
   - **Xem hồ sơ chi tiết:** Xem thông tin pháp lý, địa chỉ đăng ký kinh doanh theo địa giới hành chính.
   - **Xác minh Hộ kinh doanh:** Duyệt hồ sơ giấy phép đăng ký kinh doanh đối với các hộ đăng ký gói Pro.
   - **Tạm dừng hoạt động:** Khóa quyền truy cập của toàn bộ hộ kinh doanh khi ngừng hợp đồng dịch vụ.

---

### 3.4 Quản lý Gói Dịch vụ & Tính năng (Subscription Plans & Features — `/admin/subscription-plans`, `/admin/features`)
Cấu hình các gói cước dịch vụ mà Hộ kinh doanh có thể đăng ký (Free, Basic, Pro).

1. Vào menu **Gói dịch vụ** (`/admin/subscription-plans`) và **Quản lý tính năng** (`/admin/features`).
2. **Khởi tạo / Chỉnh sửa Gói:**
   - **Tên gói:** Ví dụ *Gói Khởi nghiệp (Free)*, *Gói Kê khai Thuế (Basic)*, *Gói Chuyên nghiệp AI (Pro)*.
   - **Giá cước:** Thiết lập giá theo tháng / năm (VND).
   - **Giới hạn tài nguyên:** Tối đa số sản phẩm, tối đa số nhân viên cửa hàng, số hóa đơn xuất/tháng.
   - **Tính năng đi kèm:** Bật/tắt tính năng trợ lý AI, xuất báo cáo thuế Thông tư 88, cảnh báo tồn kho tự động.
3. **Duyệt gia hạn / Nâng cấp gói:** Xem lịch sử thanh toán hóa đơn dịch vụ của các Hộ kinh doanh và kích hoạt thời hạn sử dụng.

---

### 3.5 Theo dõi Nhật ký Hoạt động (Audit Log & Security)
Giám sát toàn bộ các thao tác nhạy cảm diễn ra trên nền tảng để đảm bảo tính an toàn dữ liệu và tuân thủ pháp lý.

1. Vào menu **Nhật ký hệ thống (Audit Logs)**.
2. Tra cứu lịch sử thao tác theo:
   - **Thời gian:** Khoảng ngày/giờ thực hiện.
   - **Tài khoản thực hiện:** Username hoặc IP của người thao tác.
   - **Hành động (Action):** `LOGIN`, `CREATE_USER`, `UPDATE_PRICE`, `LOCK_ACCOUNT`, `EXPORT_REPORT`.
3. Xem chi tiết dữ liệu trước và sau khi thay đổi (Before/After JSON payload).

---

### 3.6 Quản lý Dữ liệu Mẫu & Mã hóa Seek Data (Database Seek Service — `/admin/seed`)
Tính năng dành riêng cho Quản trị viên nhằm tạo bản sao lưu snapshot và đồng bộ dữ liệu mẫu hệ thống giữa các môi trường.

1. Vào menu **Seek Data** (`/admin/seed`) trong Admin Web Portal.
2. Nhập **Database Key** (Khóa mã hóa bảo mật của hệ thống).
3. Thao tác:
   - **Snapshot tất cả:** Đọc toàn bộ dữ liệu bảng master (danh mục, gói dịch vụ, cấu hình thuế) và xuất ra file JSON mã hóa lưu tại `Code/Server/seed/`.
   - **Nạp lại (Seek lại):** Nạp lại dữ liệu chuẩn từ các file JSON mã hóa vào cơ sở dữ liệu.
4. **Đảm bảo an toàn:** Các bảng chứa mật khẩu (`users`), mã xác thực (`otp`), hoặc key bảo mật bị chặn hoàn toàn không cho snapshot.

---

## 4. Bảng tóm tắt Quyền hạn và Thao tác của Admin

| Chức năng | Thao tác | Mô tả quyền hạn |
|---|---|---|
| **Quản lý Tài khoản** | Tìm kiếm, Khóa, Mở khóa, Reset Pass | Toàn quyền trên mọi tài khoản `ADMIN`, `MANAGER`, `OWNER`, `EMPLOYEE` |
| **Quản lý Hộ kinh doanh** | Xem chi tiết, Phê duyệt, Tạm dừng | Quản lý thông tin pháp lý và trạng thái hoạt động của Hộ kinh doanh |
| **Quản lý Thuê bao** | Tạo gói, Sửa giá, Cấu hình tính năng | Định hình các gói cước Free / Basic / Pro trên nền tảng |
| **Nhật ký Audit Log** | Tra cứu, Xuất log hệ thống | Xem chi tiết các truy vết thao tác và lịch sử đăng nhập/thay đổi |
| **Seek Data Master** | Snapshot, Restore dữ liệu seed | Mã hóa và đồng bộ dữ liệu mẫu danh mục hệ thống |

---

## 5. Hướng dẫn Xử lý Sự cố Thường gặp

| Triệu chứng | Nguyên nhân | Cách xử lý |
|---|---|---|
| Không đăng nhập được vào Admin Portal | Sai URL hoặc dùng tài khoản thường | Đảm bảo truy cập đúng đường dẫn `/admin/login` và dùng tài khoản vai trò `ADMIN` |
| Báo lỗi "Access Denied" khi bấm Seek Data | Chưa nhập đúng Database Key | Liên hệ Trưởng nhóm phát triển để nhận Database Key chính xác |
| Không thấy dữ liệu Audit Log mới | Đã chọn sai khoảng thời gian lọc | Đặt lại bộ lọc ngày tháng về "Tất cả" hoặc "Hôm nay" |
| Hộ kinh doanh báo không nâng cấp được gói | Hóa đơn thanh toán dịch vụ chưa được xác nhận | Vào menu Gói dịch vụ → Tìm mã hóa đơn dịch vụ và bấm "Xác nhận thanh toán" |
