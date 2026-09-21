# Bảng Phân Công Nhiệm Vụ & Đóng Góp Thành Viên Nhóm

> **Đề tài:** Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh (Platform to Support Digital Transformation for Household Businesses)  
> **Môn học:** Lập trình Java  
> **Ngày cập nhật:** 21/09/2026  

---

## 1. Danh Sách Thành Viên & Vai Trò Tổng Quan

| STT | Họ và Tên | MSSV | Vai Trò Chính | GitHub |
| :---: | :--- | :---: | :---: | :---: |
| 1 | **Nguyễn Lê Huy Tâm** | 056206011188 | **Team Leader / Lead Architect** | [@Sleepy2608](https://github.com/Sleepy2608) |
| 2 | **Trần Duy Tân** | 083206003584 | **UI Designer / Fullstack Developer** | [@dzytan](https://github.com/dzytan) |
| 3 | **Trần Văn Ngọc Thắng** | 046206001641 | **Tester & Debugger / Backend Developer** | [@Thang414](https://github.com/Thang414) |
| 4 | **Nguyễn Ngọc Gia Bảo** | 079206008279 | **Database Manager / Fullstack Developer** | [@Baon5824](https://github.com/Baon5824) |
| 5 | **Trần Hồng Sơn** | 060206012202 | **Feature Developer / Backend Developer** | [@sontran310306](https://github.com/sontran310306) |
| 6 | **Huỳnh Đình Chấn** | 077206002307 | **Feature Developer / Fullstack Developer** | [@Chan-2006](https://github.com/Chan-2006) |

> *Ghi chú:* Tất cả các thành viên đều tham gia trực tiếp vào việc xây dựng và phát triển mã nguồn Backend bằng Java (Spring Boot 3.3 / Java 21) kết hợp các phân hệ Frontend và nghiệp vụ chuyên trách.

---

## 2. Bảng Chi Tiết Phân Công Nhiệm Vụ Từng Thành Viên

### 2.1. Nguyễn Lê Huy Tâm (Leader / Lead Architect)
- **Quản trị dự án & Mã nguồn**: Repository & Git Management, phân chia task, review PR và quản lý tiến độ trên Jira / GitHub Issues.
- **Kiến trúc & Bảo mật**: Thiết kế kiến trúc tổng thể hệ thống, phân quyền RBAC 4 tầng, Password Encoder (BCrypt), JWT Authentication & Security Filter Chain.
- **Tài liệu dự án**:
  - Hướng dẫn cài đặt & chạy hệ thống ([docs/installation-guide](../installation-guide/), [docs/run-guide](../run-guide/)).
  - Đặc tả yêu cầu phần mềm ([docs/software-requirement-specification](../software-requirement-specification/)).
  - Thiết kế tuân thủ kế toán & chính sách thuế ([docs/compliance](../compliance/)).
  - Hướng dẫn sử dụng cho các vai trò ([docs/user-guides](../user-guides/)).
- **Tính năng Backend & Frontend**:
  - Quản lý tài khoản Admin và cấu hình toàn hệ thống.
  - Quản lý người dùng (CRUD tài khoản, hồ sơ cá nhân).
  - Quy trình thanh toán gói thuê bao (Payment Process, Subscription Pricing & Plans, Modal thanh toán QR).
  - Báo cáo doanh thu nền tảng (Revenue Ledger, Platform Analytics, Trend Analysis).
- **Kiểm thử hiệu năng**: Performance Testing, tối ưu hóa truy vấn và bảo mật API.

---

### 2.2. Trần Duy Tân (UI Designer / Fullstack Developer)
- **Thiết kế Giao diện & Trải nghiệm (UI/UX)**:
  - Thiết kế hệ thống UI cho toàn bộ nền tảng (Next.js 16, Tailwind CSS 4, Framer Motion, Lucide Icons).
  - Giao diện Đăng ký, Đăng nhập, Xác thực mã OTP và Dashboard quản trị.
- **Tính năng & Nghiệp vụ**:
  - Quản lý tài khoản Chủ hộ kinh doanh (Owner Account Management).
  - Công cụ tìm kiếm sản phẩm và lọc dữ liệu thời gian thực (Searching Engine).
  - Xử lý tải lên và tối ưu hóa hình ảnh (Avatar người dùng, ảnh sản phẩm).
  - CRUD các thực thể chính: Khách hàng (Customer), Nhân viên (Employee), Sản phẩm (Product).
  - Tự động hóa ghi sổ kế toán: Sổ công nợ, Doanh thu bán hàng và Tồn kho (Automatic Bookkeeping: Debt, Sales, Inventory).

---

### 2.3. Trần Văn Ngọc Thắng (Tester & Debugger / Backend Developer)
- **Kiểm thử & Đảm bảo chất lượng (QA/QC)**:
  - Thiết kế kịch bản kiểm thử, thực hiện kiểm thử tự động và thủ công, tìm và sửa lỗi hệ thống (Bug Fixing & Debugging).
- **Quản lý dữ liệu & Tuân thủ**:
  - Phối hợp thiết kế Database và Data Model.
  - Xây dựng tài liệu Data Model, thiết kế tích hợp AI và tính toán nghĩa vụ thuế trong tài liệu Compliance.
  - Quản trị nhật ký hệ thống (Audit Log) đảm bảo khả năng truy vết dữ liệu.
- **Tính năng & Nghiệp vụ**:
  - Quản lý quy tắc đo lường và định giá sản phẩm đa đơn vị (Measurement & Product Pricing Rules).
  - Quản lý kho sản phẩm: Tự động cập nhật tồn kho, tính giá trị xuất kho, tra cứu lịch sử công nợ.
  - Quản lý hóa đơn dịch vụ (Service Invoice Management).
  - Quản lý đơn hàng: Tạo đơn tại quầy (At-counter Order), Xác nhận / Hủy đơn, Xác nhận nợ và thanh toán nợ.
  - Phát triển và tích hợp AI Service (FastAPI) tạo đơn nháp.
  - Quản lý phản hồi của người dùng (Feedback Management).

---

### 2.4. Nguyễn Ngọc Gia Bảo (Database Manager / Fullstack Developer)
- **Quản trị Cơ sở dữ liệu (Database Administration)**:
  - Thiết kế sơ đồ quan hệ thực thể (ERD), Data Model, lược đồ CSDL MySQL 8.
  - Quản lý dữ liệu mẫu (Seed Data) cấp hệ thống và kiểm soát toàn vẹn dữ liệu.
- **Tài liệu phân tích & Thiết kế**:
  - Xây dựng Tài liệu Đặc tả Yêu cầu Người dùng ([docs/user-requirements/user-requirements.md](../user-requirements/user-requirements.md)).
  - Quản lý tài liệu kịch bản kiểm thử (Test Cases Management).
- **Tính năng & Nghiệp vụ**:
  - CRUD danh mục sản phẩm (Category), sản phẩm (Product), gói thuê bao (Subscription).
  - Quản lý cảnh báo tồn kho thấp (Low Stock Alert).
  - Phát triển Dashboard phân tích vận hành cho Chủ hộ và Nhân viên (Biểu đồ doanh thu, thống kê sản phẩm).
  - Tính năng phát thông báo toàn hệ thống (System-wide Announcement).

---

### 2.5. Trần Hồng Sơn (Feature Developer / Backend Developer)
- **Phát triển tính năng Backend & Nghiệp vụ**:
  - Quản lý tài khoản nhân viên (Employee Account Management).
  - Quản lý quy trình nhập kho hàng hóa (Product Stock Management - Stock Import).
  - Quản lý các gói tính năng thuê bao (Feature Plans Management).
  - Quản lý biểu mẫu tài chính / kế toán dành cho Admin (Financial Template Management).
  - Hệ thống kiểm soát và phê duyệt báo cáo kế toán: Xem xét, Chỉnh sửa, Từ chối và Quản lý phiên bản biểu mẫu (Report Review, Edit, Reject & Template Versioning).

---

### 2.6. Huỳnh Đình Chấn (Feature Developer / Fullstack Developer)
- **Phát triển tính năng Backend & Frontend**:
  - Quản lý quy trình thanh toán mua gói thuê bao dịch vụ (Purchase Package Payments).
  - Quản lý tài khoản Quản lý vận hành (Manager Account Management).
  - Phát triển tính năng thuê bao: Thiết lập gói cước (Pricing Plans), hệ thống thông báo thuê bao (Notifications).
  - Hiện thực phân quyền RBAC và kiểm soát bảo mật API.
  - Quản lý hóa đơn dịch vụ (Service Invoice Management).
  - Dashboard phân tích nền tảng dành cho Admin và Manager (Platform Analytics).
  - Phát triển giao diện Bán hàng nhanh tối ưu cho thiết bị di động (Fast Sales UI for Mobile).

---

## 3. Bảng Tổng Hợp Phân Chia Theo Phân Hệ Nghiệp Vụ (Epics / Modules)

| Phân Hệ Nghiệp Vụ | Thành Viên Phụ Trách Chính | Mức Độ Hoàn Thành |
| :--- | :--- | :---: |
| **Authentication, RBAC & Security** | Nguyễn Lê Huy Tâm, Huỳnh Đình Chấn | **100%** |
| **User & Business Management** | Nguyễn Lê Huy Tâm, Trần Duy Tân, Huỳnh Đình Chấn | **100%** |
| **Product, Measurement Units & Pricing** | Trần Duy Tân, Nguyễn Ngọc Gia Bảo, Trần Văn Ngọc Thắng | **100%** |
| **Sales POS, Order & Fast Sales Mobile** | Trần Duy Tân, Huỳnh Đình Chấn, Trần Văn Ngọc Thắng | **100%** |
| **AI Smart Order Draft (FastAPI + B.ai)** | Trần Văn Ngọc Thắng, Nguyễn Lê Huy Tâm | **100%** |
| **Inventory & Stock Management** | Trần Hồng Sơn, Trần Văn Ngọc Thắng, Trần Duy Tân | **100%** |
| **Customer & Debt Ledger Management** | Trần Duy Tân, Trần Văn Ngọc Thắng | **100%** |
| **Circular 88 Bookkeeping & 2026 Tax Engine** | Nguyễn Lê Huy Tâm, Trần Hồng Sơn, Trần Văn Ngọc Thắng | **100%** |
| **Subscription Plans & QR Payment** | Nguyễn Lê Huy Tâm, Huỳnh Đình Chấn, Nguyễn Ngọc Gia Bảo | **100%** |
| **Reporting, Analytics & System Announcement** | Nguyễn Lê Huy Tâm, Nguyễn Ngọc Gia Bảo, Huỳnh Đình Chấn | **100%** |
| **Testing, Audit Log & QA/QC** | Trần Văn Ngọc Thắng, Nguyễn Lê Huy Tâm, Nguyễn Ngọc Gia Bảo | **100%** |

---

## 4. Đánh Giá Mức Độ Đóng Góp

- Tất cả 6 thành viên đều hoàn thành **100% khối lượng công việc được giao**.
- Đảm bảo tính liên kết chặt chẽ giữa Backend Java, Frontend Next.js, AI Service và hệ thống tài liệu kỹ thuật chuẩn mực.
