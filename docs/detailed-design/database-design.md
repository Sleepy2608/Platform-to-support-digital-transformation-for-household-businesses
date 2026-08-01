# THIẾT KẾ CƠ SỞ DỮ LIỆU
## Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh

| Thuộc tính | Nội dung |
|---|---|
| Tên hệ thống | Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh |
| Tên tiếng Anh | Platform to Support Digital Transformation for Household Businesses |
| Hệ quản trị cơ sở dữ liệu | MySQL 8.x |
| Storage Engine | InnoDB |
| Character Set | `utf8mb4` |
| Collation | `utf8mb4_0900_ai_ci` |
| Mô hình dữ liệu | Cơ sở dữ liệu quan hệ, multi-tenant dùng chung schema |
| Quy mô đã xác minh | **33 bảng, 68 khóa ngoại, 10 trigger** |
| Phiên bản tài liệu | 2.0 |

---

## 1. Mục đích tài liệu

Tài liệu mô tả thiết kế cơ sở dữ liệu của **Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh**.

Cơ sở dữ liệu được xây dựng để hỗ trợ các nghiệp vụ chính:

- quản lý hộ kinh doanh, tài khoản và phân quyền;
- quản lý sản phẩm, danh mục, nhiều đơn vị tính và giá bán;
- quản lý nhập kho, xuất kho, tồn kho và giá trị hàng tồn;
- lập đơn hàng tại quầy;
- quản lý khách hàng, thanh toán và công nợ;
- tiếp nhận nội dung văn bản hoặc giọng nói để AI tạo đơn hàng nháp;
- tự động ghi nhận dữ liệu vào sổ kế toán;
- quản lý phiên bản biểu mẫu và báo cáo;
- quản lý nghĩa vụ thuế và các lần nộp thuế;
- quản trị hệ thống, thông báo, phản hồi và nhật ký kiểm toán.

Thiết kế ưu tiên:

1. tính nhất quán của dữ liệu;
2. phân tách dữ liệu giữa các hộ kinh doanh;
3. khả năng truy vết giao dịch;
4. bảo toàn lịch sử;
5. khả năng mở rộng;
6. hiệu năng phù hợp với phạm vi đồ án.

---

## 2. Phạm vi triển khai

### 2.1. Phạm vi nghiệp vụ

Cơ sở dữ liệu hiện tại hỗ trợ:

- tài khoản Employee, Owner và Administrator;
- sản phẩm, đơn vị tính, quy tắc giá;
- đơn hàng tại quầy và đơn hàng nháp do AI tạo;
- nhập kho, xuất kho và tồn kho;
- khách hàng và công nợ;
- lịch sử thanh toán công nợ;
- biểu mẫu, sổ kế toán và báo cáo;
- nghĩa vụ thuế và các lần nộp thuế;
- thông báo, phản hồi, cấu hình và audit log.

### 2.2. Phạm vi học thuật theo Thông tư 88

Trong phạm vi học thuật được giảng viên xác nhận, hệ thống triển khai ba mẫu:

- **S1-HKD – Sổ chi tiết doanh thu**;
- **S2-HKD – Sổ chi tiết vật liệu, dụng cụ, sản phẩm, hàng hóa**;
- **S4-HKD – Sổ chi tiết nghĩa vụ thuế**.

Các mẫu sau không thuộc phạm vi hiện tại:

- S3-HKD – Chi phí sản xuất, kinh doanh;
- S5-HKD – Tiền lương;
- S6-HKD – Quỹ tiền mặt;
- S7-HKD – Tiền gửi ngân hàng.

Hệ thống không tuyên bố tự động xác định đầy đủ mọi nghĩa vụ pháp lý. Số thuế được tính từ dữ liệu và tỷ lệ cấu hình phải được Owner kiểm tra trước khi xác nhận.

### 2.3. Nội dung chưa triển khai

- chấm công và tính lương;
- quản lý chi phí đầy đủ;
- quỹ tiền mặt hoàn chỉnh;
- tài khoản và đối soát ngân hàng;
- kê khai hoặc nộp thuế điện tử;
- kết nối trực tiếp với cơ quan thuế;
- tích hợp hóa đơn điện tử với nhà cung cấp bên ngoài;
- phân bổ một khoản thanh toán cho nhiều đơn hàng;
- xử lý hoàn tiền phức tạp.

---

## 3. Lựa chọn công nghệ và mô hình dữ liệu

### 3.1. MySQL 8 và InnoDB

MySQL 8 được lựa chọn vì hỗ trợ:

- transaction theo nguyên tắc ACID;
- khóa chính và khóa ngoại;
- unique index và check constraint;
- trigger;
- row-level locking;
- kiểu dữ liệu JSON;
- Unicode tiếng Việt;
- khả năng tích hợp tốt với Java và Spring Boot.

InnoDB được sử dụng cho toàn bộ bảng nhằm bảo đảm transaction, khóa ngoại và khả năng phục hồi khi giao dịch thất bại.

