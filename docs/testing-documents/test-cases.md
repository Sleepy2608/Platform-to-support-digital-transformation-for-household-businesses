# Tài liệu Kiểm thử (Test Cases Document)
## Module: Quản lý Công nợ và Thanh toán (HBDT-66 Automatic Debt Bookkeeping)

---

## 1. Thông tin tổng quan

- **Dự án**: Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh (Platform to support digital transformation for household businesses).
- **Module**: Quản lý bán hàng & Công nợ khách hàng (Sales Order & Debt Bookkeeping).
- **Mã tính năng**: **HBDT-66** (Automatic Debt Bookkeeping).
- **Yêu cầu SRS liên quan**: `HBDT-07.3` (Ghi nhận công nợ), `HBDT-07.4` (Thanh toán công nợ), `HBDT-07.5` (Lịch sử & Tổng hợp công nợ), `HBDT-08.1` (Tạo đơn bán hàng), `HBDT-08.4` (Hủy đơn bán hàng).
- **Phạm vi tài liệu**: Mục 1–5 trình bày module **HBDT-66 (Automatic Debt Bookkeeping)**. Mục 6–8 bổ sung test case cho các tính năng mới của nhánh `feature/AI_Service`: **trợ lý AI tạo đơn nháp**, **sổ kế toán TT88 (S1/S2/S4)** và **quản trị biểu mẫu báo cáo**.
- **Môi trường thực thi**:
  - Ngôn ngữ: Java 21 LTS
  - Framework: Spring Boot 3.x, Spring Data JPA, Hibernate, JUnit 5, Mockito, AssertJ
  - Cơ sở dữ liệu: MySQL 8.x / H2 in-memory (cho test runner)
  - AI Service: Python 3.12, FastAPI, pytest
  - Lệnh chạy kiểm thử: `.\mvnw.cmd test` (backend) và `pytest` trong `Code/AI` (AI service)

---

## 2. Tiêu chuẩn và Phạm vi kiểm thử

### 2.1. Mục tiêu kiểm thử
1. Đảm bảo tính toán công nợ dựa trên **Single Source of Truth (SSOT)**: Mọi biến động nợ đều được ghi nhật ký vào bảng `debt_transactions`.
2. Kiểm tra tính toàn vẹn dữ liệu: `Customer.debtBalance` luôn đồng bộ chính xác với `balanceAfter` của giao dịch mới nhất.
3. Kiểm tra kiểm soát tính hợp lệ (Validation): Chặn triệt để thanh toán số tiền <= 0, thanh toán vượt nợ đơn, vượt nợ khách, thanh toán đơn chưa xác nhận, hoặc đơn sai tenant.
4. Kiểm tra luồng đảo nợ (Debt Reversal): Khi hủy đơn hàng đang có nợ, tự động sinh giao dịch loại `VOID` để hoàn trả công nợ.
5. Kiểm tra phòng chống Deadlock: Tuân thủ thứ tự khóa tài nguyên nhất quán (Lock `SalesOrder` trước, Lock `Customer` sau).
6. Kiểm tra bảo mật đa người dùng / đa hộ kinh doanh (Multi-tenancy): Dữ liệu công nợ bị cô lập tuyệt đối theo `business_id`.

### 2.2. Danh mục Enum chuẩn hóa
- **Loại giao dịch (`DebtTransactionType`)**: `DEBT_INCREASE`, `PAYMENT`, `ADJUSTMENT`, `VOID`.
- **Trạng thái giao dịch (`DebtTransactionStatus`)**: `ACTIVE`, `VOIDED`.
- **Phương thức thanh toán (`PaymentMethod`)**: `CASH`, `BANK_TRANSFER`.
- **Trạng thái thanh toán đơn (`PaymentStatus`)**: `UNPAID`, `PARTIALLY_PAID`, `PAID`.

---

## 3. Danh mục Test Cases Chi tiết

### Nhóm 1: Phát sinh công nợ khi tạo đơn hàng (Sales Order Creation)

