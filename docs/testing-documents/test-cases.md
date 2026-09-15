# Tài liệu kiểm thử hệ thống

## 1. Thông tin chung

- **Dự án:** Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh.
- **Loại kiểm thử:** Kiểm thử hệ thống thủ công (manual system testing).
- **Phạm vi:** 39 test case, từ TC01 đến TC39.
- **Nguồn nội dung:** Workbook test case của nhóm, cập nhật ngày 15/09/2026.
- **Kết quả ghi nhận trong workbook:** 39/39 test case có trạng thái **Đạt**.
- **File Excel và ảnh minh chứng:** [Mở bộ test case hệ thống](./hbdt-system-test-cases.xlsx).

> Trong workbook, cột **Ảnh minh chứng** trên sheet `Test Cases` liên kết đến các sheet `TC1`–`TC39`. Mỗi sheet lưu ảnh hoặc dữ liệu minh chứng tương ứng.

## 2. Tổng hợp phạm vi kiểm thử

| Nhóm chức năng | Test case | Số lượng |
|---|---:|---:|
| Đăng nhập và phân quyền | TC01–TC05 | 5 |
| Quản lý sản phẩm | TC06–TC11 | 6 |
| Quản lý danh mục | TC12–TC15 | 4 |
| Quản lý tồn kho và nhập kho | TC16–TC21 | 6 |
| Cảnh báo tồn kho thấp | TC22–TC25 | 4 |
| Khách hàng, đơn hàng và thanh toán | TC26–TC31 | 6 |
| Doanh thu và biểu đồ | TC32–TC36 | 5 |
| Nhân viên, Admin và cô lập dữ liệu | TC37–TC39 | 3 |
| **Tổng cộng** | **TC01–TC39** | **39** |

## 3. Nội dung test case

### 3.1. Đăng nhập và phân quyền

| ID | Tên test case | Mô tả | Dữ liệu đầu vào / Thao tác | Kết quả mong đợi | Minh chứng | Trạng thái |
|---|---|---|---|---|---|:---:|
| **TC01** | Đăng nhập Owner thành công | Kiểm tra Owner đăng nhập bằng tài khoản hợp lệ. | Điều kiện trước: Tài khoản Owner đang hoạt động.<br>Dữ liệu: Email và mật khẩu Owner hợp lệ.<br>Thao tác:<br>1) Mở trang Đăng nhập.<br>2) Nhập email.<br>3) Nhập mật khẩu.<br>4) Nhấn Đăng nhập.  | Đăng nhập thành công, lưu phiên đăng nhập và chuyển đến giao diện Owner. | Sheet `TC1` (2 ảnh) | **Đạt** |
| **TC02** | Đăng nhập sai mật khẩu | Kiểm tra hệ thống từ chối mật khẩu không chính xác. | Dữ liệu: Email Owner hợp lệ; mật khẩu SaiMatKhau123.<br>Thao tác:<br>1) Mở trang Đăng nhập.<br>2) Nhập email hợp lệ.<br>3) Nhập mật khẩu sai.<br>4) Nhấn Đăng nhập. | Hiển thị thông báo đăng nhập thất bại, không tạo phiên và vẫn ở trang đăng nhập. | Sheet `TC2` (1 ảnh) | **Đạt** |
| **TC03** | Đăng nhập khi bỏ trống dữ liệu | Kiểm tra ràng buộc bắt buộc của form đăng nhập. | Dữ liệu: Email trống; mật khẩu trống.<br>Thao tác:<br>1) Mở trang Đăng nhập.<br>2) Không nhập email và mật khẩu.<br>3) Nhấn Đăng nhập. | Form báo lỗi tại các trường bắt buộc và không gửi yêu cầu đăng nhập hợp lệ. | Sheet `TC3` (1 ảnh) | **Đạt** |
| **TC04** | Truy cập trang Owner khi chưa đăng nhập | Kiểm tra bảo vệ route dành cho Owner. | Điều kiện trước: Đã đăng xuất hoặc xóa phiên đăng nhập.<br>Thao tác:<br>1) Nhập trực tiếp /owner/products trên thanh địa chỉ.<br>2) Nhấn Enter. | Hệ thống chuyển về trang đăng nhập và giữ đường dẫn chuyển tiếp nếu có. | Sheet `TC4` (1 ảnh) | **Đạt** |
| **TC05** | Employee truy cập chức năng Owner | Kiểm tra phân quyền giữa Employee và Owner. | Điều kiện trước: Có tài khoản Employee đang hoạt động.<br>Thao tác:<br>1) Đăng nhập bằng Employee.<br>2) Nhập trực tiếp /owner/employees.<br>3) Nhấn Enter. | Hệ thống từ chối truy cập hoặc chuyển về trang đúng quyền; không hiển thị dữ liệu nhân viên của Owner. | Sheet `TC5` (1 ảnh) | **Đạt** |

