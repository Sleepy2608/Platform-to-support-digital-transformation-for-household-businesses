# Bản Đồ Ánh Xạ: Quy Định Kế Toán & Thuế Hộ Kinh Doanh -> Tính Năng Của Đồ Án

> **Người tạo**: Nguyễn Lê Huy Tâm  
> **Phiên bản tài liệu**: 2.0  
> **Cập nhật lần cuối**: 2026  

---

## 1. Mục Tiêu Của Bản Đồ Ánh Xạ

Bản đồ này xác định chi tiết sự liên kết giữa các quy định pháp lý (Thông tư 88/2021/TT-BTC, Quyết định 3389/QĐ-BTC, Chính sách thuế Hộ kinh doanh 2026) với cấu trúc cơ sở dữ liệu, nghiệp vụ và tính năng trong đồ án **Nền tảng hỗ trợ chuyển đổi số cho Hộ kinh doanh**.

> [!NOTE]
> **Định vị phạm vi nền tảng**: Nền tảng hướng tới đối tượng **Hộ kinh doanh cá thể** (đặc biệt là mô hình cửa hàng vật liệu xây dựng, đồ kim khí, phụ tùng...), hỗ trợ tự động hóa ghi nhận doanh thu, quản lý kho hàng và hỗ trợ tính toán nghĩa vụ thuế GTGT & TNCN. Hệ thống **không** quản lý thuế TNDN (thuế của doanh nghiệp) và **không thay thế** vai trò kiểm tra, phê duyệt cuối cùng của Chủ hộ (Owner) hoặc cơ quan quản lý thuế.

---

## 2. Bản Đồ Ánh Xạ Theo Nhóm Nội Dung Pháp Lý

| Nội dung pháp lý / Chuẩn mực | Tính năng / Phân hệ trong Đồ án | Dữ liệu & Thành phần hỗ trợ | Mức độ triển khai |
| :--- | :--- | :--- | :---: |
| **Phân loại hộ kinh doanh & Nhóm ngành tính thuế** | Cấu hình nhóm hoạt động kinh doanh, phân loại mặt hàng theo biểu thuế | `tax_activity_groups`, `products.default_tax_activity_group_id`, `sales_order_items.tax_activity_group_id` | **Triển khai đầy đủ** |
| **S1-HKD: Sổ chi tiết doanh thu bán hàng hóa, dịch vụ** | Quản lý đơn bán hàng tại quầy, duyệt đơn nháp AI, tổng hợp doanh thu theo nhóm thuế | `sales_orders`, `sales_order_items`, `customers`, `customer_debts`, `debt_transactions`, `accounting_books`, `generated_reports` | **Triển khai đầy đủ** |
| **S2-HKD: Sổ chi tiết vật liệu, dụng cụ, sản phẩm, hàng hóa** | Quản lý nhập kho, xuất kho bán hàng, tính tồn kho & giá vốn xuất kho (Bình quân gia quyền / FIFO) | `products`, `product_units`, `inventory_balances`, `inventory_transactions`, `generated_reports` | **Triển khai đầy đủ** |
| **S4-HKD: Sổ theo dõi nghĩa vụ thuế với NSNN** | Bộ máy tính thuế (Tax Engine) hỗ trợ GTGT và TNCN theo ngưỡng doanh thu năm & phương pháp tính | `tax_types`, `tax_activity_groups`, `tax_rules`, `tax_obligations`, `tax_payments`, `generated_reports` | **Triển khai đầy đủ (Core: GTGT & TNCN)** |
| **Snapshot quy tắc thuế theo đơn hàng** | Lưu vết thuế suất và phương pháp tính tại thời điểm phát sinh đơn hàng | `sales_order_items.tax_rule_id`, `sales_order_items.tax_rate`, `sales_order_items.tax_calculation_method` | **Triển khai đầy đủ** |
| **Quản lý phiên bản biểu mẫu & chính sách thuế** | Quản lý thời gian hiệu lực của biểu mẫu kế toán và quy tắc thuế (Versioning) | `report_templates`, `report_template_versions`, `tax_rules` (`effective_from`, `effective_to`, `version_tag`) | **Triển khai đầy đủ** |
| **Quy trình kiểm soát & Phê duyệt (Human-in-the-Loop)** | Owner xem xét, chỉnh sửa được phép, phê duyệt hoặc từ chối báo cáo kế toán và thuế | `generated_reports.status`, `tax_obligations.status`, `audit_logs` | **Triển khai đầy đủ** |
| **Tạo đơn nháp tự động bằng AI (AI Order Draft)** | Trợ lý AI phân tích câu lệnh tiếng Việt thành đơn hàng nháp ở trạng thái PENDING | `ai_order_drafts`, `notifications`, giao diện xác nhận đơn | **Triển khai đầy đủ** |
| **Thuế tùy chọn / mở rộng (TTĐB, BVMT, Tài nguyên, XNK)** | Thiết kế kiến trúc & CSDL mở rộng, sẵn sàng cấu hình quy tắc khi có phát sinh | Bảng `tax_types`, `tax_rules` hỗ trợ mở rộng mã thuế linh hoạt | **Sẵn sàng cấu hình (Configurable)** |
| **Thuế Thu nhập Doanh nghiệp (CIT/TNDN)** | Thuế của doanh nghiệp, không áp dụng cho hộ kinh doanh | Không triển khai trong module thuế HKD | **Ngoài phạm vi (Out of Scope)** |
| **S3-HKD, S5-HKD, S6-HKD, S7-HKD** | Các sổ chi phí toàn diện, tiền lương, quỹ tiền mặt, tiền gửi ngân hàng chuyên sâu | Không nằm trong phạm vi trọng tâm của đồ án | **Ngoài phạm vi (Out of Scope)** |