| Test Case ID | Tên kịch bản | Điều kiện đầu vào | Các bước thực hiện | Kết quả mong đợi | Test Code tương ứng |
|---|---|---|---|---|---|
| **TC-DEBT-01** | Tạo đơn hàng trả đủ ngay (Không phát sinh nợ) | Đơn hàng tổng 300.000đ, `paidAmount = 300.000đ` | 1. Gọi `SalesOrderService.createSalesOrder`.<br>2. Kiểm tra phát sinh nợ. | - Đơn hàng được tạo thành công với `debtAmount = 0`, `paymentStatus = PAID`.<br>- **Không tạo** bất kỳ bản ghi `DebtTransaction` nào.<br>- `Customer.debtBalance` không đổi. | `SalesOrderServiceTest.createWithPaidEqualsTotal_noDebtGenerated` |
| **TC-DEBT-02** | Tạo đơn hàng mua chịu toàn bộ | Đơn hàng tổng 500.000đ, `paidAmount = 0`, có `customerId = 22` | 1. Gọi `SalesOrderService.createSalesOrder`.<br>2. Xác minh giao dịch nợ phát sinh. | - Đơn hàng có `debtAmount = 500.000đ`, `paymentStatus = UNPAID`.<br>- Tự động tạo 1 `DebtTransaction` loại `DEBT_INCREASE` với `amount = 500.000đ`, `status = ACTIVE`.<br>- `Customer.debtBalance` tăng đúng 500.000đ. | `SalesOrderServiceTest.createWithPaidZero_fullDebtGenerated` |
| **TC-DEBT-03** | Tạo đơn hàng mua chịu một phần | Đơn hàng tổng 400.000đ, `paidAmount = 150.000đ`, có `customerId = 22` | 1. Gọi `SalesOrderService.createSalesOrder`.<br>2. Xác minh giao dịch nợ phát sinh. | - Đơn hàng có `paidAmount = 150.000đ`, `debtAmount = 250.000đ`, `paymentStatus = PARTIALLY_PAID`.<br>- Tạo 1 `DebtTransaction` loại `DEBT_INCREASE` với `amount = 250.000đ`.<br>- `Customer.debtBalance` tăng đúng 250.000đ. | `DebtBookkeepingServiceTest.recordDebtIncrease_success` |
| **TC-DEBT-04** | Từ chối tạo đơn có nợ nhưng thiếu khách hàng | Đơn hàng tổng 200.000đ, `paidAmount = 0`, `customerId = null` | 1. Gọi `SalesOrderService.createSalesOrder` không truyền `customerId`. | - Ném ngoại lệ `IllegalArgumentException: Customer is required when debt amount is greater than zero`.<br>- Giao dịch bị rollback hoàn toàn. | `SalesOrderServiceTest.createRejectsDebtWithoutCustomer` |
| **TC-DEBT-05** | Từ chối tạo đơn với `paidAmount` âm | Đơn hàng tổng 200.000đ, `paidAmount = -50.000đ` | 1. Gọi `SalesOrderService.createSalesOrder` với `paidAmount < 0`. | - Ném ngoại lệ `IllegalArgumentException: Paid amount cannot be negative`.<br>- Không có đơn hàng nào được tạo. | `SalesOrderServiceTest.createRejectsNegativePaidAmount` |
| **TC-DEBT-06** | Khách hàng thuộc hộ kinh doanh khác | `businessId = 1`, nhưng `customer.businessId = 2` | 1. Gọi ghi nhận công nợ với ID khách hàng khác tenant. | - Ném ngoại lệ `ResourceNotFoundException: Customer not found`.<br>- Không can thiệp dữ liệu chéo tenant. | `DebtBookkeepingServiceTest.recordDebtIncrease_tenantMismatch` |

---

### Nhóm 2: Thanh toán công nợ (Debt Payment Processing)

