# SYSTEM PIPELINES

## Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh

---

## Mục đích

Tài liệu này mô tả riêng các pipeline vận hành và triển khai của hệ thống, bao gồm luồng xử lý request, AI Draft Order, checkout transaction, event/background job, CI/CD và observability. Tài liệu được tách độc lập khỏi tài liệu kiến trúc tổng quan để thuận tiện cho việc phát triển, kiểm thử và triển khai.

### Phạm vi

- Pipeline xử lý request qua Authentication, RBAC, Tenant Context và Subscription Entitlement.
- Pipeline AI chuyển Text/Voice thành Draft Order có Human Review và manual fallback.
- Pipeline checkout bảo đảm tính nhất quán giữa Order, Inventory, Payment/Debt và Accounting.
- Pipeline sự kiện và background job cho hóa đơn, báo cáo, realtime và cache.
- Pipeline CI/CD cho Frontend, Backend Modular Monolith và AI Service.
- Pipeline observability cho log, metrics, trace và cảnh báo.

---

## 1. Pipeline xử lý request của hệ thống

Pipeline này mô tả đường đi của một request từ giao diện người dùng đến module nghiệp vụ và tầng dữ liệu.

```text
┌───────────────────┐
│ OWNER / EMPLOYEE  │
│ / ADMINISTRATOR   │
└─────────┬─────────┘
          │ HTTPS Request
          ▼
┌──────────────────────────────────────────────────────────────┐
│                    PRESENTATION TIER                         │
│ Public Portal │ Owner UI │ Employee POS │ Admin Portal      │
└────────────────────────────┬─────────────────────────────────┘
                             │ REST API / WebSocket
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                    API ENTRY PIPELINE                        │
│                                                              │
│  Request ID                                                  │
│      │                                                       │
│      ▼                                                       │
│  Rate Limiting                                               │
│      │                                                       │
│      ▼                                                       │
│  Authentication                                              │
│      │                                                       │
│      ▼                                                       │
│  RBAC Authorization                                          │
│      │                                                       │
│      ▼                                                       │
│  Tenant Context                                              │
│      │                                                       │
│      ▼                                                       │
│  Subscription Entitlement                                    │
│      │                                                       │
│      ▼                                                       │
│  Input Validation                                            │
└────────────────────────────┬─────────────────────────────────┘
                             │ Valid Request
                             ▼
┌──────────────────────────────────────────────────────────────┐
│              APPLICATION / DOMAIN MODULE                     │
│                                                              │
│ Onboarding │ Subscription │ Product │ Inventory              │
│ Customer   │ Order        │ Accounting │ Reporting │ Admin   │
└────────────────────────────┬─────────────────────────────────┘
                             │
               ┌─────────────┼───────────────┐
               │             │               │
               ▼             ▼               ▼
     ┌────────────────┐ ┌───────────┐ ┌──────────────────────┐
     │ RELATIONAL DB  │ │ REDIS     │ │ QUEUE / OBJECT STORE │
     │ Transactional  │ │ Cache     │ │ Jobs, Events, Files  │
     │ Data            │ │          │ │                      │
     └────────┬───────┘ └─────┬─────┘ └──────────┬───────────┘
              │               │                  │
              └───────────────┴──────────┬───────┘
                                         ▼
                              ┌──────────────────────┐
                              │ RESPONSE PIPELINE    │
                              │                      │
                              │ Result Mapping       │
                              │ Audit Logging        │
                              │ Error Handling       │
                              │ Realtime Event       │
                              └──────────┬───────────┘
                                         │
                                         ▼
                              ┌──────────────────────┐
                              │ USER INTERFACE       │
                              │ Response / Notice    │
                              └──────────────────────┘
```

### Quy tắc của request pipeline

1. Mỗi request phải có `request_id` hoặc `correlation_id` để truy vết log.
2. Authentication phải hoàn tất trước khi kiểm tra quyền và Tenant.
3. Owner và Employee phải có `tenant_id` hợp lệ; Administrator sử dụng phạm vi nền tảng riêng.
4. Subscription Entitlement chỉ áp dụng cho các chức năng phụ thuộc gói dịch vụ.
5. Validation phải được thực hiện trước khi gọi domain service.
6. Lỗi nghiệp vụ trả về mã lỗi rõ ràng; không trả stack trace hoặc dữ liệu nhạy cảm cho client.
7. Thao tác nhạy cảm phải ghi Audit Log gồm actor, tenant, action, entity, timestamp và kết quả.

