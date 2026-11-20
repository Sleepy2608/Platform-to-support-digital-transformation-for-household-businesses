# Hướng Dẫn Chính Sách Thuế Hộ Kinh Doanh (Áp Dụng Từ Năm 2026) & Thiết Kế Tax Engine

> **Tài liệu tham khảo chuyên sâu về chính sách thuế 2026 và kiến trúc module thuế trong Nền tảng hỗ trợ chuyển đổi số cho Hộ kinh doanh**  
> **Cập nhật:** 2026  
> **Phạm vi đối tượng:** Hộ kinh doanh (HKD), Cá nhân kinh doanh  

---

## 1. Bối Cảnh & Sự Thay Đổi Chính Sách Thuế 2026

Từ năm 2026, cơ chế quản lý thuế đối với hộ và cá nhân kinh doanh có những thay đổi mang tính bản lề nhằm hiện đại hóa và đảm bảo công bằng:
1. **Xác lập ngưỡng không chịu thuế / miễn thuế mới**: Nâng ngưỡng doanh thu không chịu thuế GTGT và không phải nộp TNCN lên **500 triệu đồng/năm** (thay cho các ngưỡng cũ trước đây).
2. **Đa dạng hóa phương pháp tính thuế TNCN**:
   - Đối với HKD doanh thu từ trên 500 triệu đến 3 tỷ đồng: Cho phép lựa chọn giữa phương pháp **tính theo tỷ lệ trên phần doanh thu vượt 500 triệu** hoặc phương pháp **tính trên thu nhập tính thuế (15%)**.
   - Đối với HKD doanh thu trên 3 tỷ đồng: Áp dụng phương pháp tính TNCN trên **thu nhập tính thuế** theo các bậc thuế suất (17% cho 3–50 tỷ, 20% cho trên 50 tỷ).
3. **Phân định rõ ràng giữa Hộ kinh doanh và Doanh nghiệp**: Thuế TNDN (Corporate Income Tax - CIT) là thuế của doanh nghiệp, **không áp dụng** cho hộ kinh doanh. Chủ hộ kinh doanh thực hiện nghĩa vụ thuế thông qua Thuế Thu nhập cá nhân (TNCN).

---

## 2. Chi Tiết Chính Sách Thuế GTGT & TNCN Theo Từng Ngưỡng Doanh Thu

### 2.1. Bảng Tổng Hợp Ngưỡng & Thuế Suất

| Ngưỡng Doanh Thu Năm | Nghĩa Vụ Thuế GTGT | Nghĩa Vụ Thuế TNCN | Cơ Sở Tính Toán |
| :--- | :--- | :--- | :--- |
| **$\le 500$ triệu đồng** | **Không chịu thuế GTGT** | **Không phải nộp TNCN** | Cả năm không phát sinh nghĩa vụ thuế GTGT & TNCN |
| **$> 500$ triệu đến $\le 3$ tỷ đồng** | $\text{Doanh thu} \times \text{Tỷ lệ GTGT}$ | **Lựa chọn 1:** $(\text{Doanh thu} - 500\text{tr}) \times \text{Tỷ lệ TNCN}$<br/>**Lựa chọn 2:** $(\text{Doanh thu} - \text{Chi phí}) \times 15\%$ | Chủ hộ lựa chọn phương pháp phù hợp nhất với mô hình chi phí của mình |
| **$> 3$ tỷ đến $\le 50$ tỷ đồng** | $\text{Doanh thu} \times \text{Tỷ lệ GTGT}$ | $(\text{Doanh thu} - \text{Chi phí hợp lý}) \times \mathbf{17\%}$ | Phương pháp thu nhập tính thuế |
| **$> 50$ tỷ đồng** | $\text{Doanh thu} \times \text{Tỷ lệ GTGT}$ | $(\text{Doanh thu} - \text{Chi phí hợp lý}) \times \mathbf{20\%}$ | Phương pháp thu nhập tính thuế |

### 2.2. Tỷ Lệ Thuế Theo Nhóm Ngành Hoạt Động (Tax Activity Groups)

Áp dụng khi tính thuế GTGT (và tính TNCN theo phương pháp tỷ lệ doanh thu):