| Test Case ID | Tên kịch bản | Điều kiện đầu vào | Các bước thực hiện | Kết quả mong đợi | Test Code tương ứng |
|---|---|---|---|---|---|
| **TC-PAY-01** | Thanh toán công nợ một phần | Đơn CONFIRMED đang nợ 175.000đ. Khách hàng nợ 175.000đ. | 1. Gọi `POST /api/payments` với `amount = 75.000đ`, `paymentMethod = CASH`. | - `SalesOrder.paidAmount` tăng thành 200.000đ.<br>- `SalesOrder.debtAmount` giảm còn 100.000đ.<br>- `paymentStatus = PARTIALLY_PAID`.<br>- Tạo `DebtTransaction` loại `PAYMENT`, `amount = 75.000đ`, `balanceAfter = 100.000đ`.<br>- `Customer.debtBalance` giảm về 100.000đ. | `PaymentControllerTest.createPayment_success`<br>`PaymentServiceTest.createPaymentSynchronizesCustomerDebtBalance` |
| **TC-PAY-02** | Thanh toán hết nợ của đơn hàng (Paid in full) | Đơn CONFIRMED đang nợ 100.000đ. Khách hàng nợ 100.000đ. | 1. Gọi `POST /api/payments` với `amount = 100.000đ`. | - `SalesOrder.debtAmount = 0đ`.<br>- `SalesOrder.paymentStatus = PAID`.<br>- `Customer.debtBalance = 0đ`.<br>- Tạo `DebtTransaction` loại `PAYMENT` với `balanceAfter = 0đ`. | `DebtBookkeepingServiceTest.recordPayment_paidInFull` |
| **TC-PAY-03** | Từ chối thanh toán khi đơn chưa CONFIRMED | Đơn hàng trạng thái `DRAFT` | 1. Gọi `makePayment` trên đơn hàng `DRAFT`. | - Ném ngoại lệ `IllegalStateException: Only CONFIRMED orders can receive payments`.<br>- Không phát sinh thanh toán. | `SalesOrderServiceTest.makePaymentRejectsWhenOrderNotConfirmed` |
| **TC-PAY-04** | Từ chối thanh toán khi đơn đã trả hết | Đơn hàng trạng thái `CONFIRMED` nhưng `paymentStatus = PAID` và `debtAmount = 0` | 1. Gọi `makePayment` trên đơn đã thanh toán xong. | - Ném ngoại lệ `IllegalStateException: Order is already paid in full`. | `SalesOrderServiceTest.makePaymentRejectsWhenOrderAlreadyPaid` |
| **TC-PAY-05** | Từ chối thanh toán số tiền <= 0 | Đơn hàng đang nợ 100.000đ | 1. Gọi thanh toán với `amount = 0` hoặc `amount = -10.000đ`. | - Ném ngoại lệ `IllegalArgumentException: Payment amount must be greater than zero`. | `SalesOrderServiceTest.makePaymentRejectsWhenAmountZeroOrNegative` |
| **TC-PAY-06** | Từ chối thanh toán vượt quá số nợ của đơn hàng | Đơn hàng đang nợ 100.000đ | 1. Gọi thanh toán với `amount = 150.000đ`. | - Ném ngoại lệ `IllegalArgumentException: Payment amount (150000) exceeds remaining debt amount (100000)`. | `SalesOrderServiceTest.makePaymentRejectsWhenAmountExceedsDebtAmount`<br>`PaymentControllerTest.createPayment_amountExceedsDebt_throws` |
| **TC-PAY-07** | Từ chối thanh toán vượt quá tổng công nợ khách hàng | Đơn hàng nợ 200.000đ, nhưng khách hàng chỉ còn nợ 50.000đ | 1. Gọi thanh toán nợ 100.000đ cho đơn. | - Ném ngoại lệ `IllegalArgumentException: Payment amount exceeds customer debt balance`. | `DebtBookkeepingServiceTest.recordPayment_exceedsRemaining` |
| **TC-PAY-08** | Từ chối thanh toán đơn hàng bị hủy | Đơn hàng trạng thái `CANCELLED` | 1. Gọi `POST /api/payments` cho đơn hàng đã hủy. | - Ném ngoại lệ `IllegalStateException: Cannot process payment for cancelled order`. | `PaymentControllerTest.createPayment_cancelledOrder_throws` |
| **TC-PAY-09** | Từ chối thanh toán đơn/khách khác tenant | Đơn hàng hoặc khách hàng thuộc `businessId` khác | 1. Gọi `POST /api/payments` từ tài khoản hộ kinh doanh khác. | - Ném ngoại lệ `ResourceNotFoundException: Order not found` hoặc `Customer not found`. | `PaymentControllerTest.createPayment_orderNotInBusiness_throws`<br>`PaymentControllerTest.createPayment_customerNotInBusiness_throws` |

---

### Nhóm 3: Hủy đơn hàng và Đảo công nợ (Order Cancellation & Debt Reversal)

