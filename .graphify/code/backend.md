# ☕ BACKEND ARCHITECTURE & DIRECTORY MAP (Spring Boot)

**Root package:** `com.hbdt` (`Code/Server/src/main/java/com/hbdt`)

---

## 1. Danh mục các Module & Package

| Package | Mục đích & Trách nhiệm chính |
| :--- | :--- |
| `accounting` | Sổ sách kế toán Thông tư 88/2021/TT-BTC (`AccountingTemplateFillController`, `StatutoryAccountingController`), xuất sổ S1, S2, S4. |
| `admin` | Quản trị nền tảng (`AdminUserController`, `AdminProfileController`), cấu hình mẫu báo cáo thuế (`TemplateAdminController`, `ReportTemplateAdminController`). |
| `ai` | Giao tiếp với AI service qua HTTP (`AiController`, `AiExtractionClient`, `AiServiceProcessManager`). |
| `analytics` | Thống kê số liệu người dùng, hộ kinh doanh, doanh thu nền tảng (`PlatformAnalyticsController`). |
| `announcement` | Quản lý thông báo toàn hệ thống của Admin đến Owner/Employee (`AnnouncementController`). |
| `auth` | Xác thực người dùng, JWT Provider, refresh token, gửi OTP qua mail (`AuthController`, `AuthService`, `JwtTokenProvider`). |
| `common` | DTO dùng chung (`ApiResponse`, `PageResponse`), Exception xử lý tập trung (`GlobalExceptionHandler`, `BadRequestException`, `ResourceNotFoundException`), Security Filter (`JwtAuthenticationFilter`, `AuditLoggingFilter`), dịch vụ địa lý (`GeoReferenceStore`, `AddressFormatterService`), lưu trữ ảnh (`ImageStorageService`). |
| `config` | Cấu hình bảo mật (`SecurityConfig`), CORS (`CorsConfig`), Seed dữ liệu tự động (`DatabaseSeeder`, `FeatureEntitlementSeeder`, `CatalogReferenceDataSeeder`, `GeoDataInitializer`). |
| `consent` | Quản lý việc đồng ý điều khoản dịch vụ và chính sách dữ liệu (`ConsentController`, `TermsConsentService`). |
| `customer` | Quản lý danh bạ khách hàng, hạn mức nợ, lịch sử mua sắm (`CustomerController`, `CustomerService`). |
| `debt` | Quản lý ghi nhận và thanh toán công nợ (`DebtController`, `DebtBookkeepingService`). |
| `employee` | Hồ sơ nhân viên, phân ca (`EmployeeProfileController`, `EmployeeProfileService`). |
| `entitlement` | Phân quyền tính năng theo gói cước (`@RequireFeature`, `FeatureEntitlementInterceptor`, `SubscriptionLifecycleController`, `SubscriptionExpiryScheduler`). |
| `entity` | 40+ JPA Entities & Enums định nghĩa schema cơ sở dữ liệu (`User`, `Role`, `BusinessProfile`, `Subscription`, `SubscriptionPlan`, `Product`, `Order`, `SalesOrderItem`, `PaymentHistory`, `RevenueLedgerEntry`, v.v.). |
| `feedback` | Góp ý và phản hồi người dùng (`FeedbackController`, `FeedbackService`). |
| `imports` | Nhập hàng loạt sản phẩm bằng file Excel/CSV (`ProductImportController`, `ProductImportFileParser`, `ProductImportErrorReportGenerator`). |
| `inventory` | Tồn kho thực tế (`CurrentStockBalanceController`), biến động kho (`InventoryMovementController`), kiểm kê/sổ kho (`InventoryBookkeepingController`), cảnh báo tồn kho thấp (`LowStockAlertController`), nhập kho hàng hóa (`StockImportController`). |
| `manager` | Quản lý hồ sơ hộ kinh doanh và hóa đơn dịch vụ (`ManagerBusinessOwnerController`). |
| `notification` | Hệ thống thông báo in-app và SSE realtime (`NotificationController`, `NotificationStreamService`). |
| `order` | Đơn hàng bán lẻ (`SalesOrderController`), ghi chép sổ bán hàng tự động (`SalesBookkeepingController`, `SalesBookkeepingEvent`). |
| `owner` | Bảng điều khiển chủ hộ kinh doanh (`OwnerController`, `EmployeeManagementController`, `ReportReviewController`, `BusinessProfileService`). |
| `payment` | Ghi nhận thanh toán (`PaymentController`, `PaymentService`, `PaymentHistory`, `PaymentMethod`, `PaymentStatus`). |
| `pricing` | Quản lý bảng giá, phân loại giá sỉ/lẻ (`ProductPriceController`, `PriceResolutionController`, `ProductPricingService`). |
| `product` | Sản phẩm, danh mục (`CategoryController`), đơn vị tính (`ProductUnitController`), giải quyết đa chi nhánh/hộ kinh doanh (`BusinessContextService`). |
| `repository` | 38 Spring Data JPA Repositories truy vấn cơ sở dữ liệu MySQL. |
| `revenue` | Sổ doanh thu bán hàng theo TT88 (`RevenueLedgerController`), phân tích biểu đồ doanh thu theo mặt hàng/thời gian (`RevenueChartController`, `ProductSalesController`). |
| `seed` | Sao lưu và khôi phục dữ liệu mẫu (`SeedController`, `SeedService`, `SeedCrypto`). |
| `sepay` | Cổng thanh toán trực tuyến SePay (`SepayWebhookController`, `SepayWebhookService`, DTOs, tự động gia hạn gói & xuất hóa đơn `ServiceInvoice`). |
| `subscription` | Vòng đời gói dịch vụ SaaS (`SubscriptionController`, `SubscriptionPlanController`, `ServiceInvoiceController`, `SubscriptionService`). |