### 3.2. Quản lý sản phẩm

| ID | Tên test case | Mô tả | Dữ liệu đầu vào / Thao tác | Kết quả mong đợi | Minh chứng | Trạng thái |
|---|---|---|---|---|---|:---:|
| **TC06** | Xem danh sách sản phẩm | Kiểm tra danh sách sản phẩm theo hộ kinh doanh. | Điều kiện trước: Owner có hồ sơ hộ kinh doanh và ít nhất một sản phẩm.<br>Thao tác:<br>1) Đăng nhập Owner.<br>2) Chọn Sản phẩm & Danh mục.<br>3) Chọn tab Sản phẩm. | Hiển thị đúng các sản phẩm thuộc businessId của Owner; không lộ sản phẩm của hộ kinh doanh khác. | Sheet `TC6` (1 ảnh) | **Đạt** |
| **TC07** | Tạo sản phẩm hợp lệ | Kiểm tra tạo sản phẩm với dữ liệu đầy đủ. | Dữ liệu: Mã P_TC_001; tên Nước suối; số lượng ban đầu 20; trạng thái Đang hoạt động.<br>Thao tác:<br>1) Mở danh sách sản phẩm.<br>2) Nhấn Thêm sản phẩm.<br>3) Nhập dữ liệu và chọn danh mục, đơn vị.<br>4) Nhấn Lưu thay đổi. | Tạo thành công; P_TC_001 xuất hiện trong danh sách với đúng thông tin và tồn ban đầu 20. | Sheet `TC7` (1 ảnh) | **Đạt** |
| **TC08** | Tạo sản phẩm trùng mã | Kiểm tra ràng buộc mã sản phẩm không trùng trong cùng hộ kinh doanh. | Điều kiện trước: P_TC_001 đã tồn tại.<br>Dữ liệu: Mã P_TC_001; tên Nước suối khác.<br>Thao tác:<br>1) Nhấn Thêm sản phẩm.<br>2) Nhập đầy đủ dữ liệu.<br>3) Nhấn Lưu thay đổi. | Hệ thống báo mã sản phẩm đã tồn tại và không tạo thêm bản ghi. | Sheet `TC8` (1 ảnh) | **Đạt** |
| **TC09** | Tạo sản phẩm với dữ liệu không hợp lệ | Kiểm tra validation tên và số lượng ban đầu. | Dữ liệu: Mã P_TC_002; tên trống; số lượng -1.<br>Thao tác:<br>1) Nhấn Thêm sản phẩm.<br>2) Nhập dữ liệu trên.<br>3) Nhấn Lưu thay đổi. | Form hoặc API báo lỗi cụ thể; sản phẩm không được lưu và tồn kho không thay đổi. | Sheet `TC9` (1 ảnh) | **Đạt** |
| **TC10** | Cập nhật sản phẩm | Kiểm tra chỉnh sửa thông tin sản phẩm hiện có. | Điều kiện trước: P_TC_001 đang tồn tại.<br>Dữ liệu mới: Tên Nước suối 500ml.<br>Thao tác:<br>1) Tìm P_TC_001.<br>2) Nhấn Chỉnh sửa.<br>3) Đổi tên.<br>4) Nhấn Lưu thay đổi.<br>5) Tải lại trang. | Tên mới hiển thị sau khi tải lại; mã và số lượng sản phẩm không bị thay đổi ngoài ý muốn. | Sheet `TC10` (1 ảnh) | **Đạt** |
| **TC11** | Xóa sản phẩm chưa phát sinh giao dịch | Kiểm tra thao tác xóa mềm sản phẩm. | Điều kiện trước: Có sản phẩm thử nghiệm chưa được dùng trong giao dịch.<br>Thao tác:<br>1) Tìm sản phẩm thử nghiệm.<br>2) Nhấn Xóa.<br>3) Xác nhận.<br>4) Làm mới danh sách. | Sản phẩm chuyển sang INACTIVE hoặc không còn trong danh sách hoạt động; sản phẩm khác không bị ảnh hưởng. | Sheet `TC11` (1 ảnh) | **Đạt** |

