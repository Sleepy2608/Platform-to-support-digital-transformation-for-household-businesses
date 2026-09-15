# BÁO CÁO TỔNG KẾT DỰ ÁN

## NỀN TẢNG HỖ TRỢ CHUYỂN ĐỔI SỐ CHO HỘ KINH DOANH (HBDT)

| Thông tin | Chi tiết |
|---|---|
| **Tên dự án (EN)** | Platform to Support Digital Transformation for Household Businesses |
| **Tên dự án (VN)** | Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh |
| **Viết tắt** | HBDT |
| **Môn học** | Lập trình Java |
| **Loại tài liệu** | Báo cáo tổng kết toàn bộ quá trình phát triển |
| **Thời gian phát triển** | 22/07/2026 → 16/09/2026 |
| **Tiến độ** | 13/13 Epic `Done` trên Jira — mức độ hoàn thành 93% (Sprint 8) |
| **Ngày tổng hợp** | 15/09/2026 |

---

## Mục lục

1. [Giới thiệu chung](#1-giới-thiệu-chung)
2. [Công nghệ & Kiến trúc hệ thống](#2-công-nghệ--kiến-trúc-hệ-thống)
3. [Tổng quan các giai đoạn phát triển](#3-tổng-quan-các-giai-đoạn-phát-triển)
4. [Chi tiết từng module đã triển khai](#4-chi-tiết-từng-module-đã-triển-khai)
5. [Cơ sở dữ liệu & Seed](#5-cơ-sở-dữ-liệu--seed)
6. [AI Service & Draft Order](#6-ai-service--draft-order)
7. [Frontend Web](#7-frontend-web)
8. [Triển khai & Đóng gói](#8-triển-khai--đóng-gói)
9. [Kiểm thử](#9-kiểm-thử)
10. [Hướng dẫn chạy dự án](#10-hướng-dẫn-chạy-dự-án)
11. [Tổng kết](#11-tổng-kết)

---

## 1. Giới thiệu chung

### 1.1. Bối cảnh

Tại Việt Nam, **hộ kinh doanh** giữ vai trò quan trọng trong nền kinh tế địa phương, đặc biệt ở các ngành truyền thống như vật liệu xây dựng, vật tư công trình, cửa hàng kim khí. Phần lớn các hộ này thuộc **Nhóm 1 / Nhóm 2** theo phân loại của **Quyết định 3389/QĐ-BTC (2025)** của Bộ Tài chính.

Các hộ kinh doanh hiện vẫn vận hành **hoàn toàn thủ công**: ghi bán hàng, quản lý kho, theo dõi công nợ và xử lý đơn qua điện thoại/Zalo bằng **sổ tay viết tay** hoặc **file Excel đơn giản**. Phần lớn không có ngân sách thuê kế toán.

Các giải pháp POS/thương mại hiện có lại được thiết kế cho nhà hàng, thời trang hoặc doanh nghiệp lớn nên không phù hợp với đặc thù hộ kinh doanh:

- **Đơn hàng đa kênh** (bán tại quầy + đơn qua điện thoại/Zalo).
- **Quản lý công nợ** với lịch sử giao dịch dài hạn.
- **Trình độ số thấp** của chủ cửa hàng.

Đa số hộ kinh doanh cũng **thiếu thiết bị**: chỉ có một chiếc điện thoại thông minh, không có máy tính, máy quét mã vạch, máy in hóa đơn, POS terminal hay ngăn kéo tiền — khiến các hệ thống POS nhiều thiết bị trở nên bất khả thi.

Hệ quả: tính toán sai sót, xử lý đơn chậm, khó kiểm soát tồn kho, ghi nợ không nhất quán và **không có thông tin kinh doanh theo thời gian thực**.

### 1.2. Giải pháp

Dự án xây dựng **Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh (HBDT)** — hệ thống web tập trung dành riêng cho cửa hàng truyền thống, có thể dùng chỉ với **một chiếc điện thoại thông minh**:

- Giao diện **web responsive** (Next.js), dùng được trên điện thoại cho nhân viên bán hàng tại quầy (**Fast Sales UI**).
- **Trợ lý AI** hiểu yêu cầu ngôn ngữ tự nhiên tiếng Việt (văn bản) → tự động sinh **đơn hàng nháp (Draft Order)** để nhân viên/chủ hộ xác nhận.
- **Tự động ghi sổ kế toán** cho mọi giao dịch bán hàng, nhập kho và công nợ; tự tổng hợp và sinh **sổ/biểu mẫu theo Thông tư 88/2021/TT-BTC**.
- **Báo cáo & phân tích** doanh thu, mặt hàng bán chạy, tồn kho thấp, công nợ còn lại — theo thời gian thực.
- Quản lý **gói thuê bao** (Subscription) và **phân quyền 4 cấp** (Admin → Manager → Owner → Employee).

### 1.3. Các nhóm người dùng (Actor)

| Actor | Vai trò trên hệ thống | Quyền chính |
|---|---|---|
| **Administrator** (`ADMIN`) | Quản trị viên hệ thống | Quản lý tài khoản Owner & Manager, bảng giá gói thuê bao, cấu hình hệ thống/AI, biểu mẫu báo cáo tài chính, thông báo toàn hệ thống, xử lý phản hồi, Platform Analytics, Audit Log |
| **Manager** (`MANAGER`) | Quản lý vận hành nền tảng | Duyệt hồ sơ hộ kinh doanh, hỗ trợ/đối soát gói thuê bao, xem revenue ledger, kiểm tra stock import & bookkeeping, xử lý phản hồi |
| **Owner** (`BUSINESS_OWNER`) | Chủ hộ kinh doanh (tenant) | Toàn quyền nghiệp vụ trong hộ kinh doanh của mình: sản phẩm, kho, khách hàng, công nợ, đơn hàng, nhân viên, doanh thu, sổ kế toán |
| **Employee** (`EMPLOYEE`) | Nhân viên cửa hàng | Đăng nhập, tạo đơn tại quầy, in hóa đơn, ghi nợ, xác nhận/từ chối đơn nháp AI, nhận thông báo realtime |
| **Khách hàng** | *Không có tài khoản* | Tương tác gián tiếp qua **Zalo/điện thoại** (AI Service tiếp nhận hộ) hoặc được Employee/Owner thao tác đại diện |

---

## 2. Công nghệ & Kiến trúc hệ thống

### 2.1. Công nghệ sử dụng

| Thành phần | Công nghệ |
|---|---|
| **Backend** | Java 21 (LTS), Spring Boot 3.3, Spring Web, Spring Data JPA, Spring Security, Spring Validation, Spring Mail, `spring-dotenv`, Lombok, Maven |
| **Xác thực & bảo mật** | JWT stateless (JJWT) — access token **15 phút**, refresh token **7 ngày**; BCrypt; RBAC 4 tầng (`@PreAuthorize` + `SecurityConfig`); rate limit bằng **bucket4j**; `AuditLoggingFilter` |
| **Database** | MySQL 8.x — InnoDB, `utf8mb4` / `utf8mb4_0900_ai_ci` |
| **Xuất báo cáo** | **Apache POI** (Excel) + **OpenPDF** (hóa đơn/PDF) |
| **AI Service** | Python + **FastAPI** + Uvicorn + Pydantic + httpx; provider **B.ai** (Chat Completions) |
| **Frontend** | Next.js 16.2.11 (App Router, Turbopack), React 19.2.4, TypeScript 5, Tailwind CSS 4, react-hook-form 7 + zod 4, framer-motion, lucide-react |
| **Realtime** | **SSE** (`SseEmitter`) cho thông báo theo người dùng |
| **Đóng gói & vận hành** | Maven Wrapper (`mvnw`), npm, Docker, Docker Compose, 4 script `.bat` chạy nhanh trên Windows |

### 2.2. Kiến trúc tổng thể

Hệ thống theo **kiến trúc phân tầng (Layered / Three-Tier)**, backend tổ chức theo **Modular Monolith**, tách riêng **AI Order Service** chạy độc lập:

```
┌──────────────────────────────────────────────────────────────────────┐
│  PRESENTATION TIER                                                   │
│   Next.js 16 App Router (:3000)                                      │
│   ├── Public Portal      (/, /login, /register, /onboarding/*)       │
│   ├── Owner Portal       (/owner/**  — quản trị hộ kinh doanh)       │
│   ├── Employee POS       (/employee/** — bán hàng tại quầy)          │
│   ├── Manager Portal     (/manager/** — vận hành nền tảng)           │
│   └── Admin Portal       (/admin/**  — quản trị hệ thống)            │
├──────────────────────────────────────────────────────────────────────┤
│  API & SECURITY ENTRY LAYER                                          │
│   JwtAuthenticationFilter │ RBAC (@PreAuthorize) │ Tenant Context    │
│   SubscriptionInterceptor │ RateLimit (bucket4j) │ Validation        │
├──────────────────────────────────────────────────────────────────────┤
│  APPLICATION TIER — SPRING BOOT MODULAR MONOLITH (:8080)             │
│   auth │ owner │ admin │ manager │ employee │ subscription │         │
│   entitlement │ product │ pricing │ inventory │ customer │ debt │    │
│   order │ payment │ revenue │ analytics │ ai │ notification │        │
│   feedback │ announcement │ consent │ import │ seed  + common/config │
│   Cross-cutting: Audit Log, Transaction Mgmt, Tenant Isolation       │
├───────────────────────────────┬──────────────────────────────────────┤
│  AI ORDER SERVICE (:8000)     │  DATA & INFRASTRUCTURE               │
│   FastAPI + B.ai              │   MySQL 8 (dữ liệu nghiệp vụ)        │
│   parse-order / draft-        │   Upload storage (object key +       │
│   bookkeeping                 │   SHA-256 + MIME + size)             │
│                               │   Audit log / Seed tracking          │
└───────────────────────────────┴──────────────────────────────────────┘
```

**Đặc điểm quan trọng:**

- **Modular Monolith**: checkout cần lưu đơn + trừ kho + ghi công nợ + sinh bút toán kế toán **trong cùng một transaction** → chọn monolith để đảm bảo toàn vẹn giao dịch.
- **AI Service tách rời**: AI lỗi/độ trễ cao **không chặn** luồng bán hàng thủ công; AI chỉ sinh **đơn nháp**, con người xác nhận cuối cùng (human-in-the-loop).
- **Multi-tenant**: mỗi hộ kinh doanh là một tenant (`BusinessProfile` + cột `business_id`); `businessId` **luôn suy ra từ token**, không tin dữ liệu client gửi lên.

### 2.3. Các quyết định kiến trúc quan trọng (ADR)

| ADR | Quyết định | Lý do |
|---|---|---|
| ADR-001 | **Modular Monolith** cho backend nghiệp vụ (không microservices) | Toàn vẹn transaction cho checkout; đơn giản hoá phát triển/vận hành; phù hợp MVP |
| ADR-002 | **AI Order Service tách khỏi** backend nghiệp vụ | Cô lập độ trễ/lỗi STT–NLP; nâng cấp model độc lập; AI **không truy cập trực tiếp DB** mà gọi API tenant-scoped |
| ADR-003 | **Kênh tích hợp nhắn tin/thoại** (Zalo OA / cuộc gọi) | Tách "nhận tin nhắn" khỏi "hiểu tin nhắn"; thay nhà cung cấp kênh qua adapter |
| ADR-004 | **Multi-tenant Architecture** | Một nền tảng SaaS phục vụ nhiều hộ độc lập; Admin toàn nền tảng, Owner/Employee chỉ thấy tenant của mình |
| ADR-005 | **Notification là cross-cutting service riêng** | Truyền tin thời gian thực không thuộc về tầng bảo mật/entry |
| ADR-006 | **Redis cho caching layer** | Mục tiêu phản hồi < 2.000 ms — *hiện mới ở mức thiết kế (xem §11.2)* |
| ADR-007 | **Chuẩn hoá Tech Stack thực tế** | Next.js 16 / React 19 / TS 5 + Java 21 / Spring Boot 3.3 + MySQL 8 + FastAPI, thống nhất giữa tài liệu thiết kế và mã nguồn |

**Ma trận quyết định theo Quality Attribute:**

| Thuộc tính | Quyết định kiến trúc | Ảnh hưởng |
|---|---|---|
| Performance | Pagination, index cho truy vấn tải cao, tránh N+1 | Phản hồi < 2.000 ms |
| Reliability | AI tách rời + fallback thủ công | Bán hàng không gián đoạn |
| Security & Isolation | JWT + RBAC + tenant context ở mọi tầng | Không rò rỉ dữ liệu chéo tenant |
| Compliance | Module bookkeeping + financial template + versioning | Tuân thủ TT 88/2021/TT-BTC (S1/S2/S4-HKD) |
| Maintainability | Package-by-feature, ranh giới module rõ | Có thể tách microservices sau này |
| Usability | UI tiếng Việt, responsive, tối ưu dùng trên điện thoại | Phù hợp người dùng trình độ số thấp |

### 2.4. Quy mô codebase (số liệu đã kiểm chứng)

| Thành phần | Số liệu |
|---|---|
| **Backend** | **364 file Java (main)** ≈ **22.330 dòng**; **52 file Java (test)** ≈ 7.451 dòng |
| Backend — thành phần | **42 Controller**, **50 Service**, **41 Repository**, **46 Entity (JPA)** |
| **Frontend** | **118 file `.ts`/`.tsx`** ≈ **32.205 dòng** (không tính `node_modules`) |
| **AI Service** | FastAPI app + `bai_client`, `nlp_parser`, `order_builder`, models/routers + test riêng |
| **Database** | **36 bảng** do JPA quản lý (34 bảng nghiệp vụ + 2 bảng seed tracking), **68 khóa ngoại**, **10 trigger** |
| **Tài liệu** | **28 file `.md`** trong `docs/` (URD, SRS, Architecture, Detailed Design, Database Design, Compliance, User Guides, Test Cases, Run Guide) |
| **Kiểm thử** | Backend: **308 test — 0 fail, 0 error** (5 skipped), `BUILD SUCCESS`; Frontend: **71 test — 0 fail** |
| **Số thành viên** | **6 thành viên** |

---

## 3. Tổng quan các giai đoạn phát triển

Dự án phát triển qua **13 Epic** quản lý trên Jira, chia thành các giai đoạn theo thời gian:

| # | Epic | Nội dung chính | Thời gian |
|---|---|---|---|
| 1 | **EPIC-01** Project Foundation & System Design | Scope & business workflows, SRS, Architecture Design, User Requirement, Use Case, ERD, UI Design System, repo & project skeleton, database management, chuyển DB sang Entity + seed, compliance update | 22/07 → 29/07/2026 |
| 2 | **EPIC-02** Public Portal & Owner Onboarding | Landing page, owner self-registration, xác thực tài khoản (OTP), business profile onboarding, terms & privacy consent, chọn & kích hoạt gói | 22/07 → 06/08/2026 |
| 3 | **EPIC-03** Authentication, User Management & Security | Login + refresh token JWT, quản lý tài khoản Owner/Employee/Admin, phân quyền Employee theo Owner, RBAC (2 lần tái cấu trúc), Tenant Isolation, Audit Log, Security Testing | 22/07 → 10/08/2026 |
| 4 | **EPIC-04** Subscription, Payment & Service Invoice | CRUD gói thuê bao, vòng đời subscription, upgrade/downgrade/renewal, xử lý thanh toán, lịch sử subscription & hóa đơn, feature entitlement, subscription-based access control, service invoice | 12/08 → 27/08/2026 |
| 5 | **EPIC-05** Product Catalog & Pricing | CRUD sản phẩm & danh mục, ảnh sản phẩm, nhiều đơn vị tính, quy tắc giá, tìm kiếm tức thời, template import, seed data, giới hạn tính năng theo gói | 12/08 → 19/08/2026 |
| 6 | **EPIC-06** Inventory Management | Nhập kho, tồn kho hiện tại, tự động trừ kho, lịch sử & điều chỉnh kho, cảnh báo tồn thấp, ghi sổ kho tự động | 19/08 → 30/08/2026 |
| 7 | **EPIC-07** Store Customer & Debt Management | CRUD khách hàng, lịch sử mua hàng, ghi nợ khi checkout, thanh toán công nợ, lịch sử & kiểm soát công nợ, ghi sổ công nợ tự động, báo cáo công nợ | 19/08 → 31/08/2026 |
| 8 | **EPIC-08** At-counter Sales & Sales Invoice | API đơn tại quầy, giỏ hàng–giá–gán khách hàng, xác nhận/hủy đơn, lịch sử đơn, in & xuất PDF hóa đơn, Fast Sales UI cho điện thoại | 27/08 → 07/09/2026 |
| 9 | **EPIC-09** AI Draft Order & Realtime Notification | AI text input, order parser, matching sản phẩm/khách hàng, phát hiện mập mờ, sinh Draft Order, UI duyệt đơn nháp, AI fallback & logging, kiểm thử độ chính xác AI, cấu hình hệ thống/AI, realtime notification | 20/08 → 15/09/2026 |
| 10 | **EPIC-10** Automatic Bookkeeping & Compliance | Accounting transaction model, ghi sổ tự động cho bán hàng/kho/công nợ, quản lý biểu mẫu tài chính, quy trình duyệt–sửa–từ chối báo cáo, phiên bản hoá template, xuất báo cáo kế toán | 19/08 → 12/09/2026 |
| 11 | **EPIC-11** Reports & Analytics | Dashboard doanh thu cho Owner, revenue ledger chi tiết, biểu đồ doanh thu, lọc theo ngày, operational analytics, báo cáo công nợ & vận hành | 07/09 → 14/09/2026 |
| 12 | **EPIC-12** Administrator Management | Quản lý tài khoản Admin & Manager, hồ sơ quản trị, quản lý tài khoản Owner, giá gói thuê bao, cấu hình hệ thống/AI, biểu mẫu tài chính, thông báo toàn hệ thống, quản lý phản hồi, Platform Analytics | 27/07 → 12/09/2026 |
| 13 | **EPIC-13** Testing, Deployment & Documentation | UAT end-to-end, kiểm thử bảo mật, kiểm thử hiệu năng, unit & integration testing, viết test cases, regression toàn bộ chức năng, script `.bat` chạy nhanh, deployment/migration/backup, installation guide, user manuals, cập nhật tài liệu cuối | 01/09 → 16/09/2026 |

---

## 4. Chi tiết từng module đã triển khai

### 4.1. Public Portal & Owner Onboarding (EPIC-02)

**Chức năng:** Cho phép hộ kinh doanh tự đăng ký, xác thực tài khoản, khai báo hồ sơ kinh doanh, đồng thuận điều khoản và chọn gói dịch vụ.

**Cách triển khai:**

- **Luồng onboarding**: `Landing → /register → xác thực OTP email → /onboarding/business-profile (hồ sơ kinh doanh) → /onboarding/package-selection (chọn gói) → kích hoạt`.
- **API**: `POST /api/auth/register` (tạo user `PENDING` + sinh OTP), `POST /api/auth/verify-otp` (kích hoạt, gán role `BUSINESS_OWNER`, trả `AuthResponse`), `POST /api/owner/business-profile` (upsert hồ sơ), `GET /api/public/subscription-plans` (bảng giá công khai).
- **OTP**: `OtpService` quản lý **in-memory** (không lưu DB), TTL cấu hình `app.otp.ttl-minutes` (mặc định 5 phút); chế độ dev `app.otp.dev-mode=true` in OTP ra console thay vì gửi email thật. Gửi mail qua `MailService`.
- **Đồng thuận pháp lý**: bảng `terms_consents` lưu 6 cờ đồng thuận (điều khoản, quyền riêng tư, xử lý dữ liệu, **phạm vi học thuật Thông tư 88**, xác nhận thông tin chính xác, hiểu rủi ro sai lệch) kèm `ip_address`, `user_agent`, `accepted_at`.
- **UI**: trang điều khoản/chính sách (`legal/` components, `Circular88PolicyCard`), form đăng ký dùng `react-hook-form` + `zod`.

### 4.2. Authentication, User Management & Security (EPIC-03)

**Chức năng:** Xác thực & phân quyền dùng chung cho toàn hệ thống (4 vai trò: `ADMIN`, `MANAGER`, `BUSINESS_OWNER`, `EMPLOYEE`).

**Cách triển khai:**

- **JWT stateless**: `JwtAuthenticationFilter` đọc `Authorization: Bearer <token>` → `JwtTokenProvider` kiểm chữ ký + hạn → nạp `UserDetails` qua `CustomUserDetailsService` → gán `SecurityContext`. Access token **15 phút**, refresh token **7 ngày**; refresh qua `POST /api/auth/refresh-token`.
- **Vòng đời tài khoản**: `PENDING` (chưa xác thực OTP) → `ACTIVE`; hỗ trợ khóa/mở khóa tài khoản, quên/đặt lại mật khẩu (`/api/auth/forgot-password`, `/api/auth/reset-password`), tự vô hiệu hoá tài khoản (soft-delete, yêu cầu mật khẩu).
- **Đổi email/SĐT có OTP**: `POST /api/owner/email/initiate` → `.../confirm?newEmail=`, tương tự cho số điện thoại.
- **RBAC 2 lớp**:
  - *URL security* trong `SecurityConfig`: `/api/auth/*`, `/api/public/**`, `/api/reference/**`, `/uploads/**` là public; `/api/admin/accounts/**`, `/api/admin/seed/**` chỉ `ADMIN`; `/api/admin/**` cho `ADMIN|MANAGER`; `/api/owner/**` cho `BUSINESS_OWNER|OWNER`.
  - *Method security*: `@PreAuthorize("hasRole('ADMIN')")` cho seed & quản lý Manager; `hasAnyRole('ADMIN','MANAGER')` cho vận hành nền tảng; `hasAnyRole('BUSINESS_OWNER','OWNER')` cho nghiệp vụ hộ kinh doanh.
- **Bảo vệ Root Admin**: không cho phép khóa/xóa tài khoản Admin mặc định.
- **Tenant Isolation**: mọi truy vấn nghiệp vụ bắt buộc kèm `businessId` **suy ra từ token** — chặn truy cập chéo hộ kinh doanh (đã có test `*_wrongBusiness_throws`, `*_tenantMismatch`).
- **Rate limiting**: `RateLimitService` (bucket4j) giới hạn đăng nhập và gửi OTP theo IP — chống brute force / spam OTP.
- **Audit log**: `AuditLoggingFilter` + `AuditLogService` ghi bảng `audit_logs` kèm **dữ liệu trước/sau**.
- **Quản lý Employee theo Owner**: Owner tạo/sửa/khoá tài khoản nhân viên, đặt lại mật khẩu, phân quyền theo tài khoản Owner.

### 4.3. Subscription, Payment & Service Invoice (EPIC-04)

**Chức năng:** Quản lý gói thuê bao, vòng đời subscription, gia hạn/nâng cấp/hạ cấp, kiểm soát truy cập theo gói (Feature Entitlement) và hóa đơn dịch vụ.

**Cách triển khai:**

- **Bảng**: `subscription_plans` (điều khoản gói: loại gói, giá, chu kỳ, danh sách tính năng) và `subscriptions` (cam kết của từng hộ: `businessId`, gói, trạng thái, ngày hết hạn).
- **API Owner**: `GET /api/owner/subscription/packages`, `POST /api/owner/subscription/select-package?packageType=&billingCycle=`, `POST /api/owner/subscription/renew?months=1..24`.
- **API Admin/Manager**: CRUD `/api/admin/subscription-plans`; bảng giá công khai tại `GET /api/public/subscription-plans` (chỉ gói active).
- **Feature Entitlement**: `SubscriptionInterceptor` kiểm tra quyền truy cập theo gói ở mọi request nghiệp vụ; UI dùng `FeatureGate` + `EntitlementContext`/`useEntitlement` để ẩn/khoá tính năng và hiển thị `UpgradeModal`.
- **Thanh toán**: luồng chọn gói có phí mở **QR/chuyển khoản** (`PaymentQrModal`, tải QR qua `qrDownload.ts`) và xác nhận kích hoạt gói; gói miễn phí kích hoạt trực tiếp. ⚠️ **Chưa tích hợp cổng thanh toán/webhook ngân hàng tự động** — đối soát do Manager/Admin thực hiện (xem §11.2).
- **Service Invoice**: sinh hóa đơn dịch vụ cho gói thuê bao; Manager xem/tra cứu tại `/manager/invoices`.

### 4.4. Product Catalog & Pricing (EPIC-05)

**Chức năng:** Quản lý danh mục, sản phẩm, nhiều đơn vị tính, quy tắc giá, tìm kiếm tức thời và import dữ liệu.

**Cách triển khai:**

- **Bảng (10 bảng nhóm Product & Inventory)**: `categories`, `products`, `units`, `product_units` (tỷ lệ quy đổi), `product_prices` (quy tắc giá theo đơn vị / số lượng / thời gian), `tax_activity_groups` (nhóm hoạt động + tỷ lệ GTGT/TNCN theo phiên bản).
- **Đa đơn vị tính**: `UnitConversionService` quy đổi giữa các đơn vị (ví dụ: bao → kg) khi bán hàng và nhập kho.
- **Snapshot dữ liệu**: `sales_order_items.unit_price` lưu giá tại thời điểm bán; `tax_activity_group_id` + `vat_calculation_rate` + `pit_calculation_rate` được **sao chép vào chi tiết đơn** — đổi giá/tỷ lệ sau này không làm sai lệch đơn cũ.
- **API**: `GET/POST/PUT/DELETE /api/products` (phân trang, lọc `keyword`, `status`, `categoryId`, sắp xếp động), `GET /api/products/references/units`, `GET /api/products/references/tax-activity-groups`, tương tự cho `/api/categories`.
- **Tìm kiếm tức thời**: `useDebounce` + `ProductSearchPicker` — phục vụ thao tác nhanh khi bán tại quầy.
- **Ảnh sản phẩm & hồ sơ cửa hàng**: ảnh lưu **ngoài DB** (private object storage/thư mục upload); MySQL chỉ lưu `object_key` + `sha256` + `content_type` + `size`; backend trả **signed URL** có thời hạn.
- **Import dữ liệu**: template import sản phẩm (`ProductImportSection`, module `imports`, xử lý Excel bằng Apache POI).
- **Soft delete**: `DELETE /api/products/{id}` chỉ **vô hiệu hoá** sản phẩm, không xoá cứng.
- **Giới hạn theo gói**: vượt giới hạn tính năng → thông báo + gợi ý nâng cấp gói.

### 4.5. Inventory Management (EPIC-06)

**Chức năng:** Nhập kho, theo dõi tồn kho, tự động trừ kho khi bán, điều chỉnh, cảnh báo tồn thấp và ghi sổ kho tự động.

**Cách triển khai:**

- **Bảng**: `stock_imports` / `stock_import_items` (phiếu nhập), `inventory_balances` (**số dư hiện tại** — truy vấn nhanh), `inventory_transactions` (**lịch sử** nhập/xuất/điều chỉnh kèm giá vốn).
- **Nguyên tắc nhất quán**: số dư (`inventory_balances`) và lịch sử (`inventory_transactions`) **được cập nhật trong cùng một transaction** để không lệch nhau.
- **Phương pháp tính giá xuất kho**: cấu hình theo từng hộ kinh doanh tại `businesses.inventory_method`; `inventory_balances` lưu **đơn giá bình quân** và **giá trị tồn**.
- **Transaction xác nhận nhập kho**: (1) ghi phiếu nhập + chi tiết → (2) tạo `InventoryTransaction` loại NHẬP → (3) cập nhật `InventoryBalance` (số lượng + giá vốn bình quân) → (4) sinh bút toán kế toán giá trị nhập kho.
- **Trừ kho tự động**: khi đơn bán hàng được **xác nhận** (`CONFIRMED`) → sinh `InventoryTransaction` loại XUẤT; khi **hủy đơn** → hoàn trả hàng về kho.
- **Điều chỉnh kho**: `InventoryAdjustmentModal` + view model `inventoryAdjustmentViewModel` (có test).
- **Cảnh báo tồn thấp**: `LowStockAlertService` theo ngưỡng tối thiểu của từng sản phẩm; dashboard `/owner/inventory-alerts`, `/employee/inventory-alerts`; logic view model có kiểm thử riêng (`lowStockViewModel`, `currentStockViewModel`).
- **Ghi sổ kho tự động**: `InventoryBookkeepingService` sinh bút toán cho nhập/xuất/điều chỉnh (phục vụ S2-HKD).

### 4.6. Store Customer & Debt Management (EPIC-07)

**Chức năng:** Quản lý khách hàng, bán chịu (ghi nợ), thu nợ, lịch sử & tổng hợp công nợ, ghi sổ công nợ tự động.

**Cách triển khai:**

- **Bảng**: `customers` (hồ sơ + `debt_balance`), `sales_orders` (`total_amount`, `paid_amount`, `debt_amount`, `payment_status`), `sales_order_items`, `debt_transactions` (**Single Source of Truth** cho mọi biến động nợ).
- **Enum chuẩn hoá**: `DebtTransactionType` = `DEBT_INCREASE | PAYMENT | ADJUSTMENT | VOID`; `DebtTransactionStatus` = `ACTIVE | VOIDED`; `PaymentMethod` = `CASH | BANK_TRANSFER`; `PaymentStatus` = `UNPAID | PARTIALLY_PAID | PAID`.
- **Ghi nợ khi checkout**: `SalesOrder.paidAmount` < tổng tiền → sinh `DebtTransaction` loại `DEBT_INCREASE`, tăng `Customer.debtBalance`; `paymentStatus` tương ứng `UNPAID`/`PARTIALLY_PAID`. Nếu có nợ mà **thiếu khách hàng** → từ chối tạo đơn (rollback toàn bộ).
- **Thu nợ**: `POST /api/payments` → kiểm tra đơn phải **CONFIRMED** (không nhận thanh toán cho đơn `DRAFT`/`CANCELLED`), không cho trả vượt nợ đơn, vượt nợ khách, không cho amount ≤ 0 → cập nhật `paid_amount`/`debt_amount` + `Customer.debtBalance` + ghi `DebtTransaction` loại `PAYMENT` kèm `balanceAfter`.
- **Đảo nợ khi hủy đơn**: `cancelSalesOrder` sinh `DebtTransaction` loại `VOID` để hoàn trả công nợ + hoàn kho; nếu số dư bị âm bất thường → chặn và **ROLLBACK** toàn bộ thao tác hủy.
- **Chống deadlock**: quy tắc khóa tài nguyên cố định — **lock `SalesOrder` trước, lock `Customer` sau** (`findForUpdateByIdAndBusinessId`), áp dụng cho cả `makePayment` và `cancelSalesOrder` (đã có test xác nhận thứ tự khoá).
- **Tra cứu & báo cáo**: `GET /api/payments/customers/{id}/history` (phân trang ≤ 100, sắp xếp `transactionDate DESC, id DESC`, hiển thị cả giao dịch `VOID`), `GET /api/payments/customers/{id}/debt-summary` (tổng phát sinh / tổng trả / tổng void / số dư hiện tại), `GET /api/payments/orders/{orderId}` và `/summary`.
- **Lịch sử mua hàng**: `/owner/customers/[id]/purchase-history`, `/employee/customers/[id]/purchase-history`.
- **Cô lập tenant**: khách hàng/đơn của hộ khác → trả `ResourceNotFoundException` (404), không can thiệp dữ liệu chéo.

### 4.7. At-counter Sales & Sales Invoice (EPIC-08)

**Chức năng:** Bán hàng tại quầy, giỏ hàng, xác nhận/hủy đơn, lịch sử đơn và in/xuất hóa đơn.

**Cách triển khai:**

- **Luồng POS**: chọn khách hàng (tuỳ chọn) → chọn sản phẩm + số lượng (giá & thuế snapshot) → xác nhận đơn.
- **Transaction xác nhận đơn (tính nhất quán cao)**: (1) trừ tồn kho → `InventoryTransaction` + `InventoryBalance`; (2) ghi thanh toán → `paid_amount`/`debt_amount`; (3) nếu ghi nợ → `DebtTransaction`; (4) sinh `AccountingEntry` (ghi sổ tự động).
- **Trạng thái đơn**: `DRAFT → CONFIRMED → PAID / PARTIALLY_PAID → COMPLETED / CANCELLED`.
- **Lịch sử đơn**: `/owner/orders/history`, `/employee/orders/history`; chi tiết đơn qua `CustomerOrderDetailModal`.
- **Hóa đơn bán hàng**: preview (`SalesInvoicePreview`) + xuất **PDF bằng OpenPDF** (`sales-invoice-pdf.ts` phía FE, định dạng trong `invoice-format.ts`/`invoice-types.ts`) để **in hoặc gửi cho khách**.
- **Fast Sales UI**: giao diện bán nhanh tối ưu cho **điện thoại** (Owner/Employee) — thao tác ít bước, tìm sản phẩm tức thời, giỏ hàng dạng drawer.

### 4.8. Automatic Bookkeeping & Compliance (EPIC-10)

**Chức năng:** Tự động ghi sổ kế toán cho mọi nghiệp vụ, quản lý biểu mẫu tài chính, quy trình duyệt báo cáo và xuất báo cáo.

**Cách triển khai:**

- **Accounting core**: `accounting_books` (sổ theo hộ, loại sổ, kỳ) + `accounting_book_entries` (dòng ghi sổ, nguồn phát sinh, lịch sử điều chỉnh).
- **Ghi sổ tự động** từ 3 nguồn: `SalesBookkeepingService` (bán hàng), `InventoryBookkeepingService` (nhập/xuất/điều chỉnh kho), `DebtBookkeepingService` (phát sinh/thanh toán/đảo nợ) — mỗi service có bộ test riêng.
- **Nguyên tắc**: hệ thống **không bắt người dùng nhập lại số liệu**; sổ được sinh từ sự kiện đã xác nhận, bảo toàn lịch sử qua snapshot.
- **Compliance TT 88/2021/TT-BTC**: triển khai 3 mẫu sổ — **S1-HKD** (chi tiết doanh thu bán hàng hoá, dịch vụ), **S2-HKD** (chi tiết vật liệu, dụng cụ, sản phẩm, hàng hoá), **S4-HKD** (chi tiết nghĩa vụ thuế với NSNN); template nằm trong `docs/compliance/templates/books/`.
- **Nghĩa vụ thuế**: `tax_types`, `tax_obligations` (phát sinh theo hộ & kỳ), `tax_payments` (các lần nộp gắn với nghĩa vụ); phân loại theo `tax_activity_groups` (Quyết định 3389/QĐ-BTC).
- **Quản lý biểu mẫu**: `report_templates` + `report_template_versions` (phiên bản cấu trúc & thời gian hiệu lực) — Admin quản lý tại `/admin/report-templates`, `/admin/templates`.
- **Quy trình báo cáo**: sinh báo cáo (`generated_reports`) → **Review / Edit / Reject** → duyệt → **Export** (Excel qua Apache POI, PDF qua OpenPDF).
- **Trigger bảo vệ dữ liệu**: 10 trigger kiểm soát điều chỉnh dòng sổ, duyệt báo cáo, ngăn phiên bản biểu mẫu/nhóm thuế **chồng lấn thời gian**, và kiểm tra hạn mức công nợ.
- **Ngoài phạm vi học thuật** (đã ghi rõ trong tài liệu): S3-HKD (chi phí), S5-HKD (tiền lương), S6-HKD (quỹ tiền mặt), S7-HKD (tiền gửi ngân hàng), kê khai/nộp thuế điện tử, hoá đơn điện tử.

### 4.9. Reports & Analytics (EPIC-11)

**Chức năng:** Báo cáo doanh thu, phân tích vận hành, cảnh báo tồn kho, công nợ và Platform Analytics.

**Cách triển khai:**

- **Revenue Ledger**: bảng `revenue_ledger_entries` (dữ liệu **denormalized**) lưu `salesOrderId`, `productId`, `confirmedAt`, `lineTotal` → truy vấn báo cáo nhanh, không join phức tạp; API `/api/revenue-ledger` (+ `/operations/review`).
- **Dashboard Owner** (`/owner/revenue`): doanh thu theo ngày/tuần/tháng, biểu đồ (`RevenueChart`), **lọc theo ngày**, các thẻ tổng hợp.
- **Phân tích mặt hàng** (`/owner/revenue/products`): mặt hàng **bán chạy / bán chậm / không bán được** (best/slow/unsold).
- **Operational analytics**: `PlatformAnalyticsDashboard`, chỉ số vận hành theo hộ (doanh thu, đơn, kho, nợ).
- **Platform Analytics cho Admin/Manager** (`/admin/analytics`, `/manager/analytics`): chỉ số toàn nền tảng, tăng trưởng, gói thuê bao.
- **Báo cáo công nợ & vận hành**: tổng công nợ, lịch sử thu nợ, đối soát (dùng chung nguồn `debt_transactions`).
- **Lưu ý nhất quán số liệu**: khi hủy đơn/hủy nợ phải bảo đảm dashboard, ledger và sổ kế toán cùng phản ánh đúng một trạng thái (xem §11.2).

### 4.10. Administrator Management (EPIC-12)

**Chức năng:** Quản trị toàn nền tảng: tài khoản, gói thuê bao, cấu hình hệ thống/AI, biểu mẫu tài chính, thông báo, phản hồi.

**Cách triển khai:**

- **Quản lý tài khoản Manager**: `/api/admin/accounts` (chỉ `ADMIN`) — danh sách (loại trừ Root Admin), tạo/kiểm tra trùng `username`/`email`/`phone`, cập nhật, xoá; **không cho xoá Root Admin**.
- **Quản lý gói thuê bao**: CRUD `/api/admin/subscription-plans` (`ADMIN|MANAGER`) — giá theo tháng/năm, chu kỳ, tính năng.
- **Quản lý Owner**: xem/tìm/lọc hồ sơ hộ kinh doanh, kích hoạt/vô hiệu hoá, duyệt hồ sơ (Manager).
- **Cấu hình hệ thống & AI**: bảng `system_configurations` + màn `/admin/features` (Feature Plans/giới hạn gói).
- **Biểu mẫu tài chính**: quản lý `report_templates` + phiên bản hoá template.
- **Thông báo toàn hệ thống**: `announcements` + UI `/admin/announcements`.
- **Quản lý phản hồi**: `feedback` — Owner/Employee gửi (`/owner/feedback`), Manager xử lý (`/manager/feedback`), Admin theo dõi (`/admin/feedback`).
- **Seed data**: `POST /api/admin/seed/run` (chỉ `ADMIN`) và `GET /api/admin/seed/status` — chạy lại seed theo version/checksum; UI `/admin/seed`.
- **Audit & bảo mật**: xem Audit Log, cơ chế snapshot/restore seed có mã hoá (`seed_key`).

---

## 5. Cơ sở dữ liệu & Seed

### 5.1. Tổng quan

| Thuộc tính | Giá trị |
|---|---|
| Hệ quản trị | **MySQL 8.x** — Storage Engine **InnoDB** |
| Character set / Collation | `utf8mb4` / `utf8mb4_0900_ai_ci` |
| Mô hình | Quan hệ, **multi-tenant dùng chung schema** |
| Quy mô | **36 bảng** (34 nghiệp vụ + 2 seed tracking), **68 khóa ngoại**, **10 trigger** |
| Cơ chế tạo schema | Hibernate `ddl-auto` — `update` ở dev, `validate` ở prod (không dùng migration SQL) |
| Quan hệ | Object mapping (`@ManyToOne`) cho liên kết lõi; trường `Long ...Id` cho tham chiếu định danh — tránh object graph lớn, vòng lặp JSON và truy vấn ngoài ý muốn |

### 5.2. Các phân hệ bảng

| Phân hệ | Số bảng | Bảng chính |
|---|---|---|
| **Business Core** | 5 | `businesses`, `users`, `roles`, `subscription_plans`, `subscriptions` |
| **Product & Inventory** | 10 | `categories`, `products`, `units`, `product_units`, `product_prices`, `stock_imports`, `stock_import_items`, `inventory_balances`, `inventory_transactions`, `tax_activity_groups` |
| **Sales & Customer Debt** | 4 | `customers`, `sales_orders`, `sales_order_items`, `debt_transactions` |
| **AI & System Operations** | 6 | `ai_requests`, `notifications`, `feedback`, `announcements`, `system_configurations`, `audit_logs` |
| **Accounting, Tax & Reporting** | 8 | `report_templates`, `report_template_versions`, `accounting_books`, `accounting_book_entries`, `generated_reports`, `tax_types`, `tax_obligations`, `tax_payments` |
| **Onboarding & Seed Tracking** | 3 | `terms_consents`, `seed_config`, `seed_key` |

**Dữ liệu KHÔNG phải bảng:** `province` / `district` / `ward` được tải từ API `provinces.open-api.vn` lúc khởi động và lưu **in-memory** (`GeoReferenceStore`); **OTP** do `OtpService` quản lý in-memory; địa chỉ hộ kinh doanh lưu trong `businesses.address` dạng **JSON compact** (không có bảng địa chỉ riêng).

**Media:** MySQL **không** lưu nội dung nhị phân của ảnh — `businesses` có 8 cột media nullable (4 logo + 4 ảnh bìa: `object_key`, `sha256`, `content_type`, `size`); file thật nằm ngoài DB (thư mục upload/object storage).

### 5.3. Snapshot dữ liệu lịch sử

| Nội dung | Cơ chế |
|---|---|
| Giá bán | `sales_order_items.unit_price` lưu giá **tại thời điểm bán**; đổi bảng giá không ảnh hưởng đơn đã xác nhận |
| Nhóm & tỷ lệ thuế | Backend **sao chép** `tax_activity_group_id`, `vat_calculation_rate`, `pit_calculation_rate` từ sản phẩm sang chi tiết đơn |
| Tồn kho | `inventory_transactions` (lịch sử) + `inventory_balances` (số dư) cập nhật **cùng transaction** |
| Công nợ | `debt_transactions` là nguồn sự thật; `Customer.debtBalance` luôn khớp `balanceAfter` của giao dịch mới nhất |
| Audit | `audit_logs` lưu dữ liệu **trước/sau** thao tác |

### 5.4. Chiến lược Indexing

| Bảng | Cột index | Mục đích |
|---|---|---|
| `users` | `business_id`, `username`/`email` | Đăng nhập, phân quyền theo hộ |
| `products` | `business_id`, `category_id`, `status` | Tìm kiếm/lọc khi bán hàng |
| `sales_orders` | `business_id`, `status`, `created_at` | Danh sách đơn, báo cáo doanh thu |
| `customers` | `business_id`, `phone` | Tra cứu khách khi ghi nợ |
| `debt_transactions` | `business_id`, `customer_id`, `sales_order_id`, `transaction_date` | Lịch sử công nợ & đối soát |
| `inventory_transactions` | `product_id`, `created_at` | Lịch sử nhập/xuất kho |
| `revenue_ledger_entries` | `business_id`, `confirmed_at`, `product_id`, `customer_id` | Báo cáo doanh thu & mặt hàng bán chạy |
| `ai_requests` | `business_id`, `status` | Danh sách yêu cầu AI/đơn nháp chờ duyệt |

### 5.5. Cơ chế Seed dữ liệu

- `SeedService` đọc file JSON theo **version + checksum**, ghi trạng thái vào `seed_config` (checksum, version, `seed_order`) — chạy lại an toàn, không ghi đè dữ liệu đã có.
- `seed_key` lưu hash khoá dùng cho **snapshot/restore seed có mã hoá**.
- Nguồn seed: `Code/Server/seed/*.json` và `seed/*.json` ở thư mục gốc (users, roles, subscription_plans, tax_types, report_templates, businesses, products, customers, sales_orders, debt_transactions, inventory_*, notifications, audit_logs…).
- Cấu hình bật/tắt: `APP_SEED_DEMO_USERS_ENABLED`, `APP_SEED_ROLES_ENABLED`, `APP_REFERENCE_DATA_ENABLED`.
- **Tài khoản demo**: `Admin` / `admin@hbdt.com` (mật khẩu dev: `admin`) và `owner` / `owner@hbdt.com` (mật khẩu dev: `owner123`).

---

## 6. AI Service & Draft Order

### 6.1. Kiến trúc AI Order Service

`Code/AI` là **service FastAPI độc lập** (cổng 8000), không truy cập trực tiếp database nghiệp vụ mà gọi API backend theo **tenant-scoped**:

```
Khách hàng (Zalo / điện thoại / tại quầy)
   │
   ▼
Channel Adapter  →  (nếu là voice: Speech-to-Text)
   │
   ▼
NLP Parser / Entity Extraction   (sản phẩm, số lượng, khách hàng, ghi chú công nợ)
   │
   ▼
Product/Customer Matching   ←→  Application Tier API (kèm businessId, KHÔNG đọc DB trực tiếp)
   │
   ▼
Ambiguity Detection + Confidence Scoring
   │
   ▼
Draft Order (PENDING_REVIEW)  →  Notification Service (SSE)  →  Employee/Owner
   │
   ▼
Employee/Owner:  Kiểm tra → Sửa / Từ chối / Xác nhận
   │
   ▼ (Xác nhận)
Order & Checkout  xử lý như đơn thủ công (transaction đầy đủ: kho + nợ + bút toán)
```

**Thành phần trong `Code/AI`:** `main.py` (FastAPI app), `src/config.py`, `src/models.py` (Pydantic models), `src/router.py` (endpoints), `src/services/bai_client.py` (gọi provider **B.ai**), `nlp_parser.py`, `order_builder.py`, `tests/test_bai.py`, `scripts/try_bai.py`, `Dockerfile`.

**Bảo mật giữa backend ↔ AI**: header **`X-API-Secret`** phải khớp `AI_SERVICE_API_SECRET` (dependency `require_service_secret` trong router). Base URL của B.ai **bắt buộc là HTTPS hợp lệ** (chặn URL chứa credential/query/fragment).

### 6.2. API

**AI Service (FastAPI)** — prefix `/api/v1/ai`:

| Method | Path | Mô tả |
|---|---|---|
| POST | `/api/v1/ai/parse-order` | Nhận `{ text }` → trích xuất đơn hàng (`ExtractedOrder`) |
| POST | `/api/v1/ai/draft-bookkeeping` | Sinh bản nháp định khoản kế toán từ dữ liệu báo cáo |
| GET | `/api/v1/ai/ready` | Readiness (kiểm tra cấu hình model/provider) |
| GET | `/health` | Health check (không yêu cầu secret) |

**Backend (`AiController`)** — `/api/ai` (yêu cầu feature `AI_ASSISTANT` của gói):

| Method | Path | Mô tả |
|---|---|---|
| POST | `/api/ai/parse-order` | Gọi AI Service, lưu `ai_requests`, sinh Draft Order, phát thông báo realtime |
| GET | `/api/ai/drafts` | Danh sách đơn nháp chờ xử lý |
| POST | `/api/ai/drafts/{id}/reject` | Từ chối đơn nháp (kèm lý do) |
| POST | `/api/ai/draft-bookkeeping` | Nháp bút toán kế toán |
| GET | `/api/ai/health` | Trạng thái AI Service |

**Cấu hình backend**: `ai.service.url` (`AI_SERVICE_URL`, mặc định `http://localhost:8000`), `ai.service.api-secret`, `ai.service.timeout-seconds` (mặc định 35), `ai.service.auto-start` (`AI_SERVICE_AUTO_START`, mặc định `true`) và `ai.service.work-dir` — backend **tự khởi động tiến trình AI** (`AiServiceProcessManager`) khi bật auto-start.

### 6.3. Nguyên tắc thiết kế

| Nguyên tắc | Mô tả |
|---|---|
| **Human-in-the-loop** | AI **chỉ tạo đơn nháp**; Employee/Owner bắt buộc kiểm tra, sửa hoặc từ chối trước khi ghi nhận chính thức |
| **Manual fallback** | AI/Speech provider không khả dụng → kênh vẫn nhận tin, chuyển thẳng cho nhân viên xử lý thủ công, **không chặn bán hàng** |
| **Tenant-scoped matching** | Mọi truy vấn sản phẩm/khách hàng phải kèm `businessId`, gọi qua API backend — tránh vi phạm ranh giới module và rò rỉ dữ liệu chéo tenant |
| **Confidence threshold** | Đơn nháp có điểm tin cậy thấp bị gắn cờ **"cần làm rõ"** thay vì tự đoán giá trị |
| **Idempotency** | Mỗi input có định danh duy nhất → tránh sinh trùng Draft Order khi kênh retry |
| **Logging** | Mọi yêu cầu AI lưu ở `ai_requests` (input, kết quả trích xuất, trạng thái) để truy vết và đo độ chính xác |

### 6.4. Realtime Notification

- **Backend**: `NotificationService` + `NotificationStreamService` — fan-out theo người dùng bằng `SseEmitter` (`ConcurrentHashMap<Long, Set<SseEmitter>>`, hỗ trợ **nhiều tab/thiết bị** cho cùng user).
- **Endpoint**: `GET /api/notifications/stream` (`text/event-stream`) — SSE; `GET /api/notifications`, `GET /api/notifications/unread-count`, `PATCH /api/notifications/{id}/read`.
- **Frontend**: `NotificationBell` — badge chưa đọc, danh sách thông báo, nhận realtime qua SSE (`Accept: text/event-stream`) **kèm polling dự phòng mỗi 60 giây**.
- **Ứng dụng chính**: báo cho Employee/Owner ngay khi AI sinh đơn nháp; thông báo trạng thái đơn, cảnh báo tồn kho thấp, thông báo gói thuê bao.

---

## 7. Frontend Web

### 7.1. Công nghệ & cấu trúc

| Thành phần | Công nghệ |
|---|---|
| Framework | **Next.js 16.2.11** — App Router, Turbopack |
| UI | **React 19.2.4**, TypeScript 5, Tailwind CSS 4, framer-motion, lucide-react |
| Form & validation | react-hook-form 7 + zod 4 + `@hookform/resolvers` |
| Test | Node.js built-in test runner (`node --test --experimental-strip-types`) |

**Cấu trúc chính**: `app/` (routes), `app/components/**` (component dùng chung), `app/lib/**` (apiClient, sessionGuard, view models, format hoá hóa đơn), `tests/**` (4 bộ test view model).

### 7.2. Bốn khu vực giao diện

| Khu vực | Route tiêu biểu | Chức năng |
|---|---|---|
| **Public** | `/`, `/login`, `/register`, `/forgot-password`, `/verify-email`, `/onboarding/business-profile`, `/onboarding/package-selection` | Landing page, bảng giá, đăng ký/đăng nhập, xác thực OTP, thiết lập hồ sơ cửa hàng & chọn gói cước |
| **Owner** | `/owner/account` (+ `/subscription`), `/owner/products` (+ `stock-import`), `/owner/inventory`, `/owner/inventory-alerts`, `/owner/customers` (+ purchase history), `/owner/employees` (+ `/[employeeId]`), `/owner/orders` (+ `/new`, `/history`), `/owner/fast-sales`, `/owner/revenue` (+ `/products`), `/owner/reports`, `/owner/feedback` | Dashboard chủ hộ: sản phẩm, kho, khách hàng & công nợ, đơn hàng, doanh thu, nhân viên, gói thuê bao |
| **Employee** | `/employee/account`, `/employee/orders` (+ `/new`, `/history`), `/employee/fast-sales`, `/employee/customers` (+ purchase history), `/employee/inventory`, `/employee/inventory-alerts`, `/employee/revenue` | **Fast Sales UI**: lập đơn tại quầy, giỏ hàng, ghi nợ, in hóa đơn, xem cảnh báo tồn |
| **Manager & Admin** | `/manager` (+ `/analytics`, `/feedback`, `/invoices`), `/admin/login`, `/admin` (+ `/accounts`, `/analytics`, `/announcements`, `/features`, `/feedback`, `/profile`, `/report-templates`, `/seed`, `/subscription-plans`, `/templates`) | Vận hành nền tảng & quản trị hệ thống |

### 7.3. Bảo vệ route & quản lý phiên

- **Edge Proxy** (`proxy.ts`): chặn truy cập khu vực bảo vệ khi thiếu cookie `auth_token` / sai `auth_role` → redirect `/login?redirect=<path>`.
- **Session Guard** (`sessionGuard.ts`): kiểm tra token phía client, chặn truy cập khi chưa đăng nhập.
- **AuthSync** (`AuthSync.tsx`): đồng bộ trạng thái đăng nhập **giữa nhiều tab** qua `BroadcastChannel` + fallback `localStorage`.
- **apiClient**: tự động **refresh token** khi access token hết hạn, xử lý 401 (đăng xuất) / 403 (Access Denied); thiết lập cookie cho Edge Proxy.
- **Form validation**: schema `zod` khai báo theo từng form, hiển thị lỗi theo trường.

### 7.4. UI/UX đặc trưng

- **Tiếng Việt toàn bộ**, Unicode đầy đủ; thiết kế responsive, ưu tiên thao tác trên **điện thoại** (mục tiêu người dùng chỉ có smartphone).
- **Fast Sales UI** cho Owner/Employee: tìm sản phẩm tức thời, thêm nhanh vào giỏ, gán khách hàng, xác nhận đơn trong ít bước.
- **Trợ lý AI** (`AiOrderInput`): nhập yêu cầu bằng tiếng Việt tự nhiên → xem đơn nháp, chỉnh sửa, xác nhận hoặc từ chối.
- **FeatureGate / UpgradeModal**: khoá tính năng theo gói thuê bao và gợi ý nâng cấp.
- **Component nghiệp vụ chính**: `OrderCartDrawer`, `ProductSearchPicker`, `CustomerSelect`, `PaymentQrModal`, `PaymentHistoryList`, `CustomerDebtCard`, `SalesInvoicePreview`, `RevenueLedgerView`, `RevenueChart`, `CurrentStockBalanceDashboard`, `LowStockAlertDashboard`, `InventoryAdjustmentModal`, `InventoryBookkeepingView`, `PlatformAnalyticsDashboard`, `NotificationBell`, `Circular88PolicyCard`.

---

## 8. Triển khai & Đóng gói

### 8.1. Docker / Docker Compose

- `Code/Server/Dockerfile` (backend Spring Boot), `Code/AI/Dockerfile` (AI FastAPI), `Code/Server/database/init.sql` (khởi tạo schema/user).
- `docker-compose.yml` ở thư mục gốc mô tả 4 service: `mysql` (MySQL 8.0 + healthcheck), `backend` (phụ thuộc MySQL healthy), `ai-service`, `frontend`.
- ⚠️ **Hạn chế đã biết**: file `docker-compose.yml` còn cấu hình sót lại từ giai đoạn đầu (tên container/DB `agritrade`, mount `./database/init.sql` trong khi đường dẫn thật là `Code/Server/database/init.sql`, mapping frontend `5173:80` trong khi dev dùng cổng `3000`, build context AI là `./ai-service` thay vì `./Code/AI`) → cần cập nhật trước khi dùng làm kênh triển khai chính thức.

### 8.2. Script chạy nhanh (khuyến nghị khi dev)

Repo có **4 file `.bat`** ở thư mục gốc, chỉ cần double-click:

| File | Chạy gì | Cổng | Cần cài trước |
|---|---|---|---|
| `run-backend.bat` | Backend Spring Boot | **8080** | JDK 21 + `JAVA_HOME` |
| `run-frontend.bat` | Frontend Next.js | **3000** | Node.js 20+ |
| `run-frontend-clean.bat` | Xoá `.next` + `node_modules` rồi cài lại và chạy | **3000** | Node.js 20+ |
| `run-ai.bat` | AI Service (FastAPI) | **8000** | Python 3.10+ |

Script tự kiểm tra môi trường, tự `npm install` nếu chưa có `node_modules`, giữ cửa sổ khi có lỗi. Lần chạy đầu của `run-ai.bat` sẽ tạo `.venv` (~50 MB) và tải thư viện (cần Internet, 1–2 phút); cài lại bằng `run-ai.bat reinstall`.

### 8.3. Cấu hình môi trường

- File mẫu `Code/Server/.env.example`; các biến chính: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `JWT_ACCESS_EXPIRATION_MS` (900000 = 15 phút), `JWT_REFRESH_EXPIRATION_MS` (604800000 = 7 ngày), `MAIL_*`, `OTP_DEV_MODE`, `OTP_TTL_MINUTES`, `SERVER_PORT`, `SPRING_PROFILES_ACTIVE`, `AI_SERVICE_URL`, `AI_SERVICE_API_SECRET`, `AI_SERVICE_AUTO_START`.
- **Profile**: `dev` (`ddl-auto=update`, `createDatabaseIfNotExist=true`, OTP in ra console) và `prod` (`ddl-auto=validate`, bật `useSSL`/`requireSSL`, `JWT_SECRET` lấy từ biến môi trường — **không hardcode**).
- `spring.config.import=optional:file:.env[.properties]` — tự nạp `.env` (file này bị `.gitignore`).
- `spring.jpa.open-in-view=false` — không giữ JPA session cho các request SSE dài hạn.
- **Cảnh báo quan trọng**: đường dẫn thư mục dự án **không được chứa dấu tiếng Việt hoặc khoảng trắng** (JDK/Maven trên Windows dễ lỗi `Could not find or load main class`).

---

## 9. Kiểm thử

### 9.1. Kết quả thực thi (kiểm chứng ngày 15/09/2026)

| Bộ kiểm thử | Lệnh | Kết quả |
|---|---|---|
| **Backend** | `.\mvnw.cmd test` (JDK 21) | **308 test — 0 failure, 0 error**, 5 skipped, `BUILD SUCCESS`; 26 file báo cáo Surefire |
| **Frontend** | `node --test --experimental-strip-types tests/*.test.ts` | **71 test — 0 fail** trên 4 bộ: `lowStockViewModel` (40), `inventoryAdjustmentViewModel` (12), `debtBookkeepingViewModel` (14), `currentStockViewModel` (5) |

### 9.2. Phạm vi kiểm thử theo module

| Nhóm | Nội dung kiểm thử tiêu biểu |
|---|---|
| **Auth & Security** | Đăng nhập/đăng ký, OTP, refresh token, filter JWT, phân quyền RBAC, interceptor subscription, audit log |
| **Product & Pricing** | CRUD sản phẩm/danh mục, đơn vị tính & quy đổi, quy tắc giá |
| **Inventory** | Nhập kho, tồn kho hiện tại, luồng kho, điều chỉnh, cảnh báo tồn thấp, ghi sổ kho |
| **Sales & Debt** | Tạo đơn trả đủ/trả một phần/mua chịu, chặn đơn nợ thiếu khách hàng, chặn `paidAmount` âm; thu nợ (đơn chưa CONFIRMED, đã trả hết, amount ≤ 0, vượt nợ đơn/khách), hủy đơn & **đảo nợ `VOID`**, **thứ tự khoá chống deadlock**, rollback khi số dư âm; lịch sử & tổng hợp công nợ, phân trang, cô lập tenant |
| **Revenue & Analytics** | Revenue ledger, biểu đồ doanh thu, phân tích mặt hàng (có nhóm test MySQL riêng — skip trong môi trường CI không có MySQL) |
| **Subscription** | CRUD gói, chọn/huỷ/gia hạn gói, kiểm tra entitlement |
| **AI (FE view model)** | Kiểm thử logic hiển thị/hợp nhất dữ liệu ở phía client |

### 9.3. Test Cases & Requirements Traceability

- `docs/testing-documents/test-cases.md` mô tả bộ test cho module **Quản lý Công nợ & Thanh toán (HBDT-66)** với 4 nhóm: phát sinh nợ, thanh toán nợ, hủy đơn & đảo nợ, lịch sử & báo cáo — kèm **Requirements Traceability Matrix** ánh xạ `HBDT-07.3/07.4/07.5/08.4` → test case → test class, tất cả **PASS**.
- Các loại kiểm thử đã thực hiện theo EPIC-13: **Unit & Integration Testing**, **Security Testing**, **Performance Testing**, **End-to-end UAT**, **Regression toàn bộ chức năng**.

---

## 10. Hướng dẫn chạy dự án

### 10.1. Yêu cầu

JDK 21 (`JAVA_HOME`), Maven 3.9+ (hoặc `mvnw`), Node.js 20+, npm 10+, MySQL 8.0+ (tuỳ chọn — dev có thể dùng DB local do `createDatabaseIfNotExist=true`), Python 3.10+ (nếu dùng AI Service), Docker & Docker Compose (tuỳ chọn).

### 10.2. Cấu hình

```bat
:: 1. Clone
git clone https://github.com/Sleepy2608/Platform-to-support-digital-transformation-for-household-businesses.git
cd Platform-to-support-digital-transformation-for-household-businesses

:: 2. Tạo Code/Server/.env từ .env.example và điền DB / JWT / MAIL
```

### 10.3. Chạy nhanh (khuyến nghị)

| Double-click | Kết quả |
|---|---|
| `run-backend.bat` | Backend tại `http://localhost:8080` |
| `run-frontend.bat` | Frontend tại `http://localhost:3000` |
| `run-ai.bat` | AI Service tại `http://localhost:8000` |

### 10.4. Chạy thủ công

```bat
:: Backend
cd Code\Server
.\mvnw.cmd spring-boot:run

:: Frontend
cd Code\Client\src\frontend
npm install
npm run dev

:: AI Service
cd Code\AI
python -m venv .venv && .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 10.5. Truy cập & tài khoản demo

| Khu vực | URL |
|---|---|
| Landing / đăng ký | `http://localhost:3000/` , `/register` |
| Owner & Employee | `http://localhost:3000/login` |
| Manager | `http://localhost:3000/login` → `/manager` |
| Admin | `http://localhost:3000/admin/login` |

| Tài khoản | Thông tin đăng nhập |
|---|---|
| Admin | `admin` (hoặc `admin@hbdt.com`) / mật khẩu dev: `admin` |
| Owner | `owner` (hoặc `owner@hbdt.com`) / mật khẩu dev: `owner123` |

> Ở môi trường dev, OTP hiển thị trong **console log của backend** (`OTP_DEV_MODE=true`) thay vì gửi email thật. Sau khi đăng nhập Admin lần đầu nên **đổi mật khẩu mặc định**.

---

## 11. Tổng kết

### 11.1. Đã hoàn thành ✅

| Nhóm | Tính năng |
|---|---|
| **Nền tảng & Onboarding** | Landing page, đăng ký chủ hộ, xác thực OTP email, onboarding hồ sơ kinh doanh (địa chỉ 3 cấp, mã số thuế, loại hình), đồng thuận điều khoản/chính sách + TT 88 |
| **Xác thực & phân quyền** | JWT stateless (access 15', refresh 7 ngày), BCrypt, RBAC 4 tầng (Admin/Manager/Owner/Employee), Tenant Isolation, Audit Log, rate limit chống brute force/spam OTP, quản lý tài khoản Owner/Employee/Admin/Manager |
| **Thuê bao & thanh toán** | CRUD gói thuê bao, vòng đời subscription, upgrade/downgrade/gia hạn, Feature Entitlement + FeatureGate, hóa đơn dịch vụ, bảng giá công khai, thanh toán bằng QR/chuyển khoản có xác nhận |
| **Sản phẩm & giá** | Danh mục, sản phẩm, ảnh (object key + signed URL), nhiều đơn vị tính + quy đổi, quy tắc giá, tìm kiếm tức thời, import template, nhóm hoạt động & tỷ lệ thuế |
| **Kho** | Nhập kho, tồn kho hiện tại, trừ kho tự động khi xác nhận đơn, hoàn kho khi hủy, lịch sử & điều chỉnh, cảnh báo tồn thấp, ghi sổ kho tự động |
| **Bán hàng & công nợ** | POS tại quầy, giỏ hàng–giá–gán khách hàng, ghi nợ khi checkout, thu nợ (nhiều đợt), đảo nợ khi hủy đơn, lịch sử & tổng hợp công nợ, hóa đơn PDF, lịch sử đơn, **Fast Sales UI** |
| **AI** | Trợ lý AI hiểu ngôn ngữ tự nhiên tiếng Việt → đơn nháp; matching sản phẩm/khách hàng theo tenant; phát hiện mập mờ; UI duyệt/sửa/từ chối; fallback thủ công; logging & đo độ chính xác; cấu hình AI |
| **Thông báo** | Notification realtime **SSE** theo người dùng (nhiều tab), badge chưa đọc, polling dự phòng, thông báo toàn hệ thống |
| **Kế toán & tuân thủ** | Ghi sổ tự động cho bán hàng/kho/công nợ, sổ **S1/S2/S4-HKD** theo TT 88/2021/TT-BTC, nghĩa vụ & nộp thuế, quản lý biểu mẫu + **phiên bản hoá template**, quy trình Review/Edit/Reject, **export Excel/PDF** |
| **Báo cáo & phân tích** | Dashboard doanh thu, revenue ledger chi tiết, biểu đồ + lọc theo ngày, mặt hàng bán chạy/chậm/không bán được, báo cáo công nợ & vận hành, Platform Analytics cho Admin/Manager |
| **Quản trị** | Quản lý tài khoản Admin/Manager/Owner, giá gói thuê bao, cấu hình hệ thống/AI, biểu mẫu tài chính, thông báo hệ thống, quản lý phản hồi, seed data (version/checksum + snapshot có mã hoá) |
| **Chất lượng & vận hành** | **308 test backend + 71 test frontend** đều pass; test cases + RTM; UAT/bảo mật/hiệu năng; 28 tài liệu `docs/`; 4 script `.bat`; Docker + Docker Compose |

### 11.2. Còn thiếu / ngoài phạm vi 🔜

| Hạng mục | Trạng thái |
|---|---|
| **HBDT-60 — Voice-to-text** | ❌ Chưa hoàn thành. Hệ thống mới hỗ trợ **text input**; trường `audio_base64` đã có trong hợp đồng API nhưng STT chưa triển khai |
| **HBDT-104 — UML Diagram** | ❌ Còn ở trạng thái `To Do` (một phần đã có class/sequence diagram trong Detailed Design) |
| **HBDT-128 — Release Package** | ❌ Chưa đóng gói bản phát hành |
| **Cổng thanh toán tự động** | ❌ Chưa tích hợp payment gateway/webhook ngân hàng; thanh toán gói thuê bao hiện theo luồng **QR/chuyển khoản + xác nhận thủ công** |
| **Redis cache** | ⚠️ Mới ở mức **thiết kế** (ADR-006, key pattern, TTL). `pom.xml` **không có** dependency Redis và không có cấu hình `redis.*` → chưa có caching layer thực tế |
| **`docker-compose.yml`** | ⚠️ Còn cấu hình cũ (`agritrade`, sai đường dẫn mount, sai cổng frontend, sai context AI) → cần cập nhật trước khi dùng chính thức |
| **Sổ S3/S5/S6/S7-HKD & thuế điện tử** | ⛔ Ngoài phạm vi học thuật: chi phí, tiền lương, quỹ tiền mặt, tiền gửi ngân hàng, kê khai/nộp thuế điện tử, hoá đơn điện tử, đối soát ngân hàng, phân bổ 1 khoản thanh toán cho nhiều đơn, hoàn tiền phức tạp |
| **Chấm công & tính lương, quản lý chi phí đầy đủ** | ⛔ Ngoài phạm vi |
| **Bất nhất tài liệu** | ⚠️ Một số mục trong `detailed-design.md` vẫn ghi "đang ở giai đoạn kế hoạch" / "AI parser chưa triển khai" trong khi mã nguồn và `feature.md` đã hoàn thành → cần rà soát đồng bộ |
| **Độ chính xác số liệu dashboard** | ⚠️ Cần tiếp tục kiểm chứng tính nhất quán theo chuỗi `Order → Payment → Debt → Inventory → Bookkeeping → Dashboard`, đặc biệt phân biệt rõ **doanh thu** và **tiền thực thu** khi khách mua chịu/trả nợ |

### 11.3. Đánh giá chất lượng code

- **Kiến trúc rõ ràng**: package-by-feature (`com.hbdt.<module>`) với ranh giới module nhất quán; controller mỏng – service chứa nghiệp vụ – repository truy cập dữ liệu.
- **Toàn vẹn dữ liệu**: các luồng nhiều bảng (checkout, nhập kho, thu nợ, hủy đơn) đều nằm trong **một transaction**; quy tắc **khoá tài nguyên cố định** (`SalesOrder` → `Customer`) phòng deadlock; `debt_transactions` làm **SSOT** cho công nợ.
- **Bảo mật**: JWT + refresh, BCrypt, RBAC 2 lớp (URL + method), cô lập tenant suy ra từ token, rate limiting (bucket4j), audit log trước/sau, không nhận OTP/địa giới qua DB, ảnh lưu ngoài DB kèm signed URL, bảo vệ Root Admin.
- **Tuân thủ**: mapping rõ ràng giữa quy định (TT 88/2021/TT-BTC, QĐ 3389/QĐ-BTC) và bảng/module thực tế (`docs/compliance/mapping-law-to-project.md`), có phân định minh bạch phần **trong/ngoài phạm vi**.
- **Khả năng truy vết**: snapshot dữ liệu lịch sử (giá, thuế), version hoá biểu mẫu, seed theo version/checksum, audit log đầy đủ.
- **Hiệu năng**: phân trang mặc định, tìm kiếm có debounce, index thiết kế cho truy vấn tải cao, revenue ledger denormalized, tránh N+1, `open-in-view=false`.
- **Chất lượng kiểm thử**: 308 test backend + 71 test frontend, phủ các luồng nghiệp vụ then chốt và **các biên bảo mật/nghiệp vụ** (tenant mismatch, deadlock order, rollback, validation số tiền).
- **Tài liệu**: 28 file `.md` bao phủ URD, SRS, Kiến trúc, Thiết kế chi tiết, Thiết kế CSDL, Tuân thủ pháp lý, 4 user manual theo vai trò, test cases + RTM, hướng dẫn cài đặt & chạy.

---

*Báo cáo được tổng hợp từ toàn bộ source code, Các commit trên [đồ án Github](https://github.com/Sleepy2608/Platform-to-support-digital-transformation-for-household-businesses) (được 6 thành viên thực hiện), 28 tài liệu trong `docs/`, kết quả chạy kiểm thử thực tế (`mvnw test` = 308 test PASS; 4 bộ test frontend = 71 test PASS; 39 test cases ở docs/testing-documents) và thống kê trực tiếp trên repo. Thời điểm tổng kết: 15/09/2026.*