| Test Case ID | Tên kịch bản | Điều kiện đầu vào | Các bước thực hiện | Kết quả mong đợi | Test Code tương ứng |
|---|---|---|---|---|---|
| **TC-CANCEL-01** | Hủy đơn hàng có công nợ thành công | Đơn CONFIRMED đang nợ 150.000đ. Khách hàng nợ 150.000đ. | 1. Gọi `SalesOrderService.cancelSalesOrder`.<br>2. Kiểm tra số dư và giao dịch nợ. | - Đơn hàng chuyển `status = CANCELLED`, `debtAmount = 0đ`.<br>- Tự động sinh `DebtTransaction` loại `VOID` với `amount = 150.000đ`.<br>- `balanceAfter` của giao dịch `VOID` = 0đ.<br>- `Customer.debtBalance` giảm về 0đ.<br>- Hàng tồn kho được hoàn trả lại kho. | `SalesOrderServiceTest.cancelWithDebtDelegatesToDebtBookkeepingService`<br>`DebtBookkeepingServiceTest.recordDebtVoid_success` |
| **TC-CANCEL-02** | Khóa phòng chống Deadlock khi thanh toán và hủy đơn | Đồng thời thao tác thanh toán hoặc hủy đơn | 1. Gọi `makePayment` hoặc `cancelSalesOrder`.<br>2. Kiểm tra thứ tự gọi khóa hàng. | - Luôn khóa `SalesOrder` (`findForUpdateByIdAndBusinessId`) trước.<br>- Sau đó mới khóa `Customer` (`findForUpdateByIdAndBusinessId`).<br>- Thứ tự cố định ngăn ngừa triệt để tình trạng Deadlock. | `SalesOrderServiceTest.makePaymentLocksOrderBeforeCustomer`<br>`SalesOrderServiceTest.cancelLocksOrderBeforeCustomer` |
| **TC-CANCEL-03** | Rollback khi đảo nợ gây số dư âm bất thường | Số dư khách hàng nhỏ hơn số nợ cần đảo | 1. Gọi `cancelSalesOrder` trong điều kiện số dư nợ bị sai lệch. | - Giao dịch đảo nợ bị chặn, toàn bộ thao tác hủy đơn bị `ROLLBACK`. | `SalesOrderServiceTest.cancelRejectsWhenDebtVoidFailsNegativeBalance` |

---

### Nhóm 4: Lịch sử và Báo cáo công nợ (History & Summary Queries)

| Test Case ID | Tên kịch bản | Điều kiện đầu vào | Các bước thực hiện | Kết quả mong đợi | Test Code tương ứng |
|---|---|---|---|---|---|
| **TC-HIST-01** | Lấy lịch sử công nợ khách hàng (Sắp xếp & Thông tin đầy đủ) | Khách hàng có 3 giao dịch: `DEBT_INCREASE`, `PAYMENT`, `VOID` | 1. Gọi `GET /api/payments/customers/{id}/history?page=0&size=20`. | - HTTP 200 OK.<br>- Danh sách trả về được sắp xếp theo `transactionDate DESC, id DESC`.<br>- Trả về đầy đủ: `transactionCode`, `orderCode`, `customerId`, `customerName`, `transactionType`, `amount`, `balanceAfter`, `paymentMethod`, `referenceNumber`, `status`.<br>- Giao dịch `VOID` vẫn hiển thị đầy đủ trong lịch sử. | `PaymentControllerTest.getCustomerPaymentHistory_success` |
| **TC-HIST-02** | Xác thực phân trang lịch sử công nợ | Gọi API lịch sử với `size = 150` (> 100) hoặc `page = -1` | 1. Gọi `GET /api/payments/customers/{id}/history?page=-1` hoặc `size=150`. | - Ném ngoại lệ `IllegalArgumentException: Page index must not be less than zero` hoặc `Page size must not exceed 100`.<br>- HTTP 400 Bad Request. | `PaymentControllerTest.getCustomerPaymentHistory_sizeExceedsMax_throws` |
| **TC-HIST-03** | Bảo mật truy vấn lịch sử công nợ theo Tenant | Khách hàng thuộc `businessId = 2`, người gọi thuộc `businessId = 1` | 1. Gọi `GET /api/payments/customers/{id}/history`. | - Ném ngoại lệ `ResourceNotFoundException: Customer not found`.<br>- HTTP 404 Not Found. | `PaymentControllerTest.getCustomerPaymentHistory_wrongBusiness_throws` |
| **TC-SUMM-01** | Báo cáo tổng hợp công nợ khách hàng | Khách phát sinh nợ 60tr, đã trả 600k, đã đảo nợ 59.4tr | 1. Gọi `GET /api/payments/customers/{id}/debt-summary`. | - HTTP 200 OK.<br>- `totalDebtIncreased = 60.000.000`.<br>- `totalPaid = 600.000`.<br>- `totalVoid = 59.400.000`.<br>- `currentBalance = 0.00`. | `PaymentControllerTest.getCustomerDebtSummary_success` |
| **TC-SUMM-02** | Lịch sử thanh toán theo đơn hàng | Đơn hàng có 2 đợt thanh toán nợ | 1. Gọi `GET /api/payments/orders/{orderId}`.<br>2. Gọi `GET /api/payments/orders/{orderId}/summary`. | - `GET /api/payments/orders/{orderId}`: Trả về 2 bản ghi `PAYMENT`.<br>- `GET /api/payments/orders/{orderId}/summary`: Trả về `totalAmount`, `paidAmount`, `debtAmount`, `paymentStatus`. | `PaymentControllerTest.getOrderPayments_success`<br>`PaymentControllerTest.getOrderPaymentSummary_success` |

