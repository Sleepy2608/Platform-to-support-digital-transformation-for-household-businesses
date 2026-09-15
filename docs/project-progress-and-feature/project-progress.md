# Project Progress & Feature Gap Analysis

## 0. Mục lục

1. [Tổng quan](#1-tổng-quan)
2. [EPIC-01 — Project Foundation & System Design](#2-epic-01--project-foundation--system-design)
3. [EPIC-02 — Public Portal & Owner Onboarding](#3-epic-02--public-portal--owner-onboarding)
4. [EPIC-03 — Authentication, User Management & Security](#4-epic-03--authentication-user-management--security)
5. [EPIC-04 — Subscription, Payment & Service Invoice](#5-epic-04--subscription-payment--service-invoice)
6. [EPIC-05 — Product Catalog & Pricing](#6-epic-05--product-catalog--pricing)
7. [EPIC-06 — Inventory Management](#7-epic-06--inventory-management)
8. [EPIC-07 — Store Customer & Debt Management](#8-epic-07--store-customer--debt-management)
9. [EPIC-08 — At-counter Sales & Sales Invoice](#9-epic-08--at-counter-sales--sales-invoice)
10. [EPIC-09 — AI Draft Order & Realtime Notification](#10-epic-09--ai-draft-order--realtime-notification)
11. [EPIC-10 — Automatic Bookkeeping & Compliance](#11-epic-10--automatic-bookkeeping--compliance)
12. [EPIC-11 — Reports & Analytics](#12-epic-11--reports--analytics)
13. [EPIC-12 — Administrator Management](#13-epic-12--administrator-management)
14. [EPIC-13 — Testing, Deployment & Documentation](#14-epic-13--testing-deployment--documentation)
15. [Tổng hợp theo Epic](#15-tổng-hợp-theo-epic)
16. [Những điểm nên kiểm thử thêm](#16-những-điểm-nên-kiểm-thử-thêm)
17. [Kết luận](#17-kết-luận)

## 1. Tổng quan

- Tài liệu này đối chiếu **đề tài "Platform to support digital transformation for household businesses"** với toàn bộ Epic và các Work/Issue đang thể hiện trên Jira.

- Link để theo dõi [Jira](https://java-project-platform-for-household-business.atlassian.net/jira/software/projects/SCRUM/summary)

### Trạng thái Epic hiện tại

| Epic | Tên Epic | Jira Status | Đánh giá |
|---|---|---|---|
| EPIC-01 | Project Foundation & System Design | ✅ Done | Hoàn thành |
| EPIC-02 | Public Portal & Owner Onboarding | ✅ Done | Hoàn thành |
| EPIC-03 | Authentication, User Management & Security | ✅ Done | Hoàn thành |
| EPIC-04 | Subscription, Payment & Service Invoice | ✅ Done | Hoàn thành |
| EPIC-05 | Product Catalog & Pricing | ✅ Done | Hoàn thành |
| EPIC-06 | Inventory Management | ✅ Done | Hoàn thành |
| EPIC-07 | Store Customer & Debt Management | ✅ Done | Hoàn thành |
| EPIC-08 | At-counter Sales & Sales Invoice | ✅ Done | Hoàn thành |
| EPIC-09 | AI Draft Order & Realtime Notification | ✅ Done | Epic Done, nhưng một số child issue vẫn Testing |
| EPIC-10 | Automatic Bookkeeping & Compliance | ✅ Done | Hoàn thành ở mức Epic, report workflow còn Testing |
| EPIC-11 | Reports & Analytics | ✅ Done | Hoàn thành ở mức Epic |
| EPIC-12 | Administrator Management | ✅ Done | Hoàn thành |
| EPIC-13 | Testing, Deployment & Documentation | ✅ Done | Hoàn thành |

---

# 2. EPIC-01 — Project Foundation & System Design

### Jira Status: ✅ Done

### Các công việc đã hoàn thành

- [x] **HBDT-6** — Scope & Business Workflows
- [x] **HBDT-17** — Software Requirement Specification
- [x] **HBDT-22** — Architecture Design
- [x] **HBDT-23** — Github Repository
- [x] **HBDT-30** — UI Design System
- [x] **HBDT-41** — Project Skeleton
- [x] **HBDT-100** — User Requirement
- [x] **HBDT-102** — Make Use Case
- [x] **HBDT-103** — Make ERD
- [x] **HBDT-105** — Environment and CI/CD
- [x] **HBDT-106** — Database Management
- [x] **HBDT-116** — Debug Database and Backend
- [x] **HBDT-119** — Chuyển database sang Entity và sử dụng seed...
- [x] **HBDT-126** — Compliance Update
- [ ] **HBDT-104 — UML Diagram** → `To Do`

### Đánh giá

Phần nền tảng dự án, requirement, architecture, database và UI foundation đã hoàn thành.

### Thời gian thực hiện
- Ngày bắt đầu: 22/07/2026
- Ngày hoàn thành: 29/07/2026

---

# 3. EPIC-02 — Public Portal & Owner Onboarding

### Jira Status: ✅ Done

### Các công việc đã hoàn thành

- [x] **HBDT-8** — Public Landing Page
- [x] **HBDT-9** — Owner Self-registration
- [x] **HBDT-19** — Business Profile Onboarding
- [x] **HBDT-18** — Account Verification
- [x] **HBDT-21** — Terms & Privacy Consent
- [x] **HBDT-12** — Package Selection & Activation

### Đánh giá

Đã đáp ứng luồng onboarding cơ bản:

```text
Public Landing Page
        ↓
Owner Registration
        ↓
Account Verification
        ↓
Business Profile
        ↓
Terms & Privacy
        ↓
Package Selection
```

**Trạng thái:** ✅ Đủ theo scope hiện tại.

### Thời gian thực hiện
- Ngày bắt đầu: 22/07/2026
- Ngày hoàn thành: 06/08/2026

---

# 4. EPIC-03 — Authentication, User Management & Security

### Jira Status: ✅ Done

### Authentication

- [x] **HBDT-11** — Login & Token Authentication
- [x] **HBDT-132** — Fix refresh token JWT

### Owner Management

- [x] **HBDT-109** — Owner Account Management
- [x] **HBDT-15** — Owner Profile Management
- [x] **HBDT-78** — Owner Account Management

### Employee Management

- [x] **HBDT-14** — Employee Account Management
- [x] **HBDT-114** — Employee Profile Management
- [x] **HBDT-112** — Phân quyền cho employee theo tài khoản Owner

### Admin / User Management

- [x] **HBDT-110** — Admin Account Management
- [x] **HBDT-115** — Admin Profile Management
- [x] **HBDT-130** — Admin's page

### Security

- [x] **HBDT-113** — RBAC
- [x] **HBDT-125** — Restruct RBAC
- [x] **HBDT-117** — Security Baseline
- [x] **HBDT-13** — Tenant Isolation
- [x] **HBDT-16** — Audit Log
- [x] **HBDT-89** — Security Testing

### Đánh giá

Epic này đã bao phủ khá đầy đủ:

```text
Authentication
+ RBAC
+ Owner
+ Employee
+ Admin
+ Tenant Isolation
+ Audit Log
+ Security Testing
```

**Trạng thái:** ✅ Đủ.

### Thời gian thực hiện
- Ngày bắt đầu: 22/07/2026
- Ngày hoàn thành: 10/08/2026

---

# 5. EPIC-04 — Subscription, Payment & Service Invoice

### Jira Status: ✅ Done

### Subscription

- [x] **HBDT-26** — Subscription Plan CRUD
- [x] **HBDT-28** — Subscription Lifecycle
- [x] **HBDT-31** — Upgrade, Downgrade & Renewal
- [x] **HBDT-33** — Payment Processing & Status
- [x] **HBDT-38** — Subscription & Invoice History
- [x] **HBDT-40** — Feature Entitlement
- [x] **HBDT-79** — Subscription Pricing Management
- [x] **HBDT-120** — Design Subscription Status & State Transition
- [x] **HBDT-121** — Implement Subscription Database & Entity
- [x] **HBDT-122** — Implement Subscription Service / API / Expiration
- [x] **HBDT-123** — Implement Subscription-based Access Control
- [x] **HBDT-124** — Implement Subscription UI
- [x] **HBDT-127** — Adjust upgrade and downgrade feature

### Service Invoice

- [x] **HBDT-36** — Service Invoice Generation

### Đánh giá

Đã có gần như đầy đủ vòng đời:

```text
Plan
 ↓
Selection
 ↓
Activation
 ↓
Payment
 ↓
Subscription State
 ↓
Expiration
 ↓
Upgrade / Downgrade / Renewal
 ↓
Invoice / History
 ↓
Feature Entitlement
```

**Trạng thái:** ✅ Đủ.

### Thời gian thực hiện
- Ngày bắt đầu: 12/08/2026
- Ngày hoàn thành: 27/08/2026

---

# 6. EPIC-05 — Product Catalog & Pricing

### Jira Status: ✅ Done

### Đã hoàn thành

- [x] **HBDT-25** — Product & Category CRUD
- [x] **HBDT-27** — Product Image Management
- [x] **HBDT-29** — Multiple Units of Measure
- [x] **HBDT-32** — Product Pricing Rules
- [x] **HBDT-34** — Instant Product Search
- [x] **HBDT-35** — Product Import Template
- [x] **HBDT-107** — Check package upgrade / feature limitation
- [x] **HBDT-108** — Update UI and notification for subscription changes
- [x] **HBDT-129** — Seed Data

### Đánh giá

Đáp ứng yêu cầu Owner:

- Quản lý sản phẩm
- Category
- Hình ảnh
- Giá
- Nhiều đơn vị tính
- Pricing rules
- Search
- Import data

**Trạng thái:** ✅ Đủ.

### Thời gian thực hiện
- Ngày bắt đầu: 12/08/2026
- Ngày hoàn thành: 19/08/2026

---

# 7. EPIC-06 — Inventory Management

### Jira Status: ✅ Done

### Đã hoàn thành

- [x] **HBDT-39** — Stock Import
- [x] **HBDT-42** — Current Stock Balance
- [x] **HBDT-43** — Automatic Stock Deduction
- [x] **HBDT-48** — Inventory History & Adjustment
- [x] **HBDT-52** — Low-stock Alert
- [x] **HBDT-63** — Automatic Inventory Bookkeeping

### Đánh giá

Luồng chính:

```text
Stock Import
    ↓
Current Stock
    ↓
Order Confirmed
    ↓
Automatic Stock Deduction
    ↓
Inventory History
    ↓
Low-stock Alert
    ↓
Inventory Bookkeeping
```

**Trạng thái:** ✅ Đủ.

### Thời gian thực hiện
- Ngày bắt đầu: 19/08/2026
- Ngày hoàn thành: 30/08/2026

---

# 8. EPIC-07 — Store Customer & Debt Management

### Jira Status: ✅ Done

### Customer

- [x] **HBDT-47** — Customer CRUD
- [x] **HBDT-49** — Customer Purchase History

### Debt

- [x] **HBDT-51** — Record Debt at Checkout
- [x] **HBDT-54** — Debt Payment
- [x] **HBDT-64** — Debt History & Validation
- [x] **HBDT-66** — Automatic Debt Bookkeeping

### Reports liên quan

- [x] **HBDT-76** — Debt & Business Operations Reports
- [x] **HBDT-90** — Debt & Business Operations Reports

### Đánh giá

Đã đáp ứng:

```text
Customer
 ↓
Purchase History
 ↓
Credit Sale
 ↓
Outstanding Debt
 ↓
Debt Payment
 ↓
Debt History
 ↓
Automatic Bookkeeping
```

**Trạng thái:** ✅ Đủ.

### Thời gian thực hiện
- Ngày bắt đầu: 19/08/2026
- Ngày hoàn thành: 31/08/2026

---

# 9. EPIC-08 — At-counter Sales & Sales Invoice

### Jira Status: ✅ Done

### Đã hoàn thành

- [x] **HBDT-46** — At-counter Order API
- [x] **HBDT-53** — Cart, Pricing & Customer Assignment
- [x] **HBDT-57** — Confirm & Cancel Order
- [x] **HBDT-61** — Order History
- [x] **HBDT-62** — Print & PDF Sales Invoice
- [x] **HBDT-50** — Fast Sales UI

### Đánh giá

Các chức năng bán hàng tại quầy và hóa đơn bán hàng đã được **hoàn thành đầy đủ** theo phạm vi của EPIC-08.

Hệ thống đáp ứng các yêu cầu chính của đề tài về:

- Tạo đơn hàng nhanh tại quầy.
- Tìm kiếm sản phẩm và quản lý giỏ hàng.
- Gán khách hàng và ghi nhận công nợ.
- Xác nhận / hủy đơn hàng.
- Lưu trữ và tra cứu lịch sử đơn hàng.
- Xuất và in Sales Invoice.
- Cung cấp giao diện Fast Sales cho Owner / Employee.

**Trạng thái:** ✅ Đủ

### Thời gian thực hiện
- Ngày bắt đầu: 27/08/2026
- Ngày hoàn thành: 07/09/2026

---

# 10. EPIC-09 — AI Draft Order & Realtime Notification

### Jira Status: ✅ Done

Đây là Epic quan trọng của đề tài, tập trung vào việc ứng dụng AI để hỗ trợ nhân viên tạo đơn hàng từ yêu cầu tự nhiên của khách hàng và gửi thông báo theo thời gian thực.

### AI Pipeline

- [x] **HBDT-58** — AI Text Input
- [x] **HBDT-65** — Order Parser
- [x] **HBDT-67** — Product & Customer Matching
- [x] **HBDT-70** — Ambiguity Detection 
- [x] **HBDT-73** — Draft Order Generation
- [x] **HBDT-80** — Draft Order Review UI 
- [x] **HBDT-85** — AI Fallback & Logging
- [x] **HBDT-87** — AI Accuracy Testing
- [x] **HBDT-91** — System & AI Configuration

### Realtime Notification

- [x] **HBDT-83** — Realtime Notification

Chức năng Realtime Notification đã được hoàn thành, cho phép hệ thống gửi thông báo và cập nhật trạng thái xử lý đơn hàng theo thời gian thực.

### Documentation

- [x] **HBDT-136** — AI docs (pipeline, guide, prompt)

Tài liệu liên quan đến AI pipeline, hướng dẫn sử dụng và prompt đã được hoàn thiện.

### Voice

- [ ] **HBDT-60** — Voice-to-text → `To Do`

Đây là tính năng duy nhất chưa được hoàn thành trong EPIC-09.

### Luồng mục tiêu

```text
Text / Voice
    ↓
AI Processing
    ↓
Order Parser
    ↓
Product Matching
    ↓
Customer Matching
    ↓
Ambiguity Detection
    ↓
Draft Order
    ↓
Realtime Notification
    ↓
Employee Review
    ↓
Edit / Confirm / Reject
    ↓
Normal Order
    ↓
Inventory + Debt + Sales + Bookkeeping
```

**Trạng thái:** ✅ Đủ về chức năng chính, nhưng cần hoàn thiện Voice-to-text.

### Thời gian thực hiện
- Ngày bắt đầu: 20/08/2026
- Ngày hoàn thành: 15/09/2026

---

# 11. EPIC-10 — Automatic Bookkeeping & Compliance

### Jira Status: ✅ Done

### Accounting Core

- [x] **HBDT-56** — Accounting Transaction Model
- [x] **HBDT-59** — Automatic Sales Bookkeeping
- [x] **HBDT-63** — Automatic Inventory Bookkeeping
- [x] **HBDT-66** — Automatic Debt Bookkeeping

### Compliance / Financial Templates

- [x] **HBDT-93** — Financial Template Management
- [x] **HBDT-126** — Compliance Update

### Report workflow còn Testing

- [x] **HBDT-94** — Report Review, Edit & Reject
- [x] **HBDT-97** — Report Template Versioning
- [x] **HBDT-99** — Accounting Report Export

### Luồng yêu cầu

```text
Sales
  ├──→ Sales Bookkeeping
  │
Inventory
  ├──→ Inventory Bookkeeping
  │
Debt
  └──→ Debt Bookkeeping
          ↓
  Accounting Transactions
          ↓
  Accounting Books
          ↓
  Financial Reports
          ↓
  Review / Edit / Reject
          ↓
  Export
```

### Đánh giá

Phần **automatic bookkeeping** đã có nền tảng tốt.

**Trạng thái:** ✅ Đủ

### Thời gian thực hiện
- Ngày bắt đầu: 19/08/2026
- Ngày hoàn thành: 12/09/2026

---

# 12. EPIC-11 — Reports & Analytics

### Jira Status: ✅ Done

### Revenue

- [x] **HBDT-71** — Owner Revenue Dashboard
- [x] **HBDT-72** — Detailed Revenue Ledger
- [x] **HBDT-75** — Charts Revenue
- [x] **HBDT-77** — Date Filters for Revenue

### Business Analytics

- [x] **HBDT-74** — Operational Analytics
- [x] **HBDT-76** — Debt & Business Operations Reports
- [x] **HBDT-90** — Debt & Business Operations Reports

### Đánh giá

Đã có các yêu cầu quan trọng:

- Daily / monthly revenue
- Revenue charts
- Date filtering
- Operational analytics
- Outstanding debt reports
- Business operation reports

### Điểm cần kiểm tra

Proposal yêu cầu real-time business insights. Vì vậy nên kiểm tra dữ liệu dashboard có cập nhật chính xác sau:

```text
Order
→ Payment
→ Debt
→ Inventory
→ Bookkeeping
→ Dashboard
```

Ngoài ra cần thống nhất rõ khái niệm **doanh thu** và **tiền thực thu** để tránh tính lợi nhuận sai khi khách mua trả góp/trả nợ.

**Trạng thái:** ✅ Đủ về chức năng chính.

### Thời gian thực hiện
- Ngày bắt đầu: 07/09/2026
- Ngày hoàn thành: 14/09/2026

---

# 13. EPIC-12 — Administrator Management

### Jira Status: ✅ Done

### Đã hoàn thành

- [x] **HBDT-110** — Admin Account Management
- [x] **HBDT-115** — Admin Profile Management
- [x] **HBDT-130** — Admin's page
- [x] **HBDT-68** — Administrator Management
- [x] **HBDT-79** — Subscription Pricing Management
- [x] **HBDT-91** — System & AI Configuration
- [x] **HBDT-93** — Financial Template Management
- [x] **HBDT-96** — System-wide Announcements
- [x] **HBDT-88** — Feedback Management
- [x] **HBDT-133** — Platform Analytics

### Đánh giá

Đáp ứng các yêu cầu Admin:

- Owner account management
- Subscription pricing
- Platform analytics
- System configuration
- Financial report templates
- System announcements
- Feedback

**Trạng thái:** ✅ Đủ.

> Một số issue có thể liên quan chéo với Epic khác, nhưng về mặt chức năng chúng đã được Jira quản lý/triển khai.

### Thời gian thực hiện
- Ngày bắt đầu: 27/07/2026
- Ngày hoàn thành: 12/09/2026

---

# 14. EPIC-13 — Testing, Deployment & Documentation

### Jira Status: ✅ Done

### Đã hoàn thành

- [x] **HBDT-86** — End-to-end UAT
- [x] **HBDT-89** — Security Testing
- [x] **HBDT-131** — Performance
- [x] **HBDT-137** — Run bat for faster running frontend/backend/AI
- [x] **HBDT-82** — Unit & Integration Testing
- [x] **HBDT-101** — Write Test Cases
- [x] **HBDT-134** — Testing all the functions work properly again

## Deployment

- [x] **HBDT-92** — Deployment, Migration & Backup
- [ ] **HBDT-128** — Release Package

## Documentation

- [x] **HBDT-95** — Installation Guide
- [x] **HBDT-98** — User Manuals
- [x] **HBDT-135** — Update final docs and README
- [x] **HBDT-136** — AI docs (pipeline, guide, prompt)

## Đánh giá

Đây là Epic cần tập trung để đóng project.

Luồng hoàn thiện nên là:

```text
Unit Testing
      ↓
Integration Testing
      ↓
AI Testing
      ↓
Regression Testing
      ↓
E2E / UAT
      ↓
Deployment
      ↓
Migration / Backup
      ↓
Release Package
      ↓
Final Documentation
```

**Trạng thái:** ✅ Có thể coi như là đã đủ.

### Thời gian thực hiện
- Ngày bắt đầu: 01/09/2026
- Ngày hoàn thành: 16/09/2026

---

# 15. Tổng hợp theo Epic

| Epic | Status | Mức độ hoàn thiện | Việc còn đáng chú ý |
|---|---|---|---|
| EPIC-01 Foundation & Design | ✅ Done | 🟢 Cao | UML Diagram |
| EPIC-02 Public & Onboarding | ✅ Done | 🟢 Cao | Không đáng kể |
| EPIC-03 Auth & Security | ✅ Done | 🟢 Cao | Không đáng kể |
| EPIC-04 Subscription & Payment | ✅ Done | 🟢 Cao | Không đáng kể |
| EPIC-05 Product & Pricing | ✅ Done | 🟢 Cao | Không đáng kể |
| EPIC-06 Inventory | ✅ Done | 🟢 Cao | Không đáng kể |
| EPIC-07 Customer & Debt | ✅ Done | 🟢 Cao | Không đáng kể |
| EPIC-08 Sales & Invoice | ✅ Done | 🟢 Cao | Không đáng kể |
| EPIC-09 AI & Notification | ✅ Done | 🟡 AI đã hoàn thiện gần như đầy đủ, Notification hoạt động tốt | AI Testing + Voice |
| EPIC-10 Bookkeeping & Compliance | ✅ Done | 🟢 Cao | Không đáng kể |
| EPIC-11 Reports & Analytics | ✅ Done | 🟢 Cao | Validation / data accuracy |
| EPIC-12 Administrator | ✅ Done | 🟢 Cao | Không đáng kể |
| EPIC-13 Testing/Deployment/Docs | ✅ Done | 🟢 Cao | Testing + Deployment + Release Package |

---

# 16. Những điểm nên kiểm thử thêm

### Performance

Proposal:

```text
Core actions < 2000 ms
```

Nên có số liệu test cho:

- Login
- Product search
- Add to cart
- Create order
- Confirm order
- Debt payment
- Stock import
- Dashboard

### Scalability

Nên test:

- Large product catalog
- Multiple concurrent users
- Multiple simultaneous orders
- Concurrent AI requests

### Usability

Đặc biệt với nhóm người dùng ít digital literacy:

- UI đơn giản
- Tiếng Việt
- Responsive
- Nút/thao tác rõ ràng
- Fast sales
- Keyboard shortcuts
- Không phụ thuộc POS hardware

### Unicode

Test xuyên suốt:

```text
Frontend
→ Backend
→ Database
→ Accounting
→ PDF
```

với tiếng Việt có dấu.

### AI Fallback

Khi AI unavailable:

```text
AI unavailable
     ↓
Manual operation
     ↓
Employee creates normal order
```

Hệ thống không được làm gián đoạn hoạt động bán hàng.

---

# 17. Kết luận

### Các phần nghiệp vụ chính đã có

- ✅ Public Portal
- ✅ Owner Onboarding
- ✅ Authentication
- ✅ RBAC
- ✅ Tenant Isolation
- ✅ Owner / Employee / Admin
- ✅ Subscription
- ✅ Payment
- ✅ Product Catalog
- ✅ Pricing
- ✅ Inventory
- ✅ Customer
- ✅ Debt
- ✅ At-counter Sales
- ✅ Sales Invoice
- ✅ AI Draft Order
- ✅ Realtime Notification
- ✅ Automatic Accounting Report Workflow
- ✅ Revenue Dashboard
- ✅ Analytics
- ✅ Automatic Bookkeeping
- ✅ Security Testing
- ✅ Full Testing
- ✅ Deployment