### 3.2. Mô hình cơ sở dữ liệu quan hệ

Mô hình quan hệ phù hợp vì dữ liệu có nhiều liên kết nghiệp vụ rõ ràng:

```text
Hộ kinh doanh → Người dùng
Đơn hàng → Chi tiết đơn hàng
Khách hàng → Công nợ
Sản phẩm → Đơn vị tính
Phiếu nhập → Chi tiết phiếu nhập
Nhóm hoạt động tính thuế → Sản phẩm và chi tiết đơn hàng
Nghĩa vụ thuế → Lần nộp thuế
Biểu mẫu → Phiên bản biểu mẫu
Sổ kế toán → Dòng sổ
```

Khóa ngoại giúp hạn chế dữ liệu mồ côi và bảo đảm bản ghi tham chiếu tồn tại.

### 3.3. Mô hình multi-tenant

Hệ thống sử dụng mô hình:

> **Shared Database – Shared Schema – Tenant Key**

Bảng `businesses` đại diện cho từng hộ kinh doanh. Các bảng nghiệp vụ quan trọng sử dụng `business_id` để phân tách dữ liệu.

Ưu điểm:

- dễ triển khai và vận hành;
- phù hợp với nhiều hộ kinh doanh nhỏ;
- giảm chi phí tài nguyên;
- hỗ trợ Administrator tổng hợp dữ liệu toàn nền tảng;
- dễ mở rộng khi có hộ kinh doanh mới.

MySQL không tự áp dụng row-level security theo tenant. Vì vậy, backend phải lấy `business_id` từ phiên đăng nhập đã xác thực và đưa vào mọi truy vấn nghiệp vụ.

---

## 4. Chuẩn hóa và lưu snapshot

Phần lớn thiết kế được chuẩn hóa gần mức 3NF:

- đơn hàng tách khỏi chi tiết đơn hàng;
- phiếu nhập tách khỏi chi tiết phiếu nhập;
- sản phẩm tách khỏi đơn vị và quy tắc giá;
- biểu mẫu tách khỏi phiên bản biểu mẫu;
- nghĩa vụ thuế tách khỏi các lần nộp thuế.

Một số dữ liệu được lưu lặp có chủ đích để bảo toàn lịch sử và tăng tốc truy vấn.

### 4.1. Snapshot giá bán

`sales_order_items.unit_price` lưu giá tại thời điểm bán. Khi bảng giá thay đổi, đơn hàng đã xác nhận không bị thay đổi theo.

### 4.2. Snapshot nhóm và tỷ lệ tính thuế

`products.default_tax_activity_group_id` chỉ là nhóm mặc định của sản phẩm.

Khi sản phẩm được thêm vào đơn hàng, backend sao chép sang:

```text
sales_order_items.tax_activity_group_id
sales_order_items.vat_calculation_rate
sales_order_items.pit_calculation_rate
```

Nhờ đó, thay đổi tỷ lệ trong tương lai không làm sai lệch dữ liệu của đơn hàng cũ.

### 4.3. Số dư hiện tại và nhật ký giao dịch

`inventory_transactions` là lịch sử biến động kho.

`inventory_balances` lưu số dư hiện tại để truy vấn nhanh.

Các giá trị phải được cập nhật trong cùng transaction để tránh chênh lệch giữa lịch sử và số dư hiện tại.

---

## 5. Tổ chức dữ liệu theo phân hệ

Cơ sở dữ liệu gồm **33 bảng**, chia thành 5 phân hệ.

### 5.1. Business Core – 5 bảng

| Bảng | Chức năng |
|---|---|
| `businesses` | Thông tin hộ kinh doanh, mã số thuế và phương pháp tính giá xuất kho |
| `users` | Tài khoản Employee, Owner và Administrator |
| `roles` | Vai trò và nền tảng triển khai RBAC |
| `subscription_plans` | Danh mục gói thuê bao |
| `subscriptions` | Lịch sử đăng ký gói của từng hộ kinh doanh |

### 5.2. Product & Inventory Management – 10 bảng

| Bảng | Chức năng |
|---|---|
| `categories` | Danh mục sản phẩm theo hộ kinh doanh |
| `products` | Thông tin sản phẩm và nhóm hoạt động tính thuế mặc định |
| `units` | Danh mục đơn vị tính |
| `product_units` | Đơn vị áp dụng cho sản phẩm và tỷ lệ quy đổi |
| `product_prices` | Quy tắc giá theo đơn vị, số lượng và thời gian |
| `stock_imports` | Phiếu nhập kho |
| `stock_import_items` | Chi tiết phiếu nhập |
| `inventory_balances` | Số lượng, đơn giá bình quân và giá trị tồn hiện tại |
| `inventory_transactions` | Lịch sử nhập, xuất, điều chỉnh và giá vốn |
| `tax_activity_groups` | Phiên bản nhóm hoạt động và tỷ lệ tính thuế GTGT/TNCN |