### 3.3. Quản lý danh mục

| ID | Tên test case | Mô tả | Dữ liệu đầu vào / Thao tác | Kết quả mong đợi | Minh chứng | Trạng thái |
|---|---|---|---|---|---|:---:|
| **TC12** | Tạo danh mục hợp lệ | Kiểm tra Owner tạo danh mục mới. | Dữ liệu: Mã DM_TC_01; tên Đồ uống; trạng thái Đang hoạt động.<br>Thao tác:<br>1) Mở Sản phẩm & Danh mục.<br>2) Chọn tab Danh mục.<br>3) Nhấn Thêm danh mục.<br>4) Nhập dữ liệu.<br>5) Nhấn Lưu. | Danh mục DM_TC_01 được tạo và xuất hiện trong danh sách của đúng hộ kinh doanh. | Sheet `TC12` (1 ảnh) | **Đạt** |
| **TC13** | Tạo danh mục trùng mã | Kiểm tra ràng buộc mã danh mục không trùng. | Điều kiện trước: DM_TC_01 đã tồn tại.<br>Dữ liệu: Mã DM_TC_01; tên Danh mục khác.<br>Thao tác:<br>1) Nhấn Thêm danh mục.<br>2) Nhập dữ liệu.<br>3) Nhấn Lưu. | Hệ thống báo trùng mã và không tạo danh mục thứ hai. | Sheet `TC13` (1 ảnh) | **Đạt** |
| **TC14** | Cập nhật danh mục | Kiểm tra chỉnh sửa tên danh mục. | Điều kiện trước: DM_TC_01 đang tồn tại.<br>Dữ liệu mới: Đồ uống đóng chai.<br>Thao tác:<br>1) Tìm DM_TC_01.<br>2) Nhấn Chỉnh sửa.<br>3) Đổi tên.<br>4) Nhấn Lưu.<br>5) Tải lại trang. | Tên mới được lưu; các sản phẩm đã gán vẫn liên kết với danh mục. | Sheet `TC14` (2 ảnh) | **Đạt** |
| **TC15** | Xóa danh mục đang có sản phẩm | Kiểm tra xóa mềm danh mục không làm mất sản phẩm. | Điều kiện trước: Có sản phẩm thuộc DM_TC_01.<br>Thao tác:<br>1) Mở tab Danh mục.<br>2) Chọn DM_TC_01.<br>3) Nhấn Xóa.<br>4) Xác nhận.<br>5) Mở lại danh sách sản phẩm. | Danh mục chuyển INACTIVE; sản phẩm liên quan không bị xóa và dữ liệu lịch sử vẫn còn. | Sheet `TC15` (1 ảnh) | **Đạt** |

### 3.4. Quản lý tồn kho và nhập kho