---

## 3. Chi Tiết Ánh Xạ Nghiệp Vụ & Cơ Sở Dữ Liệu

### 3.1. Phân loại nhóm hoạt động tính thuế
- Theo quy định, doanh thu HKD được phân loại theo các nhóm ngành nghề chính để áp dụng tỷ lệ thuế GTGT và TNCN tương ứng:
  - `DISTRIBUTION`: Phân phối, cung cấp hàng hóa (VLXD, kim khí...).
  - `SERVICE`: Dịch vụ, xây dựng không bao thầu NVL.
  - `PRODUCTION_TRANSPORT`: Sản xuất, vận tải, xây dựng có bao thầu NVL.
  - `OTHER`: Hoạt động kinh doanh khác.
- Trong CSDL, thông tin được lưu tại `tax_activity_groups`. Mỗi sản phẩm có `default_tax_activity_group_id`, khi bán hàng được snapshot vào `sales_order_items.tax_activity_group_id`.

### 3.2. S1-HKD: Doanh thu bán hàng hóa, dịch vụ
- Dữ liệu bán hàng từ đơn hàng tại quầy (`sales_orders`) hoặc đơn nháp AI đã xác nhận (`ai_order_drafts` $\to$ `CONFIRMED`).
- Phân tách doanh thu từng mặt hàng theo nhóm ngành để ghi nhận vào các cột tương ứng của sổ S1-HKD.
- Nếu bán chịu/công nợ: Doanh thu vẫn ghi nhận vào S1-HKD, đồng thời theo dõi qua `customer_debts` và `debt_transactions`.

### 3.3. S2-HKD: Nhập - Xuất - Tồn kho
- Nhập kho: Ghi nhận số lượng và giá trị mua thực tế (`inventory_transactions` loại `IMPORT`).
- Xuất kho: Tự động trừ tồn khi đơn bán hàng hoàn tất (`inventory_transactions` loại `EXPORT`).
- Hỗ trợ tính giá xuất kho theo phương pháp Bình quân gia quyền hoặc FIFO.

### 3.4. S4-HKD: Nghĩa vụ thuế với NSNN & Tax Engine 2026
- **Phân tầng 3 cấp độ thuế trong đồ án**:
  1. **Core Scope (Triển khai thực tế)**:
     - **Thuế GTGT**: Tính theo tỷ lệ % doanh thu với HKD có doanh thu năm $> 500$ triệu đồng.
     - **Thuế TNCN**:
       - Doanh thu $\le 500$ triệu: Miễn nộp.
       - Doanh thu $500\text{tr} - 3\text{ tỷ}$: Hỗ trợ phương pháp trên doanh thu $(\text{Doanh thu} - 500\text{tr}) \times \text{Tỷ lệ TNCN}$ hoặc phương pháp thu nhập tính thuế $(\text{Doanh thu} - \text{Chi phí}) \times 15\%$.
       - Doanh thu $> 3\text{ tỷ}$: Phương pháp thu nhập tính thuế với thuế suất 17% (đến 50 tỷ) hoặc 20% (trên 50 tỷ).
  2. **Configurable / Future Extension (Kiến trúc sẵn sàng)**:
     - `SCT` (Tiêu thụ đặc biệt), `ENVIRONMENTAL` (Bảo vệ môi trường), `RESOURCE` (Tài nguyên), `IMPORT_EXPORT` (Xuất nhập khẩu).
  3. **Out of Scope (Ngoài phạm vi)**:
     - Thuế TNDN (CIT), Thuế nhà thầu, Thuế sử dụng đất phi nông nghiệp.
- **Dữ liệu thực thể**:
  - `tax_obligations`: Lưu nghĩa vụ thuế phát sinh theo từng kỳ (tháng, quý, năm) sau khi Tax Engine tính toán.
  - `tax_payments`: Lưu vết các lần nộp thuế thực tế theo Giấy nộp tiền vào NSNN.
  - Số liệu S4-HKD thể hiện rõ: Số dư đầu kỳ, phát sinh phải nộp, số đã nộp, và số còn phải nộp / nộp thừa cuối kỳ.

