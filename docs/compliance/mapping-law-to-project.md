# Bản Đồ Ánh Xạ: Quy Định Kế Toán Hộ Kinh Doanh -> Tính Năng Của Đồ Án

> Người tạo: Nguyễn Lê Huy Tâm
> Phiên bản tài liệu: 1.0 
> Cập nhật lần cuối: 01/09/2026

---

## 1. Mục tiêu của bản đồ ánh xạ

Bản đồ này xác định phần nào của Thông tư 88/2021/TT-BTC, Quyết định 3389/QĐ-BTC và các quy định kế toán liên quan được hệ thống hiện tại triển khai trực tiếp, phần nào chỉ hỗ trợ ở mức báo cáo, phần nào nằm ngoài phạm vi đồ án.

> Mục tiêu của hệ thống là hỗ trợ quản lý bán hàng, kho, công nợ và nghĩa vụ thuế cho hộ kinh doanh theo mô hình đơn giản, không thay thế vai trò kiểm tra cuối cùng của chủ hộ kinh doanh, người quản lý hoặc cơ quan có thẩm quyền.

---

## 2. Bản đồ ánh xạ theo nhóm nội dung

| Nội dung pháp lý / chuẩn mực | Tính năng / module trong đồ án | Dữ liệu hoặc thành phần hỗ trợ | Mức độ triển khai |
|---|---|---|---|
| Tiêu chí phân loại hộ kinh doanh theo nhóm ngành và mức độ hoạt động | Phân loại sản phẩm, nhóm tính thuế, doanh thu theo loại hoạt động | `tax_activity_groups`, `products.default_tax_activity_group_id`, `sales_order_items.tax_activity_group_id` | Có triển khai |
| S1-HKD: sổ chi tiết doanh thu bán hàng hóa, dịch vụ | Quản lý đơn hàng, doanh thu bán hàng, tổng hợp theo nhóm thuế | `sales_orders`, `sales_order_items`, `accounting_books`, `generated_reports` | Có triển khai |
| S2-HKD: sổ chi tiết vật liệu, dụng cụ, sản phẩm, hàng hóa | Quản lý nhập kho, xuất kho, tồn kho, giá xuất kho | `products`, `inventory_balances`, `inventory_transactions`, `product_units` | Có triển khai |
| S4-HKD: sổ theo dõi nghĩa vụ thuế với NSNN | Theo dõi thuế phát sinh, đã nộp, còn phải nộp / nộp thừa | `tax_types`, `tax_obligations`, `tax_payments`, `generated_reports` | Có triển khai |
| Ghi nhận chứng từ và lịch sử giao dịch | Hệ thống lưu giao dịch theo sự kiện đã xác nhận | `debt_transactions`, `inventory_transactions`, `accounting_book_entries`, `audit_logs` | Có triển khai |
| Phê duyệt báo cáo trước khi dùng | Owner kiểm tra, chỉnh sửa và xác nhận báo cáo | `generated_reports`, `audit_logs`, `report_template_versions` | Có triển khai |
| Quản lý AI tạo Draft Order | AI nhận dữ liệu văn bản/giọng nói, sinh đơn nháp | `ai_requests`, `notifications`, `feedback` | Có triển khai |
| Xác nhận quyền truy cập theo vai trò | RBAC 4 tầng: Admin, Manager, Owner, Employee | `users`, `roles`, `user_roles` hoặc mô hình tương đương | Có triển khai |
| Hệ thống kế toán điện tử / lưu trữ dữ liệu | Lưu dữ liệu sự kiện, lịch sử thay đổi, báo cáo theo kỳ | `audit_logs`, `generated_reports`, `accounting_books` | Có triển khai ở mức hỗ trợ |
| S3-HKD, S5-HKD, S6-HKD, S7-HKD | Không nằm trong phạm vi hiện tại | Không có mô hình kế toán tương ứng | Không triển khai |
| Quản lý quỹ tiền mặt, ngân hàng, lương, bảo hiểm | Không nằm trong phạm vi đồ án hiện tại | Không có module tương ứng | Ngoài phạm vi |

---

## 3. Mỗi mục pháp lý tương ứng với đâu trong thực tế đồ án

### 3.1. Quy định phân loại hộ kinh doanh và nhóm hoạt động tính thuế

- Theo Quyết định 3389/QĐ-BTC, hệ thống cần xác định nhóm hoạt động doanh thu để tính thuế đúng.
- Trong đồ án, dữ liệu này được lưu trong:
  - `tax_activity_groups`
  - `products.default_tax_activity_group_id`
  - `sales_order_items.tax_activity_group_id`
- Đây là căn cứ để tính:
  - doanh thu S1-HKD
  - nghĩa vụ thuế S4-HKD
  - báo cáo theo nhóm nghề

Liên quan: [docs/compliance/decision-3389-BTC.md](decision-3389-BTC.md), [docs/detailed-design/database-design.md](../detailed-design/database-design.md)

### 3.2. S1-HKD: doanh thu bán hàng hóa, dịch vụ

- Phần này ánh xạ trực tiếp với luồng bán hàng và doanh thu của hộ kinh doanh.
- Dữ liệu nguồn gồm:
  - `sales_orders` — đơn hàng
  - `sales_order_items` — chi tiết mặt hàng, số lượng, giá, tỷ lệ thuế
  - `customers` — khách hàng và công nợ
  - `debt_transactions` — nợ / trả nợ
- Tính năng trong đồ án:
  - Employee tạo bán hàng tại quầy
  - Owner xem báo cáo doanh thu
  - Số liệu dùng để tổng hợp S1-HKD

Liên quan: [docs/user_requirements/user-requirements.md](../user_requirements/user-requirements.md), [docs/detailed-design/database-design.md](../detailed-design/database-design.md)