| ID | Tên test case | Mô tả | Dữ liệu đầu vào / Thao tác | Kết quả mong đợi | Minh chứng | Trạng thái |
|---|---|---|---|---|---|:---:|
| **TC16** | Xem tồn kho hiện tại | Kiểm tra số dư tồn kho của từng sản phẩm. | Điều kiện trước: P_TC_001 có tồn kho 20.<br>Thao tác:<br>1) Đăng nhập Owner.<br>2) Chọn Tồn kho hiện tại.<br>3) Tìm P_TC_001.<br>4) Đối chiếu với số lượng đã tạo. | Hiển thị P_TC_001 với tồn kho 20 và đúng đơn vị chuẩn. | Sheet `TC16` (1 ảnh) | **Đạt** |
| **TC17** | Nhập kho hợp lệ | Kiểm tra xác nhận phiếu nhập làm tăng tồn kho. | Điều kiện trước: P_TC_001 đang tồn 20.<br>Dữ liệu: Số lượng nhập 30; đơn giá nhập hợp lệ.<br>Thao tác:<br>1) Chọn Nhập kho.<br>2) Tạo phiếu nhập mới.<br>3) Chọn P_TC_001 và nhập dữ liệu.<br>4) Lưu rồi xác nhận phiếu.<br>5) Mở Tồn kho hiện tại. | Phiếu được xác nhận; tồn kho tăng từ 20 lên 50 và có giao dịch STOCK_IN số lượng 30. | Sheet `TC17` (2 ảnh) | **Đạt** |
| **TC18** | Nhập kho số lượng bằng 0 | Kiểm tra hệ thống không nhận số lượng nhập bằng 0. | Dữ liệu: Sản phẩm P_TC_001; số lượng 0.<br>Thao tác:<br>1) Tạo phiếu nhập mới.<br>2) Nhập số lượng 0.<br>3) Nhấn Lưu hoặc Xác nhận. | Hệ thống báo số lượng phải lớn hơn 0; không tạo giao dịch kho. | Sheet `TC18` (1 ảnh) | **Đạt** |
| **TC19** | Nhập kho số lượng âm | Kiểm tra hệ thống không nhận số lượng nhập âm. | Dữ liệu: Sản phẩm P_TC_001; số lượng -10.<br>Thao tác:<br>1) Tạo phiếu nhập mới.<br>2) Nhập số lượng -10.<br>3) Nhấn Lưu. | Hệ thống từ chối; phiếu không được xác nhận và tồn kho không thay đổi. | Sheet `TC19` (1 ảnh) | **Đạt** |
| **TC20** | Xuất kho vượt số lượng tồn | Kiểm tra tồn kho không được âm. | Điều kiện trước: Sản phẩm đang tồn 88.<br>Dữ liệu: Số lượng xuất 89.<br>Thao tác:<br>1) Mở chức năng xuất kho hoặc tạo đơn bán.<br>2) Chọn sản phẩm.<br>3) Nhập số lượng 15.<br>4) Xác nhận. | Hệ thống từ chối xuất; số dư vẫn là 8 (vì khi nhập lớn hơn 88 thì hệ thống sẽ không cho nhập) và không tạo giao dịch STOCK_OUT hợp lệ. | Sheet `TC20` (1 ảnh) | **Đạt** |
| **TC21** | Xem lịch sử giao dịch kho | Kiểm tra sổ kho sau khi nhập hàng. | Điều kiện trước: Đã xác nhận phiếu nhập 1 sản phẩm.<br>Thao tác:<br>1) Mở lịch sử hoặc sổ kho.<br>2) Lọc theo sản phẩm mới nhất.<br>3) Kiểm tra giao dịch mới nhất. | Hiển thị đúng loại nhập kho, số lượng 30, thời gian, người thực hiện và mã tham chiếu. | Sheet `TC21` (1 ảnh) | **Đạt** |

### 3.5. Cảnh báo tồn kho thấp

