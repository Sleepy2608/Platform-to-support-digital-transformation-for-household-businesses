# ĐẶC TẢ YÊU CẦU PHẦN MỀM (SOFTWARE REQUIREMENT SPECIFICATION — SRS)

# Nền tảng Hỗ trợ Chuyển đổi Số cho Hộ Kinh doanh

**Tên dự án (EN):** Platform to Support Digital Transformation for Household Businesses

**Tên dự án (VN):** Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh

**Viết tắt:** HBDT

**Phiên bản:** 1.1

**Loại tài liệu:** Đặc tả yêu cầu phần mềm

**Môn học:** Lập trình Java

---

# 1. Giới thiệu

## 1.1. Mục đích

Tài liệu Đặc tả Yêu cầu Phần mềm (SRS) này định nghĩa các yêu cầu phần mềm cho **Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh (HBDT)**.

Mục đích của tài liệu là cung cấp đặc tả đầy đủ về các yêu cầu chức năng và phi chức năng của hệ thống. Tài liệu đóng vai trò là phương tiện giao tiếp giữa các bên liên quan: giảng viên, nhóm phát triển, nhóm kiểm thử, quản lý dự án trong suốt vòng đời phát triển phần mềm.

Tài liệu này cũng được sử dụng làm tài liệu tham khảo chính trong các giai đoạn:

- Phân tích phần mềm (Software Analysis)
- Thiết kế phần mềm (Software Design)
- Triển khai hệ thống (Triển khai hệ thống)
- Kiểm thử (Testing)
- Triển khai (Deployment)
- Bảo trì (Maintenance)

---

## 1.2. Phạm vi

Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh (HBDT) là một hệ thống quản lý kinh doanh trên nền tảng web, được thiết kế dành riêng cho các hộ kinh doanh tại Việt Nam.

Khác với các hệ thống POS truyền thống, nền tảng được phát triển để hỗ trợ các hộ kinh doanh vẫn đang sử dụng sổ tay hoặc bảng tính Excel để quản lý hoạt động hàng ngày.

Nền tảng giúp chủ hộ kinh doanh số hóa các hoạt động kinh doanh, bao gồm:

- Đăng ký tài khoản chủ hộ và thiết lập hồ sơ
- Quản lý gói thuê bao
- Quản lý nhân viên
- Quản lý danh mục sản phẩm
- Quản lý tồn kho
- Quản lý khách hàng
- Quản lý công nợ
- Xử lý đơn bán hàng
- Tạo đơn hàng với sự hỗ trợ của AI
- Ghi sổ kế toán tự động
- Báo cáo kinh doanh
- Quản lý hành chính

Hệ thống cũng tích hợp trợ lý AI có khả năng hiểu ngôn ngữ tự nhiên tiếng Việt thông qua văn bản hoặc giọng nói để tự động tạo đơn hàng nháp (đơn hàng nháp) cho nhân viên xác nhận.

---

## 1.3. Đối tượng đọc tài liệu

Tài liệu này dành cho các đối tượng sau.

| Đối tượng | Mục đích sử dụng |
|-----------|-----------------|
| Giảng viên | Đánh giá các artifact của môn Công nghệ Phần mềm |
| Chủ sở hữu sản phẩm | Xác nhận các yêu cầu nghiệp vụ |
| Nhà phát triển | Triển khai các module phần mềm |
| UI/UX Designers | Thiết kế giao diện hệ thống |
| Testers | Chuẩn bị kịch bản kiểm thử |
| Project Manager | Giám sát phạm vi và tiến độ dự án |
| Khách hàng | Hiểu các chức năng của hệ thống |

---

## 1.4. Định nghĩa, Thuật ngữ và Từ viết tắt

| Thuật ngữ / Viết tắt | Định nghĩa |
|---------------------|------------|
| AI | Artificial Intelligence — Trí tuệ nhân tạo |
| API | Application Programming Interface — Giao diện lập trình ứng dụng |
| CRUD | Tạo, xem, cập nhật, xóa — Thao tác tạo, xem, sửa, xóa |
| **HBDT** | **Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh** — Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh |
| JWT | JSON Web Token — Token xác thực |
| POS | Point of Sale — Hệ thống bán hàng tại điểm bán |
| Phân quyền dựa trên vai trò (RBAC) | Kiểm soát truy cập dựa trên vai trò — Phân quyền dựa trên vai trò |
| REST | Representational State Transfer — Kiến trúc API chuẩn |
| SaaS | Phần mềm dưới dạng dịch vụ — Phần mềm dưới dạng dịch vụ |
| SRS | Software Requirement Specification — Đặc tả yêu cầu phần mềm |
| UML | Unified Modeling Language — Ngôn ngữ mô hình hóa thống nhất |
| UI | Giao diện người dùng — Giao diện người dùng |
| UX | Trải nghiệm người dùng — Trải nghiệm người dùng |
| Chủ hộ kinh doanh | Chủ hộ kinh doanh |
| Nhân viên | Nhân viên cửa hàng |
| Quản trị viên | Quản trị viên nền tảng vận hành (Manager) |
| Administrator (Admin) | Quản trị viên cấp cao nhất (System Admin) |
| Đơn hàng nháp | Đơn hàng nháp do AI tạo, chờ xác nhận |
| Gói thuê bao | Gói dịch vụ được mua bởi Chủ hộ kinh doanh |

---

## 1.5. Tài liệu tham khảo

Các yêu cầu trong tài liệu này dựa trên các tài liệu tham khảo sau.

1. Mô tả đề tài môn Công nghệ Phần mềm.

2. Đề xuất dự án Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh.

3. Quyết định số 3389/QĐ-BTC (2025) của Bộ Tài chính.

4. Thông tư số 88/2021/TT-BTC về chế độ kế toán cho hộ kinh doanh.

5. IEEE 29148 — Kỹ thuật yêu cầu hệ thống và phần mềm.

6. IEEE 830 — Đặc tả yêu cầu phần mềm.

---

# 2. Mô tả tổng quan hệ thống

## 2.1. Góc nhìn sản phẩm

Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh (HBDT) là một ứng dụng SaaS (Software-as-a-Service) bao gồm nhiều module tích hợp.

Kiến trúc hệ thống bao gồm:

- Cổng thông tin công cộng (Public Portal)
- Dịch vụ xác thực (Dịch vụ xác thực)
- Hệ thống quản lý kinh doanh (Hệ thống quản lý kinh doanh)
- Dịch vụ AI (Dịch vụ AI)
- Công cụ ghi sổ kế toán (Ghi sổ kế toán Engine)
- Module báo cáo
- Cổng quản trị (Cổng quản trị)

Nền tảng được phát triển bằng:

- giao diện người dùng: React (Vite) với TypeScript
- Backend: Java Spring Boot
- Cơ sở dữ liệu: MySQL
- Dịch vụ AI: Python FastAPI

---

## 2.2. Chức năng sản phẩm

Hệ thống cung cấp các chức năng chính sau.

### Cổng thông tin công cộng (Public Portal)

- Trang giới thiệu (Trang giới thiệu)
- Giới thiệu tính năng
- Thông tin giá cả
- Đăng ký tài khoản Chủ hộ kinh doanh
- Thiết lập hồ sơ kinh doanh

### Xác thực (Xác thực)

- Đăng nhập
- Đăng xuất
- Đặt lại mật khẩu
- Xác thực JWT
- Phân quyền theo vai trò

### Quản lý gói thuê bao (Quản lý gói thuê bao)

- Đăng ký thuê bao
- Chọn gói dịch vụ
- Thanh toán
- Kích hoạt dịch vụ
- Gia hạn
- Nâng cấp gói
- Hạ cấp gói
- Tạo hóa đơn dịch vụ

### Quản lý sản phẩm (Quản lý sản phẩm)

- Quản lý sản phẩm (CRUD)
- Quản lý danh mục
- Nhiều đơn vị tính
- Định giá sản phẩm
- Hình ảnh sản phẩm

### Quản lý tồn kho (Quản lý tồn kho)

- Nhập kho
- Điều chỉnh tồn kho
- Lịch sử tồn kho
- Tính toán tồn kho hiện tại
- Cảnh báo tồn kho thấp

### Quản lý khách hàng (Quản lý khách hàng)

- Quản lý khách hàng (CRUD)
- Lịch sử mua hàng
- Quản lý công nợ
- Lịch sử thanh toán công nợ

### Quản lý bán hàng (Quản lý bán hàng)

- Bán hàng tại quầy
- Xác nhận đơn hàng
- Hủy đơn hàng
- In hóa đơn bán hàng
- Lịch sử đơn hàng

### Đơn hàng AI (Đơn hàng nháp do AI tạo)

- Nhập liệu văn bản
- Nhập liệu giọng nói
- Chuyển giọng nói thành văn bản
- Xử lý ngôn ngữ tự nhiên
- Tạo đơn hàng nháp
- Ghép sản phẩm
- Ghép khách hàng
- Thông báo thời gian thực

### Ghi sổ kế toán tự động (Ghi sổ kế toán tự động)

- Ghi sổ bán hàng
- Ghi sổ tồn kho
- Ghi sổ công nợ
- Tạo báo cáo kế toán
- Tạo báo cáo tài chính

### Báo cáo & Phân tích (Báo cáo và phân tích)

- Báo cáo doanh thu
- Báo cáo công nợ
- Báo cáo tồn kho
- Sản phẩm bán chạy
- Bảng điều khiển (Dashboard)
- Biểu đồ

### Quản trị viên (Quản trị viên)

- Quản lý tài khoản Chủ hộ kinh doanh
- Định giá gói thuê bao
- Phân tích nền tảng
- Quản lý mẫu báo cáo tài chính
- Cấu hình AI
- Thông báo hệ thống

---

## 2.3. Phân loại người dùng và đặc điểm

### Quản trị viên (Quản trị viên)

Trách nhiệm

- Quản lý nền tảng
- Quản lý gói thuê bao
- Cấu hình hệ thống
- Xem số liệu phân tích

Kỹ năng công nghệ

Cao

---

### Chủ hộ kinh doanh (Chủ hộ kinh doanh)

Trách nhiệm

- Quản lý kinh doanh
- Quản lý nhân viên
- Quản lý tồn kho
- Quản lý khách hàng
- Xem báo cáo

Kỹ năng công nghệ

Trung bình

---

### Nhân viên (Nhân viên)

Trách nhiệm

- Lập đơn bán hàng
- Ghi nhận công nợ khách hàng
- In hóa đơn
- Xác nhận đơn hàng nháp do AI tạo

Kỹ năng công nghệ

Cơ bản

---

## 2.4. Môi trường vận hành

### Backend (Máy chủ)

- Java 21
- Spring Boot 3.x
- Maven

### giao diện người dùng

- React 18+ (Vite)
- TypeScript
- HTML5 / CSS3

### Dịch vụ AI

- Python
- FastAPI
- Chuyển giọng nói thành văn bản (Chuyển giọng nói thành văn bản)
- Xử lý ngôn ngữ tự nhiên (NLP)

### Cơ sở dữ liệu

- MySQL 5.7+

### Trình duyệt hỗ trợ

- Google Chrome
- Microsoft Edge
- Mozilla Firefox

### Triển khai

- Docker
- Docker Compose

---

## 2.5. Ràng buộc thiết kế và triển khai

### Ràng buộc kinh doanh

- Nền tảng được thiết kế dành riêng cho hộ kinh doanh tại Việt Nam.
- Giao diện người dùng phải hỗ trợ người dùng có mức độ thành thạo công nghệ thấp.
- Nền tảng phải ưu tiên sử dụng trên điện thoại thông minh (smartphone-first).
- Kết quả do AI tạo ra phải luôn có thể được người dùng kiểm tra trước khi xác nhận.

### Ràng buộc kỹ thuật

