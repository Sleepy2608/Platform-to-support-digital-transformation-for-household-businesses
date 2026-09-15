<p align="center">
  <h1 align="center"> Platform to Support Digital Transformation for Household Businesses </h1>
</p>

<p align="center"><em>
<b>Đề tài:</b> Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh <br>
<b>Môn học:</b> Lập trình Java </em>
<br>
  <img src="https://img.shields.io/badge/Java-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white" alt="Java"/>
</p>

---

## Danh sách thành viên nhóm (Member)

| STT | Họ và Tên | MSSV | Vai trò | Nhiệm vụ được giao |
| :---: | :--- | :---: | :---: | :--- |
| 1 | [Nguyễn Lê Huy Tâm](https://github.com/Sleepy2608) | 056206011188 | Leader | Repository & Git Management, Docs (Installation/Run Guide, User Manual, Technical Documentation, SRS, Compliance), Authorization, Password Encoder and Security, Performance (Testing and Enhancing), Admin Account Management, User Account Management (Basic CRUD, Profile), Payment Process, Subscription Pricing & Plans, Revenue Reports (Revenue Ledger, Platform Analytics, Trend Analysis) |
| 2 | [Trần Duy Tân](https://github.com/dzytan) | 083206003584 | UI Designer | Register/Login/Dashboard UI, OTP Code Verification, Owner Account Management, Searching Engine, Image Uploads (Avatar, Products), CRUD (Customer, Owner Employee, Product), Automatic Bookkeeping (Debt, Sales, Inventory) |
| 3 | [Trần Văn Ngọc Thắng](https://github.com/Thang414) | 046206001641 | Tester & Debugger | Database Management, Docs (Data Model, AI, Calculate taxes in Compliance), Audit Log, Measurement & Product Pricing Rules, Product Stock Management (Automatic Update/Calculating, Debt History/Searching), Service Invoice Management, Order Management (At-counter Order, Confirm/Cancel Order, Confirm Debt/Debt Payment), AI Service, Feedback Management |
| 4 | [Nguyễn Ngọc Gia Bảo](https://github.com/Baon5824) | 079206008279 | Database Manager | Database Management, Docs (ERD, Data Model, Diagram, User Requirements, Test Cases Management), CRUD (Category, Product, Subcription), Product Stock Management (Low Stock Alert), Operational Analytics for Owner/Employee (Report, Chart), System-wide Announcement |
| 5 | [Trần Hồng Sơn](https://github.com/sontran310306) | 060206012202 | Feature Developer | Employee Account Management, Product Stock Management (Stock Import), Feature Plans Management, Financial Template Management (Admin), Report (Review, Edit, Reject & Template Version) |
| 6 | [Huỳnh Đình Chấn](https://github.com/Chan-2006) | 077206002307 | Feature Developer | Manage purchase package payments, Manager Account Management, Subscription Features (Pricing Plans, Notifications), RBAC, Service Invoice Management, Platform Analytics for Admin/Manager, Fast Sales UI for mobile (Owner/Employee) |

> Mọi người đều được giao task có backend code bằng Java (Vai trò trên chỉ bao gồm các vai trò khác ngoài Backend Developer).

---

## Tiến độ triển khai dự án (Project Deployment Progress)

*Tiến độ: Đã hoàn thành*

> Nhiệm vụ được giao sẽ được dựa vào nhiệm vụ được giao trên [Issue](https://github.com/Sleepy2608/Platform-to-support-digital-transformation-for-household-businesses/issues) trên Github và cập nhật tiến độ ở [Jira](https://java-project-platform-for-household-business.atlassian.net/jira/software/projects/SCRUM/summary).<br>
> Các issue trên Github sẽ được cập nhật theo tiến độ của Jira và sẽ được test trước khi merge vào nhánh Main.<br>
> Mức độ hoàn thành dự án: 98%<br>
> Ngày cập nhật lần cuối: 16/09/2026.

### Các tính năng đã hoàn thành

Xem ở file `docs/project-progress-and-feature/feature.md` để biết chi tiết các tính năng đã hoàn thành.

### Các tính năng chưa hoàn thiện

- AI Voice-to-text: Đây là tính năng AI duy nhất còn thiếu. Hiện tại hệ thống đã hỗ trợ **Text Input**, nhưng chưa hoàn thiện khả năng nhận yêu cầu bằng **Voice**.
- Release Package: Release Package vẫn chưa được hoàn thành.

---

## Công nghệ sử dụng (Tech Stack)

| Thành phần | Công nghệ |
| :--- | :--- |
| **Frontend** | React 19, TypeScript 5, Next.js 16 (App Router), Tailwind CSS 4, Framer Motion, Lucide React |
| **Backend** | Java 21, Spring Boot 3.3, Spring Web, Spring Data JPA, Spring Security, JWT (JJWT) |
| **Database** | MySQL 8 |
| **AI Service** | Python 3.12, FastAPI, Uvicorn, Pydantic; tích hợp **B.ai** (Chat Completions) để trích xuất câu đặt hàng tiếng Việt |
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

## Cấu trúc thư mục (Project Structure)

```
Platform-to-support-digital-transformation-for-household-businesses/
├── README.md                                     # Tổng quan dự án
├── docker-compose.yml                            # Triển khai Docker toàn hệ thống
├── Code/
│   ├── AI/                                       # AI Service (FastAPI) gọi B.ai trích xuất câu đặt hàng tiếng Việt
│   ├── Client/
│   │   └── src/
│   │       └── frontend/                         # Frontend Next.js 16 / TypeScript
│   │           ├── app/
│   │           ├── public/
│   │           ├── tests/
│   │           ├── package.json
│   │           ├── next.config.ts
│   │           ├── tsconfig.json
│   │           ├── eslint.config.mjs
│   │           └── README.md
│   └── Server/                                   # Backend Java Spring Boot
│       ├── Dockerfile
│       ├── mvnw
│       ├── mvnw.cmd
│       ├── pom.xml
│       ├── database/
│       │   ├── create-user.sql
│       │   ├── init.sql
│       │   └── migration_employee_profile_fields.sql
│       ├── seed/                                 # Seed dữ liệu nghiệp vụ và demo
│       │   ├── businesses.json
│       │   ├── customers.json
│       │   ├── products.json
│       │   ├── sales_orders.json
│       │   ├── subscriptions.json
│       │   └── ...
│       ├── src/
│       │   ├── main/
│       │   └── test/
│       ├── target/
│       └── uploads/
├── docs/                                         # Tài liệu dự án
│   ├── ai-design/                                # Thiết kế AI / pipeline
│   ├── architecture-design/                      # Thiết kế kiến trúc hệ thống
│   ├── compliance/                               # Thông tin luật, quy định, mapping
│   ├── detailed-design/                          # Thiết kế chi tiết, ERD, sơ đồ
│   ├── installation-guide/                       # Hướng dẫn cài đặt
│   ├── requirements/                             # Yêu cầu đề tài / phân tích yêu cầu
│   ├── run-guide/                                # Hướng dẫn chạy trên IDE / VS Code
│   ├── software-requirement-specification/       # SRS
│   ├── system-implementation/                     # Tài liệu hiện thực hệ thống
│   ├── testing-documents/                        # Tài liệu kiểm thử
│   ├── user-guides/                              # Hướng dẫn sử dụng theo vai trò
│   ├── user-requirements/                        # Yêu cầu người dùng
│   └── workflows/                                # Quy trình nghiệp vụ
├── seed/                                         # Seed dữ liệu cấp repo
│   ├── seed_config.json
│   ├── roles.json
│   ├── subscription_plans.json
│   ├── users.json
│   └── ...
├── .gitattributes                                # Cấu hình Git
├── .gitignore                                    # Bỏ qua file nhạy cảm / build output
├── .md                                           # Tệp markdown phụ trợ nếu có
├── run-ai.bat                                    # Script chạy AI Service (FastAPI)                  
├── run-backend.bat                               # Script chạy nhanh backend hệ thống
├── run-frontend.bat                              # Script chạy nhanh frontend hệ thống
└── run-frontend-clean.bat                        # Script chạy nhanh frontend hệ thống (xóa `.next` + `node_modules` trước khi cài lại)
```

---

## Tài liệu hiện thực hệ thống

Tài liệu mô tả kiến trúc hiện thực, tổ chức mã nguồn, bảo mật, các luồng nghiệp vụ, cấu hình, kiểm thử và đóng gói:

- [System Implementation Document](docs/system-implementation/system-implementation.md)

---

## Cách chạy (How to run)

> Repo có sẵn **4 file `.bat`** ở thư mục gốc để chạy nhanh bằng cách double-click — xem **mục 4**. Cách chạy thủ công bằng IDE / dòng lệnh vẫn được giữ nguyên ở **mục 5 và 6**.

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
DB_PORT=3306
DB_NAME=<dbname>
DB_USERNAME=<username>
DB_PASSWORD=<password>
```

Nếu dùng tính năng AI tạo đơn nháp, bổ sung thêm các biến AI (xem đầy đủ trong `Code/Server/.env.example`):
```env
AI_SERVICE_URL=http://127.0.0.1:8000
AI_SERVICE_API_SECRET=<chuoi_bi_mat>
AI_SERVICE_TIMEOUT_SECONDS=35
AI_SERVICE_AUTO_START=true
AI_SERVICE_WORK_DIR=../AI
```

Vào mục Edit Configurations -> Chọn Evironment variables -> Thêm file .env vừa tạo

### 4. Chạy nhanh bằng file `.bat` (khuyến nghị)

Repo có sẵn **4 file script ở thư mục gốc** — chỉ cần **double-click**, không phải gõ lệnh:

| File | Chạy gì | Cần cài trước |
| :--- | :--- | :--- |
| `run-backend.bat` | Backend Spring Boot — cổng **8080** | **JDK 21** + biến môi trường `JAVA_HOME` |
| `run-frontend.bat` | Frontend Next.js — cổng **3000** | **Node.js 20+** |
| `run-frontend-clean.bat` | Như trên nhưng **xóa `.next` + `node_modules`** rồi cài lại | **Node.js 20+** |
| `run-ai.bat` | AI Service (FastAPI) — cổng **8000** | **Python 3.10+** |

Script sẽ tự kiểm tra môi trường, tự chạy `npm install` nếu chưa có `node_modules`, và giữ cửa sổ lại khi có lỗi để bạn đọc thông báo.

> **Ghi chú cho `run-ai.bat` — cần tải thư viện về máy:**
> Lần chạy **đầu tiên** script sẽ tự tạo môi trường ảo riêng `Code\AI\.venv` (khoảng 50 MB) và **tải các thư viện cần thiết** (fastapi, uvicorn, pydantic, httpx, python-dotenv…) về máy. Vì vậy lần đầu **bắt buộc có kết nối Internet** và mất khoảng **1–2 phút**. Các lần sau chạy gần như tức thì vì đã dùng lại `.venv`.
> Khi `requirements.txt` có thư viện mới, cài lại bằng: `run-ai.bat reinstall`.
> Có thể bỏ qua bước này nếu không dùng tính năng AI Service.

> **Ghi chú cho `run-backend.bat`:** script cần biến môi trường `JAVA_HOME`. Nếu máy chưa có, mở PowerShell chạy 1 lần (thay bằng đường dẫn JDK 21 thật trên máy bạn):
>
> ```powershell
> [Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot', 'User')
> ```
>
> rồi **mở lại terminal**. Kiểm tra bằng: `echo $env:JAVA_HOME`

**LƯU Ý:** 
- Nếu chạy script mà báo lỗi `JAVA_HOME` hoặc `node_modules`/`.next` chưa tồn tại, hãy kiểm tra lại các bước cài đặt môi trường trước khi chạy lại.
- Nếu chạy file .bat không được, hãy thử chạy thủ công bằng IDE hoặc dòng lệnh (xem mục 5. Backend và 6. Frontend).

### 5. Backend (cách chạy thủ công)

- Click chuột phải vào thư mục `HbdtApplication.java`. Chọn vào `Run 'HbdtApplication.main()'`
- Hãy đảm bảo rằng bạn đã có đủ các thông tin cho file .env và MySQL đang hoạt động

### 6. Frontend (cách chạy thủ công)

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
> Cần chọn đúng trang đăng nhập để tránh bị báo lỗi 404 hoặc không tìm thấy trang, nếu không thấy thì xóa các file trong thư mục `.next` và `node_modules` rồi chạy lại `npm install`.
> Thay vì xóa tay, có thể double-click `run-frontend-clean.bat` ở thư mục gốc — script làm đúng các bước này và hỏi xác nhận trước khi xóa.

### 6. AI Service (cần cho tính năng AI tạo đơn nháp)

```text
cd Code/AI
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

- Kiểm tra service đang sống: `curl http://localhost:8000/health`
- Kiểm tra đã cấu hình B.ai: `curl http://localhost:8000/api/v1/ai/ready` (trả `503 BAI_NOT_CONFIGURED` nghĩa là thiếu `BAI_API_KEY` hoặc `BAI_MODEL`)
- Service hiện chỉ nhận **văn bản**, chưa hỗ trợ nhận diện giọng nói (STT).
- Backend có thể tự khởi động service này khi `AI_SERVICE_AUTO_START=true`.
- Tài liệu chi tiết: [docs/ai-design/ai-service-guide.md](docs/ai-design/ai-service-guide.md), [docs/installation-guide/installation-guide.md](docs/installation-guide/installation-guide.md).

---

<p align="center">
  <b>Đồ án môn Lập Trình Java ☕︎</b>
</p>
