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

| Trường trên Mẫu S2-HKD | Nguồn Dữ Liệu Hệ Thống (Database Table / Field) | Ghi Chú Logic |
| :--- | :--- | :--- |
| **Cột A (Số hiệu)** | `inventory_transactions.reference_code` | Mã phiếu nhập kho hoặc Mã đơn xuất hàng |
| **Cột B (Ngày tháng)** | `inventory_transactions.created_at` | Thời điểm phát sinh giao dịch kho |
| **Cột C (Diễn giải)** | "Nhập hàng từ NCC {{ supplier }}" / "Xuất bán đơn {{ order_code }}" | Lý do nhập/xuất kho |
| **Cột D (ĐVT)** | `products.unit_name` | Đơn vị tính chính của sản phẩm |
| **Cột 1 (Đơn giá)** | `inventory_transactions.unit_price` | Giá nhập thực tế hoặc Giá xuất kho tính toán |
| **Cột 2, 3 (Nhập)** | `quantity`, `amount` | Cập nhật khi tạo phiếu nhập kho (`type = IMPORT`) |
| **Cột 4, 5 (Xuất)** | `quantity`, `amount` | Cập nhật khi xuất hàng bán (`type = EXPORT`) |
| **Cột 6, 7 (Tồn)** | `current_stock_qty`, `current_stock_amount` | Tồn kho tính toán tự động sau mỗi giao dịch |

---

### 3. Luồng Xử Lý Dữ Liệu Tự Động (Automation Data Flow)
1. **Input**:
   - **Giao dịch Nhập**: Phiếu nhập kho từ Nhà cung cấp được lưu.
   - **Giao dịch Xuất**: Đơn hàng bán ra được duyệt.
2. **Processing**:
   - Lấy thông tin tồn đầu kỳ (`init_qty`, `init_amount`).
   - Nếu là giao dịch **Xuất kho**: Tính toán `unit_price` xuất kho theo thuật toán Bình quân gia quyền hoặc FIFO.
   - Cập nhật số dư tồn kho thời gian thực:
     $$\text{Tồn mới} = \text{Tồn cũ} + \text{Số lượng nhập} - \text{Số lượng xuất}$$
3. **Output**: Ghi nhận một dòng nhật ký kho (`inventory_transactions`) và tự động cập nhật sổ **S2-HKD**.