| Nhóm Hoạt Động Kinh Doanh | Mã Nhóm | Tỷ Lệ GTGT | Tỷ Lệ TNCN (Doanh thu) | Ghi Chú Ngành Nghề |
| :--- | :---: | :---: | :---: | :--- |
| **Phân phối, cung cấp hàng hóa** | `DISTRIBUTION` | **1.0%** | **0.5%** | Bán buôn/bán lẻ VLXD, đồ kim khí, vật tư phụ tùng, thiết bị điện nước |
| **Dịch vụ, xây dựng không bao thầu NVL** | `SERVICE` | **5.0%** | **2.0%** | Sửa chữa máy móc, dịch vụ vận chuyển nhỏ, thi công lắp đặt không bao NVL |
| **Sản xuất, vận tải, dịch vụ có gắn với hàng hóa, xây dựng có bao thầu NVL** | `PRODUCTION_TRANSPORT` | **3.0%** | **1.5%** | Gia công cơ khí, cắt sắt thép theo yêu cầu, vận tải hàng hóa thương mại |
| **Hoạt động kinh doanh khác** | `OTHER` | **2.0%** | **1.0%** | Các hoạt động thương mại dịch vụ khác chưa phân loại |

---

## 3. Kiến Trúc Phân Tầng Thuế (3 Tax Tiers)

Để hệ thống vừa tập trung giải quyết bài toán cốt lõi của hộ kinh doanh VLXD/kim khí, vừa đảm bảo tính linh hoạt mở rộng trong tương lai:

```
                  ┌─────────────────────────────────────┐
                  │          TIER 1: CORE TAX           │
                  │   - Thuế GTGT (VAT)                 │
                  │   - Thuế TNCN Chủ hộ (PIT)          │
                  │   ==> Triển khai đầy đủ Tax Engine   │
                  └──────────────────┬──────────────────┘
                                     │
                  ┌──────────────────▼──────────────────┐
                  │       TIER 2: CONFIGURABLE TAX      │
                  │   - Thuế Tiêu thụ đặc biệt (SCT)    │
                  │   - Thuế Bảo vệ môi trường (BVMT)   │
                  │   - Thuế Tài nguyên                 │
                  │   - Thuế Xuất nhập khẩu             │
                  │   ==> Thiết kế sẵn schema mở rộng    │
                  └──────────────────┬──────────────────┘
                                     │
                  ┌──────────────────▼──────────────────┐
                  │       TIER 3: OUT OF SCOPE          │
                  │   - Thuế TNDN (Doanh nghiệp)        │
                  │   - Thuế Nhà thầu, Thuế Đất         │
                  │   ==> Không đưa vào HKD module       │
                  └─────────────────────────────────────┘
```

---

## 4. Luồng Quy Trình Nghiệp Vụ Thuế (Tax Calculation & Obligation Workflow)

Hệ thống tuân thủ nghiêm ngặt quy trình chuẩn từ đơn bán hàng đến ghi nhận thanh toán nghĩa vụ thuế:

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

### Chi tiết các bước thực hiện trong luồng:
1. **Sales Order $\to$ Confirmed Order**: Đơn hàng bán tại quầy hoặc đơn hàng nháp do AI đề xuất được xác nhận chính thức.
2. **Record Revenue**: Tự động ghi nhận doanh thu vào Sổ chi tiết doanh thu (**S1-HKD**).
3. **Determine Activity**: Phân loại từng dòng sản phẩm theo Nhóm hoạt động kinh doanh tính thuế (`tax_activity_groups`).
4. **Check Annual Revenue**: Đối chiếu tổng doanh thu lũy kế trong năm với các mốc ngưỡng:
   - **$\le 500$ triệu**: Không phát sinh thuế GTGT (`No VAT`), không phải nộp TNCN (`No PIT`).
   - **$500$ triệu đến $3$ tỷ**: Thuế GTGT tính theo % doanh thu; Thuế TNCN cho phép lựa chọn giữa Phương pháp tỷ lệ trên doanh thu vượt 500 triệu hoặc Phương pháp thu nhập tính thuế (15%).
   - **$> 3$ tỷ**: Thuế GTGT tính theo % doanh thu; Thuế TNCN bắt buộc tính theo Phương pháp thu nhập tính thuế (17% cho 3–50 tỷ, 20% cho trên 50 tỷ).
5. **Tax Engine**: Tự động tải quy tắc thuế có hiệu lực (`Tax Rule Versioning`) và tính toán số thuế GTGT và TNCN phải nộp.
6. **S4-HKD**: Điền số liệu dự kiến vào Sổ theo dõi tình hình thực hiện nghĩa vụ thuế với NSNN (**S4-HKD**).
7. **Owner Review**: Chủ hộ kinh doanh (Owner) trực tiếp kiểm tra, rà soát số liệu:
   - **APPROVE (Chấp thuận)**: Chuyển nghĩa vụ thành chính thức (`tax_obligations`), sẵn sàng cho việc ghi nhận nộp thuế (`tax_payments`) và lưu vết lịch sử thanh toán (`payment_history`).
   - **REJECT (Từ chối)**: Yêu cầu điều chỉnh, bổ sung chi phí hợp lệ hoặc tính toán lại (`Edit / Recalculate`), lưu nhật ký hệ thống (`audit_logs`).