---

## 2. AI Draft Order Processing Pipeline

Pipeline AI được tách khỏi checkout. Kết quả cuối cùng của AI luôn là một `Draft Order`, không phải đơn bán hàng đã hoàn tất.

```text
┌──────────────────────────────┐
│ EMPLOYEE / OWNER             │
│ Nhập Text hoặc ghi âm Voice  │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ INPUT NORMALIZATION          │
│ Chuẩn hóa Unicode, khoảng    │
│ trắng, đơn vị và ngôn ngữ    │
└──────────────┬───────────────┘
               │
         ┌─────┴─────┐
         │           │
     Text Input   Voice Input
         │           │
         │           ▼
         │  ┌──────────────────────────┐
         │  │ SPEECH-TO-TEXT PROVIDER  │
         │  │ Audio → Vietnamese Text  │
         │  └─────────────┬────────────┘
         │                │
         └────────┬───────┘
                  ▼
┌──────────────────────────────────────────────────────────────┐
│                     AI ORDER SERVICE                         │
│                                                              │
│  Intent Detection                                            │
│          │                                                   │
│          ▼                                                   │
│  Entity Extraction                                           │
│  Product │ Quantity │ Unit │ Customer │ Debt Request         │
│          │                                                   │
│          ▼                                                   │
│  Product & Customer Matching                                 │
│          │                                                   │
│          ▼                                                   │
│  Ambiguity / Missing Data Detection                          │
└────────────────────────────┬─────────────────────────────────┘
                             │
                   ┌─────────┴─────────┐
                   │                   │
              Không rõ ràng        Đủ dữ liệu
                   │                   │
                   ▼                   ▼
     ┌────────────────────────┐  ┌─────────────────────────┐
     │ Yêu cầu người dùng     │  │ CREATE DRAFT ORDER      │
     │ bổ sung / chọn kết quả │  │ status = DRAFT          │
     └────────────┬───────────┘  └────────────┬────────────┘
                  │                           │
          ┌───────┴────────┐                  ▼
          │                │       ┌─────────────────────────┐
     Bổ sung được      Không xử lý │ REALTIME NOTIFICATION   │
          │                │       │ DraftOrderCreated       │
          │                ▼       └────────────┬────────────┘
          │      ┌──────────────────────┐        │
          │      │ MANUAL POS FALLBACK  │        ▼
          │      └──────────────────────┘  ┌──────────────────────┐
          │                                │ HUMAN REVIEW         │
          └──────────► Phân tích lại       │ Xem / Sửa / Hủy /   │
                                           │ Xác nhận             │
                                           └──────────┬───────────┘
                                                      │ Xác nhận
                                                      ▼
                                           ┌──────────────────────┐
                                           │ CHECKOUT PIPELINE    │
                                           └──────────────────────┘
```

### Dữ liệu log của AI pipeline

- Người gửi yêu cầu và Tenant.
- Loại đầu vào: Text hoặc Voice.
- Nội dung sau khi chuẩn hóa.
- Các entity được trích xuất.
- Kết quả matching và confidence score nếu có.
- Lý do yêu cầu bị đánh dấu mơ hồ.
- Draft Order được tạo hoặc lý do fallback thủ công.
- Thời gian xử lý và lỗi từ provider bên ngoài.

---

## 3. Checkout Transaction Pipeline

Pipeline checkout là phần cần tính nhất quán cao nhất của hệ thống. Các bước thay đổi dữ liệu cốt lõi phải chạy trong một local database transaction của Backend Modular Monolith.

