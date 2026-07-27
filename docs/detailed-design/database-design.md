# THIẾT KẾ CƠ SỞ DỮ LIỆU  
## Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh

| Thuộc tính | Nội dung |
|---|---|
| Tên hệ thống | Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh |
| Tên tiếng Anh | Platform to Support Digital Transformation for Household Businesses |
| Viết tắt | HBDT
| Hệ quản trị cơ sở dữ liệu | MySQL 8.x |
| Storage Engine | InnoDB |
| Character Set | `utf8mb4` |
| Collation | `utf8mb4_0900_ai_ci` |
| Mô hình dữ liệu | Cơ sở dữ liệu quan hệ, multi-tenant dùng chung schema |
| Quy mô hiện tại | 29 bảng, 296 cột, 60 khóa ngoại, 8 trigger |
| Phiên bản tài liệu | 1.0 |

---

## 1. Mục đích thiết kế

Cơ sở dữ liệu được xây dựng để phục vụ các nghiệp vụ chính của hệ thống:

- quản lý hộ kinh doanh, tài khoản và phân quyền;
- quản lý sản phẩm, nhiều đơn vị tính và quy tắc giá;
- quản lý nhập kho, tồn kho và lịch sử biến động kho;
- lập đơn hàng tại quầy;
- tiếp nhận yêu cầu văn bản hoặc giọng nói để AI tạo đơn hàng nháp;
- quản lý khách hàng và công nợ;
- tự động ghi nhận dữ liệu vào sổ kế toán;
- quản lý phiên bản biểu mẫu và báo cáo;
- quản trị thuê bao, cấu hình hệ thống, phản hồi và nhật ký kiểm toán.

Thiết kế ưu tiên tính nhất quán, khả năng truy vết, bảo toàn lịch sử và khả năng mở rộng.

---

## 2. Phạm vi cơ sở dữ liệu

Phiên bản hiện tại tập trung vào các nguồn dữ liệu được nêu trực tiếp trong đề tài:

- giao dịch bán hàng;
- giao dịch nhập kho;
- giao dịch công nợ khách hàng;
- yêu cầu AI tạo Draft Order;
- dữ liệu phục vụ sổ chi tiết doanh thu, báo cáo công nợ và báo cáo hoạt động kinh doanh.

Các nội dung sau chưa thuộc phạm vi triển khai:

- chấm công và tính lương;
- kê khai và nộp thuế điện tử;
- tax engine tự động xác định đầy đủ nghĩa vụ thuế;
- quản lý quỹ tiền mặt hoàn chỉnh;
- quản lý và đối soát tài khoản ngân hàng;
- tích hợp trực tiếp với cơ quan thuế;
- tích hợp hóa đơn điện tử với nhà cung cấp bên ngoài.

Các nội dung này được xem là hướng mở rộng trong tương lai.

---

## 3. Lựa chọn công nghệ và mô hình dữ liệu

### 3.1. MySQL 8

Nhóm lựa chọn MySQL 8 vì các lý do sau:

- hỗ trợ khóa chính, khóa ngoại và unique constraint;
- hỗ trợ transaction theo ACID;
- hỗ trợ trigger và check constraint;
- hỗ trợ kiểu dữ liệu JSON;
- tương thích tốt với Java và Spring Boot;
- phù hợp môi trường triển khai của đồ án;
- hỗ trợ Unicode tiếng Việt thông qua `utf8mb4`.

### 3.2. Mô hình quan hệ

Mô hình quan hệ phù hợp vì hệ thống có nhiều dữ liệu liên kết chặt chẽ:

```text
Hộ kinh doanh → Người dùng
Đơn hàng → Chi tiết đơn hàng
Khách hàng → Công nợ
Sản phẩm → Đơn vị tính
Phiếu nhập → Chi tiết phiếu nhập
Biểu mẫu → Phiên bản biểu mẫu
Sổ kế toán → Dòng sổ
```

Khóa ngoại giúp ngăn dữ liệu tham chiếu đến bản ghi không tồn tại và giảm nguy cơ tạo dữ liệu mồ côi.

### 3.3. Mô hình multi-tenant

Hệ thống sử dụng mô hình:

> Shared Database – Shared Schema – Tenant Key

Bảng `businesses` đại diện cho từng hộ kinh doanh. Các bảng nghiệp vụ quan trọng sử dụng `business_id` để phân tách dữ liệu.

Ưu điểm:

