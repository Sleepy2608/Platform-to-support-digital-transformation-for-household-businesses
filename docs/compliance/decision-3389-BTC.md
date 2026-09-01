# Quyết Định 3389/QĐ-BTC - Tiêu Chí Phân Loại Hộ Kinh Doanh & Cấu Hình Hệ Thống

## 1. Tổng Quan
Quyết định số 3389/QĐ-BTC của Bộ Tài chính quy định tiêu chí phân loại Hộ kinh doanh (HKD) nhằm áp dụng chế độ quản lý thuế và mức độ chuyển đổi số phù hợp.

---

## 2. Tiêu Chí Phân Loại & Cấu Hình Ứng Dụng Tương Ứng

### 2.1. Hộ Kinh Doanh Nhóm 1 (Quy Mô Nhỏ / Thuế Khoán)
- **Đặc điểm kinh doanh**:
  - Quy mô doanh thu thấp, số lượng lao động ít.
  - Hoạt động mua bán đơn giản, không yêu cầu theo dõi tồn kho phức tạp.
- **Cấu hình trên Nền nền tảng (System Behavior)**:
  - **Giao diện**: Tối giản (Minimalist UI), phù hợp với người dùng có độ mù công nghệ cao.
  - **Tính năng trọng tâm**: Tạo đơn bán hàng nhanh tại quầy, hỗ trợ tạo đơn bằng giọng nói qua AI Trợ lý.
  - **Sổ sách kế toán**: Tự động ghi nhận và theo dõi Sổ chi tiết doanh thu bán hàng (**S1-HKD**).

### 2.2. Hộ Kinh Doanh Nhóm 2 (Quy Mô Vừa & Lớn / Phương Pháp Kê Khai)
- **Đặc điểm kinh doanh**:
  - Thuộc các ngành nghề như VLXD, kim khí, phụ tùng, vật tư xây dựng...
  - Có phát sinh công nợ dài hạn, nhập kho nhiều đợt, đa dạng đơn vị tính (bao, kg, chuyến, m3).
- **Cấu hình trên Nền tảng (System Behavior)**:
  - **Giao diện**: Đầy đủ bảng điều khiển (Full Dashboard) bao gồm quản lý tồn kho, công nợ và báo cáo.
  - **Sổ sách kế toán**: Kích hoạt đồng bộ bộ 03 sổ kế toán bắt buộc chuẩn Thông tư 88/2021/TT-BTC bao gồm **S1-HKD** (Doanh thu), **S2-HKD** (Kho hàng), và **S4-HKD** (Nghĩa vụ thuế).
  - **Tính năng tích hợp**: Quản lý đa đơn vị tính, theo dõi công nợ khách hàng chi tiết theo thời gian thực.

---

## 3. Phạm Vi Triển Khai Của Hệ Thống Theo Đồ Án

### 3.1. Các sổ kế toán được hỗ trợ trong phạm vi hiện tại
Theo mục tiêu nghiệp vụ của đồ án, hệ thống chỉ triển khai theo đúng các phần thuộc ngành nghề và mô hình hoạt động của hộ kinh doanh nhỏ và vừa theo phương pháp kê khai. Phạm vi hiện tại tập trung vào các sổ và quy trình sau:

1. **S1-HKD**: theo dõi doanh thu bán hàng hóa, dịch vụ theo nhóm hoạt động và tỷ lệ tính thuế. 
2. **S2-HKD**: theo dõi hàng hóa, vật tư, nguyên liệu, nhập - xuất - tồn kho và giá xuất kho. 
3. **S4-HKD**: theo dõi nghĩa vụ thuế, số đã nộp, số còn phải nộp hoặc nộp thừa. 

### 3.2. Phạm vi không đưa vào triển khai hiện tại
Hệ thống hiện tại không triển khai hoặc không giả định là đã hỗ trợ đầy đủ các phần sau theo Thông tư 88/2021/TT-BTC:

- **S3-HKD** (sổ chi phí sản xuất, kinh doanh);
- **S5-HKD** (sổ theo dõi lương và các khoản nộp theo lương);
- **S6-HKD** (sổ quỹ tiền mặt);
- **S7-HKD** (sổ tiền gửi ngân hàng);
- quản lý chi phí sản xuất - kinh doanh đầy đủ theo phương pháp hạch toán tổng hợp;
- chứng từ lương, BHXH, BHTN theo quy trình kèm theo kế toán doanh nghiệp lớn;
- phân bổ thuế theo nhiều nghĩa vụ cùng lúc ở mức độ phức tạp hơn; 
- đối soát tài khoản ngân hàng và toàn bộ thủ tục nộp thuế tới cơ quan nhà nước.

> Đây là ràng buộc bắt buộc trong thiết kế: hệ thống tự động hóa theo đồ án là một nền tảng hỗ trợ kế toán hộ kinh doanh trong phạm vi quản lý bán hàng, kho, cong nợ và nghĩa vụ thuế, không thay thế công việc kiểm tra cuối cùng của chủ hộ kinh doanh hoặc cơ quan thuế có thẩm quyền.

---

## 4. Quy Trình Nghiệp Vụ Bắt Buộc Trong Hệ Thống

### 4.1. Xác nhận đơn và ghi nhận doanh thu
Khi đơn bán hàng hoặc draft order được Employee/Owner xác nhận, hệ thống cần:

- lưu trữ dữ liệu đơn hàng và khách hàng;
- gán đúng nhóm hoạt động tính thuế theo danh mục sản phẩm hoặc nhóm ngành kinh doanh;
- cập nhật doanh thu vào **S1-HKD**;
- tùy theo trạng thái thanh toán, ghi nhận số đã thanh toán và số còn nợ;
- lưu nhật ký thay đổi và người xác nhận.