`tax_activity_groups` được đặt trong nhóm này vì nó cung cấp cấu hình mặc định cho sản phẩm, đồng thời là dữ liệu nguồn để lập S1-HKD.

### 5.3. Sales & Customer Debt – 4 bảng

| Bảng | Chức năng |
|---|---|
| `customers` | Hồ sơ khách hàng theo từng hộ kinh doanh |
| `sales_orders` | Đơn hàng, số đã thanh toán và số còn nợ |
| `sales_order_items` | Sản phẩm, số lượng, giá bán và snapshot tỷ lệ tính thuế |
| `debt_transactions` | Phát sinh nợ, trả nợ, điều chỉnh và thông tin giao dịch |

### 5.4. AI & System Operations – 6 bảng

| Bảng | Chức năng |
|---|---|
| `ai_requests` | Yêu cầu văn bản/giọng nói và kết quả trích xuất của AI |
| `notifications` | Thông báo theo người dùng, đơn hàng hoặc yêu cầu AI |
| `feedback` | Phản hồi, khiếu nại hoặc sự cố |
| `announcements` | Thông báo toàn nền tảng hoặc theo vai trò |
| `system_configurations` | Cấu hình hệ thống và AI |
| `audit_logs` | Nhật ký thao tác và dữ liệu trước/sau |

### 5.5. Accounting, Tax & Reporting – 8 bảng

| Bảng | Chức năng |
|---|---|
| `report_templates` | Danh mục biểu mẫu S1-HKD, S2-HKD, S4-HKD và các mẫu khác |
| `report_template_versions` | Phiên bản cấu trúc và thời gian hiệu lực |
| `accounting_books` | Sổ theo hộ kinh doanh, loại sổ và kỳ |
| `accounting_book_entries` | Dòng ghi sổ, nguồn phát sinh và lịch sử điều chỉnh |
| `generated_reports` | Báo cáo đã tạo và trạng thái duyệt |
| `tax_types` | Danh mục loại nghĩa vụ thuế |
| `tax_obligations` | Nghĩa vụ thuế phát sinh theo hộ và kỳ |
| `tax_payments` | Các lần nộp thuế gắn với nghĩa vụ cụ thể |

---

## 6. Các quan hệ nghiệp vụ quan trọng

### 6.1. Tài khoản và hộ kinh doanh

```text
roles 1 ─── N users
businesses 1 ─── N users
businesses 1 ─── N subscriptions
subscription_plans 1 ─── N subscriptions
```

`users.business_id` có thể `NULL` để hỗ trợ Administrator cấp nền tảng.

### 6.2. Sản phẩm, đơn vị và nhóm hoạt động tính thuế

```text
businesses 1 ─── N products
categories 1 ─── N products
units 1 ─── N products
products 1 ─── N product_units
units 1 ─── N product_units
product_units 1 ─── N product_prices
tax_activity_groups 1 ─── N products
tax_activity_groups 1 ─── N sales_order_items
```

Quan hệ với `products` là cấu hình mặc định. Quan hệ với `sales_order_items` là dữ liệu lịch sử tại thời điểm bán.

### 6.3. Bán hàng

```text
businesses 1 ─── N sales_orders
customers 1 ─── N sales_orders
users 1 ─── N sales_orders
sales_orders 1 ─── N sales_order_items
products 1 ─── N sales_order_items
units 1 ─── N sales_order_items
```

Khách mua lẻ có thể không có `customer_id`. Khi `debt_amount > 0`, khách hàng là bắt buộc.

### 6.4. Kho

```text
stock_imports 1 ─── N stock_import_items
products 1 ─── N stock_import_items
products 1 ─── N inventory_balances
products 1 ─── N inventory_transactions
```

`inventory_transactions` là nhật ký gốc. `inventory_balances` là số dư hiện tại được lưu để đọc nhanh.

### 6.5. Công nợ và thanh toán

```text
customers 1 ─── N debt_transactions
sales_orders 1 ─── N debt_transactions
users 1 ─── N debt_transactions
```

Trong phạm vi 33 bảng:

- `sales_orders.paid_amount` lưu số tiền thanh toán ngay tại thời điểm bán;
- `debt_transactions` lưu phát sinh nợ, trả nợ và điều chỉnh;
- `transaction_code`, `payment_method`, `reference_number` và `transaction_date` hỗ trợ nhật ký thanh toán công nợ.

Thiết kế chưa hỗ trợ phân bổ một khoản thanh toán cho nhiều đơn hàng hoặc hoàn tiền phức tạp. Nếu yêu cầu này xuất hiện, cần bổ sung mô hình thanh toán riêng.

### 6.6. AI Draft Order

```text
users 1 ─── N ai_requests
ai_requests 0..1 ─── 1 sales_orders
ai_requests 1 ─── N notifications
sales_orders 1 ─── N notifications
```

AI chỉ tạo đơn ở trạng thái `DRAFT`. Employee hoặc Owner phải kiểm tra trước khi xác nhận.

### 6.7. Thuế

