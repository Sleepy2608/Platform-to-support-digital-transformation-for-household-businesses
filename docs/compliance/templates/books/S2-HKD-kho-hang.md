# Mẫu S2-HKD: Sổ Chi Tiết Vật Liệu, Dụng Cụ, Sản Phẩm, Hàng Hóa
*(Ban hành kèm theo Thông tư số 88/2021/TT-BTC ngày 11/10/2021 của Bộ trưởng Bộ Tài chính)*

**HỘ, CÁ NHÂN KINH DOANH**: {{ business_name }}  
**Địa chỉ**: {{ business_address }}  
**Tên vật liệu, dụng cụ, sản phẩm, hàng hóa**: {{ product_name }}  
**Mã số**: {{ product_code }} | **Đơn vị tính**: {{ unit }} | **Năm**: {{ fiscal_year }}  

---

### 1. Biểu Mẫu Sổ Kế Toán

| Chứng từ - Số hiệu (A) | Chứng từ - Ngày, tháng (B) | Diễn giải (C) | Đơn vị tính (D) | Đơn giá (1) | Nhập - Số lượng (2) | Nhập - Thành tiền (3) | Xuất - Số lượng (4) | Xuất - Thành tiền (5) | Tồn - Số lượng (6) | Tồn - Thành tiền (7) | Ghi chú |
| :---: | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| | | **Số dư đầu kỳ** | {{ unit }} | | | | | | **{{ init_qty }}** | **{{ init_amount }}** | |
| {{ doc_no }} | {{ doc_date }} | {{ description }} | {{ unit }} | {{ unit_price }} | {{ import_qty }} | {{ import_amount }} | {{ export_qty }} | {{ export_amount }} | {{ stock_qty }} | {{ stock_amount }} | {{ note }} |
| | | **Cộng phát sinh trong kỳ** | | | **{{ total_import_qty }}** | **{{ total_import_amount }}** | **{{ total_export_qty }}** | **{{ total_export_amount }}** | | | |
| | | **Số dư cuối kỳ** | | | | | | | **{{ final_qty }}** | **{{ final_amount }}** | |

---

### 2. Hướng Dẫn Mapping Dữ Liệu Tự Động (Data Mapping Logic)

| Trường trên Mẫu S2-HKD | Nguồn Dữ Liệu Thực Tế (Database Table / Field) | Field DTO API (`InventoryLedgerEntryResponse`) | Ghi Chú Logic Nghiệp Vụ |
| :--- | :--- | :--- | :--- |
| **Cột A (Số hiệu)** | `reference_type` & `reference_id` (`stock_imports.import_code` / `sales_orders.order_code` / `DC-{id}`) | `voucherNo` | Mã phiếu nhập kho (`NK-...`), Mã đơn hàng (`HD-...`), hoặc Mã phiếu kiểm kê (`DC-...`) |
| **Cột B (Ngày tháng)** | `stock_imports.import_date` / `sales_orders.created_at` / `inventory_transactions.created_at` | `voucherDate` | Ngày ghi trên chứng từ gốc phát sinh giao dịch kho |
| **Cột C (Diễn giải)** | `inventory_transactions.note` | `description` | Lý do nhập/xuất hoặc ghi chú kiểm kê điều chỉnh kho |
| **Cột D (ĐVT)** | `units.unit_name` (liên kết qua `products.base_unit_id`) | `unitName` | Đơn vị tính cơ sở (chuẩn) của sản phẩm trong kho |
| **Cột 1 (Đơn giá)** | `inventory_transactions.unit_cost` | `unitCost` | Giá vốn nhập thực tế hoặc giá vốn bình quân gia quyền tại thời điểm xuất/điều chỉnh |
| **Cột 2, 3 (Nhập)** | `inventory_transactions.quantity_change`, `transaction_value` | `importQuantity`, `importAmount` | Áp dụng khi `transaction_type IN ('STOCK_IN', 'CANCEL_SALE')` hoặc `ADJUSTMENT` có `quantity_change >= 0` |
| **Cột 4, 5 (Xuất)** | `inventory_transactions.quantity_change`, `transaction_value` | `exportQuantity`, `exportAmount` | Áp dụng khi `transaction_type = 'STOCK_OUT'` hoặc `ADJUSTMENT` có `quantity_change < 0` (`abs(quantity_change)`) |
| **Cột 6, 7 (Tồn)** | `inventory_transactions.balance_after`, `balance_value` | `balanceAfterQuantity`, `balanceAfterValue` | Số lượng tồn kho và tổng giá trị tồn kho sau mỗi giao dịch |

---

### 3. Quy Tắc Kế Toán Sổ S2-HKD (Accounting Rules)
1. **Số dư đầu kỳ**:
   - Xác định từ giao dịch cuối cùng (`InventoryTransaction`) trước thời điểm `startDate` (`findFirstBy...CreatedAtLessThanOrderByCreatedAtDescIdDesc`).
   - Nếu trước kỳ chưa có bất kỳ giao dịch kho nào, số dư đầu kỳ mặc định bằng `0`.
   - **Tuyệt đối không dùng trực tiếp số tồn kho hiện tại** (`InventoryBalance.quantityOnHand`) để gán cho số dư lịch sử đầu kỳ.
2. **Loại giao dịch (`transaction_type`)**:
   - `STOCK_IN`: Nhập kho từ phiếu nhập kho của nhà cung cấp.
   - `STOCK_OUT`: Xuất kho bán hàng theo đơn đặt hàng.
   - `CANCEL_SALE`: Hoàn kho hàng bán do hủy đơn đặt hàng.
   - `ADJUSTMENT`: Điều chỉnh số lượng tồn sau kiểm đếm thực tế (tăng hoặc giảm tồn).
3. **Trạng thái giá vốn (`cost_status`)**:
   - `COSTED`: Giao dịch đã được tính toán đơn giá vốn bình quân gia quyền.
   - `COMPLETED`: Giao dịch điều chỉnh kiểm kê đã hoàn tất cập nhật số dư.
4. **Công thức số dư cuối kỳ**:
   $$\text{Số lượng cuối kỳ} = \text{Số lượng đầu kỳ} + \sum \text{Số lượng nhập} - \sum \text{Số lượng xuất}$$
   $$\text{Giá trị cuối kỳ} = \text{Giá trị đầu kỳ} + \sum \text{Thành tiền nhập} - \sum \text{Thành tiền xuất}$$