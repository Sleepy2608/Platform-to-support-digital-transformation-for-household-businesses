# Tài liệu đặc tả yêu cầu người dùng

## Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh

> **User Requirements Document (URD)**  
> *Platform to Support Digital Transformation for Household Businesses*

## Thông tin kiểm soát tài liệu

<table align="center">
<thead>
<tr>
<th align="center">Thông tin</th>
<th align="center">Nội dung</th>
</tr>
</thead>
<tbody>
<tr>
<td align="center">Tên tài liệu</td>
<td align="left">Tài liệu đặc tả yêu cầu người dùng - Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh</td>
</tr>
<tr>
<td align="center">Tên tiếng Anh</td>
<td align="left">User Requirements Document - Platform to Support Digital Transformation for Household Businesses</td>
</tr>
<tr>
<td align="center">Mã tài liệu</td>
<td align="left">URD-HKD-v1.0.0</td>
</tr>
<tr>
<td align="center">Phiên bản</td>
<td align="left">1.0.0</td>
</tr>
<tr>
<td align="center">Người lập</td>
<td align="left">Nguyễn Ngọc Gia Bảo</td>
</tr>
<tr>
<td align="center">Ngày lập</td>
<td align="left">25/07/2026</td>
</tr>
</tbody>
</table>

### Lịch sử cập nhật

<table align="center">
<thead>
<tr>
<th align="center">Phiên bản</th>
<th align="center">Ngày</th>
<th align="center">Nội dung cập nhật</th>
<th align="center">Người thực hiện</th>
</tr>
</thead>
<tbody>
<tr>
<td align="center">1.0.0</td>
<td align="left">25/07/2026</td>
<td align="left">Hoàn thiện tài liệu yêu cầu người dùng</td>
<td align="left">Nguyễn Ngọc Gia Bảo</td>
</tr>
</tbody>
</table>

## Mục lục