| ID | Tên test case | Mô tả | Dữ liệu đầu vào / Thao tác | Kết quả mong đợi | Minh chứng | Trạng thái |
|---|---|---|---|---|---|:---:|
| **TC22** | Thiết lập ngưỡng tồn kho | Kiểm tra lưu ngưỡng cảnh báo riêng cho sản phẩm. | Dữ liệu: Nhập các ngưỡng tồn kho cho các sản phẩm mẫu.<br>Thao tác:<br>1) Mở Cảnh báo tồn kho.<br>2) Chọn cấu hình ngưỡng tồn kho thấp cần thông báo.<br>3) Nhập ngưỡng tồn kho.<br>4) Nhấn Lưu.<br>5) Tải lại trang. | Ngưỡng tồn kho được lưu và sẽ thông báo cần nhập kho nếu ngưỡng nhập kho thấp hơn ngưỡng được đặt | Sheet `TC22` (1 ảnh) | **Đạt** |
| **TC23** | Tồn kho thấp hơn ngưỡng | Kiểm tra phát sinh cảnh báo khi tồn kho nhỏ hơn ngưỡng. | Dữ liệu: Nhập các ngưỡng tồn kho cho các sản phẩm mẫu.<br>Thao tác:<br>1) Mở Cảnh báo tồn kho.<br>2) Chọn cấu hình ngưỡng tồn kho thấp cần thông báo.<br>3) Nhập ngưỡng tồn kho.<br>4) Nhấn Lưu.<br>5) Tải lại trang.<br>6) Có thông báo về ngưỡng tồn kho thấp hơn hiện tại | Khi có sản phẩm dưới ngưỡng tồn kho quy định thì sẽ được thông báo ngay bên cạnh và ngay trên góc trái góc màn hình (hình cái chuông) | Sheet `TC23` (2 ảnh) | **Đạt** |
| **TC24** | Tồn kho bằng ngưỡng | Kiểm tra đúng điều kiện cảnh báo nhỏ hơn ngưỡng. | Điều kiện trước: Nhập các ngưỡng tồn kho cho các sản phẩm mẫu bằng với số lượng hiện có của sản phẩm mẫu đó.<br>Thao tác:<br>1) Mở Cảnh báo tồn kho.<br>2) Nhấn Làm mới.<br>3) Tìm sản phẩm mẫu vừa nhập | Sản phẩm sẽ không bị đánh dấu tồn kho thấp vì hệ thống chỉ cảnh báo khi tồn kho nhỏ hơn ngưỡng. | Sheet `TC24` (1 ảnh) | **Đạt** |
| **TC25** | Bổ sung hàng sau cảnh báo | Kiểm tra cảnh báo được gỡ khi tồn kho đã đủ. | Điều kiện trước: Sản phẩm mẫu đang có 5 mặt hàng tồn kho với ngưỡng cảnh cáo là 7<br>Thao tác:<br>1) Nhập thêm 6 sản phẩm.<br>2) Xác nhận phiếu nhập.<br>3) Mở lại Cảnh báo tồn kho.<br>4) Nhấn Làm mới. | Tồn kho thành 11; Sản phẩm mẫu không còn trong danh sách cảnh báo thấp. | Sheet `TC25` (2 ảnh) | **Đạt** |

### 3.6. Khách hàng, đơn hàng và thanh toán