---

## 4. Ma trận truy xuất yêu cầu (Requirements Traceability Matrix - RTM)

| Mã SRS | Yêu cầu nghiệp vụ | Test Cases tương ứng | Unit / Integration Test Class | Trạng thái |
|---|---|---|---|:---:|
| **HBDT-07.3** | Ghi nhận công nợ tự động | TC-DEBT-01, TC-DEBT-02, TC-DEBT-03, TC-DEBT-04, TC-DEBT-05, TC-DEBT-06 | `SalesOrderServiceTest`, `DebtBookkeepingServiceTest` | **PASS** |
| **HBDT-07.4** | Thanh toán công nợ khách hàng | TC-PAY-01, TC-PAY-02, TC-PAY-03, TC-PAY-04, TC-PAY-05, TC-PAY-06, TC-PAY-07, TC-PAY-08, TC-PAY-09 | `PaymentServiceTest`, `PaymentControllerTest`, `SalesOrderServiceTest` | **PASS** |
| **HBDT-07.5** | Lịch sử & Tổng hợp công nợ | TC-HIST-01, TC-HIST-02, TC-HIST-03, TC-SUMM-01, TC-SUMM-02 | `PaymentControllerTest`, `DebtTransactionRepository` | **PASS** |
| **HBDT-08.4** | Đảo nợ khi hủy đơn hàng | TC-CANCEL-01, TC-CANCEL-02, TC-CANCEL-03 | `SalesOrderServiceTest`, `DebtBookkeepingServiceTest` | **PASS** |

---

## 5. Kết quả thực thi kiểm thử (Test Execution Summary)

- **Tổng số bài kiểm thử tự động**: **216 tests**.
- **Kết quả**: **216 passed**, **0 failures**, **0 errors**, **0 skipped**.
- **Thời gian chạy**: ~8.5 giây.
- **Đánh giá chất lượng**: Toàn bộ luồng công nợ tự động (HBDT-66) đạt 100% tiêu chí nghiệm thu, không có hồi quy và tuân thủ tuyệt đối kiến trúc bảo mật đa tenant.

> Số liệu trên áp dụng cho phạm vi HBDT-66. Các bổ sung ở mục 6–8 chưa đưa vào con số tổng này; cần chạy lại `.\mvnw.cmd test` và `pytest` rồi cập nhật.

---

## 6. Bổ sung: Module Trợ lý AI tạo đơn nháp (AI Draft Order)

Phần này bổ sung test case cho các tính năng mới của nhánh `feature/AI_Service`, **không** thuộc phạm vi HBDT-66 ở trên.

### 6.1. Phạm vi

- Backend Spring Boot: `/api/ai/parse-order`, `/api/ai/drafts`, `/api/ai/drafts/{id}/reject`, `/api/ai/draft-bookkeeping`, `/api/ai/health`.
- AI Service (Python/FastAPI): `/health`, `/api/v1/ai/ready`, `/api/v1/ai/parse-order`, `/api/v1/ai/draft-bookkeeping`.
- Lưu trữ: bảng `ai_order_drafts` với trạng thái `PENDING` / `REJECTED` / `CONFIRMED`.
- Bảo vệ: feature `AI_ASSISTANT` + `@PreAuthorize` theo vai trò; AI service yêu cầu header `X-API-Secret`.
- Lệnh chạy: `.\mvnw.cmd test` trong `Code/Server`; `pytest` trong `Code/AI`.

### 6.2. Nhóm 1: Trích xuất và đối chiếu dữ liệu (Extraction & Resolution)

