# Hướng Dẫn Sử Dụng Hệ Thống — Nền Tảng Hỗ Trợ Chuyển Đổi Số Cho Hộ Kinh Doanh (HBDT Platform User Guides)

| Thông tin | Nội dung |
|---|---|
| **Dự án** | Nền tảng Hỗ trợ Chuyển đổi Số cho Hộ Kinh doanh (HBDT Platform) |
| **Mã issue/ticket** | HBDT-98 |  
| **Môn học** | Lập trình Java / Đồ án phát triển phần mềm |
| **Tài liệu** | Tổng quan Thư mục Hướng dẫn Sử dụng Hệ thống (User Manual Guides) |
| **Phiên bản** | 1.2 — 10/09/2026 |

---

## 1. Giới thiệu thư mục User Guides

Thư mục `docs/user-guides` chứa toàn bộ tài liệu hướng dẫn vận hành và sử dụng hệ thống **Nền tảng Hỗ trợ Chuyển đổi Số cho Hộ Kinh doanh (HBDT Platform)**. Tài liệu được cập nhật theo trạng thái hiện tại của repo, bao gồm các tính năng mới trong 2 tuần gần đây như quản lý gói đăng ký của Owner, revenue ledger, stock import, bookkeeping tự động và xử lý JWT 401/refresh token.

---

## 2. Cấu trúc Tài liệu Hướng dẫn theo Vai trò

