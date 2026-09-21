# Quyết Định 3389/QĐ-BTC - Tiêu Chí Phân Loại Hộ Kinh Doanh & Cấu Hình Hệ Thống

## 1. Tổng Quan

Quyết định số 3389/QĐ-BTC của Bộ Tài chính quy định tiêu chí phân loại Hộ kinh doanh (HKD) nhằm áp dụng chế độ quản lý thuế và mức độ chuyển đổi số phù hợp. Kết hợp với chính sách thuế hộ kinh doanh áp dụng từ năm 2026, nền tảng phân chia cấu hình vận hành và hỗ trợ nghiệp vụ tương ứng cho các nhóm quy mô HKD.

---

## 2. Tiêu Chí Phân Loại & Cấu Hình Ứng Dụng Tương Ứng

### 2.1. Hộ Kinh Doanh Quy Mô Nhỏ (Doanh thu $\le 500$ triệu đồng/năm)
- **Đặc điểm kinh doanh**:
  - Doanh thu năm không vượt quá 500 triệu đồng.
  - Thuộc diện **không chịu thuế GTGT** và **không phải nộp thuế TNCN**.
  - Hoạt động bán lẻ đơn giản, ít mặt hàng phức tạp.
- **Cấu hình trên Nền tảng (System Behavior)**:
  - **Giao diện**: Tối giản (Minimalist UI), thao tác nhanh.
  - **Bán hàng & Kho**: Hỗ trợ tạo đơn nhanh tại quầy, AI Trợ lý tạo đơn nháp từ câu lệnh tiếng Việt.
  - **Sổ kế toán & Thuế**: Tự động ghi nhận Sổ chi tiết doanh thu (**S1-HKD**). Trên **S4-HKD**, hệ thống ghi nhận trạng thái không phát sinh nghĩa vụ thuế GTGT/TNCN (`NOT_SUBJECT_TO_TAX`).

### 2.2. Hộ Kinh Doanh Quy Mô Vừa & Lớn (Doanh thu $> 500$ triệu đồng/năm - Phương pháp Kê khai)
- **Đặc điểm kinh doanh**:
  - Thuộc các ngành nghề như VLXD, kim khí, phụ tùng, thiết bị điện nước...
  - Doanh thu năm trên 500 triệu đồng (phân tầng: $500\text{tr} - 3\text{ tỷ}$, $3\text{ tỷ} - 50\text{ tỷ}$, hoặc $> 50\text{ tỷ}$).
  - Có phát sinh công nợ khách hàng, nhập kho nhiều đợt, đa dạng đơn vị tính (bao, kg, thanh, cây, m³, chuyến...).
- **Cấu hình trên Nền tảng (System Behavior)**:
  - **Giao diện**: Bảng điều khiển đầy đủ (Full Dashboard) bao gồm quản lý kho hàng, quản lý công nợ, luồng phê duyệt báo cáo.
  - **Sổ sách kế toán cốt lõi**: Đồng bộ 03 sổ kế toán bắt buộc gồm **S1-HKD** (Doanh thu), **S2-HKD** (Kho hàng), và **S4-HKD** (Nghĩa vụ thuế).
  - **Tax Engine**: Kích hoạt bộ máy tính thuế tự động hỗ trợ GTGT và TNCN theo đúng ngưỡng doanh thu và phương pháp tính hợp lệ (Revenue-based / Income-based).

---

## 3. Phạm Vi Triển Khai Của Hệ Thống Theo Đồ Án

### 3.1. Các sổ kế toán được hỗ trợ trong phạm vi hiện tại
Theo mục tiêu nghiệp vụ của đồ án hỗ trợ chuyển đổi số hộ kinh doanh, hệ thống tập trung vào các sổ và quy trình cốt lõi sau:

1. **S1-HKD**: Theo dõi chi tiết doanh thu bán hàng hóa, dịch vụ theo nhóm hoạt động và tỷ lệ tính thuế.
2. **S2-HKD**: Theo dõi hàng hóa, vật tư, nguyên liệu, nhập - xuất - tồn kho và giá xuất kho (Bình quân gia quyền / FIFO).
3. **S4-HKD**: Theo dõi nghĩa vụ thuế GTGT và TNCN, số đã nộp vào NSNN, số còn phải nộp hoặc nộp thừa.

### 3.2. Phạm vi không đưa vào triển khai hiện tại
Để giữ đồ án đúng trọng tâm và khả thi, hệ thống không triển khai các phân hệ sau:

- **S3-HKD** (sổ chi phí sản xuất, kinh doanh);
- **S5-HKD** (sổ theo dõi lương và các khoản nộp theo lương);
- **S6-HKD** (sổ quỹ tiền mặt);
- **S7-HKD** (sổ tiền gửi ngân hàng);
- Quản lý chi phí sản xuất - kinh doanh toàn diện theo phương pháp hạch toán kế toán doanh nghiệp;
- Kế toán tiền lương, BHXH, BHTN chuyên sâu;
- **Thuế Thu nhập Doanh nghiệp (CIT/TNDN)**: Không thuộc đối tượng hộ kinh doanh;
- Đối soát tài khoản ngân hàng và các thủ tục nộp thuế trực tuyến tới cổng cơ quan nhà nước.

