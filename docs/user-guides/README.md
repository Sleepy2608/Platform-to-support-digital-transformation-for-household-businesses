# Hướng Dẫn Sử Dụng Hệ Thống — Nền Tảng Hỗ Trợ Chuyển Đổi Số Cho Hộ Kinh Doanh (HBDT Platform User Guides)

| Thông tin | Nội dung |
|---|---|
| **Dự án** | Nền tảng Hỗ trợ Chuyển đổi Số cho Hộ Kinh doanh (HBDT Platform) |
| **Mã issue/ticket** | HBDT-98 |  
| **Môn học** | Lập trình Java / Đồ án phát triển phần mềm |
| **Tài liệu** | Tổng quan Thư mục Hướng dẫn Sử dụng Hệ thống (User Manual Guides) |
| **Phiên bản** | 1.1 — 07/09/2026 |

---

## 1. Giới thiệu thư mục User Guides

Thư mục `docs/user-guides` chứa toàn bộ tài liệu hướng dẫn vận hành và sử dụng hệ thống **Nền tảng Hỗ trợ Chuyển đổi Số cho Hộ Kinh doanh (HBDT Platform)**. Tài liệu được phân chia chi tiết theo **4 vai trò người dùng (Role-Based Access Control - RBAC)** trong hệ thống.

---

## 2. Cấu trúc Tài liệu Hướng dẫn theo Vai trò