- Kiến trúc RESTful API.
- Xác thực bằng JWT.
- Phân quyền dựa trên vai trò (Phân quyền dựa trên vai trò (RBAC)).
- Kiến trúc đa người thuê (Multi-tenant).
- Giao diện web tương thích (Responsive).
- Hỗ trợ Unicode tiếng Việt.

### Công nghệ sử dụng

Hệ thống được phát triển bằng các công nghệ sau.

| Thành phần | Công nghệ | Phiên bản |
|-----------|-----------|---------|
| Khung Backend | Java Spring Boot | 3.x (JDK 21) |
| Khung giao diện người dùng | React (Vite) với TypeScript | React 18+ |
| Cơ sở dữ liệu | MySQL | 5.7+ |
| Dịch vụ AI | Python FastAPI | — |
| Bộ nhớ đệm (tùy chọn) | Redis | — |
| Đóng gói | Docker & Docker Compose | — |
| Xác thực | JWT (JSON Web Token) | — |
| Kiến trúc API | RESTful API | — |
| Giao tiếp thời gian thực | WebSocket | — |

### Quy trình phát triển

- Dự án tuân theo vòng đời phát triển phần mềm hoàn chỉnh sử dụng UML 2.0.
- Mã nguồn được quản lý bằng Git.
- Cần có đánh giá mã nguồn trước khi hợp nhất vào nhánh chính.

### Ràng buộc pháp lý

Hệ thống phải tuân thủ:

- Thông tư số 88/2021/TT-BTC của Bộ Tài chính.
- Quyết định số 3389/QĐ-BTC (2025) của Bộ Tài chính.

---

## 2.6. Giả định và Phụ thuộc

Các giả định sau được đặt ra trong quá trình phát triển hệ thống.

- Người dùng có kết nối Internet.
- Mỗi hộ kinh doanh sở hữu ít nhất một điện thoại thông minh.
- Dịch vụ AI hoạt động trong điều kiện vận hành bình thường.
- Dịch vụ thanh toán hoạt động.
- Chủ hộ kinh doanh cung cấp thông tin đăng ký chính xác.

---

# 3. Tổng quan hệ thống

Nền tảng bao gồm năm nhóm vai trò người dùng chính.

## Người dùng công cộng (Người dùng công cộng)

Khách truy cập có thể:

- Xem trang giới thiệu (Trang giới thiệu).
- Xem các gói dịch vụ.
- Đăng ký tài khoản Chủ hộ kinh doanh.

---

## Chủ hộ kinh doanh (Chủ hộ kinh doanh)

Chủ hộ kinh doanh quản lý toàn bộ hoạt động kinh doanh của hộ kinh doanh.

Trách nhiệm chính bao gồm:

- Quản lý nhân viên
- Quản lý sản phẩm
- Quản lý tồn kho
- Quản lý khách hàng
- Quản lý công nợ
- Báo cáo
- Quản lý gói thuê bao

---

## Nhân viên (Nhân viên)

Nhân viên thực hiện các hoạt động vận hành hàng ngày.

Trách nhiệm bao gồm:

- Đăng nhập
- Lập đơn bán hàng
- In hóa đơn
- Ghi nhận công nợ khách hàng
- Kiểm tra đơn hàng nháp do AI tạo

---

## Manager (Quản trị viên vận hành)

Manager duy trì và quản lý vận hành nền tảng.

Trách nhiệm bao gồm:

- Quản lý tài khoản Chủ hộ kinh doanh
- Theo dõi trạng thái và phân tích nền tảng
- Xử lý phản hồi từ Owner và Employee
- Theo dõi trạng thái gói thuê bao

---

## Administrator (Quản trị viên cấp cao)

Administrator là quản trị viên tối cao của hệ thống.

Trách nhiệm bao gồm:

- Sở hữu toàn bộ quyền hạn của Manager
- Định giá gói thuê bao và cấu hình hệ thống
- Cấu hình AI
- Quản lý mẫu báo cáo tài chính
- Khởi tạo và seed dữ liệu toàn hệ thống (Seed data)
- Quản lý các tài khoản Manager khác (Tạo, sửa, xóa, khóa/mở khóa)

---

# 4. Yêu cầu giao diện bên ngoài

## 4.1. Giao diện người dùng (UI)

| Thuộc tính | Đặc tả |
|-----------|---------------|
| **Công nghệ giao diện người dùng** | React (Vite) với TypeScript |
| **Responsive** | Hỗ trợ ưu tiên thiết bị di động — smartphone (≥360px), tablet (≥768px), desktop (≥1024px) |
| **Trình duyệt hỗ trợ** | Google Chrome, Microsoft Edge, Mozilla Firefox |
| **Ngôn ngữ** | Tiếng Việt (mặc định), Unicode UTF-8 |
| **Triết lý thiết kế** | Giao diện đơn giản, trực quan, phù hợp với người dùng có kỹ năng công nghệ hạn chế; phông chữ lớn, biểu tượng rõ ràng, số bước tối thiểu |
| **Điều hướng** | Bottom navigation / hamburger menu trên mobile; sidebar trên desktop |
| **Thông báo** | Chuông thông báo thời gian thực + toast messages cho đơn hàng nháp và cảnh báo |

## 4.2. Giao diện phần cứng

| Thiết bị | Giao diện | Mục đích |
|----------|-----------|---------|
| Điện thoại thông minh | Cảm ứng, Camera (tùy chọn) | Thiết bị chính cho hoạt động kinh doanh; nhập liệu giọng nói cho AI |
| Máy in hóa đơn (tùy chọn) | Bluetooth / USB | In hóa đơn bán hàng (hỗ trợ in qua Bluetooth từ thiết bị di động) |
| Microphone | API thiết bị gốc | Nhập liệu giọng nói cho tính năng tạo đơn hàng bằng AI |

> **Ghi chú:** Nền tảng được thiết kế ưu tiên sử dụng trên điện thoại thông minh. Hầu hết các hộ kinh doanh chỉ sử dụng một điện thoại thông minh. Tất cả tính năng cốt lõi phải hoạt động đầy đủ trên thiết bị di động mà không yêu cầu phần cứng bổ sung.

## 4.3. Giao diện phần mềm

| Hệ thống bên ngoài | Giao thức / Công nghệ | Mục đích |
|-------------------|----------------------|---------|
| **Dịch vụ AI** | REST API (Python FastAPI) | Xử lý ngôn ngữ tự nhiên, chuyển giọng nói thành văn bản, tạo đơn hàng nháp |
| **Cổng thanh toán** | REST API (HTTPS) | Xử lý thanh toán gói thuê bao |
| **Dịch vụ Email** | SMTP / Spring Mail API | Gửi xác nhận tài khoản, hóa đơn, thông báo |
| **Dịch vụ Chuyển giọng nói** | REST API / WebSocket | Chuyển đổi giọng nói tiếng Việt thành văn bản cho AI xử lý |

## 4.4. Giao diện truyền thông

| Giao thức | Mục đích | Chi tiết |
|----------|---------|---------|
| **HTTPS (TLS 1.2+)** | Truyền tải dữ liệu an toàn | Tất cả giao tiếp API đều sử dụng HTTPS |
| **WebSocket** | Thông báo thời gian thực | Push notifications cho đơn hàng nháp, cảnh báo tồn kho thấp và sự kiện hệ thống |
| **REST API** | Giao tiếp Client-Server | Định dạng JSON, tuân thủ RESTful conventions giữa giao diện người dùng và Backend Spring Boot |
| **JWT Token** | Xác thực | Xác thực không trạng thái bằng Access Token và Refresh Token |

---

# 5. Tổng quan yêu cầu chức năng

Các yêu cầu chức năng được nhóm thành các module sau.

| Mã module | Tên module |
|-----------|-------------|
| HBDT-01 | Cổng thông tin công cộng (Public Portal) |
| HBDT-02 | Đăng ký & Thiết lập tài khoản Chủ hộ kinh doanh |
| HBDT-03 | Xác thực & Phân quyền |
| HBDT-04 | Quản lý gói thuê bao |
| HBDT-05 | Quản lý danh mục sản phẩm |
| HBDT-06 | Quản lý tồn kho |
| HBDT-07 | Quản lý khách hàng & Công nợ |
| HBDT-08 | Quản lý đơn bán hàng |
| HBDT-09 | Đơn hàng AI & Thông báo thời gian thực |
| HBDT-10 | Ghi sổ kế toán tự động |
| HBDT-11 | Báo cáo & Phân tích |
| HBDT-12 | Quản trị hệ thống |

Các yêu cầu chức năng chi tiết cho từng module được mô tả trong các phần sau của tài liệu.

# 6. Yêu cầu chức năng

---

# HBDT-01 Cổng thông tin công cộng

## HBDT-01.1 Trang giới thiệu

### Mã yêu cầu

HBDT-01.1

### Tên yêu cầu

Trang giới thiệu

### Mô tả

Hệ thống phải cung cấp trang giới thiệu công khai, trình bày nền tảng, các tính năng cốt lõi, các gói giá và lợi ích dành cho hộ kinh doanh.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

- Người dùng công cộng

### Điều kiện tiên quyết

- Nền tảng đang hoạt động trực tuyến.

### Đầu vào

Không có.

### Đầu ra

- Trang giới thiệu được hiển thị.
- Tổng quan tính năng.
- Các gói giá.
- Liên kết điều hướng đến trang đăng ký.

### Luồng chính

1. Người dùng truy cập nền tảng.
2. Hệ thống hiển thị trang giới thiệu.
3. Người dùng xem thông tin về nền tảng.
4. Người dùng có thể chuyển đến trang bảng giá hoặc trang đăng ký.

### Luồng thay thế

Không có.

### Quy tắc nghiệp vụ

- Trang giới thiệu phải hỗ trợ bố cục đáp ứng.
- Tiếng Việt được hiển thị theo mặc định.

### Tiêu chí chấp nhận

- Trang giới thiệu tải thành công.
- Hiển thị đáp ứng trên máy tính và thiết bị di động.
- Các gói giá được hiển thị.
- Nút đăng ký chuyển hướng đúng.

---

## HBDT-01.2 Trang bảng giá

### Mã yêu cầu

HBDT-01.2

### Tên yêu cầu

Hiển thị giá gói thuê bao

### Mô tả

Hệ thống phải hiển thị tất cả các gói thuê bao hiện có cùng các tính năng tương ứng.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

- Người dùng công cộng

### Điều kiện tiên quyết

Các gói thuê bao đã tồn tại.

### Đầu vào

Không có.

### Đầu ra

Danh sách các gói hiện có.

### Luồng chính

1. Người dùng chọn mục Bảng giá.
2. Hệ thống truy xuất các gói thuê bao.
3. Hệ thống hiển thị bảng so sánh các gói.

### Quy tắc nghiệp vụ

- Giá được lấy từ cấu hình của quản trị viên.
- Không hiển thị các gói đã hết hiệu lực.

### Tiêu chí chấp nhận

- Tất cả các gói đang hoạt động được hiển thị.
- Thông tin so sánh gói là chính xác.

---

# HBDT-02 Đăng ký và thiết lập ban đầu cho chủ hộ kinh doanh

## HBDT-02.1 Đăng ký chủ hộ kinh doanh

### Mã yêu cầu

HBDT-02.1

### Tên yêu cầu

Đăng ký chủ hộ kinh doanh

### Mô tả

Chủ hộ kinh doanh phải có thể tạo tài khoản trên nền tảng.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

- Người dùng công cộng

### Điều kiện tiên quyết

Không có.

### Đầu vào

- Họ và tên
- Email
- Số điện thoại
- Mật khẩu

### Đầu ra

Tài khoản chủ hộ kinh doanh được tạo.

### Luồng chính

