<p align="center">
<h1 align="center"> Platform to Support Digital Transformation for Household Businesses </h1>
</p>

<p align="center"><em>
<b>Đề tài:</b> Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh <br>
<b>Môn học:</b> Lập trình Java </em>
<br>
<img src="https://img.shields.io/badge/Java-21-orange?logo=openjdk" alt="Java-21">
</p>

---

## Danh sách thành viên nhóm (Member)

| STT | Họ và Tên | MSSV | Vai trò | Nhiệm vụ được giao |
| :---: | :--- | :---: | :---: | :--- |
| 1 | [Nguyễn Lê Huy Tâm](https://github.com/Sleepy2608) | 056206011188 | Leader | Repository & Git Management, Authorization, Password Encoder and Security |
| 2 | [Trần Duy Tân](https://github.com/dzytan) | 083206003584 | UI Designer | Register/Login web, Owner Account Management, Searching Engine, Image, CRUD (Customer, Owner Employee, Product) |
| 3 | [Trần Văn Ngọc Thắng](https://github.com/Thang414) | 046206001641 | Tester & Debugger | Database Management, Audit Log, Measurement & Product Pricing Rules, Service Invoice Management |
| 4 | [Nguyễn Ngọc Gia Bảo](https://github.com/Baon5824) | 079206008279 | Database Manager | Database Management, CRUD (Category, Product, Subcription) |
| 5 | [Trần Hồng Sơn](https://github.com/sontran310306) | 060206012202 | Feature Developer | Employee Account Management, Subcription Management |
| 6 | [Huỳnh Đình Chấn](https://github.com/Chan-2006) | 077206002307 | Feature Developer | Manage purchase package payments, Admin Account Management, Subcription Management, RBAC, Service Invoice Management |

> **Ghi chú:**
> - Mọi người đều được giao task có backend code bằng Java (Vai trò trên chỉ bao gồm các vai trò khác ngoài Backend Developer)
> - Nhiệm vụ được giao sẽ được dựa vào nhiệm vụ được giao trên [Jira](https://java-project-platform-for-household-business.atlassian.net/jira/software/projects/SCRUM/summary)

---

## Tiến độ triển khai dự án (Project Deployment Progress)

*Tiến độ: Sprint 4 + 5*

> Các issue cần chỉnh sửa/cập nhật/phát triển/sửa lỗi sẽ được cập nhật ở phần [Issue](https://github.com/Sleepy2608/Platform-to-support-digital-transformation-for-household-businesses/issues) trên Github<br>
> Các issue trên Github sẽ được cập nhật theo tiến độ của Jira và sẽ được test trước khi merge vào nhánh chính<br>
> Ngày cập nhật lần cuối: 27/08/2026<br>

---

## Công nghệ sử dụng (Tech Stack)

| Thành phần | Công nghệ |
| :--- | :--- |
| **Frontend** | React 19, TypeScript 5, Next.js 16 (App Router), Tailwind CSS 4, Framer Motion, Lucide React |
| **Backend** | Java 21, Spring Boot 3.3, Spring Web, Spring Data JPA, Spring Security, JWT (JJWT) |
| **Database** | MySQL 8 |
| **AI Service (Tentative)** | Python, FastAPI, Uvicorn, Pydantic |
| **Build & Công cụ** | Maven, npm, ESLint, Lombok |
| **DevOps** | Docker, Docker Compose |

---

## Quản lý database & schema (Database & Schema)

### 1. Quản lý schema bằng `spring.jpa.hibernate.ddl-auto`

Project cấu hình `ddl-auto` khác nhau theo môi trường:

- `dev`: dùng `update` — Hibernate tự đồng bộ bảng khớp với entity khi chạy local (phù hợp khi database cũ).
- `prod`: dùng `validate` — chỉ kiểm tra database có khớp entity hay không, không tự ý thay đổi schema.

Khi triển khai thực tế, thay đổi schema cần được quản lý bằng migration có version (ví dụ Flyway/Liquibase hoặc SQL migration được review).

### 2. Cách biểu diễn quan hệ giữa các entity

Project sử dụng hai cách mapping tùy theo nhu cầu nghiệp vụ:

- Quan hệ object JPA (`@ManyToOne`, `@JoinColumn`) được dùng khi service cần truy cập trực tiếp entity liên quan, ví dụ `User -> Role`, `Subscription -> SubscriptionPlan` và `TermsConsent -> User`.
- Các quan hệ chỉ cần tham chiếu định danh được lưu bằng trường `Long ...Id`, ví dụ `businessId`, `productId`, `customerId`. Service kiểm tra và truy vấn entity liên quan thông qua repository khi cần.

Cách mapping có chọn lọc này giúp tránh object graph quá lớn, vòng lặp khi serialize JSON và truy vấn ngoài ý muốn do lazy/eager loading. Project cũng hạn chế khai báo collection hai chiều `@OneToMany` nếu API không thật sự cần duyệt quan hệ từ hai phía. Tên các trường `...Id` vẫn bám sát cột khóa tham chiếu trong thiết kế database.

Hibernate chỉ tự sinh ràng buộc khóa ngoại cho những quan hệ có `@JoinColumn`. Với trường `Long ...Id`, Hibernate tạo cột tham chiếu còn service chịu trách nhiệm kiểm tra bản ghi liên quan trước khi ghi dữ liệu. Đây là lựa chọn đơn giản hóa trong phạm vi môn học; khi triển khai production, các khóa ngoại/index còn lại nên được quản lý bằng migration SQL có version.

### 3. Luồng khởi động database local

```text
MySQL khởi động
    -> Spring Boot kết nối database
    -> Hibernate đọc entity
    -> Hibernate tạo/cập nhật bảng còn thiếu
    -> SeedService đọc JSON theo version/checksum
    -> Repository và service bắt đầu phục vụ API
```

Các bước chạy backend local:

1. Cài MySQL 8 và tạo/cấu hình tài khoản có quyền trên database local.
2. Sao chép `Code/Server/.env.example` thành `Code/Server/.env`.
3. Cập nhật `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`.
4. Chạy backend từ thư mục `Code/Server`:

```bash
mvn spring-boot:run
```

JDBC URL có `createDatabaseIfNotExist=true` nên database được tạo nếu chưa tồn tại và tài khoản MySQL có đủ quyền. Kết nối sử dụng `utf8mb4` để lưu tiếng Việt. Các file seed nằm trong `Code/Server/seed`; đường dẫn được xác định theo thư mục backend thay vì phụ thuộc thư mục đang đứng khi chạy lệnh.

### 4. Phạm vi và lưu ý

- Entity quản lý cấu trúc bảng phục vụ môi trường local; dữ liệu nghiệp vụ vẫn được xử lý qua controller, service và repository.
- `ddl-auto=update` có thể thêm bảng/cột nhưng không thay thế migration khi cần rename, xóa hoặc chuyển đổi dữ liệu phức tạp.
- File ảnh không lưu dưới dạng Base64/BLOB trong database. Database chỉ lưu object key, SHA-256, MIME và kích thước; file thật nằm trong thư mục upload đã được `.gitignore` (production cần persistent volume hoặc object storage).
- Mật khẩu được lưu bằng BCrypt; SHA-256 của ảnh/seed chỉ là checksum, không dùng thay cho cơ chế mã hóa mật khẩu.

---

## Cấu trúc thư mục (Project Structure - Draft) 

```
Platform-to-support-digital-transformation-for-household-businesses/
├── README.md                                  # Tài liệu giới thiệu tổng quan dự án
├── docker-compose.yml                         # Cấu hình Docker triển khai toàn bộ hệ thống
├── Code/                                      # Mã nguồn chính của dự án
│   ├── AI/                                    # AI Service - xử lý đơn hàng bằng ngôn ngữ tự nhiên (Python/FastAPI)
│   ├── Client/                                # Ứng dụng Client
│   │   └── src/frontend/                      # Giao diện web (React + TypeScript + Next.js)
│   └── Server/                                # Backend API (Java Spring Boot)
│       ├── database/                          # Script khởi tạo database
│       └── src/main/                          # Source code backend (controller, service, entity, repository, config, ...)
├── docs/                                      # Tài liệu dự án
│   ├── architecture_design/                   # Thiết kế kiến trúc hệ thống
│   ├── detailed-design/                       # Thiết kế chi tiết (database, diagrams)
│   ├── requirements/                          # Yêu cầu đề tài
│   ├── software_requirement_specification/    # Đặc tả yêu cầu phần mềm (SRS)
│   ├── user_requirements/                     # Yêu cầu người dùng
│   └── workflows/                             # Quy trình nghiệp vụ
└── Extra/                                     # Tài nguyên bổ sung, tài liệu tham khảo
```

---

## Cách chạy (How to run)

### 1. Yêu cầu
- **Intellij IDEA 2026.2**
- **Java 21**
- **Apache Maven**
- **MySQL** đã có sẵn dữ liệu (local hoặc cloud)

### 2. Clone source code

```
git clone https://github.com/Sleepy2608/Platform-to-support-digital-transformation-for-household-businesses.git
```

### 3. Cấu hình `.env` cho server
Tạo file `Code/Server/.env`:
```env
DB_HOST=<host>
DB_PORT=3000
DB_NAME=<dbname>
DB_USERNAME=<username>
DB_PASSWORD=<password>
```

Vào mục Edit Configurations -> Chọn Evironment variables -> Thêm file .env vừa tạo

### 4. Backend

- Click chuột phải vào thư mục `HbdtApplication.java`. Chọn vào `Run 'HbdtApplication.main()'`
- Hãy đảm bảo rằng bạn đã có đủ các thông tin cho file .env và MySQL đang hoạt động

### 5. Frontend

- Chuyển đường dẫn sang file frontend (`Code\Client\src\frontend`)
```text
cd ..Code\Client\src\frontend
```

- Tải thư viện npm
```text
npm install
```

- Chạy frontend
```text
npm run dev
```

- Web được chạy ở:
  * Local: http://localhost:3000/
  * Network: http://[IP_ADDRESS]/
> Lưu ý: Trang đăng nhập vào Manager/Owner/Employee được chạy ở url `http://localhost:3000/login` còn trang Admin được chạy ở url `http://localhost:3000/admin/login`.
