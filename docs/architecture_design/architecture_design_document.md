# TÀI LIỆU THIẾT KẾ KIẾN TRÚC HỆ THỐNG (ARCHITECTURE DESIGN DOCUMENT)

## DỰ ÁN: NỀN TẢNG HỖ TRỢ CHUYỂN ĐỔI SỐ CHO HỘ KINH DOANH

| Thông tin | Chi tiết |
|---|---|
| **Tên dự án (EN)** | Platform to Support Digital Transformation for Household Businesses |
| **Tên dự án (VN)** | Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh |
| **Loại tài liệu** | Architecture Design Document |
| **Viết tắt** | HBDT
| **Phiên bản tài liệu** | 1.0 |
| **Ngày tạo** | 26/07/2026 |
| **Trạng thái** | Bản nháp (Draft) |

---

## Mục lục

1. [Tóm tắt tổng quan (Executive Summary)](#1-tóm-tắt-tổng-quan-executive-summary)
2. [Tổng quan kiến trúc (Architecture Overview)](#2-tổng-quan-kiến-trúc-architecture-overview)
3. [Quyết định thiết kế (Design Decisions)](#3-quyết-định-thiết-kế-design-decisions)
4. [Kiến trúc phân lớp (Layered Architecture)](#4-kiến-trúc-phân-lớp-layered-architecture)
5. [Thiết kế các thành phần cốt lõi (Core Components Design)](#5-thiết-kế-các-thành-phần-cốt-lõi-core-components-design)
6. [Kiến trúc AI Order Service](#6-kiến-trúc-ai-order-service)
7. [Kiến trúc dữ liệu (Data Architecture)](#7-kiến-trúc-dữ-liệu-data-architecture)
8. [Kiến trúc tích hợp bên ngoài (Integration Architecture)](#8-kiến-trúc-tích-hợp-bên-ngoài-integration-architecture)
9. [Kiến trúc triển khai (Deployment Architecture)](#9-kiến-trúc-triển-khai-deployment-architecture)
10. [Mô hình bảo mật (Security Architecture)](#10-mô-hình-bảo-mật-security-architecture)
11. [Bảo vệ dữ liệu cá nhân (Data Privacy & Personal Data Protection)](#11-bảo-vệ-dữ-liệu-cá-nhân-data-privacy--personal-data-protection)
12. [Đặc tả hiệu năng và khả năng mở rộng (Performance & Scalability)](#12-đặc-tả-hiệu-năng-và-khả-năng-mở-rộng-performance--scalability)
13. [Luồng nghiệp vụ chính (Key Business Flows)](#13-luồng-nghiệp-vụ-chính-key-business-flows)
14. [Chiến lược kiểm thử kiến trúc (Architecture Testing Strategy)](#14-chiến-lược-kiểm-thử-kiến-trúc-architecture-testing-strategy)
15. [Phụ lục (Appendices)](#15-phụ-lục-appendices)

---

## 1. Tóm tắt tổng quan (Executive Summary)

### 1.1. Mục đích tài liệu

Tài liệu mô tả kiến trúc kỹ thuật của nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh: các quyết định kiến trúc, mô hình phân lớp, thiết kế thành phần, tích hợp AI xử lý ngôn ngữ tự nhiên, dữ liệu, triển khai, bảo mật và chiến lược mở rộng.

### 1.2. Đối tượng đọc

| Đối tượng | Mục đích sử dụng |
|---|---|
| **Kiến trúc sư hệ thống** | Ra quyết định kiến trúc |
| **Developers** | Hiểu cấu trúc tổng thể để phát triển đúng mô hình |
| **DevOps** | Cấu hình hạ tầng, triển khai |
| **Testers** | Lập kế hoạch kiểm thử tích hợp, hiệu năng |
| **Giảng viên / Stakeholders** | Đánh giá, phê duyệt thiết kế |

### 1.3. Tài liệu tham chiếu

| STT | Tài liệu | Ghi chú |
|---|---|---|
| 1 | User Requirement Document | Yêu cầu người dùng chi tiết |
| 2 | Software Requirement Specification (SRS) | Đặc tả yêu cầu phần mềm |
| 3 | Quyết định 3389/QĐ-BTC (2025) | Phân loại hộ kinh doanh Nhóm 1/2 |
| 4 | Thông tư 88/2021/TT-BTC | Chuẩn kế toán cho hộ kinh doanh |
| 5 | IEEE 42010-2011 | Chuẩn mô tả kiến trúc hệ thống |

### 1.4. Tóm tắt dành cho Stakeholders

Hệ thống được thiết kế theo kiến trúc **phân tầng** (Layered / Three-Tier), Backend tổ chức theo **Modular Monolith**, tách riêng một **AI Order Service** để xử lý ngôn ngữ tự nhiên (text/voice) và không làm gián đoạn bán hàng thủ công khi AI không khả dụng. Hệ thống là **multi-tenant**, mỗi hộ kinh doanh là một Tenant độc lập. Hệ thống bao gồm:

- **4 nhóm giao diện**: Public Portal (đăng ký/landing), Owner Web/Mobile, Employee Mobile/POS, Admin Portal — ưu tiên thiết kế đơn giản, phù hợp người dùng có trình độ số thấp và chỉ sở hữu smartphone.
- **1 Backend API trung tâm** theo mô hình Modular Monolith, đảm bảo tính toàn vẹn giao dịch (order – tồn kho – công nợ – bút toán) trong cùng transaction.
- **1 AI Order Service** độc lập: chuyển đổi tin nhắn/giọng nói (qua kênh tại quầy, điện thoại, Zalo) thành Draft Order, luôn có con người xác nhận trước khi ghi nhận chính thức (human-in-the-loop).
- **Kênh tích hợp nhắn tin (Zalo OA / thoại)** làm cầu nối giữa khách hàng và AI Order Service — đây là thành phần bắt buộc để hiện thực hoá yêu cầu "multi-channel orders".
- **Hạ tầng dữ liệu**: Cơ sở dữ liệu quan hệ, Redis cache, Object storage, Message queue, Audit log.

Kiến trúc hướng tới đáp ứng các yêu cầu phi chức năng: thời gian phản hồi < 2.000 ms cho thao tác cốt lõi, hỗ trợ nhiều người dùng đồng thời, có cơ chế fallback thủ công khi AI lỗi, và tuân thủ Thông tư 88/2021/TT-BTC về báo cáo kế toán.

> **Lưu ý:** Kiến trúc **không khóa vào một framework hoặc nhà cung cấp cụ thể**. Các công nghệ nêu trong tài liệu (ví dụ ở mục 3) chỉ mang tính minh hoạ; nhóm có thể thay thế bằng stack thực tế khi triển khai.

---

## 2. Tổng quan kiến trúc (Architecture Overview)

### 2.1. Mô hình kiến trúc tổng quan (System Context — C4 Level 1)

```
                                    HỆ THỐNG BÊN NGOÀI
                    ┌─────────────────────────────────────────────────┐
                    │              NGƯỜI DÙNG / ACTORS                │
                    │                                                 │
                    │   ┌───────┐   ┌──────────┐     ┌───────────┐    │
                    │   │ OWNER │   │ EMPLOYEE │     │   ADMIN   │    │
                    │   └───┬───┘   └────┬─────┘     └─────┬─────┘    │
                    │       │            │                 │          │
                    │       │      ┌─────┴──────┐          │          │
                    │       │      │ KHÁCH HÀNG │          │          │
                    │       │      │ (phone/Zalo│          │          │
                    │       │      │  /tại quầy)│          │          │
                    │       │      └─────┬──────┘          │          │
                    └───────┼────────────┼─────────────────┼──────────┘
                            ▼            ▼                 ▼
        ┌───────────────────────────────────────────────────────────────┐
        │        NỀN TẢNG HỖ TRỢ CHUYỂN ĐỔI SỐ CHO HỘ KINH DOANH        │
        │                                                               │
        │   Presentation Tier → Application Tier (Modular Monolith)     │
        │   → AI Order Service → Data & Infrastructure                  │
        └───────────────────────────────┬───────────────────────────────┘
                                        │
                    ┌───────────────────┼───────────────────┐
                    ▼                   ▼                   ▼
          ┌──────────────────┐ ┌─────────────────┐ ┌──────────────────┐
          │  PAYMENT / BANK  │ │ MESSAGING/VOICE │ │  AI / SPEECH     │
          │  (Subscription)  │ │ CHANNEL (Zalo,  │ │  PROVIDER (STT,  │
          │                  │ │  điện thoại)    │ │  NLP model)      │
          └──────────────────┘ └─────────────────┘ └──────────────────┘
```

**Chú thích:** Khách hàng không phải actor có tài khoản trong hệ thống — họ tương tác gián tiếp qua kênh Zalo/điện thoại, được Employee/Owner đại diện thao tác hoặc được AI Order Service tiếp nhận hộ.

### 2.2. Kiến trúc Container (C4 Level 2)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              HỆ THỐNG                                       │
│                                                                             │
│  ┌───────────────────────── PRESENTATION TIER ────────────────────────┐     │
│  │  Public Portal │ Owner Web/Mobile │ Employee Mobile/POS │ Admin    │     │
│  │  (Landing,     │ (Quản lý cửa     │ (Bán hàng, xác      │ Portal   │     │
│  │  Đăng ký)      │  hàng, báo cáo)  │  nhận, công nợ)     │          │     │
│  └───────────────────────────────┬────────────────────────────────────┘     │
│                                  │ HTTPS / WebSocket                        │
│  ┌────────────────────── API & SECURITY ENTRY LAYER ────────────────┐       │
│  │  Backend API │ Authentication │ RBAC │ Tenant Context │          │       │
│  │  Subscription Entitlement │ Request Validation │ Rate Limiting   │       │
│  └───────────────────────────────┬──────────────────────────────────┘       │
│                                   │                                         │
│  ┌────────────── APPLICATION TIER — BACKEND MODULAR MONOLITH ─────────┐     │
│  │  Onboarding & Identity │ Subscription & Billing │ Product/Pricing  │     │
│  │  Inventory │ Customer & Debt │ Order & Checkout                    │     │
│  │  Accounting, Bookkeeping & Compliance │ Reporting & Analytics      │     │
│  │  Administration │  Cross-cutting: Audit Log, Transaction Mgmt,     │     │
│  │  Tenant Isolation                                                  │     │
│  └───────┬────────────────────────────────────────────────┬───────────┘     │
│          │                                                │                 │
│  ┌───────┴───────────┐  ┌──────────────────────┐  ┌───────┴──────────┐      │
│  │  AI ORDER SERVICE │  │ NOTIFICATION SERVICE │  │ DATA &           │      │
│  │  (độc lập triển   │  │ (cross-cutting,      │  │ INFRASTRUCTURE   │      │
│  │  khai)            │  │  WebSocket/Push)     │  │ DB/Cache/Storage/│      │
│  │                   │  │                      │  │ Queue/Audit      │      │
│  └───────┬───────────┘  └──────────────────────┘  └──────────────────┘      │
└──────────┼──────────────────────────────────────────────────────────────────┘
           │
┌──────────┼─────────────────────── HỆ THỐNG BÊN NGOÀI ───────────────────────┐
│          ▼                                                                  │
│  ┌───────────────────┐  ┌──────────────────┐  ┌──────────────────────┐      │
│  │ MESSAGING/VOICE   │  │ PAYMENT PROVIDER │  │ EMAIL/SMS/PUSH       │      │
│  │ CHANNEL (Zalo OA, │  │ / BANK           │  │ PROVIDER (OTP,       │      │
│  │ ghi âm cuộc gọi)  │  │ (Subscription)   │  │ thông báo)           │      │
│  └────────┬──────────┘  └──────────────────┘  └──────────────────────┘      │
│           ▼                                                                 │
│  ┌──────────────────┐                                                       │
│  │ AI / SPEECH      │                                                       │
│  │ PROVIDER (STT,   │                                                       │
│  │ NLP model)       │                                                       │
│  └──────────────────┘                                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

> So với bản kiến trúc trước, hai thay đổi chính: (1) bổ sung **Messaging/Voice Channel** làm cổng tiếp nhận tin nhắn/cuộc gọi trước khi vào AI Order Service; (2) tách **Notification Service** ra khỏi Security Entry Layer thành một cross-cutting service riêng.

### 2.3. Bảng tóm tắt thành phần

| # | Thành phần | Vai trò | Giao thức |
|---|---|---|---|
| 1 | Public Portal | Landing page, đăng ký Owner | HTTPS |
| 2 | Owner Web/Mobile | Quản lý cửa hàng, sản phẩm, kho, khách hàng, báo cáo | HTTPS |
| 3 | Employee Mobile/POS | Bán hàng tại quầy, xác nhận Draft Order, ghi công nợ | HTTPS + WebSocket |
| 4 | Admin Portal | Quản trị Owner, subscription, cấu hình hệ thống | HTTPS |
| 5 | API & Security Entry Layer | Auth, RBAC, Tenant Context, Rate Limiting | REST |
| 6 | Backend Modular Monolith | Toàn bộ nghiệp vụ lõi | REST / nội bộ |
| 7 | AI Order Service | STT, NLP, matching, sinh Draft Order | REST / message queue |
| 8 | Messaging/Voice Channel | Tiếp nhận tin nhắn Zalo, cuộc gọi | Webhook / API |
| 9 | Notification Service | Thông báo realtime | WebSocket / Push |
| 10 | Data & Infrastructure | DB, cache, file, queue, audit | JDBC/TCP |
| 11 | Payment Provider | Thanh toán subscription | REST API |
| 12 | Email/SMS/Push Provider | OTP, thông báo tài khoản | SMTP/API |
| 13 | AI/Speech Provider | Speech-to-Text, mô hình ngôn ngữ | REST API |

---

## 3. Quyết định thiết kế (Design Decisions)

### 3.1. Tổng hợp các quyết định kiến trúc (ADR)

#### ADR-001: Modular Monolith cho Backend

| Thuộc tính | Chi tiết |
|---|---|
| **Quyết định** | Backend nghiệp vụ tổ chức theo **Modular Monolith**, không dùng Microservices |
| **Bối cảnh** | Checkout cần lưu đơn, trừ kho, ghi công nợ/thanh toán và tạo bút toán kế toán trong cùng một transaction |
| **Lý do chọn** | ① Đảm bảo tính toàn vẹn giao dịch bằng transaction cơ sở dữ liệu chung <br> ② Đơn giản hoá phát triển/vận hành cho team quy mô vừa/nhỏ <br> ③ Phù hợp giai đoạn MVP |
| **Đánh đổi** | Khó scale riêng từng module; coupling cao hơn microservices |
| **Giảm thiểu** | Tổ chức code theo package-by-feature, module giao tiếp qua application service, không truy cập trực tiếp bảng của module khác |

#### ADR-002: AI Order Service tách khỏi Backend nghiệp vụ

| Thuộc tính | Chi tiết |
|---|---|
| **Quyết định** | AI Order Service triển khai **độc lập** với Backend Modular Monolith |
| **Bối cảnh** | Cần cô lập độ trễ/lỗi của Speech-to-Text và mô hình ngôn ngữ khỏi luồng bán hàng thủ công |
| **Lý do chọn** | ① Triển khai/nâng cấp mô hình AI độc lập <br> ② Bán hàng thủ công không bị gián đoạn khi AI lỗi <br> ③ AI chỉ tạo Draft Order — Employee/Owner luôn là người xác nhận cuối |
| **Ràng buộc bổ sung** | AI Order Service **không được truy cập trực tiếp** cơ sở dữ liệu nghiệp vụ; mọi thao tác đọc Product/Customer để matching phải đi qua application service API của Application Tier, có kèm `tenant_id` để đảm bảo cô lập dữ liệu giữa các hộ kinh doanh |

#### ADR-003: Kênh tích hợp nhắn tin/thoại (Messaging Channel Integration)

| Thuộc tính | Chi tiết |
|---|---|
| **Quyết định** | Bổ sung thành phần **Messaging/Voice Channel Integration** làm cổng vào duy nhất cho tin nhắn Zalo và cuộc gọi thoại trước khi chuyển vào AI Order Service |
| **Bối cảnh** | Yêu cầu "multi-channel orders" (tại quầy + phone/Zalo) cần một nơi tiếp nhận sự kiện từ Zalo OA (webhook) hoặc bản ghi âm cuộc gọi |
| **Lý do chọn** | ① Tách biệt việc "nhận tin nhắn" khỏi việc "hiểu tin nhắn" (AI/Speech Provider) <br> ② Cho phép thay đổi nhà cung cấp kênh (Zalo, tổng đài ảo...) qua adapter mà không ảnh hưởng AI Service |

#### ADR-004: Multi-tenant Architecture

| Thuộc tính | Chi tiết |
|---|---|
| **Quyết định** | Mỗi hộ kinh doanh là một `Tenant`; dữ liệu nghiệp vụ gắn `tenant_id` |
| **Lý do chọn** | ① Một nền tảng SaaS phục vụ nhiều hộ kinh doanh độc lập <br> ② Admin có phạm vi toàn nền tảng, Owner/Employee chỉ thấy dữ liệu Tenant của mình |
| **Đánh đổi** | Cần kiểm soát chặt tenant isolation ở mọi tầng, kể cả AI Order Service |

#### ADR-005: Notification Service là cross-cutting service riêng

| Thuộc tính | Chi tiết |
|---|---|
| **Quyết định** | Tách Notification Service (WebSocket/Push) khỏi API & Security Entry Layer |
| **Bối cảnh** | Bản kiến trúc trước gộp Notification chung với Auth/RBAC/Rate Limiting — sai về mặt trách nhiệm |
| **Lý do chọn** | Notification là concern về truyền tin thời gian thực, không liên quan bảo mật/entry; tách riêng giúp module rõ ràng và dễ mở rộng (thêm kênh SMS/Zalo Notification sau này) |

#### ADR-006: Redis cho Caching Layer

| Thuộc tính | Chi tiết |
|---|---|
| **Quyết định** | Dùng Redis (hoặc tương đương) làm caching layer |
| **Lý do chọn** | ① Đáp ứng yêu cầu phản hồi < 2.000 ms <br> ② Hỗ trợ session, cache danh mục sản phẩm, rate limiting |

#### ADR-007: Công nghệ minh hoạ

| Thành phần | Ví dụ công nghệ | Ghi chú |
|---|---|---|
| Frontend Web | ReactJS/Next.js hoặc Vue/Nuxt | Responsive, ưu tiên hiệu năng trên thiết bị cấu hình thấp |
| Mobile | React Native hoặc Flutter | Dùng chung 1 codebase cho Owner/Employee app |
| Backend | Node.js (NestJS) hoặc Java (Spring Boot) | Modular Monolith, package-by-feature |
| Database | PostgreSQL/MySQL | Quan hệ, hỗ trợ transaction ACID |
| Cache | Redis | Session, cache, rate limit |
| Queue | RabbitMQ/Kafka hoặc dịch vụ cloud tương đương | Xử lý bất đồng bộ AI, notification |
| AI/Speech | Nhà cung cấp STT + LLM (có thể qua API bên thứ ba) | Tách qua adapter để dễ thay thế |

### 3.2. Ma trận quyết định theo Quality Attribute

| Quality Attribute | Quyết định kiến trúc | Ảnh hưởng |
|---|---|---|
| **Performance** | Redis cache, connection pooling, pagination | Phản hồi < 2.000 ms |
| **Reliability** | AI Order Service tách rời + manual fallback | Bán hàng thủ công không gián đoạn |
| **Security & Isolation** | JWT + RBAC, Tenant Context ở mọi tầng | Không rò rỉ dữ liệu chéo Tenant |
| **Compliance** | Module Accounting & Compliance, Template Manager | Tuân thủ Thông tư 88/2021/TT-BTC |
| **Maintainability** | Package-by-feature, module boundary rõ ràng | Dễ tách microservices sau này nếu cần |
| **Usability** | UI đơn giản, tiếng Việt Unicode, responsive | Phù hợp người dùng trình độ số thấp |

---

## 4. Kiến trúc phân lớp (Layered Architecture)

### 4.1. Tổng quan phân lớp

```
┌──────────────────────────────────────────────────────────────────┐
│                      PRESENTATION TIER                           │
│   Public Portal │ Owner Web/Mobile │ Employee Mobile/POS │ Admin │
├──────────────────────────────────────────────────────────────────┤
│                 API & SECURITY ENTRY LAYER                       │
│   Auth │ RBAC │ Tenant Context │ Rate Limiting │ Validation      │
├──────────────────────────────────────────────────────────────────┤
│              APPLICATION TIER (MODULAR MONOLITH)                 │
│   ┌───────────────────────────────────────────────────────┐      │
│   │ ① Controller Layer  — tiếp nhận request, validate     │      │
│   │ ② Service Layer     — business logic, transaction     │      │
│   │ ③ Repository Layer  — data access                     │      │
│   └───────────────────────────────────────────────────────┘      │
│   Cross-cutting: Audit Log │ Transaction Mgmt │ Tenant Isolation │
├─────────────────────────┬────────────────────────────────────────┤
│      AI ORDER SERVICE   │        DATA & INFRASTRUCTURE           │
│  (triển khai độc lập)   │   DB / Cache / Storage / Queue / Audit │
└─────────────────────────┴────────────────────────────────────────┘
```

### 4.2. Chi tiết từng lớp

| Lớp | Trách nhiệm |
|---|---|
| **Presentation Tier** | Giao diện Public/Owner/Employee/Admin, web + mobile responsive, tiếng Việt Unicode, real-time notification (WebSocket/Push) |
| **API & Security Entry Layer** | Xác thực token, phân quyền, xác định Tenant, kiểm tra Subscription, validate dữ liệu, rate limiting |
| **Application Tier** | Onboarding, thuê bao, sản phẩm, kho, khách hàng/công nợ, đơn hàng, kế toán, báo cáo, quản trị nền tảng |
| **AI Order Service** | Nhận input từ Messaging/Voice Channel, STT, NLP parser, matching Product/Customer (qua Application Tier API), ambiguity detection, sinh Draft Order |
| **Data & Infrastructure** | Lưu dữ liệu nghiệp vụ, cache, file, hàng đợi, audit log, backup |

### 4.3. Cấu trúc thư mục Backend (Package-by-Feature — minh hoạ, có thể thay đổi nhiều sau khi dự án hoàn thành)

```
src/
├── config/                     # Cấu hình chung (security, redis, websocket)
├── common/                     # DTO chung, exception handler, utils
├── auth/                       # Đăng nhập, JWT, RBAC, Tenant Context
├── onboarding-identity/        # Đăng ký Owner, xác minh, hồ sơ, Employee accounts
├── subscription-billing/       # Gói dịch vụ, thanh toán, entitlement
├── product-pricing/            # Sản phẩm, danh mục, đơn vị tính, giá
├── inventory/                  # Nhập kho, tồn kho, biến động kho
├── customer-debt/              # Khách hàng, lịch sử mua, công nợ
├── order-checkout/             # Đơn thủ công, Draft Order review, thanh toán
├── accounting-compliance/      # Bút toán, sổ sách, template báo cáo
├── reporting-analytics/        # Dashboard, báo cáo
├── administration/             # Quản lý Owner, giá gói, cấu hình hệ thống
├── notification/                # WebSocket/Push dispatcher
└── audit-log/                  # Ghi vết thao tác nhạy cảm

ai-order-service/                # Service triển khai độc lập
├── channel-adapter/             # Nhận input từ Zalo OA / thoại
├── stt/                         # Speech-to-Text
├── nlp-parser/                  # Trích xuất thực thể (sản phẩm, số lượng, khách hàng)
├── matching/                    # Gọi Application Tier API để match Product/Customer
├── ambiguity-detection/
└── draft-order-generator/
```

---

## 5. Thiết kế các thành phần cốt lõi (Core Components Design)

### 5.1. Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                     APPLICATION TIER (MODULAR MONOLITH)                │
│                                                                        │
│  ┌───────────┐ ┌──────────────┐ ┌───────────┐ ┌───────────────────┐    │
│  │Onboarding │ │ Subscription │ │ Product & │ │     Inventory     │    │
│  │& Identity │ │  & Billing   │ │  Pricing  │ │                   │    │
│  └───────────┘ └──────────────┘ └───────────┘ └───────────────────┘    │
│  ┌───────────┐ ┌──────────────┐ ┌───────────────────────────────┐      │
│  │Customer & │ │  Order &     │ │  Accounting, Bookkeeping &    │      │
│  │   Debt    │ │  Checkout    │ │  Compliance                   │      │
│  └───────────┘ └──────────────┘ └───────────────────────────────┘      │
│  ┌───────────────────┐ ┌────────────────────────────────────────┐      │
│  │ Reporting &       │ │  Administration                        │      │
│  │ Analytics         │ │                                        │      │
│  └───────────────────┘ └────────────────────────────────────────┘      │
│                                                                        │
│  ┌────────────────────────── SHARED SERVICES ─────────────────────┐    │
│  │  Notification Service │ Audit Log Service │ Print/Invoice Svc  │    │
│  └────────────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────┬────────────────────────────────┘
                                        │ internal API (tenant-scoped)
                                        ▼
                        ┌───────────────────────────────┐
                        │       AI ORDER SERVICE        │
                        │  Channel Adapter → STT → NLP  │
                        │  → Matching → Ambiguity       │
                        │  → Draft Order Generator      │
                        └───────────────────────────────┘
```

### 5.2. Module Auth — Luồng xác thực

```
 Client            API Entry Layer         Auth Service
   │  POST /login        │                       │
   │────────────────────►│                       │
   │                     │  Validate credentials │
   │                     │──────────────────────►│
   │                     │  ◄── user + roles ────│
   │                     │  Sinh JWT (access +   │
   │                     │  refresh token)       │
   │  ◄── tokens ────────│                       │
   │                                             │
   │  GET /orders (Bearer token)                 │
   │────────────────────►│                       │
   │                     │  Verify token, RBAC,  │
   │                     │  Tenant Context       │
   │  ◄── response ──────│                       │
```

### 5.3. Module Notification — Multi-Channel

```
┌──────────────────────────────────────────────────────────────┐
│                   NOTIFICATION SERVICE                       │
│  Event Input ──► Resolve Channel ──► Dispatch                │
│      │                  │                  │                 │
│  ┌───▼───────┐  ┌───────▼──────┐  ┌────────▼───────────┐     │
│  │ WebSocket │  │  Push (FCM/  │  │ Email/SMS (OTP,    │     │
│  │ (đơn mới, │  │  APNs)       │  │  cảnh báo tồn thấp)│     │
│  │ Draft     │  │              │  │                    │     │
│  │ Order)    │  │              │  │                    │     │
│  └───────────┘  └──────────────┘  └────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. Kiến trúc AI Order Service

### 6.1. Tổng quan tích hợp

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     AI ORDER SERVICE (triển khai độc lập)               │
│                                                                         │
│  Khách hàng ──► Zalo OA / Cuộc gọi                                      │
│                        │                                                │
│                        ▼                                                │
│              ┌───────────────────┐                                      │
│              │ Channel Adapter    │  (nhận webhook Zalo, ghi âm thoại)  │
│              └─────────┬─────────┘                                      │
│                        ▼                                                │
│              ┌───────────────────┐      ┌──────────────────────────┐    │
│              │ Speech-to-Text    │─────►│  AI/Speech Provider bên  │    │
│              │ (nếu là voice)    │      │  ngoài                   │    │
│              └─────────┬─────────┘      └──────────────────────────┘    │
│                        ▼                                                │
│              ┌───────────────────┐                                      │
│              │ NLP Parser /       │  Trích xuất: sản phẩm, số lượng,    │
│              │ Entity Extraction  │  khách hàng, ghi chú công nợ        │
│              └─────────┬─────────┘                                      │
│                        ▼                                                │
│              ┌────────────────────┐      ┌─────────────────────────┐    │
│              │ Product/Customer   │─────►│ Application Tier API    │    │
│              │ Matching           │      │ (Product, Customer –    │    │
│              │ (tenant-scoped)    │      │  KHÔNG truy cập DB      │    │
│              └─────────┬──────────┘      │  trực tiếp)             │    │
│                        ▼                 └─────────────────────────┘    │
│              ┌────────────────────┐                                     │
│              │ Ambiguity          │  Nếu không chắc chắn → đánh dấu     │
│              │ Detection +        │  cần Employee làm rõ                │
│              │ Confidence Scoring │                                     │
│              └─────────┬──────────┘                                     │
│                        ▼                                                │
│              ┌────────────────────┐                                     │
│              │ Draft Order        │──► Notification Service ──►         │
│              │ Generator          │    Employee/Owner xác nhận          │
│              └────────────────────┘                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### 6.2. Nguyên tắc thiết kế

| Nguyên tắc | Mô tả |
|---|---|
| **Human-in-the-loop** | AI chỉ tạo Draft Order; Employee/Owner phải kiểm tra, chỉnh sửa hoặc từ chối trước khi ghi nhận chính thức |
| **Manual fallback** | Khi AI/Speech Provider không khả dụng, Channel Adapter vẫn nhận tin nhắn nhưng chuyển thẳng cho Employee xử lý thủ công (không chặn luồng bán hàng) |
| **Tenant-scoped matching** | Mọi truy vấn Product/Customer để matching bắt buộc kèm `tenant_id`, gọi qua Application Tier API — không đọc thẳng cơ sở dữ liệu để tránh vi phạm ranh giới module và rò rỉ dữ liệu chéo Tenant |
| **Confidence threshold** | Draft Order có điểm tin cậy thấp phải được gắn cờ "cần làm rõ" thay vì tự động điền giá trị đoán |
| **Idempotency** | Mỗi tin nhắn/cuộc gọi đầu vào có định danh duy nhất để tránh sinh trùng Draft Order khi Channel Adapter retry |

### 6.3. Luồng xử lý AI Draft Order

```
Khách hàng (Zalo/điện thoại)
   │
   ▼
Channel Adapter nhận input
   │
   ▼
[Voice?] ── Có ──► Speech-to-Text ──► văn bản
   │No
   ▼
NLP Parser → trích xuất entity
   │
   ▼
Matching Product/Customer (qua Application Tier API, tenant-scoped)
   │
   ▼
Ambiguity Detection + Confidence Scoring
   │
   ▼
Sinh Draft Order → lưu trạng thái PENDING_REVIEW
   │
   ▼
Notification Service → Employee/Owner nhận realtime notification
   │
   ▼
Employee/Owner: Kiểm tra → Chỉnh sửa / Từ chối / Xác nhận
   │
   ▼ (Xác nhận)
Order & Checkout module xử lý như đơn thủ công (transaction đầy đủ)
```

---

## 7. Kiến trúc dữ liệu (Data Architecture)

### 7.1. Entity-Relationship Diagram (ERD) — Tổng quan

```
┌──────────────┐     ┌──────────────┐     ┌───────────────┐
│   Tenants    │─────┤    Users     │─────┤    Roles      │
│ (Hộ KD)      │ 1:N │ (Owner/Emp)  │ N:N │ (Owner/Emp/   │
│ • id (PK)    │     │ • id (PK)    │     │  Admin)       │
│ • name       │     │ • tenantId   │     └───────────────┘
│ • status     │     │ • email/pass │
│ • subscript. │     │ • role       │
└──────┬───────┘     └──────────────┘
       │ 1:N
       ▼
┌──────────────┐     ┌────────────────────┐
│  Products    │─────┤ ProductUnits       │
│              │ 1:N │ (multi-unit)       │
│ • id (PK)    │     │ • unitName         │
│ • tenantId   │     │ • conversionRate   │
│ • name/price │     └────────────────────┘
│ • category   │
└──────┬───────┘
       │ 1:N
       ▼
┌───────────────────┐     ┌─────────────────────┐
│  StockMovements   │     │  Customers          │
│  (nhập/xuất kho)  │     │  • id (PK)          │
│  • productId (FK) │     │  • tenantId         │
│  • quantity       │     │  • name/phone       │
│  • type           │     │  • debtBalance      │
└───────────────────┘     └──────────┬──────────┘
                                     │ 1:N
                                     ▼
┌───────────────────┐     ┌─────────────────────┐     ┌───────────────────┐
│  Orders           │─────┤  OrderItems         │     │  DebtPayments     │
│  • id (PK)        │ 1:N │  • orderId (FK)     │     │  • customerId(FK) │
│  • tenantId       │     │  • productId (FK)   │     │  • amount         │
│  • customerId(FK) │     │  • qty/unit/price   │     │  • paidAt         │
│  • source         │     └─────────────────────┘     └───────────────────┘
│  (counter/AI)     │
│  • status         │
└──────┬────────────┘
       │ 1:1
       ▼
┌────────────────────┐     ┌──────────────────┐
│  AccountingEntries │     │  DraftOrders     │
│  • orderId (FK)    │     │  • id (PK)       │
│  • entryType       │     │  • tenantId      │
│  • amount          │     │  • rawInput      │
│  • createdAt       │     │  • confidence    │
└────────────────────┘     │  • status        │
                           └──────────────────┘

┌───────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Subscriptions    │     │  AuditLogs       │     │  ReportTemplates │
│  • tenantId (FK)  │     │  • userId (FK)   │     │  • type          │
│  • planId (FK)    │     │  • action        │     │  • version       │
│  • status         │     │  • timestamp     │     │  • regulationRef │
└───────────────────┘     └──────────────────┘     └──────────────────┘
```

### 7.2. Redis Cache Strategy

| Key Pattern | Giá trị | TTL | Mục đích |
|---|---|---|---|
| `session:{token}` | User session | 15 phút | Giảm DB lookup |
| `tenant:{id}:products` | Danh mục sản phẩm | 10 phút | Tăng tốc tìm kiếm khi bán hàng |
| `tenant:{id}:customer:{id}` | Thông tin khách hàng + công nợ | 5 phút | Hiển thị nhanh khi tạo đơn |
| `notification:{userId}:unread` | Số thông báo chưa đọc | 1 phút | Badge realtime |
| `rate_limit:{ip}` | Đếm request | 1 phút | Rate limiting |
| `ai:draftorder:{msgId}` | Idempotency key AI | 24 giờ | Tránh sinh trùng Draft Order |

### 7.3. Chiến lược Indexing

| Bảng | Cột index | Mục đích |
|---|---|---|
| Users | tenantId, email | Login, phân quyền theo Tenant |
| Products | tenantId, category | Tìm kiếm sản phẩm khi bán hàng |
| Orders | tenantId, status, createdAt | Danh sách đơn, báo cáo doanh thu |
| Customers | tenantId, phone | Tra cứu khách hàng khi ghi công nợ |
| StockMovements | productId, createdAt | Lịch sử tồn kho |
| DraftOrders | tenantId, status | Danh sách Draft Order chờ xác nhận |

---

## 8. Kiến trúc tích hợp bên ngoài (Integration Architecture)

### 8.1. Tổng quan tích hợp

```
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Integration Hub)                   │
│                                                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌─────────────────────────┐  │
│  │ Payment      │ │ Email/SMS/   │ │ Messaging/Voice Channel │  │
│  │ Service      │ │ Push Service │ │ Adapter                 │  │
│  └──────┬───────┘ └──────┬───────┘ └───────────┬─────────────┘  │
└─────────┼────────────────┼─────────────────────┼────────────────┘
          ▼                ▼                     ▼
  ┌───────────────┐  ┌──────────────┐   ┌───────────────────────┐
  │ Payment       │  │ Email/SMS/   │   │ Zalo OA API /         │
  │ Provider/Bank │  │ Push Provider│   │ Telephony Provider    │
  └───────────────┘  └──────────────┘   └───────────┬───────────┘
                                                    ▼
                                        ┌──────────────────────┐
                                        │ AI/Speech Provider   │
                                        │ (STT + NLP model)    │
                                        └──────────────────────┘
```

### 8.2. Payment API Contract & UI Flow

Phiên bản hiện tại dùng QR chuyển khoản tĩnh cho luồng đăng ký subscription. Chưa có payment gateway độc lập, endpoint sinh QR hoặc webhook đối soát. Vì vậy, `GET /api/payments/qr/:orderId` và `POST /api/payments/confirm` chưa phải API được triển khai.

#### API contract đang triển khai

| Method | Endpoint | Mục đích | Quyền / tham số |
|---|---|---|---|
| `GET` | `/api/owner/subscription/packages` | Lấy danh sách gói và giá theo tháng/năm | Owner đã xác thực |
| `POST` | `/api/owner/subscription/select-package?packageType={packageType}&billingCycle={billingCycle}` | Chọn gói và kích hoạt subscription sau bước xác nhận trên UI | Owner đã xác thực; `packageType` là mã gói; `billingCycle` là `MONTHLY` hoặc `YEARLY` |

Frontend gọi API chọn gói trong cả hai trường hợp: gói miễn phí được kích hoạt trực tiếp; gói có phí gọi sau khi Owner bấm **Xác nhận thanh toán** trong modal. Nút này hiện là bước xác nhận phục vụ bản test, không thực hiện đối soát giao dịch ngân hàng tự động.

#### UI flow

1. Owner mở `/onboarding/package-selection`, tải danh sách gói và chọn gói cùng chu kỳ thanh toán.
2. Với gói có phí, hệ thống mở modal **Thông Báo Thanh Toán Chuyển Khoản**.
3. Modal hiển thị QR tĩnh tại `Code/Client/src/frontend/public/images/qr-code.jpg`, số tiền, VietinBank, số tài khoản, chủ tài khoản và cú pháp `{packageType}-{billingCycle}`; có nút sao chép số tài khoản và cú pháp.
4. Owner chuyển khoản bên ngoài hệ thống rồi bấm **Xác nhận thanh toán**.
5. Frontend gọi `POST /api/owner/subscription/select-package`. Khi thành công, modal hiển thị trạng thái thành công và chuyển Owner về trang tài khoản.

Luồng payment gateway và webhook có thể được bổ sung ở phiên bản sau; khi đó cần thêm mã giao dịch, kiểm tra chữ ký, idempotency và trạng thái đối soát trước khi tự động kích hoạt subscription.

### 8.3. Luồng nhận tin nhắn/cuộc gọi (Messaging/Voice Channel)

```
 Khách hàng      Zalo OA / Tổng đài     Channel Adapter       AI Order Service
    │  Nhắn tin/gọi   │                      │                       │
    │────────────────►│                      │                       │
    │                 │  Webhook / call event│                       │
    │                 │─────────────────────►│                       │
    │                 │                      │  Chuẩn hoá + gắn      │
    │                 │                      │  tenantId (theo số    │
    │                 │                      │  Zalo OA/hotline)     │
    │                 │                      │──────────────────────►│
    │                 │                      │                       │
    │                 │                      │  [AI lỗi/không khả    │
    │                 │                      │   dụng] → forward     │
    │                 │                      │  thẳng cho Employee   │
    │                 │                      │  xử lý thủ công       │
```

### 8.4. Bảng tích hợp bên ngoài

| Hệ thống ngoài | Mục đích | Ghi chú bảo mật |
|---|---|---|
| Bank / QR tĩnh | Owner chuyển khoản subscription theo thông tin hiển thị trên modal | Chưa có đối soát tự động hoặc webhook trong phiên bản hiện tại |
| Email/SMS/Push Provider | OTP đăng ký, cảnh báo tồn thấp, thông báo đơn | Rate limit gửi OTP |
| Messaging/Voice Channel (Zalo OA, tổng đài) | Nguồn input cho AI Order Service | Xác thực webhook, ánh xạ số điện thoại/OA → tenantId |
| AI/Speech Provider | STT + NLP model | Adapter hoá để thay nhà cung cấp; không lưu voice thô quá thời hạn cần thiết |

---

## 9. Kiến trúc triển khai (Deployment Architecture)

```
┌─────────────────────────────────────────────────────────────────┐
│                         HẠ TẦNG CLOUD                           │
│                                                                 │
│  ┌───────────────────────┐                                      │
│  │ Reverse Proxy / CDN   │                                      │
│  └───────────┬───────────┘                                      │
│              │                                                  │
│   ┌──────────┴───────────┐                                      │
│   │ Frontend (Web/Admin) │  ← Static hosting / CDN              │
│   └──────────┬───────────┘                                      │
│              │                                                  │
│   ┌──────────┴─────────────────┐                                │
│   │ Backend Modular Monolith   │  ← có thể scale N instances    │
│   │ (containerized)            │                                │
│   └───────┬────────────┬───────┘                                │
│           │            │                                        │
│   ┌───────┴──────┐ ┌───┴─────────────┐                          │
│   │ AI Order     │ │ Data & Infra    │                          │
│   │ Service      │ │ DB / Redis /    │                          │
│   │ (deploy riêng│ │ Queue / Storage │                          │
│   │ scale riêng) │ │                 │                          │
│   └──────┬───────┘ └─────────────────┘                          │
│          │                                                      │
│   ┌──────┴──────────────────────────┐                           │
│   │ External: Messaging/Voice       │                           │
│   │ Channel, AI/Speech Provider     │                           │
│   └─────────────────────────────────┘                           │
└─────────────────────────────────────────────────────────────────┘
```

### 9.1. Môi trường triển khai

| Môi trường | Mục đích |
|---|---|
| **Development** | Phát triển cá nhân, mock AI/Payment Provider |
| **Testing/QA** | Kiểm thử chức năng, tích hợp với sandbox của Zalo/Payment |
| **Staging** | UAT, kiểm thử hiệu năng gần môi trường thật |
| **Production** | Vận hành thực tế, có backup và giám sát |

---

## 10. Mô hình bảo mật (Security Architecture)

### 10.1. Các lớp bảo mật

| Lớp | Biện pháp |
|---|---|
| **Network** | HTTPS/TLS cho toàn bộ traffic, rate limiting, firewall |
| **Application** | JWT + RBAC, Tenant Context bắt buộc trong mọi request nghiệp vụ, chống OWASP Top 10 (SQL Injection, XSS, CSRF, Brute Force) |
| **Data** | Mã hoá dữ liệu nhạy cảm (công nợ, thông tin khách hàng), audit log không thể chỉnh sửa cho thao tác nhạy cảm |
| **AI** | Human-in-the-loop bắt buộc trước khi ghi nhận đơn; giới hạn thời gian lưu dữ liệu voice thô; kiểm soát confidence threshold |

### 10.2. Ma trận phân quyền RBAC (rút gọn)

| Quyền | Employee | Owner | Manager | Admin |
|---|:---:|:---:|:---:|:---:|
| Tạo đơn tại quầy | ✔ | ✔ | ✔ | ✔ |
| Xác nhận Draft Order AI | ✔ | ✔ | ✔ | ✔ |
| Ghi công nợ | ✔ | ✔ | ✔ | ✔ |
| Quản lý sản phẩm/kho | — | ✔ | ✔ | ✔ |
| Quản lý khách hàng | — | ✔ | ✔ | ✔ |
| Quản lý tài khoản Employee | — | ✔ | ✔ | ✔ |
| Xem báo cáo cửa hàng | — | ✔ | ✔ | ✔ |
| Quản lý tài khoản Owner | — | — | ✔ | ✔ |
| Xem phân tích toàn nền tảng | — | — | ✔ | ✔ |
| Xử lý phản hồi Owner/Employee | — | — | ✔ | ✔ |
| Theo dõi trạng thái thuê bao | — | — | ✔ | ✔ |
| Cấu hình giá gói Subscription | — | — | — | ✔ |
| Cập nhật template báo cáo kế toán | — | — | — | ✔ |
| Cấu hình hệ thống & AI | — | — | — | ✔ |
| Seed/Khởi tạo dữ liệu hệ thống | — | — | — | ✔ |
| Quản lý tài khoản Manager | — | — | — | ✔ |

### 10.3. Ràng buộc kiến trúc bổ sung (từ rà soát)

1. **Tenant isolation** áp dụng cả cho AI Order Service khi matching Product/Customer.
2. **Human-in-the-loop AI**: Draft Order không tự động trở thành Order chính thức.
3. **Manual fallback**: hệ thống bán hàng thủ công hoạt động độc lập với tình trạng AI/Messaging Channel.
4. **Transactional consistency**: Order, tồn kho, thanh toán/công nợ, bút toán commit/rollback cùng nhau.
5. **Auditability**: mọi thay đổi tài khoản Employee, cấu hình hệ thống, template báo cáo đều ghi Audit Log.

---

## 11. Bảo vệ dữ liệu cá nhân (Data Privacy & Personal Data Protection)

### 11.1. Phạm vi dữ liệu cá nhân được xử lý

| Chủ thể dữ liệu | Loại dữ liệu | Nơi lưu trữ |
|---|---|---|
| Khách hàng (của hộ kinh doanh) | Họ tên, số điện thoại, địa chỉ, lịch sử mua hàng, số dư công nợ | Module Customer & Debt (MySQL/PostgreSQL) |
| Khách hàng (khi đặt hàng qua AI) | Nội dung tin nhắn Zalo, ghi âm giọng nói cuộc gọi | AI Order Service (tạm thời, trong quá trình xử lý) |
| Employee / Owner | Họ tên, số điện thoại, email, tài khoản đăng nhập | Module Onboarding & Identity |
| Owner (đăng ký hộ kinh doanh) | Thông tin định danh hộ kinh doanh, thông tin thanh toán subscription | Subscription & Billing, Payment Provider |

### 11.2. Phân loại theo Nghị định 13/2023/NĐ-CP

Theo Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân, hệ thống cần phân biệt hai nhóm:

| Nhóm | Dữ liệu trong hệ thống | Áp dụng biện pháp |
|---|---|---|
| **Dữ liệu cá nhân cơ bản** | Họ tên, số điện thoại, địa chỉ khách hàng; thông tin tài khoản Employee/Owner | Biện pháp bảo mật thông thường (mã hoá khi lưu trữ/truyền tải, kiểm soát truy cập theo RBAC) |
| **Dữ liệu cá nhân nhạy cảm** | Giọng nói khách hàng (thuộc "thuộc tính vật lý, sinh trắc học riêng của cá nhân" theo Điều 2 NĐ 13/2023) khi dùng tính năng AI qua thoại | Biện pháp bảo mật tăng cường: giới hạn thời hạn lưu, chỉ dùng cho mục đích nhận diện nội dung, không dùng cho mục đích khác |

> **Lưu ý:** Dữ liệu công nợ/tài chính của khách hàng tại đây là dữ liệu giao dịch nội bộ giữa hộ kinh doanh và khách hàng, **không** thuộc nhóm "thông tin khách hàng tổ chức tín dụng" được liệt kê là nhạy cảm trong Nghị định 13/2023/NĐ-CP (nhóm đó áp dụng cho ngân hàng/tổ chức tín dụng). Tuy nhiên, do tính chất nhạy cảm về tài chính cá nhân trong thực tế, kiến trúc vẫn xử lý dữ liệu công nợ với mức kiểm soát truy cập tương đương dữ liệu nhạy cảm (xem mục 11.5).

### 11.3. Nguyên tắc xử lý dữ liệu

1. **Thu thập có mục đích rõ ràng**: chỉ thu thập dữ liệu cần thiết cho việc tạo đơn, ghi công nợ, hoặc xử lý AI Draft Order.
2. **Thông báo và đồng ý (consent)**: vì phần lớn khách hàng của hộ kinh doanh không có tài khoản trong hệ thống, việc "đồng ý" được thực hiện tại điểm chạm:
   - Tại quầy: Employee thông báo ngắn gọn khi ghi nhận số điện thoại/công nợ (ví dụ hiển thị trên hoá đơn/màn hình POS).
   - Qua Zalo OA: hiển thị thông báo thu thập dữ liệu khi khách hàng nhắn tin lần đầu (theo cơ chế opt-in của Zalo OA).
3. **Giới hạn lưu trữ (storage limitation)**: dữ liệu chỉ lưu trong thời gian cần thiết cho mục đích nghiệp vụ hoặc theo yêu cầu pháp lý về kế toán (xem 11.4).
4. **Ẩn danh hoá khi có thể**: dữ liệu dùng cho báo cáo/phân tích ở cấp Admin phải được tổng hợp/ẩn danh, không hiển thị thông tin định danh khách hàng của từng hộ kinh doanh.

### 11.4. Xử lý dữ liệu giọng nói (Voice Data)

| Giai đoạn | Chính sách |
|---|---|
| **Thu âm & truyền tải** | Mã hoá trong quá trình truyền tới AI/Speech Provider (TLS); không lưu file âm thanh thô ở Channel Adapter lâu hơn thời gian xử lý |
| **Xử lý STT** | File âm thanh thô chỉ tồn tại tạm thời (bộ nhớ đệm) trong quá trình chuyển đổi giọng nói → văn bản |
| **Lưu trữ sau xử lý** | Không lưu file âm thanh thô sau khi đã có văn bản (transcript); chỉ giữ lại transcript văn bản gắn với Draft Order để phục vụ đối chiếu khi có tranh chấp |
| **Thời hạn lưu transcript** | Theo thời hạn lưu của Order/Draft Order liên quan (xem 11.5); không lưu vượt quá thời gian cần thiết cho mục đích đối soát |
| **Bên thứ ba (AI/Speech Provider)** | Nếu dùng nhà cung cấp AI/STT bên ngoài, cần có thoả thuận xử lý dữ liệu (Data Processing Agreement) quy định: không dùng dữ liệu khách hàng để huấn luyện mô hình cho bên thứ ba khác, xoá dữ liệu phía nhà cung cấp sau khi trả kết quả |

### 11.5. Thời hạn lưu trữ dữ liệu (Data Retention)

| Loại dữ liệu | Thời hạn lưu | Ghi chú |
|---|---|---|
| Ghi âm giọng nói thô | Không lưu sau khi có transcript (xử lý tức thời, tối đa vài giờ nếu cần retry) | Ưu tiên xử lý đồng bộ, tránh lưu trữ lâu dài |
| Transcript AI + Draft Order đã xác nhận | Theo thời hạn lưu chứng từ kế toán (Thông tư 88/2021/TT-BTC) | Gắn với Order chính thức |
| Draft Order bị từ chối/không xác nhận | Tối đa 30–90 ngày rồi xoá hoặc ẩn danh | Không cần giữ lâu vì không phát sinh giao dịch |
| Thông tin công nợ khách hàng | Lưu trong suốt thời gian còn phát sinh giao dịch; xoá/ẩn danh theo yêu cầu khi khách hàng ngừng giao dịch và không còn nghĩa vụ pháp lý phải lưu | Cân bằng với nghĩa vụ lưu chứng từ kế toán |
| Sổ sách kế toán, bút toán (Accounting Entries) | Theo thời hạn lưu trữ chứng từ kế toán quy định pháp luật hiện hành | Không được xoá theo yêu cầu cá nhân trong thời hạn này |

### 11.6. Quyền của chủ thể dữ liệu (khách hàng)

| Quyền | Cách hệ thống hỗ trợ |
|---|---|
| **Quyền được biết** | Thông báo thu thập dữ liệu tại điểm chạm (quầy, Zalo OA) |
| **Quyền rút lại sự đồng ý** | Khách hàng có thể yêu cầu Owner ngừng nhận đơn qua AI/Zalo cho số điện thoại của mình |
| **Quyền xoá dữ liệu** | Owner có thể xoá/ẩn danh hồ sơ khách hàng trong module Customer & Debt nếu không còn nghĩa vụ lưu trữ pháp lý (ví dụ không còn công nợ chưa tất toán, không nằm trong chứng từ kế toán còn hiệu lực); nếu còn ràng buộc kế toán, hệ thống ẩn danh hoá thông tin định danh (tên, SĐT) nhưng giữ lại số liệu giao dịch phục vụ báo cáo |
| **Quyền khiếu nại** | Owner/Admin cung cấp kênh tiếp nhận yêu cầu liên quan đến dữ liệu cá nhân (qua Administration module) |

> Đây là điểm cần lưu ý trong Detailed Design: chức năng "xoá khách hàng" trong Customer & Debt module phải phân biệt **xoá cứng (hard delete)** và **ẩn danh hoá (anonymize)**, vì nghĩa vụ lưu chứng từ kế toán theo Thông tư 88/2021/TT-BTC có thể mâu thuẫn với quyền xoá dữ liệu của khách hàng.

### 11.7. Kiểm soát truy cập dữ liệu công nợ và dữ liệu nhạy cảm

| Vai trò | Phạm vi được xem dữ liệu công nợ/khách hàng |
|---|---|
| **Employee** | Chỉ xem dữ liệu khách hàng trong phạm vi thao tác tạo đơn/ghi nợ tại Tenant mình làm việc; không xuất được toàn bộ danh sách công nợ |
| **Owner** | Xem đầy đủ dữ liệu khách hàng/công nợ trong phạm vi Tenant của mình |
| **Administrator** | Không truy cập trực tiếp dữ liệu định danh khách hàng hay chi tiết công nợ của từng hộ kinh doanh; chỉ xem số liệu tổng hợp/ẩn danh ở mức nền tảng (ví dụ: tổng công nợ toàn hệ thống, không phải danh sách từng khách hàng). Trường hợp cần hỗ trợ kỹ thuật phải truy cập dữ liệu cụ thể, thao tác này bắt buộc ghi Audit Log và giới hạn thời gian truy cập |
| **AI Order Service** | Chỉ đọc dữ liệu Product/Customer cần thiết để matching (qua Application Tier API, tenant-scoped), không lưu bản sao dữ liệu khách hàng ngoài phạm vi xử lý tức thời |

### 11.8. Ứng phó sự cố lộ dữ liệu (Data Breach Response)

- Ghi nhận và phân loại mức độ sự cố (rò rỉ dữ liệu cơ bản vs dữ liệu nhạy cảm như giọng nói).
- Thông báo cho Owner bị ảnh hưởng và, nếu thuộc trường hợp bắt buộc theo Nghị định 13/2023/NĐ-CP, thông báo cơ quan chức năng liên quan trong thời hạn theo quy định.
- Cơ chế kỹ thuật hỗ trợ: Audit Log giúp xác định phạm vi dữ liệu bị ảnh hưởng; khả năng thu hồi/vô hiệu hoá token khi nghi ngờ truy cập trái phép.

### 11.9. Tổng hợp biện pháp kỹ thuật liên quan

| Biện pháp | Thành phần kiến trúc áp dụng |
|---|---|
| Mã hoá khi truyền (TLS) | API & Security Entry Layer, Channel Adapter → AI/Speech Provider |
| Mã hoá khi lưu trữ dữ liệu nhạy cảm | Data & Infrastructure (mã hoá cột dữ liệu công nợ, thông tin định danh) |
| Không lưu voice thô sau xử lý | AI Order Service (Channel Adapter, STT) |
| Ẩn danh hoá khi xoá có ràng buộc kế toán | Customer & Debt module |
| Giới hạn truy cập theo vai trò | RBAC (mục 10.2), Tenant Isolation |
| Audit Log cho truy cập hỗ trợ kỹ thuật của Admin | Audit Log Service |

---

## 12. Đặc tả hiệu năng và khả năng mở rộng (Performance & Scalability)

| Metric | Target |
|---|---|
| API Response Time (thao tác cốt lõi) | < 2.000 ms |
| Draft Order generation (từ input đến notification) | Càng nhanh càng tốt, có timeout + fallback nếu AI Provider chậm |
| Concurrent users | Hỗ trợ nhiều Tenant, nhiều người dùng đồng thời trong giờ cao điểm bán hàng |
| Uptime bán hàng thủ công | Không phụ thuộc uptime của AI/Messaging Provider |

**Chiến lược mở rộng:** scale ngang Backend Modular Monolith theo tải; scale AI Order Service độc lập (vì tải AI có pattern khác tải bán hàng thủ công); dùng Redis cache cho danh mục sản phẩm/khách hàng để giảm tải DB khi nhiều Employee thao tác đồng thời trong giờ cao điểm.

---

## 13. Luồng nghiệp vụ chính (Key Business Flows)

### 13.1. Owner onboarding và kích hoạt dịch vụ

```
Owner → Public Portal → Đăng ký → Xác minh Email/SĐT → Khai báo hộ kinh doanh
   → Chọn gói → Thanh toán → Kích hoạt Subscription → Owner Dashboard
```

### 13.2. AI Draft Order (đầy đủ, có kênh nhận input)

```
Khách hàng (Zalo/điện thoại) → Channel Adapter → [STT nếu voice] → NLP Parser
   → Matching (qua Application Tier API, tenant-scoped) → Ambiguity Detection
   → Draft Order → Notification Service → Employee/Owner kiểm tra
   → Chỉnh sửa/Từ chối/Xác nhận → Order & Checkout xử lý như đơn thủ công
```

### 13.3. Checkout transaction

```
Xác nhận đơn → Kiểm tra giá và tồn kho → BEGIN TRANSACTION
   ├── Lưu Order và Order Items
   ├── Trừ tồn kho
   ├── Ghi Payment hoặc Customer Debt
   ├── Tạo Accounting Entries
   └── Ghi Audit Log
   ├── Có lỗi → ROLLBACK → Thông báo lỗi
   └── Thành công → COMMIT → Sinh hoá đơn (in nếu có máy in, hoặc xuất ảnh/PDF gửi Zalo)
```

### 13.4. Sơ đồ trạng thái đơn hàng

```
PENDING (thủ công hoặc AI Draft) → CONFIRMED → (thanh toán đủ | ghi nợ)
   → COMPLETED
   │
   └──► REJECTED/CANCELLED (nếu Employee từ chối Draft Order hoặc huỷ đơn)
```

---

## 14. Chiến lược kiểm thử kiến trúc (Architecture Testing Strategy)

| Loại kiểm thử | Mục tiêu | Phạm vi |
|---|---|---|
| **Unit Testing** | Kiểm thử từng service/method | Service layer của từng module |
| **Integration Testing** | Kiểm thử tương tác Controller–Service–Repository | Application Tier |
| **API Testing** | Kiểm thử REST endpoints | Toàn bộ API |
| **E2E Testing** | Luồng nghiệp vụ đầu cuối | Đăng ký → bán hàng → AI Draft Order → báo cáo |
| **Performance Testing** | Đáp ứng < 2.000 ms, nhiều Tenant đồng thời | Order & Checkout, Product search |
| **Security Testing** | RBAC, Tenant isolation, OWASP Top 10 | Toàn hệ thống |
| **AI Accuracy Testing** | Độ chính xác matching, tỉ lệ Draft Order cần chỉnh sửa | AI Order Service |
| **Fallback Testing** | Xác nhận bán hàng thủ công hoạt động khi AI/Channel lỗi | AI Order Service, Channel Adapter |

---

## 15. Phụ lục (Appendices)

### 15.1. Bảng thuật ngữ (Glossary)

| Thuật ngữ | Định nghĩa |
|---|---|
| **Tenant** | Một hộ kinh doanh, đơn vị cô lập dữ liệu trong hệ thống multi-tenant |
| **Modular Monolith** | Kiến trúc backend một khối nhưng tổ chức module rõ ràng theo domain |
| **Draft Order** | Đơn hàng do AI tạo tự động, chưa được người dùng xác nhận |
| **Human-in-the-loop** | Nguyên tắc luôn có người xác nhận trước khi kết quả AI có hiệu lực |
| **Channel Adapter** | Thành phần chuẩn hoá input từ các kênh (Zalo, thoại) trước khi vào AI Service |
| **RBAC** | Phân quyền theo vai trò (Employee/Owner/Administrator) |

### 15.2. Ma trận truy xuất (Component → Yêu cầu chức năng)

| Component | Yêu cầu chức năng liên quan |
|---|---|
| Onboarding & Identity | Login, quản lý tài khoản Employee, đăng ký Owner |
| Order & Checkout | Tạo đơn tại quầy, in hoá đơn, xác nhận Draft Order |
| Customer & Debt | Ghi công nợ, quản lý khách hàng |
| Inventory | Quản lý kho, cảnh báo tồn thấp |
| Product & Pricing | Quản lý danh mục, nhiều đơn vị tính |
| Accounting & Compliance | Tự động bookkeeping, báo cáo theo Thông tư 88/2021/TT-BTC |
| Reporting & Analytics | Báo cáo doanh thu, best-sellers, công nợ |
| Administration | Quản lý Owner, giá gói Subscription, template báo cáo |
| AI Order Service + Channel Adapter | Chuyển ngôn ngữ tự nhiên thành Draft Order, nhận đơn phone/Zalo |
| Notification Service | Thông báo realtime cho đơn mới/Draft Order |

### 15.3. Rủi ro kiến trúc và giải pháp

| # | Rủi ro | Mức độ | Giải pháp |
|---|---|---|---|
| R1 | AI/Speech Provider downtime | Trung bình | Manual fallback, Channel Adapter chuyển thẳng cho Employee |
| R2 | Nhân viên/chủ hộ không có máy in | Trung bình | Hoá đơn dạng ảnh/PDF gửi qua Zalo thay thế in giấy |
| R3 | Rò rỉ dữ liệu chéo Tenant qua AI matching | Cao | Bắt buộc tenant_id trong mọi lời gọi matching, không truy cập DB trực tiếp |
| R4 | Quá tải Backend giờ cao điểm bán hàng | Trung bình | Redis cache danh mục sản phẩm, horizontal scaling |
| R5 | Webhook Zalo/Payment giả mạo | Cao | Xác thực chữ ký (signature) trên mọi webhook |

### 15.4. Lịch sử phiên bản tài liệu

| Phiên bản | Ngày | Mô tả thay đổi |
|---|---|---|
| 1.0 | 26/07/2026 | Phiên bản đầu tiên, biên soạn theo format Architecture Design Document, bổ sung Messaging/Voice Channel, tách Notification Service, làm rõ ranh giới truy cập dữ liệu của AI Order Service |

---

> **Ghi chú cuối:** Tài liệu này được xây dựng dựa trên User Requirement gốc và bản kiến trúc tổng quan trước đó, đồng thời bổ sung các điểm còn thiếu đã được rà soát (kênh nhận đơn Zalo/điện thoại, ranh giới truy cập dữ liệu của AI Order Service, vị trí của Notification Service). Kiến trúc không khoá vào công nghệ cụ thể; các ví dụ công nghệ ở mục 3.1 (ADR-007) chỉ mang tính minh hoạ.