1. Người dùng mở trang đăng ký.
2. Người dùng nhập thông tin cá nhân.
3. Người dùng gửi biểu mẫu đăng ký.
4. Hệ thống kiểm tra tính hợp lệ của thông tin.
5. Tài khoản chủ hộ kinh doanh được tạo.
6. Yêu cầu xác minh được gửi đi.

### Luồng thay thế

- Email đã tồn tại.
- Số điện thoại đã tồn tại.
- Mật khẩu không hợp lệ.

### Quy tắc nghiệp vụ

- Email phải là duy nhất.
- Số điện thoại phải là duy nhất.
- Mật khẩu phải đáp ứng chính sách bảo mật.

### Tiêu chí chấp nhận

- Thông tin đăng ký hợp lệ sẽ tạo tài khoản.
- Tài khoản trùng lặp bị từ chối.
- Thông báo kiểm tra dữ liệu được hiển thị.

---

## HBDT-02.2 Xác minh tài khoản

### Mã yêu cầu

HBDT-02.2

### Tên yêu cầu

Xác minh tài khoản

### Mô tả

Hệ thống phải xác minh tài khoản chủ hộ kinh doanh qua email hoặc số điện thoại.

### Độ ưu tiên

P1 – Cao

### Tác nhân

- Chủ hộ kinh doanh

### Điều kiện tiên quyết

Tài khoản chủ hộ kinh doanh đã được đăng ký.

### Đầu vào

Mã xác minh.

### Đầu ra

Tài khoản đã được xác minh.

### Luồng chính

1. Hệ thống gửi mã xác minh.
2. Người dùng nhập mã xác minh.
3. Hệ thống kiểm tra mã.
4. Tài khoản chuyển sang trạng thái hoạt động.

### Luồng thay thế

- Mã không hợp lệ.
- Mã đã hết hạn.

### Tiêu chí chấp nhận

- Mã chính xác sẽ kích hoạt tài khoản.
- Mã không hợp lệ sẽ hiển thị lỗi.

---

## HBDT-02.3 Thiết lập hồ sơ kinh doanh

### Mã yêu cầu

HBDT-02.3

### Tên yêu cầu

Thiết lập hồ sơ kinh doanh

### Mô tả

Chủ hộ kinh doanh phải cung cấp thông tin kinh doanh trong quá trình thiết lập ban đầu.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

Chủ hộ kinh doanh

### Điều kiện tiên quyết

Tài khoản chủ hộ kinh doanh đã được kích hoạt.

### Đầu vào

- Tên hộ kinh doanh
- Mã số thuế
- Địa chỉ
- Tên người đại diện

### Đầu ra

Hồ sơ kinh doanh được tạo.

### Luồng chính

1. Chủ hộ kinh doanh đăng nhập.
2. Chủ hộ kinh doanh nhập thông tin kinh doanh.
3. Hệ thống kiểm tra dữ liệu đầu vào.
4. Hồ sơ kinh doanh được lưu.

### Quy tắc nghiệp vụ

Mã số thuế là trường không bắt buộc.

### Tiêu chí chấp nhận

Hồ sơ kinh doanh được lưu thành công.

---

## HBDT-02.4 Lựa chọn gói thuê bao

### Mã yêu cầu

HBDT-02.4

### Tên yêu cầu

Lựa chọn gói thuê bao

### Mô tả

Chủ hộ kinh doanh phải chọn một gói thuê bao trước khi sử dụng nền tảng.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

Chủ hộ kinh doanh

### Điều kiện tiên quyết

Hồ sơ kinh doanh đã tồn tại.

### Đầu vào

- Gói thuê bao
- Chu kỳ thanh toán

### Đầu ra

Gói thuê bao được tạo.

### Luồng chính

1. Chủ hộ kinh doanh chọn gói thuê bao.
2. Chủ hộ kinh doanh chọn chu kỳ thanh toán.
3. Hệ thống tạo gói thuê bao.
4. Chờ thanh toán.

### Tiêu chí chấp nhận

Trạng thái gói thuê bao là Chờ thanh toán.

---

# HBDT-03 Xác thực và phân quyền

## HBDT-03.1 Đăng nhập người dùng

### Mã yêu cầu

HBDT-03.1

### Tên yêu cầu

Đăng nhập người dùng

### Mô tả

Hệ thống phải xác thực nhân viên, chủ hộ kinh doanh và quản trị viên.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

- Nhân viên
- Chủ hộ kinh doanh
- Quản trị viên

### Điều kiện tiên quyết

Tài khoản đã tồn tại.

### Đầu vào

- Tên đăng nhập
- Mật khẩu

### Đầu ra

Access Token JWT.

### Luồng chính

1. Người dùng nhập thông tin đăng nhập.
2. Hệ thống xác thực thông tin đăng nhập.
3. JWT token được tạo.
4. Người dùng truy cập bảng điều khiển.

### Luồng thay thế

- Tên đăng nhập không hợp lệ.
- Mật khẩu không hợp lệ.
- Tài khoản đã bị vô hiệu hóa.

### Quy tắc nghiệp vụ

JWT phải tự động hết hạn.

### Tiêu chí chấp nhận

Thông tin đăng nhập hợp lệ cho phép đăng nhập thành công.

---

## HBDT-03.2 Đăng xuất

### Mã yêu cầu

HBDT-03.2

### Tên yêu cầu

Đăng xuất

### Mô tả

Người dùng có thể đăng xuất an toàn.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

Tất cả người dùng đã xác thực.

### Luồng chính

1. Người dùng chọn Đăng xuất.
2. Token bị vô hiệu hóa.
3. Trang đăng nhập được hiển thị.

### Tiêu chí chấp nhận

Sau đó, không thể truy cập các API được bảo vệ.

---

## HBDT-03.3 Kiểm soát truy cập dựa trên vai trò

### Mã yêu cầu

HBDT-03.3

### Tên yêu cầu

Phân quyền dựa trên vai trò (RBAC)

### Mô tả

Nền tảng phải giới hạn quyền truy cập theo vai trò người dùng.

### Độ ưu tiên

P0 – Bắt buộc

### Các tác nhân

- Nhân viên
- Chủ hộ kinh doanh
- Manager (Quản trị viên vận hành)
- Administrator (Quản trị viên cấp cao)

### Quy tắc nghiệp vụ

Nhân viên không thể truy cập các trang quản trị.

Chủ hộ kinh doanh không thể truy cập chức năng quản trị nền tảng.

Manager không thể thực hiện seed data hoặc truy cập các chức năng quản lý tài khoản Manager (chỉ dành cho Administrator).

Manager không thể truy cập dữ liệu kinh doanh của chủ hộ khác.

### Tiêu chí chấp nhận

Truy cập trái phép trả về HTTP 403.

---

## HBDT-03.4 Quản lý tài khoản nhân viên

### Mã yêu cầu

HBDT-03.4

### Tên yêu cầu

Quản lý nhân viên

### Mô tả

Chủ hộ kinh doanh phải có thể quản lý tài khoản nhân viên.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

Chủ hộ kinh doanh

### Chức năng

- Tạo nhân viên
- Cập nhật nhân viên
- Đặt lại mật khẩu
- Vô hiệu hóa nhân viên

### Quy tắc nghiệp vụ

- Mọi thao tác quản lý tài khoản nhân viên phải được ghi vào nhật ký kiểm toán.
- Mỗi bản ghi nhật ký kiểm toán phải gồm: người thực hiện, thời điểm, thao tác đã thực hiện và chi tiết thay đổi.

### Tiêu chí chấp nhận

- Các thay đổi được phản ánh ngay lập tức.
- Nhật ký kiểm toán ghi nhận từng thao tác với đúng người thực hiện, thời điểm, hành động và chi tiết thay đổi.

---

# HBDT-04 Quản lý gói thuê bao

## HBDT-04.1 Quản lý gói thuê bao

### Mã yêu cầu

HBDT-04.1

### Tên yêu cầu

Quản lý gói thuê bao

### Mô tả

Quản trị viên phải có thể quản lý các gói thuê bao.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

Quản trị viên

### Chức năng

- Tạo gói
- Cập nhật gói
- Vô hiệu hóa gói

### Tiêu chí chấp nhận

Các thay đổi được hiển thị trên trang Bảng giá công khai.

---

## HBDT-04.2 Xử lý thanh toán

### Mã yêu cầu

HBDT-04.2

### Tên yêu cầu

Xử lý thanh toán

### Mô tả

Chủ hộ kinh doanh phải thanh toán phí thuê bao.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

Chủ hộ kinh doanh

### Luồng chính

#### FR-P-01 Hiển thị thông tin thanh toán QR

Khi Chủ hộ kinh doanh chọn gói có phí, hệ thống phải mở modal thanh toán chuyển khoản và hiển thị mã QR từ `Code/Client/src/frontend/public/images/qr-code.jpg`, số tiền theo gói/chu kỳ, ngân hàng, số tài khoản, chủ tài khoản và nội dung chuyển khoản. Gói miễn phí không hiển thị modal QR.

#### FR-P-02 Xác nhận kích hoạt gói sau thanh toán

Sau khi chuyển khoản bên ngoài hệ thống, Chủ hộ kinh doanh có thể bấm **Xác nhận thanh toán**. Frontend gọi `POST /api/owner/subscription/select-package` với `packageType` và `billingCycle`; khi API thành công, hệ thống kích hoạt subscription và chuyển về trang tài khoản. Phiên bản hiện tại chưa có payment gateway, endpoint QR động hoặc webhook đối soát ngân hàng.

1. Chủ hộ kinh doanh chọn gói thuê bao.
2. Yêu cầu thanh toán được tạo.
3. Thanh toán thành công.
4. Gói thuê bao chuyển sang trạng thái Hoạt động.

### Luồng thay thế

Thanh toán thất bại.

### Tiêu chí chấp nhận

Trạng thái gói thuê bao thay đổi chính xác.

---

## HBDT-04.3 Vòng đời gói thuê bao

### Mã yêu cầu

HBDT-04.3

### Tên yêu cầu

Vòng đời gói thuê bao

### Mô tả

Hệ thống phải quản lý trạng thái gói thuê bao.

### Trạng thái

- Chờ xử lý
- Hoạt động
- Hết hạn
- Đã hủy

### Quy tắc nghiệp vụ

Gói thuê bao hết hạn sẽ mất quyền sử dụng các tính năng cao cấp.

### Tiêu chí chấp nhận

Trạng thái thay đổi chính xác theo lịch sử thanh toán.

---

## HBDT-04.4 Hóa đơn dịch vụ

### Mã yêu cầu

HBDT-04.4

### Tên yêu cầu

Tạo hóa đơn dịch vụ

### Mô tả

Hệ thống phải tự động tạo hóa đơn dịch vụ sau khi thanh toán gói thuê bao thành công.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

Chủ hộ kinh doanh

### Đầu ra

- Hóa đơn PDF
- Lịch sử hóa đơn

### Tiêu chí chấp nhận

Hóa đơn được tạo tự động sau khi thanh toán.

---

## HBDT-04.5 Lịch sử gói thuê bao

### Mã yêu cầu

HBDT-04.5

### Tên yêu cầu

Lịch sử gói thuê bao

### Mô tả

Chủ hộ kinh doanh có thể xem lại các gói thuê bao trước đây và lịch sử thanh toán.

### Tiêu chí chấp nhận

Các bản ghi lịch sử có thể được tìm kiếm và tải xuống.

# HBDT-05 Quản lý danh mục sản phẩm

## HBDT-05.1 Quản lý sản phẩm

### Mã yêu cầu

HBDT-05.1

### Tên yêu cầu

CRUD sản phẩm

### Mô tả

Hệ thống phải cho phép chủ hộ kinh doanh tạo, cập nhật, xem, tìm kiếm và vô hiệu hóa sản phẩm của hộ kinh doanh.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