```text
┌──────────────────────────────┐
│ CONFIRMED ORDER              │
│ Manual Order / AI Draft      │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ PRE-CHECK                    │
│ Tenant │ Permission │ Price  │
│ Product │ Unit │ Customer    │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│ INVENTORY VALIDATION         │
│ Kiểm tra số lượng khả dụng   │
└──────────────┬───────────────┘
               │
        ┌──────┴──────┐
        │             │
   Không đủ hàng    Hợp lệ
        │             │
        ▼             ▼
┌───────────────┐  ┌───────────────────────────────────────────┐
│ RETURN ERROR  │  │ BEGIN DATABASE TRANSACTION                │
│ Điều chỉnh đơn│  │                                           │
└───────────────┘  │  1. Lưu Sales Order                       │
                   │  2. Lưu Order Items                       │
                   │  3. Tạo Stock Movement và trừ tồn         │
                   │  4. Ghi Payment hoặc Customer Debt        │
                   │  5. Tạo Accounting Entries                │
                   │  6. Ghi Audit Log                         │
                   └────────────────────┬──────────────────────┘
                                        │
                              ┌─────────┴─────────┐
                              │                   │
                            Có lỗi             Thành công
                              │                   │
                              ▼                   ▼
                    ┌─────────────────┐  ┌──────────────────────┐
                    │ ROLLBACK        │  │ COMMIT               │
                    │ Không thay đổi  │  │ Order = COMPLETED    │
                    │ dữ liệu         │  └──────────┬───────────┘
                    └────────┬────────┘             │
                             │                      ▼
                             │          ┌────────────────────────┐
                             │          │ AFTER-COMMIT EVENTS    │
                             │          │ Invoice Generation     │
                             │          │ Reporting Update       │
                             │          │ Low-stock Check        │
                             │          │ Realtime Notification  │
                             │          └───────────┬────────────┘
                             │                      │
                             ▼                      ▼
                    ┌─────────────────┐   ┌──────────────────────┐
                    │ ERROR RESPONSE  │   │ SUCCESS RESPONSE     │
                    └─────────────────┘   └──────────────────────┘
```

### Ranh giới transaction

Các tác vụ sau phải nằm **trong transaction**:

- Lưu Order và Order Item.
- Trừ tồn kho và lưu Stock Movement.
- Lưu Payment hoặc Debt Transaction.
- Lưu Accounting Entry.
- Ghi trạng thái hoàn tất của đơn.

Các tác vụ sau nên chạy **sau khi commit** hoặc qua background job:

- Sinh file PDF hóa đơn.
- Gửi thông báo realtime.
- Gửi Email/SMS.
- Làm mới cache Dashboard.
- Tính toán analytics không yêu cầu tức thời.

---

## 4. Event, Reporting & Background Job Pipeline

Để tránh làm checkout chậm, các tác vụ không bắt buộc phải hoàn tất đồng thời được đẩy sang hàng đợi sau khi transaction đã commit.

```text
┌──────────────────────────┐
│ DOMAIN TRANSACTION       │
│ Order / Stock / Debt     │
│ / Accounting committed   │
└────────────┬─────────────┘
             │ Domain Event / Outbox Record
             ▼
┌──────────────────────────┐
│ OUTBOX / EVENT PUBLISHER │
└────────────┬─────────────┘
             │ Publish
             ▼
┌──────────────────────────┐
│ MESSAGE QUEUE            │
│                          │
│ OrderCompleted           │
│ DebtChanged              │
│ StockChanged             │
│ SubscriptionActivated    │
│ DraftOrderCreated        │
└────────────┬─────────────┘
             │
     ┌───────┼──────────┬──────────────┬───────────────┐
     │       │          │              │               │
     ▼       ▼          ▼              ▼               ▼
┌────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐
│Invoice │ │Report  │ │Realtime  │ │Email/SMS │ │Analytics / │
│Worker  │ │Worker  │ │Worker    │ │Worker    │ │Cache Worker│
└───┬────┘ └───┬────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘
    │          │           │            │             │
    ▼          ▼           ▼            ▼             ▼
 PDF/File   Report DB   WebSocket     Provider      Redis Cache
 Storage    / Summary   Notification  API           / Dashboard
```

### Quy tắc xử lý background job

1. Job phải có khả năng retry nhưng không được tạo dữ liệu trùng lặp.
2. Consumer phải xử lý theo hướng idempotent dựa trên `event_id` hoặc business key.
3. Job lỗi nhiều lần được chuyển vào Dead Letter Queue để kiểm tra thủ công.
4. Trạng thái job, số lần retry và lỗi cuối cùng phải được ghi log.
5. Việc lỗi gửi email hoặc sinh PDF không được rollback đơn hàng đã commit.