```text
tax_types 1 ─── N tax_obligations
businesses 1 ─── N tax_obligations
users 1 ─── N tax_obligations
tax_obligations 1 ─── N tax_payments
users 1 ─── N tax_payments
```

Mỗi lần nộp thuế được gắn với một nghĩa vụ thuế cụ thể.

```text
Đã nộp = SUM(tax_payments.payment_amount)

Còn phải nộp
= tax_obligations.tax_amount
- SUM(tax_payments.payment_amount)
```

Kết quả âm được phép dùng để thể hiện nộp thừa. Không lưu `amount_paid` hoặc `remaining_amount` trong `tax_obligations` nhằm tránh dữ liệu tổng hợp bị lệch.

### 6.8. Kế toán và báo cáo

```text
report_templates 1 ─── N report_template_versions
report_template_versions 1 ─── N accounting_books
accounting_books 1 ─── N accounting_book_entries
report_template_versions 1 ─── N generated_reports
```

`accounting_book_entries.source_type` hỗ trợ:

```text
SALES_ORDER
STOCK_IMPORT
DEBT_TRANSACTION
INVENTORY_TRANSACTION
TAX_OBLIGATION
TAX_PAYMENT
MANUAL_ADJUSTMENT
OPENING_BALANCE
```

Nhờ đó, dòng sổ có thể truy ngược về giao dịch nguồn.

---

## 7. Thiết kế phục vụ S1-HKD, S2-HKD và S4-HKD

### 7.1. S1-HKD – Sổ chi tiết doanh thu

Dữ liệu nguồn:

```text
sales_orders
sales_order_items
products
customers
tax_activity_groups
```

Hệ thống hỗ trợ:

- ngày và mã chứng từ;
- nội dung doanh thu;
- sản phẩm, số lượng và đơn giá bán;
- doanh thu;
- nhóm hoạt động tính thuế;
- tỷ lệ tính thuế GTGT;
- tỷ lệ tính thuế TNCN;
- phân loại doanh thu theo nhóm hoạt động.

Tỷ lệ được snapshot tại `sales_order_items`, vì vậy thay đổi cấu hình sau này không tác động đến đơn hàng đã xác nhận.

### 7.2. S2-HKD – Sổ chi tiết vật liệu, dụng cụ, sản phẩm, hàng hóa

Dữ liệu nguồn:

```text
stock_imports
stock_import_items
inventory_transactions
inventory_balances
products
units
```

Hệ thống hỗ trợ:

- đơn vị tính;
- số lượng nhập, xuất và tồn;
- đơn giá nhập;
- giá trị nhập;
- đơn giá xuất kho;
- giá trị xuất;
- đơn giá và giá trị tồn.

Phương pháp mặc định:

```text
PERIODIC_WEIGHTED_AVERAGE
```

Đây là phương pháp bình quân gia quyền cả kỳ dự trữ.

Các giao dịch kho sử dụng:

```text
cost_status = PROVISIONAL | FINAL
```

- `PROVISIONAL`: giá trị tạm tính trong kỳ;
- `FINAL`: giá trị chính thức sau khi chốt kỳ.

Khi chốt kỳ, backend phải tính hoặc điều chỉnh đơn giá xuất kho và giá trị tồn trong cùng transaction.

### 7.3. S4-HKD – Sổ chi tiết nghĩa vụ thuế

Dữ liệu nguồn:

```text
tax_types
tax_obligations
tax_payments
accounting_book_entries
```

Hệ thống hỗ trợ:

- loại nghĩa vụ thuế;
- kỳ phát sinh;
- mã nghĩa vụ;
- chứng từ;
- doanh thu tính thuế;
- tỷ lệ tính thuế;
- số phải nộp;
- hạn nộp;
- các lần đã nộp;
- số còn phải nộp hoặc nộp thừa.

`tax_obligations` sử dụng:

```text
UNIQUE (business_id, obligation_code)
```

Không đặt unique theo loại thuế và kỳ vì cùng một kỳ có thể có nghĩa vụ ban đầu, bổ sung hoặc điều chỉnh.

---

## 8. Phương pháp tính giá xuất kho

Schema cho phép hai giá trị:

```text
PERIODIC_WEIGHTED_AVERAGE
FIFO
```

Trong phạm vi triển khai hiện tại, hệ thống sử dụng mặc định:

```text
PERIODIC_WEIGHTED_AVERAGE
```

Đơn giá bình quân cả kỳ:

```text
(Tổng giá trị tồn đầu kỳ + Tổng giá trị nhập trong kỳ)
/
(Tổng số lượng tồn đầu kỳ + Tổng số lượng nhập trong kỳ)
```

Luồng chốt kỳ đề xuất:

```text
BEGIN
1. Xác định tồn đầu kỳ.
2. Tổng hợp toàn bộ hàng nhập trong kỳ.
3. Tính đơn giá bình quân cả kỳ.
4. Tính giá trị xuất kho.
5. Tính giá trị tồn cuối kỳ.
6. Cập nhật inventory_transactions.
7. Cập nhật inventory_balances.
8. Chuyển cost_status thành FINAL.
9. Ghi accounting_book_entries.
10. Ghi audit_logs.
COMMIT
```

