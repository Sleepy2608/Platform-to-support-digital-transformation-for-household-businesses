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
| 4 | [Trần Văn Ngọc Thắng](https://github.com/Thang414) | 046206001641 | Feature Developer 2 | Quản lý/Xác thực/Bảo mật tài khoản |
| 5 | [Trần Hồng Sơn](https://github.com/sontran310306) | 060206012202 | Feature Developer 3 | Quản lý tài khoản employee |
| 6 | [Nguyễn Ngọc Gia Bảo](https://github.com/Baon5824) | 079206008279 | Database Manager | Quản lý database, CRUD |

> **Ghi chú:**
> - Mọi người đều được giao task có backend code bằng Java (Vai trò trên chỉ bao gồm các vai trò khác ngoài Backend Developer)
> - Nhiệm vụ được giao sẽ được dựa vào nhiệm vụ được giao trên [Jira](https://java-project-platform-for-household-business.atlassian.net/jira/software/projects/SCRUM/summary) - Tiến độ: Sprint 2

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
│   ├── Pipeline_design/                       # Thiết kế pipeline & CI/CD
│   ├── requirements/                          # Yêu cầu đề tài
│   ├── software_requirement_specification/    # Đặc tả yêu cầu phần mềm (SRS)
│   ├── user_requirements/                     # Yêu cầu người dùng
│   └── workflows/                             # Quy trình nghiệp vụ
└── Extra/                                     # Tài nguyên bổ sung, tài liệu tham khảo
```