- [1. Giới thiệu](#1-giới-thiệu)
  - [1.1. Mục đích tài liệu](#11-mục-đích-tài-liệu)
  - [1.2. Phạm vi tài liệu](#12-phạm-vi-tài-liệu)
  - [1.3. Đối tượng sử dụng tài liệu](#13-đối-tượng-sử-dụng-tài-liệu)
  - [1.4. Thuật ngữ và từ viết tắt](#14-thuật-ngữ-và-từ-viết-tắt)
  - [1.5. Tài liệu tham khảo](#15-tài-liệu-tham-khảo)
- [2. Tổng quan hệ thống](#2-tổng-quan-hệ-thống)
  - [2.1. Bối cảnh](#21-bối-cảnh)
  - [2.2. Phát biểu bài toán](#22-phát-biểu-bài-toán)
  - [2.3. Mục tiêu hệ thống](#23-mục-tiêu-hệ-thống)
  - [2.4. Phạm vi chức năng](#24-phạm-vi-chức-năng)
  - [2.5. Người sử dụng hệ thống](#25-người-sử-dụng-hệ-thống)
- [3. Yêu cầu chức năng](#3-yêu-cầu-chức-năng)
  - [3.1. Yêu cầu đối với Employee](#31-yêu-cầu-đối-với-employee)
  - [3.2. Yêu cầu đối với Owner](#32-yêu-cầu-đối-với-owner)
  - [3.3. Chức năng tự động của hệ thống và trí tuệ nhân tạo](#33-chức-năng-tự-động-của-hệ-thống-và-trí-tuệ-nhân-tạo)
  - [3.4. Yêu cầu đối với Administrator](#34-yêu-cầu-đối-với-administrator)
- [4. Yêu cầu phi chức năng](#4-yêu-cầu-phi-chức-năng)
- [5. Tiêu chí nghiệm thu ở mức người dùng](#5-tiêu-chí-nghiệm-thu-ở-mức-người-dùng)

---

# 1. GIỚI THIỆU

## 1.1. Mục đích tài liệu

Tài liệu đặc tả yêu cầu người dùng này trình bày một cách có hệ thống những nhu cầu mà Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh phải đáp ứng. Nội dung tập trung vào mục tiêu sử dụng, phạm vi nghiệp vụ, yêu cầu chức năng và các yêu cầu về chất lượng của hệ thống dưới góc nhìn của người dùng cuối và người quản trị nền tảng.

Tài liệu là căn cứ thống nhất giữa giảng viên, nhóm phân tích, nhóm thiết kế, nhóm phát triển và nhóm kiểm thử. Các yêu cầu được mô tả đủ rõ để tiếp tục xây dựng Tài liệu đặc tả yêu cầu phần mềm, thiết kế kiến trúc, thiết kế chi tiết, kế hoạch triển khai và tài liệu kiểm thử mà không làm thay đổi phạm vi cố định của đề tài.

## 1.2. Phạm vi tài liệu

Tài liệu mô tả yêu cầu của ba nhóm người sử dụng trực tiếp, gồm Employee, Owner và Administrator. Ngoài các chức năng do người dùng thực hiện, tài liệu còn xác định những chức năng tự động của hệ thống và AI, tiêu biểu là tiếp nhận yêu cầu bằng văn bản hoặc giọng nói để tạo Draft Order, ghi nhận dữ liệu phát sinh và hỗ trợ ghi sổ kế toán.

## 1.3. Đối tượng sử dụng tài liệu

<table align="center">
<thead>
<tr>
<th align="center"><strong>Đối tượng</strong></th>
<th align="center"><strong>Mục đích sử dụng</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td align="center">Giảng viên</td>
<td align="left">Rà soát tính đầy đủ, tính nhất quán và mức độ bám sát yêu cầu của đề tài.</td>
</tr>
<tr>
<td align="center">Nhóm phân tích và thiết kế</td>
<td align="left">Sử dụng làm đầu vào để xây dựng SRS, mô hình UML, kiến trúc hệ thống và thiết kế dữ liệu.</td>
</tr>
<tr>
<td align="center">Nhóm phát triển</td>
<td align="left">Hiểu đúng phạm vi chức năng phải triển khai và tránh bổ sung những chức năng không thuộc đề tài.</td>
</tr>
<tr>
<td align="center">Nhóm kiểm thử</td>
<td align="left">Xây dựng kịch bản kiểm thử và đối chiếu kết quả với tiêu chí chấp nhận của từng yêu cầu.</td>
</tr>
</tbody>
</table>

<p align="center"><em>Bảng 2. Đối tượng sử dụng tài liệu</em></p>

## 1.4. Thuật ngữ và từ viết tắt

<table align="center">
<thead>
<tr>
<th align="center"><strong>Thuật ngữ</strong></th>
<th align="center"><strong>Giải thích</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td align="center">URD</td>
<td align="left">Tài liệu đặc tả yêu cầu người dùng (User Requirements Document).</td>
</tr>
<tr>
<td align="center">Employee</td>
<td align="left">Người trực tiếp xử lý đơn bán hàng và các nghiệp vụ được Owner giao quyền.</td>
</tr>
<tr>
<td align="center">Owner</td>
<td align="left">Người sở hữu hoặc quản lý hộ kinh doanh; có toàn bộ chức năng của Employee và các quyền quản lý cửa hàng.</td>
</tr>
<tr>
<td align="center">Administrator</td>
<td align="left">Người quản lý tài khoản Owner, gói thuê bao, cấu hình và số liệu vận hành của toàn nền tảng.</td>
</tr>
<tr>
<td align="center">Draft Order</td>
<td align="left">Đơn hàng nháp do hệ thống tạo từ yêu cầu bằng văn bản hoặc giọng nói; đơn hàng này phải được người dùng kiểm tra trước khi xác nhận.</td>
</tr>
<tr>
<td align="center">Trợ lý AI</td>
<td align="left">Thành phần trí tuệ nhân tạo có nhiệm vụ hiểu yêu cầu ngôn ngữ tự nhiên và hỗ trợ tạo Draft Order.</td>
</tr>
<tr>
<td align="center">POS</td>
<td align="left">Hệ thống bán hàng tại điểm bán (Point of Sale).</td>
</tr>
<tr>
<td align="center">Gói thuê bao</td>
<td align="left">Gói dịch vụ mà Owner đăng ký để sử dụng nền tảng.</td>
</tr>
<tr>
<td align="center">Phân quyền theo vai trò</td>
<td align="left">Cơ chế giới hạn quyền truy cập dựa trên vai trò Employee, Owner hoặc Administrator.</td>
</tr>
<tr>
<td align="center">Audit log</td>
<td align="left">Nhật ký ghi nhận người thực hiện, thời điểm và nội dung của các thay đổi quan trọng trong hệ thống.</td>
</tr>
</tbody>
</table>

<p align="center"><em>Bảng 3. Thuật ngữ và từ viết tắt</em></p>

## 1.5. Tài liệu tham khảo

<table align="center">
<thead>
<tr>
<th align="center"><strong>Mã</strong></th>
<th align="center"><strong>Tài liệu tham khảo</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td align="center">[TL-01]</td>
<td align="left">Quyết định số 3389/QĐ-BTC năm 2025 của Bộ Tài chính, được dẫn chiếu trong phần bối cảnh của đề tài.</td>
</tr>
<tr>
<td align="center">[TL-02]</td>
<td align="left">Thông tư số 88/2021/TT-BTC của Bộ Tài chính, được dẫn chiếu trong yêu cầu về ghi sổ kế toán và lập báo cáo.</td>
</tr>
</tbody>
</table>

<p align="center"><em>Bảng 4. Danh mục tài liệu tham khảo</em></p>

# 2. TỔNG QUAN HỆ THỐNG

## 2.1. Bối cảnh

Tại Việt Nam, hộ kinh doanh là một bộ phận quan trọng của nền kinh tế địa phương và có mặt trong nhiều lĩnh vực kinh doanh truyền thống. Theo nội dung đề tài, phần lớn các hộ kinh doanh thuộc Nhóm 1 hoặc Nhóm 2 theo Quyết định số 3389/QĐ-BTC năm 2025 của Bộ Tài chính.

Tuy nhu cầu chuyển đổi số ngày càng tăng, nhiều hộ kinh doanh vẫn xử lý công việc hằng ngày theo phương thức thủ công. Việc ghi nhận doanh thu, theo dõi hàng tồn kho, quản lý công nợ và tiếp nhận đơn hàng qua điện thoại hoặc Zalo thường được thực hiện bằng sổ tay hoặc các tệp Excel đơn giản. Đồng thời, nhiều chủ hộ không có đủ ngân sách để thuê kế toán chuyên trách.

Các giải pháp bán hàng và quản lý kinh doanh hiện có trên thị trường phần lớn được xây dựng cho nhà hàng, cửa hàng thời trang hoặc doanh nghiệp có quy mô lớn. Vì vậy, các giải pháp này chưa đáp ứng đầy đủ đặc thù của hộ kinh doanh, bao gồm việc tiếp nhận đơn hàng từ nhiều kênh, theo dõi công nợ khách hàng trong thời gian dài và phục vụ người dùng có mức độ thành thạo công nghệ còn hạn chế.

Bên cạnh đó, điều kiện thiết bị là một rào cản đáng kể. Nhiều hộ kinh doanh chỉ sử dụng một điện thoại thông minh và không có máy tính, máy quét mã vạch, máy in hóa đơn, thiết bị POS hoặc ngăn kéo tiền. Chi phí đầu tư ban đầu cho một hệ thống bán hàng phụ thuộc nhiều thiết bị khiến các giải pháp POS truyền thống khó được áp dụng trong thực tế.

Việc thiếu một nền tảng phù hợp dẫn đến nhiều vấn đề như sai sót khi tính toán, xử lý đơn hàng chậm, khó kiểm soát tồn kho, dữ liệu công nợ thiếu nhất quán và không có thông tin kịp thời để đánh giá hoạt động kinh doanh. Những hạn chế này làm giảm hiệu quả vận hành, gia tăng rủi ro tài chính và cản trở khả năng mở rộng hoặc hiện đại hóa của hộ kinh doanh.

## 2.2. Phát biểu bài toán

Đề tài đặt ra yêu cầu xây dựng một ứng dụng trên thiết bị di động, nền tảng web hoặc kết hợp cả hai nhằm hỗ trợ chuyển đổi số cho hộ kinh doanh. Hệ thống phải hỗ trợ các nghiệp vụ cốt lõi gồm bán hàng, quản lý sản phẩm, tồn kho, khách hàng, công nợ, báo cáo, nhân viên và gói thuê bao. Đồng thời, nền tảng tích hợp AI để tiếp nhận yêu cầu bằng văn bản hoặc giọng nói, phân tích nội dung và tạo Draft Order để người dùng kiểm tra trước khi xác nhận.

Ngoài việc hỗ trợ vận hành cửa hàng, hệ thống phải tự động ghi nhận dữ liệu phát sinh từ các giao dịch bán hàng, nhập kho và công nợ khách hàng. Từ dữ liệu đã ghi nhận, hệ thống thực hiện tính toán, tổng hợp và điền thông tin vào các sổ kế toán, báo cáo theo Thông tư số 88/2021/TT-BTC của Bộ Tài chính, đúng với yêu cầu của đề tài.

## 2.3. Mục tiêu hệ thống

- Hệ thống hỗ trợ số hóa quy trình bán hàng tại quầy và xử lý các đơn hàng được tiếp nhận qua điện thoại hoặc Zalo.

- Hệ thống cho phép tổ chức và quản lý tập trung thông tin sản phẩm, giá bán, danh mục, nhiều đơn vị tính và số lượng tồn kho.

- Hệ thống hỗ trợ quản lý hồ sơ khách hàng, lịch sử mua hàng, số dư công nợ và các lần thanh toán.

- Hệ thống sử dụng AI để chuyển yêu cầu bằng văn bản hoặc giọng nói thành Draft Order, qua đó giảm thao tác nhập liệu thủ công.

- Hệ thống tự động ghi sổ kế toán, tổng hợp số liệu và tạo báo cáo theo các biểu mẫu được quy định trong đề tài.

- Hệ thống cung cấp số liệu về doanh thu, sản phẩm bán chạy, cảnh báo tồn kho thấp và tổng công nợ để Owner theo dõi hoạt động kinh doanh kịp thời.

- Hệ thống hỗ trợ Administrator quản lý tài khoản Owner, giá gói thuê bao, cấu hình hệ thống, biểu mẫu báo cáo và số liệu vận hành của toàn nền tảng.

## 2.4. Phạm vi chức năng

Phạm vi chức năng của hệ thống được xác định trực tiếp từ yêu cầu của đề tài và bao gồm các nhóm nghiệp vụ sau:

- Hệ thống cung cấp chức năng đăng nhập và kiểm soát quyền truy cập theo ba vai trò: Employee, Owner và Administrator.

- Hệ thống hỗ trợ lập, lưu trữ và in đơn bán hàng tại quầy, đồng thời ghi nhận trường hợp khách hàng mua chịu.

- Hệ thống cho phép quản lý danh mục sản phẩm, hình ảnh, giá bán, danh mục phân loại, nhiều đơn vị tính và quy tắc định giá.

- Hệ thống cho phép ghi nhận nhập kho, theo dõi số lượng tồn và tra cứu lịch sử biến động kho.

- Hệ thống hỗ trợ quản lý khách hàng, lịch sử mua hàng, số dư công nợ và lịch sử thanh toán.

- Hệ thống tiếp nhận yêu cầu ngôn ngữ tự nhiên bằng văn bản hoặc giọng nói để tạo Draft Order.

- Hệ thống tự động ghi nhận dữ liệu nghiệp vụ, thực hiện ghi sổ kế toán và tạo báo cáo.

- Owner có thể quản lý tài khoản Employee trong phạm vi hộ kinh doanh của mình.

- Administrator có thể quản lý tài khoản Owner, giá gói thuê bao, số liệu nền tảng, phản hồi, cấu hình hệ thống, cấu hình AI và mẫu báo cáo.

## 2.5. Người sử dụng hệ thống

<table align="center">
<thead>
<tr>
<th align="center"><strong>Nhóm người sử dụng</strong></th>
<th align="center"><strong>Vai trò và phạm vi sử dụng</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td align="center">Employee</td>
<td align="left">Trực tiếp đăng nhập, lập đơn bán hàng tại quầy, ghi nhận công nợ, in đơn, nhận thông báo và kiểm tra Draft Order do AI tạo.</td>
</tr>
<tr>
<td align="center">Owner</td>
<td align="left">Sử dụng toàn bộ chức năng của Employee và thực hiện các nghiệp vụ quản lý sản phẩm, tồn kho, khách hàng, báo cáo và tài khoản Employee.</td>
</tr>
<tr>
<td align="center">Administrator</td>
<td align="left">Quản lý tài khoản Owner, giá gói thuê bao, số liệu vận hành, phản hồi, cấu hình hệ thống, cấu hình AI và các mẫu báo cáo.</td>
</tr>
</tbody>
</table>

<p align="center"><em>Bảng 5. Danh sách người sử dụng hệ thống</em></p>

# 3. YÊU CẦU CHỨC NĂNG

Các yêu cầu trong chương này được xây dựng trực tiếp từ phần yêu cầu chức năng của đề tài. Mỗi yêu cầu có một mã riêng và đi kèm tiêu chí chấp nhận để thuận tiện cho việc đối chiếu trong quá trình kiểm thử. Nội dung được diễn đạt lại nhằm làm rõ yêu cầu nhưng không bổ sung hoặc loại bỏ chức năng đã được giao.

## 3.1. Yêu cầu đối với Employee

<table align="center">
<colgroup>
<col style="width: 33%" />
<col style="width: 33%" />
<col style="width: 33%" />
</colgroup>
<thead>
<tr class="header">
<th align="center"><strong>Mã yêu cầu</strong></th>
<th align="center"><strong>Tên và nội dung yêu cầu</strong></th>
<th align="center"><strong>Tiêu chí chấp nhận</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td align="center">FR-NV-01</td>
<td align="left"><p><strong>Đăng nhập hệ thống</strong></p>
<p>Hệ thống phải cho phép Employee đăng nhập bằng tài khoản đã được cấp. Sau khi xác thực thành công, Employee được truy cập các chức năng tương ứng với vai trò của mình.</p></td>
<td align="left">Employee đăng nhập thành công khi cung cấp thông tin hợp lệ. Khi thông tin không hợp lệ, hệ thống từ chối truy cập và hiển thị thông báo phù hợp.</td>
</tr>
<tr class="even">
<td align="center">FR-NV-02</td>
<td align="left"><p><strong>Lập đơn bán hàng tại quầy</strong></p>
<p>Hệ thống phải hỗ trợ Employee lập đơn nhanh cho khách mua trực tiếp tại cửa hàng. Trong quá trình tạo đơn, Employee có thể tìm kiếm và lọc sản phẩm ngay khi nhập từ khóa, chọn sản phẩm, nhập số lượng, thêm hàng vào giỏ và gắn khách hàng vào đơn nếu cần. Giao diện phải hỗ trợ các phím tắt phục vụ thao tác nhanh.</p></td>
<td align="left">Employee tạo được một đơn có đúng sản phẩm, số lượng và khách hàng đã chọn; chức năng tìm kiếm, lọc tức thời, thêm hàng vào giỏ và các phím tắt được mô tả đều hoạt động trên màn hình lập đơn.</td>
</tr>
<tr class="odd">
<td align="center">FR-NV-03</td>
<td align="left"><p><strong>Ghi nhận bán chịu và công nợ khách hàng</strong></p>
<p>Khi khách hàng đã đăng ký lựa chọn mua chịu, hệ thống phải cho phép Employee ghi nhận khoản công nợ ngay trong quá trình lập đơn. Sau khi đơn được hoàn tất, số tiền còn phải thanh toán của khách hàng được cập nhật tự động.</p></td>
<td align="left">Một đơn bán chịu của khách hàng đã đăng ký được lưu thành công và số dư công nợ của khách hàng tăng đúng bằng khoản tiền chưa thanh toán trong đơn.</td>
</tr>
<tr class="even">
<td align="center">FR-NV-04</td>
<td align="left"><p><strong>In và lưu trữ đơn bán hàng</strong></p>
<p>Sau khi lập đơn, Employee phải có thể tạo và in đơn bán hàng theo mẫu được thiết kế sẵn. Hệ thống phải lưu thông tin của từng đơn để người dùng có thể tra cứu lại khi cần.</p></td>
<td align="left">Đơn bán hàng được tạo theo mẫu, có thể gửi đến chức năng in và vẫn được tìm thấy trong lịch sử đơn sau khi hoàn tất.</td>
</tr>
<tr class="odd">
<td align="center">FR-NV-05</td>
<td align="left"><p><strong>Nhận thông báo về Draft Order do AI/Chatbot tạo</strong></p>
<p>Khi AI/Chatbot tiếp nhận yêu cầu bằng văn bản hoặc giọng nói và tạo một Draft Order, hệ thống phải gửi thông báo theo thời gian thực đến giao diện làm việc của Employee.</p></td>
<td align="left">Sau khi một Draft Order được tạo, Employee đang đăng nhập nhận được thông báo mới mà không phải tải lại toàn bộ trang.</td>
</tr>
<tr class="even">
<td align="center">FR-NV-06</td>
<td align="left"><p><strong>Kiểm tra, chỉnh sửa, xác nhận hoặc từ chối Draft Order</strong></p>
<p>Hệ thống phải cho phép Employee mở Draft Order do AI/Chatbot tạo, kiểm tra các thông tin đã được nhận diện, chỉnh sửa nội dung chưa chính xác, xác nhận đơn hợp lệ hoặc từ chối đơn khi không thể sử dụng.</p></td>
<td align="left">Employee mở được Draft Order, xem đầy đủ thông tin, chỉnh sửa dữ liệu cần thiết và thực hiện được thao tác xác nhận hoặc từ chối đơn.</td>
</tr>
</tbody>
</table>

<p align="center"><em>Bảng 6. Yêu cầu chức năng đối với Employee</em></p>

## 3.2. Yêu cầu đối với Owner

Owner được sử dụng toàn bộ chức năng đã quy định cho Employee. Ngoài các chức năng đó, hệ thống phải cung cấp thêm các khả năng quản lý sau:

<table align="center">
<colgroup>
<col style="width: 33%" />
<col style="width: 33%" />
<col style="width: 33%" />
</colgroup>
<thead>
<tr class="header">
<th align="center"><strong>Mã yêu cầu</strong></th>
<th align="center"><strong>Tên và nội dung yêu cầu</strong></th>
<th align="center"><strong>Tiêu chí chấp nhận</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td align="center">FR-CH-01</td>
<td align="left"><p><strong>Quản lý danh mục sản phẩm</strong></p>
<p>Hệ thống phải cho phép Owner tạo mới, cập nhật hoặc ngừng sử dụng một sản phẩm. Thông tin có thể quản lý gồm tên sản phẩm, hình ảnh, giá bán, danh mục phân loại và nhiều đơn vị tính. Owner cũng có thể thiết lập các quy tắc định giá phù hợp với hoạt động kinh doanh.</p></td>
<td align="left">Owner tạo, cập nhật và ngừng sử dụng được sản phẩm; các thuộc tính, đơn vị tính và quy tắc định giá được lưu và hiển thị đúng khi tra cứu.</td>
</tr>
<tr class="even">
<td align="center">FR-CH-02</td>
<td align="left"><p><strong>Quản lý tồn kho</strong></p>
<p>Hệ thống phải cho phép Owner ghi nhận các lần nhập hàng, theo dõi số lượng tồn kho theo thời gian thực và xem lịch sử biến động kho. Khi một đơn hàng được xác nhận, số lượng tồn của các sản phẩm liên quan phải được trừ tự động.</p></td>
<td align="left">Phiếu nhập làm tăng tồn kho; đơn hàng được xác nhận làm giảm tồn kho; Owner xem được số lượng hiện tại và lịch sử thay đổi của từng sản phẩm.</td>
</tr>
<tr class="odd">
<td align="center">FR-CH-03</td>
<td align="left"><p><strong>Quản lý khách hàng và công nợ</strong></p>
<p>Hệ thống phải cho phép Owner thêm hoặc cập nhật thông tin khách hàng, xem lịch sử mua hàng, theo dõi số tiền còn nợ và tra cứu các lần thanh toán đã được ghi nhận.</p></td>
<td align="left">Owner thêm hoặc sửa được hồ sơ khách hàng và xem được lịch sử mua hàng, số dư công nợ cùng nhật ký thanh toán tương ứng.</td>
</tr>
<tr class="even">
<td align="center">FR-CH-04</td>
<td align="left"><p><strong>Xem báo cáo và phân tích hoạt động kinh doanh</strong></p>
<p>Hệ thống phải cung cấp Dashboard để Owner theo dõi doanh thu theo ngày, tuần và tháng; các sản phẩm bán chạy; cảnh báo hàng tồn kho thấp; và tổng số công nợ chưa thanh toán. Dữ liệu được trình bày bằng biểu đồ và các ô thông tin tổng hợp để người dùng dễ theo dõi.</p></td>
<td align="left">Owner lựa chọn được kỳ báo cáo và xem đầy đủ các chỉ số, cảnh báo, biểu đồ và thông tin tổng hợp nêu trong yêu cầu.</td>
</tr>
<tr class="odd">
<td align="center">FR-CH-05</td>
<td align="left"><p><strong>Quản lý tài khoản Employee</strong></p>
<p>Hệ thống phải cho phép Owner tạo tài khoản Employee, đặt lại mật khẩu và vô hiệu hóa tài khoản khi cần. Mọi thao tác tạo tài khoản, đặt lại mật khẩu và vô hiệu hóa tài khoản phải được ghi nhận trong Audit log, bao gồm người thực hiện, thời điểm và nội dung thay đổi.</p></td>
<td align="left">Owner tạo, đặt lại mật khẩu và vô hiệu hóa được tài khoản Employee. Audit log ghi nhận đầy đủ người thực hiện, thời điểm và nội dung của từng thao tác.</td>
</tr>
</tbody>
</table>

<p align="center"><em>Bảng 7. Yêu cầu chức năng đối với Owner</em></p>

## 3.3. Chức năng tự động của hệ thống và trí tuệ nhân tạo

<table align="center">
<colgroup>
<col style="width: 33%" />
<col style="width: 33%" />
<col style="width: 33%" />
</colgroup>
<thead>
<tr class="header">
<th align="center"><strong>Mã yêu cầu</strong></th>
<th align="center"><strong>Tên và nội dung yêu cầu</strong></th>
<th align="center"><strong>Tiêu chí chấp nhận</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td align="center">FR-HT-01</td>
<td align="left"><p><strong>Chuyển yêu cầu ngôn ngữ tự nhiên thành Draft Order</strong></p>
<p>Hệ thống phải tiếp nhận nội dung người dùng nhập bằng văn bản hoặc nói bằng giọng nói, sau đó phân tích các thông tin cần thiết như sản phẩm, số lượng, khách hàng và yêu cầu ghi nợ. Từ kết quả phân tích, hệ thống tự động tạo một Draft Order để Employee hoặc Owner kiểm tra trước khi xác nhận. Ví dụ: “Lấy 5 bao xi măng cho chú Ba, ghi nợ”.</p></td>
<td align="left">Với một yêu cầu có đủ thông tin bằng văn bản hoặc giọng nói, hệ thống tạo được Draft Order chứa các dữ liệu đã nhận diện và chuyển đơn đó đến người dùng để kiểm tra.</td>
</tr>
<tr class="even">
<td align="center">FR-HT-02</td>
<td align="left"><p><strong>Tự động ghi sổ kế toán và lập báo cáo</strong></p>
<p>Hệ thống phải tự động ghi nhận dữ liệu phát sinh từ các giao dịch bán hàng, nhập kho và công nợ khách hàng. Trên cơ sở dữ liệu đã ghi nhận, hệ thống thực hiện tính toán, tổng hợp và tự động điền thông tin vào các sổ kế toán, báo cáo theo Thông tư số 88/2021/TT-BTC. Các đầu ra được nêu trong đề tài gồm Sổ chi tiết doanh thu, Báo cáo công nợ phải thu và Báo cáo hoạt động kinh doanh. Số liệu trên sổ và báo cáo phải được tổng hợp chính xác từ dữ liệu nguồn, đáp ứng yêu cầu tuân thủ phục vụ mục đích thuế theo mẫu đang được cấu hình. Nền tảng phải cho phép Administrator cập nhật và quản lý phiên bản mẫu khi cơ quan có thẩm quyền ban hành quy định mới.</p></td>
<td align="left">Với cùng một kỳ báo cáo, số liệu tổng hợp phải khớp với các giao dịch nguồn; cấu trúc và trường thông tin phải đúng với phiên bản mẫu đang áp dụng. Administrator cập nhật được mẫu mới và hệ thống sử dụng mẫu đó sau khi cấu hình có hiệu lực.</td>
</tr>
</tbody>
</table>

<p align="center"><em>Bảng 8. Yêu cầu chức năng tự động của hệ thống và AI</em></p>

## 3.4. Yêu cầu đối với Administrator

<table align="center">
<colgroup>
<col style="width: 33%" />
<col style="width: 33%" />
<col style="width: 33%" />
</colgroup>
<thead>
<tr class="header">
<th align="center"><strong>Mã yêu cầu</strong></th>
<th align="center"><strong>Tên và nội dung yêu cầu</strong></th>
<th align="center"><strong>Tiêu chí chấp nhận</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td align="center">FR-QT-01</td>
<td align="left"><p><strong>Quản lý tài khoản Owner</strong></p>
<p>Hệ thống phải cho phép Administrator xem danh sách, tìm kiếm, lọc và quản lý tất cả tài khoản Owner đã đăng ký trên nền tảng. Administrator có thể xem hồ sơ chi tiết, kích hoạt hoặc vô hiệu hóa từng tài khoản.</p></td>
<td align="left">Administrator tìm được tài khoản theo điều kiện, mở được hồ sơ chi tiết và thay đổi được trạng thái hoạt động của tài khoản.</td>
</tr>
<tr class="even">
<td align="center">FR-QT-02</td>
<td align="left"><p><strong>Quản lý giá gói thuê bao</strong></p>
<p>Hệ thống phải cho phép Administrator định nghĩa và cập nhật mức giá của các gói thuê bao được cung cấp trên nền tảng, bao gồm chi phí theo tháng và theo năm cho các gói như Cơ bản (Basic) và Chuyên nghiệp (Pro).</p></td>
<td align="left">Administrator cập nhật được giá theo tháng và theo năm của từng gói; mức giá mới được lưu và hiển thị đúng trong thông tin gói thuê bao.</td>
</tr>
<tr class="odd">
<td align="center">FR-QT-03</td>
<td align="left"><p><strong>Theo dõi số liệu nền tảng và phản hồi</strong></p>
<p>Hệ thống phải cung cấp cho Administrator một Dashboard để theo dõi tình trạng hoạt động, mức tăng trưởng và doanh thu của toàn nền tảng. Các số liệu tối thiểu gồm tổng số người dùng đang hoạt động và số lượng thuê bao mới. Administrator cũng phải có khả năng xem các báo cáo, số liệu phân tích và phản hồi của người dùng.</p></td>
<td align="left">Administrator truy cập được bảng điều khiển, xem được các chỉ số được yêu cầu và mở được nội dung phản hồi của người dùng.</td>
</tr>
<tr class="even">
<td align="center">FR-QT-04</td>
<td align="left"><p><strong>Quản lý cấu hình hệ thống, AI và biểu mẫu báo cáo</strong></p>
<p>Hệ thống phải cho phép Administrator quản lý các thiết lập chung của toàn nền tảng và các cấu hình liên quan đến AI. Administrator có thể cập nhật mẫu chuẩn của các sổ kế toán, báo cáo tài chính theo Thông tư số 88/2021/TT-BTC và phát thông báo đến toàn bộ người dùng trên hệ thống.</p></td>
<td align="left">Administrator lưu được cấu hình hệ thống và cấu hình AI, cập nhật được mẫu báo cáo, đồng thời gửi được thông báo đến người dùng trên toàn nền tảng.</td>
</tr>
</tbody>
</table>

<p align="center"><em>Bảng 9. Yêu cầu chức năng đối với Administrator</em></p>

# 4. YÊU CẦU PHI CHỨC NĂNG

Các yêu cầu phi chức năng xác định mức chất lượng mà hệ thống phải đạt được trong quá trình vận hành. Nội dung dưới đây được giữ đầy đủ theo năm nhóm yêu cầu của đề tài và được tách thành từng mã riêng để thuận tiện cho việc kiểm chứng.

<table align="center">
<colgroup>
<col style="width: 33%" />
<col style="width: 33%" />
<col style="width: 33%" />
</colgroup>
<thead>
<tr class="header">
<th align="center"><strong>Mã yêu cầu</strong></th>
<th align="center"><strong>Tên và nội dung yêu cầu</strong></th>
<th align="center"><strong>Tiêu chí chấp nhận</strong></th>
</tr>
</thead>
<tbody>
<tr class="odd">
<td align="center">NFR-BM-01</td>
<td align="left"><p><strong>Bảo vệ thông tin kinh doanh</strong></p>
<p>Hệ thống phải bảo vệ thông tin bán hàng của từng hộ kinh doanh, bao gồm dữ liệu đơn hàng, sản phẩm, khách hàng, công nợ và báo cáo.</p></td>
<td align="left">Người dùng không được phép truy cập dữ liệu kinh doanh không thuộc phạm vi được cấp quyền; các thử nghiệm truy cập trái phép phải bị hệ thống từ chối.</td>
</tr>
<tr class="even">
<td align="center">NFR-BM-02</td>
<td align="left"><p><strong>Phân quyền truy cập theo vai trò</strong></p>
<p>Hệ thống phải áp dụng cơ chế phân quyền chặt chẽ cho ba vai trò Employee, Owner và Administrator.</p></td>
<td align="left">Mỗi vai trò chỉ nhìn thấy và thực hiện được các chức năng đã quy định; các chức năng ngoài quyền hạn không thể truy cập hoặc thực thi.</td>
</tr>
<tr class="odd">
<td align="center">NFR-HN-01</td>
<td align="left"><p><strong>Thời gian phản hồi của thao tác cốt lõi</strong></p>
<p>Các thao tác cốt lõi của ứng dụng phải có thời gian phản hồi dưới 2.000 mili giây.</p></td>
<td align="left">Kết quả đo trong môi trường kiểm thử cho thấy các thao tác cốt lõi hoàn tất trong thời gian dưới 2.000 mili giây.</td>
</tr>
<tr class="even">
<td align="center">NFR-HN-02</td>
<td align="left"><p><strong>Hỗ trợ danh mục sản phẩm lớn</strong></p>
<p>Hệ thống phải duy trì khả năng tìm kiếm và xử lý khi hộ kinh doanh có danh mục sản phẩm lớn.</p></td>
<td align="left">Trong bộ dữ liệu có quy mô được xác định tại Tài liệu kiểm thử, các chức năng tìm kiếm, lọc và lập đơn vẫn hoạt động đúng và không phát sinh lỗi chức năng.</td>
</tr>
<tr class="odd">
<td align="center">NFR-HN-03</td>
<td align="left"><p><strong>Hỗ trợ nhiều người dùng đồng thời</strong></p>
<p>Hệ thống phải cho phép nhiều người dùng hoạt động đồng thời mà không làm sai lệch dữ liệu nghiệp vụ.</p></td>
<td align="left">Với số phiên đồng thời được xác định tại Tài liệu kiểm thử, người dùng vẫn thực hiện được thao tác và dữ liệu sau cùng vẫn nhất quán.</td>
</tr>
<tr class="even">
<td align="center">NFR-TC-01</td>
<td align="left"><p><strong>Kiểm soát kết quả do AI tạo</strong></p>
<p>Employee hoặc Owner phải có thể xem lại, chỉnh sửa hoặc từ chối Draft Order do AI tạo trước khi đơn được xác nhận.</p></td>
<td align="left">Người dùng thực hiện được đầy đủ ba thao tác xem lại, chỉnh sửa và từ chối trên một Draft Order.</td>
</tr>
<tr class="odd">
<td align="center">NFR-TC-02</td>
<td align="left"><p><strong>Duy trì vận hành khi AI không khả dụng</strong></p>
<p>Khi chức năng AI tạm thời không hoạt động, hệ thống phải tiếp tục cho phép người dùng lập và xử lý đơn hàng theo phương thức thủ công.</p></td>
<td align="left">Khi dịch vụ AI bị tắt hoặc không phản hồi, người dùng vẫn đăng nhập và lập đơn tại quầy bằng thao tác thủ công.</td>
</tr>
<tr class="even">
<td align="center">NFR-KD-01</td>
<td align="left"><p><strong>Giao diện đơn giản và tương thích thiết bị</strong></p>
<p>Giao diện của ứng dụng trên nền tảng web, thiết bị di động hoặc cả hai phải đơn giản, dễ hiểu, phù hợp với người dùng có mức độ thành thạo công nghệ thấp và thích ứng với kích thước màn hình của nền tảng được triển khai.</p></td>
<td align="left">Các màn hình chính hiển thị và sử dụng được trên nền tảng mà nhóm lựa chọn triển khai. Nếu triển khai ứng dụng web, giao diện tự điều chỉnh phù hợp với màn hình máy tính và điện thoại.</td>
</tr>
<tr class="odd">
<td align="center">NFR-KD-02</td>
<td align="left"><p><strong>Giao diện tiếng Việt</strong></p>
<p>Toàn bộ nội dung giao diện dành cho người dùng phải được trình bày bằng tiếng Việt.</p></td>
<td align="left">Các màn hình chính, nhãn chức năng và thông báo được hiển thị bằng tiếng Việt.</td>
</tr>
<tr class="even">
<td align="center">NFR-KD-03</td>
<td align="left"><p><strong>Bảo toàn ký tự Unicode</strong></p>
<p>Hệ thống phải lưu trữ và hiển thị chính xác các ký tự tiếng Việt có dấu và dữ liệu Unicode.</p></td>
<td align="left">Dữ liệu tiếng Việt được nhập, lưu, tìm kiếm và hiển thị lại mà không bị mất dấu hoặc sai ký tự.</td>
</tr>
<tr class="odd">
<td align="center">NFR-KD-04</td>
<td align="left"><p><strong>Thông báo theo thời gian thực</strong></p>
<p>Hệ thống phải cung cấp thông báo theo thời gian thực cho các sự kiện được quy định, đặc biệt khi có Draft Order mới do AI tạo.</p></td>
<td align="left">Thông báo mới xuất hiện trên giao diện của người dùng đang đăng nhập mà không cần tải lại toàn bộ trang.</td>
</tr>
<tr class="even">
<td align="center">NFR-TT-01</td>
<td align="left"><p><strong>Tạo báo cáo chính xác theo quy định kế toán</strong></p>
<p>Hệ thống phải tự động tạo các sổ kế toán và báo cáo theo Thông tư số 88/2021/TT-BTC như yêu cầu của đề tài. Số liệu phải được tổng hợp chính xác từ các giao dịch đã ghi nhận và sử dụng phiên bản biểu mẫu đang có hiệu lực trong hệ thống.</p></td>
<td align="left">Số liệu trên báo cáo khớp với dữ liệu giao dịch nguồn của kỳ báo cáo; cấu trúc và các trường thông tin phù hợp với phiên bản mẫu đang áp dụng.</td>
</tr>
<tr class="odd">
<td align="center">NFR-TT-02</td>
<td align="left"><p><strong>Kiểm soát báo cáo do AI tạo</strong></p>
<p>Owner phải có thể xem xét, chỉnh sửa hoặc từ chối các báo cáo do AI tạo trước khi sử dụng.</p></td>
<td align="left">Owner thực hiện được các thao tác xem, chỉnh sửa và từ chối trên báo cáo do AI tạo.</td>
</tr>
<tr class="even">
<td align="center">NFR-TT-03</td>
<td align="left"><p><strong>Cập nhật biểu mẫu khi quy định thay đổi</strong></p>
<p>Nền tảng phải hỗ trợ cập nhật và quản lý phiên bản các mẫu sổ kế toán, báo cáo để phù hợp với những thay đổi trong biểu mẫu chính thức do cơ quan có thẩm quyền ban hành.</p></td>
<td align="left">Administrator cập nhật được một phiên bản mẫu mới, xác định thời điểm áp dụng và hệ thống sử dụng đúng phiên bản sau khi cấu hình có hiệu lực.</td>
</tr>
</tbody>
</table>

<p align="center"><em>Bảng 10. Danh sách yêu cầu phi chức năng</em></p>

# 5. TIÊU CHÍ NGHIỆM THU Ở MỨC NGƯỜI DÙNG

Hệ thống được xem là đáp ứng tài liệu URD khi từng yêu cầu chức năng và phi chức năng đã được kiểm chứng theo tiêu chí chấp nhận tương ứng. Ở mức tổng quát, việc nghiệm thu cần xác nhận các kết quả sau:

<table align="center">
<thead>
<tr>
<th align="center"><strong>Mã</strong></th>
<th align="center"><strong>Tiêu chí nghiệm thu tổng quát</strong></th>
</tr>
</thead>
<tbody>
<tr>
<td align="center">NT-01</td>
<td align="left">Employee đăng nhập, lập đơn bán hàng tại quầy, ghi nhận công nợ, in đơn; đồng thời nhận thông báo, kiểm tra, chỉnh sửa, xác nhận hoặc từ chối Draft Order theo đúng phạm vi được giao.</td>
</tr>
<tr>
<td align="center">NT-02</td>
<td align="left">Owner sử dụng được toàn bộ chức năng của Employee và quản lý được sản phẩm, tồn kho, khách hàng, báo cáo cùng tài khoản Employee.</td>
</tr>
<tr>
<td align="center">NT-03</td>
<td align="left">Hệ thống tiếp nhận được yêu cầu bằng văn bản hoặc giọng nói, tạo Draft Order và chuyển đơn đó đến người dùng để kiểm tra.</td>
</tr>
<tr>
<td align="center">NT-04</td>
<td align="left">Hệ thống tự động ghi nhận, tính toán và tổng hợp dữ liệu bán hàng, nhập kho và công nợ vào các sổ kế toán hoặc báo cáo; số liệu khớp với dữ liệu nguồn và sử dụng đúng phiên bản biểu mẫu đang áp dụng. Owner có thể xem xét, chỉnh sửa hoặc từ chối báo cáo do AI tạo.</td>
</tr>
<tr>
<td align="center">NT-05</td>
<td align="left">Administrator quản lý được tài khoản Owner, giá gói thuê bao, số liệu nền tảng, phản hồi, cấu hình và mẫu báo cáo.</td>
</tr>
<tr>
<td align="center">NT-06</td>
<td align="left">Cơ chế phân quyền bảo đảm mỗi vai trò chỉ truy cập được chức năng và dữ liệu thuộc phạm vi cho phép.</td>
</tr>
<tr>
<td align="center">NT-07</td>
<td align="left">Các thao tác cốt lõi đáp ứng yêu cầu thời gian phản hồi dưới 2.000 mili giây trong môi trường kiểm thử.</td>
</tr>
<tr>
<td align="center">NT-08</td>
<td align="left">Giao diện hiển thị đúng tiếng Việt, bảo toàn ký tự Unicode, sử dụng được trên nền tảng web, thiết bị di động hoặc cả hai theo phương án triển khai, đồng thời cung cấp thông báo theo thời gian thực.</td>
</tr>
<tr>
<td align="center">NT-09</td>
<td align="left">Người dùng vẫn có thể lập đơn thủ công khi chức năng AI không khả dụng.</td>
</tr>
</tbody>
</table>

<p align="center"><em>Bảng 11. Tiêu chí nghiệm thu ở mức người dùng</em></p>
