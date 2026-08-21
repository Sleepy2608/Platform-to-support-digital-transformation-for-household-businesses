# TÀI LIỆU ĐẶC TẢ YÊU CẦU NGƯỜI DÙNG

## Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh

> **User Requirements Document (URD)**  
> *Platform to Support Digital Transformation for Household Businesses*

---

## Thông tin kiểm soát tài liệu

| Thông tin | Nội dung |
|---|---|
| Tên tài liệu | Tài liệu đặc tả yêu cầu người dùng – Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh |
| Tên tiếng Anh | User Requirements Document – Platform to Support Digital Transformation for Household Businesses |
| Mã tài liệu | URD-HKD-v1.2.0 |  
| Phiên bản | 1.2.0 |
| Người lập | Nguyễn Ngọc Gia Bảo |
| Ngày lập ban đầu | 25/07/2026 |
| Ngày cập nhật | 30/07/2026 |
| Trạng thái | Hoàn thiện để làm đầu vào cho SRS, thiết kế và kiểm thử |

### Lịch sử cập nhật

| Phiên bản | Ngày | Nội dung cập nhật | Người thực hiện |
|---|---|---|---|
| 1.0.0 | 25/07/2026 | Hoàn thiện tài liệu yêu cầu người dùng ban đầu | Nguyễn Ngọc Gia Bảo |
| 1.1.0 | 30/07/2026 | Làm rõ phạm vi học thuật theo Thông tư 88: triển khai S1-HKD, S2-HKD và S4-HKD; bổ sung yêu cầu về phân loại doanh thu, giá trị nhập–xuất–tồn, nghĩa vụ thuế, nộp thuế và kiểm soát báo cáo | Nguyễn Ngọc Gia Bảo |
| 1.2.0 | 18/08/2026 | Cập nhật phân quyền RBAC 4 tầng (Admin -> Manager -> Owner -> Employee); phân định rõ phạm vi trách nhiệm giữa Manager (vận hành) và Administrator (hệ thống) | Nguyễn Ngọc Gia Bảo |

---

## Mục lục