| Test Case ID | Tên kịch bản | Điều kiện đầu vào | Kết quả mong đợi | Test Code tương ứng |
|---|---|---|---|---|
| **TC-AI-01** | Đối chiếu sản phẩm/giá bằng dữ liệu thật của hộ | Câu nhập có sản phẩm tồn tại, giá đã cấu hình trong DB | Proposal dùng `businessId` từ phiên đăng nhập và **giá trong database**, không dùng giá do AI trả về | `AiServiceTest.usesAuthenticatedBusinessAndDatabasePricesForProposal` |
| **TC-AI-02** | Nhiều sản phẩm cùng khớp thì không tự chọn | Câu nhập khớp từ 2 sản phẩm trở lên | **Không** tự chọn sản phẩm đầu tiên; trả về mục cần làm rõ | `AiServiceTest.neverChoosesFirstOfMultipleProducts` |
| **TC-AI-03** | Khách hàng nhập nhằng không dùng cho đơn ghi nợ | Câu ghi nợ nhưng tên khách khớp nhiều hồ sơ | Proposal không gán khách hàng nhập nhằng cho đơn ghi nợ | `AiServiceTest.debtCannotUseAmbiguousCustomer` |
| **TC-AI-04** | Khớp khách hàng khi AI bỏ dấu/khoảng trắng | Tên khách viết liền, không dấu | Khớp đúng khi chỉ có **một** kết quả phù hợp | `AiServiceTest.matchesCustomerWhenAiOmitsAccentsAndSpaces` |
| **TC-AI-05** | Khách hàng chưa tồn tại | Tên khách không có trong hệ thống | Proposal vẫn trả về kèm cờ `customerNeedsCreation = true`, **không** tạo khách hàng ở bước này | `AiServiceTest.marksUnknownCustomerForCreationWithoutBlockingProposal` |
| **TC-AI-06** | Không thay đơn vị khách đã nêu bằng đơn vị gốc | Câu nêu đơn vị không khớp cấu hình sản phẩm | Giữ đơn vị người dùng nêu và gắn cảnh báo, không tự đổi sang đơn vị cơ bản | `AiServiceTest.doesNotReplaceAnExplicitMismatchedUnitWithBaseUnit` |
| **TC-AI-07** | Thiếu đơn vị thì dùng đơn vị cơ bản | Câu không nêu đơn vị | Dùng đơn vị cơ bản đã cấu hình và **không** sinh cảnh báo trùng lặp | `AiServiceTest.missingSpokenUnitUsesConfiguredBaseUnitWithoutDuplicateWarning` |
| **TC-AI-08** | Tổng số lượng nhiều dòng không vượt tồn kho | 2 dòng cùng sản phẩm, tổng vượt tồn | Gắn cảnh báo vượt tồn trên **tổng** số lượng | `AiServiceTest.combinedLinesCannotExceedAvailableStock` |
| **TC-AI-09** | Số lượng thập phân được chuyển cho pricing kiểm tra | Sản phẩm bán theo đơn vị lẻ | Số lượng thập phân được đưa sang `ProductPricingService` để kiểm tra theo đơn vị | `AiQuantityValidationTest.fractionalQuantityCanReachPricingServiceForUnitSpecificValidation` |
| **TC-AI-10** | Câu hỏi luật không tạo đơn | Câu hỏi về luật/thủ tục | Không tạo đơn, không truy vấn danh mục của hộ | `AiServiceTest.legalQuestionDoesNotCreateOrderOrSearchBusinessData` |
| **TC-AI-11** | Không có hộ kinh doanh thì không gọi provider | Người dùng không thuộc hộ nào | Từ chối **trước khi** gọi provider (không phát sinh chi phí) | `AiServiceTest.rejectsMissingBusinessBeforeBillableRequest` |

### 6.3. Nhóm 2: Lưu đơn nháp, duyệt/từ chối và bảo mật (Draft Workflow)

| Test Case ID | Tên kịch bản | Điều kiện đầu vào | Kết quả mong đợi | Test Code tương ứng |
|---|---|---|---|---|
| **TC-AI-12** | Lưu đơn nháp ở trạng thái `PENDING` | Gọi `POST /api/ai/parse-order` thành công | Tạo bản ghi `ai_order_drafts` với `status = PENDING`, lưu `source_text` + `proposal_json`, gửi notification cho hộ | `AiServiceTest` (nhánh tạo draft) |
| **TC-AI-13** | Xác nhận đơn thì draft chuyển `CONFIRMED` | Gọi `POST /api/sales-orders` kèm `aiDraftId` của draft `PENDING` | Đơn hàng được tạo; draft chuyển `CONFIRMED` và gắn `sales_order_id` | `SalesOrderServiceTest` (luồng gắn `aiDraftId`) |
| **TC-AI-14** | Từ chối draft kèm lý do bắt buộc | Gọi `POST /api/ai/drafts/{id}/reject` với `reason` hợp lệ | Draft chuyển `REJECTED`, lưu `rejection_reason` | `AiServiceTest`, `AiControllerSecurityTest` |
| **TC-AI-15** | Chỉ từ chối được draft `PENDING` | Draft đã `REJECTED` hoặc `CONFIRMED` | Yêu cầu bị từ chối, trạng thái không đổi | `AiServiceTest` |
| **TC-AI-16** | Vai trò được phép gọi endpoint AI | EMPLOYEE và OWNER gọi `/api/ai/**` | Cho phép truy cập | `AiControllerSecurityTest.aiEndpointsAllowEmployeeAndOwner` |
| **TC-AI-17** | Không lộ nội dung lỗi thô từ provider | Provider trả lỗi | Thông báo lỗi được làm sạch, **không** lộ raw body của B.ai | `AiExtractionClientTest.providerFailureNeverExposesRawBody` |
| **TC-AI-18** | Mapping snake_case giữa Python và Java | Payload từ AI service dùng snake_case | Java deserialize đúng các trường snake_case | `AiExtractionClientTest.preservesSnakeCaseFieldsAcrossPythonAndJava` |