| ID | Tên test case | Mô tả | Dữ liệu đầu vào / Thao tác | Kết quả mong đợi | Minh chứng | Trạng thái |
|---|---|---|---|---|---|:---:|
| **TC26** | Tạo khách hàng hợp lệ | Kiểm tra thêm khách hàng mới. | Dữ liệu: Đinh Thái , Sdt : 0889231234<br>Thao tác:<br>1) Mở Khách hàng.<br>2) Nhấn Thêm khách hàng.<br>3) Nhập dữ liệu.<br>4) Nhấn Lưu.<br>5) Tìm theo số điện thoại. | Khách hàng được tạo và xuất hiện trong đúng hộ kinh doanh với thông tin đã nhập. | Sheet `TC26` (2 ảnh) | **Đạt** |
| **TC27** | Tạo đơn bán hợp lệ | Kiểm tra tạo đơn và tính thành tiền. | Điều kiện trước: sản phẩm đủ tồn kho, có giá bán <br>Dữ liệu: Số lượng 2.<br>Thao tác:<br>1) Mở Đơn hàng.<br>2) Nhấn Tạo đơn.<br>3) Chọn khách và sản phẩm.<br>4) Nhập số lượng 2.<br>5) Kiểm tra tổng tiền.<br>6) Lưu đơn. | Đơn được tạo; thành tiền bằng số lượng nhân đơn giá và thông tin khách hàng chính xác. | Sheet `TC27` (2 ảnh) | **Đạt** |
| **TC28** | Tạo đơn vượt tồn kho | Kiểm tra hệ thống chặn bán vượt tồn. | Điều kiện trước: Sản phẩm chỉ còn 10<br>Dữ liệu: Số lượng bán 11<br>Thao tác:<br>1) Tạo đơn mới.<br>2) Chọn sản phẩm.<br>3) Nhập số lượng 11<br>4) Xác nhận đơn. | Hệ thống báo không đủ tồn kho; đơn không được xác nhận và tồn kho không âm. | Sheet `TC28` (1 ảnh) | **Đạt** |
| **TC29** | Thanh toán đủ giá trị đơn | Kiểm tra ghi nhận thanh toán toàn bộ. | Điều kiện trước: Đơn có tổng tiền 900000 và chưa thanh toán.<br>Dữ liệu: Số tiền trả 900000<br>Thao tác:<br>1) Mở chi tiết đơn.<br>2) Chọn cập nhật thanh toán.<br>3) Nhập số tiền.<br>4) Xác nhận. | Đã thu 900.000đ, còn nợ 0đ và trạng thái thanh toán là đã thanh toán đủ. | Sheet `TC29` (chưa có ảnh) | **Đạt** |
| **TC30** | Thanh toán một phần | Kiểm tra tính công nợ sau thanh toán một phần. | Điều kiện trước: Đơn có tổng tiền 300.000đ và chưa thanh toán.<br>Dữ liệu: Số tiền trả 150.000đ.<br>Thao tác:<br>1) Mở chi tiết đơn.<br>2) Nhập số tiền 150.000đ.<br>3) Xác nhận.<br>4) Mở công nợ khách hàng. | Đã thu 150.000đ, còn nợ 150.000đ; giao dịch thanh toán xuất hiện trong lịch sử. | Sheet `TC30` (1 ảnh) | **Đạt** |
| **TC31** | Hủy đơn đã xác nhận | Kiểm tra hủy đơn và hoàn tồn kho đúng một lần. | Điều kiện trước: Có đơn đã xác nhận và chưa hủy.<br>Thao tác:<br>1) Ghi nhận tồn kho hiện tại.<br>2) Mở chi tiết đơn.<br>3) Chọn Yêu cầu hủy.<br>4) Nhập lý do.<br>5) Xác nhận hủy.<br>6) Kiểm tra lại tồn kho. | Đơn chuyển sang đã hủy; hàng được hoàn đúng số lượng một lần và có giao dịch khôi phục kho. | Sheet `TC31` (1 ảnh) | **Đạt** |

### 3.7. Doanh thu và biểu đồ