- [1. Giới thiệu](#1-giới-thiệu)
  - [1.1. Mục đích tài liệu](#11-mục-đích-tài-liệu)
  - [1.2. Phạm vi tài liệu](#12-phạm-vi-tài-liệu)
  - [1.3. Đối tượng sử dụng tài liệu](#13-đối-tượng-sử-dụng-tài-liệu)
  - [1.4. Thuật ngữ và từ viết tắt](#14-thuật-ngữ-và-từ-viết-tắt)
  - [1.5. Tài liệu tham khảo và nguyên tắc áp dụng](#15-tài-liệu-tham-khảo-và-nguyên-tắc-áp-dụng)
- [2. Tổng quan hệ thống](#2-tổng-quan-hệ-thống)
  - [2.1. Bối cảnh](#21-bối-cảnh)
  - [2.2. Phát biểu bài toán](#22-phát-biểu-bài-toán)
  - [2.3. Mục tiêu hệ thống](#23-mục-tiêu-hệ-thống)
  - [2.4. Phạm vi chức năng](#24-phạm-vi-chức-năng)
  - [2.5. Nội dung ngoài phạm vi](#25-nội-dung-ngoài-phạm-vi)
  - [2.6. Người sử dụng hệ thống](#26-người-sử-dụng-hệ-thống)
- [3. Yêu cầu chức năng](#3-yêu-cầu-chức-năng)
  - [3.1. Yêu cầu đối với Employee](#31-yêu-cầu-đối-với-employee)
  - [3.2. Yêu cầu đối với Owner](#32-yêu-cầu-đối-với-owner)
  - [3.3. Yêu cầu đối với Manager](#33-yêu-cầu-đối-với-manager)
  - [3.4. Yêu cầu đối với Administrator](#34-yêu-cầu-đối-với-administrator)
  - [3.5. Chức năng tự động của hệ thống và AI](#35-chức-năng-tự-động-của-hệ-thống-và-ai)
- [4. Yêu cầu phi chức năng](#4-yêu-cầu-phi-chức-năng)
- [5. Tiêu chí nghiệm thu ở mức người dùng](#5-tiêu-chí-nghiệm-thu-ở-mức-người-dùng)

---

# 1. GIỚI THIỆU

## 1.1. Mục đích tài liệu

Tài liệu này mô tả các nhu cầu mà **Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh** phải đáp ứng dưới góc nhìn của người sử dụng và người quản trị nền tảng.

Tài liệu là cơ sở thống nhất giữa giảng viên, nhóm phân tích, nhóm thiết kế, nhóm phát triển và nhóm kiểm thử về:

- mục tiêu của hệ thống;
- phạm vi nghiệp vụ;
- nhóm người sử dụng;
- yêu cầu chức năng;
- yêu cầu phi chức năng;
- tiêu chí chấp nhận và nghiệm thu.

Các yêu cầu trong tài liệu được sử dụng làm đầu vào cho SRS, thiết kế kiến trúc, thiết kế cơ sở dữ liệu, thiết kế chi tiết, phát triển phần mềm và kiểm thử. Tài liệu không mô tả chi tiết bảng dữ liệu, API, công nghệ triển khai hoặc cấu hình hạ tầng.

## 1.2. Phạm vi tài liệu

Tài liệu mô tả yêu cầu của bốn nhóm người sử dụng trực tiếp theo phân quyền RBAC 4 tầng:

- Employee (Nhân viên);
- Owner (Chủ hộ kinh doanh);
- Manager (Quản lý vận hành nền tảng);
- Administrator / Admin (Quản trị viên hệ thống).

Ngoài các thao tác do người dùng thực hiện, tài liệu xác định các chức năng tự động của hệ thống và AI, gồm:

- tiếp nhận yêu cầu bằng văn bản hoặc giọng nói;
- tạo Draft Order;
- ghi nhận dữ liệu bán hàng, nhập kho, tồn kho, công nợ và nghĩa vụ thuế;
- tổng hợp dữ liệu để lập S1-HKD, S2-HKD và S4-HKD;
- hỗ trợ Owner kiểm tra và xác nhận kết quả trước khi sử dụng.

## 1.3. Đối tượng sử dụng tài liệu

| Đối tượng | Mục đích sử dụng |
|---|---|
| Giảng viên | Rà soát tính đầy đủ, nhất quán và mức độ bám sát phạm vi đề tài |
| Nhóm phân tích và thiết kế | Xây dựng SRS, mô hình UML, kiến trúc và thiết kế dữ liệu |
| Nhóm phát triển | Hiểu đúng chức năng phải triển khai và tránh phát triển ngoài phạm vi |
| Nhóm kiểm thử | Xây dựng kịch bản kiểm thử và tiêu chí chấp nhận |
| Nhóm triển khai | Hiểu các ràng buộc nghiệp vụ cần bảo toàn khi triển khai hệ thống |

## 1.4. Thuật ngữ và từ viết tắt

| Thuật ngữ | Giải thích |
|---|---|
| URD | Tài liệu đặc tả yêu cầu người dùng (User Requirements Document) |
| Employee | Người trực tiếp xử lý đơn bán hàng và các nghiệp vụ được Owner giao quyền |
| Owner | Chủ hộ hoặc người quản lý hộ kinh doanh; có toàn bộ chức năng của Employee và các quyền quản lý hộ kinh doanh |
| Manager | Quản lý vận hành nền tảng (quản lý tài khoản Owner, theo dõi số liệu hoạt động, xử lý phản hồi, theo dõi thuê bao) |
| Administrator (Admin) | Quản trị viên hệ thống (cấu hình hệ thống, AI, gói thuê bao/bảng giá, biểu mẫu kế toán/thuế, tài khoản Manager, thông báo hệ thống và audit log) |
| Draft Order | Đơn hàng nháp do hệ thống tạo từ yêu cầu bằng văn bản hoặc giọng nói; phải được người dùng kiểm tra trước khi xác nhận |
| Trợ lý AI | Thành phần phân tích ngôn ngữ tự nhiên và hỗ trợ tạo Draft Order |
| POS | Hệ thống bán hàng tại điểm bán (Point of Sale) |
| Gói thuê bao | Gói dịch vụ mà Owner đăng ký để sử dụng nền tảng |
| RBAC | Phân quyền truy cập dựa trên vai trò |
| Audit log | Nhật ký ghi nhận người thực hiện, thời điểm và nội dung của thay đổi quan trọng |
| S1-HKD | Sổ chi tiết doanh thu |
| S2-HKD | Sổ chi tiết vật liệu, dụng cụ, sản phẩm, hàng hóa |
| S4-HKD | Sổ chi tiết nghĩa vụ thuế |
| Tỷ lệ tính thuế | Tỷ lệ phần trăm được cấu hình để hỗ trợ tính số thuế GTGT và TNCN từ doanh thu tính thuế |
| Nghĩa vụ thuế | Khoản thuế, phí hoặc lệ phí mà hộ kinh doanh cần theo dõi trong một kỳ |
| Giá trị nhập–xuất–tồn | Thành tiền của hàng hóa nhập kho, xuất kho và còn tồn tại cuối kỳ |

## 1.5. Tài liệu tham khảo và nguyên tắc áp dụng

| Mã | Tài liệu tham khảo |
|---|---|
| TL-01 | Quyết định số 3389/QĐ-BTC năm 2025 của Bộ Tài chính, được dẫn chiếu trong bối cảnh đề tài |
| TL-02 | Thông tư số 88/2021/TT-BTC của Bộ Tài chính, được dẫn chiếu trong yêu cầu về sổ kế toán |
| TL-03 | Đề bài và phạm vi chức năng được giảng viên giao cho nhóm |

Trong phạm vi học thuật được giảng viên xác nhận, hệ thống triển khai các mẫu **S1-HKD, S2-HKD và S4-HKD theo Thông tư số 88/2021/TT-BTC**.

Nội dung này là phạm vi của đồ án, không phải tuyên bố rằng hệ thống đã triển khai đầy đủ mọi quy định pháp luật hoặc có thể thay thế việc kiểm tra chuyên môn của Owner, kế toán hoặc cơ quan có thẩm quyền.

---

# 2. TỔNG QUAN HỆ THỐNG

## 2.1. Bối cảnh

Hộ kinh doanh hoạt động trong nhiều lĩnh vực truyền thống như vật liệu xây dựng, vật tư, kim khí và hàng hóa tiêu dùng. Nhiều hộ vẫn ghi chép doanh thu, hàng tồn kho và công nợ bằng sổ tay hoặc tệp Excel đơn giản.

Đơn hàng có thể phát sinh tại quầy, qua điện thoại hoặc qua các kênh nhắn tin như Zalo. Việc tiếp nhận đơn từ nhiều kênh dễ dẫn đến nhập liệu chậm, bỏ sót thông tin hoặc sai số lượng.

Nhiều hộ chỉ có điện thoại thông minh và không có đầy đủ thiết bị POS. Người sử dụng cũng có trình độ công nghệ khác nhau, vì vậy hệ thống phải đơn giản, dễ thao tác và không phụ thuộc bắt buộc vào phần cứng chuyên dụng.

Các giải pháp hiện có thường được thiết kế cho nhà hàng, thời trang hoặc doanh nghiệp lớn, trong khi hộ kinh doanh cần một giải pháp tập trung vào:

- bán hàng nhanh;
- nhiều đơn vị tính;
- quản lý tồn kho;
- mua chịu và công nợ;
- đơn hàng đa kênh;
- sổ và báo cáo phù hợp với phạm vi được giao;
- thao tác đơn giản trên thiết bị phổ biến.

## 2.2. Phát biểu bài toán

Cần xây dựng một nền tảng web, ứng dụng di động hoặc kết hợp cả hai để hỗ trợ hộ kinh doanh số hóa các nghiệp vụ cốt lõi.

Hệ thống phải cho phép:

- quản lý sản phẩm, giá, đơn vị tính và tồn kho;
- lập đơn bán hàng tại quầy;
- quản lý khách hàng, thanh toán và công nợ;
- tiếp nhận yêu cầu bằng văn bản hoặc giọng nói;
- sử dụng AI để tạo Draft Order;
- tự động ghi nhận dữ liệu nghiệp vụ;
- tổng hợp dữ liệu để lập S1-HKD, S2-HKD và S4-HKD;
- cho phép Owner kiểm tra và xác nhận kết quả;
- hỗ trợ Administrator quản lý nền tảng và phiên bản biểu mẫu.

## 2.3. Mục tiêu hệ thống

- Số hóa quy trình bán hàng tại quầy và đơn hàng từ điện thoại hoặc kênh nhắn tin.
- Quản lý tập trung sản phẩm, hình ảnh, giá bán, danh mục và nhiều đơn vị tính.
- Theo dõi số lượng và giá trị hàng nhập, xuất và tồn.
- Quản lý hồ sơ khách hàng, lịch sử mua hàng, khoản thanh toán và công nợ.
- Dùng AI để giảm thao tác nhập liệu khi tạo đơn hàng.
- Tự động tổng hợp doanh thu phục vụ S1-HKD.
- Tự động tổng hợp số lượng, đơn giá và thành tiền nhập–xuất–tồn phục vụ S2-HKD.
- Theo dõi nghĩa vụ thuế, số đã nộp và số còn phải nộp phục vụ S4-HKD.
- Cung cấp Dashboard doanh thu, sản phẩm bán chạy, cảnh báo tồn thấp và tổng công nợ.
- Hỗ trợ quản lý tài khoản, thuê bao, cấu hình, biểu mẫu và hoạt động toàn nền tảng.

## 2.4. Phạm vi chức năng

### 2.4.1. Tài khoản và phân quyền

- Đăng nhập.
- Phân quyền theo 4 tầng RBAC: Employee, Owner, Manager và Administrator (Admin).
- Owner quản lý tài khoản Employee thuộc hộ kinh doanh của mình.
- Manager quản lý tài khoản Owner, theo dõi số liệu hoạt động và xử lý phản hồi trên nền tảng.
- Administrator quản lý cấu hình hệ thống, AI, gói thuê bao, biểu mẫu kế toán/thuế, tài khoản Manager và audit log.

### 2.4.2. Sản phẩm và giá bán

- Quản lý danh mục sản phẩm.
- Quản lý hình ảnh và trạng thái sản phẩm.
- Quản lý nhiều đơn vị tính và tỷ lệ quy đổi.
- Quản lý quy tắc giá theo đơn vị hoặc số lượng.
- Thiết lập nhóm hoạt động tính thuế mặc định cho sản phẩm.

### 2.4.3. Bán hàng và công nợ

- Lập đơn tại quầy.
- Tìm kiếm và thêm sản phẩm vào đơn.
- Ghi nhận số đã thanh toán và số còn nợ.
- In và tra cứu đơn bán hàng.
- Quản lý khách hàng và lịch sử mua hàng.
- Theo dõi phát sinh nợ, trả nợ và điều chỉnh công nợ.
- Ghi nhận phương thức và mã tham chiếu của giao dịch thanh toán công nợ khi có.

### 2.4.4. Kho hàng

- Ghi nhận phiếu nhập.
- Theo dõi số lượng tồn.
- Tự động trừ tồn khi đơn hàng được xác nhận.
- Lưu lịch sử biến động kho.
- Tính số lượng, đơn giá và thành tiền nhập–xuất–tồn.
- Sử dụng phương pháp bình quân gia quyền cả kỳ dự trữ trong phạm vi triển khai hiện tại.

### 2.4.5. AI và Draft Order

- Nhận yêu cầu văn bản hoặc giọng nói.
- Nhận diện sản phẩm, số lượng, khách hàng và yêu cầu ghi nợ.
- Tạo Draft Order.
- Gửi thông báo thời gian thực.
- Cho phép Employee hoặc Owner chỉnh sửa, xác nhận hoặc từ chối.

### 2.4.6. Sổ kế toán và nghĩa vụ thuế

- Tổng hợp doanh thu theo nhóm hoạt động tính thuế để lập S1-HKD.
- Tổng hợp số lượng, đơn giá và thành tiền nhập–xuất–tồn để lập S2-HKD.
- Ghi nhận nghĩa vụ thuế và từng lần nộp thuế để lập S4-HKD.
- Tính số đã nộp và số còn phải nộp; chấp nhận số còn phải nộp âm để thể hiện nộp thừa.
- Quản lý phiên bản biểu mẫu và thời gian hiệu lực.
- Cho phép Owner kiểm tra, chỉnh sửa dữ liệu được phép chỉnh sửa, xác nhận hoặc từ chối báo cáo trước khi sử dụng.

### 2.4.7. Quản trị nền tảng

- Quản lý gói thuê bao và giá theo tháng/năm.
- Theo dõi số liệu hoạt động toàn nền tảng.
- Xem và xử lý phản hồi.
- Quản lý cấu hình hệ thống và AI.
- Quản lý nhóm hoạt động và tỷ lệ tính thuế.
- Quản lý phiên bản biểu mẫu S1-HKD, S2-HKD và S4-HKD.
- Phát thông báo đến người dùng.

## 2.5. Nội dung ngoài phạm vi

Phiên bản hiện tại không bao gồm:

- S3-HKD, S5-HKD, S6-HKD và S7-HKD;
- hệ thống quản lý chi phí sản xuất, kinh doanh đầy đủ;
- chấm công và tính lương;
- quản lý quỹ tiền mặt hoàn chỉnh;
- quản lý và đối soát tài khoản ngân hàng;
- tự động kê khai hoặc nộp thuế đến cơ quan thuế;
- tự động xác định chính xác mọi nghĩa vụ thuế mà không cần Owner kiểm tra;
- phân bổ một khoản thanh toán cho nhiều đơn hàng;
- quy trình hoàn tiền phức tạp;
- phân bổ một lần nộp thuế cho nhiều nghĩa vụ;
- tích hợp hóa đơn điện tử với nhà cung cấp bên ngoài;
- yêu cầu bắt buộc sử dụng Redis hoặc thiết bị POS chuyên dụng.

Trong phạm vi hiện tại, “nhật ký thanh toán” bao gồm:

- số tiền thanh toán trực tiếp được ghi nhận trong đơn hàng;
- các giao dịch trả nợ được ghi nhận trong lịch sử công nợ.

## 2.6. Người sử dụng hệ thống

| Nhóm người sử dụng | Vai trò và phạm vi sử dụng |
|---|---|
| Employee | Đăng nhập, lập đơn, ghi nhận công nợ, in đơn, nhận thông báo và xử lý Draft Order |
| Owner | Có toàn bộ quyền của Employee; quản lý sản phẩm, kho, khách hàng, công nợ, nghĩa vụ thuế, sổ, báo cáo và tài khoản Employee |
| Manager | Quản lý vận hành nền tảng: quản lý tài khoản Owner, theo dõi chỉ số hoạt động, xem/xử lý phản hồi, theo dõi trạng thái gói thuê bao |
| Administrator (Admin) | Quản trị viên hệ thống: cấu hình hệ thống, tham số AI, bảng giá/gói thuê bao, biểu mẫu kế toán/thuế, quản lý tài khoản Manager, phát thông báo toàn hệ thống, xem nhật ký truy vết (Audit log) |

---

# 3. YÊU CẦU CHỨC NĂNG

Mỗi yêu cầu có mã riêng và tiêu chí chấp nhận để phục vụ truy vết và kiểm thử.

## 3.1. Yêu cầu đối với Employee

| Mã | Tên và nội dung yêu cầu | Tiêu chí chấp nhận |
|---|---|---|
| FR-NV-01 | **Đăng nhập hệ thống.** Employee đăng nhập bằng tài khoản được cấp và chỉ truy cập chức năng thuộc vai trò. | Thông tin hợp lệ cho phép đăng nhập; thông tin không hợp lệ bị từ chối và có thông báo phù hợp. |
| FR-NV-02 | **Lập đơn bán hàng tại quầy.** Employee tìm kiếm sản phẩm, chọn đơn vị, nhập số lượng, thêm vào giỏ và gắn khách hàng khi cần. | Đơn lưu đúng sản phẩm, đơn vị, số lượng, giá và khách hàng đã chọn. |
| FR-NV-03 | **Ghi nhận thanh toán và công nợ.** Employee ghi nhận số tiền khách đã thanh toán; phần còn lại được ghi nhận là công nợ khi khách hàng hợp lệ. | Tổng tiền, số đã thanh toán và số còn nợ được tính đúng; đơn có nợ bắt buộc gắn với khách hàng. |
| FR-NV-04 | **In và tra cứu đơn bán hàng.** Employee tạo bản in theo mẫu và tra cứu lại đơn đã hoàn tất. | Đơn có thể được gửi đến chức năng in và xuất hiện trong lịch sử. |
| FR-NV-05 | **Nhận thông báo Draft Order.** Employee nhận thông báo thời gian thực khi AI tạo Draft Order mới. | Thông báo xuất hiện mà không cần tải lại toàn bộ trang. |
| FR-NV-06 | **Kiểm tra và xử lý Draft Order.** Employee xem, chỉnh sửa, xác nhận hoặc từ chối Draft Order. | Employee thực hiện được đầy đủ các thao tác và trạng thái đơn được cập nhật đúng. |

## 3.2. Yêu cầu đối với Owner

Owner có toàn bộ chức năng của Employee và các yêu cầu bổ sung sau:

| Mã | Tên và nội dung yêu cầu | Tiêu chí chấp nhận |
|---|---|---|
| FR-CH-01 | **Quản lý sản phẩm.** Owner tạo, cập nhật hoặc ngừng sử dụng sản phẩm; quản lý hình ảnh, danh mục, nhiều đơn vị tính, giá và nhóm hoạt động tính thuế mặc định. | Thông tin sản phẩm, đơn vị, giá và nhóm mặc định được lưu và hiển thị đúng. |
| FR-CH-02 | **Quản lý nhập kho và tồn kho.** Owner ghi nhận nhập hàng, xem tồn hiện tại, lịch sử biến động và giá trị hàng tồn. | Phiếu nhập làm tăng tồn; đơn xác nhận làm giảm tồn; lịch sử và số dư được cập nhật nhất quán. |
| FR-CH-03 | **Quản lý khách hàng, thanh toán và công nợ.** Owner quản lý hồ sơ, lịch sử mua, số dư nợ và các giao dịch trả nợ. | Owner xem được lịch sử mua hàng, số tiền đã thanh toán, số còn nợ và nhật ký công nợ. |
| FR-CH-04 | **Xem Dashboard và phân tích.** Owner xem doanh thu ngày/tuần/tháng, sản phẩm bán chạy, tồn thấp và tổng công nợ. | Các chỉ số và biểu đồ phản ánh đúng kỳ được chọn. |
| FR-CH-05 | **Quản lý tài khoản Employee.** Owner tạo, đặt lại mật khẩu và vô hiệu hóa tài khoản Employee. | Thao tác thành công và được ghi Audit log. |
| FR-CH-06 | **Xem và kiểm tra S1-HKD.** Owner xem doanh thu được phân loại theo nhóm hoạt động và tỷ lệ tính thuế tại thời điểm giao dịch. | Số liệu S1-HKD khớp với đơn hàng đã xác nhận trong kỳ. |
| FR-CH-07 | **Xem và kiểm tra S2-HKD.** Owner xem số lượng, đơn giá và thành tiền nhập–xuất–tồn. | Số liệu S2-HKD khớp với phiếu nhập, giao dịch kho và số dư tồn. |
| FR-CH-08 | **Quản lý nghĩa vụ thuế và S4-HKD.** Owner xem nghĩa vụ phát sinh, từng lần nộp, số đã nộp và số còn phải nộp hoặc nộp thừa. | Số đã nộp bằng tổng các lần nộp; số còn phải nộp được tính đúng và có thể âm khi nộp thừa. |
| FR-CH-09 | **Kiểm tra và phê duyệt sổ/báo cáo.** Owner xem, chỉnh sửa dữ liệu được phép chỉnh sửa, xác nhận hoặc từ chối kết quả trước khi sử dụng. | Hệ thống lưu trạng thái, người kiểm tra, thời gian và lý do từ chối khi có. |

## 3.3. Yêu cầu đối với Manager

| Mã | Tên và nội dung yêu cầu | Tiêu chí chấp nhận |
|---|---|---|
| FR-QL-01 | **Quản lý tài khoản Owner.** Manager xem, tìm kiếm, kích hoạt hoặc vô hiệu hóa tài khoản Owner. | Trạng thái tài khoản được cập nhật đúng và có thể tra cứu. |
| FR-QL-02 | **Theo dõi chỉ số nền tảng.** Manager xem số người dùng hoạt động, số lượng Owner/Employee mới, doanh thu gói đăng ký toàn nền tảng. | Báo cáo và Dashboard hiển thị đúng số liệu thống kê. |
| FR-QL-03 | **Xử lý phản hồi từ người dùng.** Manager xem danh sách phản hồi từ Owner và Employee, cập nhật trạng thái xử lý phản hồi. | Trạng thái được cập nhật đúng và gửi thông báo phản hồi nếu cần. |
| FR-QL-04 | **Theo dõi trạng thái gói thuê bao.** Manager theo dõi lịch sử đăng ký, thời gian hết hạn và tình trạng thanh toán thuê bao của các hộ kinh doanh. | Hiển thị đúng danh sách và trạng thái thuê bao của từng Owner. |

## 3.4. Yêu cầu đối với Administrator (Admin)

| Mã | Tên và nội dung yêu cầu | Tiêu chí chấp nhận |
|---|---|---|
| FR-AD-01 | **Quản lý tài khoản Manager.** Admin thêm mới, cập nhật thông tin, kích hoạt hoặc vô hiệu hóa tài khoản Manager. | Danh sách Manager được cập nhật chính xác và đúng phân quyền. |
| FR-AD-02 | **Quản lý gói thuê bao và bảng giá.** Admin định nghĩa gói thuê bao, cập nhật giá tiền theo tháng/năm, và các giới hạn tài nguyên của gói. | Gói thuê bao mới và giá tiền được cập nhật hiển thị chính xác trên toàn hệ thống. |
| FR-AD-03 | **Quản lý cấu hình hệ thống và AI.** Admin cập nhật cấu hình chung của hệ thống, điều chỉnh tham số mô hình AI. | Cấu hình được áp dụng ngay lập tức và ghi nhận Audit log. |
| FR-AD-04 | **Quản lý biểu mẫu kế toán và thuế.** Admin quản lý phiên bản biểu mẫu S1-HKD, S2-HKD, S4-HKD và cấu hình tỷ lệ thuế, nhóm hoạt động tính thuế. | Phiên bản biểu mẫu mới được thiết lập thời gian hiệu lực và lưu trữ lịch sử các phiên bản cũ. |
| FR-AD-05 | **Phát thông báo hệ thống.** Admin gửi thông báo toàn hệ thống hoặc theo nhóm vai trò cụ thể. | Người dùng nhận được thông báo đúng hạn và đúng đối tượng mục tiêu. |
| FR-AD-06 | **Xem nhật ký hệ thống (Audit log).** Admin xem toàn bộ nhật ký truy vết các thao tác thay đổi cấu hình, vai trò, bảo mật trên nền tảng. | Nhật ký hiển thị đầy đủ thông tin thời gian, tác nhân, hành động và nội dung thay đổi. |

## 3.5. Chức năng tự động của hệ thống và AI

| Mã | Tên và nội dung yêu cầu | Tiêu chí chấp nhận |
|---|---|---|
| FR-HT-01 | **Chuyển ngôn ngữ tự nhiên thành Draft Order.** Hệ thống phân tích văn bản hoặc giọng nói để nhận diện sản phẩm, số lượng, khách hàng và yêu cầu ghi nợ. | Yêu cầu đủ thông tin tạo được Draft Order và chuyển cho người dùng kiểm tra. |
| FR-HT-02 | **Tự động ghi nhận dữ liệu nguồn.** Khi đơn hàng, phiếu nhập, giao dịch công nợ, nghĩa vụ thuế hoặc lần nộp thuế được xác nhận, hệ thống ghi nhận dữ liệu phục vụ sổ. | Dữ liệu sổ có thể truy vết về giao dịch nguồn đã xác nhận. |
| FR-HT-03 | **Tự động tổng hợp S1-HKD.** Hệ thống tổng hợp doanh thu theo nhóm hoạt động tính thuế và tỷ lệ đã lưu tại thời điểm bán. | Số liệu bằng tổng dữ liệu của các đơn đã xác nhận trong kỳ; thay đổi cấu hình mới không làm thay đổi đơn cũ. |
| FR-HT-04 | **Tự động tổng hợp S2-HKD.** Hệ thống tổng hợp đơn vị, đơn giá, số lượng và thành tiền nhập–xuất–tồn. | Số liệu khớp dữ liệu kho; giá trị chính thức được hoàn thiện khi chốt kỳ. |
| FR-HT-05 | **Tự động tổng hợp S4-HKD.** Hệ thống tổng hợp số phải nộp, số đã nộp và số còn phải nộp theo từng loại nghĩa vụ. | Số đã nộp bằng tổng các giao dịch nộp thuế; hệ thống phản ánh được nộp thừa. |
| FR-HT-06 | **Tính số thuế dự kiến.** Hệ thống có thể tính số thuế dự kiến từ doanh thu tính thuế và tỷ lệ được cấu hình. | Công thức sử dụng đúng dữ liệu và tỷ lệ; kết quả được đánh dấu cần Owner kiểm tra. |
| FR-HT-07 | **Quản lý phiên bản và lịch sử.** Hệ thống sử dụng đúng phiên bản biểu mẫu và cấu hình có hiệu lực tại thời điểm lập sổ/báo cáo. | Báo cáo cũ giữ nguyên phiên bản đã sử dụng; phiên bản mới chỉ áp dụng từ thời điểm có hiệu lực. |
| FR-HT-08 | **Thông báo kết quả cần xử lý.** Hệ thống thông báo cho Owner khi có Draft Order, sổ hoặc báo cáo cần kiểm tra. | Owner nhận được thông báo phù hợp và mở được đối tượng cần xử lý. |

---

# 4. YÊU CẦU PHI CHỨC NĂNG

| Mã | Tên và nội dung yêu cầu | Tiêu chí chấp nhận |
|---|---|---|
| NFR-BM-01 | **Bảo vệ dữ liệu hộ kinh doanh.** Đơn hàng, sản phẩm, khách hàng, kho, công nợ, thuế và báo cáo của từng hộ phải được tách biệt. | Người dùng không truy cập được dữ liệu của hộ khác. |
| NFR-BM-02 | **Phân quyền theo vai trò.** Employee, Owner, Manager và Administrator chỉ được thực hiện chức năng thuộc quyền. | Yêu cầu ngoài quyền hạn bị từ chối ở backend. |
| NFR-BM-03 | **Bảo vệ thông tin xác thực.** Mật khẩu không được lưu ở dạng rõ; thông tin kết nối và khóa bí mật không xuất hiện trong mã nguồn công khai. | Kiểm tra hệ thống không phát hiện mật khẩu rõ hoặc secret bị commit. |
| NFR-BM-04 | **Truy vết thay đổi.** Thao tác quan trọng phải ghi người thực hiện, thời điểm và nội dung thay đổi. | Audit log có đủ thông tin để truy vết. |
| NFR-HN-01 | **Thời gian phản hồi.** Các thao tác cốt lõi phải phản hồi dưới 2.000 ms trong môi trường kiểm thử được xác định. | Kết quả đo đạt giới hạn yêu cầu. |
| NFR-HN-02 | **Danh mục lớn.** Tìm kiếm, lọc và phân trang phải hoạt động khi dữ liệu sản phẩm tăng. | Chức năng vẫn đúng và không tải toàn bộ dữ liệu không cần thiết. |
| NFR-HN-03 | **Nhiều người dùng đồng thời.** Hệ thống không làm sai lệch tồn kho, công nợ hoặc nghĩa vụ thuế khi có giao dịch đồng thời. | Dữ liệu sau kiểm thử vẫn nhất quán. |
| NFR-TC-01 | **Transaction cho nghiệp vụ quan trọng.** Xác nhận đơn, nhập kho, chốt giá vốn và nộp thuế phải hoàn tất toàn bộ hoặc hoàn tác toàn bộ. | Khi một bước thất bại, không tồn tại trạng thái cập nhật dở dang. |
| NFR-TC-02 | **Kiểm soát AI.** AI không được tự xác nhận Draft Order hoặc kết quả thuế thay người dùng. | Mọi kết quả AI cần người có quyền kiểm tra. |
| NFR-TC-03 | **Vận hành khi AI không khả dụng.** Người dùng vẫn lập đơn thủ công. | Tắt AI không làm gián đoạn bán hàng tại quầy. |
| NFR-KD-01 | **Giao diện đơn giản và thích ứng.** Giao diện phù hợp người ít kinh nghiệm công nghệ và nền tảng được chọn. | Màn hình chính sử dụng được trên máy tính và điện thoại nếu triển khai web responsive. |
| NFR-KD-02 | **Tiếng Việt và Unicode.** Nội dung hiển thị bằng tiếng Việt và bảo toàn ký tự có dấu. | Dữ liệu được nhập, lưu, tìm kiếm và hiển thị đúng. |
| NFR-KD-03 | **Thông báo thời gian thực.** Draft Order và đối tượng cần duyệt phải được thông báo mà không cần tải lại toàn bộ trang. | Thông báo xuất hiện trong phiên đăng nhập đang hoạt động. |
| NFR-TT-01 | **Tính chính xác của S1-HKD.** Doanh thu phải khớp với đơn hàng đã xác nhận và nhóm hoạt động tại thời điểm bán. | Đối chiếu tổng doanh thu không phát sinh chênh lệch ngoài quy tắc làm tròn. |
| NFR-TT-02 | **Tính chính xác của S2-HKD.** Số lượng và thành tiền nhập–xuất–tồn phải đối chiếu được với dữ liệu kho. | Tồn cuối kỳ khớp dữ liệu nguồn và phương pháp được lựa chọn. |
| NFR-TT-03 | **Tính chính xác của S4-HKD.** Số đã nộp phải bằng tổng các lần nộp và số còn phải nộp được tính đúng. | Đối chiếu không có chênh lệch; trường hợp nộp thừa được phản ánh. |
| NFR-TT-04 | **Quản lý phiên bản.** Biểu mẫu và nhóm hoạt động tính thuế phải có thời gian hiệu lực và không chồng phiên bản đang hoạt động. | Phiên bản mới áp dụng đúng thời điểm; dữ liệu cũ được bảo toàn. |
| NFR-TT-05 | **Kiểm soát kết quả.** Owner phải có thể xác nhận hoặc từ chối sổ/báo cáo; lý do từ chối phải được lưu. | Lịch sử duyệt thể hiện đầy đủ trạng thái, người và thời gian. |
| NFR-TT-06 | **Giới hạn tuyên bố.** Kết quả thuế được mô tả là số liệu dự kiến dựa trên dữ liệu và cấu hình, cần Owner kiểm tra. | Giao diện và tài liệu không tuyên bố hệ thống thay thế hoàn toàn kiểm tra chuyên môn. |

---

# 5. TIÊU CHÍ NGHIỆM THU Ở MỨC NGƯỜI DÙNG

| Mã | Tiêu chí nghiệm thu tổng quát |
|---|---|
| NT-01 | Employee đăng nhập, lập đơn, ghi nhận thanh toán/công nợ, in đơn và xử lý Draft Order. |
| NT-02 | Owner quản lý được sản phẩm, nhiều đơn vị, giá, nhóm hoạt động tính thuế mặc định, kho, khách hàng, công nợ và tài khoản Employee. |
| NT-03 | Hệ thống tiếp nhận văn bản hoặc giọng nói, tạo Draft Order và gửi đến người dùng kiểm tra. |
| NT-04 | S1-HKD tổng hợp đúng doanh thu từ đơn hàng đã xác nhận và giữ đúng nhóm, tỷ lệ tại thời điểm bán. |
| NT-05 | S2-HKD thể hiện đúng đơn vị, đơn giá, số lượng và thành tiền nhập–xuất–tồn; số liệu khớp dữ liệu kho. |
| NT-06 | S4-HKD thể hiện đúng nghĩa vụ, số đã nộp, số còn phải nộp hoặc nộp thừa theo từng loại thuế. |
| NT-07 | Owner xem, kiểm tra, xác nhận hoặc từ chối sổ/báo cáo; lịch sử duyệt được lưu. |
| NT-08 | Manager quản lý Owner, theo dõi chỉ số nền tảng, xử lý phản hồi và theo dõi thuê bao. Administrator quản lý Manager, định nghĩa gói thuê bao/bảng giá, cấu hình hệ thống, AI, biểu mẫu kế toán/thuế, thông báo hệ thống và xem nhật ký truy vết. |
| NT-09 | Phân quyền và tách biệt dữ liệu bảo đảm người dùng chỉ truy cập đúng hộ kinh doanh và chức năng được cấp. |
| NT-10 | Các thao tác cốt lõi đáp ứng thời gian phản hồi dưới 2.000 ms trong môi trường kiểm thử. |
| NT-11 | Giao diện hiển thị tiếng Việt, bảo toàn Unicode và cung cấp thông báo thời gian thực. |
| NT-12 | Khi AI không khả dụng, người dùng vẫn lập và xử lý đơn thủ công. |
| NT-13 | Hệ thống không triển khai hoặc tuyên bố hỗ trợ S3-HKD, S5-HKD, S6-HKD và S7-HKD trong phiên bản hiện tại. |
| NT-14 | Các kết quả thuế được trình bày là số liệu dự kiến dựa trên dữ liệu và cấu hình, cần Owner kiểm tra trước khi sử dụng. |

---

## Kết luận

Tài liệu xác định rõ phạm vi người dùng của Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh và làm rõ phạm vi học thuật gồm **S1-HKD, S2-HKD và S4-HKD**.

Các yêu cầu được giới hạn ở mức người dùng và nghiệp vụ. Chi tiết kỹ thuật như cấu trúc bảng, khóa ngoại, trigger, API, Railway hoặc công nghệ cache được trình bày trong các tài liệu thiết kế và triển khai tương ứng.