### 3.3. S2-HKD: nhập - xuất - tồn kho

- Phần này ánh xạ với hoạt động kho của hộ kinh doanh.
- Dữ liệu chính:
  - `products`
  - `product_units`
  - `inventory_balances`
  - `inventory_transactions`
- Tính năng trong đồ án:
  - nhập kho
  - xuất kho khi bán hàng
  - xem tồn hiện tại
  - tính giá trị tồn / giá xuất kho theo phương pháp đã chọn

Liên quan: [docs/detailed-design/database-design.md](../detailed-design/database-design.md), [docs/compliance/circular-88-2021-BTC.md](circular-88-2021-BTC.md)

### 3.4. S4-HKD: nghĩa vụ thuế với NSNN

- Đây là phần kế toán thuế được hệ thống hỗ trợ trực tiếp.
- Dữ liệu chính:
  - `tax_types`
  - `tax_obligations`
  - `tax_payments`
  - `report_templates` / `report_template_versions`
- Tính năng trong đồ án:
  - sinh nghĩa vụ thuế từ doanh thu và nhóm thuế
  - ghi nhận lần nộp thuế
  - tính số đã nộp, còn phải nộp, nộp thừa
  - cho Owner duyệt hoặc từ chối báo cáo thuế

Liên quan: [docs/compliance/circular-88-2021-BTC.md](circular-88-2021-BTC.md), [docs/detailed-design/database-design.md](../detailed-design/database-design.md)

### 3.5. Phê duyệt báo cáo và kiểm soát dữ liệu

- Quy định pháp lý trong kế toán đòi hỏi báo cáo có thể được kiểm tra, sửa chữa và xác nhận.
- Trong đồ án, điều này được thực hiện bằng:
  - `generated_reports` — báo cáo đã tạo
  - `report_template_versions` — phiên bản biểu mẫu có hiệu lực
  - `audit_logs` — nhật ký hành động
- Owner có quyền:
  - xem báo cáo
  - chỉnh sửa dữ liệu được phép sửa
  - xác nhận hoặc từ chối báo cáo

Đây là yếu tố thiết yếu để phù hợp với mục tiêu “hỗ trợ kế toán” chứ không phải “tự động thay thế quyền kiểm tra con người”.

### 3.6. AI Draft Order và vai trò người xác nhận

- Hệ thống có AI tạo Draft Order từ văn bản/giọng nói, nhưng ai cũng biết quy định kế toán không cho phép xác nhận tự động không có con người kiểm tra.
- Trong thực tế đồ án:
  - AI sinh đơn nháp từ `ai_requests`
  - người dùng được cảnh báo qua `notifications`
  - Employee/Owner phải xác nhận hoặc chỉnh sửa trước khi ghi nhận chính thức
- Đây là mô hình human-in-the-loop phù hợp với các yêu cầu nghĩa vụ thuế và báo cáo.

Liên quan: [docs/user_requirements/user-requirements.md](../user_requirements/user-requirements.md), [docs/architecture_design/architecture_design_document.md](../architecture_design/architecture_design_document.md)

---

## 4. Bản đồ theo từng nhóm nghiệp vụ thực tế của đồ án

| Nhóm nghiệp vụ | Mục tiêu pháp lý tương ứng | Kết luận |
|---|---|---|
| Quản lý đơn hàng | S1-HKD doanh thu | Triển khai đầy đủ trong phạm vi đồ án |
| Quản lý kho | S2-HKD nhập - xuất - tồn | Triển khai đầy đủ trong phạm vi đồ án |
| Quản lý nợ / thanh toán | Tài liệu kế toán hỗ trợ kê khai và đối chiếu | Triển khai đầy đủ trong phạm vi đồ án |
| Tính thuế theo nhóm hoạt động | Gắn dữ liệu doanh thu với thuế | Triển khai đầy đủ trong phạm vi đồ án |
| Theo dõi nộp thuế | S4-HKD | Triển khai đầy đủ trong phạm vi đồ án |
| Phê duyệt báo cáo | Bảo đảm tính minh bạch và khả năng kiểm tra | Triển khai đầy đủ trong phạm vi đồ án |
| Quản lý quỹ tiền mặt | S6-HKD | Ngoài phạm vi |
| Quản lý lương, bảo hiểm | S5-HKD | Ngoài phạm vi |
| Tài khoản ngân hàng, đối soát ngân hàng | S7-HKD | Ngoài phạm vi |
| Chi phí sản xuất - kinh doanh chi tiết | S3-HKD | Ngoài phạm vi |

---

## 5. Kết luận ngắn gọn

Hệ thống hiện tại phù hợp với phần cốt lõi của Thông tư 88/2021/TT-BTC nếu giới hạn ở 3 trục chính:

1. doanh thu và phân nhóm thuế (S1-HKD)
2. tồn kho và biến động hàng hóa (S2-HKD)
3. nghĩa vụ thuế và nộp thuế (S4-HKD)

Các phần còn lại của thông tư như S3-HKD, S5-HKD, S6-HKD, S7-HKD, cũng như các quy trình kế toán chi tiết khác, không nằm trong phạm vi hiện tại và không nên được tuyên bố là đã triển khai hoàn chỉnh trong đồ án.

---

> Hệ thống hiện tại triển khai các module kế toán và thuế theo mô hình hỗ trợ cho hộ kinh doanh trong phạm vi S1-HKD, S2-HKD và S4-HKD theo Thông tư 88/2021/TT-BTC.
> Các chức năng liên quan đến S3-HKD, S5-HKD, S6-HKD, S7-HKD và các quy trình kế toán chi tiết khác không nằm trong phạm vi đồ án hiện tại.