---

## 5. Thiết Kế Cơ Sở Dữ Liệu Cho Tax Engine

Hệ thống quản lý thuế qua các thực thể linh hoạt, không hard-code công thức trong mã nguồn:

### 5.1. Bảng `tax_types`
Quản lý danh mục các loại thuế:
```sql
CREATE TABLE tax_types (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- 'VAT', 'PIT', 'SCT', 'ENVIRONMENTAL', 'RESOURCE', 'IMPORT_EXPORT'
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_core BOOLEAN DEFAULT TRUE, -- TRUE cho VAT/PIT, FALSE cho các thuế mở rộng
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5.2. Bảng `tax_activity_groups`
Quản lý nhóm ngành nghề tính thuế theo quy định:
```sql
CREATE TABLE tax_activity_groups (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL, -- 'DISTRIBUTION', 'SERVICE', 'PRODUCTION_TRANSPORT', 'OTHER'
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5.3. Bảng `tax_rules` & `tax_rule_versions`
Quản lý các quy tắc thuế theo ngưỡng doanh thu, phương pháp tính và khoảng thời gian hiệu lực:
```sql
CREATE TABLE tax_rules (
    id VARCHAR(36) PRIMARY KEY,
    tax_type_id VARCHAR(36) REFERENCES tax_types(id),
    activity_group_id VARCHAR(36) REFERENCES tax_activity_groups(id),
    revenue_threshold_min NUMERIC(15, 2) DEFAULT 0,
    revenue_threshold_max NUMERIC(15, 2), -- NULL nếu không giới hạn trên
    calculation_method VARCHAR(50) NOT NULL, -- 'REVENUE_DIRECT', 'REVENUE_EXCESS_500M', 'TAXABLE_INCOME'
    rate NUMERIC(5, 4) NOT NULL, -- 0.0100 (1%), 0.0050 (0.5%), 0.1500 (15%), 0.1700 (17%), 0.2000 (20%)
    deduction_amount NUMERIC(15, 2) DEFAULT 0, -- 500,000,000 cho TNCN vượt ngưỡng
    effective_from TIMESTAMP NOT NULL,
    effective_to TIMESTAMP, -- NULL nếu đang còn hiệu lực
    version_tag VARCHAR(50) NOT NULL, -- 'VN_TAX_2026_V1'
    is_active BOOLEAN DEFAULT TRUE
);
```

### 5.4. Snapshot Dữ Liệu Bán Hàng Trong `sales_order_items`
Để đảm bảo dữ liệu quá khứ không bị thay đổi khi cấu hình thuế cập nhật:
```sql
ALTER TABLE sales_order_items ADD COLUMN tax_activity_group_id VARCHAR(36) REFERENCES tax_activity_groups(id);
ALTER TABLE sales_order_items ADD COLUMN tax_rule_id VARCHAR(36) REFERENCES tax_rules(id);
ALTER TABLE sales_order_items ADD COLUMN tax_rate NUMERIC(5, 4);
ALTER TABLE sales_order_items ADD COLUMN tax_calculation_method VARCHAR(50);
```

### 5.5. Bảng `tax_obligations` & `tax_payments` (S4-HKD)
```sql
CREATE TABLE tax_obligations (
    id VARCHAR(36) PRIMARY KEY,
    period_type VARCHAR(20) NOT NULL, -- 'MONTH', 'QUARTER', 'YEAR'
    period_key VARCHAR(20) NOT NULL,  -- '2026-Q1', '2026'
    tax_type_id VARCHAR(36) REFERENCES tax_types(id),
    total_revenue NUMERIC(15, 2) NOT NULL,
    taxable_amount NUMERIC(15, 2) NOT NULL,
    calculated_tax_amount NUMERIC(15, 2) NOT NULL,
    calculation_method_used VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'DRAFT', -- 'DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'
    approved_by VARCHAR(36) REFERENCES users(id),
    approved_at TIMESTAMP,
    note TEXT
);

CREATE TABLE tax_payments (
    id VARCHAR(36) PRIMARY KEY,
    tax_obligation_id VARCHAR(36) REFERENCES tax_obligations(id),
    payment_voucher_code VARCHAR(100) NOT NULL, -- Số giấy nộp tiền vào NSNN
    amount_paid NUMERIC(15, 2) NOT NULL,
    payment_date TIMESTAMP NOT NULL,
    payment_method VARCHAR(50), -- 'BANK_TRANSFER', 'CASH'
    recorded_by VARCHAR(36) REFERENCES users(id),
    note TEXT
);
```

---

## 6. Các Kịch Bản Nghiệp Vụ Cụ Thể (Business Test Cases)

### Kịch bản 1: HKD quy mô nhỏ, doanh thu năm 400.000.000 VNĐ
- **Đầu vào**: Doanh thu cả năm 400 triệu đồng.
- **Xử lý**: $400\text{tr} \le 500\text{tr} \implies$ Thuộc diện không chịu GTGT và không phải nộp TNCN.
- **Kết quả**:
  - Thuế GTGT: **0 VNĐ**
  - Thuế TNCN: **0 VNĐ**
  - Trạng thái sổ S4-HKD: `NOT_SUBJECT_TO_TAX`
  - *Lưu ý*: Toàn bộ doanh thu vẫn được lưu vết đầy đủ trong S1-HKD phục vụ theo dõi nội bộ.

### Kịch bản 2: HKD VLXD doanh thu năm 2.000.000.000 VNĐ (Chọn phương pháp TNCN Doanh thu)
- **Đầu vào**: Cửa hàng bán lẻ VLXD/kim khí (nhóm `DISTRIBUTION`), doanh thu 2 tỷ đồng. Chủ hộ chọn phương pháp TNCN trên doanh thu.
- **Tính toán GTGT**:
  $$\text{GTGT} = 2.000.000.000 \times 1\% = 20.000.000\text{ VNĐ}$$
- **Tính toán TNCN**:
  $$\text{Doanh thu tính thuế TNCN} = 2.000.000.000 - 500.000.000 = 1.500.000.000\text{ VNĐ}$$
  $$\text{TNCN} = 1.500.000.000 \times 0.5\% = 7.500.000\text{ VNĐ}$$
- **Tổng nghĩa vụ thuế**: $20.000.000 + 7.500.000 = 27.500.000\text{ VNĐ}$.

### Kịch bản 3: HKD quy mô lớn doanh thu năm 5.000.000.000 VNĐ (Bắt buộc TNCN theo Thu nhập tính thuế)
- **Đầu vào**: Doanh thu 5 tỷ đồng ($> 3\text{ tỷ}$).
- **Tính toán GTGT**:
  $$\text{GTGT} = 5.000.000.000 \times 1\% = 50.000.000\text{ VNĐ}$$
- **Tính toán TNCN (Income-based)**:
  - Giả định chi phí hợp lý được chấp nhận (giá vốn hàng hóa từ S2-HKD + chi phí vận hành hợp lệ do Owner cung cấp): 4 tỷ đồng.
  - Thu nhập tính thuế: $5.000.000.000 - 4.000.000.000 = 1.000.000.000\text{ VNĐ}$.
  - Thuế suất áp dụng (ngưỡng 3–50 tỷ): **17%**.
  $$\text{TNCN} = 1.000.000.000 \times 17\% = 170.000.000\text{ VNĐ}$$
- **Tổng nghĩa vụ thuế**: $50.000.000 + 170.000.000 = 220.000.000\text{ VNĐ}$.

---

## 7. Ranh Giới Học Thuật & Nguyên Tắc Human-in-the-Loop

1. **Phạm vi dữ liệu chi phí**: Hệ thống không triển khai kế toán chi phí toàn diện (S3-HKD). Với phương pháp TNCN theo thu nhập tính thuế, hệ thống hỗ trợ tính toán dựa trên dữ liệu giá vốn hàng hóa sẵn có từ S2-HKD, đồng thời cho phép Owner bổ sung/xác nhận các chi phí hợp lý khác trước khi chốt số liệu.
2. **Quyền quyết định thuộc về Owner**: Mọi nghĩa vụ thuế do Tax Engine tính toán đều ở dạng bản nháp đề xuất. Chủ hộ kinh doanh phải xem xét, kiểm tra, xác nhận hoặc chỉnh sửa trước khi xuất sổ S4-HKD chính thức.
3. **Tính độc lập của phiên bản chính sách**: Không bao giờ áp dụng quy tắc thuế mới của năm tài chính tiếp theo để tính lại các giao dịch đã phát sinh trong các kỳ quá khứ.