- dễ triển khai và vận hành;
- phù hợp nhiều hộ kinh doanh nhỏ;
- giảm chi phí tài nguyên;
- hỗ trợ Administrator tổng hợp dữ liệu toàn nền tảng;
- có thể mở rộng mà không phải tạo database riêng cho từng hộ.

Mọi truy vấn nghiệp vụ tại backend phải kiểm tra `business_id` từ phiên đăng nhập đã xác thực.

---

## 4. Tổ chức dữ liệu theo phân hệ

Cơ sở dữ liệu gồm 29 bảng, được chia thành 5 phân hệ.

### 4.1. Business Core

| Bảng | Chức năng |
|---|---|
| `businesses` | Lưu thông tin hộ kinh doanh |
| `users` | Lưu tài khoản Owner, Employee và Administrator |
| `roles` | Lưu vai trò và hỗ trợ phân quyền |
| `subscription_plans` | Lưu các gói thuê bao |
| `subscriptions` | Lưu lịch sử đăng ký gói của từng hộ kinh doanh |

### 4.2. Product & Inventory Management

| Bảng | Chức năng |
|---|---|
| `categories` | Danh mục sản phẩm |
| `products` | Thông tin sản phẩm |
| `units` | Danh mục đơn vị tính |
| `product_units` | Đơn vị tính áp dụng cho từng sản phẩm |
| `product_prices` | Giá bán và quy tắc giá |
| `stock_imports` | Phiếu nhập kho |
| `stock_import_items` | Chi tiết phiếu nhập |
| `inventory_balances` | Tồn kho hiện tại |
| `inventory_transactions` | Lịch sử biến động tồn kho |

### 4.3. Sales & Customer Debt

| Bảng | Chức năng |
|---|---|
| `customers` | Hồ sơ khách hàng |
| `sales_orders` | Thông tin chung của đơn hàng |
| `sales_order_items` | Các sản phẩm trong đơn hàng |
| `debt_transactions` | Lịch sử phát sinh, thanh toán và điều chỉnh công nợ |

### 4.4. AI & System Operations

| Bảng | Chức năng |
|---|---|
| `ai_requests` | Nội dung yêu cầu AI và dữ liệu được trích xuất |
| `notifications` | Thông báo theo người dùng và sự kiện |
| `feedback` | Phản hồi, khiếu nại hoặc sự cố |
| `announcements` | Thông báo toàn nền tảng hoặc theo vai trò |
| `system_configurations` | Cấu hình hệ thống và AI |
| `audit_logs` | Nhật ký thao tác và thay đổi dữ liệu |

### 4.5. Accounting & Reporting

| Bảng | Chức năng |
|---|---|
| `report_templates` | Danh mục biểu mẫu và căn cứ áp dụng |
| `report_template_versions` | Phiên bản biểu mẫu và thời gian hiệu lực |
| `accounting_books` | Sổ kế toán theo hộ kinh doanh và kỳ |
| `accounting_book_entries` | Các dòng dữ liệu trong sổ |
| `generated_reports` | Báo cáo đã tạo, trạng thái duyệt và lần tạo |

---

## 5. Các quan hệ nghiệp vụ chính

### 5.1. Tài khoản và thuê bao

```text
roles 1 ─── N users
businesses 1 ─── N users
businesses 1 ─── N subscriptions
subscription_plans 1 ─── N subscriptions
```

`users.business_id` cho phép `NULL` để hỗ trợ tài khoản Administrator không thuộc một hộ kinh doanh cụ thể.

### 5.2. Sản phẩm và đơn vị tính

```text
businesses 1 ─── N products
categories 1 ─── N products
products 1 ─── N product_units
units 1 ─── N product_units
product_units 1 ─── N product_prices
```

`products.base_unit_id` xác định đơn vị cơ sở để quản lý tồn kho.  
`product_units.conversion_rate` dùng để quy đổi các đơn vị khác về đơn vị cơ sở.

### 5.3. Bán hàng

```text
businesses 1 ─── N sales_orders
customers 1 ─── N sales_orders
sales_orders 1 ─── N sales_order_items
products 1 ─── N sales_order_items
units 1 ─── N sales_order_items
```

Giá bán được lưu trong `sales_order_items.unit_price` để bảo toàn giá tại thời điểm giao dịch.

### 5.4. Kho

```text
stock_imports 1 ─── N stock_import_items
products 1 ─── N inventory_balances
products 1 ─── N inventory_transactions
```

`inventory_balances` lưu số tồn hiện tại để truy vấn nhanh.  
`inventory_transactions` lưu toàn bộ lịch sử tăng, giảm và điều chỉnh kho.

