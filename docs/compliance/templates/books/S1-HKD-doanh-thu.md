# Mẫu S1-HKD: Sổ Chi Tiết Doanh Thu Bán Hàng Hóa, Dịch Vụ
*(Ban hành kèm theo Thông tư số 88/2021/TT-BTC ngày 11/10/2021 của Bộ trưởng Bộ Tài chính)*

**HỘ, CÁ NHÂN KINH DOANH**: {{ business_name }}  
**Địa chỉ**: {{ business_address }}  
**Tên địa điểm kinh doanh**: {{ store_location }}  
**Năm**: {{ fiscal_year }}  

---

### 1. Biểu Mẫu Sổ Kế Toán

| Ngày, tháng ghi sổ (A) | Chứng từ - Số hiệu (B) | Chứng từ - Ngày, tháng (C) | Diễn giải (D) | Doanh thu: Phân phối, cung cấp hàng hóa (1) | Doanh thu: Dịch vụ, xây dựng không bao thầu NVL (2) | Doanh thu: Sản xuất, vận tải, DV có gắn với hàng hóa (3) | Doanh thu: Hoạt động kinh doanh khác (4) | Ghi chú |
| :---: | :---: | :---: | :--- | :---: | :---: | :---: | :---: | :--- |
| {{ record_date }} | {{ doc_no }} | {{ doc_date }} | {{ description }} | {{ revenue_cat_1 }} | {{ revenue_cat_2 }} | {{ revenue_cat_3 }} | {{ revenue_cat_4 }} | {{ note }} |
| **Tổng cộng** | | | | **{{ total_cat_1 }}** | **{{ total_cat_2 }}** | **{{ total_cat_3 }}** | **{{ total_cat_4 }}** | |

---

### 2. Hướng Dẫn Mapping Dữ Liệu Tự Động (Data Mapping Logic)

| Trường trên Mẫu S1-HKD | Nguồn Dữ Liệu Hệ Thống (Database Table / Field) | Ghi Chú Logic |
| :--- | :--- | :--- |
| **Cột A (Ngày ghi sổ)** | `orders.confirmed_at` | Ngày đơn hàng được duyệt/xác nhận thành công |
| **Cột B (Số hiệu)** | `orders.order_code` | Mã đơn hàng duy nhất |
| **Cột C (Ngày chứng từ)** | `orders.created_at` | Ngày tạo đơn hàng |
| **Cột D (Diễn giải)** | `orders.note` hoặc "Bán hàng theo đơn {{ order_code }}" | Tóm tắt nội dung bán hàng |
| **Cột 1** | `SUM(order_items.subtotal)` | Các sản phẩm có `category.tax_group = 1` (Hàng hóa, VLXD, kim khí) |
| **Cột 2** | `SUM(order_items.subtotal)` | Các mục có `category.tax_group = 2` (Dịch vụ không NVL) |
| **Cột 3** | `SUM(order_items.subtotal)` | Các mục có `category.tax_group = 3` (Vận chuyển, gia công có NVL) |
| **Cột 4** | `SUM(order_items.subtotal)` | Các mục có `category.tax_group = 4` (Hoạt động khác) |

---

### 3. Luồng Xử Lý Dữ Liệu Tự Động (Automation Data Flow)
1. **Input**: Đơn hàng tạo tại quầy hoặc Đơn nháp AI (AI Draft Order) được xác nhận.
2. **Processing**:
   - Hệ thống quét danh sách các mục trong đơn hàng (`order_items`).
   - Tra cứu nhóm thuế (`tax_group`) của từng loại mặt hàng.
   - Phân bổ giá trị thanh toán vào biến doanh thu tương ứng.
3. **Output**: Thêm bản ghi mới vào sổ **S1-HKD** trong cơ sở dữ liệu và tự động cập nhật tổng doanh thu trong ngày.