### 6.4. Nhóm 3: AI Service (Python/FastAPI)

| Test Case ID | Tên kịch bản | Kết quả mong đợi | Test Code tương ứng |
|---|---|---|---|
| **TC-AIPY-01** | Yêu cầu header `X-API-Secret` | Thiếu/sai secret → `401`; chưa cấu hình secret → `503` | `test_bai.py::test_authentication_is_required` |
| **TC-AIPY-02** | Thiếu API key thì không gọi provider | Không gọi B.ai, trả lỗi cấu hình | `test_bai.py::test_missing_key_never_calls_provider` |
| **TC-AIPY-03** | Output sai/thiếu bị chặn (fail closed) | Trả lỗi thay vì trả dữ liệu thiếu | `test_bai.py::test_invalid_and_truncated_outputs_fail_closed` |
| **TC-AIPY-04** | Lỗi provider được làm sạch | Không lộ chi tiết nội bộ/raw body | `test_bai.py::test_provider_errors_are_sanitized` |
| **TC-AIPY-05** | Timeout không thử lại yêu cầu đã tính phí | Không retry để tránh phát sinh chi phí | `test_bai.py::test_timeout_does_not_retry_paid_request` |
| **TC-AIPY-06** | `parse-order` không ghi database | Chỉ trả kết quả trích xuất | `test_bai.py::test_route_returns_extraction_without_database_write` |
| **TC-AIPY-07** | `/health` không khẳng định provider đã sẵn sàng | Chỉ trả trạng thái dịch vụ | `test_bai.py::test_health_does_not_claim_live_provider_is_ready` |
| **TC-AIPY-08** | Validate input | `text` rỗng bị từ chối; trường lạ bị từ chối | `test_bai.py::test_empty_text_and_unknown_fields_rejected` |
| **TC-AIPY-09** | Nhận xét bookkeeping lấy số liệu từ backend | AI không tự tính lại số | `test_bai.py::test_bookkeeping_draft_preserves_backend_as_source_of_numbers` |
| **TC-AIPY-10** | Cấu hình B.ai độc lập với provider cũ | Không đọc nhầm credential của provider khác | `test_bai.py::test_bai_credentials_are_isolated_from_previous_provider` |

---

## 7. Bổ sung: Module Kế toán & Thuế TT88 (S1-HKD, S2-HKD, S4-HKD)

### 7.1. Nhóm 1: Lập sổ và điền biểu mẫu

| Test Case ID | Tên kịch bản | Điều kiện đầu vào | Kết quả mong đợi | Test Code tương ứng |
|---|---|---|---|---|
| **TC-ACC-01** | Lập S1, S2, S4 từ dữ liệu nguồn | Có đơn `CONFIRMED`, phiếu nhập, giao dịch kho, nghĩa vụ thuế trong kỳ | Ba sổ được dựng đúng từ các sự kiện nguồn đã xác nhận | `StatutoryAccountingServiceTest.buildsS1S2AndS4FromConfirmedSourceEvents` |
| **TC-ACC-02** | Chỉ tính dữ liệu đã xác nhận | Có đơn `DRAFT` / `CANCELLED` trong kỳ | Chứng từ chưa xác nhận **không** vào sổ | `StatutoryAccountingServiceTest` |
| **TC-ACC-03** | Tự động điền biểu mẫu theo cấu trúc phiên bản | Biểu mẫu đang hiệu lực có cấu trúc cột doanh thu | Các cột có mapping được điền số liệu thật | `AccountingTemplateFillServiceTest.fillsConfiguredRevenueColumnsAndWarnsForUnmappedRequiredColumn` |
| **TC-ACC-04** | Cột bắt buộc chưa mapping thì cảnh báo | Cấu trúc biểu mẫu có cột bắt buộc chưa cấu hình nguồn | Hệ thống trả **cảnh báo** thay vì điền sai | `AccountingTemplateFillServiceTest.fillsConfiguredRevenueColumnsAndWarnsForUnmappedRequiredColumn` |

