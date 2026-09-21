# Mẫu S4-HKD: Sổ Theo Dõi Tình Hình Thực Hiện Nghĩa Vụ Thuế Với NSNN
*(Ban hành kèm theo Thông tư số 88/2021/TT-BTC ngày 11/10/2021 của Bộ trưởng Bộ Tài chính & Chính sách thuế 2026)*

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

| Trường trên Mẫu S4-HKD | Nguồn Dữ Liệu Hệ Thống (Database Table / Field) | Ghi Chú Logic & Quy Tắc Tính 2026 |
| :--- | :--- | :--- |
| **Cột A (Số hiệu)** | `tax_obligations.id` hoặc `tax_payments.payment_voucher_code` | Mã kỳ nghĩa vụ thuế hoặc Số giấy nộp tiền vào NSNN |
| **Cột B (Ngày tháng)** | `tax_obligations.created_at` hoặc `tax_payments.payment_date` | Ngày xác lập nghĩa vụ thuế hoặc ngày thực hiện nộp tiền |
| **Cột C (Diễn giải)** | `tax_obligations.note` / `tax_payments.note` | Diễn giải kỳ thuế (ví dụ: *"Thuế GTGT phát sinh Quý 1/2026"*, *"Nộp thuế GTGT theo GNT số 12345"*) |
| **Cột 1 (Số phải nộp)** | `tax_obligations.calculated_tax_amount` | Do **Tax Engine** tự động tính toán dựa trên ngưỡng doanh thu năm, nhóm ngành nghề, phương pháp tính thuế và quy tắc hiệu lực |
| **Cột 2 (Số đã nộp)** | `tax_payments.amount_paid` | Tổng số tiền thuế đã nộp thực tế theo các chứng từ nộp tiền vào NSNN có xác nhận |

---

### 3. Luồng Xử Lý Dữ Liệu & Quy Tắc Tax Engine (Automation Data Flow)

1. **Input (Dữ liệu đầu vào)**:
   - Tổng doanh thu phân loại theo nhóm ngành từ sổ **S1-HKD**.
   - Ngưỡng doanh thu lũy kế trong năm tài chính ($\le 500\text{tr}$, $500\text{tr} - 3\text{ tỷ}$, $3\text{ tỷ} - 50\text{ tỷ}$, $> 50\text{ tỷ}$).
   - Phương pháp tính thuế TNCN được lựa chọn (Phương pháp tỷ lệ trên doanh thu vượt 500tr hoặc Phương pháp thu nhập tính thuế).
   - Chứng từ nộp thuế thực tế (Giấy nộp tiền vào NSNN kèm xác nhận của Owner).

3. **Processing (Quy trình tính toán Tax Engine)**:

```
                     SALES ORDER
                          │
                          ▼
                ┌───────────────────┐
                │  Confirmed Order  │
                └─────────┬─────────┘
                          │
                          ▼
                    Record Revenue
                          │
                          ▼
                  Determine Activity
                          │
                          ▼
                 Check Annual Revenue
                          │
         ┌────────────────┼────────────────┐
         │                │                │
      ≤ 500m           500m–3b            > 3b
         │                │                │
       No VAT           VAT %            VAT %
       No PIT           + PIT            + PIT
                          │                │
                    Choose method     Income-based
                          │                │
                          ▼                ▼
                             Tax Engine
                                  │
                                  ▼
                               S4-HKD
                                  │
                                  ▼
                             Owner Review
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                 APPROVE                      REJECT
                    │                           │
                    ▼                           ▼
              Tax Obligation            Edit / Recalculate
                    │
                    ▼
               Tax Payment
                    │
                    ▼
             Payment History
```

   - **Xác định điều kiện miễn/không chịu thuế**: Nếu doanh thu năm $\le 500$ triệu đồng $\implies$ `tax_payable = 0` (Trạng thái *NOT_SUBJECT_TO_TAX*).
   - **Tính thuế GTGT**:
     $$\text{Thuế GTGT} = \text{Doanh thu tính thuế} \times \text{Tỷ lệ GTGT theo ngành}$$
   - **Tính thuế TNCN**:
     - *Phương pháp doanh thu (500tr - 3 tỷ)*: $\text{Thuế TNCN} = (\text{Doanh thu} - 500.000.000) \times \text{Tỷ lệ TNCN theo ngành}$.
     - *Phương pháp thu nhập tính thuế*: $\text{Thuế TNCN} = (\text{Doanh thu} - \text{Chi phí hợp lý}) \times \text{Thuế suất tương ứng (15%, 17%, 20%)}$.
   - **Tính toán số dư nghĩa vụ cuối kỳ**:
     $$\text{Số thuế còn phải nộp/nộp thừa} = (\text{Thuế phải nộp đầu kỳ} + \text{Phát sinh phải nộp trong kỳ}) - \text{Số đã nộp trong kỳ}$$

4. **Owner Review & Output**:
   - Chủ hộ kinh doanh (Owner) kiểm tra các số liệu tính toán, chỉnh sửa chi phí (nếu áp dụng phương pháp thu nhập) và tiến hành **Phê duyệt (Approve)** hoặc **Từ chối (Reject/Recalculate)**.
   - Khi Approve $\to$ ghi nhận `tax_obligations`, tiến hành nộp thuế `tax_payments` và lưu `payment_history`.
   - Xuất file sổ **S4-HKD** dưới dạng PDF hoặc Excel đúng biểu mẫu Thông tư 88/2021/TT-BTC.