### 5.5. Công nợ

```text
customers 1 ─── N debt_transactions
sales_orders 1 ─── N debt_transactions
```

Mỗi giao dịch công nợ lưu `balance_after` để dễ đối chiếu và truy vết số dư.

### 5.6. AI Draft Order

```text
users 1 ─── N ai_requests
ai_requests 0..1 ─── 1 sales_orders
ai_requests 1 ─── N notifications
sales_orders 1 ─── N notifications
```

AI chỉ tạo đơn hàng ở trạng thái `DRAFT`. Employee hoặc Owner phải kiểm tra trước khi xác nhận.

### 5.7. Kế toán và báo cáo

```text
report_templates 1 ─── N report_template_versions
report_template_versions 1 ─── N accounting_books
accounting_books 1 ─── N accounting_book_entries
report_template_versions 1 ─── N generated_reports
```

Báo cáo luôn liên kết với đúng phiên bản biểu mẫu được sử dụng tại thời điểm tạo.

---

## 6. Ràng buộc dữ liệu

### 6.1. Khóa chính

Tất cả bảng sử dụng khóa chính dạng:

```sql
id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY
```

Cách dùng thống nhất giúp đơn giản hóa quan hệ và hỗ trợ mở rộng dữ liệu.

### 6.2. Khóa duy nhất

Các ràng buộc duy nhất được áp dụng cho:

- mã vai trò;
- mã hộ kinh doanh;
- tên đăng nhập;
- mã gói thuê bao;
- mã sản phẩm trong từng hộ;
- mã khách hàng trong từng hộ;
- mã đơn hàng trong từng hộ;
- cặp sản phẩm–đơn vị tính;
- số dòng trong cùng một sổ;
- phiên bản biểu mẫu;
- lần tạo báo cáo.

`accounting_books` sử dụng:

```text
UNIQUE (business_id, book_code, period_from, period_to)
```

Nhờ đó cùng một hộ có thể mở cùng loại sổ ở nhiều kỳ khác nhau.

### 6.3. Check constraint

`CHECK` được dùng cho:

- trạng thái hợp lệ;
- số tiền và số lượng không âm;
- ngày kết thúc không nhỏ hơn ngày bắt đầu;
- số lần tạo báo cáo lớn hơn 0;
- loại dữ liệu nằm trong danh sách cho phép.

Các quy tắc cần đọc dữ liệu từ nhiều bản ghi được xử lý bằng trigger hoặc backend.

---

## 7. Chính sách xóa dữ liệu

### 7.1. `ON DELETE CASCADE`

Chỉ sử dụng với dữ liệu con không có ý nghĩa độc lập:

- chi tiết đơn hàng;
- chi tiết phiếu nhập;
- đơn vị tính của sản phẩm;
- giá theo đơn vị sản phẩm.

### 7.2. `ON DELETE RESTRICT`

Sử dụng với dữ liệu cần giữ lịch sử:

- hộ kinh doanh;
- khách hàng có công nợ;
- sản phẩm đã phát sinh giao dịch;
- sổ kế toán;
- dòng sổ;
- phiên bản biểu mẫu;
- báo cáo đã tạo.

Những dữ liệu này nên được vô hiệu hóa bằng `status` thay vì xóa vật lý.

### 7.3. `ON DELETE SET NULL`

Sử dụng cho các tham chiếu tùy chọn như:

- người tạo;
- người cập nhật;
- người xử lý phản hồi;
- người tạo cấu hình;
- người dùng trong audit log.

Bản ghi nghiệp vụ vẫn được giữ khi tài khoản không còn hoạt động.

---

## 8. Trigger

Hệ thống có 8 trigger, chia thành 4 nhóm.

| Nhóm | Mục đích |
|---|---|
| Kiểm tra công nợ đơn hàng | Đơn có công nợ bắt buộc phải gắn với khách hàng |
| Kiểm tra phiên bản biểu mẫu | Không cho các phiên bản đang hoạt động bị chồng thời gian |
| Kiểm tra dòng điều chỉnh sổ | Dòng điều chỉnh phải có lý do và không được tự tham chiếu |
| Kiểm tra duyệt báo cáo | Trạng thái duyệt hoặc từ chối phải có thông tin hợp lệ |

Mỗi nhóm gồm:

```text
1 trigger BEFORE INSERT
1 trigger BEFORE UPDATE
```

### 8.1. Công nợ đơn hàng

Quy tắc:

```text
debt_amount > 0
⇒ customer_id IS NOT NULL
```

