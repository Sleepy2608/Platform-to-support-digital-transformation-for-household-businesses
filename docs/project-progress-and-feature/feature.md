## Các tính năng đã hoàn thành (Completed Features)

> Danh sách dưới đây được tổng hợp theo **13 Epic trên Jira** (có thể xem ở mục [Project Progress](docs/project-progress-and-feature/project-progress.md)) và các task đã được đánh dấu **Done / hoàn thành** trong tiến độ hiện tại.

### EPIC-01: Project Foundation & System Design

- [x] Scope & Business Workflows
- [x] Software Requirement Specification
- [x] Architecture Design
- [x] User Requirement
- [x] Make Use Case
- [x] Make ERD
- [x] Github Repository
- [x] Project Skeleton
- [x] Environment and CI/CD
- [x] Database Management
- [x] Debug Database and Backend
- [x] Chuyển database sang Entity và sử dụng seed
- [x] Compliance Update

### EPIC-02: Public Portal & Owner Onboarding

- [x] Public Landing Page
- [x] Owner Self-registration
- [x] Business Profile Onboarding
- [x] Account Verification
- [x] Terms & Privacy Consent
- [x] Package Selection & Activation

### EPIC-03: Authentication, User Management & Security

#### Authentication

- [x] Login & Token Authentication
- [x] Refresh Token JWT

#### Owner Management

- [x] Owner Account Management
- [x] Owner Profile Management

#### Employee Management

- [x] Employee Account Management
- [x] Employee Profile Management
- [x] Employee Permission Management

#### Admin / User Management

- [x] Admin Account Management
- [x] Admin Profile Management
- [x] Admin Page

#### Security

- [x] RBAC
- [x] Restructured RBAC
- [x] Security Baseline
- [x] Tenant Isolation
- [x] Audit Log
- [x] Security Testing

### EPIC-04: Subscription, Payment & Service Invoice

#### Subscription

- [x] Subscription Plan CRUD
- [x] Subscription Lifecycle
- [x] Upgrade, Downgrade & Renewal
- [x] Payment Processing & Status
- [x] Subscription & Invoice History
- [x] Feature Entitlement
- [x] Subscription Pricing Management
- [x] Subscription Status & State Transition
- [x] Subscription Database & Entity
- [x] Subscription Service / API / Expiration
- [x] Subscription-based Access Control
- [x] Subscription UI
- [x] Adjust Upgrade and Downgrade Feature

#### Service Invoice

- [x] Service Invoice Generation

### EPIC-05: Product Catalog & Pricing

- [x] Product & Category CRUD
- [x] Product Image Management
- [x] Multiple Units of Measure
- [x] Product Pricing Rules
- [x] Instant Product Search
- [x] Product Import Template
- [x] Package Upgrade / Feature Limitation
- [x] UI and Notification for Subscription Changes
- [x] Seed Data

### EPIC-06: Inventory Management

- [x] Stock Import
- [x] Current Stock Balance
- [x] Automatic Stock Deduction
- [x] Inventory History & Adjustment
- [x] Low-stock Alert
- [x] Automatic Inventory Bookkeeping

### EPIC-07: Store Customer & Debt Management

#### Customer

- [x] Customer CRUD
- [x] Customer Purchase History

#### Debt

- [x] Record Debt at Checkout
- [x] Debt Payment
- [x] Debt History & Validation
- [x] Automatic Debt Bookkeeping

#### Reports

- [x] Debt & Business Operations Reports

### EPIC-08: At-counter Sales & Sales Invoice

- [x] At-counter Order API
- [x] Cart, Pricing & Customer Assignment
- [x] Confirm & Cancel Order
- [x] Order History
- [x] Print & PDF Sales Invoice
- [x] Fast Sales UI

### EPIC-09: AI Draft Order & Realtime Notification

#### AI Pipeline

- [x] AI Text Input
- [x] Order Parser
- [x] Product & Customer Matching
- [x] Ambiguity Detection
- [x] Draft Order Generation
- [x] Draft Order Review UI
- [x] AI Fallback & Logging
- [x] AI Accuracy Testing
- [x] System & AI Configuration

#### Realtime Notification

- [x] Realtime Notification

#### Documentation

- [x] AI Documentation — Pipeline, Guide & Prompt

> **Lưu ý:** Phần AI Text Input và toàn bộ AI pipeline chính đã được hoàn thành. Tuy nhiên, hệ thống vẫn chưa hỗ trợ **Voice-to-text**.

### EPIC-10: Automatic Bookkeeping & Compliance

#### Accounting Core

- [x] Accounting Transaction Model
- [x] Automatic Sales Bookkeeping
- [x] Automatic Inventory Bookkeeping
- [x] Automatic Debt Bookkeeping

#### Compliance / Financial Templates

- [x] Financial Template Management
- [x] Compliance Update

#### Accounting Report Workflow

- [x] Report Review, Edit & Reject
- [x] Report Template Versioning
- [x] Accounting Report Export

### EPIC-11: Reports & Analytics

#### Revenue

