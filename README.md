# Platform to Support Digital Transformation for Household Businesses

> **Đề tài:** Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh
> **Môn học:** Lập trình Java

---

## Danh sách thành viên nhóm (Member)

| STT | Họ và Tên | MSSV | Vai trò | Nhiệm vụ được giao |
| :---: | :--- | :---: | :---: | :--- |
| 1 | [Nguyễn Lê Huy Tâm](https://github.com/Sleepy2608) | 056206011188 | Leader | Repository, Git Management, RBAC |
| 2 | [Trần Duy Tân](https://github.com/dzytan) | 083206003584 | UI Designer | Giao diện đăng nhập, đăng ký, web, Quản lý tài khoản owner |
| 3 | [Huỳnh Đình Chấn](https://github.com/Chan-2006) | 077206002307 | Feature Developer 1 | Quản lý thanh toán các gói mua hàng, Quản lý tài khoản admin |
| 4 | [Trần Văn Ngọc Thắng](https://github.com/Thang414) | 046206001641 | Feature Developer 2 | Quản lý/Xác thực tài khoản |
| 5 | [Trần Hồng Sơn](https://github.com/sontran310306) | 060206012202 | Feature Developer 3 | Quản lý hàng tồn kho và xử lý dữ liệu tự động, Quản lý tài khoản employee |
| 6 | [Nguyễn Ngọc Gia Bảo](https://github.com/Baon5824) | 079206008279 | Database Manager | Quản lý database, CRUD |

> **Ghi chú:**
> - Mọi người đều được giao task có backend code bằng Java (Vai trò trên chỉ bao gồm các vai trò khác ngoài Backend Developer)
> - Nhiệm vụ được giao sẽ được dựa vào nhiệm vụ được giao trên [Jira](https://java-project-platform-for-household-business.atlassian.net/jira/software/projects/SCRUM/summary)

---

## Công nghệ sử dụng (Tech Stack)

| Thành phần | Công nghệ |
| :--- | :--- |
| **Frontend** | React 19, TypeScript 5, Next.js 16 (App Router), Tailwind CSS 4, Framer Motion, Lucide React |
| **Backend** | Java 21, Spring Boot 3.3, Spring Web, Spring Data JPA, Spring Security, JWT (JJWT) |
| **Database** | MySQL 8 |
| **AI Service (Tentative)** | Python, FastAPI, Uvicorn, Pydantic |
| **Build & Công cụ** | Maven, npm, ESLint, Lombok |
| **DevOps** | Docker, Docker Compose, CI/CD (GitHub Actions) |

---

## Cấu trúc thư mục (Project Structure)

```
Platform-to-support-digital-transformation-for-household-businesses/
├── README.md                          # Tài liệu giới thiệu đề tài
├── docker-compose.yml                 # Cấu hình triển khai Docker (MySQL, backend, AI, frontend)
├── Code/                              # Mã nguồn chính của dự án
│   ├── AI/                            # AI Service (FastAPI - Python)
│   │   ├── Dockerfile
│   │   ├── main.py                    # Entry point AI Service
│   │   ├── requirements.txt
│   │   └── src/
│   │       ├── __init__.py
│   │       └── router.py              # Router xử lý câu lệnh ngôn ngữ tự nhiên
│   ├── Client/                        # Phần Client
│   │   └── src/
│   │       ├── backend/
│   │       │   └── holdInput.md
│   │       └── frontend/              # Giao diện người dùng (React + TypeScript + Next.js)
│   │           ├── eslint.config.mjs
│   │           ├── next.config.ts
│   │           ├── package.json
│   │           ├── postcss.config.mjs
│   │           ├── tsconfig.json
│   │           ├── public/
│   │           └── app/               # App Router của Next.js
│   │               ├── globals.css
│   │               ├── layout.tsx
│   │               ├── page.tsx
│   │               ├── admin/         # Trang quản trị
│   │               │   ├── layout.tsx
│   │               │   ├── page.tsx
│   │               │   └── accounts/
│   │               │       └── page.tsx    # Quản lý tài khoản owner
│   │               ├── components/    # Các component dùng chung
│   │               │   ├── Navbar.tsx
│   │               │   └── ScrollReveal.tsx
│   │               ├── login/         # Trang đăng nhập
│   │               │   └── page.tsx
│   │               └── register/      # Trang đăng ký
│   │                   └── page.tsx
│   └── Server/                        # Backend (Java Spring Boot)
│       ├── pom.xml                    # Cấu hình Maven
│       ├── database/
│       │   └── init.sql               # Script khởi tạo database
│       └── src/main/
│           ├── resources/
│           │   ├── application.properties
│           │   ├── application-dev.properties
│           │   └── application-prod.properties
│           └── java/com/hbdt/
│               ├── HbdtApplication.java        # Lớp khởi chạy ứng dụng
│               ├── admin/
│               │   └── controller/
│               │       └── AdminUserController.java   # Quản lý tài khoản admin
│               ├── auth/
│               │   ├── controller/
│               │   │   └── AuthController.java # Đăng nhập / đăng ký
│               │   ├── dto/
│               │   └── service/
│               ├── common/
│               │   ├── dto/
│               │   ├── exception/    # Xử lý exception
│               │   └── security/     # JWT, bảo mật
│               ├── config/
│               │   ├── CorsConfig.java
│               │   ├── DatabaseSeeder.java
│               │   └── SecurityConfig.java
│               ├── entity/
│               │   ├── enums/
│               │   │   ├── RoleType.java
│               │   │   └── UserStatus.java
│               │   ├── Role.java
│               │   └── User.java
│               └── repository/
│                   ├── RoleRepository.java
│                   └── UserRepository.java
├── docs/                              # Tài liệu dự án
│   ├── architecture_design/
│   │   └── architecture_design_document.md
│   ├── detailed-design/
│   │   ├── database-design.md
│   │   └── diagrams/
│   ├── Pipeline_design/
│   │   ├── ci.yml
│   │   └── system-pipelines.md
│   ├── requirements/
│   │   └── topic_requirements.md
│   ├── software_requirement_specification/
│   │   └── software_requirement_specification.md
│   ├── user_requirements/
│   │   └── user-requirements.md
│   └── workflows/
│       └── workflow.md
└── Extra/
```