Chủ hộ kinh doanh

### Điều kiện tiên quyết

- Chủ hộ kinh doanh đã đăng nhập.
- Gói thuê bao đang hoạt động.

### Đầu vào

- Tên sản phẩm
- Danh mục
- Giá bán
- Mô tả
- Trạng thái sản phẩm

### Đầu ra

Thông tin sản phẩm được lưu trong cơ sở dữ liệu.

### Luồng chính

1. Chủ hộ kinh doanh mở chức năng Quản lý sản phẩm.
2. Chủ hộ kinh doanh chọn Tạo sản phẩm.
3. Chủ hộ kinh doanh nhập thông tin sản phẩm.
4. Hệ thống kiểm tra dữ liệu đầu vào.
5. Sản phẩm được lưu thành công.

### Luồng thay thế

- Tên sản phẩm đã tồn tại.
- Các trường bắt buộc đang để trống.

### Quy tắc nghiệp vụ

- Tên sản phẩm nên là duy nhất trong cùng một hộ kinh doanh.
- Sản phẩm đã bị vô hiệu hóa không thể được bán.

### Tiêu chí chấp nhận

- Có thể tạo sản phẩm thành công.
- Thông tin sản phẩm được hiển thị chính xác.
- Sản phẩm bị vô hiệu hóa không còn xuất hiện trong chức năng bán hàng.

---

## HBDT-05.2 Quản lý danh mục sản phẩm

### Mã yêu cầu

HBDT-05.2

### Tên yêu cầu

Quản lý danh mục sản phẩm

### Mô tả

Chủ hộ kinh doanh phải có thể quản lý danh mục sản phẩm.

### Độ ưu tiên

P1 – Cao

### Tác nhân

Chủ hộ kinh doanh

### Chức năng

- Tạo danh mục
- Chỉnh sửa danh mục
- Vô hiệu hóa danh mục

### Tiêu chí chấp nhận

Các danh mục có thể được chọn khi tạo sản phẩm.

---

## HBDT-05.3 Quản lý hình ảnh sản phẩm

### Mã yêu cầu

HBDT-05.3

### Tên yêu cầu

Quản lý hình ảnh sản phẩm

### Mô tả

Chủ hộ kinh doanh có thể tải lên hình ảnh sản phẩm để dễ nhận diện.

### Độ ưu tiên

P1 – Cao

### Tác nhân

Chủ hộ kinh doanh

### Đầu vào

Tệp hình ảnh.

### Đầu ra

URL hình ảnh được lưu.

### Quy tắc nghiệp vụ

Các định dạng được hỗ trợ:

- PNG
- JPG
- JPEG
- WEBP

### Tiêu chí chấp nhận

Hình ảnh đã tải lên được hiển thị chính xác.

---

## HBDT-05.4 Nhiều đơn vị tính

### Mã yêu cầu

HBDT-05.4

### Tên yêu cầu

Nhiều đơn vị tính

### Mô tả

Sản phẩm có thể có nhiều đơn vị tính và tỷ lệ quy đổi.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

Chủ hộ kinh doanh

### Ví dụ

| Sản phẩm | Đơn vị | Quy đổi |
|----------|------|------------|
| Xi măng | Bao | Đơn vị cơ sở |
| Xi măng | Tấn | 1 tấn = 20 bao |

### Tiêu chí chấp nhận

Hệ thống tính toán số lượng chính xác giữa các đơn vị.

---

## HBDT-05.5 Định giá sản phẩm

### Mã yêu cầu

HBDT-05.5

### Tên yêu cầu

Quy tắc định giá sản phẩm

### Mô tả

Chủ hộ kinh doanh phải xác định giá bán cho từng đơn vị tính.

### Độ ưu tiên

P0 – Bắt buộc

### Tiêu chí chấp nhận

Giá được áp dụng chính xác khi bán hàng.

---

## HBDT-05.6 Tìm kiếm sản phẩm

### Mã yêu cầu

HBDT-05.6

### Tên yêu cầu

Tìm kiếm sản phẩm tức thời

### Mô tả

Nhân viên phải có thể tìm kiếm sản phẩm nhanh chóng khi tạo đơn bán hàng.

### Độ ưu tiên

P0 – Bắt buộc

### Tiêu chí chấp nhận

Kết quả tìm kiếm xuất hiện trong vòng hai giây.

---

# HBDT-06 Quản lý tồn kho

## HBDT-06.1 Nhập kho

### Mã yêu cầu

HBDT-06.1

### Tên yêu cầu

Nhập kho

### Mô tả

Chủ hộ kinh doanh phải ghi nhận các lần nhập kho.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

Chủ hộ kinh doanh

### Đầu vào

- Sản phẩm
- Số lượng
- Đơn vị
- Nhà cung cấp
- Ngày nhập

### Đầu ra

Số lượng tồn kho được cập nhật.

### Luồng chính

1. Chủ hộ kinh doanh mở chức năng Tồn kho.
2. Chọn Nhập kho.
3. Nhập thông tin nhập kho.
4. Hệ thống kiểm tra dữ liệu.
5. Tồn kho được cập nhật.

### Tiêu chí chấp nhận

Số lượng tồn kho tăng chính xác.

---

## HBDT-06.2 Tồn kho hiện tại

### Mã yêu cầu

HBDT-06.2

### Tên yêu cầu

Số dư tồn kho hiện tại

### Mô tả

Hệ thống phải tính toán số dư tồn kho theo thời gian thực.

### Độ ưu tiên

P0 – Bắt buộc

### Tiêu chí chấp nhận

Tồn kho hiển thị phải bằng số lượng tồn thực tế.

---

## HBDT-06.3 Tự động trừ tồn kho

### Mã yêu cầu

HBDT-06.3

### Tên yêu cầu

Tự động trừ tồn kho

### Mô tả

Tồn kho phải tự động giảm sau khi đơn hàng được xác nhận.

### Độ ưu tiên

P0 – Bắt buộc

### Tiêu chí chấp nhận

Số lượng tồn kho thay đổi ngay sau khi xác nhận.

---

## HBDT-06.4 Điều chỉnh tồn kho

### Mã yêu cầu

HBDT-06.4

### Tên yêu cầu

Điều chỉnh tồn kho

### Mô tả

Chủ hộ kinh doanh có thể điều chỉnh số lượng tồn kho thủ công.

### Độ ưu tiên

P0 – Bắt buộc

### Đầu vào

- Sản phẩm
- Số lượng điều chỉnh
- Lý do

### Quy tắc nghiệp vụ

Lý do điều chỉnh là bắt buộc.

### Tiêu chí chấp nhận

Lịch sử điều chỉnh được ghi nhận.

---

## HBDT-06.5 Lịch sử tồn kho

### Mã yêu cầu

HBDT-06.5

### Tên yêu cầu

Lịch sử tồn kho

### Mô tả

Hệ thống phải ghi nhận mọi giao dịch tồn kho.

### Độ ưu tiên

P0 – Bắt buộc

### Tiêu chí chấp nhận

Người dùng có thể tìm kiếm lịch sử tồn kho.

---

## HBDT-06.6 Cảnh báo tồn kho thấp

### Mã yêu cầu

HBDT-06.6

### Tên yêu cầu

Thông báo tồn kho thấp

### Mô tả

Hệ thống phải thông báo cho chủ hộ kinh doanh khi tồn kho giảm xuống dưới ngưỡng tối thiểu.

### Độ ưu tiên

P0 – Bắt buộc

### Tiêu chí chấp nhận

Thông báo tồn kho thấp xuất hiện ngay lập tức.

---

# HBDT-07 Quản lý khách hàng và công nợ

## HBDT-07.1 Quản lý khách hàng

### Mã yêu cầu

HBDT-07.1

### Tên yêu cầu

CRUD khách hàng

### Mô tả

Chủ hộ kinh doanh phải có thể quản lý thông tin khách hàng.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

Chủ hộ kinh doanh

### Đầu vào

- Tên khách hàng
- Số điện thoại
- Địa chỉ

### Tiêu chí chấp nhận

Thông tin khách hàng được lưu thành công.

---

## HBDT-07.2 Lịch sử mua hàng của khách hàng

### Mã yêu cầu

HBDT-07.2

### Tên yêu cầu

Lịch sử mua hàng

### Mô tả

Chủ hộ kinh doanh có thể xem lại lịch sử giao dịch của khách hàng.

### Độ ưu tiên

P0 – Bắt buộc

### Tiêu chí chấp nhận

Lịch sử mua hàng được hiển thị chính xác.

---

## HBDT-07.3 Ghi nhận công nợ khách hàng

### Mã yêu cầu

HBDT-07.3

### Tên yêu cầu

Ghi nhận công nợ

### Mô tả

Nhân viên có thể ghi nhận công nợ khách hàng trong quá trình thanh toán.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

Nhân viên

### Luồng chính

1. Nhân viên tạo đơn hàng.
2. Khách hàng chọn mua chịu.
3. Khoản công nợ chưa thanh toán được ghi nhận.
4. Số dư công nợ của khách hàng được cập nhật.

### Tiêu chí chấp nhận

Số dư công nợ được cập nhật ngay lập tức.

---

## HBDT-07.4 Thanh toán công nợ

### Mã yêu cầu

HBDT-07.4

### Tên yêu cầu

Thanh toán công nợ

### Mô tả

Chủ hộ kinh doanh phải ghi nhận các khoản thanh toán công nợ.

### Độ ưu tiên

P0 – Bắt buộc

### Tiêu chí chấp nhận

Số dư chưa thanh toán giảm chính xác.

---

## HBDT-07.5 Lịch sử công nợ

### Mã yêu cầu

HBDT-07.5

### Tên yêu cầu

Lịch sử công nợ

### Mô tả

Hệ thống phải lưu trữ tất cả giao dịch công nợ.

### Độ ưu tiên

P0 – Bắt buộc

### Tiêu chí chấp nhận

Lịch sử công nợ có thể được tìm kiếm.

---

# HBDT-08 Quản lý đơn bán hàng

## HBDT-08.1 Tạo đơn bán hàng

### Mã yêu cầu

HBDT-08.1

### Tên yêu cầu

Tạo đơn bán hàng tại quầy

### Mô tả

Nhân viên phải có thể tạo đơn bán hàng cho khách mua trực tiếp tại quầy.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

Nhân viên

### Điều kiện tiên quyết

Nhân viên đã đăng nhập.

### Đầu vào

- Sản phẩm
- Số lượng
- Đơn vị
- Khách hàng (không bắt buộc)

### Đầu ra

Đơn bán hàng được tạo.

### Luồng chính

1. Nhân viên tìm kiếm sản phẩm.
2. Nhân viên thêm sản phẩm.
3. Nhân viên chọn khách hàng.
4. Nhân viên xác nhận đơn hàng.
5. Đơn bán hàng được lưu.

### Quy tắc nghiệp vụ

- Giao diện đơn bán hàng phải hỗ trợ phím tắt cho các thao tác thường dùng (ví dụ: tìm kiếm sản phẩm, cập nhật số lượng, xác nhận đơn hàng) để thanh toán nhanh.

### Tiêu chí chấp nhận

- Đơn bán hàng được tạo thành công.
- Phím tắt hoạt động chính xác đối với mọi thao tác được hỗ trợ.

---

## HBDT-08.2 Giỏ hàng

### Mã yêu cầu

HBDT-08.2

### Tên yêu cầu

Quản lý giỏ hàng

### Mô tả

Nhân viên phải có thể quản lý các sản phẩm trước khi xác nhận đơn hàng.

### Độ ưu tiên

P0 – Bắt buộc

### Chức năng

- Thêm mặt hàng
- Xóa mặt hàng
- Cập nhật số lượng
- Tính tổng tiền