---

## 5. CI/CD Pipeline

Pipeline CI/CD áp dụng cho Frontend, Backend Modular Monolith và AI Service. Mục tiêu là tự động kiểm tra chất lượng mã nguồn, đóng gói, triển khai thử nghiệm và hỗ trợ rollback khi phát hành lỗi.

```text
┌──────────────────────────────┐
│ DEVELOPER WORKSTATION        │
│ Feature Branch               │
└──────────────┬───────────────┘
               │ Push
               ▼
┌──────────────────────────────┐
│ GIT REPOSITORY               │
│ Pull Request                 │
└──────────────┬───────────────┘
               │ Trigger CI
               ▼
┌──────────────────────────────────────────────────────────────┐
│                         CI PIPELINE                          │
│                                                              │
│  Checkout Source                                             │
│        │                                                     │
│        ▼                                                     │
│  Install Dependencies                                        │
│        │                                                     │
│        ▼                                                     │
│  Format / Lint / Static Analysis                             │
│        │                                                     │
│        ▼                                                     │
│  Unit Tests                                                  │
│        │                                                     │
│        ▼                                                     │
│  Integration Tests                                           │
│        │                                                     │
│        ▼                                                     │
│  Dependency & Security Scan                                  │
│        │                                                     │
│        ▼                                                     │
│  Build Frontend / Backend / AI Service                       │
│        │                                                     │
│        ▼                                                     │
│  Build Docker Images                                         │
└────────────────────────────┬─────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                 Thất bại          Thành công
                    │                 │
                    ▼                 ▼
          ┌──────────────────┐  ┌──────────────────────────┐
          │ BLOCK MERGE      │  │ ARTIFACT / IMAGE REGISTRY│
          │ Báo lỗi cho PR   │  │ Versioned Images         │
          └──────────────────┘  └────────────┬─────────────┘
                                            │ Merge main / Release tag
                                            ▼
┌──────────────────────────────────────────────────────────────┐
│                         CD PIPELINE                          │
│                                                              │
│  Deploy Staging                                              │
│        │                                                     │
│        ▼                                                     │
│  Run Database Migration                                      │
│        │                                                     │
│        ▼                                                     │
│  Smoke Tests                                                 │
│        │                                                     │
│        ▼                                                     │
│  API Integration Tests                                       │
│        │                                                     │
│        ▼                                                     │
│  End-to-End Tests                                            │
│        │                                                     │
│        ▼                                                     │
│  AI Accuracy Test Set                                        │
│        │                                                     │
│        ▼                                                     │
│  Manual Approval / Release Gate                              │
│        │                                                     │
│        ▼                                                     │
│  Deploy Production                                           │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                    POST-DEPLOYMENT CHECKS                    │
│                                                              │
│ Health Check │ Smoke Test │ Logs │ Metrics │ Error Rate      │
└────────────────────────────┬─────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                  Ổn định          Có lỗi nghiêm trọng
                    │                 │
                    ▼                 ▼
          ┌──────────────────┐  ┌──────────────────────────┐
          │ RELEASE COMPLETE │  │ ROLLBACK APPLICATION     │
          │ Tag & Changelog  │  │ Restore compatible DB   │
          └──────────────────┘  └──────────────────────────┘
```

### Các stage trong CI/CD

| Stage | Nội dung kiểm tra | Điều kiện qua stage |
|---|---|---|
| **Source & PR** | Branch, commit message, pull request và review | PR hợp lệ và có reviewer chấp thuận |
| **Quality** | Format, lint, type check và static analysis | Không có lỗi blocking |
| **Unit Test** | Service, domain logic, utility và component | Toàn bộ test bắt buộc pass |
| **Integration Test** | API, database, transaction và module integration | Không sai lệch Order–Stock–Debt–Accounting |
| **Security Scan** | Dependency, secret và container image scan | Không có lỗ hổng nghiêm trọng chưa xử lý |
| **Build** | Build frontend, backend, AI và Docker image | Artifact được tạo và đánh version |
| **Staging** | Deploy môi trường thử nghiệm và chạy migration | Service healthy, migration thành công |
| **E2E/UAT** | Luồng Owner, Employee, Admin và AI Draft Order | Các luồng P0 hoạt động đúng |
| **Production** | Deploy phiên bản đã phê duyệt | Health check và smoke test pass |
| **Rollback** | Quay lại image trước và migration tương thích | Hệ thống trở lại trạng thái ổn định |