| File tài liệu | Vai trò áp dụng | Mô tả ngắn gọn | Đường dẫn giao diện |
|---|---|---|---|
| **[admin-manual-guide.md](file:///d:/Platform-to-support-digital-transformation-for-household-businesses/docs/user-guides/admin-manual-guide.md)** | Quản trị viên hệ thống (`ADMIN`) | Quản lý toàn bộ tài khoản, phê duyệt hộ kinh doanh, quản lý gói thuê bao, giám sát Audit Log và cơ chế mã hóa Seek Data. | `/admin/login`<br>`/admin/accounts`<br>`/admin/seed` |
| **[manager-manual-guide.md](file:///d:/Platform-to-support-digital-transformation-for-household-businesses/docs/user-guides/manager-manual-guide.md)** | Quản lý / Chuyên viên (`MANAGER`) | Phê duyệt hồ sơ hộ kinh doanh, quản lý gói đăng ký của Owner, theo dõi revenue ledger, kiểm tra stock import và bookkeeping, hỗ trợ thanh toán / xác nhận gói. | `/login`<br>`/manager`<br>`/manager/invoices` |
| **[owner-manual-guide.md](file:///d:/Platform-to-support-digital-transformation-for-household-businesses/docs/user-guides/owner-manual-guide.md)** | Chủ Hộ Kinh Doanh (`BUSINESS_OWNER`) | Thiết lập cửa hàng, Onboarding gói cước, quản lý sản phẩm & tồn kho, phân quyền nhân viên, bán hàng POS/AI, xem lịch sử đơn hiệu, xuất báo cáo thuế TT88. | `/login`<br>`/onboarding/business-profile`<br>`/onboarding/package-selection`<br>`/owner/products`<br>`/owner/orders`<br>`/owner/revenue` |
| **[employee-manual-guide.md](file:///d:/Platform-to-support-digital-transformation-for-household-businesses/docs/user-guides/employee-manual-guide.md)** | Nhân viên cửa hàng (`EMPLOYEE`) | Lập đơn bán hàng tại quầy (POS), quét mã vạch, dùng trợ lý AI (nhập câu văn bản) tạo và xử lý đơn nháp, tra cứu giá & cảnh báo tồn kho thấp. | `/login`<br>`/employee/orders`<br>`/employee/inventory-alerts` |

---

## 3. Quy trình Onboarding & Xác thực Chung trên Hệ thống

### 3.1 Quy trình Đăng ký & Onboarding cho Hộ Kinh Doanh Mới
```text
[Trang chủ / Register] ──> [Nhập thông tin Hộ] ──> [Xác thực Email OTP]
                                                          │
[Vào Owner Dashboard] <── [Chọn Gói cước (Free/Pro)] <── [Màn hình Onboarding]
```

1. **Đăng ký tài khoản:** Người dùng truy cập `/register`, nhập thông tin chủ hộ, email và mật khẩu.
2. **Xác thực OTP:** Mã OTP 6 số được gửi về Email (hoặc hiển thị console log trong môi trường dev).
3. **Onboarding (`/onboarding/business-profile` → `/onboarding/package-selection`):** Thiết lập thông tin cửa hàng ban đầu, chọn gói cước dùng thử hoặc mua gói Pro/Basic.
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
| **Sổ kế toán & Thuế TT88 (S1, S2, S4)** | ❌ Không | ❌ Không | ✅ Lập sổ, kiểm tra/duyệt báo cáo, ghi nhận nộp thuế | ❌ Không |
| **Quản lý Biểu mẫu Báo cáo Kế toán** | ✅ Tạo mẫu & phát hành phiên bản | ❌ Không | 👁️ Xem biểu mẫu đang hiệu lực | ❌ Không |
| **Thao tác Seek Data Mã hóa** | ✅ Cần DB Key | ❌ Không | ❌ Không | ❌ Không |

---

## 5. Danh mục Đường dẫn URL Hệ thống (Route Sitemap)

### 5.1 Khu vực Công khai & Đăng nhập
- `http://localhost:3000/` : Trang chủ giới thiệu nền tảng HBDT.
- `http://localhost:3000/login` : Trang đăng nhập chung cho Hộ kinh doanh, Nhân viên.
- `http://localhost:3000/register` : Trang đăng ký Hộ kinh doanh mới.
- `http://localhost:3000/verify-email` : Trang xác thực OTP Email.
- `http://localhost:3000/forgot-password` : Trang khôi phục mật khẩu.
- `http://localhost:3000/onboarding/business-profile` : Thiết lập hồ sơ cửa hàng ban đầu.
- `http://localhost:3000/onboarding/package-selection` : Chọn gói cước ban đầu (dùng thử hoặc gói trả phí).

### 5.2 Khu vực Quản trị Hệ thống (`/admin`)
- `http://localhost:3000/admin/login` : Trang đăng nhập Quản trị viên.
- `http://localhost:3000/admin` : Dashboard quản trị tổng quan.
- `http://localhost:3000/admin/accounts` : Quản lý tài khoản toàn hệ thống.
- `http://localhost:3000/admin/analytics` : Xem Platform Analytics của toàn nền tảng.
- `http://localhost:3000/admin/announcements` : Phát thông báo toàn hệ thống.
- `http://localhost:3000/admin/features` : Quản lý danh mục tính năng (Feature Plans) gán vào gói thuê bao.
- `http://localhost:3000/admin/feedback` : Theo dõi và xử lý phản hồi từ Owner/Employee.
- `http://localhost:3000/admin/profile` : Hồ sơ và đổi mật khẩu quản trị viên.
- `http://localhost:3000/admin/subscription-plans` : Quản lý các gói thuê bao (Free, Basic, Pro).
- `http://localhost:3000/admin/report-templates` : Quản lý biểu mẫu báo cáo kế toán và phiên bản theo ngày hiệu lực.
- `http://localhost:3000/admin/templates` : Quản lý biểu mẫu báo cáo tài chính.
- `http://localhost:3000/admin/seed` : Quản lý mã hóa và đồng bộ Seek Data.

### 5.3 Khu vực Chủ Hộ Kinh Doanh (`/owner/*`)
- `http://localhost:3000/owner/account` : Cài đặt thông tin hộ kinh doanh, thuế & gói dịch vụ — **route mặc định sau khi chủ hộ đăng nhập**.
- `http://localhost:3000/owner/account/subscription` : Xem, chọn và xác nhận gói thuê bao / gia hạn dịch vụ.
- `http://localhost:3000/owner/products` : Quản lý sản phẩm, quy tắc giá & giá nhập/bán.
- `http://localhost:3000/owner/products/stock-import` : Danh sách phiếu nhập kho.
- `http://localhost:3000/owner/products/stock-import/new` : Lập phiếu nhập kho mới.
- `http://localhost:3000/owner/products/stock-import/[id]` : Xem/cập nhật chi tiết một phiếu nhập kho.
- `http://localhost:3000/owner/orders` : Quản lý đơn hàng, bán hàng POS & trợ lý AI.
- `http://localhost:3000/owner/orders/new` : Trang tạo đơn mới, gồm khu vực nhập câu bằng trợ lý AI.
- `http://localhost:3000/owner/orders/history` : Lịch sử đơn hàng theo ngày.
- `http://localhost:3000/owner/fast-sales` : Giao diện bán nhanh (Fast Sales UI) tối ưu cho điện thoại, thao tác tạo đơn tại quầy.
- `http://localhost:3000/owner/customers` : Quản lý thông tin khách hàng & sổ nợ.
- `http://localhost:3000/owner/customers/[id]/purchase-history` : Lịch sử mua hàng của một khách hàng.
- `http://localhost:3000/owner/employees` : Quản lý và phân quyền tài khoản nhân viên.
- `http://localhost:3000/owner/employees/[employeeId]` : Xem chi tiết & cập nhật phân quyền một nhân viên.
- `http://localhost:3000/owner/inventory` : Tồn kho hiện tại & lịch sử biến động kho.
- `http://localhost:3000/owner/inventory-alerts` : Quản lý cảnh báo tồn kho thấp.
- `http://localhost:3000/owner/revenue` : Xem revenue ledger, lợi nhuận, chi phí nhập hàng và doanh thu theo ngày.
- `http://localhost:3000/owner/revenue/products` : Phân tích mặt hàng bán chạy / bán chậm / không bán được.
- `http://localhost:3000/owner/reports` : Xem, kiểm tra – sửa – từ chối và duyệt báo cáo kế toán theo biểu mẫu (S1-HKD, S2-HKD, S4-HKD).
- `http://localhost:3000/owner/feedback` : Gửi phản hồi tới Manager/Admin.

### 5.4 Khu vực Nhân Viên Cửa Hàng (`/employee`)
- `http://localhost:3000/employee/orders` : Giao diện bán hàng POS tại quầy & trợ lý AI.
- `http://localhost:3000/employee/orders/new` : Trang tạo đơn mới cho nhân viên, gồm khu vực nhập câu bằng trợ lý AI.
- `http://localhost:3000/employee/orders/history` : Lịch sử đơn hàng nhân viên đã tạo.
- `http://localhost:3000/employee/fast-sales` : Giao diện bán nhanh (Fast Sales UI) cho nhân viên.
- `http://localhost:3000/employee/customers` : Tra cứu thông tin khách hàng & công nợ.
- `http://localhost:3000/employee/customers/[id]/purchase-history` : Xem lịch sử mua hàng của khách.
- `http://localhost:3000/employee/inventory` : Tra cứu tồn kho sản phẩm.
- `http://localhost:3000/employee/inventory-alerts` : Tra cứu danh sách sản phẩm sắp hết hàng.
- `http://localhost:3000/employee/revenue` : Xem doanh thu bán hàng (theo quyền được cấp).
- `http://localhost:3000/employee/account` : Quản lý tài khoản cá nhân & đổi mật khẩu ca làm việc.

### 5.5 Khu vực Quản lý Nền tảng (`/manager`)
- `http://localhost:3000/manager` : Dashboard vận hành nền tảng (duyệt hồ sơ hộ kinh doanh, hỗ trợ gói thuê bao).
- `http://localhost:3000/manager/analytics` : Xem Platform Analytics.
- `http://localhost:3000/manager/feedback` : Tiếp nhận và xử lý phản hồi từ Owner/Employee.
- `http://localhost:3000/manager/invoices` : Quản lý hóa đơn dịch vụ của các hộ kinh doanh.
- `http://localhost:3000/manager/invoices/[id]` : Chi tiết một hóa đơn dịch vụ.

### 5.6 Đường dẫn mặc định sau khi đăng nhập

Theo logic `getLoginRedirectPath()` trong `app/lib/roles.ts`, sau khi đăng nhập thành công người dùng được chuyển tới:

| Vai trò | Route mặc định |
|---|---|
| Administrator (`ADMIN`) | `/admin` |
| Manager (`MANAGER`) | `/manager` |
| Chủ hộ (`BUSINESS_OWNER`) — đã có hồ sơ kinh doanh | `/owner/account` |
| Chủ hộ (`BUSINESS_OWNER`) — chưa có hồ sơ kinh doanh | `/onboarding/business-profile` |
| Nhân viên (`EMPLOYEE`) | `/employee/orders/new` |