### 4.2. Nhập kho và xuất kho
Đối với S2-HKD, hệ thống cần đảm bảo:

- phiếu nhập làm tăng tồn kho và tính giá trị nhập đúng theo giá thực tế;
- đơn hàng xác nhận làm giảm tồn kho đúng số lượng và đơn vị tính;
- doanh thu trong kho phải tương ứng với đơn vị đã được định nghĩa tại sản phẩm;
- phương pháp tính giá xuất kho phải rõ ràng: tính theo bình quân gia quyền hoặc FIFO, theo cấu hình hiệu lực của từng giai đoạn;
- dữ liệu tồn đầu kỳ, nhập trong kỳ và xuất trong kỳ phải có thể kiểm tra lịch sử theo thời gian.

### 4.3. Nghĩa vụ thuế và S4-HKD
Trong S4-HKD, yêu cầu hệ thống phải:

- tổng hợp doanh thu theo nhóm hoạt động tính thuế;
- tính thuế theo tỷ lệ cấu hình đã được lưu theo thời điểm phát sinh;
- theo dõi số đã nộp và số còn phải nộp hoặc nộp thừa;
- cho phép Owner kiểm tra trước khi chốt báo cáo;
- không tự động đổi dữ liệu cũ khi cấu hình thuế mới có hiệu lực từ thời điểm sau.

### 4.4. Phê duyệt và từ chối báo cáo
Một báo cáo hoặc sổ kế toán không được coi là hoàn tất nếu chưa qua trạng thái phê duyệt theo quyền của Owner. Quy trình yêu cầu:

- báo cáo được tạo tự động từ dữ liệu đã xác nhận;
- Owner xem, kiểm tra và chỉnh sửa dữ liệu được phép sửa;
- Owner xác nhận hoặc từ chối báo cáo;
- nếu từ chối, hệ thống lưu lý do và người thực hiện từ chối;
- trạng thái cuối cùng phải ghi rõ thời gian, người thao tác và hành động.

---

## 5. Kiểm Soát Dữ Liệu, Phiên Bản & Lưu Trữ

### 5.1. Phiên bản cấu hình thuế và biểu mẫu
Hệ thống phải quản lý các phiên bản cấu hình nhóm hoạt động, tỷ lệ thuế và biểu mẫu S1/S2/S4 theo thời gian hiệu lực. Khi có thay đổi mới:

- phiên bản cũ vẫn giữ nguyên trong quá khứ;
- dữ liệu đã phát sinh không bị ghi đè ngẫu nhiên;
- phiên bản mới chỉ áp dụng cho giao dịch phát sinh sau thời điểm hiệu lực.

### 5.2. Audit log và truy vết
Mọi thay đổi quan trọng cần có nhật ký truy vết, bao gồm:

- người thao tác;
- thời gian thực hiện;
- đối tượng bị thay đổi;
- giá trị trước/sau; 
- lý do chỉnh sửa hoặc phê duyệt.

### 5.3. Lưu trữ và bảo mật
Theo logic của hệ thống và quy định kế toán, dữ liệu cần được lưu trữ đủ lâu theo quy định pháp lý hiện hành của Việt Nam. Đặc biệt:

- dữ liệu đơn hàng, nhập kho, công nợ và thuế phải bảo toàn toàn bộ lịch sử phát sinh;
- giao dịch đã chốt không nên bị xóa mà chỉ được ghi nhận bằng trạng thái và log; 
- dữ liệu báo cáo và sổ phải có khả năng truy xuất theo kỳ, theo người ký và theo thời điểm hiệu lực.

---

## 6. Ràng Buộc Thiết Kế Của Đồ Án

### 6.1. Hệ thống hỗ trợ người dùng chứ không thay thế quyền kiểm tra chuyên môn
Nền tảng không phải là phần mềm kế toán đầy đủ theo nghĩa hành chính kế toán doanh nghiệp lớn. Nó hỗ trợ người dùng bằng cách:

- tóm tắt và tự động hóa dữ liệu kế toán cốt lõi;
- giảm thao tác thủ công và sai sót; 
- tăng minh bạch dữ liệu cho kiểm tra của Owner; 
- vẫn yêu cầu người có thẩm quyền xác nhận báo cáo trước khi sử dụng trong nghĩa vụ thuế hoặc báo cáo nội bộ.

### 6.2. Dữ liệu được lưu dựa trên sự kiện đã xác nhận
Hệ thống chỉ ghi nhận các dữ liệu phục vụ sổ kế toán từ các sự kiện đã được xác nhận như:

- đơn hàng hoàn tất;
- phiếu nhập kho xác nhận;
- giao dịch thanh toán/công nợ xác nhận;
- cơ chế nộp thuế đã được ghi nhận.

---

## 7. Kết Luận

Quyết định 3389/QĐ-BTC cung cấp cơ sở phân loại và cấu hình theo nhóm hộ kinh doanh, nhưng với đồ án hiện tại, phần quan trọng nhất là áp dụng đúng các nguyên tắc sau:

- chỉ triển khai S1-HKD, S2-HKD và S4-HKD trong phạm vi hiện tại;
- gắn doanh thu và thuế theo nhóm hoạt động và thời điểm phát sinh;
- kiểm soát việc phê duyệt trước khi sử dụng báo cáo; 
- lưu toàn bộ lịch sử dữ liệu và cấu hình thuế theo phiên bản; 
- không vượt quá phạm vi kế toán phức tạp không nằm trong mục tiêu của đồ án.

Đây là sự phù hợp cần thiết để tài liệu pháp lý, thiết kế hệ thống và yêu cầu nghiệp vụ đồng bộ với nhau và với mục tiêu thực tế của dự án.