### 7.2. Nhóm 2: Kiểm tra/duyệt báo cáo và nộp thuế

| Test Case ID | Tên kịch bản | Điều kiện đầu vào | Kết quả mong đợi |
|---|---|---|---|
| **TC-ACC-05** | Lưu kết quả kiểm tra báo cáo | Owner gọi `POST /api/accounting/books/review` | Tạo bản ghi `accounting_report_reviews` kèm `status`, `review_note`, `reviewed_by`, `data_signature` |
| **TC-ACC-06** | Dữ liệu đổi sau khi duyệt | Số liệu kỳ thay đổi sau lần duyệt | `data_signature` tính lại khác giá trị đã lưu → báo cáo được coi là đã cũ |
| **TC-ACC-07** | Lưu vết nhiều lần kiểm tra | Owner kiểm tra cùng kỳ nhiều lần | Mỗi lần tạo **một bản ghi mới**, không ghi đè bản cũ |
| **TC-ACC-08** | Ghi nhận nộp thuế | `POST /api/accounting/books/tax-payments` với `paymentAmount > 0` | Tạo `tax_payments`, cập nhật số đã nộp và số còn phải nộp của S4-HKD |
| **TC-ACC-09** | Từ chối số tiền nộp không hợp lệ | `paymentAmount <= 0` | Yêu cầu bị từ chối (`@DecimalMin("0.01")`), không tạo bản ghi |
| **TC-ACC-10** | Nộp thừa được biểu diễn bằng số âm | Tổng đã nộp > số phát sinh | Số còn phải nộp âm, thể hiện **nộp thừa** |
| **TC-ACC-11** | Phân quyền thao tác ghi | EMPLOYEE gọi `review` hoặc `tax-payments` | Bị từ chối (chỉ `BUSINESS_OWNER` / `OWNER`) |

### 7.3. Nhóm 3: Quản trị biểu mẫu báo cáo (Admin)

| Test Case ID | Tên kịch bản | Kết quả mong đợi |
|---|---|---|
| **TC-TPL-01** | Tạo biểu mẫu mới | Biểu mẫu được tạo ở trạng thái `ACTIVE` |
| **TC-TPL-02** | Từ chối mã biểu mẫu trùng | Trả lỗi `Mã biểu mẫu đã tồn tại` |
| **TC-TPL-03** | Từ chối loại biểu mẫu không hợp lệ | Trả lỗi `Loại biểu mẫu không hợp lệ` |
| **TC-TPL-04** | Phát hành phiên bản mới | Phiên bản mới `ACTIVE`; phiên bản trước bị đặt `effectiveTo = effectiveFrom − 1 ngày` và chuyển `INACTIVE` |
| **TC-TPL-05** | Từ chối ngày hiệu lực không hợp lệ | Ngày mới không sau phiên bản gần nhất → báo lỗi |
| **TC-TPL-06** | Từ chối số phiên bản trùng | Trả lỗi `Phiên bản biểu mẫu đã tồn tại` |
| **TC-TPL-07** | Chỉ ADMIN truy cập được | Vai trò khác nhận `403` |

> **Khoảng trống kiểm thử:** nhóm 7.3 hiện **chưa có test class tự động** (chưa có `ReportTemplateAdminServiceTest`). Cần bổ sung trước khi đánh dấu PASS.

---

## 8. Tổng hợp bổ sung

| Module | Test class / file | Ghi chú |
|---|---|---|
| Đơn nháp AI (backend) | `AiServiceTest`, `AiQuantityValidationTest`, `AiControllerSecurityTest`, `AiExtractionClientTest` | JUnit 5 + Mockito |
| AI Service (Python) | `Code/AI/tests/test_bai.py` | pytest |
| Sổ kế toán TT88 | `StatutoryAccountingServiceTest`, `AccountingTemplateFillServiceTest` | JUnit 5 |
| Quản trị biểu mẫu | *(chưa có)* | **Cần bổ sung** `ReportTemplateAdminServiceTest` cho nhóm 7.3 |
| Công nợ & thanh toán (HBDT-66) | Xem mục 3 | Đã PASS |