| ID | Tên test case | Mô tả | Dữ liệu đầu vào / Thao tác | Kết quả mong đợi | Minh chứng | Trạng thái |
|---|---|---|---|---|---|:---:|
| **TC32** | Hiển thị sổ doanh thu | Kiểm tra đơn đã xác nhận được phản ánh vào doanh thu. | Điều kiện trước: Có một đơn bán đã xác nhận trong ngày kiểm thử.<br>Thao tác:<br>1) Đăng nhập Owner.<br>2) Mở Doanh thu.<br>3) Chọn khoảng ngày chứa ngày xác nhận đơn.<br>4) Nhấn Làm mới. | Giao dịch xuất hiện trong sổ; tổng doanh thu tăng đúng giá trị của đơn. | Sheet `TC32` (3 ảnh) | **Đạt** |
| **TC33** | Lọc doanh thu theo ngày | Kiểm tra bộ lọc chỉ trả dữ liệu trong khoảng đã chọn. | Điều kiện trước: Có hai đơn ở hai ngày khác nhau.<br>Thao tác:<br>1) Mở Doanh thu.<br>2) Chọn từ ngày và đến ngày chỉ chứa một đơn.<br>3) Nhấn áp dụng hoặc làm mới. | Chỉ đơn nằm trong khoảng ngày xuất hiện; tổng tiền bằng đúng đơn đó. | Sheet `TC33` (2 ảnh) | **Đạt** |
| **TC34** | Khoảng ngày không hợp lệ | Kiểm tra ngày bắt đầu lớn hơn ngày kết thúc. | Dữ liệu: Từ ngày 14/09/2026; đến ngày 01/09/2026.<br>Thao tác:<br>1) Mở Biểu đồ doanh thu.<br>2) Chọn hai ngày trên.<br>3) Nhấn Xem biểu đồ. | Hiển thị thông báo khoảng ngày không hợp lệ; không thay thế biểu đồ bằng dữ liệu sai. | Sheet `TC34` (1 ảnh) | **Đạt** |
| **TC35** | Nhóm biểu đồ theo thời gian | Kiểm tra tổng hợp doanh thu theo ngày, tuần và tháng. | Điều kiện trước: Khoảng thời gian có dữ liệu nhiều ngày.<br>Thao tác:<br>1) Chọn Theo ngày và ghi nhận tổng.<br>2) Đổi sang Theo tuần.<br>3) Đổi sang Theo tháng.<br>4) So sánh các tổng. | Số điểm dữ liệu thay đổi theo nhóm thời gian; tổng doanh thu của cùng khoảng ngày không thay đổi. | Sheet `TC35` (3 ảnh) | **Đạt** |
| **TC36** | Biểu đồ khi không có dữ liệu | Kiểm tra trạng thái rỗng của biểu đồ. | Dữ liệu: Khoảng ngày chưa có đơn xác nhận.<br>Thao tác:<br>1) Chọn khoảng ngày không có dữ liệu.<br>2) Nhấn Xem biểu đồ. | Hiển thị thông báo không có dữ liệu; không lỗi trang và không giữ dữ liệu của lần lọc trước. | Sheet `TC36` (1 ảnh) | **Đạt** |

### 3.8. Nhân viên, Admin và cô lập dữ liệu

| ID | Tên test case | Mô tả | Dữ liệu đầu vào / Thao tác | Kết quả mong đợi | Minh chứng | Trạng thái |
|---|---|---|---|---|---|:---:|
| **TC37** | Owner tạo nhân viên | Kiểm tra tạo nhân viên thuộc đúng hộ kinh doanh. | Điều kiện trước: Owner có quyền quản lý nhân viên.<br>Dữ liệu: Thông tin nhân viên hợp lệ và email chưa tồn tại.<br>Thao tác:<br>1) Mở Quản lý nhân viên.<br>2) Nhấn Thêm nhân viên.<br>3) Nhập dữ liệu.<br>4) Nhấn Lưu. | Nhân viên được tạo, xuất hiện trong danh sách và liên kết với đúng businessId. | Sheet `TC37` (2 ảnh) | **Đạt** |
| **TC38** | Owner khóa tài khoản nhân viên | Kiểm tra nhân viên bị khóa không thể tiếp tục sử dụng hệ thống. | Điều kiện trước: Nhân viên đang hoạt động.<br>Thao tác:<br>1) Mở chi tiết nhân viên.<br>2) Nhấn Khóa tài khoản.<br>3) Xác nhận.<br>4) Đăng xuất Owner.<br>5) Thử đăng nhập bằng nhân viên vừa khóa. | Tài khoản chuyển trạng thái khóa; nhân viên không đăng nhập hoặc sử dụng API được. | Sheet `TC38` (2 ảnh) | **Đạt** |
| **TC39** | Admin tạo gói thuê bao | Kiểm tra CRUD gói thuê bao phía Admin. | Điều kiện trước: Đăng nhập Admin.<br>Dữ liệu: Mã PLAN_TC; tên Gói kiểm thử; giá tháng 199000; giá năm 1990000.<br>Thao tác:<br>1) Mở Gói thuê bao.<br>2) Nhấn Thêm gói.<br>3) Nhập dữ liệu.<br>4) Nhấn Lưu.<br>5) Tìm PLAN_TC. | Gói được lưu và hiển thị đúng mã, tên, giá tháng, giá năm và trạng thái. | Sheet `TC39` (2 ảnh) | **Đạt** |

