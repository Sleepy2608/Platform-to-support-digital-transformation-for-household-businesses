# Quy Định Kế Toán Theo Thông Tư 88/2021/TT-BTC & Tự Động Hóa Hệ Thống

## 1. Tổng Quan & Cơ Sở Pháp Lý
Thông tư số 88/2021/TT-BTC do Bộ Tài chính ban hành ngày 11/10/2021 (có hiệu lực từ 01/01/2022) hướng dẫn chế độ kế toán cho các hộ kinh doanh, cá nhân kinh doanh nộp thuế theo phương pháp kê khai. 

Nền tảng ứng dụng Thông tư 88/2021/TT-BTC để:
1. Tự động hóa quá trình lập chứng từ, sổ kế toán từ dữ liệu bán hàng/nhập hàng.
2. Đảm bảo tính chính xác, minh bạch và đúng chuẩn biểu mẫu của Bộ Tài chính khi xuất báo cáo thuế.

---

## 2. Phạm Vi Áp Dụng Loại Sổ Kế Toán Cốt Lõi
Theo yêu cầu nghiệp vụ chuyên biệt của hệ thống quản lý hộ kinh doanh, nền tảng tự động hóa 03 loại sổ kế toán trọng tâm sau:

1. **Sổ S1-HKD**: Sổ chi tiết doanh thu bán hàng hóa, dịch vụ.
2. **Sổ S2-HKD**: Sổ chi tiết vật liệu, dụng cụ, sản phẩm, hàng hóa.
3. **Sổ S4-HKD**: Sổ theo dõi tình hình thực hiện nghĩa vụ thuế với Ngân sách Nhà nước (NSNN).

---

## 3. Bảng Tỷ Lệ % Thuế GTGT & TNCN Tính Trên Doanh Thu

Hệ thống căn cứ vào phân loại nhóm ngành nghề trên **S1-HKD** để tự động tính nghĩa vụ thuế GTGT và TNCN ghi nhận vào **S4-HKD**:

| STT | Danh Mục Ngành Nghề Kinh Doanh | Tỷ Lệ Thuế GTGT | Tỷ Lệ Thuế TNCN | Tổng Tỷ Lệ Trích Nộp |
| :---: | :--- | :---: | :---: | :---: |
| **1** | **Phân phối, cung cấp hàng hóa** (Bán lẻ VLXD, đồ kim khí, vật tư xây dựng...) | 1.0% | 0.5% | **1.5%** |
| **2** | **Dịch vụ, xây dựng không bao thầu nguyên vật liệu** | 5.0% | 2.0% | **7.0%** |
| **3** | **Sản xuất, vận tải, dịch vụ có gắn với hàng hóa, xây dựng có bao thầu NVL** | 3.0% | 1.5% | **4.5%** |
| **4** | **Hoạt động kinh doanh khác** | 2.0% | 1.0% | **3.0%** |

---

## 4. Quy Tắc Tự Động Hóa Kế Toán (System Automation Rules)

### 4.1. Hạch Toán Doanh Thu (S1-HKD)
- **Sự kiện kích hoạt (Trigger)**: Khi đơn hàng được xác nhận hoàn thành (đơn hàng bán tại quầy hoặc đơn hàng nháp do AI đề xuất được Nhân viên/Chủ cửa hàng duyệt).
- **Quy tắc xử lý**:
  - Hệ thống bóc tách các mặt hàng trong đơn theo từng danh mục nhóm ngành thuế.
  - Tự động cộng dồn doanh thu vào cột tương ứng trên **S1-HKD**.
  - Nếu đơn hàng ghi nợ: Hệ thống cập nhật doanh thu vào **S1-HKD**, đồng thời lưu vết khoản nợ vào Hồ sơ công nợ khách hàng (`customer_debts`).

### 4.2. Hạch Toán Kho & Xuất Hàng (S2-HKD)
- **Sự kiện kích hoạt (Trigger)**: Khi xác nhận Phiếu nhập kho (Import) hoặc Đơn bán hàng thành công (Export).
- **Quy tắc xử lý**:
  - **Nhập kho**: Tự động tăng số lượng tồn, lưu đơn giá nhập và tính tổng thành tiền nhập.
  - **Xuất kho**: Tự động giảm số lượng tồn kho. Đơn giá xuất kho áp dụng phương pháp **Bình quân gia quyền (Weighted Average)** hoặc **FIFO (Nhập trước xuất trước)** tùy cấu hình.
  - **Công thức Bình quân gia quyền cả kỳ dự trữ**:
    $$\text{Đơn giá xuất} = \frac{\text{Giá trị tồn đầu kỳ} + \text{Giá trị nhập trong kỳ}}{\text{Số lượng tồn đầu kỳ} + \text{Số lượng nhập trong kỳ}}$$