### Tiêu chí chấp nhận

Tổng tiền của giỏ hàng được tính chính xác.

---

## HBDT-08.3 Xác nhận đơn hàng

### Mã yêu cầu

HBDT-08.3

### Tên yêu cầu

Xác nhận đơn hàng

### Mô tả

Nhân viên phải xác nhận các đơn hàng đã hoàn tất.

### Độ ưu tiên

P0 – Bắt buộc

### Tiêu chí chấp nhận

Tồn kho và bản ghi kế toán được cập nhật tự động.

---

## HBDT-08.4 Hủy đơn hàng

### Mã yêu cầu

HBDT-08.4

### Tên yêu cầu

Hủy đơn bán hàng

### Mô tả

Nhân viên có thể hủy các đơn hàng đang chờ xử lý.

### Độ ưu tiên

P0 – Bắt buộc

### Quy tắc nghiệp vụ

Đơn hàng đã xác nhận không thể bị hủy nếu không có sự cho phép của chủ hộ kinh doanh.

### Tiêu chí chấp nhận

Trạng thái đơn hàng chuyển thành Đã hủy.

---

## HBDT-08.5 Hóa đơn bán hàng

### Mã yêu cầu

HBDT-08.5

### Tên yêu cầu

Tạo hóa đơn bán hàng

### Mô tả

Hệ thống phải tạo hóa đơn bán hàng có thể in.

### Độ ưu tiên

P0 – Bắt buộc

### Đầu ra

- Hóa đơn có thể in
- Hóa đơn PDF

### Tiêu chí chấp nhận

Hóa đơn khớp với thông tin đơn hàng.

---

## HBDT-08.6 Lịch sử đơn hàng

### Mã yêu cầu

HBDT-08.6

### Tên yêu cầu

Lịch sử đơn bán hàng

### Mô tả

Nhân viên và chủ hộ kinh doanh có thể xem lại lịch sử đơn bán hàng.

### Độ ưu tiên

P0 – Bắt buộc

### Tiêu chí chấp nhận

Có thể tìm kiếm đơn hàng lịch sử theo khách hàng, ngày hoặc số hóa đơn.

# HBDT-09 Đơn hàng nháp AI và thông báo thời gian thực

## HBDT-09.1 Yêu cầu tạo đơn hàng bằng văn bản

### Mã yêu cầu

HBDT-09.1

### Tên yêu cầu

Yêu cầu tạo đơn hàng bằng văn bản

### Mô tả

Hệ thống phải cho phép nhân viên hoặc chủ hộ kinh doanh gửi yêu cầu bán hàng bằng văn bản ngôn ngữ tự nhiên.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

- Nhân viên
- Chủ hộ kinh doanh

### Điều kiện tiên quyết

- Người dùng đã đăng nhập.
- Dịch vụ AI đang khả dụng.

### Đầu vào

Lệnh bằng ngôn ngữ tự nhiên.

Ví dụ:

> "Bán 5 bao xi măng cho ông Ba và ghi nhận công nợ."

### Đầu ra

AI nhận yêu cầu để xử lý.

### Luồng chính

1. Người dùng nhập lệnh bằng ngôn ngữ tự nhiên.
2. Hệ thống gửi yêu cầu đến dịch vụ AI.
3. AI phân tích lệnh.
4. Kết quả xử lý được trả về.

### Luồng thay thế

- Dịch vụ AI không khả dụng.
- Lệnh không hợp lệ.

### Quy tắc nghiệp vụ

Chỉ người dùng đã xác thực mới có thể sử dụng các tính năng AI.

### Tiêu chí chấp nhận

Yêu cầu được gửi thành công đến dịch vụ AI.

---

## HBDT-09.2 Yêu cầu tạo đơn hàng bằng giọng nói

### Mã yêu cầu

HBDT-09.2

### Tên yêu cầu

Yêu cầu tạo đơn hàng chuyển từ giọng nói thành văn bản

### Mô tả

Hệ thống phải chuyển lời nói tiếng Việt thành văn bản trước khi AI xử lý.

### Độ ưu tiên

P1 – Cao

### Tác nhân

Nhân viên

### Điều kiện tiên quyết

Quyền truy cập microphone đã được cấp.

### Đầu vào

Bản ghi âm giọng nói.

### Đầu ra

Văn bản tiếng Việt đã được nhận dạng.

### Luồng chính

1. Nhân viên bắt đầu ghi âm giọng nói.
2. Âm thanh được thu lại.
3. Dịch vụ chuyển giọng nói thành văn bản chuyển âm thanh thành văn bản.
4. Văn bản được tạo được hiển thị.
5. Người dùng xác nhận hoặc chỉnh sửa văn bản.

### Luồng thay thế

- Nhận dạng giọng nói thất bại.
- Chất lượng âm thanh kém.

### Quy tắc nghiệp vụ

Người dùng có thể chỉnh sửa văn bản đã nhận dạng trước khi gửi.

### Tiêu chí chấp nhận

Giọng nói được chuyển đổi với độ chính xác chấp nhận được.

---

## HBDT-09.3 Phân tích đơn hàng bằng ngôn ngữ tự nhiên

### Mã yêu cầu

HBDT-09.3

### Tên yêu cầu

Xử lý ngôn ngữ tự nhiên

### Mô tả

Dịch vụ AI phải trích xuất thông tin nghiệp vụ từ các lệnh ngôn ngữ tự nhiên.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

Hệ thống

### Thông tin được trích xuất

- Khách hàng
- Sản phẩm
- Số lượng
- Đơn vị
- Giá bán (không bắt buộc)
- Yêu cầu ghi công nợ
- Ghi chú bổ sung

### Tiêu chí chấp nhận

Tất cả thông tin được trích xuất phải phù hợp với ý định của người dùng trong phạm vi có thể.

---

## HBDT-09.4 Đối sánh sản phẩm và khách hàng

### Mã yêu cầu

HBDT-09.4

### Tên yêu cầu

Đối sánh thực thể

### Mô tả

Dịch vụ AI phải đối sánh tên sản phẩm và khách hàng đã trích xuất với các bản ghi hiện có.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

Hệ thống

### Quy tắc nghiệp vụ

- Nên đề xuất các tên tương tự.
- Ưu tiên kết quả khớp chính xác.

### Tiêu chí chấp nhận

Sản phẩm và khách hàng chính xác được xác định.

---

## HBDT-09.5 Phát hiện sự mơ hồ

### Mã yêu cầu

HBDT-09.5

### Tên yêu cầu

Phát hiện sự mơ hồ

### Mô tả

Dịch vụ AI phải phát hiện các yêu cầu không đầy đủ hoặc mơ hồ.

### Độ ưu tiên

P0 – Bắt buộc

### Ví dụ

Đầu vào:

> "Bán xi măng."

Thông tin còn thiếu:

- Khách hàng
- Số lượng

### Đầu ra

AI yêu cầu bổ sung thông tin còn thiếu.

### Tiêu chí chấp nhận

Các lệnh mơ hồ không bao giờ được tự động chuyển thành đơn hàng đã xác nhận.

---

## HBDT-09.6 Tạo đơn hàng nháp

### Mã yêu cầu

HBDT-09.6

### Tên yêu cầu

Tạo đơn hàng nháp

### Mô tả

Dịch vụ AI phải tự động tạo đơn bán hàng nháp.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

Hệ thống

### Đầu ra

Đơn hàng nháp.

### Tiêu chí chấp nhận

Đơn nháp được tạo chứa đầy đủ thông tin đã trích xuất.

---

## HBDT-09.7 Kiểm tra đơn hàng nháp

### Mã yêu cầu

HBDT-09.7

### Tên yêu cầu

Kiểm tra đơn hàng nháp

### Mô tả

Nhân viên hoặc chủ hộ kinh doanh phải kiểm tra các đơn hàng nháp do AI tạo trước khi xác nhận.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

- Nhân viên
- Chủ hộ kinh doanh

### Thao tác khả dụng

- Chỉnh sửa
- Xác nhận
- Từ chối

### Quy tắc nghiệp vụ

Đơn hàng do AI tạo không bao giờ trở thành đơn hàng chính thức nếu chưa được xác nhận.

### Tiêu chí chấp nhận

Người dùng có thể chỉnh sửa bất kỳ trường nào trước khi xác nhận.

---

## HBDT-09.8 Thông báo thời gian thực

### Mã yêu cầu

HBDT-09.8

### Tên yêu cầu

Thông báo thời gian thực

### Mô tả

Nhân viên hoặc chủ hộ kinh doanh phải nhận được thông báo mỗi khi có đơn hàng nháp mới được tạo.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

- Nhân viên
- Chủ hộ kinh doanh

### Tiêu chí chấp nhận

Thông báo xuất hiện mà không cần tải lại trang.

---

## HBDT-09.9 Cơ chế dự phòng khi AI không khả dụng

### Mã yêu cầu

HBDT-09.9

### Tên yêu cầu

Chuyển sang thao tác thủ công

### Mô tả

Hệ thống phải cho phép tạo đơn hàng thủ công khi dịch vụ AI không khả dụng.

### Độ ưu tiên

P0 – Bắt buộc

### Tiêu chí chấp nhận

Hoạt động kinh doanh vẫn tiếp tục bình thường khi không có AI.

---

# HBDT-10 Ghi sổ và kế toán tự động

## HBDT-10.1 Ghi nhận giao dịch kế toán

### Mã yêu cầu

HBDT-10.1

### Tên yêu cầu

Mô hình giao dịch kế toán

### Mô tả

Hệ thống phải tự động ghi nhận các giao dịch kế toán phát sinh từ hoạt động kinh doanh.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

Hệ thống

### Sự kiện kích hoạt

- Bán hàng
- Nhập kho
- Phát sinh công nợ
- Thanh toán công nợ

### Tiêu chí chấp nhận

Các bản ghi kế toán được tạo tự động.

---

## HBDT-10.2 Ghi sổ bán hàng tự động

### Mã yêu cầu

HBDT-10.2

### Tên yêu cầu

Ghi sổ bán hàng

### Mô tả

Các giao dịch bán hàng phải tự động tạo bút toán kế toán.

### Độ ưu tiên

P0 – Bắt buộc

### Tiêu chí chấp nhận

Mỗi đơn hàng đã xác nhận sẽ tạo một bản ghi kế toán tương ứng.

---

## HBDT-10.3 Ghi sổ tồn kho tự động

### Mã yêu cầu

HBDT-10.3

### Tên yêu cầu

Ghi sổ tồn kho

### Mô tả

Hoạt động nhập và trừ tồn kho phải tự động cập nhật các bản ghi kế toán.

### Độ ưu tiên

P0 – Bắt buộc

### Tiêu chí chấp nhận

Số liệu kế toán tồn kho luôn khớp với biến động kho.

---

## HBDT-10.4 Ghi sổ công nợ tự động

### Mã yêu cầu

HBDT-10.4

### Tên yêu cầu

Ghi sổ công nợ

### Mô tả

Công nợ khách hàng và các khoản thanh toán phải tự động cập nhật sổ kế toán.

### Độ ưu tiên

P0 – Bắt buộc

### Tiêu chí chấp nhận

Công nợ chưa thanh toán luôn khớp với bản ghi kế toán.

---

## HBDT-10.5 Sổ doanh thu

### Mã yêu cầu

HBDT-10.5

### Tên yêu cầu

Sổ chi tiết doanh thu

### Mô tả

Hệ thống phải tạo sổ chi tiết doanh thu theo Thông tư 88/2021/TT-BTC.

### Độ ưu tiên

P0 – Bắt buộc

### Tiêu chí chấp nhận

Sổ doanh thu tuân theo mẫu báo cáo chính thức.

---