### Chiến lược branch đề xuất

```text
main
  │
  ├── release/v1.x
  │
  └── develop
       │
       ├── feature/onboarding
       ├── feature/subscription
       ├── feature/inventory
       ├── feature/order-checkout
       ├── feature/ai-draft-order
       └── fix/...
```

Với dự án 8 Sprint, nhóm cũng có thể đơn giản hóa thành trunk-based development:

```text
main
  ├── feature/short-lived-branch
  ├── feature/short-lived-branch
  └── hotfix/short-lived-branch
```

Mọi branch phải đi qua Pull Request, review và CI trước khi merge.

---

## 6. Môi trường triển khai

| Môi trường | Mục đích | Dữ liệu |
|---|---|---|
| **Local** | Phát triển và unit test trên máy cá nhân | Seed data cục bộ |
| **Development** | Tích hợp thường xuyên giữa frontend, backend và AI | Dữ liệu giả lập |
| **Staging** | Integration test, E2E, UAT và kiểm tra migration | Dữ liệu gần giống production nhưng đã ẩn thông tin nhạy cảm |
| **Production** | Phục vụ người dùng thật | Dữ liệu nghiệp vụ chính thức, có backup |

### Biến cấu hình cần tách theo môi trường

- Database connection.
- Redis và Message Queue connection.
- Object Storage bucket.
- JWT secret và token lifetime.
- Payment Provider credentials.
- Email/SMS Provider credentials.
- AI/Speech Provider credentials.
- Allowed origins và public URL.
- Logging level và observability endpoint.

Secret không được commit vào repository; phải được cung cấp bằng environment variable hoặc secret manager.

---

## 7. Observability Pipeline

```text
Frontend / Backend / AI / Worker
               │
               ├── Structured Logs
               ├── Metrics
               ├── Traces
               └── Error Events
               │
               ▼
┌──────────────────────────────────────┐
│ OBSERVABILITY PLATFORM               │
│                                      │
│ Log Aggregation                      │
│ Metrics Dashboard                    │
│ Distributed Tracing                  │
│ Error Tracking                       │
└──────────────────┬───────────────────┘
                   │
                   ▼
┌──────────────────────────────────────┐
│ ALERTING                             │
│ Error rate │ Latency │ Queue backlog │
│ DB health  │ AI provider failure     │
└──────────────────────────────────────┘
```

Các chỉ số tối thiểu nên theo dõi:

- API response time và tỷ lệ request lỗi.
- Số người dùng và Tenant đang hoạt động.
- Số lượng Order thành công, thất bại và rollback.
- Queue backlog và số job retry/Dead Letter.
- Thời gian AI xử lý và tỷ lệ fallback thủ công.
- Database connection, dung lượng và thời gian query.
- Tỷ lệ gửi OTP, Email/SMS và thanh toán thất bại.
- Thời gian sinh báo cáo và PDF hóa đơn.

---

## 8. Tổng kết pipeline

| Pipeline | Đầu vào | Đầu ra | Đặc tính quan trọng |
|---|---|---|---|
| **Request Pipeline** | HTTP/WebSocket request | API response hoặc realtime event | Auth, RBAC, Tenant và validation |
| **AI Draft Order Pipeline** | Text/Voice | Draft Order | Human review và manual fallback |
| **Checkout Pipeline** | Confirmed Order | Completed Order hoặc rollback | Transactional consistency |
| **Event & Reporting Pipeline** | Domain event sau commit | Invoice, report, notification và cache | Retry, idempotency và DLQ |
| **CI/CD Pipeline** | Source code và release tag | Phiên bản chạy trên Production | Automated testing, approval và rollback |
| **Observability Pipeline** | Logs, metrics, traces | Dashboard và alert | Truy vết và phát hiện lỗi sớm |