Nếu một bước thất bại, toàn bộ giao dịch phải `ROLLBACK`.

---

## 9. Chính sách khóa ngoại và xóa dữ liệu

Không sử dụng một quy tắc xóa duy nhất cho toàn hệ thống.

### 9.1. `ON DELETE CASCADE`

Chỉ áp dụng cho dữ liệu con không có ý nghĩa độc lập:

- `sales_orders` → `sales_order_items`;
- `stock_imports` → `stock_import_items`;
- `products` → `product_units`;
- `product_units` → `product_prices`.

### 9.2. `ON DELETE RESTRICT`

Áp dụng cho dữ liệu cần bảo toàn lịch sử:

- hộ kinh doanh với đơn hàng, kho, thuế, sổ và báo cáo;
- khách hàng có công nợ;
- sản phẩm đã phát sinh giao dịch;
- nhóm hoạt động tính thuế đã được snapshot;
- nghĩa vụ thuế có lần nộp thuế;
- sổ có dòng sổ;
- phiên bản biểu mẫu đã được sử dụng;
- báo cáo đã duyệt.

Những dữ liệu này nên chuyển trạng thái thay vì xóa vật lý.

### 9.3. `ON DELETE SET NULL`

Áp dụng cho tham chiếu tùy chọn:

- người tạo;
- người cập nhật;
- người xử lý phản hồi;
- người dùng trong audit log;
- nhóm hoạt động tính thuế mặc định của sản phẩm.

Việc xóa tham chiếu không làm mất bản ghi nghiệp vụ.

---

## 10. Ràng buộc dữ liệu

### 10.1. Khóa chính

Tất cả bảng sử dụng:

```sql
id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
```

Khóa ngoại sử dụng cùng kiểu dữ liệu để tránh lỗi không tương thích.

### 10.2. Ràng buộc duy nhất quan trọng

- `businesses.tax_code`;
- `(activity_code, effective_from)` trong `tax_activity_groups`;
- `(business_id, obligation_code)` trong `tax_obligations`;
- `(business_id, transaction_code)` trong `debt_transactions`;
- cặp sản phẩm–đơn vị;
- mã sản phẩm, khách hàng và đơn hàng theo phạm vi tenant;
- `(business_id, book_code, period_from, period_to)` trong `accounting_books`;
- phiên bản biểu mẫu;
- lần tạo báo cáo.

Các cột nullable có thể có nhiều giá trị `NULL` theo cách xử lý của MySQL.

### 10.3. Check constraint

`CHECK` được dùng cho:

- trạng thái hợp lệ;
- tỷ lệ tính thuế từ 0 đến 100;
- ngày kết thúc không nhỏ hơn ngày bắt đầu;
- số tiền và số lượng hợp lệ;
- phương pháp tính giá xuất kho;
- trạng thái tính giá `PROVISIONAL` hoặc `FINAL`;
- loại nguồn của dòng sổ;
- trạng thái nghĩa vụ thuế.

Quy tắc liên quan nhiều bản ghi được kiểm soát bằng trigger hoặc backend.

---

## 11. Trigger

Hệ thống có **10 trigger**, gồm 5 cặp `BEFORE INSERT` và `BEFORE UPDATE`.

### 11.1. Kiểm tra công nợ đơn hàng

| Trigger | Mục đích |
|---|---|
| `trg_sales_orders_validate_debt_before_insert` | Đơn có nợ phải có khách hàng |
| `trg_sales_orders_validate_debt_before_update` | Không cho cập nhật đơn sang có nợ khi thiếu khách hàng |

Quy tắc:

```text
debt_amount > 0
⇒ customer_id IS NOT NULL
```

### 11.2. Ngăn phiên bản biểu mẫu chồng thời gian

| Trigger | Mục đích |
|---|---|
| `trg_template_versions_no_overlap_insert` | Kiểm tra khi tạo phiên bản biểu mẫu |
| `trg_template_versions_no_overlap_update` | Kiểm tra khi cập nhật phiên bản biểu mẫu |

### 11.3. Kiểm soát điều chỉnh dòng sổ

| Trigger | Mục đích |
|---|---|
| `trg_accounting_book_entries_insert` | Dòng điều chỉnh phải có lý do |
| `trg_accounting_book_entries_update` | Chặn tự tham chiếu và thiếu lý do |

Dữ liệu cũ không bị ghi đè. Dòng điều chỉnh mới liên kết qua `reverses_entry_id`.

### 11.4. Kiểm soát duyệt báo cáo

| Trigger | Mục đích |
|---|---|
| `trg_generated_reports_review_insert` | Kiểm tra thông tin duyệt khi tạo |
| `trg_generated_reports_review_update` | Kiểm tra thông tin duyệt khi cập nhật |

Quy tắc:

- `DRAFT`: chưa có thông tin duyệt;
- `APPROVED`: bắt buộc người duyệt và thời gian duyệt;
- `REJECTED`: bắt buộc người duyệt, thời gian và lý do từ chối.

### 11.5. Ngăn phiên bản nhóm hoạt động tính thuế chồng thời gian

| Trigger | Mục đích |
|---|---|
| `trg_tax_activity_groups_no_overlap_insert` | Chặn khoảng hiệu lực mới chồng phiên bản đang hoạt động |
| `trg_tax_activity_groups_no_overlap_update` | Chặn khoảng hiệu lực cập nhật bị chồng |

`UNIQUE (activity_code, effective_from)` chỉ chống trùng ngày bắt đầu. Hai trigger này kiểm soát toàn bộ khoảng hiệu lực.

---

## 12. Quản lý migration và lỗi chạy lặp

Trong quá trình xây dựng, chạy lại các patch đã phát sinh các lỗi như:

- `Duplicate key name`;
- trùng tên khóa ngoại;
- trigger đã tồn tại;
- không thể xóa index đã được thay đổi;
- kiểu `BIGINT` và `BIGINT UNSIGNED` không khớp khi tạo khóa ngoại.

Phương án áp dụng:

1. mỗi migration có mã phiên bản và chỉ chạy một lần;
2. migration mới không sửa nội dung migration đã chạy;
3. khóa chính và khóa ngoại phải cùng kiểu;
4. tên index, constraint và trigger phải duy nhất;
5. dùng `DROP TRIGGER IF EXISTS` trước khi tái tạo trigger;
6. backup trước khi thay đổi schema;
7. kiểm thử trên database trống trước khi phát hành;
8. file schema cuối không chứa các patch thử nghiệm chồng chéo.

Migration bổ sung phạm vi S1/S2/S4:

```text
V008__support_S1_S2_S4_UNSIGNED.sql
```

Cấu trúc thư mục đề xuất:

```text
database/
├── schema.sql
├── migrations/
│   ├── V001__identity_and_subscription.sql
│   ├── V002__product_and_inventory.sql
│   ├── V003__sales_and_debt.sql
│   ├── V004__ai_and_notifications.sql
│   ├── V005__accounting_and_reporting.sql
│   ├── V006__platform_administration.sql
│   ├── V007__triggers.sql
│   └── V008__support_S1_S2_S4_UNSIGNED.sql
├── seed/
│   └── reference-data.sql
└── verification/
    └── verify-schema.sql
```

---

## 13. Transaction quan trọng

### 13.1. Xác nhận đơn hàng

```text
BEGIN
1. Khóa và kiểm tra đơn hàng DRAFT.
2. Kiểm tra khách hàng nếu có công nợ.
3. Kiểm tra tồn kho.
4. Snapshot nhóm và tỷ lệ tính thuế vào sales_order_items.
5. Xác nhận đơn.
6. Tạo inventory_transactions.
7. Cập nhật inventory_balances.
8. Tạo debt_transactions nếu phát sinh nợ.
9. Tạo accounting_book_entries cho S1/S2.
10. Ghi audit_logs.
COMMIT
```

### 13.2. Xác nhận nhập kho

```text
BEGIN
1. Kiểm tra phiếu nhập và chi tiết.
2. Xác nhận phiếu.
3. Tạo giao dịch nhập kho.
4. Cập nhật tồn kho.
5. Ghi dữ liệu phục vụ S2-HKD.
6. Ghi accounting_book_entries.
7. Ghi audit_logs.
COMMIT
```

### 13.3. Ghi nhận nghĩa vụ thuế

```text
BEGIN
1. Kiểm tra kỳ, loại thuế và mã nghĩa vụ.
2. Tính số thuế dự kiến từ dữ liệu đã xác nhận.
3. Tạo tax_obligations.
4. Tạo accounting_book_entries với source_type TAX_OBLIGATION.
5. Ghi audit_logs.
COMMIT
```

### 13.4. Ghi nhận nộp thuế

```text
BEGIN
1. Kiểm tra nghĩa vụ thuế.
2. Tạo tax_payments.
3. Tạo accounting_book_entries với source_type TAX_PAYMENT.
4. Tính số còn phải nộp khi truy vấn.
5. Ghi audit_logs.
COMMIT
```

---

## 14. Bảo mật

### 14.1. Mật khẩu và xác thực

- chỉ lưu `password_hash`;
- sử dụng BCrypt hoặc Argon2;
- không sử dụng MD5 hoặc SHA-1 để lưu mật khẩu;
- hỗ trợ khóa tài khoản bằng trạng thái;
- lưu `last_login_at` để theo dõi đăng nhập.

### 14.2. Phân quyền RBAC

- Employee: bán hàng và nghiệp vụ được cấp;
- Owner: quản lý dữ liệu của hộ kinh doanh;
- Administrator: quản trị nền tảng.

Backend phải kiểm tra quyền tại service/controller, không chỉ ẩn chức năng trên giao diện.