## HBDT-10.6 Báo cáo kinh doanh

### Mã yêu cầu

HBDT-10.6

### Tên yêu cầu

Tạo báo cáo kế toán

### Mô tả

Hệ thống phải tự động tạo các báo cáo kế toán theo quy định của Việt Nam.

### Độ ưu tiên

P0 – Bắt buộc

### Báo cáo được tạo

- Sổ chi tiết doanh thu
- Báo cáo công nợ chưa thanh toán
- Báo cáo hoạt động kinh doanh

### Tiêu chí chấp nhận

Báo cáo chứa thông tin đầy đủ và chính xác.

---

## HBDT-10.7 Kiểm tra báo cáo

### Mã yêu cầu

HBDT-10.7

### Tên yêu cầu

Kiểm tra báo cáo kế toán

### Mô tả

Chủ hộ kinh doanh phải kiểm tra các báo cáo kế toán do AI tạo trước khi phê duyệt cuối cùng.

### Độ ưu tiên

P0 – Bắt buộc

### Thao tác khả dụng

- Kiểm tra
- Chỉnh sửa
- Phê duyệt
- Từ chối

### Tiêu chí chấp nhận

Chủ hộ kinh doanh có thể chỉnh sửa báo cáo trước khi xuất.

---

## HBDT-10.8 Quản lý phiên bản mẫu báo cáo

### Mã yêu cầu

HBDT-10.8

### Tên yêu cầu

Quản lý mẫu kế toán

### Mô tả

Hệ thống phải hỗ trợ nhiều phiên bản mẫu báo cáo kế toán.

### Độ ưu tiên

P1 – Cao

### Quy tắc nghiệp vụ

Quy định mới của cơ quan nhà nước không được ghi đè lên các báo cáo lịch sử.

### Tiêu chí chấp nhận

Các báo cáo lịch sử vẫn không thay đổi sau khi cập nhật mẫu.

---

## HBDT-10.9 Xuất báo cáo

### Mã yêu cầu

HBDT-10.9

### Tên yêu cầu

Xuất báo cáo kế toán

### Mô tả

Người dùng phải có thể xuất báo cáo kế toán.

### Định dạng xuất

- PDF
- Excel

### Độ ưu tiên

P0 – Bắt buộc

### Tiêu chí chấp nhận

Tệp xuất ra khớp với báo cáo được hiển thị.

---

# HBDT-11 Báo cáo và phân tích

## HBDT-11.1 Bảng điều khiển kinh doanh

### Mã yêu cầu

HBDT-11.1

### Tên yêu cầu

Bảng điều khiển kinh doanh

### Mô tả

Hệ thống phải cung cấp bảng điều khiển kinh doanh để chủ hộ theo dõi các chỉ số kinh doanh và chỉ số hiệu suất chính.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

Chủ hộ kinh doanh

### Điều kiện tiên quyết

Chủ hộ kinh doanh đã đăng nhập.

### Đầu vào

- Lựa chọn khoảng thời gian (hằng ngày, hằng tuần, hằng tháng, tùy chỉnh)

### Đầu ra

Bảng điều khiển hiển thị các chỉ số kinh doanh chính.

### Luồng chính

1. Chủ hộ kinh doanh mở Bảng điều khiển.
2. Chủ hộ kinh doanh chọn khoảng thời gian.
3. Hệ thống truy xuất và tổng hợp dữ liệu kinh doanh.
4. Bảng điều khiển hiển thị các chỉ số sau:
   - Tổng doanh thu
   - Số lượng đơn hàng
   - Sản phẩm bán chạy
   - Cảnh báo tồn kho thấp
   - Công nợ khách hàng chưa thanh toán
5. Dữ liệu được trực quan hóa bằng biểu đồ và thẻ tổng hợp.

### Quy tắc nghiệp vụ

- Dữ liệu bảng điều khiển phải được cập nhật theo thời gian thực hoặc gần thời gian thực.
- Các thẻ tổng hợp phải hiển thị: tổng doanh thu, tổng số đơn hàng, công nợ chưa thanh toán và số lượng mặt hàng tồn kho thấp.
- Biểu đồ phải hỗ trợ chế độ xem theo ngày, tuần và tháng.

### Tiêu chí chấp nhận

- Chủ hộ kinh doanh có thể chọn các khoảng thời gian khác nhau.
- Tất cả các chỉ số bắt buộc được hiển thị chính xác.
- Biểu đồ và thẻ tổng hợp hiển thị không có lỗi.

---

## HBDT-11.2 Báo cáo doanh thu

### Mã yêu cầu

HBDT-11.2

### Tên yêu cầu

Báo cáo doanh thu

### Mô tả

Hệ thống phải tạo báo cáo doanh thu thể hiện thu nhập trong các khoảng thời gian đã chọn.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

Chủ hộ kinh doanh

### Đầu ra

- Tổng hợp doanh thu theo ngày, tuần, tháng
- So sánh doanh thu giữa các kỳ
- Trực quan hóa bằng biểu đồ

### Tiêu chí chấp nhận

Dữ liệu doanh thu khớp với các giao dịch bán hàng thực tế trong kỳ đã chọn.

---

## HBDT-11.3 Báo cáo sản phẩm bán chạy

### Mã yêu cầu

HBDT-11.3

### Tên yêu cầu

Sản phẩm bán chạy

### Mô tả

Hệ thống phải xác định và hiển thị sản phẩm bán chạy dựa trên số lượng bán và doanh thu.

### Độ ưu tiên

P1 – Cao

### Tác nhân

Chủ hộ kinh doanh

### Đầu ra

- Xếp hạng sản phẩm theo số lượng bán
- Xếp hạng sản phẩm theo doanh thu tạo ra

### Tiêu chí chấp nhận

Danh sách sản phẩm bán chạy phản ánh đúng dữ liệu bán hàng thực tế.

---

## HBDT-11.4 Bảng điều khiển cảnh báo tồn kho thấp

### Mã yêu cầu

HBDT-11.4

### Tên yêu cầu

Hiển thị cảnh báo tồn kho thấp

### Mô tả

Hệ thống phải hiển thị nổi bật cảnh báo tồn kho thấp trên bảng điều khiển.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

Chủ hộ kinh doanh

### Tiêu chí chấp nhận

Các sản phẩm dưới ngưỡng tồn kho tối thiểu được liệt kê kèm số lượng hiện tại.

---

## HBDT-11.5 Tổng quan công nợ chưa thanh toán

### Mã yêu cầu

HBDT-11.5

### Tên yêu cầu

Tổng quan công nợ chưa thanh toán

### Mô tả

Hệ thống phải hiển thị tổng hợp toàn bộ công nợ khách hàng chưa thanh toán.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

Chủ hộ kinh doanh

### Tiêu chí chấp nhận

Tổng công nợ chưa thanh toán khớp với tổng số dư chưa trả của tất cả khách hàng.

---

# HBDT-12 Quản trị hệ thống

## HBDT-12.1 Quản lý tài khoản chủ hộ kinh doanh

### Mã yêu cầu

HBDT-12.1

### Tên yêu cầu

Quản lý tài khoản chủ hộ kinh doanh

### Mô tả

Quản trị viên phải quản lý tất cả tài khoản chủ hộ kinh doanh đã đăng ký trên nền tảng.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

Quản trị viên

### Chức năng

- Xem danh sách tất cả tài khoản chủ hộ kinh doanh
- Tìm kiếm tài khoản chủ hộ theo tên, email hoặc số điện thoại
- Lọc tài khoản theo trạng thái (hoạt động, không hoạt động, chờ xác minh)
- Xem hồ sơ chi tiết của chủ hộ kinh doanh
- Kích hoạt hoặc vô hiệu hóa tài khoản chủ hộ kinh doanh

### Tiêu chí chấp nhận

- Quản trị viên có thể tìm kiếm và lọc tài khoản chủ hộ kinh doanh.
- Thay đổi trạng thái tài khoản được áp dụng ngay lập tức.

---

## HBDT-12.2 Quản lý giá gói thuê bao

### Mã yêu cầu

HBDT-12.2

### Tên yêu cầu

Quản lý giá gói thuê bao

### Mô tả

Quản trị viên phải cấu hình và cập nhật giá gói thuê bao.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

Quản trị viên

### Đầu vào

- Tên gói (Cơ bản, Chuyên nghiệp, v.v.)
- Giá theo tháng
- Giá theo năm
- Các tính năng đi kèm

### Đầu ra

Giá đã cập nhật được hiển thị trên trang Bảng giá công khai.

### Tiêu chí chấp nhận

- Giá cập nhật được lưu và hiển thị chính xác.
- Dữ liệu giá lịch sử được bảo toàn.

---

## HBDT-12.3 Bảng điều khiển phân tích nền tảng

### Mã yêu cầu

HBDT-12.3

### Tên yêu cầu

Bảng điều khiển phân tích nền tảng

### Mô tả

Hệ thống phải cung cấp bảng điều khiển phân tích để quản trị viên theo dõi các chỉ số trên toàn nền tảng.

### Độ ưu tiên

P0 – Bắt buộc

### Tác nhân

Quản trị viên

### Chỉ số

- Tổng số người dùng đang hoạt động
- Số lượng gói thuê bao mới
- Doanh thu nền tảng
- Xu hướng tăng trưởng gói thuê bao
- Phản hồi và đánh giá của người dùng

### Tiêu chí chấp nhận

Quản trị viên có thể xem mọi chỉ số phân tích nền tảng và chuyển đến các màn hình chi tiết.

---

## HBDT-12.4 Cấu hình hệ thống

### Mã yêu cầu

HBDT-12.4

### Tên yêu cầu

Quản lý cấu hình hệ thống

### Mô tả

Quản trị viên phải quản lý các thiết lập toàn cục của hệ thống.

### Độ ưu tiên

P1 – Cao

### Tác nhân

Quản trị viên

### Chức năng

- Cập nhật thiết lập toàn cục của hệ thống
- Cấu hình tham số dịch vụ AI
- Quản lý mẫu báo cáo kế toán
- Gửi thông báo hệ thống đến tất cả người dùng

### Tiêu chí chấp nhận

- Thay đổi cấu hình có hiệu lực sau khi lưu.
- Thông báo hệ thống được gửi đến người dùng.
- Cập nhật cấu hình AI được áp dụng mà không làm gián đoạn dịch vụ.

---

# 7. Yêu cầu phi chức năng

Các yêu cầu phi chức năng sau đây xác định các thuộc tính chất lượng mà hệ thống phải đáp ứng.

---

## 7.1. Bảo mật & Riêng tư

### NFR-01 Bảo vệ dữ liệu

| Thuộc tính | Mô tả |
|-----------|-------------|
| ID | NFR-01 |
| Tên | Bảo vệ dữ liệu kinh doanh |
| Mô tả | Hệ thống phải bảo vệ dữ liệu kinh doanh của từng hộ kinh doanh, bao gồm dữ liệu đơn hàng, sản phẩm, khách hàng, công nợ và báo cáo. |
| Tiêu chí chấp nhận | Người dùng không thể truy cập dữ liệu kinh doanh ngoài phạm vi được cấp quyền; hệ thống phải từ chối mọi nỗ lực truy cập trái phép. |

---

### NFR-02 Kiểm soát truy cập dựa trên vai trò

| Thuộc tính | Mô tả |
|-----------|-------------|
| ID | NFR-02 |
| Tên | Kiểm soát truy cập dựa trên vai trò |
| Mô tả | Hệ thống phải áp dụng kiểm soát truy cập nghiêm ngặt cho ba vai trò: Nhân viên, Chủ hộ kinh doanh và Quản trị viên. |
| Tiêu chí chấp nhận | Mỗi vai trò chỉ có thể truy cập và thực hiện các chức năng được định nghĩa cho vai trò đó; các chức năng ngoài phạm vi quyền không thể được truy cập hoặc thực thi. |