| File tài liệu | Vai trò áp dụng | Mô tả ngắn gọn | Đường dẫn giao diện |
|---|---|---|---|
| **[admin-manual-guide.md](file:///d:/Platform-to-support-digital-transformation-for-household-businesses/docs/user-guides/admin-manual-guide.md)** | Quản trị viên hệ thống (`ADMIN`) | Quản lý toàn bộ tài khoản, phê duyệt hộ kinh doanh, quản lý gói thuê bao, giám sát Audit Log và cơ chế mã hóa Seek Data. | `/admin/login`<br>`/admin/accounts`<br>`/admin/seed` |
| **[manager-manual-guide.md](file:///d:/Platform-to-support-digital-transformation-for-household-businesses/docs/user-guides/manager-manual-guide.md)** | Quản lý / Chuyên viên (`MANAGER`) | Phê duyệt hồ sơ hộ kinh doanh, đối soát hóa đơn dịch vụ, quản lý danh mục biểu mẫu Thông tư 88 và thuế khoán. | `/manager` |
| **[owner-manual-guide.md](file:///d:/Platform-to-support-digital-transformation-for-household-businesses/docs/user-guides/owner-manual-guide.md)** | Chủ Hộ Kinh Doanh (`BUSINESS_OWNER`) | Thiết lập cửa hàng, Onboarding gói cước, quản lý sản phẩm & tồn kho, phân quyền nhân viên, bán hàng POS/AI, xuất báo cáo thuế TT88. | `/login`<br>`/onboarding`<br>`/owner/products`<br>`/owner/orders` |
| **[employee-manual-guide.md](file:///d:/Platform-to-support-digital-transformation-for-household-businesses/docs/user-guides/employee-manual-guide.md)** | Nhân viên cửa hàng (`EMPLOYEE`) | Lập đơn bán hàng tại quầy (POS), quét mã vạch, sử dụng trợ lý giọng nói AI, tra cứu giá & cảnh báo tồn kho thấp. | `/login`<br>`/employee/orders`<br>`/employee/inventory-alerts` |

---

## 3. Quy trình Onboarding & Xác thực Chung trên Hệ thống

### 3.1 Quy trình Đăng ký & Onboarding cho Hộ Kinh Doanh Mới
```text
[Trang chủ / Register] ──> [Nhập thông tin Hộ] ──> [Xác thực Email OTP]
                                                          │
[Vào Owner Dashboard] <── [Chọn Gói cước (Free/Pro)] <── [Màn hình /onboarding]
```

1. **Đăng ký tài khoản:** Người dùng truy cập `/register`, nhập thông tin chủ hộ, email và mật khẩu.
2. **Xác thực OTP:** Mã OTP 6 số được gửi về Email (hoặc hiển thị console log trong môi trường dev).
3. **Onboarding (`/onboarding`):** Thiết lập thông tin cửa hàng ban đầu, chọn gói cước dùng thử hoặc mua gói Pro/Basic.
4. **Kích hoạt:** Hệ thống chuyển hướng vào `/owner/products` để bắt đầu quản lý.

### 3.2 Quy trình Quên Mật khẩu (`/forgot-password`)
1. Truy cập `/forgot-password`.
2. Nhập Email / Tên đăng nhập đã đăng ký.
3. Nhập mã OTP xác thực gửi về Email.
4. Đặt lại mật khẩu mới và đăng nhập lại.

---

## 4. Ma trận Phân quyền Chức năng (RBAC Matrix)

| Chức năng / Phân hệ | Quản trị viên (ADMIN) | Quản lý (MANAGER) | Chủ hộ (OWNER) | Nhân viên (EMPLOYEE) |
|---|:---:|:---:|:---:|:---:|
| **Quản lý Tài khoản Hệ thống** | ✅ Toàn quyền | 👁️ Xem danh sách | ❌ Không | ❌ Không |
| **Phê duyệt Hồ sơ Hộ kinh doanh** | ✅ Có | ✅ Có | ❌ Không | ❌ Không |
| **Quản lý Gói Thuê bao (Plans)** | ✅ Cấu hình giá | 👁️ Tra cứu | 🛒 Mua / Nâng cấp | ❌ Không |
| **Cấu hình Cửa hàng & Thuế TT88** | ❌ Không | 👁️ Quản lý mẫu | ✅ Toàn quyền | ❌ Không |
| **Quản lý Nhân viên cửa hàng** | ❌ Không | ❌ Không | ✅ Tạo & Phân quyền | ❌ Không |
| **Quản lý Sản phẩm & Tồn kho** | ❌ Không | ❌ Không | ✅ Toàn quyền | 👁️ Tra cứu tồn |
| **Cảnh báo Tồn kho thấp** | ❌ Không | ❌ Không | ✅ Cấu hình ngưỡng | 👁️ Xem cảnh báo |
| **Lập Đơn bán hàng (POS / AI)** | ❌ Không | ❌ Không | ✅ Có | ✅ Thao tác chính |
| **Xuất Sổ sách Thuế TT88 (S1, S2, S4)** | ❌ Không | ❌ Không | ✅ Xuất S1-HKD, S2-HKD, S4-HKD (PDF/Excel) | ❌ Không |
| **Thao tác Seek Data Mã hóa** | ✅ Cần DB Key | ❌ Không | ❌ Không | ❌ Không |

---

## 5. Danh mục Đường dẫn URL Hệ thống (Route Sitemap)

### 5.1 Khu vực Công khai & Đăng nhập
- `http://localhost:3000/` : Trang chủ giới thiệu nền tảng HBDT.
- `http://localhost:3000/login` : Trang đăng nhập chung cho Hộ kinh doanh, Nhân viên.
- `http://localhost:3000/register` : Trang đăng ký Hộ kinh doanh mới.
- `http://localhost:3000/verify-email` : Trang xác thực OTP Email.
- `http://localhost:3000/forgot-password` : Trang khôi phục mật khẩu.
- `http://localhost:3000/onboarding` : Trang hướng dẫn thiết lập cửa hàng & chọn gói cước ban đầu.

### 5.2 Khu vực Quản trị Hệ thống (`/admin`)
- `http://localhost:3000/admin/login` : Trang đăng nhập Quản trị viên.
- `http://localhost:3000/admin/accounts` : Quản lý tài khoản toàn hệ thống.
- `http://localhost:3000/admin/subscription-plans` : Quản lý các gói thuê bao (Free, Basic, Pro).
- `http://localhost:3000/admin/seed` : Quản lý mã hóa và đồng bộ Seek Data.

### 5.3 Khu vực Chủ Hộ Kinh Doanh (`/owner`)
- `http://localhost:3000/owner/products` : Quản lý sản phẩm, quy tắc giá & giá nhập/bán.
- `http://localhost:3000/owner/orders` : Quản lý đơn hàng, bán hàng POS & trợ lý AI.
- `http://localhost:3000/owner/customers` : Quản lý thông tin khách hàng & sổ nợ.
- `http://localhost:3000/owner/employees` : Quản lý và phân quyền tài khoản nhân viên.
- `http://localhost:3000/owner/inventory-alerts` : Quản lý cảnh báo tồn kho thấp.
- `http://localhost:3000/owner/account` : Cài đặt thông tin hộ kinh doanh, thuế & gói dịch vụ.

### 5.4 Khu vực Nhân Viên Cửa Hàng (`/employee`)
- `http://localhost:3000/employee/orders` : Giao diện bán hàng POS tại quầy & trợ lý AI.
- `http://localhost:3000/employee/inventory-alerts` : Tra cứu danh sách sản phẩm sắp hết hàng.
- `http://localhost:3000/employee/account` : Quản lý tài khoản cá nhân & đổi mật khẩu ca làm việc.