### 3.5. Xử lý ranh giới dữ liệu chi phí đối với TNCN trên thu nhập tính thuế
- Hệ thống không quản lý sổ chi phí S3-HKD toàn diện.
- Khi áp dụng phương pháp TNCN trên thu nhập tính thuế $(\text{Doanh thu} - \text{Chi phí}) \times \text{Thuế suất}$, hệ thống tự động trích xuất giá vốn hàng bán từ **S2-HKD**, đồng thời cung cấp giao diện để Chủ hộ (Owner) kiểm tra và nhập bổ sung các chi phí vận hành hợp lý khác trước khi chốt số liệu nghĩa vụ thuế.

### 3.6. Quản lý phiên bản chính sách thuế (Tax Policy Versioning)
- Đảm bảo tính nhất quán lịch sử: Mọi giao dịch phát sinh trong quá khứ được tính toán và lưu snapshot theo quy tắc thuế có hiệu lực tại thời điểm đó (`sales_order_items.tax_rule_id`, `sales_order_items.tax_rate`).
- Khi chính sách thuế thay đổi theo năm tài chính mới, quy tắc mới chỉ áp dụng cho các giao dịch phát sinh sau ngày hiệu lực.

### 3.7. Luồng Quy Trình Nghiệp Vụ & Tax Engine Workflow

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

### 3.8. Nguyên tắc Human-in-the-Loop & Audit Trail
- Toàn bộ đề xuất tính thuế, đơn hàng nháp AI và báo cáo sổ sách S1/S2/S4 đều yêu cầu sự xác nhận hoặc phê duyệt của người dùng (Employee xác nhận đơn, Owner phê duyệt báo cáo).
- Mọi thao tác phê duyệt, chỉnh sửa số liệu, nộp thuế đều được ghi lại trong `audit_logs`.

---

## 4. Bảng Tóm Tắt Trạng Thái Triển Khai

```
┌───────────────────────────────┬───────────────────────────────────┬──────────────────────┐
│ Phân Hệ Nghiệp Vụ             │ Mục Tiêu Pháp Lý & Quy Chuẩn      │ Trạng Thái Đồ Án     │
├───────────────────────────────┼───────────────────────────────────┼──────────────────────┤
│ Bán hàng & Doanh thu          │ S1-HKD Doanh thu chi tiết         │ Hoàn thiện           │
│ Quản lý tồn kho               │ S2-HKD Nhập - Xuất - Tồn          │ Hoàn thiện           │
│ Quản lý công nợ               │ Sổ theo dõi nợ khách hàng         │ Hoàn thiện           │
│ Bộ máy tính thuế (Tax Engine) │ Ngưỡng DT 2026, Thuế GTGT + TNCN  │ Hoàn thiện (Core)    │
│ Sổ theo dõi nghĩa vụ thuế     │ S4-HKD Nghĩa vụ thuế với NSNN     │ Hoàn thiện           │
│ Phiên bản hoá biểu mẫu/thuế   │ Quản trị hiệu lực theo thời gian  │ Hoàn thiện           │
│ Phê duyệt & Nhật ký (Audit)   │ Minh bạch, kiểm soát trách nhiệm  │ Hoàn thiện           │
│ Thuế mở rộng (TTĐB, BVMT...)  │ Sẵn sàng cấu hình trong CSDL      │ Sẵn sàng mở rộng     │
│ Thuế TNDN (Doanh nghiệp)      │ Thuế CIT cho pháp nhân            │ Ngoài phạm vi HKD    │
│ S3, S5, S6, S7-HKD            │ Chi phí toàn diện, lương, quỹ...  │ Ngoài phạm vi HKD    │
└───────────────────────────────┴───────────────────────────────────┴──────────────────────┘
```

---

## 5. Kết Luận

Bản đồ ánh xạ khẳng định sự gắn kết chặt chẽ giữa thiết kế kỹ thuật của đồ án với khung pháp lý thực tế:
- Đồ án đáp ứng trọn vẹn mô hình kế toán cốt lõi của Thông tư 88/2021/TT-BTC với 3 sổ: **S1-HKD, S2-HKD, S4-HKD**.
- Hệ thống bám sát chính sách thuế 2026 với cơ chế phân tầng ngưỡng doanh thu 500 triệu, 3 tỷ, 50 tỷ và hỗ trợ các phương pháp tính thuế GTGT và TNCN linh hoạt.
- Phạm vi được phân định rõ ràng, không ôm đồm các loại thuế doanh nghiệp (TNDN) hay các sổ kế toán phức tạp ngoài mục tiêu chuyển đổi số cho hộ kinh doanh.