---

## 7.2. Hiệu năng & Khả năng mở rộng

### NFR-03 Thời gian phản hồi

| Thuộc tính | Mô tả |
|-----------|-------------|
| ID | NFR-03 |
| Tên | Thời gian phản hồi của thao tác cốt lõi |
| Mô tả | Các thao tác cốt lõi của ứng dụng phải có thời gian phản hồi dưới 2.000 mili giây. |
| Tiêu chí chấp nhận | Kết quả đo trong môi trường kiểm thử cho thấy các thao tác cốt lõi hoàn thành trong vòng 2.000 mili giây. |

---

### NFR-04 Hỗ trợ danh mục lớn

| Thuộc tính | Mô tả |
|-----------|-------------|
| ID | NFR-04 |
| Tên | Hỗ trợ danh mục sản phẩm lớn |
| Mô tả | Hệ thống phải duy trì hiệu năng tìm kiếm và xử lý khi một hộ kinh doanh có danh mục sản phẩm lớn. |
| Tiêu chí chấp nhận | Với tập dữ liệu có quy mô được định nghĩa trong Tài liệu kiểm thử, các chức năng tìm kiếm, lọc và tạo đơn hàng hoạt động chính xác, không phát sinh lỗi chức năng. |

---

### NFR-05 Người dùng đồng thời

| Thuộc tính | Mô tả |
|-----------|-------------|
| ID | NFR-05 |
| Tên | Hỗ trợ nhiều người dùng đồng thời |
| Mô tả | Hệ thống phải cho phép nhiều người dùng thao tác đồng thời mà không gây mất nhất quán dữ liệu. |
| Tiêu chí chấp nhận | Với số phiên đồng thời được định nghĩa trong Tài liệu kiểm thử, người dùng có thể thực hiện thao tác và dữ liệu vẫn nhất quán. |

---

## 7.3. Độ tin cậy & Độ chính xác của AI

### NFR-06 Kiểm tra kết quả AI

| Thuộc tính | Mô tả |
|-----------|-------------|
| ID | NFR-06 |
| Tên | Kiểm tra kết quả AI |
| Mô tả | Nhân viên hoặc chủ hộ kinh doanh phải có thể kiểm tra, chỉnh sửa hoặc từ chối đơn hàng nháp do AI tạo trước khi xác nhận. |
| Tiêu chí chấp nhận | Người dùng có thể thực hiện cả ba thao tác (kiểm tra, chỉnh sửa, từ chối) đối với một đơn hàng nháp. |

---

### NFR-07 Vận hành dự phòng khi AI không khả dụng

| Thuộc tính | Mô tả |
|-----------|-------------|
| ID | NFR-07 |
| Tên | Thao tác thủ công khi AI không khả dụng |
| Mô tả | Khi các tính năng AI tạm thời không khả dụng, hệ thống vẫn phải cho phép tạo và xử lý đơn hàng thủ công. |
| Tiêu chí chấp nhận | Khi dịch vụ AI bị vô hiệu hóa hoặc không phản hồi, người dùng vẫn có thể đăng nhập và tạo đơn hàng tại quầy theo cách thủ công. |

---

## 7.4. Khả năng sử dụng & Tiếp cận

### NFR-08 Giao diện đơn giản và thiết kế đáp ứng

| Thuộc tính | Mô tả |
|-----------|-------------|
| ID | NFR-08 |
| Tên | Giao diện đơn giản và tương thích thiết bị |
| Mô tả | Giao diện ứng dụng phải đơn giản, dễ hiểu, phù hợp với người dùng có kỹ năng số hạn chế và đáp ứng với các kích thước màn hình khác nhau trên nền tảng triển khai. |
| Tiêu chí chấp nhận | Các màn hình chính hiển thị và hoạt động chính xác trên nền tảng triển khai đã chọn. Nếu triển khai ứng dụng web, giao diện phải thích ứng phù hợp với màn hình máy tính và thiết bị di động. |

---

### NFR-09 Giao diện tiếng Việt

| Thuộc tính | Mô tả |
|-----------|-------------|
| ID | NFR-09 |
| Tên | Hỗ trợ tiếng Việt |
| Mô tả | Toàn bộ nội dung giao diện dành cho người dùng phải được hiển thị bằng tiếng Việt. |
| Tiêu chí chấp nhận | Các màn hình chính, nhãn chức năng và thông báo được hiển thị bằng tiếng Việt. |

---

### NFR-10 Hỗ trợ Unicode

| Thuộc tính | Mô tả |
|-----------|-------------|
| ID | NFR-10 |
| Tên | Bảo toàn ký tự Unicode |
| Mô tả | Hệ thống phải lưu trữ và hiển thị chính xác ký tự tiếng Việt có dấu và dữ liệu Unicode. |
| Tiêu chí chấp nhận | Dữ liệu tiếng Việt được nhập, lưu, tìm kiếm và hiển thị mà không mất dấu hoặc xuất hiện ký tự sai. |

---

### NFR-11 Thông báo thời gian thực

| Thuộc tính | Mô tả |
|-----------|-------------|
| ID | NFR-11 |
| Tên | Thông báo thời gian thực |
| Mô tả | Hệ thống phải cung cấp thông báo thời gian thực cho các sự kiện được chỉ định, đặc biệt khi một đơn hàng nháp mới do AI tạo được sinh ra. |
| Tiêu chí chấp nhận | Thông báo mới xuất hiện trên giao diện của người dùng đã đăng nhập mà không cần tải lại toàn bộ trang. |

---

## 7.5. Tuân thủ & Báo cáo

### NFR-12 Tạo báo cáo chính xác

| Thuộc tính | Mô tả |
|-----------|-------------|
| ID | NFR-12 |
| Tên | Báo cáo kế toán chính xác |
| Mô tả | Hệ thống phải tự động tạo sổ và báo cáo kế toán theo Thông tư 88/2021/TT-BTC. Dữ liệu phải được tổng hợp chính xác từ các giao dịch đã ghi nhận bằng phiên bản mẫu đang có hiệu lực. |
| Tiêu chí chấp nhận | Số liệu báo cáo khớp với dữ liệu giao dịch nguồn trong kỳ báo cáo; cấu trúc và các trường tuân theo phiên bản mẫu đang được áp dụng. |

---

### NFR-13 Kiểm tra báo cáo do AI tạo

| Thuộc tính | Mô tả |
|-----------|-------------|
| ID | NFR-13 |
| Tên | Kiểm tra báo cáo do AI tạo |
| Mô tả | Chủ hộ kinh doanh phải có thể kiểm tra, chỉnh sửa hoặc từ chối báo cáo do AI tạo trước khi sử dụng. |
| Tiêu chí chấp nhận | Chủ hộ kinh doanh có thể thực hiện các thao tác xem, chỉnh sửa và từ chối đối với báo cáo do AI tạo. |

---

### NFR-14 Quản lý phiên bản mẫu

| Thuộc tính | Mô tả |
|-----------|-------------|
| ID | NFR-14 |
| Tên | Quản lý phiên bản mẫu báo cáo |
| Mô tả | Nền tảng phải hỗ trợ cập nhật và quản lý phiên bản các mẫu sổ và báo cáo kế toán để tuân thủ những thay đổi của biểu mẫu chính thức do cơ quan có thẩm quyền ban hành. |
| Tiêu chí chấp nhận | Quản trị viên có thể tải lên phiên bản mẫu mới, đặt ngày hiệu lực và hệ thống sử dụng đúng phiên bản sau khi cấu hình có hiệu lực. |

---

# 8. Yêu cầu cơ sở dữ liệu

## 8.1. MySQL — Các bảng chính

Hệ thống sử dụng MySQL để lưu trữ tất cả dữ liệu kinh doanh. Các bảng chính sau đây được yêu cầu.

| STT | Bảng | Mô tả | Quan hệ chính |
|-----|------|-------|---------------|
| 1 | `users` | Tài khoản người dùng (Chủ hộ kinh doanh, Nhân viên, Quản trị viên) | — |
| 2 | `roles` | Vai trò người dùng | `users` ↔ `roles` (N:N) |
| 3 | `businesses` | Hồ sơ hộ kinh doanh | `businesses` → `users` (N:1) |
| 4 | `subscriptions` | Đăng ký gói thuê bao | `subscriptions` → `businesses`, `subscription_plans` |
| 5 | `subscription_plans` | Định nghĩa gói thuê bao | — |
| 6 | `subscription_invoices` | Hóa đơn dịch vụ từ thanh toán | `subscription_invoices` → `subscriptions` |
| 7 | `product_categories` | Quản lý danh mục sản phẩm | — |
| 8 | `products` | Danh mục sản phẩm | `products` → `businesses`, `product_categories` |
| 9 | `product_units` | Nhiều đơn vị tính cho mỗi sản phẩm | `product_units` → `products` |
| 10 | `inventory_transactions` | Ghi nhận nhập/xuất kho | `inventory_transactions` → `products`, `businesses` |
| 11 | `inventory_balance` | Số lượng tồn kho hiện tại | `inventory_balance` → `products`, `product_units` |
| 12 | `customers` | Thông tin khách hàng | `customers` → `businesses` |
| 13 | `customer_debts` | Ghi nhận công nợ khách hàng | `customer_debts` → `customers`, `orders` |
| 14 | `debt_payments` | Lịch sử thanh toán công nợ | `debt_payments` → `customers` |
| 15 | `orders` | Đơn bán hàng | `orders` → `businesses`, `customers`, `users` |
| 16 | `order_items` | Chi tiết sản phẩm trong đơn hàng | `order_items` → `orders`, `products` |
| 17 | `draft_orders` | Đơn hàng nháp do AI tạo | `draft_orders` → `businesses`, `customers` |
| 18 | `draft_order_items` | Chi tiết sản phẩm trong đơn nháp | `draft_order_items` → `draft_orders`, `products` |
| 19 | `accounting_ledger` | Bút toán ghi sổ kế toán tự động | `accounting_ledger` → `orders`, `businesses` |
| 20 | `accounting_reports` | Báo cáo kế toán đã tạo | `accounting_reports` → `businesses` |
| 21 | `report_templates` | Phiên bản mẫu báo cáo kế toán | — |
| 22 | `notifications` | Thông báo hệ thống thời gian thực | `notifications` → `users` |
| 23 | `audit_logs` | Nhật ký kiểm toán cho thao tác nhạy cảm | `audit_logs` → `users` |
| 24 | `ai_config` | Cấu hình dịch vụ AI | — |

## 8.2. Redis — Cấu trúc Cache (Tùy chọn)

Nếu sử dụng Redis cho bộ nhớ đệm, các key pattern sau được khuyến nghị.

| Mẫu khóa | Mô tả | TTL |
|-------------|-------|-----|
| `business:{id}` | Dữ liệu hồ sơ hộ kinh doanh | 1 giờ |
| `product:list:{businessId}:{page}` | Danh sách sản phẩm | 5 phút |
| `product:{id}` | Chi tiết sản phẩm | 30 phút |
| `category:{businessId}` | Danh sách danh mục | 1 giờ |
| `customer:{id}` | Chi tiết khách hàng | 15 phút |
| `dashboard:{businessId}:{period}` | Cache bảng điều khiển phân tích | 5 phút |
| `notification:unread:{userId}` | Số thông báo chưa đọc | 1 phút |

---

# 9. Ma trận truy xuất yêu cầu

## 9.1. Ánh xạ Yêu cầu Người dùng (URD) → SRS

Ma trận sau ánh xạ từng yêu cầu người dùng từ tài liệu URD đến yêu cầu SRS tương ứng.