---

## 2. Các God Nodes & Core Classes (Được nhận diện bởi Graphify)

1. **`ApiResponse`** (292 edges): Wrapper chuẩn hóa định dạng JSON phản hồi cho toàn bộ API (`code`, `message`, `data`).
2. **`BadRequestException`** (215 edges): Ngoại lệ validation và vi phạm business logic, kết nối hơn 50 controller/service.
3. **`UserRepository`** (160 edges): Data access layer cho tài khoản người dùng và phân quyền RBAC.
4. **`User`** (157 edges): Thực thể đại diện cho người dùng thuộc 4 vai trò (Admin, Owner, Employee, Manager).
5. **`ResourceNotFoundException`** (137 edges): Xử lý ngoại lệ không tìm thấy tài nguyên trong DB.
6. **`BusinessContextService`** (97 edges): Xác định ngữ cảnh `businessId` hiện tại của người dùng đang đăng nhập để cô lập dữ liệu (Multi-tenancy).
7. **`Subscription`** & **`SubscriptionService`** (71 edges): Quản trị gói cước, ngày hết hạn và kích hoạt khi thanh toán.

---

## 3. Kiến Trúc Phân Hệ Thanh Toán SePay Webhook (`com.hbdt.sepay`)

### 3.1. Thành phần chính
- **`SepayWebhookController`**:
  * Tiếp nhận webhook qua POST `/api/sepay/webhook` và IPN POST `/api/sepay/ipn`.
  * Endpoint sức khỏe GET `/api/sepay/webhook/health` (Health check trả `200 OK`).
  * **Cơ chế chịu lỗi:** Luôn phản hồi HTTP `200 OK` (kèm trạng thái trong JSON body) ngay cả khi có ngoại lệ nội bộ, ngăn chặn cơ chế retry 7 lần của SePay.
- **`SepayWebhookService`**:
  * **Xác thực API Key:** Kiểm tra header `Authorization: Apikey <SEPAY_SECRET_KEY>`.
  * **Bảo vệ tài khoản nhận:** Kiểm tra `payload.getAccountNumber()` khớp với cấu hình hệ thống (`107882760609`).
  * **Chống trùng lặp (Idempotency):** Kiểm tra `PaymentHistory` theo transactionId trước khi cộng hạn.
  * **Bóc tách cú pháp đa dạng:**
    - Cú pháp chuẩn hóa: `HBDT RENEW <businessId> <months>` (VD: `HBDT RENEW 1 1`).
    - Cú pháp đơn: `HBDT RENEW <businessId>` (mặc định 1 tháng).
    - Cú pháp ID trực tiếp: `HBDT SUB <subId>`.
    - Cú pháp hóa đơn: `INV-<date>-<code>`.
    - Fallback nhận diện gói: `(VIP|STANDARD)[-_ ](MONTHLY|YEARLY)` tránh mất tiền của khách hàng.
  * **Tự tạo mới Subscription:** Nếu hộ kinh doanh đăng ký lần đầu thanh toán qua SePay chưa có bản ghi Subscription trong CSDL, hệ thống tự động gán chủ sở hữu và khởi tạo gói `ACTIVE`.
  * **Hóa đơn & Nhật ký:** Tự động sinh `ServiceInvoice` trạng thái `PAID` và ghi nhật ký `SubscriptionHistory`.