- [x] Owner Revenue Dashboard
- [x] Detailed Revenue Ledger
- [x] Revenue Charts
- [x] Date Filters for Revenue

#### Business Analytics

- [x] Operational Analytics
- [x] Debt & Business Operations Reports

### EPIC-12: Administrator Management

- [x] Admin Account Management
- [x] Admin Profile Management
- [x] Administrator Management
- [x] Owner Account Management
- [x] Subscription Pricing Management
- [x] System & AI Configuration
- [x] Financial Template Management
- [x] System-wide Announcements
- [x] Feedback Management
- [x] Platform Analytics

### EPIC-13: Testing, Deployment & Documentation

#### Testing

- [x] End-to-end UAT
- [x] Security Testing
- [x] Performance Testing
- [x] Unit & Integration Testing
- [x] Write Test Cases
- [x] Testing all the functions work properly again
- [x] Run BAT for faster frontend/backend/AI startup

#### Deployment

- [x] Deployment, Migration & Backup

#### Documentation

- [x] Installation Guide
- [x] User Manuals
- [x] Update Final Documentation and README
- [x] AI Documentation — Pipeline, Guide & Prompt

---

## Các công việc / tính năng còn thiếu

Dựa trên trạng thái hiện tại của các task trong Jira, dự án hiện chỉ còn một số công việc chưa hoàn thành hoàn toàn:

### EPIC-01: Project Foundation & System Design

- [ ] **HBDT-104 — UML Diagram**

> UML Diagram hiện vẫn ở trạng thái `To Do`.

### EPIC-09: AI Draft Order & Realtime Notification

- [ ] **HBDT-60 — Voice-to-text**

> Đây là tính năng AI duy nhất còn thiếu. Hiện tại hệ thống đã hỗ trợ **Text Input**, nhưng chưa hoàn thiện khả năng nhận yêu cầu bằng **Voice**.

### EPIC-13: Testing, Deployment & Documentation

- [ ] **HBDT-128 — Release Package**

> Release Package vẫn chưa được hoàn thành.

---

## Đối chiếu với yêu cầu đề tài

| Nhóm yêu cầu | Trạng thái |
| :--- | :---: |
| Employee Login | ✅ Hoàn thành |
| At-counter Order | ✅ Hoàn thành |
| Record Customer Debt | ✅ Hoàn thành |
| Print Sales Invoice | ✅ Hoàn thành |
| Real-time AI Order Notification | ✅ Hoàn thành |
| AI Draft Order | ✅ Hoàn thành |
| Voice-to-text | ❌ Chưa hoàn thành |
| Product Catalog | ✅ Hoàn thành |
| Multiple Units of Measure | ✅ Hoàn thành |
| Product Pricing Rules | ✅ Hoàn thành |
| Inventory Management | ✅ Hoàn thành |
| Customer Management | ✅ Hoàn thành |
| Debt Management | ✅ Hoàn thành |
| Revenue & Business Reports | ✅ Hoàn thành |
| Revenue Charts / Date Filters | ✅ Hoàn thành |
| Employee Account Management | ✅ Hoàn thành |
| Owner Account Management | ✅ Hoàn thành |
| Admin Account Management | ✅ Hoàn thành |
| Subscription Management | ✅ Hoàn thành |
| Payment Processing | ✅ Hoàn thành |
| Automatic Bookkeeping | ✅ Hoàn thành |
| Financial Template Management | ✅ Hoàn thành |
| Accounting Report Review / Edit / Reject | ✅ Hoàn thành |
| Accounting Report Export | ✅ Hoàn thành |
| Report Template Versioning | ✅ Hoàn thành |
| AI Fallback | ✅ Hoàn thành |
| Security / RBAC | ✅ Hoàn thành |
| Performance Testing | ✅ Hoàn thành |
| Unit & Integration Testing | ✅ Hoàn thành |
| Deployment / Migration / Backup | ✅ Hoàn thành |
| Installation Guide | ✅ Hoàn thành |
| User Manual | ✅ Hoàn thành |
| Technical / AI Documentation | ✅ Hoàn thành |
| UML Diagram | ❌ Chưa hoàn thành |
| Release Package | ❌ Chưa hoàn thành |

---

## Tổng kết tiến độ

- **13 Epic** đã được xây dựng và quản lý trên Jira.
- **13/13 Epic** hiện được đánh dấu `Done` trên Jira.
- Phần lớn các chức năng nghiệp vụ chính của hệ thống đã được hoàn thành.
- Các chức năng AI chính đã được triển khai, bao gồm **AI Text Input, Order Parser, Product & Customer Matching, Ambiguity Detection, Draft Order Generation, Draft Order Review, AI Fallback và Realtime Notification**.
- Các công việc về **Unit Testing, Integration Testing, Performance Testing, E2E/UAT, Deployment, Migration & Backup** đã được hoàn thành.
- Các tài liệu chính như **Installation Guide, User Manual, Final Documentation, README và AI Documentation** đã được hoàn thành.

### Các công việc còn lại

1. **HBDT-60 — Voice-to-text**
2. **HBDT-104 — UML Diagram**
3. **HBDT-128 — Release Package**