Quy tắc này được triển khai bằng trigger vì liên quan đến cột khóa ngoại và cần thông báo lỗi nghiệp vụ rõ ràng.

### 8.2. Phiên bản biểu mẫu

Trigger ngăn hai phiên bản `ACTIVE` của cùng một biểu mẫu bị chồng khoảng thời gian hiệu lực.

### 8.3. Dòng điều chỉnh sổ

Khi một dòng sổ cần điều chỉnh:

- không ghi đè mất dữ liệu cũ;
- tạo dòng mới;
- liên kết qua `reverses_entry_id`;
- bắt buộc có `adjustment_reason`.

### 8.4. Duyệt báo cáo

- `DRAFT`: chưa có thông tin duyệt;
- `APPROVED`: bắt buộc có người duyệt và thời gian duyệt;
- `REJECTED`: bắt buộc có người duyệt, thời gian duyệt và lý do từ chối.

---

## 9. Xử lý lỗi trùng index, constraint và trigger

Trong quá trình xây dựng, một số lỗi phát sinh do chạy lại script đã thực thi:

- `Duplicate key name`;
- trùng tên khóa ngoại;
- trigger đã tồn tại;
- không thể xóa index vì index đã được thay đổi trước đó.

Phương án áp dụng trong bản cuối:

1. chỉ giữ một file schema hoàn chỉnh;
2. không giữ các đoạn patch thử nghiệm trong file phát hành;
3. đặt tên index, constraint và trigger duy nhất;
4. tạo trigger sau khi đã tạo xong bảng và khóa ngoại;
5. dùng `DROP TRIGGER IF EXISTS` trước khi tái tạo trigger;
6. kiểm thử schema trên database trống;
7. không chạy lại toàn bộ file migration đã thực thi.

Bản schema chính thức phải có khả năng chạy một lần từ đầu mà không phát sinh lỗi trùng.

---

## 10. Transaction và tính nhất quán

Các nghiệp vụ quan trọng phải chạy trong transaction.

### 10.1. Xác nhận đơn hàng

```text
BEGIN
1. Kiểm tra đơn đang ở trạng thái DRAFT.
2. Kiểm tra khách hàng nếu có công nợ.
3. Kiểm tra tồn kho.
4. Chuyển đơn sang CONFIRMED.
5. Tạo giao dịch kho.
6. Cập nhật tồn kho.
7. Tạo giao dịch công nợ nếu cần.
8. Ghi dữ liệu kế toán.
9. Ghi audit log.
COMMIT
```

Nếu có lỗi:

```text
ROLLBACK
```

### 10.2. Xác nhận nhập kho

```text
BEGIN
1. Kiểm tra phiếu nhập.
2. Xác nhận phiếu.
3. Tạo lịch sử nhập kho.
4. Cập nhật tồn kho.
5. Ghi dữ liệu kế toán.
6. Ghi audit log.
COMMIT
```

Transaction giúp tránh trạng thái dữ liệu chỉ được cập nhật một phần.

---

## 11. Bảo mật

### 11.1. Mật khẩu

Hệ thống chỉ lưu:

```text
password_hash
```

Không lưu mật khẩu rõ. Backend sử dụng thuật toán BCrypt hoặc Argon2.

### 11.2. Phân quyền

Ba vai trò chính:

- Employee;
- Owner;
- Administrator.

Quyền được kiểm tra tại backend, không chỉ dựa vào giao diện.

### 11.3. Tách biệt dữ liệu

Mọi truy vấn nghiệp vụ phải lọc theo `business_id`.

Backend không tin cậy `business_id` do client tự gửi mà lấy từ thông tin đăng nhập đã xác thực.

### 11.4. Chống SQL Injection

Hệ thống sử dụng:

- prepared statement;
- parameter binding;
- ORM đúng cách;
- kiểm tra và giới hạn dữ liệu đầu vào.

### 11.5. Audit log

Bảng `audit_logs` lưu:

- người thực hiện;
- hành động;
- đối tượng bị thay đổi;
- dữ liệu trước và sau;
- địa chỉ IP;
- user agent;
- thời điểm thực hiện.

### 11.6. Tài khoản database

Ứng dụng không sử dụng tài khoản `root`.

Tài khoản ứng dụng chỉ được cấp các quyền cần thiết trên schema. Quyền thay đổi cấu trúc database được dành cho tài khoản migration riêng.

### 11.7. Dữ liệu AI