> [!IMPORTANT]
> **Ràng buộc thiết kế bắt buộc**: Nền tảng là hệ thống hỗ trợ kế toán và tính toán thuế cho Hộ kinh doanh. Mọi số liệu báo cáo, sổ sách và nghĩa vụ thuế đều cần sự kiểm tra, phê duyệt cuối cùng của Chủ hộ kinh doanh (Owner). Hệ thống không thay thế trách nhiệm của người nộp thuế hay thẩm quyền của cơ quan quản lý thuế.

---

## 4. Quy Trình Nghiệp Vụ & Logic Xử Lý Bắt Buộc

### 4.1. Xác nhận đơn và ghi nhận doanh thu
Khi đơn bán hàng hoặc đơn nháp AI (AI Order Draft) được Employee/Owner xác nhận:
- Gán đúng nhóm hoạt động tính thuế (`tax_activity_group_id`) theo từng dòng sản phẩm.
- Lưu snapshot quy tắc thuế tại thời điểm bán hàng (`tax_rule_id`, `tax_rate`, `tax_calculation_method`).
- Cập nhật doanh thu tương ứng vào **S1-HKD**.
- Cập nhật công nợ khách hàng (`customer_debts`, `debt_transactions`) nếu đơn hàng bán chịu/ghi nợ.
- Ghi log hành động và định danh người xác nhận.

### 4.2. Nhập kho và xuất kho (S2-HKD)
- **Nhập kho**: Phiếu nhập xác nhận làm tăng tồn kho và tính giá trị nhập theo giá mua thực tế.
- **Xuất kho**: Đơn hàng bán xác nhận làm giảm tồn kho đúng số lượng và đơn vị tính quy đổi.
- **Giá xuất kho**: Tính theo phương pháp Bình quân gia quyền hoặc FIFO theo cấu hình hiệu lực.
- Toàn bộ lịch sử nhập - xuất - tồn được bảo toàn theo thời gian phục vụ kiểm tra đối chiếu.

### 4.3. Nghĩa vụ thuế và S4-HKD (Tax Engine 2026)
Hệ thống xử lý nghĩa vụ thuế trên S4-HKD theo quy trình:
1. **Tổng hợp doanh thu**: Tổng hợp doanh thu lũy kế trong năm từ S1-HKD.
2. **Kiểm tra ngưỡng doanh thu năm**:
   - $\le 500$ triệu: Không phát sinh thuế GTGT và TNCN.
   - $> 500$ triệu đến $3$ tỷ: Tính GTGT trên doanh thu; TNCN cho phép chọn tính theo tỷ lệ trên doanh thu vượt 500 triệu hoặc tính 15% trên thu nhập tính thuế.
   - $> 3$ tỷ: Tính GTGT trên doanh thu; TNCN tính theo thu nhập tính thuế với thuế suất 17% (3–50 tỷ) hoặc 20% (> 50 tỷ).
3. **Áp dụng phiên bản quy tắc thuế (Tax Rule Versioning)**: Sử dụng đúng quy tắc có hiệu lực tại thời điểm phát sinh kỳ báo cáo, không lấy quy tắc mới tính lại kỳ cũ.
4. **Theo dõi thanh toán thuế**: Ghi nhận các chứng từ nộp tiền vào NSNN thực tế (`tax_payments`), tự động tính số dư còn phải nộp hoặc nộp thừa.

### 4.4. Phê duyệt và từ chối báo cáo (Human-in-the-Loop)
- Báo cáo S1, S2, S4 và nghĩa vụ thuế do hệ thống tổng hợp tự động luôn ở trạng thái dự thảo/chờ duyệt.
- Owner có quyền:
  - Xem xét chi tiết từng dòng dữ liệu;
  - Chỉnh sửa các trường thông tin được phép (kèm lý do);
  - Phê duyệt (`APPROVED`) để ban hành nội bộ hoặc xuất file;
  - Từ chối (`REJECTED`) kèm lý do để yêu cầu kiểm tra lại.

---

## 5. Kiểm Soát Dữ Liệu, Phiên Bản & Audit Log

### 5.1. Phiên bản cấu hình thuế và biểu mẫu
- Quản lý phiên bản biểu mẫu S1, S2, S4 và quy tắc thuế theo ngày bắt đầu và kết thúc hiệu lực (`effective_from`, `effective_to`).
- Phiên bản mới chỉ áp dụng cho các giao dịch phát sinh từ thời điểm bắt đầu hiệu lực.
- Tuyệt đối bảo toàn nguyên vẹn số liệu và quy tắc áp dụng cho các giao dịch lịch sử trong quá khứ.

### 5.2. Audit Trail
Mọi thao tác nghiệp vụ quan trọng (phê duyệt đơn nháp, duyệt báo cáo, sửa số liệu thuế, nộp thuế) đều được ghi nhật ký hệ thống (`audit_logs`) với đầy đủ thông tin: người thực hiện, thời gian, giá trị cũ/mới và lý do thay đổi.

---

## 6. Kết Luận

Quyết định 3389/QĐ-BTC và các chính sách thuế hiện hành tạo cơ sở vững chắc cho việc thiết kế nền tảng:
- Giữ đúng phạm vi trọng tâm hỗ trợ Hộ kinh doanh: **S1-HKD**, **S2-HKD**, **S4-HKD**.
- Phân tầng rõ ràng giữa Thuế cốt lõi HKD (GTGT, TNCN) và các loại thuế mở rộng (TTĐB, BVMT) hoặc ngoài phạm vi (TNDN).
- Áp dụng nguyên tắc Human-in-the-loop: Tự động hóa tính toán nhưng tôn trọng quyền kiểm tra và phê duyệt của Chủ hộ kinh doanh.