### 14.3. Tách biệt tenant

Mọi API nghiệp vụ phải:

1. lấy `business_id` từ phiên đăng nhập;
2. lọc truy vấn theo `business_id`;
3. kiểm tra các bản ghi liên quan thuộc cùng tenant;
4. không tin cậy `business_id` do client tự gửi;
5. có test truy cập chéo tenant.

### 14.4. Chống SQL Injection

- sử dụng prepared statement;
- sử dụng parameter binding;
- không nối chuỗi trực tiếp vào SQL;
- kiểm tra dữ liệu đầu vào;
- whitelist cột sort/filter;
- kiểm tra JSON trước khi lưu.

### 14.5. Tài khoản database

Ứng dụng không sử dụng tài khoản `root`.

Nên tách:

- tài khoản ứng dụng với quyền tối thiểu;
- tài khoản migration có quyền thay đổi schema;
- tài khoản đọc báo cáo nếu cần.

Không cấp `DROP`, `ALTER`, `CREATE USER` hoặc `GRANT` cho tài khoản ứng dụng thông thường.

### 14.6. Audit log và dữ liệu nhạy cảm

`audit_logs` lưu:

- người thực hiện;
- hành động;
- đối tượng;
- dữ liệu trước và sau;
- địa chỉ IP;
- user agent;
- thời điểm.

API key AI, mật khẩu database và secret không được lưu rõ trong database hoặc commit lên Git.

---

## 15. Hiệu năng

Các nhóm index quan trọng:

```text
(business_id, status)
(business_id, created_at)
(business_id, product_name)
(business_id, customer_id, created_at)
(business_id, product_id, created_at)
(business_id, tax_type_id, period_from, period_to)
(business_id, due_date, status)
(accounting_book_id, entry_date)
(source_type, source_id)
(user_id, is_read, created_at)
```

Nguyên tắc:

- luôn lọc theo tenant trước;
- phân trang danh sách;
- chỉ lấy các cột cần thiết;
- dùng `EXPLAIN` để kiểm tra truy vấn;
- không tạo index trùng;
- chỉ bổ sung cache khi có số liệu kiểm thử chứng minh cần thiết.

MySQL là nguồn dữ liệu chính. Redis không thuộc phạm vi thiết kế hiện tại.

---

## 16. Truy vết yêu cầu

| Yêu cầu | Bảng hỗ trợ |
|---|---|
| Đăng nhập và phân quyền | `users`, `roles`, `businesses` |
| Quản lý sản phẩm | `categories`, `products`, `units`, `product_units`, `product_prices` |
| Tạo đơn tại quầy | `sales_orders`, `sales_order_items` |
| AI tạo Draft Order | `ai_requests`, `sales_orders`, `sales_order_items`, `notifications` |
| Quản lý nhập và tồn kho | `stock_imports`, `stock_import_items`, `inventory_transactions`, `inventory_balances` |
| Quản lý khách hàng và công nợ | `customers`, `sales_orders`, `debt_transactions` |
| Nhật ký thanh toán công nợ | `debt_transactions` và các trường thông tin thanh toán |
| S1-HKD | `sales_orders`, `sales_order_items`, `tax_activity_groups`, hệ thống sổ/báo cáo |
| S2-HKD | `stock_import_items`, `inventory_transactions`, `inventory_balances`, hệ thống sổ/báo cáo |
| S4-HKD | `tax_types`, `tax_obligations`, `tax_payments`, hệ thống sổ/báo cáo |
| Quản lý biểu mẫu | `report_templates`, `report_template_versions` |
| Tạo và duyệt báo cáo | `generated_reports` |
| Ghi sổ tự động | `accounting_books`, `accounting_book_entries` |
| Quản lý thuê bao | `subscription_plans`, `subscriptions` |
| Quản trị cấu hình | `system_configurations` |
| Phản hồi và thông báo | `feedback`, `announcements`, `notifications` |
| Truy vết thao tác | `audit_logs` |

Các chức năng như WebSocket/SSE, xuất PDF, xử lý AI và phân quyền API được triển khai tại tầng ứng dụng. Database chịu trách nhiệm lưu trữ, toàn vẹn và truy vết.

---

## 17. Xác minh schema

Cấu trúc đã được kiểm tra trực tiếp trong MySQL Workbench.

Kết quả:

```text
33 bảng
68 khóa ngoại
10 trigger
```

Truy vấn xác minh tổng hợp:

```sql
USE household_business_platform;

SELECT
    (
        SELECT COUNT(*)
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_TYPE = 'BASE TABLE'
    ) AS total_tables,

    (
        SELECT COUNT(*)
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE()
          AND REFERENCED_TABLE_NAME IS NOT NULL
    ) AS total_foreign_keys,

    (
        SELECT COUNT(*)
        FROM information_schema.TRIGGERS
        WHERE TRIGGER_SCHEMA = DATABASE()
    ) AS total_triggers;
```

Kết quả mong đợi:

| total_tables | total_foreign_keys | total_triggers |
|---:|---:|---:|
| 33 | 68 | 10 |

Kiểm tra ba mẫu sổ:

```sql
SELECT template_code, template_name, status
FROM report_templates
WHERE template_code IN ('S1-HKD', 'S2-HKD', 'S4-HKD')
ORDER BY template_code;
```

Kiểm tra bốn bảng mới:

```sql
SELECT TABLE_NAME
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN (
      'tax_activity_groups',
      'tax_types',
      'tax_obligations',
      'tax_payments'
  )
ORDER BY TABLE_NAME;
```

---

## 18. Kiểm thử toàn vẹn bắt buộc

| Tình huống | Kết quả mong đợi |
|---|---|
| Đơn có nợ nhưng không có khách hàng | Bị từ chối |
| Hai phiên bản biểu mẫu `ACTIVE` chồng thời gian | Bị từ chối |
| Hai phiên bản cùng `activity_code` chồng thời gian | Bị từ chối |
| Dòng điều chỉnh sổ không có lý do | Bị từ chối |
| Dòng sổ tự đảo chính nó | Bị từ chối |
| Báo cáo APPROVED thiếu người duyệt | Bị từ chối |
| Báo cáo REJECTED thiếu lý do | Bị từ chối |
| Tạo trùng `obligation_code` trong cùng hộ | Bị từ chối |
| Xóa nghĩa vụ đã có lần nộp thuế | Bị `RESTRICT` |
| Tỷ lệ tính thuế ngoài khoảng 0–100 | Bị từ chối |
| Chốt giá vốn thất bại giữa chừng | Toàn bộ giao dịch bị `ROLLBACK` |
| Truy cập dữ liệu của tenant khác | Bị từ chối ở tầng ứng dụng |
| Redis không hoạt động | Không ảnh hưởng vì không thuộc kiến trúc hiện tại |

---

## 19. Hạn chế và hướng mở rộng

### 19.1. Hạn chế hiện tại

- chưa có S3-HKD, S5-HKD, S6-HKD và S7-HKD;
- chưa có hệ thống kê khai hoặc nộp thuế điện tử;
- chưa hỗ trợ phân bổ một lần nộp thuế cho nhiều nghĩa vụ;
- chưa hỗ trợ một khoản thanh toán khách hàng cho nhiều đơn hàng;
- chưa có quy trình hoàn tiền đầy đủ;
- chưa có bảng lịch sử thay đổi phương pháp tính giá;
- `source_type/source_id` là polymorphic reference nên không thể tạo một khóa ngoại trực tiếp đến nhiều bảng nguồn;
- một số quy tắc tenant phải kiểm soát ở backend.

### 19.2. Hướng mở rộng

Khi có yêu cầu thực tế, có thể bổ sung:

- `customer_payments`, `payment_allocations`, `refunds`;
- `tax_payment_allocations`;
- `inventory_valuation_policies`;
- `business_expenses`;
- `employees`, `payroll_periods`, `payroll_details`;
- `cash_funds`, `cash_transactions`;
- `bank_accounts`, `bank_transactions`, `bank_reconciliations`;
- quy tắc mapping kế toán có phiên bản.

---

## 20. Môi trường triển khai

Cơ sở dữ liệu được thiết kế cho MySQL 8 và có thể triển khai trên MySQL cục bộ hoặc dịch vụ MySQL được quản lý.

Các nội dung sau được trình bày trong tài liệu Installation Guide, không thuộc tài liệu thiết kế này:

- tạo dịch vụ database;
- cấu hình Railway hoặc môi trường tương đương;
- biến môi trường kết nối;
- chạy migration và seed data;
- backup và phục hồi;
- health check;
- cấu hình mạng và secret.

---

## 21. Kết luận

Thiết kế sử dụng MySQL 8, InnoDB, mô hình quan hệ và multi-tenant dùng chung schema.

Các điểm chính:

- dữ liệu của từng hộ được phân tách bằng `business_id`;
- sản phẩm hỗ trợ nhiều đơn vị và quy tắc giá;
- đơn hàng lưu snapshot giá và tỷ lệ tính thuế;
- kho hỗ trợ số lượng, giá vốn và giá trị tồn;
- công nợ có lịch sử giao dịch;
- AI chỉ tạo dữ liệu nháp và cần con người xác nhận;
- nghĩa vụ thuế tách khỏi các lần nộp thuế;
- sổ và báo cáo được quản lý theo phiên bản;
- 10 trigger bảo vệ các quy tắc liên bảng;
- audit log, RBAC và least privilege hỗ trợ bảo mật;
- migration đã xử lý đúng kiểu `BIGINT UNSIGNED`;
- schema đã được xác minh thành công.

Thông số cuối cùng:

```text
33 bảng
68 khóa ngoại
10 trigger
```

Trong phạm vi học thuật được giảng viên xác nhận, cấu trúc hiện tại đủ để triển khai S1-HKD, S2-HKD và S4-HKD mà không làm hệ thống phức tạp quá mức.