| Mã URD | Tên yêu cầu URD | Yêu cầu SRS | Module | Độ ưu tiên |
| HBDT-NV-01 | Đăng nhập hệ thống | HBDT-03.1 Đăng nhập người dùng | Xác thực | P0 |
| HBDT-NV-02 | Lập đơn bán hàng tại quầy | HBDT-08.1, HBDT-08.2, HBDT-05.6 | Bán hàng / Sản phẩm | P0 |
| HBDT-NV-03 | Ghi nhận bán chịu và công nợ | HBDT-07.3 Ghi nhận công nợ khách hàng | Khách hàng & Công nợ | P0 |
| HBDT-NV-04 | In và lưu trữ đơn bán hàng | HBDT-08.5 Hóa đơn bán hàng | Bán hàng | P0 |
| HBDT-NV-05 | Nhận thông báo đơn hàng nháp | HBDT-09.8 Thông báo thời gian thực | Đơn hàng nháp AI | P0 |
| HBDT-NV-06 | Kiểm tra/xác nhận/từ chối đơn hàng nháp | HBDT-09.7 Kiểm tra đơn hàng nháp | Đơn hàng nháp AI | P0 |
| HBDT-CH-01 | Quản lý danh mục sản phẩm | HBDT-05.1 đến HBDT-05.6 | Danh mục sản phẩm | P0 |
| HBDT-CH-02 | Quản lý tồn kho | HBDT-06.1 đến HBDT-06.6 | Tồn kho | P0 |
| HBDT-CH-03 | Quản lý khách hàng và công nợ | HBDT-07.1 đến HBDT-07.5 | Khách hàng & Công nợ | P0 |
| HBDT-CH-04 | Xem báo cáo và phân tích | HBDT-11.1 đến HBDT-11.5 | Báo cáo và phân tích | P0 |
| HBDT-CH-05 | Quản lý tài khoản Nhân viên | HBDT-03.4 Quản lý nhân viên | Xác thực | P0 |
| HBDT-HT-01 | Đơn hàng nháp từ ngôn ngữ tự nhiên | HBDT-09.1 đến HBDT-09.7 | Đơn hàng nháp AI | P0 |
| HBDT-HT-02 | Tự động ghi sổ kế toán | HBDT-10.1 đến HBDT-10.9 | Ghi sổ kế toán | P0 |
| HBDT-QT-01 | Quản lý tài khoản chủ hộ kinh doanh | HBDT-12.1 Quản lý tài khoản chủ hộ kinh doanh | Quản trị viên | P0 |
| HBDT-QT-02 | Quản lý giá gói thuê bao | HBDT-12.2 Quản lý giá gói thuê bao | Quản trị viên | P0 |
| HBDT-QT-03 | Theo dõi số liệu nền tảng | HBDT-12.3 Phân tích nền tảng | Quản trị viên | P0 |
| HBDT-QT-04 | Quản lý cấu hình hệ thống/AI | HBDT-12.4 Cấu hình hệ thống | Quản trị viên | P1 |
| NFR-BM-01 | Bảo vệ thông tin kinh doanh | NFR-01 Bảo vệ dữ liệu | Bảo mật | — |
| NFR-BM-02 | Phân quyền theo vai trò | NFR-02 Kiểm soát truy cập dựa trên vai trò | Bảo mật | — |
| NFR-HN-01 | Thời gian phản hồi < 2000ms | NFR-03 Thời gian phản hồi | Hiệu năng | — |
| NFR-HN-02 | Hỗ trợ danh mục lớn | NFR-04 Hỗ trợ danh mục lớn | Khả năng mở rộng | — |
| NFR-HN-03 | Nhiều người dùng đồng thời | NFR-05 Người dùng đồng thời | Khả năng mở rộng | — |
| NFR-TC-01 | Kiểm soát kết quả AI | NFR-06 Kiểm tra kết quả AI | Độ tin cậy | — |
| NFR-TC-02 | Vận hành khi AI không khả dụng | NFR-07 Vận hành dự phòng khi AI không khả dụng | Độ tin cậy | — |
| NFR-KD-01 | Giao diện đơn giản, đáp ứng | NFR-08 Giao diện đơn giản | Khả năng sử dụng | — |
| NFR-KD-02 | Giao diện tiếng Việt | NFR-09 Giao diện tiếng Việt | Khả năng sử dụng | — |
| NFR-KD-03 | Bảo toàn ký tự Unicode | NFR-10 Hỗ trợ Unicode | Khả năng sử dụng | — |
| NFR-KD-04 | Thông báo thời gian thực | NFR-11 Thông báo thời gian thực | Khả năng sử dụng | — |
| NFR-TT-01 | Báo cáo chính xác theo quy định | NFR-12 Tạo báo cáo chính xác | Tuân thủ | — |
| NFR-TT-02 | Kiểm soát báo cáo do AI tạo | NFR-13 Kiểm tra báo cáo do AI tạo | Tuân thủ | — |
| NFR-TT-03 | Cập nhật biểu mẫu báo cáo | NFR-14 Quản lý phiên bản mẫu | Tuân thủ | — |

## 9.2. Thống kê theo module

| Module | Tổng yêu cầu | P0 (Bắt buộc) | P1 (Cao) |
|--------|-------------|---------------|----------|
| HBDT-01 Cổng thông tin công cộng | 2 | 2 | 0 |
| HBDT-02 Đăng ký & Thiết lập Chủ hộ kinh doanh | 4 | 3 | 1 |
| HBDT-03 Xác thực & Phân quyền | 4 | 4 | 0 |
| HBDT-04 Quản lý gói thuê bao | 5 | 4 | 0 |
| HBDT-05 Quản lý danh mục sản phẩm | 6 | 4 | 2 |
| HBDT-06 Quản lý tồn kho | 6 | 6 | 0 |
| HBDT-07 Quản lý KH & Công nợ | 5 | 5 | 0 |
| HBDT-08 Quản lý đơn bán hàng | 6 | 6 | 0 |
| HBDT-09 Đơn hàng AI & Thông báo | 9 | 8 | 1 |
| HBDT-10 Ghi sổ kế toán tự động | 9 | 8 | 1 |
| HBDT-11 Báo cáo & Phân tích | 5 | 4 | 1 |
| HBDT-12 Quản trị hệ thống | 4 | 3 | 1 |
| **Tổng chức năng** | **65** | **57** | **7** |
| Yêu cầu phi chức năng | 14 | — | — |
| **Tổng cộng** | **79** | — | — |

---

# 10. Phụ lục

## 10.1. Tổng quan các điểm cuối API

Bảng sau tổng hợp các điểm cuối REST API chính của hệ thống.

| Module | Đường dẫn cơ sở | Số lượng |
|--------|-----------|---------|
| Xác thực | `/api/auth/*` | 6 |
| Hồ sơ kinh doanh | `/api/business/*` | 8 |
| Quản lý sản phẩm | `/api/products/*` | 10 |
| Quản lý danh mục | `/api/categories/*` | 5 |
| Tồn kho | `/api/inventory/*` | 8 |
| Khách hàng | `/api/customers/*` | 8 |
| Công nợ | `/api/debts/*` | 6 |
| Đơn bán hàng | `/api/orders/*` | 8 |
| Đơn hàng AI | `/api/ai/*` | 6 |
| Gói thuê bao | `/api/subscriptions/*` | 8 |
| Ghi sổ kế toán | `/api/accounting/*` | 8 |
| Báo cáo & Phân tích | `/api/reports/*` | 6 |
| Quản trị | `/api/admin/*` | 10 |
| Thông báo | `/api/notifications/*` | 4 |
| **Tổng cộng** | | **~101** |

## 10.2. Quy ước mã yêu cầu

| Tiền tố | Ý nghĩa | Ví dụ | Ghi chú |
|---------|---------|-------|---------|
| `HBDT-01` đến `HBDT-12` | Mã module yêu cầu chức năng | HBDT-05.3 = Quản lý hình ảnh sản phẩm | Mã `HBDT` chỉ là để tham khảo, dự án sẽ được phụ thuộc vào việc phân công nhiệm vụ trên [Jira](https://java-project-platform-for-household-business.atlassian.net/jira/software/projects/SCRUM/summary)|
| `NFR-01` đến `NFR-14` | Mã yêu cầu phi chức năng | NFR-03 = Thời gian phản hồi | Tương tự như các mã `HBDT`, các yêu cầu phi chức năng cũng sẽ phụ thuộc vào việc phân công nhiệm vụ trên [Jira](https://java-project-platform-for-household-business.atlassian.net/jira/software/projects/SCRUM/summary)|
| `P0` | Độ ưu tiên — Bắt buộc (bắt buộc) | — | — |
| `P1` | Độ ưu tiên — Cao (nên có) | — | — |

## 10.3. Quy ước về Priority trên Jira
### 10.3.1. Độ ưu tiên

| Độ ưu tiên | Ý nghĩa | Mô tả | Ghi chú |
|----------|---------|-------|---------|
| `Highest` | Khẩn cấp | Chức năng cốt lõi hoặc lỗi nghiêm trọng, phải hoàn thành trước các hạng mục khác | Không thể phát hành nếu chưa hoàn thành |
| `High` | Cao | Chức năng quan trọng, cần hoàn thành trong Sprint hoặc Milestone hiện tại | Có thể ảnh hưởng đến các chức năng khác |
| `Medium` | Trung bình | Chức năng cần thiết nhưng không ảnh hưởng đến luồng chính của hệ thống | Có thể thực hiện sau các hạng mục High |
| `Low` | Thấp | Chức năng bổ sung hoặc cải thiện trải nghiệm người dùng | Có thể chuyển sang Sprint sau |
| `Lowest` | Rất thấp | Chức năng tùy chọn hoặc cải tiến nhỏ | Có thể loại bỏ nếu không đủ thời gian |

### 10.3.2. Trạng thái hoàn thành công việc

| Trạng thái công việc | Ý nghĩa | Mô tả | Ghi chú |
|----------------------|---------|-------|---------|
| `To Do` | Chưa bắt đầu | Công việc đã được tạo nhưng chưa có người thực hiện. | Khi thành viên bắt đầu làm sẽ chuyển sang `In Progress` |
| `In Progress` | Đang thực hiện | Công việc đang được thành viên phát triển hoặc triển khai. | Có thể cập nhật tiến độ trong quá trình thực hiện |
| `In Review` | Chờ xem xét | Công việc đã hoàn thành về mặt phát triển và đang chờ người phụ trách (Team Leader/Reviewer) kiểm tra hoặc review. | Nếu cần chỉnh sửa sẽ chuyển lại `In Progress` |
| `Testing` | Đang kiểm thử | Công việc đã được review và đang được kiểm thử chức năng, tích hợp hoặc nghiệm thu. | Nếu phát hiện lỗi sẽ chuyển về `In Progress`; nếu đạt yêu cầu sẽ chuyển `Done` |
| `Done` | Hoàn thành | Công việc đã được phát triển, kiểm thử và nghiệm thu thành công. | Không thực hiện chỉnh sửa thêm, trừ khi phát sinh yêu cầu hoặc lỗi mới |

**WORKFLOW**
```text
                                          To Do
                                             │
                                             ▼
                                       In Progress
                                             │
                                             ▼
                                       In Review
                                             │
                                    ┌───────┴────────┐
                                    │                │
                                 Có lỗi/Cần sửa      ▼
                                    │             Testing
                                    ▼                │                
                              In Progress     ┌──────┴───────┐
                                              │              │
                                          Test không đạt     ▼
                                              │             Done
                                              ▼
                                           In Progress
```

## 10.4. Lịch sử phiên bản tài liệu

| Phiên bản | Ngày | Mô tả thay đổi |
|-----------|------|----------------|
| 1.1 | 30/07/2026 | Thêm link Jira để phân công việc dựa trên task Jira|