- AI chỉ tạo Draft Order;
- người dùng phải kiểm tra trước khi xác nhận;
- không lưu API key dạng rõ trong database;
- hạn chế lưu dữ liệu âm thanh lâu hơn nhu cầu nghiệp vụ;
- không gửi toàn bộ dữ liệu của hộ kinh doanh cho dịch vụ AI.

---

## 12. Hiệu năng

Các cột thường xuyên truy vấn được lập chỉ mục, đặc biệt:

```text
business_id
product_id
customer_id
sales_order_id
created_at
status
template_version_id
```

Một số index quan trọng:

```text
products(business_id, product_name)
sales_orders(business_id, created_at)
sales_orders(business_id, status)
debt_transactions(business_id, customer_id, created_at)
inventory_transactions(business_id, product_id, created_at)
notifications(user_id, is_read, created_at)
```

Khi dữ liệu tăng, hệ thống có thể bổ sung:

- cache;
- bảng tổng hợp theo ngày hoặc tháng;
- phân trang;
- background job;
- read replica cho báo cáo.

---

## 13. Quyết định 3389 và Thông tư 88

### 13.1. Quyết định số 3389/QĐ-BTC

Quyết định ảnh hưởng đến định hướng thiết kế:

- chuyển quy trình thủ công sang quy trình số;
- quản lý tập trung nhiều hộ kinh doanh;
- hỗ trợ AI và công cụ điện tử;
- cho phép cấu hình chính sách thay đổi;
- sẵn sàng mở rộng tích hợp trong tương lai.

Quyết định không quy định trực tiếp tên bảng hoặc cấu trúc cột. Vì vậy, chính sách không được hard-code mà được quản lý qua cấu hình và thời gian hiệu lực.

### 13.2. Thông tư số 88/2021/TT-BTC

Thông tư ảnh hưởng trực tiếp đến phân hệ:

```text
report_templates
report_template_versions
accounting_books
accounting_book_entries
generated_reports
```

Thiết kế bảo đảm:

- biểu mẫu được quản lý theo phiên bản;
- phiên bản có thời gian hiệu lực;
- sổ được mở theo hộ và theo kỳ;
- dòng sổ có thể truy vết đến nguồn giao dịch;
- điều chỉnh không xóa mất lịch sử;
- báo cáo cũ giữ nguyên phiên bản biểu mẫu đã sử dụng.

Phạm vi hiện tại tập trung vào bán hàng, nhập kho và công nợ. Hệ thống chưa tuyên bố triển khai đầy đủ toàn bộ các phân hệ lương, thuế, tiền mặt và ngân hàng của Thông tư 88.

---

## 14. Truy vấn xác minh

### 14.1. Số bảng

```sql
SELECT COUNT(*) AS total_tables
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'household_business_platform'
  AND TABLE_TYPE = 'BASE TABLE';
```

Kết quả mong đợi:

```text
29
```

### 14.2. Số khóa ngoại

```sql
SELECT COUNT(*) AS total_foreign_keys
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'household_business_platform'
  AND REFERENCED_TABLE_NAME IS NOT NULL;
```

Kết quả mong đợi:

```text
60
```

### 14.3. Số trigger

```sql
SELECT COUNT(*) AS total_triggers
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'household_business_platform';
```

Kết quả mong đợi:

```text
8
```

### 14.4. Kiểm tra storage engine

```sql
SELECT TABLE_NAME, ENGINE
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'household_business_platform'
  AND TABLE_TYPE = 'BASE TABLE'
  AND ENGINE <> 'InnoDB';
```

Kết quả mong đợi: không có bản ghi.

---

## 15. Kết luận

Thiết kế cơ sở dữ liệu sử dụng MySQL 8, mô hình quan hệ và multi-tenant dùng chung schema.

Thiết kế đáp ứng các yêu cầu chính của đề tài:

- quản lý nhiều hộ kinh doanh;
- phân quyền Employee, Owner và Administrator;
- quản lý sản phẩm, giá và nhiều đơn vị tính;
- quản lý bán hàng, kho và công nợ;
- hỗ trợ AI tạo đơn hàng nháp;
- quản lý sổ và báo cáo theo phiên bản biểu mẫu;
- bảo toàn lịch sử bằng khóa ngoại, trạng thái, trigger và audit log;
- hỗ trợ transaction cho các nghiệp vụ quan trọng;
- có khả năng mở rộng mà không phải thiết kế lại toàn bộ cơ sở dữ liệu.

Thông số cuối cùng:

```text
29 bảng
296 cột
60 khóa ngoại
8 trigger
```