### 4.3. Hạch Toán Nghĩa Vụ Thuế (S4-HKD)
- **Sự kiện kích hoạt (Trigger)**: Định kỳ (Cuối ngày/Tháng/Quý) hoặc khi phát sinh chứng từ nộp thuế vào NSNN.
- **Quy tắc xử lý**:
  - **Số thuế phải nộp**:
    $$\text{Thuế GTGT/TNCN phải nộp} = \text{Doanh thu nhóm ngành (S1-HKD)} \times \text{Tỷ lệ \% thuế tương ứng}$$
  - **Số thuế đã nộp**: Cập nhật khi ghi nhận Giấy nộp tiền vào NSNN / Phiếu chi thuế.
  - **Số thuế còn nợ/nộp thừa**:
    $$\text{Thuế còn nộp/nộp thừa} = (\text{Thuế dư đầu kỳ} + \text{Thuế phải nộp trong kỳ}) - \text{Thuế đã nộp}$$

---

## 5. Phạm Vi Triển Khai Của Đồ Án Và Các Giới Hạn Bắt Buộc

### 5.1. Các sổ được tự động hóa trong mô hình hiện tại
Nền tảng hiện tại chỉ tự động hóa các phần trực tiếp phục vụ hoạt động kinh doanh của hộ kinh doanh nhỏ và vừa theo mô hình bán hàng + kho + nghĩa vụ thuế, cụ thể:

- **S1-HKD**: doanh thu bán hàng theo nhóm ngành và tỷ lệ thuế;
- **S2-HKD**: hàng hóa nhập - xuất - tồn theo từng mã hàng;
- **S4-HKD**: nghĩa vụ thuế và tổng số đã nộp, còn nợ/nộp thừa.

### 5.2. Phần không nằm trong phạm vi triển khai hiện tại
Các phần dưới đây được coi là ngoài phạm vi của đồ án hiện tại và không được coi là yêu cầu bắt buộc phải triển khai đồng bộ với thông tư:

- S3-HKD, S5-HKD, S6-HKD, S7-HKD;
- quản lý quỹ tiền mặt và ngân hàng toàn diện;
- kế toán chi phí sản xuất - kinh doanh toàn bộ; 
- chấm công, bảng lương, bảo hiểm bắt buộc;
- đối soát tổng hợp với hồ sơ thuế và cơ quan nhà nước.

### 5.3. Yêu cầu kiểm soát và người xác nhận cuối cùng
Vì hệ thống là hệ thống hỗ trợ, không phải hệ thống kế toán độc lập toàn diện, mọi báo cáo cần được xác nhận bởi Owner hoặc người có thẩm quyền trước khi xem như dữ liệu chính thức để lập báo cáo, kiểm tra hoặc nộp thuế. Nếu dữ liệu cần điều chỉnh, hệ thống phải lưu lại lý do điều chỉnh và ghi nhật ký truy vết rõ ràng.

---

## 6. Yêu Cầu Về Kiểm Soát Dữ Liệu, Phiên Bản và Audit Trail

### 6.1. Phiên bản thuế và biểu mẫu
Hệ thống phải ghi nhận thời điểm hiệu lực của từng phiên bản tỷ lệ thuế, nhóm hoạt động và biểu mẫu S1/S2/S4. Điều này đảm bảo:

- dữ liệu cũ không bị thay đổi theo cấu hình mới; 
- phiên bản mới chỉ áp dụng từ thời điểm bắt đầu hiệu lực; 
- báo cáo trong kỳ cũ vẫn có thể truy xuất đúng phiên bản sử dụng.

### 6.2. Cách lưu dữ liệu
Tất cả dữ liệu phục vụ kế toán cần được lưu theo dạng sự kiện có xác nhận, bao gồm:

- đơn hàng xác nhận; 
- nhập kho xác nhận; 
- thanh toán/công nợ xác nhận; 
- nộp thuế xác nhận; 
- phê duyệt hoặc từ chối báo cáo.

### 6.3. Nhật ký hệ thống
Nhật ký hệ thống bắt buộc phải lưu:

- người thực hiện;
- thời gian;
- mô tả hành động;
- dữ liệu trước và sau khi thay đổi;
- trạng thái sau khi phê duyệt hoặc từ chối.

---

## 7. Kết Luận

Thông tư 88/2021/TT-BTC đặt nền tảng cho việc xây dựng hệ thống kế toán hộ kinh doanh theo hướng hỗ trợ tự động hóa. Trong bối cảnh đồ án, phần phát triển cần đi đúng trọng tâm: tập trung vào dữ liệu bán hàng, kho và nghĩa vụ thuế, đảm bảo quy trình xác nhận, hiệu lực cấu hình theo thời gian và khả năng truy vết dữ liệu. Tiêu chí này giúp hệ thống đáp ứng mục tiêu thực tế của dự án mà không vượt quá phạm vi của một nền tảng hỗ trợ kế toán hộ kinh doanh.