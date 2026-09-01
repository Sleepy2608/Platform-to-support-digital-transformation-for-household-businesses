# Mẫu S4-HKD: Sổ Theo Dõi Tình Hình Thực Hiện Nghĩa Vụ Thuế Với NSNN
*(Ban hành kèm theo Thông tư số 88/2021/TT-BTC ngày 11/10/2021 của Bộ trưởng Bộ Tài chính)*

**HỘ, CÁ NHÂN KINH DOANH**: {{ business_name }}  
**Địa chỉ**: {{ business_address }}  
**Loại thuế**: {{ tax_type_name }} *(Ví dụ: Thuế Giá trị gia tăng / Thuế Thu nhập cá nhân)*  
**Năm**: {{ fiscal_year }} | **Đơn vị tính**: VNĐ  

---

### 1. Biểu Mẫu Sổ Kế Toán

| Chứng từ - Số hiệu (A) | Chứng từ - Ngày, tháng (B) | Diễn giải (C) | Số thuế phải nộp (1) | Số thuế đã nộp (2) | Ghi chú |
| :---: | :---: | :--- | :---: | :---: | :--- |
| | | **Số dư đầu kỳ** | **{{ init_tax_payable }}** | **{{ init_tax_paid }}** | |
| {{ doc_no }} | {{ doc_date }} | {{ description }} | {{ tax_payable }} | {{ tax_paid }} | {{ note }} |
| | | **Cộng phát sinh trong kỳ** | **{{ total_tax_payable }}** | **{{ total_tax_paid }}** | |
| | | **Số dư cuối kỳ** | **{{ final_tax_payable }}** | **{{ final_tax_paid }}** | |

---

### 2. Hướng Dẫn Mapping Dữ Liệu Tự Động (Data Mapping Logic)

| Trường trên Mẫu S4-HKD | Nguồn Dữ Liệu Hệ Thống (Database Table / Field) | Ghi Chú Logic |
| :--- | :--- | :--- |
| **Cột A (Số hiệu)** | `tax_records.voucher_code` | Mã tờ khai thuế hoặc Số giấy nộp tiền vào NSNN |
| **Cột B (Ngày tháng)** | `tax_records.created_at` | Ngày tính thuế hoặc ngày nộp tiền |
| **Cột C (Diễn giải)** | "Thuế GTGT/TNCN phát sinh tháng/quý {{ period }}" hoặc "Nộp thuế theo giấy nộp tiền {{ code }}" | Nội dung nghiệp vụ thuế |
| **Cột 1 (Số phải nộp)** | `tax_records.amount_payable` | `= Doanh thu nhóm ngành (S1-HKD) * Tỷ lệ % thuế` |
| **Cột 2 (Số đã nộp)** | `tax_records.amount_paid` | Cập nhật khi nộp tiền thuế thực tế vào Ngân sách Nhà nước |

---

### 3. Luồng Xử Lý Dữ Liệu Tự Động (Automation Data Flow)
1. **Input**:
   - Tổng doanh thu theo từng nhóm ngành từ sổ **S1-HKD**.
   - Chứng từ nộp thuế (Giấy nộp tiền vào NSNN kèm Phiếu chi) do Chủ hộ kinh doanh cập nhật.
2. **Processing**:
   - Hệ thống tự động nhân doanh thu từng nhóm với Tỷ lệ % thuế quy định tương ứng để tính toán `tax_payable`.
   - Tính toán nghĩa vụ thuế cuối kỳ:
     $$\text{Số thuế còn phải nộp/nộp thừa} = (\text{Thuế phải nộp đầu kỳ} + \text{Phát sinh phải nộp}) - \text{Số đã nộp}$$
3. **Output**: Xuất file sổ **S4-HKD** dưới dạng PDF hoặc Excel chuẩn mẫu Bộ Tài chính để nộp cơ quan thuế.