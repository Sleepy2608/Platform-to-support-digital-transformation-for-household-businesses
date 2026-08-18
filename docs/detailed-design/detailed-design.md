# TÀI LIỆU THIẾT KẾ CHI TIẾT (DETAILED DESIGN DOCUMENT)

## Nền tảng Hỗ trợ Chuyển đổi Số cho Hộ Kinh doanh

| Thuộc tính | Nội dung |
|---|---|
| **Tên dự án (EN)** | Platform to Support Digital Transformation for Household Businesses |
| **Tên dự án (VN)** | Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh |
| **Viết tắt** | HBDT |
| **Loại tài liệu** | Detailed Design Document |
| **Phiên bản** | 2.0 |
| **Ngày tạo** | 12/08/2026 |
| **Lần cuối cập nhật** | 13/08/2026 |
| **Trạng thái** | Bản nháp (Draft) |
| **Tài liệu liên quan** | Các tài liệu trong thư mục docs (URD, SRS, Architecture Design Document, Database Design Document) |

---

## Mục lục

1. [Giới thiệu](#1-giới-thiệu)
   - 1.1. [Mục đích tài liệu](#11-mục-đích-tài-liệu)
   - 1.2. [Phạm vi](#12-phạm-vi)
   - 1.3. [Thuật ngữ và từ viết tắt](#13-thuật-ngữ-và-từ-viết-tắt)
   - 1.4. [Tài liệu tham khảo](#14-tài-liệu-tham-khảo)
   - 1.5. [Quy ước ký hiệu UML](#15-quy-ước-ký-hiệu-uml)
2. [Thiết kế chi tiết Backend API](#2-thiết-kế-chi-tiết-backend-api)
   - 2.1. [Tổng quan Backend](#21-tổng-quan-backend)
   - 2.2. [Các module nghiệp vụ và trách nhiệm](#22-các-module-nghiệp-vụ-và-trách-nhiệm)
   - 2.3. [Mô hình phân lớp (Layer Pattern)](#23-mô-hình-phân-lớp-layer-pattern)
   - 2.4. [Thiết kế class chi tiết theo module](#24-thiết-kế-class-chi-tiết-theo-module)
   - 2.4.7. [Thiết kế DTO chi tiết (field-level)](#247-thiết-kế-dto-chi-tiết-field-level)
   - 2.5. [Luồng xử lý tiêu biểu](#25-luồng-xử-lý-tiêu-biểu)
   - 2.6. [Xử lý lỗi và format response](#26-xử-lý-lỗi-và-format-response)
3. [Thiết kế chi tiết Cơ sở dữ liệu](#3-thiết-kế-chi-tiết-cơ-sở-dữ-liệu)
   - 3.1. [Tổng quan](#31-tổng-quan)
   - 3.2. [Mô hình multi-tenant](#32-mô-hình-multi-tenant)
   - 3.3. [Các phân hệ bảng](#33-các-phân-hệ-bảng)
   - 3.4. [Các quan hệ nghiệp vụ quan trọng](#34-các-quan-hệ-nghiệp-vụ-quan-trọng)
   - 3.5. [Snapshot dữ liệu lịch sử](#35-snapshot-dữ-liệu-lịch-sử)
   - 3.6. [Trigger](#36-trigger)
   - 3.7. [Transaction quan trọng](#37-transaction-quan-trọng)
   - 3.8. [Quản lý schema và seed](#38-quản-lý-schema-và-seed)
   - 3.9. [Chiến lược Indexing chi tiết](#39-chiến-lược-indexing-chi-tiết)
4. [Thiết kế chi tiết Frontend Web Apps](#4-thiết-kế-chi-tiết-frontend-web-apps)
   - 4.1. [Công nghệ](#41-công-nghệ)
   - 4.2. [Cấu trúc thư mục và định tuyến](#42-cấu-trúc-thư-mục-và-định-tuyến)
   - 4.3. [Bảo vệ route](#43-bảo-vệ-route)
   - 4.4. [Quản lý xác thực (apiClient)](#44-quản-lý-xác-thực-apiclient)
   - 4.5. [Form và validation](#45-form-và-validation)
   - 4.6. [Các trang chính](#46-các-trang-chính)
   - 4.7. [Component Tree](#47-component-tree)
5. [Thiết kế chi tiết Smart Contract](#5-thiết-kế-chi-tiết-smart-contract)
   - 5.1. [Kết luận về phạm vi](#51-kết-luận-về-phạm-vi)
   - 5.2. [Thay thế bằng các tầng "hợp đồng" của hệ thống](#52-thay-thế-bằng-các-tầng-hợp-đồng-của-hệ-thống)
   - 5.3. [Đề xuất mở rộng (ngoài phạm vi hiện tại)](#53-đề-xuất-mở-rộng-ngoài-phạm-vi-hiện-tại)
6. [Đặc tả chi tiết REST API](#6-đặc-tả-chi-tiết-rest-api)
   - 6.1. [Quy ước chung](#61-quy-ước-chung)
   - 6.2. [Bảng phân quyền route](#62-bảng-phân-quyền-route)
   - 6.3. [Authentication — /api/auth](#63-authentication--apiauth)
   - 6.4. [Owner Account — /api/owner](#64-owner-account--apiowner)
   - 6.5. [Products — /api/products](#65-products--apiproducts)
   - 6.6. [Categories — /api/categories](#66-categories--apicategories)
   - 6.7. [Admin — /api/admin/accounts](#67-admin--apiadminaccounts)
   - 6.8. [Subscription Plans — Admin & Public](#68-subscription-plans--admin--public)
   - 6.9. [Reference — /api/reference](#69-reference--apireference)
   - 6.10. [Dev health check — /api/public](#610-dev-health-check--apipublic)
   - 6.11. [AI Service (FastAPI)](#611-ai-service-fastapi)
   - 6.12. [Ví dụ Request/Response JSON](#612-ví-dụ-requestresponse-json)
7. [Workflow các luồng nghiệp vụ chính](#7-workflow-các-luồng-nghiệp-vụ-chính)
   - 7.1. [Workflow Đăng ký & Onboarding](#71-workflow-đăng-ký--onboarding)
   - 7.2. [Workflow Xác thực & Phiên làm việc](#72-workflow-xác-thực--phiên-làm-việc)
   - 7.3. [Workflow Quản lý Sản phẩm](#73-workflow-quản-lý-sản-phẩm)
   - 7.4. [Workflow Thuê bao & Gia hạn](#74-workflow-thuê-bao--gia-hạn)
   - 7.5. [Workflow Bán hàng (POS) & Công nợ](#75-workflow-bán-hàng-pos--công-nợ)
   - 7.6. [Workflow AI Draft Order](#76-workflow-ai-draft-order)
   - 7.7. [Workflow Kế toán, Thuế & Báo cáo](#77-workflow-kế-toán-thuế--báo-cáo)
   - 7.8. [Workflow Quản trị (Admin)](#78-workflow-quản-trị-admin)
   - 7.9. [Workflow Nhập kho & Tồn kho](#79-workflow-nhập-kho--tồn-kho)
   - 7.10. [Workflow Khách hàng & Công nợ](#710-workflow-khách-hàng--công-nợ)
8. [Sequence Diagram và Class Diagram chi tiết](#8-sequence-diagram-và-class-diagram-chi-tiết)
   - 8.1. [Class Diagram — Tổng quan Entity](#81-class-diagram--tổng-quan-entity)
   - 8.2. [Class Diagram — Service Layer](#82-class-diagram--service-layer)
   - 8.3. [Class Diagram — Controller Layer](#83-class-diagram--controller-layer)
   - 8.4. [Mô hình RBAC](#84-mô-hình-rbac)
   - 8.5. [Sequence — Đăng ký & Xác thực OTP](#85-sequence--đăng-ký--xác-thực-otp)
   - 8.6. [Sequence — Đăng nhập & Gọi API](#86-sequence--đăng-nhập--gọi-api)
   - 8.7. [Sequence — CRUD Sản phẩm (multi-tenant)](#87-sequence--crud-sản-phẩm-multi-tenant)
   - 8.8. [Sequence — Chọn gói thuê bao](#88-sequence--chọn-gói-thuê-bao)
   - 8.9. [Class Diagram — Chi tiết Module Auth](#89-class-diagram--chi-tiết-module-auth)
   - 8.10. [Class Diagram — Chi tiết Module Owner](#810-class-diagram--chi-tiết-module-owner)
   - 8.11. [Class Diagram — Chi tiết Module Product](#811-class-diagram--chi-tiết-module-product)
   - 8.12. [Sequence — Quên mật khẩu](#812-sequence--quên-mật-khẩu)
   - 8.13. [Sequence — Đổi Email/SĐT (OTP)](#813-sequence--đổi-emailsđt-otp)
   - 8.14. [Sequence — Checkout & Công nợ](#814-sequence--checkout--công-nợ)
   - 8.15. [Sequence — AI Draft Order](#815-sequence--ai-draft-order)
9. [Thiết kế bảo mật chi tiết](#9-thiết-kế-bảo-mật-chi-tiết)
   - 9.1. [Xác thực — JWT (stateless)](#91-xác-thực--jwt-stateless)
   - 9.2. [Mật khẩu](#92-mật-khẩu)
   - 9.3. [Phân quyền RBAC](#93-phân-quyền-rbac)
   - 9.4. [Cách ly tenant (multi-tenant)](#94-cách-ly-tenant-multi-tenant)
   - 9.5. [Chống tấn công phổ biến](#95-chống-tấn-công-phổ-biến)
   - 9.6. [OTP và email](#96-otp-và-email)
   - 9.7. [Audit log](#97-audit-log)
   - 9.8. [CORS và triển khai](#98-cors-và-triển-khai)
   - 9.9. [Bảo mật dữ liệu nhạy cảm](#99-bảo-mật-dữ-liệu-nhạy-cảm)
10. [Phụ lục](#10-phụ-lục)
   - 10.1. [Danh sách file backend chính](#101-danh-sách-file-backend-chính)
   - 10.2. [Danh sách entity (JPA)](#102-danh-sách-entity-jpa)
   - 10.3. [Danh sách file frontend chính](#103-danh-sách-file-frontend-chính)
   - 10.4. [Cấu hình môi trường](#104-cấu-hình-môi-trường)
   - 10.5. [Ma trận truy xuất thiết kế](#105-ma-trận-truy-xuất-thiết-kế)
   - 10.6. [Hướng dẫn sử dụng tài liệu này](#106-hướng-dẫn-sử-dụng-tài-liệu-này)

---

# 1. Giới thiệu

## 1.1. Mục đích tài liệu

Tài liệu này mô tả chi tiết thiết kế triển khai của **Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh (HBDT)**, bao gồm:

- thiết kế chi tiết Backend (module, class, luồng xử lý);
- thiết kế chi tiết cơ sở dữ liệu;
- thiết kế chi tiết Frontend Web App;
- thiết kế hợp đồng dịch vụ (service contract / Smart Contract);
- đặc tả chi tiết REST API;
- workflow các luồng nghiệp vụ chính;
- sequence diagram và class diagram chi tiết;
- thiết kế bảo mật chi tiết.

Tài liệu là đầu vào trực tiếp cho giai đoạn **System Implementation** — lập trình viên dựa vào đây để code theo đúng cấu trúc đã định nghĩa. Tài liệu bám sát mã nguồn hiện tại của dự án (thư mục `Code/`).

## 1.2. Phạm vi

Tài liệu bao phủ ba thành phần triển khai của hệ thống:

1. **Backend** — Java 21, Spring Boot 3.3 (modular monolith) tại `Code/Server`.
2. **Frontend** — Next.js 16 (App Router), React 19, TypeScript tại `Code/Client/src/frontend`.
3. **AI Service** — Python, FastAPI tại `Code/AI`.

## 1.3. Thuật ngữ và từ viết tắt

| Thuật ngữ | Ý nghĩa |
|---|---|
| REST API | Giao diện lập trình ứng dụng theo phong cách REST |
| JWT | JSON Web Token — cơ chế xác thực không trạng thái |
| RBAC | Role-Based Access Control — phân quyền dựa trên vai trò |
| DTO | Data Transfer Object — đối tượng truyền dữ liệu |
| OTP | One-Time Password — mã xác thực một lần |
| Tenant | Một hộ kinh doanh độc lập trong hệ thống multi-tenant |
| S1-HKD / S2-HKD / S4-HKD | Mẫu sổ kế toán theo Thông tư 88/2021/TT-BTC |
| POS | Point of Sale — bán hàng tại quầy |
| Draft Order | Đơn hàng nháp do AI tạo, chờ con người duyệt |

## 1.4. Tài liệu tham khảo

| STT | Tài liệu | Vị trí |
|---|---|---|
| 1 | User Requirements Document (URD) | `docs/user_requirements/user-requirements.md` |
| 2 | Software Requirement Specification (SRS) | `docs/software_requirement_specification/software_requirement_specification.md` |
| 3 | Architecture Design Document (ADD) | `docs/architecture_design/architecture_design_document.md` |
| 4 | Database Design Document (DBD) | `docs/detailed-design/database-design.md` |
| 5 | System Pipelines | `docs/Pipeline_design/system-pipelines.md` |
| 6 | Workflow tổng quát | `docs/workflows/workflow.md` |
| 7 | Mã nguồn dự án | `Code/` |

## 1.5. Quy ước ký hiệu UML

| Sơ đồ | Quy ước |
|---|---|
| Class Diagram | Mũi tên thực (association), mũi tên rỗng (inheritance), diamond (aggregation/composition) |
| Sequence Diagram | Vertical lifeline, horizontal message arrows, activation boxes |
| ERD | PK: khóa chính, FK: khóa ngoại, `1`, `1:N`, `M:N` (cardinality) |
| Workflow | ASCII box-flow: hộp nghiệp vụ + mũi tên chuyển trạng thái |

---

# 2. Thiết kế chi tiết Backend API

## 2.1. Tổng quan Backend

Backend được xây dựng theo kiến trúc **Modular Monolith** trên nền Spring Boot 3.3 (Java 21). Các module được tổ chức theo **package theo nghiệp vụ** thay vì package theo kỹ thuật, giúp ranh giới trách nhiệm rõ ràng và dễ mở rộng thành microservices sau này.

```text
com.hbdt
├── HbdtApplication.java          # Entry point (Spring Boot)
├── admin/                        # Module quản trị Admin
│   └── controller/AdminUserController.java
├── auth/                         # Module xác thực & đăng ký
│   ├── controller/AuthController.java
│   ├── dto/                      # AuthResponse, LoginRequest, RegisterRequest, ...
│   └── service/AuthService.java
├── owner/                        # Module tài khoản chủ hộ & hồ sơ kinh doanh
│   ├── controller/OwnerController.java
│   ├── dto/                      # OwnerProfileResponse, BusinessProfileRequest, ...
│   └── service/{OwnerService, BusinessProfileService}.java
├── product/                      # Module sản phẩm & danh mục
│   ├── controller/{ProductController, CategoryController}.java
│   ├── dto/                      # ProductRequest/Response, CategoryRequest/Response, ...
│   └── service/{ProductService, CategoryService, BusinessContextService}.java
├── subscription/                 # Module gói thuê bao
│   ├── controller/{SubscriptionPlanController, PublicSubscriptionPlanController}.java
│   ├── dto/
│   └── service/SubscriptionPlanService.java
├── common/                       # Hạ tầng dùng chung
│   ├── dto/                      # ApiResponse, ProvinceDto, DistrictDto, WardDto
│   ├── exception/                # BadRequestException, ResourceNotFoundException, ...
│   ├── security/                 # JwtTokenProvider, JwtAuthenticationFilter,
│   │                             # AuditLoggingFilter, CustomUserDetailsService
│   └── service/                  # AuditLogService, OtpService, MailService,
│                                 # RateLimitService, ImageStorageService,
│                                 # ReferenceService, GeoReferenceStore
├── config/                       # Cấu hình Spring
│   ├── SecurityConfig.java
│   ├── CorsConfig.java
│   ├── WebConfig.java
│   ├── DatabaseSeeder.java
│   ├── CatalogReferenceDataSeeder.java
│   └── GeoDataInitializer.java
├── consent/                      # Module đồng thuận điều khoản
├── controller/                   # Controller toàn cục
│   ├── ReferenceController.java
│   └── DatabaseHealthController.java
├── entity/                       # 36 JPA entity (bảng)
├── repository/                   # Spring Data JPA repositories
└── seed/                         # Seed data
```

## 2.2. Các module nghiệp vụ và trách nhiệm

| Module | Package | Trách nhiệm chính | Controller chính |
|---|---|---|---|
| **Authentication** | `auth` | Đăng nhập, đăng ký, xác thực OTP, refresh token, quên/đặt lại mật khẩu | `AuthController` |
| **Owner Account** | `owner` | Hồ sơ chủ hộ, avatar, đổi mật khẩu/email/SĐT, khóa tài khoản, thuê bao, hồ sơ kinh doanh | `OwnerController` |
| **Product & Category** | `product` | CRUD sản phẩm, danh mục, đơn vị tính, nhóm hoạt động tính thuế | `ProductController`, `CategoryController` |
| **Subscription** | `subscription` | Quản trị gói thuê bao (Admin) + bảng giá công khai | `SubscriptionPlanController`, `PublicSubscriptionPlanController` |
| **Admin Management** | `admin` | Quản lý tài khoản Administrator | `AdminUserController` |
| **Reference Data** | `controller` | Địa giới hành chính (tỉnh/huyện/xã) — public | `ReferenceController` |
| **Common/Infra** | `common` | ApiResponse, exception, JWT, audit log, OTP, rate limit, mail, upload ảnh | — |
| **Config** | `config` | Security chain, CORS, seed, geo data | — |

## 2.3. Mô hình phân lớp (Layer Pattern)

Mỗi module nghiệp vụ tuân theo mô hình phân lớp chuẩn của Spring:

```text
┌─────────────────────────────────────────────────────┐
│  Controller (REST) — bắt request, validate, gọi service │
└────────────────────────┬────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────┐
│  Service — nghiệp vụ, transaction, gọi repository      │
└────────────────────────┬────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────┐
│  Repository (Spring Data JPA) — truy cập dữ liệu       │
└────────────────────────┬────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────┐
│  Entity (JPA) — ánh xạ bảng MySQL                      │
└─────────────────────────────────────────────────────┘
```

### 2.3.1. Tầng Controller

- Định nghĩa endpoint REST thông qua `@RestController`, `@RequestMapping`, `@GetMapping/@PostMapping/...`.
- Validate dữ liệu đầu vào bằng Bean Validation (`@Valid` + annotation trên DTO).
- Gọi service để xử lý nghiệp vụ.
- Bọc kết quả trong `ApiResponse<T>` chuẩn.
- Khai báo phân quyền ở cấp lớp bằng `@PreAuthorize` (method security).

### 2.3.2. Tầng Service

- Chứa toàn bộ logic nghiệp vụ.
- Quản lý transaction bằng `@Transactional`.
- Phân tách dữ liệu theo tenant: lấy `username` từ `Authentication`/`UserDetails`, truy vấn `businessId` tương ứng, đưa vào mọi truy vấn nghiệp vụ.
- Ném các exception nghiệp vụ (`BadRequestException`, `ResourceNotFoundException`, ...) để tầng xử lý lỗi toàn cục chuyển thành HTTP response phù hợp.

### 2.3.3. Tầng Repository

- Sử dụng Spring Data JPA (`JpaRepository`, `JpaSpecificationExecutor`).
- Định nghĩa phương thức truy vấn theo tên (`findByBusinessIdAndId`, `existsByUsername`, ...).

### 2.3.4. Tầng Entity

- Ánh xạ 1-1 với bảng trong MySQL (36 bảng).
- Sử dụng Lombok (`@Getter`, `@Setter`, `@Builder`, ...) để giảm boilerplate.

## 2.4. Thiết kế class chi tiết theo module

### 2.4.1. Module Authentication (`auth`)

**Class điều khiển:**

| Class | Loại | Vai trò |
|---|---|---|
| `AuthController` | REST Controller | Điều phối tất cả endpoint `/api/auth/*` |
| `AuthService` | Service | Nghiệp vụ đăng nhập, đăng ký, OTP, token |
| `RateLimitService` | Service (common) | Giới hạn số lần đăng nhập / gửi OTP theo IP |

**DTO:**

| DTO | Hướng | Nội dung chính |
|---|---|---|
| `LoginRequest` | Request | `usernameOrEmail`, `password` |
| `RegisterRequest` | Request | `username`, `password`, `email`, `fullName`, `phone`, đồng thuận điều khoản |
| `VerifyOtpRequest` | Request | `otpCode` (+ context) |
| `RefreshTokenRequest` | Request | `refreshToken` |
| `ForgotPasswordRequest` | Request | `email` |
| `ResetPasswordRequest` | Request | `otpCode`, `newPassword` |
| `AuthResponse` | Response | `accessToken`, `refreshToken`, `tokenType`, thông tin user |
| `AdminCreateRequest` / `AdminUpdateRequest` | Request | Dùng cho module admin |
| `AdminResponse` | Response | Thông tin tài khoản admin |

### 2.4.2. Module Owner Account (`owner`)

**Class điều khiển:**

| Class | Loại | Vai trò |
|---|---|---|
| `OwnerController` | REST Controller | Endpoint `/api/owner/*` (yêu cầu `BUSINESS_OWNER`/`OWNER`) |
| `OwnerService` | Service | Hồ sơ, avatar, mật khẩu, email/phone, trạng thái tài khoản, thuê bao |
| `BusinessProfileService` | Service | Upsert hồ sơ kinh doanh, upload logo/ảnh bìa |

**DTO:**

| DTO | Hướng | Nội dung chính |
|---|---|---|
| `UpdateProfileRequest` | Request | `fullName` |
| `ChangePasswordRequest` | Request | `currentPassword`, `newPassword`, `confirmPassword` |
| `ChangeEmailRequest` | Request | `newEmail` |
| `ChangePhoneRequest` | Request | `newPhone` |
| `DeactivateAccountRequest` | Request | `password` (xác nhận) |
| `OwnerProfileResponse` | Response | Hồ sơ user + `businessId`, `subscriptionExpiresAt`, gói |
| `BusinessProfileRequest` | Request | Thông tin hộ kinh doanh + địa chỉ JSON |
| `BusinessProfileResponse` | Response | Hồ sơ kinh doanh + `logoUrl`, `coverImageUrl` |
| `PackageDto` | Response | Gói dịch vụ, giá, chu kỳ |

### 2.4.3. Module Product & Category (`product`)

**Class điều khiển:**

| Class | Loại | Vai trò |
|---|---|---|
| `ProductController` | REST Controller | CRUD + tìm kiếm sản phẩm `/api/products/*` |
| `CategoryController` | REST Controller | CRUD + tìm kiếm danh mục `/api/categories/*` |
| `ProductService` | Service | Nghiệp vụ sản phẩm, phân trang, references |
| `CategoryService` | Service | Nghiệp vụ danh mục |
| `BusinessContextService` | Service | Xác định `businessId` từ người dùng hiện tại |

**DTO:**

| DTO | Hướng | Nội dung chính |
|---|---|---|
| `ProductRequest` | Request | Tên, mô tả, danh mục, đơn vị, giá, nhóm thuế mặc định |
| `ProductResponse` | Response | Thông tin sản phẩm + snapshot |
| `CategoryRequest` | Request | Tên, mô tả danh mục |
| `CategoryResponse` | Response | Thông tin danh mục |
| `PageResponse<T>` | Response | Kết quả phân trang: `content`, `page`, `size`, `totalElements`, `totalPages` |
| `ReferenceOption` | Response | Option tham chiếu: `value`, `label` |

### 2.4.4. Module Subscription (`subscription`)

| Class | Loại | Vai trò |
|---|---|---|
| `SubscriptionPlanController` | REST Controller | Quản trị gói thuê bao `/api/admin/subscription-plans/*` |
| `PublicSubscriptionPlanController` | REST Controller | Bảng giá công khai `/api/public/subscription-plans` |
| `SubscriptionPlanService` | Service | CRUD gói, lấy gói active cho public |

**DTO:** `SubscriptionPlanRequest` (Request), `SubscriptionPlanResponse` (Response).

### 2.4.5. Module Admin (`admin`)

| Class | Loại | Vai trò | Quyền |
|---|---|---|---|
| `AdminUserController` | REST Controller | Quản lý tài khoản Manager `/api/admin/accounts/*` | `ADMIN` |
| `DatabaseSeeder` / `SeedController` | Config / Controller | Khởi tạo dữ liệu hệ thống (Seed data) `/api/admin/seed/*` | `ADMIN` |
| `SubscriptionPlanController` | REST Controller | Quản lý gói thuê bao `/api/admin/subscription-plans/*` | `ADMIN`, `MANAGER` |

Endpoint quản lý tài khoản Manager thực hiện trực tiếp qua `UserRepository`/`RoleRepository` + `PasswordEncoder` (kiểu quản trị đơn giản, kiểm soát nghiêm ngặt chỉ vai trò `ADMIN` được phép truy cập và không được phép thao tác xóa tài khoản Root Admin).

### 2.4.6. Hạ tầng dùng chung (`common`)

| Class | Loại | Vai trò |
|---|---|---|
| `ApiResponse<T>` | DTO | Format response chuẩn: `success`, `message`, `data` |
| `JwtTokenProvider` | Security | Tạo/validate JWT access & refresh |
| `JwtAuthenticationFilter` | Security | Filter xác thực mỗi request |
| `AuditLoggingFilter` | Security | Ghi audit log sau khi xác thực |
| `CustomUserDetailsService` | Security | Nạp user theo username/email |
| `OtpService` | Service | Tạo/kiểm tra OTP (in-memory) |
| `MailService` | Service | Gửi email (Spring Mail) |
| `RateLimitService` | Service | Giới hạn login/OTP bằng bucket4j |
| `ImageStorageService` | Service | Lưu avatar/ảnh, trả URL |
| `ReferenceService` / `GeoReferenceStore` | Service | Dữ liệu địa giới hành chính (tải từ API, in-memory) |
| `AuditLogService` | Service | Ghi nhật ký thao tác |

**Exception package** (`common/exception`) định nghĩa các exception nghiệp vụ:

- `BadRequestException` → HTTP 400
- `ResourceNotFoundException` → HTTP 404
- Các exception xác thực, xung đột, ... được xử lý bởi `@RestControllerAdvice` toàn cục.

### 2.4.7. Thiết kế DTO chi tiết (field-level)

> Các bảng dưới đây mô tả chi tiết field của các DTO chính. Cột **Bắt buộc**: ✅ = có ràng buộc Bean Validation (`@NotBlank`, `@Email`, `@Size`, ...) được kiểm tra bằng `@Valid`; ⬜ = tùy chọn. Một số trường là đại diện theo code hiện tại và có thể bổ sung khi triển khai thêm module.

#### 2.4.7.1. Module Authentication

**`LoginRequest`**

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `usernameOrEmail` | String | ✅ | Tên đăng nhập hoặc email |
| `password` | String | ✅ | Mật khẩu |

**`RegisterRequest`**

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `username` | String | ✅ | 3–100 ký tự, duy nhất |
| `password` | String | ✅ | Tối thiểu 6 ký tự |
| `email` | String | ✅ | Định dạng email hợp lệ |
| `fullName` | String | ✅ | Họ và tên |
| `phone` | String | ⬜ | Định dạng SĐT Việt Nam |
| `consentAccepted` | Boolean | ✅ | Đồng thuận điều khoản / quyền riêng tư |

**`AuthResponse`**

| Trường | Kiểu | Mô tả |
|---|---|---|
| `accessToken` | String | JWT access (15 phút) |
| `refreshToken` | String | JWT refresh (7 ngày) |
| `tokenType` | String | `Bearer` |
| `userId` | Long | ID người dùng |
| `username` | String | Tên đăng nhập |
| `fullName` | String | Họ tên |
| `email` | String | Email |
| `roles` | List\<String\> | Danh sách vai trò |
| `businessId` | Long | ID hộ kinh doanh (nullable với Admin) |

#### 2.4.7.2. Module Owner

**`ChangePasswordRequest`**

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `currentPassword` | String | ✅ | Mật khẩu hiện tại |
| `newPassword` | String | ✅ | Tối thiểu 6 ký tự |
| `confirmPassword` | String | ✅ | Phải khớp `newPassword` |

**`OwnerProfileResponse`**

| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | Long | ID user |
| `username` | String | Tên đăng nhập |
| `fullName` | String | Họ tên |
| `email` | String | Email |
| `phone` | String | SĐT |
| `avatarUrl` | String | URL ảnh đại diện |
| `businessId` | Long | ID hộ kinh doanh |
| `subscriptionPlan` | String | Gói thuê bao hiện tại |
| `subscriptionExpiresAt` | LocalDateTime | Hạn dùng gói |

**`BusinessProfileRequest`**

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `storeName` | String | ✅ | Tên cửa hàng / hộ kinh doanh |
| `taxCode` | String | ⬜ | Mã số thuế |
| `businessType` | String | ✅ | Loại hình kinh doanh |
| `address` | JSON | ✅ | `{ provinceCode, districtCode, wardCode, detailAddress }` (JSON compact) |
| `representativeEmail` | String | ⬜ | Email đại diện |

**`BusinessProfileResponse`**

| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | Long | ID hồ sơ |
| `storeName` | String | Tên cửa hàng |
| `taxCode` | String | Mã số thuế |
| `address` | JSON | Địa chỉ đầy đủ |
| `logoUrl` | String | URL logo (signed URL hoặc ảnh mặc định) |
| `coverImageUrl` | String | URL ảnh bìa |

#### 2.4.7.3. Module Product & Category

**`ProductRequest`**

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `productCode` | String | ✅ | Mã sản phẩm, duy nhất theo `business_id` |
| `productName` | String | ✅ | Tên sản phẩm |
| `categoryId` | Long | ⬜ | ID danh mục |
| `baseUnitId` | Long | ✅ | ID đơn vị tính gốc |
| `defaultTaxActivityGroupId` | Long | ⬜ | Nhóm hoạt động tính thuế mặc định |
| `imageUrl` | String | ⬜ | URL ảnh |
| `description` | String | ⬜ | Mô tả |
| `status` | String | ⬜ | `ACTIVE` / `INACTIVE` |

**`ProductResponse`**

| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | Long | ID sản phẩm |
| `productCode` | String | Mã sản phẩm |
| `productName` | String | Tên sản phẩm |
| `categoryId` | Long | ID danh mục |
| `baseUnitId` | Long | ID đơn vị gốc |
| `imageUrl` | String | URL ảnh |
| `description` | String | Mô tả |
| `status` | String | Trạng thái |
| `createdAt` / `updatedAt` | LocalDateTime | Thời gian tạo / cập nhật |

**`PageResponse<T>`**

| Trường | Kiểu | Mô tả |
|---|---|---|
| `content` | List\<T\> | Dữ liệu trang hiện tại |
| `page` | int | Số trang (0-based) |
| `size` | int | Số phần tử / trang |
| `totalElements` | long | Tổng số bản ghi |
| `totalPages` | int | Tổng số trang |

#### 2.4.7.4. Module Subscription

**`SubscriptionPlanRequest`**

| Trường | Kiểu | Bắt buộc | Mô tả |
|---|---|---|---|
| `name` | String | ✅ | Tên gói |
| `description` | String | ⬜ | Mô tả |
| `price` | BigDecimal | ✅ | Giá (VNĐ) |
| `billingCycle` | String | ✅ | `MONTHLY` / `YEARLY` |
| `features` | List\<String\> | ⬜ | Danh sách tính năng |

**`SubscriptionPlanResponse`**

| Trường | Kiểu | Mô tả |
|---|---|---|
| `id` | Long | ID gói |
| `name` | String | Tên gói |
| `price` | BigDecimal | Giá |
| `billingCycle` | String | Chu kỳ |
| `status` | String | `ACTIVE` / `INACTIVE` |
| `features` | List\<String\> | Tính năng |

#### 2.4.7.5. Hạ tầng dùng chung

**`ApiResponse<T>`**

| Trường | Kiểu | Mô tả |
|---|---|---|
| `success` | Boolean | `true` = thành công, `false` = thất bại |
| `message` | String | Thông báo tiếng Việt |
| `data` | T | Dữ liệu trả về (null khi lỗi) |

## 2.5. Luồng xử lý tiêu biểu

### 2.5.1. Luồng Đăng nhập

```text
Client → POST /api/auth/login { usernameOrEmail, password }
  → RateLimitService.checkLoginLimit(IP)
  → AuthService.login()
      → CustomUserDetailsService load user
      → DaoAuthenticationProvider xác thực (BCrypt)
      → JwtTokenProvider tạo accessToken (15 phút) + refreshToken (7 ngày)
  → ApiResponse<AuthResponse> trả về client
Client lưu token → mọi request sau gửi Authorization: Bearer <accessToken>
```

### 2.5.2. Luồng Xác thực OTP khi đăng ký

```text
Client → POST /api/auth/register { ... }  (kèm đồng thuận điều khoản)
  → AuthService.register()
      → tạo user trạng thái PENDING
      → OtpService tạo mã → MailService gửi email
Client → POST /api/auth/verify-otp { otpCode }
  → AuthService.verifyRegistrationOtp()
      → OtpService kiểm tra mã
      → kích hoạt user → trả AuthResponse (tự đăng nhập)
```

### 2.5.3. Luồng CRUD Sản phẩm (điển hình cho các luồng CRUD)

```text
Client → POST /api/products (Authorization: Bearer token)
  → JwtAuthenticationFilter xác thực token → Authentication
  → ProductController @PreAuthorize('BUSINESS_OWNER','OWNER')
  → BusinessContextService xác định businessId từ username
  → ProductService.create(businessId, request) (@Transactional)
      → kiểm tra trùng lặp, chuẩn hóa
      → lưu Product + ProductUnit + ProductPrice
  → ApiResponse<ProductResponse>
```

## 2.6. Xử lý lỗi và format response

### 2.6.1. Format response chuẩn

Mọi response của API đều bọc trong `ApiResponse<T>`:

```json
{
  "success": true,
  "message": "Thông báo tiếng Việt",
  "data": { ... }
}
```

### 2.6.2. Cách hoạt động của `@RestControllerAdvice`

- Khi một exception nghiệp vụ được ném ra từ tầng Service (hoặc Controller), nó lan truyền lên đến **`@RestControllerAdvice` toàn cục** (Global Exception Handler) trong `common/exception`.
- Handler bắt exception theo từng loại và trả về `ResponseEntity<ApiResponse<T>>` với HTTP status tương ứng.
- Người gọi API luôn nhận được body lỗi chuẩn (không tràn stack trace ra ngoài), đồng thời exception được ghi log phục vụ truy vết.

```text
Service ném exception
   → @RestControllerAdvice (GlobalExceptionHandler)
       → xác định loại exception
       → ghi log (kèm requestId)
       → trả ResponseEntity<ApiResponse> (success=false) + HTTP status
```

| Exception (`common/exception`) | HTTP Status |
|---|---|
| `BadRequestException` | 400 Bad Request |
| `ResourceNotFoundException` | 404 Not Found |
| Lỗi xác thực (sai mật khẩu, token hết hạn) | 401 Unauthorized |
| Sai quyền truy cập (`AccessDeniedException`) | 403 Forbidden |
| Validation exception (`MethodArgumentNotValidException`) | 400 Bad Request |

### 2.6.3. Bảng mã lỗi nghiệp vụ

| Mã lỗi | Loại | HTTP Status | Thông báo tiếng Việt (mẫu) |
|---|---|---|---|
| `AUTH_001` | Sai thông tin đăng nhập | 401 | "Tên đăng nhập hoặc mật khẩu không đúng" |
| `AUTH_002` | Tài khoản bị khóa | 403 | "Tài khoản đã bị khóa" |
| `AUTH_003` | OTP không hợp lệ / hết hạn | 400 | "Mã xác thực không hợp lệ hoặc đã hết hạn" |
| `AUTH_004` | Refresh token không hợp lệ | 401 | "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại" |
| `USER_001` | Trùng username/email/phone | 409 | "Tên đăng nhập đã tồn tại" / "Email đã được sử dụng" |
| `USER_002` | Tài khoản không tồn tại | 404 | "Không tìm thấy tài khoản" |
| `PWD_001` | Mật khẩu cũ không đúng | 400 | "Mật khẩu hiện tại không chính xác" |
| `PWD_002` | Mật khẩu quá ngắn | 400 | "Mật khẩu phải từ 6 ký tự trở lên" |
| `OWNER_001` | Chưa có hồ sơ kinh doanh | 404 | "Chưa có hồ sơ kinh doanh" |
| `OWNER_002` | Không được thay đổi Root Admin | 400 | "Không thể thay đổi trạng thái hoạt động của Root Admin" |
| `PRODUCT_001` | Không tìm thấy sản phẩm | 404 | "Không tìm thấy sản phẩm" |
| `PRODUCT_002` | Trùng mã sản phẩm | 409 | "Mã sản phẩm đã tồn tại" |
| `CATEGORY_001` | Không tìm thấy danh mục | 404 | "Không tìm thấy danh mục" |
| `PLAN_001` | Không tìm thấy gói thuê bao | 404 | "Không tìm thấy gói thuê bao" |
| `PLAN_002` | Gói thuê bao đã vô hiệu hóa | 400 | "Gói thuê bao đã bị vô hiệu hóa" |
| `VALIDATION_001` | Dữ liệu không hợp lệ | 400 | "Dữ liệu không hợp lệ" (kèm chi tiết trường lỗi) |
| `GENERAL_500` | Lỗi hệ thống | 500 | "Đã có lỗi xảy ra, vui lòng thử lại sau" |

> **Ghi chú:** Bảng mã lỗi trên là **quy ước đề xuất** cho tài liệu; khi triển khai cần thống nhất theo bộ mã chung của team.

---

# 3. Thiết kế chi tiết Cơ sở dữ liệu

> **Ghi chú:** Phần này tóm tắt và kế thừa nội dung từ tài liệu chuyên sâu **`docs/detailed-design/database-design.md`** (phiên bản 3.0). Chi tiết từng bảng, cột, trigger, transaction xem tại tài liệu đó.

## 3.1. Tổng quan

| Thuộc tính | Giá trị |
|---|---|
| Hệ quản trị CSDL | MySQL 8.x |
| Storage Engine | InnoDB |
| Character Set / Collation | `utf8mb4` / `utf8mb4_0900_ai_ci` |
| Mô hình dữ liệu | Quan hệ, multi-tenant **shared database – shared schema – tenant key** |
| Quy mô | **36 bảng, 68 khóa ngoại, 10 trigger** |
| Cơ chế tạo schema | Spring Data JPA `ddl-auto` (dev: `update`, prod: `validate`) |

## 3.2. Mô hình multi-tenant

- Bảng `businesses` đại diện cho từng hộ kinh doanh (tenant).
- Các bảng nghiệp vụ dùng cột `business_id` để phân tách dữ liệu.
- MySQL không tự áp dụng row-level security theo tenant → **backend phải lấy `business_id` từ phiên đăng nhập và đưa vào mọi truy vấn nghiệp vụ**.

## 3.3. Các phân hệ bảng

Cơ sở dữ liệu gồm **34 bảng nghiệp vụ** (5 phân hệ) + **2 bảng seed tracking** = **36 bảng**.

### 3.3.1. Business Core – 5 bảng

| Bảng | Chức năng |
|---|---|
| `businesses` | Hộ kinh doanh, mã số thuế, phương pháp tính giá xuất kho, media logo/ảnh bìa |
| `users` | Tài khoản Employee, Owner, Administrator |
| `roles` | Vai trò (RBAC) |
| `subscription_plans` | Danh mục gói thuê bao |
| `subscriptions` | Lịch sử đăng ký gói theo hộ |

### 3.3.2. Product & Inventory Management – 10 bảng

| Bảng | Chức năng |
|---|---|
| `categories` | Danh mục sản phẩm |
| `products` | Sản phẩm + nhóm hoạt động tính thuế mặc định |
| `units` | Đơn vị tính |
| `product_units` | Đơn vị áp dụng cho sản phẩm + tỷ lệ quy đổi |
| `product_prices` | Quy tắc giá theo đơn vị, số lượng, thời gian |
| `stock_imports` | Phiếu nhập kho |
| `stock_import_items` | Chi tiết phiếu nhập |
| `inventory_balances` | Số lượng, đơn giá bình quân, giá trị tồn hiện tại |
| `inventory_transactions` | Lịch sử nhập/xuất/điều chỉnh + giá vốn |
| `tax_activity_groups` | Phiên bản nhóm hoạt động + tỷ lệ GTGT/TNCN |

### 3.3.3. Sales & Customer Debt – 4 bảng

| Bảng | Chức năng |
|---|---|
| `customers` | Hồ sơ khách hàng |
| `sales_orders` | Đơn hàng, số đã thanh toán, số còn nợ |
| `sales_order_items` | Sản phẩm, số lượng, giá bán + snapshot tỷ lệ thuế |
| `debt_transactions` | Phát sinh nợ, trả nợ, điều chỉnh |

### 3.3.4. AI & System Operations – 6 bảng

| Bảng | Chức năng |
|---|---|
| `ai_requests` | Yêu cầu văn bản/giọng nói + kết quả AI |
| `notifications` | Thông báo theo người dùng |
| `feedback` | Phản hồi, khiếu nại |
| `announcements` | Thông báo toàn nền tảng |
| `system_configurations` | Cấu hình hệ thống và AI |
| `audit_logs` | Nhật ký thao tác + dữ liệu trước/sau |

### 3.3.5. Accounting, Tax & Reporting – 8 bảng

| Bảng | Chức năng |
|---|---|
| `report_templates` | Danh mục biểu mẫu S1/S2/S4-HKD |
| `report_template_versions` | Phiên bản cấu trúc + thời gian hiệu lực |
| `accounting_books` | Sổ theo hộ, loại sổ, kỳ |
| `accounting_book_entries` | Dòng ghi sổ, nguồn phát sinh, lịch sử điều chỉnh |
| `generated_reports` | Báo cáo đã tạo + trạng thái duyệt |
| `tax_types` | Loại nghĩa vụ thuế |
| `tax_obligations` | Nghĩa vụ thuế theo hộ và kỳ |
| `tax_payments` | Các lần nộp thuế |

### 3.3.6. Onboarding & Seed Tracking – 3 bảng

| Bảng | Chức năng |
|---|---|
| `terms_consents` | Đồng thuận điều khoản, quyền riêng tư, Thông tư 88 |
| `seed_config` | Theo dõi trạng thái seed (checksum, version) |
| `seed_key` | Hash khóa cho cơ chế snapshot/restore seed |

> **Lưu ý:** `province`, `district`, `ward`, `otp_codes` **không phải bảng**. Địa giới hành chính tải từ API và lưu in-memory (`GeoReferenceStore`); OTP do `OtpService` quản lý in-memory. Địa chỉ hộ kinh doanh lưu dạng JSON compact trong cột `businesses.address`.

## 3.4. Các quan hệ nghiệp vụ quan trọng

| Quan hệ | Mô tả |
|---|---|
| `businesses 1—N users` | Một hộ có nhiều tài khoản |
| `products N—1 tax_activity_groups` | Sản phẩm có nhóm thuế mặc định |
| `sales_orders 1—N sales_order_items` | Đơn hàng có nhiều chi tiết |
| `customers 1—N sales_orders` / `debt_transactions` | Khách hàng có đơn và công nợ |
| `stock_imports 1—N stock_import_items` | Phiếu nhập có nhiều dòng |
| `tax_obligations 1—N tax_payments` | Nghĩa vụ thuế có nhiều lần nộp |
| `report_templates 1—N report_template_versions` | Biểu mẫu có nhiều phiên bản |
| `accounting_books 1—N accounting_book_entries` | Sổ có nhiều dòng ghi |

## 3.5. Snapshot dữ liệu lịch sử

- `sales_order_items.unit_price` lưu **giá bán tại thời điểm bán** (không đổi theo bảng giá).
- Khi thêm sản phẩm vào đơn, backend sao chép `tax_activity_group_id`, `vat_calculation_rate`, `pit_calculation_rate` sang `sales_order_items`.
- `inventory_transactions` (lịch sử) và `inventory_balances` (số dư hiện tại) phải cập nhật trong cùng transaction.

## 3.6. Trigger

| Trigger | Mục đích |
|---|---|
| Kiểm tra công nợ đơn hàng | Đảm bảo không bán chịu vượt hạn mức |
| Ngăn phiên bản biểu mẫu chồng thời gian | Mỗi khoảng hiệu lực chỉ một phiên bản |
| Kiểm soát điều chỉnh dòng sổ | Ghi vết mọi thay đổi dòng sổ |
| Kiểm soát duyệt báo cáo | Chỉ cho phép duyệt báo cáo hợp lệ |
| Ngăn phiên bản nhóm thuế chồng thời gian | Tương tự biểu mẫu |

## 3.7. Transaction quan trọng

| Transaction | Nội dung |
|---|---|
| Xác nhận đơn hàng | Trừ tồn kho, ghi Payment/Debt, tạo Accounting Entry — cùng transaction |
| Xác nhận nhập kho | Tăng tồn, cập nhật giá vốn bình quân |
| Ghi nhận nghĩa vụ thuế | Sinh `tax_obligations` từ dữ liệu bán hàng |
| Ghi nhận nộp thuế | Cập nhật `tax_payments` + trạng thái nghĩa vụ |

## 3.8. Quản lý schema và seed

- Schema do Hibernate sinh (dev `update`), prod `validate`.
- Seed data theo `seed_config` (version/checksum) + cơ chế snapshot/restore có mã hóa (`seed_key`).
- Xem chi tiết tại `docs/detailed-design/database-design.md` (mục 12, 16, 17).

## 3.9. Chiến lược Indexing chi tiết

> Schema hiện do Hibernate sinh (dev). Các script dưới đây là **chiến lược index đề xuất** khi chuyển sang production (dùng migration có version — Flyway/Liquibase hoặc SQL review). Một số unique constraint đã được khai báo trong entity (JPA).

```sql
-- ============================================================
-- INDEXING STRATEGY — HBDT (MySQL 8 / InnoDB)
-- ============================================================

-- 1. BUSINESS CORE ---------------------------------------------
-- users: tra cứu theo tenant, email, phone, trạng thái, role
CREATE INDEX idx_users_business_id ON users (business_id);
CREATE INDEX idx_users_email      ON users (email);
CREATE INDEX idx_users_phone      ON users (phone);
CREATE INDEX idx_users_status     ON users (status);
CREATE INDEX idx_users_role_id    ON users (role_id);

-- businesses: tra cứu theo mã số thuế / trạng thái
CREATE INDEX idx_businesses_tax_code ON businesses (tax_code);
CREATE INDEX idx_businesses_status   ON businesses (status);

-- subscriptions: theo hộ + gói + hạn dùng
CREATE INDEX idx_subscriptions_business  ON subscriptions (business_id, status);
CREATE INDEX idx_subscriptions_plan      ON subscriptions (plan_id);
CREATE INDEX idx_subscriptions_expires   ON subscriptions (expires_at);

-- 2. PRODUCT & INVENTORY ---------------------------------------
-- products: tìm kiếm theo tenant + danh mục + trạng thái
CREATE INDEX idx_products_business_status ON products (business_id, status);
CREATE INDEX idx_products_category        ON products (category_id);
CREATE INDEX idx_products_tax_group       ON products (default_tax_activity_group_id);

-- inventory: theo sản phẩm (số dư + lịch sử)
CREATE INDEX idx_inventory_balances_product ON inventory_balances (business_id, product_id);
CREATE INDEX idx_inventory_tx_product_time  ON inventory_transactions (business_id, product_id, created_at);
CREATE INDEX idx_inventory_tx_type          ON inventory_transactions (type);

-- stock_imports / items
CREATE INDEX idx_stock_imports_business_status ON stock_imports (business_id, status);
CREATE INDEX idx_stock_import_items_import     ON stock_import_items (import_id);
CREATE INDEX idx_stock_import_items_product    ON stock_import_items (product_id);

-- 3. SALES & CUSTOMER DEBT -------------------------------------
-- sales_orders: theo hộ + khách + người lập + trạng thái
CREATE INDEX idx_sales_orders_business_status ON sales_orders (business_id, status);
CREATE INDEX idx_sales_orders_customer        ON sales_orders (customer_id);
CREATE INDEX idx_sales_orders_created_by      ON sales_orders (created_by);

-- sales_order_items
CREATE INDEX idx_sales_order_items_order   ON sales_order_items (order_id);
CREATE INDEX idx_sales_order_items_product ON sales_order_items (product_id);

-- customers / debt_transactions
CREATE INDEX idx_customers_business_phone ON customers (business_id, phone);
CREATE INDEX idx_debt_tx_business         ON debt_transactions (business_id, customer_id);
CREATE INDEX idx_debt_tx_order            ON debt_transactions (order_id);

-- 4. ACCOUNTING, TAX & REPORTING --------------------------------
-- sổ kế toán + dòng sổ
CREATE INDEX idx_accounting_books_business_period ON accounting_books (business_id, period);
CREATE INDEX idx_accounting_entries_book          ON accounting_book_entries (book_id);

-- thuế
CREATE INDEX idx_tax_obligations_business_period ON tax_obligations (business_id, period, status);
CREATE INDEX idx_tax_obligations_type            ON tax_obligations (tax_type_id);
CREATE INDEX idx_tax_payments_obligation         ON tax_payments (obligation_id);
CREATE INDEX idx_tax_payments_date               ON tax_payments (payment_date);

-- biểu mẫu / báo cáo
CREATE INDEX idx_report_templates_status    ON report_templates (status);
CREATE INDEX idx_report_versions_template   ON report_template_versions (template_id);
CREATE INDEX idx_generated_reports_business_status ON generated_reports (business_id, status);

-- 5. SYSTEM OPERATIONS ------------------------------------------
-- thông báo: theo người nhận + đã đọc
CREATE INDEX idx_notifications_user_read    ON notifications (user_id, is_read);
CREATE INDEX idx_notifications_user_created ON notifications (user_id, created_at);

-- audit log
CREATE INDEX idx_audit_logs_user     ON audit_logs (user_id);
CREATE INDEX idx_audit_logs_created  ON audit_logs (created_at);

-- AI requests
CREATE INDEX idx_ai_requests_business_status ON ai_requests (business_id, status);
CREATE INDEX idx_ai_requests_created         ON ai_requests (created_at);

-- 6. ONBOARDING --------------------------------------------------
CREATE INDEX idx_terms_consents_user ON terms_consents (user_id);
```

> **Lưu ý:** Không tạo index trùng với khóa chính/unique đã có (ví dụ `products(business_id, product_code)` là UNIQUE). Với các bảng có kiểm tra **chồng thời gian** qua trigger (`tax_activity_groups`, `report_template_versions`), cần index phù hợp với cột hiệu lực để truy vấn kiểm tra nhanh.

---

# 4. Thiết kế chi tiết Frontend Web Apps

## 4.1. Công nghệ

| Thành phần | Công nghệ |
|---|---|
| Framework | Next.js 16.2.11 (App Router, Turbopack) |
| UI Library | React 19.2.4 |
| Ngôn ngữ | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Form & Validation | react-hook-form 7, zod 4, @hookform/resolvers |
| Animation | framer-motion 12 |
| Icons | lucide-react |

## 4.2. Cấu trúc thư mục và định tuyến (App Router)

```text
src/frontend/app/
├── layout.tsx                    # Root layout (font, AuthSync)
├── page.tsx                      # Landing page (công khai)
├── globals.css                   # Tailwind + global style
├── proxy.ts                      # Edge Proxy bảo vệ /owner/*
├── lib/                          # Client utilities
│   ├── apiClient.ts              # HTTP client + JWT refresh + auth sync
│   ├── sessionGuard.ts           # Bảo vệ session/route
│   ├── business-profile.ts       # Dữ liệu hồ sơ kinh doanh
│   └── legal-content.ts          # Nội dung điều khoản/chính sách
├── components/                   # Component dùng chung
│   ├── AuthSync.tsx              # Đồng bộ auth giữa các tab
│   ├── Navbar.tsx
│   ├── PricingPlans.tsx
│   ├── ScrollReveal.tsx
│   └── legal/                    # Trang điều khoản
├── login/            → /login
├── register/         → /register
├── forgot-password/  → /forgot-password
├── verify-email/     → /verify-email
├── onboarding/       → /onboarding           (thiết lập ban đầu chủ hộ)
├── owner/            → /owner/*              (khu vực chủ hộ — có bảo vệ)
│   ├── account/      → /owner/account        (quản lý tài khoản)
│   └── products/     → /owner/products       (quản lý sản phẩm)
└── admin/            → /admin/*              (khu vực quản trị)
    ├── accounts/             → /admin/accounts
    ├── subscription-plans/   → /admin/subscription-plans
    └── seed/                 → /admin/seed
```

## 4.3. Bảo vệ route

### 4.3.1. Edge Proxy (`proxy.ts`)

- Bảo vệ `/owner/*`: kiểm tra cookie `auth_token` và `auth_role === 'BUSINESS_OWNER'`.
- Nếu không hợp lệ → redirect `/login?redirect=<path>`.

### 4.3.2. Session Guard (`sessionGuard.ts`)

- Kiểm tra token ở client, chặn truy cập khi chưa đăng nhập.

### 4.3.3. AuthSync (`AuthSync.tsx`)

- Đồng bộ trạng thái đăng nhập giữa nhiều tab qua `BroadcastChannel` + `localStorage` fallback.

## 4.4. Quản lý xác thực (apiClient)

- `BASE_URL = http://localhost:8080` (backend Spring Boot).
- Lưu token: `localStorage` (chính) + `sessionStorage` (tab).
- Tự động **refresh token** khi access token hết hạn.
- Thiết lập cookie `auth_token` / `auth_role` (SameSite=Lax) cho Edge Proxy.
- `initTabSessionIfNeeded()`: khôi phục phiên cho tab mới.

## 4.5. Form và validation

- Dùng `react-hook-form` + `zod` để khai báo schema validate (register, login, forgot-password, profile...).
- Hiển thị lỗi theo trường, submit qua `apiClient`.

## 4.6. Các trang chính

| Route | Chức năng |
|---|---|
| `/` | Landing page, giới thiệu nền tảng, bảng giá |
| `/login` | Đăng nhập |
| `/register` | Đăng ký chủ hộ + đồng thuận điều khoản |
| `/forgot-password` | Gửi OTP đặt lại mật khẩu |
| `/verify-email` | Xác thực email bằng OTP |
| `/onboarding` | Thiết lập hồ sơ kinh doanh ban đầu |
| `/owner/account` | Hồ sơ, đổi mật khẩu, email, SĐT, gói thuê bao |
| `/owner/products` | Quản lý sản phẩm, danh mục |
| `/admin/accounts` | Quản lý tài khoản Manager (Yêu cầu vai trò `ADMIN`) |
| `/admin/subscription-plans` | Quản lý gói thuê bao (Yêu cầu vai trò `ADMIN` hoặc `MANAGER`) |
| `/admin/seed` | Quản lý seed data (Yêu cầu vai trò `ADMIN`) |

## 4.7. Component Tree

```text
App (RootLayout)
├── AuthSync.tsx (đồng bộ auth đa tab)
└── Pages
    ├── LandingPage (/)
    │   ├── Navbar
    │   ├── HeroSection
    │   ├── PricingPlans (bảng giá từ /api/public/subscription-plans)
    │   ├── FeaturesSection
    │   └── Footer
    │
    ├── AuthPages
    │   ├── LoginPage (/login)
    │   │   └── LoginForm (react-hook-form + zod)
    │   ├── RegisterPage (/register)
    │   │   ├── RegisterForm
    │   │   └── LegalConsent (đồng thuận điều khoản)
    │   ├── ForgotPasswordPage (/forgot-password)
    │   │   └── ForgotPasswordForm
    │   └── VerifyEmailPage (/verify-email)
    │       └── OtpInput
    │
    ├── OnboardingPage (/onboarding)
    │   └── BusinessProfileForm (hồ sơ kinh doanh + địa chỉ)
    │
    ├── OwnerArea (được bảo vệ bởi proxy.ts + sessionGuard)
    │   └── OwnerLayout
    │       ├── OwnerSidebar
    │       ├── AccountPage (/owner/account)
    │       │   ├── ProfileForm
    │       │   ├── ChangePasswordForm
    │       │   ├── ChangeEmailForm (OTP)
    │       │   ├── ChangePhoneForm (OTP)
    │       │   └── SubscriptionPanel (gói + gia hạn)
    │       └── ProductsPage (/owner/products)
    │           ├── ProductTable (tìm kiếm + phân trang)
    │           ├── ProductFormModal (tạo/sửa)
    │           └── CategoryManager
    │
    └── AdminArea (/admin)
        ├── AdminLayout
        ├── AccountsPage (/admin/accounts)
        │   ├── AdminTable
        │   └── AdminFormModal
        ├── SubscriptionPlansPage (/admin/subscription-plans)
        │   ├── PlanTable
        │   └── PlanFormModal
        └── SeedPage (/admin/seed)
            └── SeedManager
```

---

# 5. Thiết kế chi tiết Smart Contract

## 5.1. Kết luận về phạm vi

> **Không áp dụng (N/A):** Dự án **không sử dụng blockchain hoặc smart contract**. HBDT là một nền tảng web tập trung (centralized), không có mạng blockchain, ví điện tử phi tập trung hay hợp đồng thông minh trên chuỗi (on-chain). Vì vậy, mục này không có thiết kế smart contract theo nghĩa blockchain.

## 5.2. Thay thế bằng các tầng "hợp đồng" của hệ thống

Trong phạm vi đồ án, các khái niệm "hợp đồng" được thực hiện bằng các cơ chế thay thế sau:

### 5.2.1. Hợp đồng API (API/Service Contract)

- Toàn bộ giao tiếp giữa Frontend ↔ Backend ↔ AI Service được định nghĩa chặt chẽ bởi **đặc tả REST API** (xem mục 6).
- Định dạng response chuẩn `ApiResponse<T>` và mã lỗi thống nhất đóng vai trò là "điều khoản" của hợp đồng dữ liệu.
- AI Service (FastAPI) công bố hợp đồng riêng qua Pydantic models: `ParseOrderRequest { text, store_id, audio_base64? }` → `ParseOrderResponse { success, draft_order?, ambiguities, message }`.

### 5.2.2. Hợp đồng thuê bao (Subscription Contract)

- Bảng `subscription_plans` định nghĩa **điều khoản gói** (giá, tính năng, chu kỳ).
- Bảng `subscriptions` ghi nhận **cam kết** giữa hộ kinh doanh và nền tảng: gói đã chọn, ngày hết hạn.
- Các endpoint `POST /api/owner/subscription/select-package` và `/renew` là các thao tác "ký/đổi/gia hạn hợp đồng" trên dữ liệu tập trung.

### 5.2.3. Hợp đồng đồng thuận kỹ thuật số (Digital Consent)

- Bảng `terms_consents` lưu vết đồng thuận của người dùng: điều khoản sử dụng, chính sách quyền riêng tư, xử lý dữ liệu, **phạm vi học thuật Thông tư 88**, kèm `ip_address`, `user_agent`, `accepted_at`.
- Đây là "chữ ký điện tử" tương đương cho việc đồng ý các điều khoản — đủ giá trị truy vết, minh bạch.

## 5.3. Đề xuất mở rộng (ngoài phạm vi hiện tại)

Nếu sau này cần truy vết bất biến (ví dụ: hóa đơn, lịch sử công nợ có tính chống chối bỏ cao), có thể cân nhắc:

- **Blockchain ghi nhận hash** (proof-of-existence): chỉ ghi hash dữ liệu lên chuỗi (ví dụ các mạng EVM), dữ liệu chi tiết vẫn ở MySQL.
- **Smart contract quản lý token hóa hóa đơn/nợ** — chỉ phù hợp khi nâng cấp thành nền tảng tài chính phi tập trung, hiện nằm ngoài phạm vi học thuật.

---

# 6. Đặc tả chi tiết REST API

## 6.1. Quy ước chung (API Naming Convention)

### 6.1.1. Giao thức chung

- **Base URL:** `http://localhost:8080` (dev) — backend Spring Boot.
- **Định dạng:** `application/json` (trừ upload dùng `multipart/form-data`).
- **Xác thực:** `Authorization: Bearer <accessToken>` cho các endpoint yêu cầu đăng nhập.
- **Response chuẩn:** `ApiResponse<T>`.
- **Roles:** `ADMIN`, `BUSINESS_OWNER`, `OWNER`.

### 6.1.2. Quy ước đặt tên endpoint

| Quy ước | Quy tắc | Ví dụ |
|---|---|---|
| Tài nguyên | Danh từ **số nhiều**, lowercase, phân cách `-` | `/api/products`, `/api/subscription-plans` |
| Hành động | Dùng HTTP method, **không** động từ trong URL | `POST /api/products` (tạo), không dùng `/api/products/create` |
| Tài nguyên lồng nhau | Path con cho quan hệ cha–con | `/api/owner/business-profile/store/logo` |
| Tham số truy vấn | Dùng cho lọc / sắp xếp / phân trang | `GET /api/products?keyword=sơn&status=ACTIVE` |
| Upload | `multipart/form-data`, field cố định `file` | `POST /api/owner/avatar` (field: `file`) |

### 6.1.3. Quy ước phân trang, sắp xếp, lọc

| Tham số | Mô tả | Mặc định |
|---|---|---|
| `page` | Số trang, bắt đầu từ **0** | `0` |
| `size` | Số phần tử mỗi trang | `20` |
| `sortBy` | Cột sắp xếp | `createdAt` |
| `direction` | Hướng sắp xếp: `asc` / `desc` | `desc` |
| `keyword` | Từ khóa tìm kiếm (không bắt buộc) | — |
| `status` / `categoryId` | Bộ lọc (không bắt buộc) | — |

> Ví dụ: `GET /api/products?keyword=sơn&categoryId=3&page=0&size=20&sortBy=createdAt&direction=desc`

### 6.1.4. Format lỗi chuẩn và HTTP Status Codes

Mọi lỗi đều trả về `ApiResponse` với `success=false`:

```json
{
  "success": false,
  "message": "Thông báo lỗi bằng tiếng Việt",
  "data": null
}
```

| HTTP Status | Mô tả | Khi nào xảy ra |
|---|---|---|
| 200 OK | Thành công | Xử lý hợp lệ |
| 201 Created | Tạo mới thành công | POST tạo tài nguyên |
| 204 No Content | Thành công không có body | (dự kiến) |
| 400 Bad Request | Dữ liệu không hợp lệ | Validate thất bại, `BadRequestException` |
| 401 Unauthorized | Chưa xác thực / token hết hạn | Thiếu / hỏng JWT |
| 403 Forbidden | Sai quyền truy cập | `@PreAuthorize` chặn |
| 404 Not Found | Không tìm thấy tài nguyên | `ResourceNotFoundException` |
| 409 Conflict | Xung đột dữ liệu | Trùng username/email (dự kiến) |
| 422 Unprocessable | Vi phạm nghiệp vụ | Kiểm tra nghiệp vụ thất bại (dự kiến) |
| 500 Internal Server Error | Lỗi hệ thống | Exception chưa xử lý |

### 6.1.5. Định dạng dữ liệu

| Kiểu | Quy ước | Ví dụ |
|---|---|---|
| Ngày giờ | ISO-8601 `yyyy-MM-dd'T'HH:mm:ss` | `2026-08-13T10:30:00` |
| Ngày | `yyyy-MM-dd` | `2026-08-13` |
| Tiền tệ | Số thập phân (BigDecimal), đơn vị VNĐ | `150000.00` |
| Boolean | `true` / `false` | `true` |
| Enum | Chuỗi UPPER_SNAKE_CASE | `ACTIVE`, `BUSINESS_OWNER` |

## 6.2. Bảng phân quyền route (SecurityConfig)

| Pattern | Quyền |
|---|---|
| `/api/auth/*` | Public (permitAll) |
| `/uploads/**` | Public (file tĩnh) |
| `/api/public/**` | Public |
| `/api/reference/**` | Public |
| `/api/admin/accounts/**`, `/api/admin/seed/**`, `/api/seed/**` | `ADMIN` |
| `/api/admin/**` | `ADMIN` hoặc `MANAGER` |
| `/api/owner/**` | `BUSINESS_OWNER` hoặc `OWNER` |
| Còn lại | Xác thực (authenticated) |

## 6.3. Authentication — `/api/auth`

| Method | Path | Quyền | Request | Response | Ghi chú |
|---|---|---|---|---|---|
| POST | `/api/auth/login` | Public | `LoginRequest` | `AuthResponse` | Rate-limited theo IP |
| POST | `/api/auth/register` | Public | `RegisterRequest` | `Void` (message) | Gửi OTP email |
| POST | `/api/auth/verify-otp` | Public | `VerifyOtpRequest` | `AuthResponse` | Kích hoạt tài khoản |
| POST | `/api/auth/refresh-token` | Public | `RefreshTokenRequest` | `AuthResponse` | Cấp access token mới |
| POST | `/api/auth/forgot-password` | Public | `ForgotPasswordRequest` | `Void` | Rate-limited |
| POST | `/api/auth/reset-password` | Public | `ResetPasswordRequest` | `Void` | |
| POST | `/api/auth/logout` | Public | — | `Void` | Stateless — client xóa token |

## 6.4. Owner Account — `/api/owner` (BUSINESS_OWNER | OWNER)

| Method | Path | Request | Response | Ghi chú |
|---|---|---|---|---|
| GET | `/api/owner/profile` | — | `OwnerProfileResponse` | |
| PUT | `/api/owner/profile` | `UpdateProfileRequest` | `OwnerProfileResponse` | |
| POST | `/api/owner/avatar` | multipart `file` | `String` (url) | Max 2MB, ảnh |
| PUT | `/api/owner/password` | `ChangePasswordRequest` | `Void` | |
| POST | `/api/owner/email/initiate` | `ChangeEmailRequest` | `Void` | Gửi OTP, rate-limited |
| POST | `/api/owner/email/confirm?newEmail=` | `VerifyOtpRequest` | `Void` | |
| POST | `/api/owner/phone/initiate` | `ChangePhoneRequest` | `Void` | Gửi OTP |
| POST | `/api/owner/phone/confirm?newPhone=` | `VerifyOtpRequest` | `Void` | |
| POST | `/api/owner/account/lock` | — | `Void` | Tự khóa tài khoản |
| POST | `/api/owner/account/unlock` | — | `Void` | |
| DELETE | `/api/owner/account` | `DeactivateAccountRequest` | `Void` | Soft-delete, cần mật khẩu |
| POST | `/api/owner/subscription/renew?months=` | — | `OwnerProfileResponse` | Gia hạn 1-24 tháng |
| GET | `/api/owner/subscription/packages` | — | `List<PackageDto>` | |
| POST | `/api/owner/subscription/select-package?packageType=&billingCycle=` | — | `OwnerProfileResponse` | |
| GET | `/api/owner/business-profile` | — | `BusinessProfileResponse` | |
| POST | `/api/owner/business-profile` | `BusinessProfileRequest` | `BusinessProfileResponse` | Upsert |
| PUT | `/api/owner/business-profile` | `BusinessProfileRequest` | `BusinessProfileResponse` | Alias POST |
| POST | `/api/owner/business-profile/store/logo` | multipart `file` | `String` (url) | Max 5MB |
| POST | `/api/owner/business-profile/store/cover-image` | multipart `file` | `String` (url) | Max 5MB |

## 6.5. Products — `/api/products` (BUSINESS_OWNER | OWNER)

| Method | Path | Request/Params | Response | Ghi chú |
|---|---|---|---|---|
| GET | `/api/products` | `keyword`, `status`, `categoryId`, `page`, `size`, `sortBy`, `direction` | `PageResponse<ProductResponse>` | Tìm kiếm + phân trang |
| GET | `/api/products/{id}` | path `id` | `ProductResponse` | |
| GET | `/api/products/references/units` | — | `List<ReferenceOption>` | |
| GET | `/api/products/references/tax-activity-groups` | — | `List<ReferenceOption>` | |
| POST | `/api/products` | `ProductRequest` | `ProductResponse` | 201 Created |
| PUT | `/api/products/{id}` | path `id` + `ProductRequest` | `ProductResponse` | |
| DELETE | `/api/products/{id}` | path `id` | `ProductResponse` | Vô hiệu hóa (deactivate) |

## 6.6. Categories — `/api/categories` (BUSINESS_OWNER | OWNER)

| Method | Path | Request/Params | Response |
|---|---|---|---|
| GET | `/api/categories` | `keyword`, `status`, `page`, `size`, `sortBy`, `direction` | `PageResponse<CategoryResponse>` |
| GET | `/api/categories/{id}` | path `id` | `CategoryResponse` |
| POST | `/api/categories` | `CategoryRequest` | `CategoryResponse` (201) |
| PUT | `/api/categories/{id}` | path `id` + `CategoryRequest` | `CategoryResponse` |
| DELETE | `/api/categories/{id}` | path `id` | `CategoryResponse` |

## 6.7. Admin — `/api/admin/accounts` (Độc quyền ADMIN)

| Method | Path | Request | Response | Ghi chú |
|---|---|---|---|---|
| GET | `/api/admin/accounts` | — | `List<ManagerResponse>` | Quản lý danh sách Manager (loại trừ Root Admin) |
| POST | `/api/admin/accounts` | `ManagerCreateRequest` | `ManagerResponse` (201) | Kiểm tra trùng username/email/phone, chỉ Admin được gọi |
| PUT | `/api/admin/accounts/{id}` | `ManagerUpdateRequest` | `ManagerResponse` | Cập nhật thông tin/trạng thái Manager |
| DELETE | `/api/admin/accounts/{id}` | — | `Void` | Không cho phép xóa Root Admin |

**Admin Seed — `/api/admin/seed` (Độc quyền ADMIN)**

| Method | Path | Request | Response | Ghi chú |
|---|---|---|---|---|
| POST | `/api/admin/seed/run` | — | `ApiResponse<Void>` | Kích hoạt khởi tạo/seed data toàn hệ thống |
| GET | `/api/admin/seed/status` | — | `SeedStatusResponse` | Kiểm tra trạng thái seed và version checksum |

## 6.8. Subscription Plans — Admin & Public

**Admin — `/api/admin/subscription-plans` (ADMIN / MANAGER)**

| Method | Path | Request/Params | Response |
|---|---|---|---|
| GET | `/api/admin/subscription-plans` | `keyword`, `status` | `List<SubscriptionPlanResponse>` |
| GET | `/api/admin/subscription-plans/{id}` | path `id` | `SubscriptionPlanResponse` |
| POST | `/api/admin/subscription-plans` | `SubscriptionPlanRequest` | `SubscriptionPlanResponse` (201) |
| PUT | `/api/admin/subscription-plans/{id}` | path `id` + request | `SubscriptionPlanResponse` |
| DELETE | `/api/admin/subscription-plans/{id}` | path `id` | `SubscriptionPlanResponse` |

**Public — `/api/public/subscription-plans`**

| Method | Path | Response | Ghi chú |
|---|---|---|---|
| GET | `/api/public/subscription-plans` | `List<SubscriptionPlanResponse>` | Chỉ gói active — bảng giá công khai |

## 6.9. Reference — `/api/reference` (Public)

| Method | Path | Params | Response |
|---|---|---|---|
| GET | `/api/reference/provinces` | — | `List<ProvinceDto>` (63 tỉnh/thành) |
| GET | `/api/reference/districts` | `provinceCode` | `List<DistrictDto>` |
| GET | `/api/reference/wards` | `districtCode` | `List<WardDto>` |

## 6.10. Dev health check — `/api/public` (chỉ profile `dev`)

| Method | Path | Response | Ghi chú |
|---|---|---|---|
| GET | `/api/public/database-health` | Map trạng thái kết nối | Chỉ chạy ở `dev` |

## 6.11. AI Service (FastAPI) — Base `http://<ai-host>`

| Method | Path | Request | Response | Ghi chú |
|---|---|---|---|---|
| GET | `/health` | — | `{ status, service }` | Health check |
| POST | `/api/v1/ai/parse-order` | `ParseOrderRequest { text, store_id, audio_base64? }` | `ParseOrderResponse { success, draft_order?, ambiguities, message }` | Chưa triển khai đầy đủ (Sprint 5-6) |

## 6.12. Ví dụ Request/Response JSON

### 6.12.1. POST /api/auth/login

**Request:**

```json
{
  "usernameOrEmail": "chuhkd@example.com",
  "password": "matkhau123"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "<jwt.access>",
    "refreshToken": "<jwt.refresh>",
    "tokenType": "Bearer",
    "userId": 1,
    "username": "chuhkd",
    "fullName": "Nguyễn Văn A",
    "email": "chuhkd@example.com",
    "roles": ["BUSINESS_OWNER"],
    "businessId": 10
  }
}
```

### 6.12.2. POST /api/auth/register

**Request:**

```json
{
  "username": "chuhkd",
  "password": "matkhau123",
  "email": "chuhkd@example.com",
  "fullName": "Nguyễn Văn A",
  "phone": "0912345678",
  "consentAccepted": true
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Đăng ký thành công. Vui lòng kiểm tra email để lấy mã xác thực.",
  "data": null
}
```

### 6.12.3. GET /api/products (tìm kiếm + phân trang)

**Request:** `GET /api/products?keyword=sơn&categoryId=3&page=0&size=20&sortBy=createdAt&direction=desc`

**Response (200):**

```json
{
  "success": true,
  "message": "Lấy danh sách sản phẩm thành công",
  "data": {
    "content": [
      {
        "id": 101,
        "productCode": "SP001",
        "productName": "Sơn nội thất",
        "categoryId": 3,
        "baseUnitId": 1,
        "imageUrl": null,
        "description": "Sơn nội thất 5L",
        "status": "ACTIVE",
        "createdAt": "2026-08-13T10:30:00"
      }
    ],
    "page": 0,
    "size": 20,
    "totalElements": 1,
    "totalPages": 1
  }
}
```

### 6.12.4. POST /api/products

**Request:**

```json
{
  "productCode": "SP002",
  "productName": "Xi măng PCB40",
  "categoryId": 3,
  "baseUnitId": 1,
  "defaultTaxActivityGroupId": 5,
  "description": "Xi măng PCB40 50kg",
  "status": "ACTIVE"
}
```

**Response (201):**

```json
{
  "success": true,
  "message": "Tạo sản phẩm thành công",
  "data": {
    "id": 102,
    "productCode": "SP002",
    "productName": "Xi măng PCB40",
    "categoryId": 3,
    "baseUnitId": 1,
    "status": "ACTIVE",
    "createdAt": "2026-08-13T11:00:00"
  }
}
```

### 6.12.5. Ví dụ lỗi chuẩn (404)

**Request:** `GET /api/products/999999`

**Response (404):**

```json
{
  "success": false,
  "message": "Không tìm thấy sản phẩm",
  "data": null
}
```

---

# 7. Workflow các luồng nghiệp vụ chính

> Phần này mô tả **workflow** (luồng nghiệp vụ) của hệ thống dưới dạng sơ đồ ASCII. Chi tiết kỹ thuật từng bước xem ở mục 2 và mục 8.

## 7.1. Workflow Đăng ký & Onboarding

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                  WORKFLOW: ĐĂNG KÝ & ONBOARDING CHỦ HỘ                       │
│                                                                            │
│  PUBLIC PORTAL → /register → /verify-email → /onboarding → /owner          │
│                                                                            │
│  ┌──────────┐    ┌──────────────┐    ┌───────────────┐    ┌──────────────┐  │
│  │  Landing │───►│  Register    │───►│  Verify OTP   │───►│  Onboarding  │  │
│  │  Page    │    │ (điều khoản) │    │  (kích hoạt)  │    │  (hồ sơ KD)  │  │
│  └──────────┘    └──────┬───────┘    └──────┬────────┘    └──────┬───────┘  │
│                         │                   │                     │          │
│          POST /api/auth/register      POST /api/auth/verify-otp  │          │
│                         │                   │                     │          │
│                         ▼                   ▼                     ▼          │
│              ┌──────────────────────────────────────────────────────────┐  │
│              │          HỆ THỐNG (Backend)                              │  │
│              │  - Validate input + đồng thuận điều khoản                │  │
│              │  - Tạo User status=PENDING                               │  │
│              │  - OtpService → MailService gửi mã OTP                   │  │
│              │  - Xác thực OTP → status=ACTIVE, role=BUSINESS_OWNER     │  │
│              │  - Tạo BusinessProfile (nếu chưa có)                     │  │
│              │  - Trả AuthResponse (tự đăng nhập)                       │  │
│              └──────────────────────────────────────────────────────────┘  │
│                                                                            │
│  Kết thúc: Owner vào khu vực /owner, chọn gói thuê bao (mục 7.4)          │
└────────────────────────────────────────────────────────────────────────────┘
```

## 7.2. Workflow Xác thực & Phiên làm việc

```text
┌────────────────────────────────────────────────────────────────────────────┐
│              WORKFLOW: XÁC THỰC & PHIÊN LÀM VIỆC (JWT)                      │
│                                                                            │
│  ┌────────┐    ┌─────────────┐    ┌──────────────────┐    ┌─────────────┐  │
│  │  User  │───►│  Login      │───►│  Access Token    │───►│  Gọi API    │  │
│  │        │    │  (BCrypt)   │    │  (15 phút)       │    │  (Bearer)   │  │
│  └────────┘    └──────┬──────┘    └──────────────────┘    └──────┬──────┘  │
│                       │                                          │          │
│                       ▼                                          ▼          │
│            ┌────────────────────────┐                 ┌───────────────────┐ │
│            │ Access hết hạn?        │                 │ JwtAuthentication │ │
│            │   ├─ Có → refresh-token│                 │ Filter validate   │ │
│            │   └─ Không → tiếp tục  │                 │ + AuditLogFilter  │ │
│            └────────────────────────┘                 └───────────────────┘ │
│                                                                            │
│  Luồng quên mật khẩu:                                                     │
│  /forgot-password → gửi OTP → /reset-password → đăng nhập lại              │
│  (đều qua /api/auth/forgot-password, /api/auth/reset-password)             │
└────────────────────────────────────────────────────────────────────────────┘
```

## 7.3. Workflow Quản lý Sản phẩm

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                   WORKFLOW: QUẢN LÝ SẢN PHẨM (Owner)                        │
│                                                                            │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────┐   ┌───────────┐  │
│  │  Danh mục    │──►│  Tạo sản phẩm│──►│  Đơn vị & giá  │──►│  Nhóm thuế│  │
│  │  (Category)  │   │  (Product)   │   │  (ProductUnit, │   │  (TaxAct.) │  │
│  │              │   │              │   │   ProductPrice)│   │            │  │
│  └──────────────┘   └──────┬───────┘   └────────────────┘   └────────────┘  │
│                            │                                                │
│              POST /api/products (gắn businessId từ token)                   │
│                            ▼                                                │
│              ┌─────────────────────────────────────────────────────┐        │
│              │  Validate: mã sản phẩm duy nhất theo business_id     │        │
│              │  Snapshot nhóm thuế mặc định (tax_activity_group)    │        │
│              │  Lưu Product + ProductUnit + ProductPrice (@Tx)      │        │
│              │  Tìm kiếm / phân trang qua GET /api/products         │        │
│              │  Vô hiệu hóa (soft deactivate) qua DELETE /{id}      │        │
│              └─────────────────────────────────────────────────────┘        │
└────────────────────────────────────────────────────────────────────────────┘
```

## 7.4. Workflow Thuê bao & Gia hạn

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                    WORKFLOW: THUÊ BAO & GIA HẠN                              │
│                                                                            │
│  ┌────────────────┐   ┌────────────────────┐   ┌─────────────────────────┐ │
│  │  Bảng giá      │──►│  Chọn gói          │──►│  Gia hạn (renew)        │ │
│  │  (/packages)   │   │  (select-package)  │   │  (renew?months=1..24)   │ │
│  └────────────────┘   └─────────┬──────────┘   └────────────┬────────────┘ │
│                                 │                           │               │
│                    GET /api/owner/subscription/packages      │               │
│                    POST /api/owner/subscription/select-package               │
│                    ?packageType=STANDARD|VIP&billingCycle=MONTHLY|YEARLY     │
│                                 ▼                           ▼               │
│              ┌──────────────────────────────────────────────────────────┐  │
│              │  Backend:                                                │  │
│              │  - Tạo/cập nhật Subscription theo businessId             │  │
│              │  - Tính subscriptionExpiresAt                            │  │
│              │  - OwnerProfileResponse trả gói + hạn dùng               │  │
│              └──────────────────────────────────────────────────────────┘  │
│                                                                            │
│  Ghi chú: Thanh toán thực tế (cổng thanh toán) nằm ngoài phạm vi hiện tại  │
└────────────────────────────────────────────────────────────────────────────┘
```

## 7.5. Workflow Bán hàng (POS) & Công nợ

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                   WORKFLOW: BÁN HÀNG (POS) & CÔNG NỢ                        │
│                                                                            │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────────────────────┐ │
│  │  Chọn KH      │──►│  Chọn SP + SL │──►│  Xác nhận đơn (Checkout)      │ │
│  │  (Customer)   │   │  (giá, thuế)  │   │  (SalesOrder + Items)         │ │
│  └───────────────┘   └───────────────┘   └───────────────┬───────────────┘ │
│                                                          │                  │
│                                                          ▼                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  TRANSACTION XÁC NHẬN ĐƠN HÀNG (tính nhất quán)                       │  │
│  │  ┌────────────────────────────────────────────────────────────────┐   │  │
│  │  │ 1. Trừ tồn kho → InventoryTransaction + InventoryBalance        │   │  │
│  │  │ 2. Ghi thanh toán → paid_amount / debt_amount (SalesOrder)      │   │  │
│  │  │ 3. Nếu ghi nợ → DebtTransaction (+ trigger kiểm tra hạn mức)    │   │  │
│  │  │ 4. Sinh AccountingEntry (sổ kế toán tự động)                    │   │  │
│  │  └────────────────────────────────────────────────────────────────┘   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  Trạng thái đơn hàng (SalesOrder.status):                                  │
│  DRAFT → CONFIRMED → PAID/PARTIAL_PAID → COMPLETED / CANCELLED             │
└────────────────────────────────────────────────────────────────────────────┘
```

## 7.6. Workflow AI Draft Order

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                     WORKFLOW: AI DRAFT ORDER                                │
│                                                                            │
│  ┌─────────────┐  ┌──────────────────┐  ┌────────────────────────────────┐ │
│  │  Khách nhắn │─►│  AI Service      │─►│  Draft Order (PENDING_REVIEW)  │ │
│  │  Zalo / gọi │  │  (FastAPI)       │  │  → thông báo Employee/Owner    │ │
│  │  điện       │  │  POST /parse-order│  └──────────────┬────────────────┘ │
│  └─────────────┘  └────────┬─────────┘                 │                  │
│                            │                            │                  │
│       Text/Voice → STT (voice) → NLP Parser              │                  │
│       → Match sản phẩm/khách hàng → Ambiguity check      │                  │
│       → Sinh Draft Order (ai_requests)                   │                  │
│                            ▼                            ▼                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  EMPLOYEE/OWNER DUYỆT:                                               │  │
│  │    ├─ Xác nhận  → Chuyển thành đơn thật (mục 7.5)                    │  │
│  │    ├─ Sửa       → Cập nhật rồi xác nhận                              │  │
│  │    └─ Từ chối   → Hủy Draft Order + ghi log                          │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  Ghi chú: AI parser hiện chưa triển khai đầy đủ (Sprint 5-6)               │
└────────────────────────────────────────────────────────────────────────────┘
```

## 7.7. Workflow Kế toán, Thuế & Báo cáo

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                WORKFLOW: KẾ TOÁN, THUẾ & BÁO CÁO                            │
│                                                                            │
│  ┌──────────────┐   ┌────────────────────┐   ┌───────────────────────────┐ │
│  │  Nghiệp vụ   │──►│  Ghi sổ kế toán    │──►│  Báo cáo (S1/S2/S4-HKD)  │ │
│  │  (Đơn hàng,  │   │  (AccountingBook + │   │  (GeneratedReport)       │ │
│  │   Nhập kho)  │   │   AccountingEntry) │   │  └─ duyệt (approval)     │ │
│  └──────────────┘   └─────────┬──────────┘   └────────────┬─────────────┘ │
│                                │                           │                │
│                                ▼                           ▼                │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  NGHĨA VỤ THUẾ:                                                     │  │
│  │  - Từ dữ liệu bán → sinh TaxObligation (theo TaxType + kỳ)          │  │
│  │  - Owner kiểm tra số thuế → xác nhận                                  │  │
│  │  - Ghi nhận nộp thuế → TaxPayment + cập nhật nghĩa vụ                │  │
│  │  - Trigger: kiểm soát điều chỉnh dòng sổ, duyệt báo cáo,             │  │
│  │             ngăn phiên bản biểu mẫu/nhóm thuế chồng thời gian        │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  Phạm vi: S1-HKD (doanh thu), S2-HKD (vật liệu/hàng hóa), S4-HKD (thuế)  │
└────────────────────────────────────────────────────────────────────────────┘
```

## 7.8. Workflow Quản trị (Admin)

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                     WORKFLOW: QUẢN TRỊ (ADMIN)                              │
│                                                                            │
│  ┌────────────────┐   ┌─────────────────────────┐   ┌────────────────────┐ │
│  │  Đăng nhập     │──►│  Quản lý tài khoản Admin │──►│  Quản lý gói thuê  │ │
│  │  Admin         │   │  (/api/admin/accounts)   │   │  bao               │ │
│  └────────────────┘   └────────────┬────────────┘   │  (/api/admin/       │ │
│                                    │                 │   subscription-     │ │
│                                    ▼                 │   plans)            │ │
│  ┌──────────────────────────────────────────────┐   └─────────┬──────────┘ │
│  │  RBAC: role=ADMIN                             │             │            │
│  │  - Không thể khóa/xóa Root Admin ("Admin")    │             │            │
│  │  - Create/Update/Delete admin thường          │             ▼            │
│  │  - CRUD gói thuê bao, seed data               │   ┌────────────────────┐│
│  │  - Kiểm tra trùng username/email/phone        │   │  Quản lý seed data ││
│  └──────────────────────────────────────────────┘   │  (/api/admin/seed)  ││
│                                                     └────────────────────┘│
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 7.9. Workflow Nhập kho & Tồn kho

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                   WORKFLOW: NHẬP KHO & TỒN KHO                             │
│                                                                            │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────────────────────┐ │
│  │  Lập phiếu    │──►│  Xác nhận     │──►│  Cập nhật tồn kho             │ │
│  │  nhập kho     │   │  nhập kho     │   │  (StockImport + Items)        │ │
│  │  (StockImport)│   │  (StockImport)│   └──────────────┬────────────────┘ │
│  └───────────────┘   └───────────────┘                  │                  │
│                                                         ▼                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  TRANSACTION XÁC NHẬN NHẬP KHO                                      │  │
│  │  1. Ghi StockImport + StockImportItems                              │  │
│  │  2. Tạo InventoryTransaction (loại NHẬP, giá nhập)                  │  │
│  │  3. Cập nhật InventoryBalance (số lượng + giá vốn bình quân)        │  │
│  │  4. Sinh AccountingEntry (giá trị nhập kho)                         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  Theo dõi:                                                                │
│  - Số dư hiện tại: inventory_balances (truy vấn nhanh)                   │
│  - Lịch sử biến động: inventory_transactions (nhập/xuất/điều chỉnh)       │
│  - Phương pháp tính giá xuất kho: cấu hình theo hộ kinh doanh            │
│    (businesses.inventory_method)                                          │
│                                                                            │
│  Ghi chú: module đang ở giai đoạn kế hoạch (entity đã có trong database)  │
└────────────────────────────────────────────────────────────────────────────┘
```

## 7.10. Workflow Khách hàng & Công nợ

```text
┌────────────────────────────────────────────────────────────────────────────┐
│                WORKFLOW: KHÁCH HÀNG & CÔNG NỢ                              │
│                                                                            │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────────────────────┐ │
│  │  Tạo khách    │──►│  Bán chịu      │──►│  Phát sinh nợ                 │ │
│  │  hàng         │   │  (đơn ghi nợ)  │   │  (DebtTransaction: NỢ)        │ │
│  │  (Customer)   │   └───────┬───────┘   └──────────────┬────────────────┘ │
│  └───────────────┘           │                           │                  │
│                              ▼                           ▼                  │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │  KIỂM SOÁT CÔNG NỢ:                                                 │  │
│  │  - Trigger kiểm tra hạn mức công nợ khi xác nhận đơn                │  │
│  │  - SalesOrder: total_amount / paid_amount / debt_amount             │  │
│  │  - Khi khách trả nợ → DebtTransaction (loại TRẢ NỢ)                 │  │
│  │    → cập nhật debt_amount + paid_amount                             │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  Trạng thái công nợ:                                                      │
│  CHƯA TRẢ → CÒN NỢ → ĐÃ TRẢ HẾT                                          │
│  (theo debt_transactions + trạng thái đơn hàng)                           │
│                                                                            │
│  Ghi chú: module đang ở giai đoạn kế hoạch (entity đã có trong database)  │
└────────────────────────────────────────────────────────────────────────────┘
```

---

# 8. Sequence Diagram và Class Diagram chi tiết

## 8.1. Class Diagram — Tổng quan Entity

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                        ENTITY CLASS DIAGRAM (CORE)                           │
│                                                                              │
│  ┌────────────────┐        ┌────────────────┐                                │
│  │     User       │  N:1   │      Role      │                                │
│  │────────────────│────────│────────────────│                                │
│  │ - id: Long     │        │ - id: Long     │                                │
│  │ - businessId:  │        │ - name: String │                                │
│  │   Long (FK)    │        └────────────────┘                                │
│  │ - role: Role   │                                                          │
│  │ - username     │   ┌──────────────────────────┐                           │
│  │ - passwordHash │   │     BusinessProfile      │                           │
│  │ - email        │   │──────────────────────────│                           │
│  │ - fullName     │   │ - id: Long               │                           │
│  │ - phone        │   │ - userId: Long (FK)      │                           │
│  │ - status       │   │ - storeName, taxCode     │                           │
│  │ - lastLoginAt  │   │ - address (JSON compact) │                           │
│  └───────┬────────┘   │ - logoObjectKey, ...     │                           │
│          │            └──────────────────────────┘                           │
│          │ businessId (tenant key) → businesses                             │
│          ▼                                                                    │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  CÁC BẢNG NGHIỆP VỤ (đều có business_id)                            │   │
│  │                                                                      │   │
│  │  ┌──────────────┐   ┌───────────────┐   ┌─────────────────────────┐  │   │
│  │  │  Category    │──►│    Product    │──►│  ProductUnit            │  │   │
│  │  │──────────────│   │───────────────│   │  ProductPrice           │  │   │
│  │  │ - businessId │   │ - businessId  │   │ - businessId            │  │   │
│  │  │ - name       │   │ - categoryId  │   │ - productId (FK)        │  │   │
│  │  └──────────────┘   │ - baseUnitId  │   │ - unit, ratio, price    │  │   │
│  │                     │ - productCode │   └─────────────────────────┘  │   │
│  │                     │ - productName │   ┌─────────────────────────┐  │   │
│  │                     │ - imageUrl    │   │  TaxActivityGroup       │  │   │
│  │                     │ - status      │   │ (phiên bản + tỷ lệ GTGT/│  │   │
│  │                     └──────┬────────┘   │  TNCN)                  │  │   │
│  │                            │            └─────────────────────────┘  │   │
│  │                            ▼                                          │   │
│  │  ┌────────────────┐   ┌──────────────────┐   ┌──────────────────────┐ │   │
│  │  │   Customer     │──►│    SalesOrder    │──►│   SalesOrderItem     │ │   │
│  │  │────────────────│   │──────────────────│   │──────────────────────│ │   │
│  │  │ - businessId   │   │ - businessId     │   │ - orderId (FK)       │ │   │
│  │  │ - name, phone  │   │ - customerId     │   │ - productId (FK)     │ │   │
│  │  └────────────────┘   │ - createdBy      │   │ - unitPrice (snap)   │ │   │
│  │                       │ - orderCode      │   │ - tax snapshots      │ │   │
│  │                       │ - totalAmount    │   └──────────────────────┘ │   │
│  │                       │ - paidAmount     │                            │   │
│  │                       │ - debtAmount     │   ┌──────────────────────┐ │   │
│  │                       │ - status         │──►│   DebtTransaction    │ │   │
│  │                       └──────────────────┘   │ - orderId, amount,   │ │   │
│  │                                              │   type, status       │ │   │
│  │                                              └──────────────────────┘ │   │
│  │                                                                        │   │
│  │  ┌────────────────┐   ┌──────────────────┐   ┌──────────────────────┐ │   │
│  │  │  StockImport   │──►│  StockImportItem │──►│  InventoryBalance    │ │   │
│  │  │────────────────│   │──────────────────│   │  InventoryTransaction│ │   │
│  │  │ - businessId   │   │ - importId (FK)  │   │ - productId, qty,    │ │   │
│  │  │ - importCode   │   │ - productId      │   │   avgCost, value     │ │   │
│  │  └────────────────┘   └──────────────────┘   └──────────────────────┘ │   │
│  │                                                                        │   │
│  │  ┌────────────────┐   ┌──────────────────┐   ┌──────────────────────┐ │   │
│  │  │  Subscription  │──►│ SubscriptionPlan │   │  AccountingBook      │ │   │
│  │  │────────────────│   │──────────────────│   │  AccountingBookEntry │ │   │
│  │  │ - businessId   │   │ - name, price    │   │ - sổ S1/S2/S4 + dòng │ │   │
│  │  │ - planId (FK)  │   │ - billingCycle   │   │   ghi sổ (source)    │ │   │
│  │  │ - expiresAt    │   └──────────────────┘   └──────────────────────┘ │   │
│  │  └────────────────┘                                                  │   │
│  │                                                                        │   │
│  │  ┌────────────────┐   ┌──────────────────┐   ┌──────────────────────┐ │   │
│  │  │  TaxObligation │──►│   TaxPayment     │   │  ReportTemplate      │ │   │
│  │  │────────────────│   │──────────────────│   │  ReportTemplateVersion│ │   │
│  │  │ - businessId   │   │ - obligationId   │   │  GeneratedReport      │ │   │
│  │  │ - taxTypeId    │   │ - amount, date   │   │ - trạng thái duyệt    │ │   │
│  │  │ - period       │   └──────────────────┘   └──────────────────────┘ │   │
│  │  └────────────────┘                                                  │   │
│  │                                                                        │   │
│  │  Hệ thống: AiRequest · Notification · Feedback · Announcement ·       │   │
│  │            SystemConfiguration · AuditLog · TermsConsent               │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 8.2. Class Diagram — Service Layer

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                          SERVICE LAYER                                        │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  <<Service>> AuthService                                               │  │
│  │  ──────────────────────────────────────────────────────────────────────│  │
│  │  + login(LoginRequest): AuthResponse                                   │  │
│  │  + register(RegisterRequest, HttpServletRequest): void                 │  │
│  │  + verifyRegistrationOtp(VerifyOtpRequest): AuthResponse               │  │
│  │  + refreshToken(RefreshTokenRequest): AuthResponse                     │  │
│  │  + forgotPassword(ForgotPasswordRequest): void                         │  │
│  │  + resetPassword(ResetPasswordRequest): void                           │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  <<Service>> OwnerService                                              │  │
│  │  ──────────────────────────────────────────────────────────────────────│  │
│  │  + getProfile(username): OwnerProfileResponse                          │  │
│  │  + updateProfile(username, UpdateProfileRequest): OwnerProfileResponse │  │
│  │  + changePassword/initiateEmailChange/confirmEmailChange               │  │
│  │  + lockAccount/unlockAccount/deactivateAccount                         │  │
│  │  + renewSubscription/selectPackage/getAvailablePackages                │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  <<Service>> BusinessProfileService                                    │  │
│  │  ──────────────────────────────────────────────────────────────────────│  │
│  │  + getProfile(username): BusinessProfileResponse                       │  │
│  │  + createOrUpdate(username, BusinessProfileRequest)                    │  │
│  │  + uploadStoreLogo/uploadStoreCoverImage                               │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  <<Service>> ProductService        │  <<Service>> CategoryService     │  │
│  │  ──────────────────────────────────│──────────────────────────────────│  │
│  │  + search(businessId, filters):    │  + search(businessId, filters)   │  │
│  │     PageResponse<ProductResponse>  │  + create/update/deactivate      │  │
│  │  + create/update/deactivate        │  + get(id)                       │  │
│  │  + getUnits()/getTaxActivityGroups()│                                  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  <<Service>> SubscriptionPlanService   │  <<Service>> BusinessContextSvc│  │
│  │  ──────────────────────────────────────│────────────────────────────────│  │
│  │  + search/get/create/update/deactivate │  + resolveBusinessId(username) │  │
│  │  + getPublicPlans()                    │     : Long (tenant key)        │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  <<Service>> common (dùng chung)                                      │  │
│  │  ──────────────────────────────────────────────────────────────────────│  │
│  │  OtpService · MailService · RateLimitService · ImageStorageService     │  │
│  │  ReferenceService/GeoReferenceStore · AuditLogService                  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 8.3. Class Diagram — Controller Layer

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                       CONTROLLER LAYER (REST)                                │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  @RestController AuthController  (/api/auth) — Public                 │  │
│  │  ─────────────────────────────────────────────────────────────────────│  │
│  │  POST /login · POST /register · POST /verify-otp · POST /refresh-token│  │
│  │  POST /forgot-password · POST /reset-password · POST /logout          │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  @RestController OwnerController (/api/owner)                          │  │
│  │  @PreAuthorize("hasAnyRole('BUSINESS_OWNER','OWNER')")                │  │
│  │  ─────────────────────────────────────────────────────────────────────│  │
│  │  GET/PUT /profile · POST /avatar · PUT /password                       │  │
│  │  POST /email/initiate · /email/confirm · /phone/initiate · /phone/... │  │
│  │  POST /account/lock · /account/unlock · DELETE /account               │  │
│  │  POST /subscription/renew · /subscription/select-package              │  │
│  │  GET /subscription/packages · GET/POST/PUT /business-profile          │  │
│  │  POST /business-profile/store/logo · /store/cover-image               │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  @RestController ProductController (/api/products)                    │  │
│  │  @RestController CategoryController (/api/categories)                  │  │
│  │  @PreAuthorize("hasAnyRole('BUSINESS_OWNER','OWNER')")                │  │
│  │  ─────────────────────────────────────────────────────────────────────│  │
│  │  GET (search+page) · GET /{id} · POST · PUT /{id} · DELETE /{id}      │  │
│  │  GET /references/units · /references/tax-activity-groups               │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  @RestController AdminUserController (/api/admin/accounts) — ADMIN     │  │
│  │  @RestController SubscriptionPlanController (/api/admin/subscription-  │  │
│  │      plans) — ADMIN                                                    │  │
│  │  @RestController PublicSubscriptionPlanController (/api/public/...)    │  │
│  │  ─────────────────────────────────────────────────────────────────────│  │
│  │  GET/POST · GET/PUT/DELETE /{id} (admin)                               │  │
│  │  GET (public plans active)                                             │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │  @RestController ReferenceController (/api/reference) — Public        │  │
│  │  @RestController DatabaseHealthController (/api/public, profile=dev)  │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 8.4. Mô hình RBAC

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                    ROLE-BASED ACCESS CONTROL (RBAC)                            │
│                                                                              │
│  ┌────────────────┐   ┌──────────────────────────────────────────────────┐  │
│  │   Role (bảng)  │   │  Quyền truy cập (SecurityConfig + @PreAuthorize) │  │
│  ├────────────────┤   ├──────────────────────────────────────────────────┤  │
│  │ ADMIN          │──►│  Toàn quyền hệ thống:                            │  │
│  │ (Quản trị viên │   │  - /api/admin/accounts/** (Quản lý Manager)      │  │
│  │  cấp cao)      │   │  - /api/admin/seed/** /api/seed/** (Seed data)   │  │
│  │                │   │  + Toàn bộ quyền của MANAGER                     │  │
│  │                │   │                                                   │  │
│  │ MANAGER        │──►│  - /api/admin/** (trừ accounts & seed)            │  │
│  │ (Quản lý vận   │   │  - Quản lý Owner, gói thuê bao, phân tích,       │  │
│  │  hành)         │   │    xử lý phản hồi, theo dõi thuê bao             │  │
│  │                │   │                                                   │  │
│  │ BUSINESS_OWNER │──►│  /api/owner/**  /api/products/*  /api/categories/*  │  │
│  │ (Chủ hộ)       │   │  (hasAnyRole BUSINESS_OWNER, OWNER)               │  │
│  │                │   │                                                   │  │
│  │ OWNER          │──►│  (Đồng quyền với BUSINESS_OWNER trong phạm vi   │  │
│  │                │   │   hiện tại)                                       │  │
│  │                │   │                                                   │  │
│  │ EMPLOYEE       │──►│  Bất kỳ endpoint còn lại: authenticated           │  │
│  │ (Nhân viên)    │   │  (anyRequest().authenticated())                  │  │
│  └────────────────┘   └──────────────────────────────────────────────────┘  │
│                                                                              │
│  Public (permitAll): /api/auth/*  /api/public/**  /api/reference/**         │
│                      /uploads/**                                             │
│                                                                              │
│  Luồng phân quyền:                                                           │
│  JWT Bearer → JwtAuthenticationFilter → SecurityContext → @PreAuthorize     │
│  + Root Admin ("admin") được bảo vệ: không khóa/xóa được                    │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 8.5. Sequence — Đăng ký & Xác thực OTP

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│          SEQUENCE DIAGRAM: ĐĂNG KÝ & XÁC THỰC OTP                             │
│                                                                              │
│  Client        AuthController       AuthService      OtpService    MailService│
│    │                  │                  │               │            │       │
│    │ POST /api/auth/register            │               │            │       │
│    │──────────────────►│                │               │            │       │
│    │                  │ register(req)   │               │            │       │
│    │                  │────────────────►│               │            │       │
│    │                  │                 │ validate input│            │       │
│    │                  │                 │ lưu đồng thuận │           │       │
│    │                  │                 │ (TermsConsent) │            │       │
│    │                  │                 │                │            │       │
│    │                  │                 │ createUser     │            │       │
│    │                  │                 │ status=PENDING │            │       │
│    │                  │                 │                │            │       │
│    │                  │                 │ generate OTP   │            │       │
│    │                  │                 │───────────────►│            │       │
│    │                  │                 │ send email     │            │       │
│    │                  │                 │───────────────────────────────►│       │
│    │◄─ 201 Created ───│                 │                │            │       │
│    │                  │                 │                │            │       │
│    │ POST /api/auth/verify-otp          │                │            │       │
│    │──────────────────►│                │                │            │       │
│    │                  │ verifyOtp(req)  │                │            │       │
│    │                  │────────────────►│                │            │       │
│    │                  │                 │ validate OTP   │            │       │
│    │                  │                 │───────────────►│            │       │
│    │                  │                 │◄── valid ──────│            │       │
│    │                  │                 │                │            │       │
│    │                  │                 │ activate user  │            │       │
│    │                  │                 │ (ACTIVE)       │            │       │
│    │                  │                 │ tạo JWT access │            │       │
│    │                  │                 │ + refresh      │            │       │
│    │                  │                 │                │            │       │
│    │◄── AuthResponse ─│◄── AuthResponse─│                │            │       │
│    │ (tự đăng nhập)   │                 │                │            │       │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 8.6. Sequence — Đăng nhập & Gọi API

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│      SEQUENCE DIAGRAM: ĐĂNG NHẬP & GỌI API (JWT)                             │
│                                                                              │
│  Client        AuthController   AuthService    JwtProvider   JwtFilter        │
│    │                  │              │              │            │           │
│    │ POST /api/auth/login           │              │            │           │
│    │──────────────────►│            │              │            │           │
│    │                  │ login(req)  │              │            │           │
│    │                  │────────────►│              │            │           │
│    │                  │             │ authenticate │            │           │
│    │                  │             │ (UserDetails │            │           │
│    │                  │             │  + BCrypt)   │            │           │
│    │                  │             │              │            │           │
│    │                  │             │ createToken  │            │           │
│    │                  │             │─────────────►│            │           │
│    │                  │◄── AuthResp─│◄── token ────│            │           │
│    │◄── AuthResponse ─│             │              │            │           │
│    │ (lưu token)      │             │              │            │           │
│    │                  │             │              │            │           │
│    │ GET /api/owner/profile (Bearer token)         │            │           │
│    │───────────────────────────────────────────────────────────►│           │
│    │                  │             │              │            │ validate │
│    │                  │             │              │            │ set ctx  │
│    │                  │◄── data ───────────────────┼────────────│           │
│    │◄── 200 OK ───────│             │              │            │           │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 8.7. Sequence — CRUD Sản phẩm (multi-tenant)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│    SEQUENCE DIAGRAM: CRUD SẢN PHẨM (MULTI-TENANT)                            │
│                                                                              │
│  Client      ProductController    BusinessContextSvc    ProductService   DB  │
│    │                  │                    │                   │          │  │
│    │ POST /api/products (Bearer)          │                   │          │  │
│    │──────────────────►│                  │                   │          │  │
│    │                  │ @PreAuthorize     │                   │          │  │
│    │                  │ resolveBusinessId(username)           │          │  │
│    │                  │──────────────────►│                   │          │  │
│    │                  │◄── businessId ────│                   │          │  │
│    │                  │                   │                   │          │  │
│    │                  │ create(businessId, req)               │          │  │
│    │                  │──────────────────────────────────────►│          │  │
│    │                  │                   │                   │ check    │  │
│    │                  │                   │                   │ duplicate│  │
│    │                  │                   │                   │─────────►│  │
│    │                  │                   │                   │ save     │  │
│    │                  │                   │                   │ (@Tx)    │  │
│    │                  │                   │                   │─────────►│  │
│    │◄─ 201 Created ───│◄── ProductResponse────────────────────│          │  │
│    │                  │                   │                   │          │  │
│    │ DELETE /api/products/{id} (deactivate)                   │          │  │
│    │──────────────────►│                   │                   │          │  │
│    │                  │ deactivate(businessId, id)             │          │  │
│    │                  │──────────────────────────────────────►│          │  │
│    │                  │                   │                   │ update   │  │
│    │                  │                   │                   │ status   │  │
│    │                  │                   │                   │─────────►│  │
│    │◄── 200 OK ───────│                   │                   │          │  │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 8.8. Sequence — Chọn gói thuê bao

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│   SEQUENCE DIAGRAM: CHỌN GÓI THUÊ BAO & GIA HẠN                              │
│                                                                              │
│  Client        OwnerController       OwnerService      SubscriptionRepo   DB │
│    │                  │                  │                   │            │  │
│    │ GET /api/owner/subscription/packages                   │            │  │
│    │──────────────────►│                  │                   │            │  │
│    │                  │ getAvailablePackages()              │            │  │
│    │                  │─────────────────►│                   │            │  │
│    │                  │◄── List<PackageDto>──│               │            │  │
│    │◄── 200 OK ───────│                  │                   │            │  │
│    │                  │                  │                   │            │  │
│    │ POST /api/owner/subscription/select-package            │            │  │
│    │   ?packageType=VIP&billingCycle=YEARLY                 │            │  │
│    │──────────────────►│                  │                   │            │  │
│    │                  │ selectPackage(username, type, cycle) │            │  │
│    │                  │─────────────────►│                   │            │  │
│    │                  │                  │ resolve businessId│            │  │
│    │                  │                  │ find/create Sub  │            │  │
│    │                  │                  │──────────────────►│            │  │
│    │                  │                  │ tính expiresAt   │            │  │
│    │                  │                  │ save             │            │  │
│    │                  │                  │───────────────────────────────►│  │
│    │                  │                  │◄── OK ──────────────────────────│  │
│    │                  │                  │                   │            │  │
│    │                  │◄── OwnerProfileResponse──│            │            │  │
│    │◄── 200 OK ───────│ (gói + hạn dùng)  │                   │            │  │
│    │                  │                  │                   │            │  │
│    │ POST /api/owner/subscription/renew?months=12            │            │  │
│    │──────────────────►│                  │                   │            │  │
│    │                  │ renewSubscription(username, months)  │            │  │
│    │                  │─────────────────►│                   │            │  │
│    │                  │                  │ extend expiresAt  │            │  │
│    │                  │                  │ save              │            │  │
│    │                  │                  │───────────────────────────────►│  │
│    │◄── 200 OK ───────│◄── profile (expiresAt)──────────────│            │  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 8.9. Class Diagram — Chi tiết Module Auth

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                        MODULE AUTH — CLASS DIAGRAM                           │
│                                                                              │
│  ┌──────────────────────────┐   ┌──────────────────────────────┐             │
│  │ <<Controller>>           │   │ <<Service>>                  │             │
│  │ AuthController           │──►│ AuthService                  │             │
│  │ /api/auth                │   │──────────────────────────────│             │
│  │──────────────────────────│   │ - userRepository             │             │
│  │ + login()                │   │ - roleRepository             │             │
│  │ + register()             │   │ - otpService · mailService   │             │
│  │ + verifyOtp()            │   │ - jwtTokenProvider           │             │
│  │ + refreshToken()         │   │ - passwordEncoder (BCrypt)   │             │
│  │ + forgotPassword()       │   │──────────────────────────────│             │
│  │ + resetPassword()        │   │ + login(LoginRequest)        │             │
│  │ + logout()               │   │ + register(RegisterRequest)  │             │
│  └────────────┬─────────────┘   │ + verifyRegistrationOtp()    │             │
│               │                 │ + refreshToken() · logout()  │             │
│               ▼                 └───────────────┬──────────────┘             │
│  ┌──────────────────────────┐                   ▼                            │
│  │ <<Security>>             │   ┌──────────────────────────────┐             │
│  │ JwtTokenProvider         │   │ <<Repository / Entity>>      │             │
│  │ JwtAuthenticationFilter  │   │ UserRepository · RoleRepo    │             │
│  │ CustomUserDetailsService │   │ User · Role · TermsConsent  │             │
│  │ RateLimitService         │   └──────────────────────────────┘             │
│  └──────────────────────────┘                                               │
│                                                                              │
│  Điểm đặc biệt:                                                             │
│  - Login/Forgot: RateLimitService.checkLoginLimit / checkOtpLimit theo IP   │
│  - JwtAuthenticationFilter chạy trước mọi request qua SecurityConfig        │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 8.10. Class Diagram — Chi tiết Module Owner

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                       MODULE OWNER — CLASS DIAGRAM                           │
│                                                                              │
│  ┌────────────────────────────┐   ┌────────────────────────────────────┐     │
│  │ <<Controller>>             │   │ <<Service>>                        │     │
│  │ OwnerController            │──►│ OwnerService                       │     │
│  │ /api/owner                 │   │ BusinessProfileService             │     │
│  │ @PreAuthorize(...OWNER)    │   │────────────────────────────────────│     │
│  │────────────────────────────│   │ + getProfile() / updateProfile()   │     │
│  │ + get/updateProfile        │   │ + changePassword()                 │     │
│  │ + uploadAvatar             │   │ + initiate/confirm EmailChange     │     │
│  │ + changePassword           │   │ + initiate/confirm PhoneChange     │     │
│  │ + email/phone OTP flows    │   │ + lock/unlock/deactivate           │     │
│  │ + lock/unlock/deactivate   │   │ + renewSubscription/selectPackage  │     │
│  │ + subscription renew/packs │   │ + createOrUpdate(BusinessProfile)  │     │
│  │ + business-profile CRUD    │   │ + uploadStoreLogo/uploadCoverImage │     │
│  └─────────────┬──────────────┘   └───────────────┬────────────────────┘     │
│                │                                  │                          │
│                ▼                                  ▼                          │
│  ┌────────────────────────────┐   ┌────────────────────────────────────┐     │
│  │ <<Service (common)>>       │   │ <<Repository / Entity>>            │     │
│  │ RateLimitService           │   │ UserRepository · SubscriptionRepo  │     │
│  │ ImageStorageService        │   │ BusinessProfile · Subscription     │     │
│  │ OtpService · MailService   │   │ SubscriptionPlan                   │     │
│  └────────────────────────────┘   └────────────────────────────────────┘     │
│                                                                              │
│  Điểm đặc biệt:                                                             │
│  - Đổi email/SĐT dùng luồng OTP hai bước (initiate → confirm)               │
│  - Ảnh (avatar, logo, ảnh bìa) qua ImageStorageService + object storage     │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 8.11. Class Diagram — Chi tiết Module Product

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                      MODULE PRODUCT — CLASS DIAGRAM                          │
│                                                                              │
│  ┌────────────────────────────┐   ┌────────────────────────────────────┐     │
│  │ <<Controller>>             │   │ <<Service>>                        │     │
│  │ ProductController          │──►│ ProductService                     │     │
│  │ CategoryController         │   │ CategoryService                    │     │
│  │ /api/products /api/categories│  │ BusinessContextService            │     │
│  │ @PreAuthorize(...OWNER)    │   │────────────────────────────────────│     │
│  │────────────────────────────│   │ + search(businessId, keyword,      │     │
│  │ + search (page/sort)       │   │   status, categoryId, page, size)  │     │
│  │ + get/{id}                 │   │ + create(businessId, req)          │     │
│  │ + create/update/deactivate │   │ + update/deactivate(businessId, id)│     │
│  │ + references/units         │   │ + getUnits()/getTaxActivityGroups()│     │
│  │ + references/tax-groups    │   │ + resolveBusinessId(username)      │     │
│  └─────────────┬──────────────┘   └────────────────────┬───────────────┘     │
│                │                                      │                      │
│                ▼                                      ▼                      │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ <<Repository / Entity>>                                              │   │
│  │ ProductRepository · CategoryRepository · UnitRepository              │   │
│  │ Product · ProductUnit · ProductPrice · Category · Unit · TaxActGroup │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  Điểm đặc biệt:                                                             │
│  - Mọi truy vấn đều kèm businessId (tenant isolation)                       │
│  - BusinessContextService lấy businessId từ username trong token            │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 8.12. Sequence — Quên mật khẩu

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│            SEQUENCE DIAGRAM: QUÊN / ĐẶT LẠI MẬT KHẨU                         │
│                                                                              │
│  Client       AuthController       AuthService      OtpService    MailService │
│    │                │                  │                │            │        │
│    │ POST /api/auth/forgot-password   │                │            │        │
│    │────────────────►│                │                │            │        │
│    │                │ checkOtpLimit(IP)                │            │        │
│    │                │ forgotPassword(email)            │            │        │
│    │                │────────────────►│                │            │        │
│    │                │                 │ generate OTP   │            │        │
│    │                │                 │───────────────►│            │        │
│    │                │                 │ send email     │            │        │
│    │                │                 │───────────────────────────────►│        │
│    │◄── 200 OK ─────│                 │                │            │        │
│    │                │                 │                │            │        │
│    │ POST /api/auth/reset-password    │                │            │        │
│    │  { otpCode, newPassword }        │                │            │        │
│    │────────────────►│                │                │            │        │
│    │                │ resetPassword(otp, newPassword)  │            │        │
│    │                │────────────────►│                │            │        │
│    │                │                 │ validate OTP   │            │        │
│    │                │                 │───────────────►│            │        │
│    │                │                 │◄── valid ──────│            │        │
│    │                │                 │ update password (BCrypt)    │        │
│    │◄── 200 OK ─────│◄── OK ──────────│                │            │        │
│    │  ("Đặt lại mật khẩu thành công")│                │            │        │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 8.13. Sequence — Đổi Email/SĐT (OTP)

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│            SEQUENCE DIAGRAM: ĐỔI EMAIL / SĐT (OTP 2 BƯỚC)                    │
│                                                                              │
│  Client       OwnerController      OwnerService     OtpService    MailService│
│    │                │                  │                │            │        │
│    │ POST /api/owner/email/initiate   │                │            │        │
│    │  { newEmail }                    │                │            │        │
│    │────────────────►│                │                │            │        │
│    │                │ checkOtpLimit(IP)                │            │        │
│    │                │ initiateEmailChange(newEmail)    │            │        │
│    │                │────────────────►│                │            │        │
│    │                │                 │ generate OTP   │            │        │
│    │                │                 │───────────────►│            │        │
│    │                │                 │ send to new email            │        │
│    │                │                 │───────────────────────────────►│        │
│    │◄── 200 OK ─────│                 │                │            │        │
│    │                │                 │                │            │        │
│    │ POST /api/owner/email/confirm?newEmail=...        │            │        │
│    │  { otpCode }   │                 │                │            │        │
│    │────────────────►│                │                │            │        │
│    │                │ confirmEmailChange(user, newEmail, otp)        │        │
│    │                │────────────────►│                │            │        │
│    │                │                 │ validate OTP   │            │        │
│    │                │                 │───────────────►│            │        │
│    │                │                 │◄── valid ──────│            │        │
│    │                │                 │ update user.email            │        │
│    │◄── 200 OK ─────│◄── OK ──────────│                │            │        │
│    │                │                 │                │            │        │
│    │ (Luồng đổi SĐT tương tự: /phone/initiate + /phone/confirm?newPhone=...)│
└──────────────────────────────────────────────────────────────────────────────┘
```

## 8.14. Sequence — Checkout & Công nợ

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│            SEQUENCE DIAGRAM: CHECKOUT & CÔNG NỢ (XÁC NHẬN ĐƠN)               │
│                                                                              │
│  Client     OrderCtrl(*)    OrderService(*)  Inventory     Debt              │
│    │             │                │             │           │                 │
│    │ POST /api/orders            │             │           │                 │
│    │  (items, customer, debt)    │             │           │                 │
│    │────────────►│               │             │           │                 │
│    │             │ createOrder(businessId, items)          │                 │
│    │             │───────────────►│             │           │                 │
│    │             │                │ ① Trừ tồn kho          │                 │
│    │             │                │  (InventoryTransaction │                 │
│    │             │                │   + InventoryBalance)  │                 │
│    │             │                │────────────►│           │                 │
│    │             │                │ ② Tạo SalesOrder       │                 │
│    │             │                │   + SalesOrderItems    │                 │
│    │             │                │ ③ Nếu ghi nợ:          │                 │
│    │             │                │   tạo DebtTransaction  │                 │
│    │             │                │────────────►│           │                 │
│    │             │                │ ④ Sinh AccountingEntry │                 │
│    │             │                │  (cùng 1 transaction)  │                 │
│    │◄─ 201 ──────│◄─ OrderResponse─│             │           │                 │
│    │             │                │             │           │                 │
│    │ (*) Ghi chú: module Order đang ở giai đoạn KẾ HOẠCH.                    │
│    │     Entity SalesOrder/SalesOrderItem/DebtTransaction/                    │
│    │     InventoryTransaction đã có trong database.                           │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 8.15. Sequence — AI Draft Order

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│               SEQUENCE DIAGRAM: AI DRAFT ORDER                                │
│                                                                              │
│  Employee   OrderCtrl(*)  AIService(FastAPI)   Backend(*)       DB           │
│    │            │              │                  │             │             │
│    │ POST /api/v1/ai/parse-order (text)          │             │             │
│    │───────────►│              │                  │             │             │
│    │            │ parseOrder(text, storeId)      │             │             │
│    │            │─────────────►│                  │             │             │
│    │            │              │ ① STT (voice) / NLP parse    │             │
│    │            │              │ ② Match sản phẩm, khách hàng │             │
│    │            │              │ ③ Ambiguity detection        │             │
│    │            │              │ ④ Gọi backend nếu cần match  │             │
│    │            │              │────────────────────────────►│             │
│    │            │◄─ DraftOrder (proposed)────────────────────│             │
│    │            │              │                  │             │             │
│    │            │ lưu AiRequest + tạo Draft Order             │             │
│    │            │ (status = PENDING_REVIEW)                  │             │
│    │            │───────────────────────────────────────────────────────►│    │
│    │            │ thông báo Employee/Owner (Notification)    │             │
│    │            │───────────────────────────────────────────────────────►│    │
│    │◄── 200 ────│  { draft_order, ambiguities }              │             │
│    │            │              │                  │             │             │
│    │  Employee/Owner duyệt:                                  │             │
│    │    Xác nhận → chuyển thành đơn thật (xem 8.14)          │             │
│    │    Sửa / Từ chối → cập nhật hoặc hủy Draft Order        │             │
│    │  Ghi chú: AI parser chưa triển khai đầy đủ (Sprint 5-6) │             │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

# 9. Thiết kế bảo mật chi tiết

## 9.1. Xác thực — JWT (stateless)

| Thành phần | Cấu hình |
|---|---|
| Cơ chế | JWT access token + refresh token |
| Thuật toán ký | HMAC-SHA (jjwt), khóa `jwt.secret` |
| Thời hạn access token | `jwt.access-expiration-ms` (mặc định **15 phút**) |
| Thời hạn refresh token | `jwt.refresh-expiration-ms` (mặc định **7 ngày**) |
| Lưu client | `localStorage`/`sessionStorage` + cookie `auth_token` (SameSite=Lax) |

Quy trình:

1. `JwtAuthenticationFilter` đọc header `Authorization: Bearer <token>`.
2. `JwtTokenProvider` parse, kiểm tra chữ ký + hết hạn.
3. Nạp `UserDetails` qua `CustomUserDetailsService`, gán vào `SecurityContext`.
4. `AuditLoggingFilter` ghi nhật ký sau xác thực.

## 9.2. Mật khẩu

- Hash bằng **BCrypt** (`BCryptPasswordEncoder`) — không lưu plaintext.
- Chính sách mật khẩu tối thiểu 6 ký tự (Admin) và kiểm tra trong form đăng ký/đổi mật khẩu.

## 9.3. Phân quyền RBAC

- Roles: `ADMIN`, `MANAGER`, `BUSINESS_OWNER`, `OWNER`, `EMPLOYEE` (bảng `roles`, entity `Role`).
- **Method security:**
  - `@PreAuthorize("hasRole('ADMIN')")` dành riêng cho seed data và quản lý tài khoản Manager.
  - `@PreAuthorize("hasAnyRole('ADMIN','MANAGER')")` dành cho các chức năng quản trị vận hành chung (Owner, Subscriptions, Config, AI).
  - `@PreAuthorize("hasAnyRole('BUSINESS_OWNER','OWNER')")` dành cho nghiệp vụ của Chủ hộ.
- **URL security:** `SecurityConfig` phân quyền theo pattern (xem 6.2).
- **Bảo vệ Root Admin:** không cho phép khóa/xóa tài khoản Admin mặc định (`admin`).

## 9.4. Cách ly tenant (multi-tenant)

- Mọi truy vấn nghiệp vụ phải kèm `businessId` lấy từ phiên đăng nhập.
- Ngăn truy cập chéo dữ liệu giữa các hộ kinh doanh.
- Không tin tưởng `businessId` do client gửi lên — phải suy ra từ token.

## 9.5. Chống tấn công phổ biến

| Loại | Biện pháp |
|---|---|
| **SQL Injection** | Spring Data JPA (parameterized query), không nối chuỗi SQL |
| **Brute force login** | `RateLimitService` (bucket4j) giới hạn đăng nhập theo IP |
| **Spam OTP** | Giới hạn số lần gửi OTP theo IP |
| **CSRF** | Vô hiệu hóa CSRF (stateless JWT, không dùng cookie session) |
| **XSS** | React tự escape output; validate input qua Bean Validation + zod |
| **Upload độc hại** | Giới hạn kích thước (2MB avatar, 5MB ảnh) và định dạng (JPEG/PNG/WEBP/GIF) |

## 9.6. OTP và email

- OTP do `OtpService` quản lý in-memory (không lưu DB) — phù hợp phạm vi đồ án.
- Mail qua Spring Boot Mail (`MailService`).

## 9.7. Audit log

- `AuditLoggingFilter` + `AuditLogService` ghi nhật ký thao tác.
- Bảng `audit_logs` lưu dữ liệu **trước/sau** để truy vết thay đổi.

## 9.8. CORS và triển khai

- `CorsConfig` cấu hình nguồn cho phép.
- Prod: `application-prod.properties` bật `useSSL=true`, `requireSSL=true`; `JWT_SECRET` từ biến môi trường (không hardcode).

## 9.9. Bảo mật dữ liệu nhạy cảm

- Logo/ảnh bìa lưu trong **private object storage** (không lưu nhị phân vào MySQL); DB chỉ lưu object key + SHA-256.
- Backend tạo **signed URL có thời hạn** để frontend truy cập.
- `terms_consents` ghi vết đồng thuận (IP, user-agent, thời gian) — minh bạch cho xử lý dữ liệu cá nhân.

---

# 10. Phụ lục

## 10.1. Danh sách file backend chính

| Loại | File | Module |
|---|---|---|
| Entry point | `HbdtApplication.java` | root |
| Controller | `AuthController`, `OwnerController`, `ProductController`, `CategoryController`, `AdminUserController`, `SubscriptionPlanController`, `PublicSubscriptionPlanController`, `ReferenceController`, `DatabaseHealthController` | nhiều module |
| Service | `AuthService`, `OwnerService`, `BusinessProfileService`, `ProductService`, `CategoryService`, `SubscriptionPlanService`, `BusinessContextService`, `OtpService`, `MailService`, `RateLimitService`, `ImageStorageService`, `ReferenceService`, `AuditLogService` | nhiều module |
| Security | `SecurityConfig`, `JwtTokenProvider`, `JwtAuthenticationFilter`, `AuditLoggingFilter`, `CustomUserDetailsService` | config/common |
| Config | `SecurityConfig`, `CorsConfig`, `WebConfig`, `DatabaseSeeder`, `CatalogReferenceDataSeeder`, `GeoDataInitializer` | config |

## 10.2. Danh sách entity (JPA)

`AccountingBook`, `AccountingBookEntry`, `AiRequest`, `Announcement`, `AuditLog`, `BusinessProfile`, `Category`, `Customer`, `DebtTransaction`, `Feedback`, `GeneratedReport`, `InventoryBalance`, `InventoryTransaction`, `Notification`, `Product`, `ProductPrice`, `ProductUnit`, `ReportTemplate`, `ReportTemplateVersion`, `Role`, `SalesOrder`, `SalesOrderItem`, `StockImport`, `StockImportItem`, `Subscription`, `SubscriptionPlan`, `SystemConfiguration`, `TaxActivityGroup`, `TaxObligation`, `TaxPayment`, `TaxType`, `TermsConsent`, `Unit`, `User` (+ `enums`).

## 10.3. Danh sách file frontend chính

| Thư mục | Nội dung |
|---|---|
| `app/lib/apiClient.ts` | HTTP client + refresh token + auth sync |
| `app/lib/sessionGuard.ts` | Bảo vệ route |
| `app/proxy.ts` | Edge proxy `/owner/*` |
| `app/components/` | AuthSync, Navbar, PricingPlans, ScrollReveal, legal |
| `app/login`, `app/register`, `app/forgot-password`, `app/verify-email` | Luồng xác thực |
| `app/onboarding` | Thiết lập ban đầu |
| `app/owner/account`, `app/owner/products` | Khu vực chủ hộ |
| `app/admin/accounts`, `app/admin/subscription-plans`, `app/admin/seed` | Khu vực quản trị |

## 10.4. Cấu hình môi trường

| Biến | Mặc định (dev) | Ghi chú |
|---|---|---|
| `DB_HOST` / `DB_PORT` / `DB_NAME` | `localhost` / `3306` / `household_business_platform` | `application-dev.properties` |
| `DB_USERNAME` / `DB_PASSWORD` | `root` / `root` | |
| `JWT_SECRET` | dev key | Prod: bắt buộc từ môi trường |
| `JWT_ACCESS_EXPIRATION_MS` | `900000` (15 phút) | |
| `JWT_REFRESH_EXPIRATION_MS` | `604800000` (7 ngày) | |
| Upload max | `5MB` | `spring.servlet.multipart.max-file-size` |

## 10.5. Ma trận truy xuất thiết kế

| Module | Class Diagram | Sequence | Workflow | Database Tables | API Spec | Frontend |
|---|---|---|---|---|---|---|
| Authentication | §8.2, §8.3 | §8.5, §8.6 | §7.1, §7.2 | users, roles, terms_consents | §6.3 | §4.7 |
| Owner Account | §8.2, §8.3 | §8.8 | §7.1, §7.4 | businesses, users, subscriptions | §6.4 | §4.7 |
| Product & Category | §8.1, §8.2 | §8.7 | §7.3 | products, categories, units, prices, tax_activity_groups | §6.5, §6.6 | §4.7 |
| Subscription | §8.1 | §8.8 | §7.4 | subscription_plans, subscriptions | §6.8 | §4.7 |
| Admin | §8.3 | — | §7.8 | users, roles | §6.7 | §4.7 |
| Sales & Debt | §8.1 | — | §7.5 | sales_orders, sales_order_items, customers, debt_transactions | (kế hoạch) | (kế hoạch) |
| AI Order | §8.1 | — | §7.6 | ai_requests, notifications | §6.11 | (kế hoạch) |
| Accounting/Tax | §8.1 | — | §7.7 | accounting_books, tax_*, report_* | (kế hoạch) | (kế hoạch) |
| Reference | — | — | — | (in-memory) | §6.9 | §4.7 |

## 10.6. Hướng dẫn sử dụng tài liệu này

1. **Lập trình viên Backend** — dùng mục 2 (module/class) + mục 6 (REST API) + mục 8 (class/sequence) + mục 9 (bảo mật).
2. **Lập trình viên Frontend** — dùng mục 4 (frontend) + mục 6 (REST API).
3. **Nhóm dữ liệu** — dùng mục 3 và `database-design.md`.
4. **Nhóm phân tích nghiệp vụ / kiểm thử** — dùng mục 7 (workflow) + mục 8 (sequence) để viết test case cho từng luồng.

---

*— Hết tài liệu —*