## 4. Hướng dẫn sử dụng và cập nhật

1. Mở [file Excel test case](./hbdt-system-test-cases.xlsx) và chọn sheet `Test Cases` để xem danh sách tổng.
2. Nhấn liên kết trong cột **Ảnh minh chứng** để chuyển đến sheet `TC1`–`TC39` tương ứng.
3. Thực hiện đúng điều kiện trước, dữ liệu đầu vào và thứ tự thao tác đã ghi.
4. Chỉ ghi trạng thái **Đạt** khi kết quả thực tế khớp hoàn toàn với kết quả mong đợi và đã bổ sung minh chứng.
5. Nếu kết quả không khớp, ghi trạng thái **Không đạt**, chụp lại lỗi và tạo issue để theo dõi.
6. Khi chạy lại test, cập nhật đồng thời trạng thái, ảnh minh chứng và ngày thực hiện trong workbook.

## 5. Nội dung cần lưu ý

- **Thứ tự thực hiện:** Một số kịch bản dùng lại dữ liệu được tạo ở test trước, như `P_TC_001` và `DM_TC_01`. Nên chạy theo thứ tự TC01–TC39 hoặc chuẩn bị lại dữ liệu trước mỗi lần test.
- **Cô lập dữ liệu:** Khi kiểm tra Owner và Employee, phải xác nhận dữ liệu luôn thuộc đúng `businessId` và không lộ dữ liệu của hộ kinh doanh khác.
- **Dữ liệu kiểm thử:** Chỉ sử dụng tài khoản và dữ liệu thử nghiệm. Không chạy các thao tác tạo, khóa, hủy hoặc thanh toán trên dữ liệu thật.
- **Ảnh minh chứng:** Workbook hiện có 53 ảnh trong các sheet TC01–TC39. Riêng sheet `TC29` chưa có ảnh dù trạng thái đang là **Đạt**; cần bổ sung ảnh trước khi nộp bản cuối.
- **TC20 cần đối chiếu lại dữ liệu:** Tiêu đề và điều kiện ghi tồn kho 88, xuất 89; phần thao tác lại ghi số lượng 15 và kết quả ghi số dư 8. Cần thống nhất lại số lượng xuất và số dư mong đợi trong workbook.
- **TC39 chưa bao phủ toàn bộ CRUD:** Kịch bản hiện chỉ kiểm tra tạo và tìm gói thuê bao. Nếu tài liệu tuyên bố kiểm tra đầy đủ CRUD gói thuê bao, nhóm cần bổ sung phạm vi cập nhật và xóa hoặc điều chỉnh lại mô tả.
- **Trạng thái trong tài liệu:** Giá trị **Đạt** được sao chép từ workbook tại thời điểm cập nhật. Đây không phải kết quả của bộ unit test hoặc integration test tự động.
- **Định dạng dữ liệu:** Ngày dùng định dạng `dd/MM/yyyy`; số tiền dùng Việt Nam đồng; mã sản phẩm, mã danh mục và mã gói phải giữ nguyên chữ hoa, chữ thường theo dữ liệu thử nghiệm.

## 6. Tiêu chí hoàn tất

Một test case được xem là hoàn tất khi đáp ứng đủ các điều kiện sau:

- Đã thực hiện đúng dữ liệu đầu vào và các bước thao tác.
- Kết quả thực tế khớp với kết quả mong đợi.
- Có ảnh hoặc dữ liệu minh chứng trong đúng sheet TC tương ứng.
- Trạng thái trên sheet `Test Cases` đã được cập nhật.
- Không làm thay đổi dữ liệu ngoài phạm vi test hoặc dữ liệu của hộ kinh doanh khác.
