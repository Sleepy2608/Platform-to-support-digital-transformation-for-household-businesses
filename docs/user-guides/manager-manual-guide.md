# Hướng Dẫn Sử Dụng Hệ Thống — Vai Trò Quản Lý / Chuyên Viên (System Manager Manual Guide)

| Thông tin | Nội dung |
|---|---|
| **Tài liệu** | Hướng Dẫn Sử Dụng Hệ Thống – Vai Trò Quản Lý / Chuyên Viên (System Manager) |
| **Dự án** | Nền tảng Hỗ trợ Chuyển đổi Số cho Hộ Kinh doanh (HBDT Platform) |
| **Vai trò áp dụng** | Quản lý / Chuyên viên hỗ trợ (`MANAGER` / System Manager) |
| **Phiên bản** | 1.2 |
| **Cập nhật lần cuối** | 10/09/2026 |

---

## 1. Giới thiệu tổng quan

Tài liệu này mô tả các tác nghiệp chính của vai trò **Manager** trên hệ thống HBDT hiện tại, sau khi repo được cập nhật các chức năng mới về quản lý gói đăng ký, báo cáo doanh thu, tồn kho và JWT handling.

Vai trò Manager hiện chịu trách nhiệm hỗ trợ vận hành nền tảng, duyệt hồ sơ hộ kinh doanh, quản lý gói đăng ký của Owner, kiểm tra trạng thái thanh toán, theo dõi revenue ledger, và giám sát các cảnh báo nghiệp vụ liên quan đến kho hàng, nợ khách hàng và lịch sử đơn hàng.

---

## 2. Đăng nhập và Truy cập

### 2.1 Địa chỉ truy cập
- **Đường dẫn đăng nhập Manager:** `http://localhost:3000/login`
- **Admin portal:** `http://localhost:3000/admin/login`

### 2.2 Quy trình đăng nhập
1. Truy cập `http://localhost:3000/login`.
2. Nhập tài khoản Manager được cấp.
3. Nhập mật khẩu.
4. Sau khi đăng nhập, hệ thống điều hướng vào dashboard quản lý phù hợp với quyền `MANAGER`.

---

## 3. Các chức năng chính của Quản Lý / Chuyên Viên

### 3.1 Quản lý gói đăng ký của Owner
Đây là tính năng mới quan trọng nhất trong giai đoạn gần đây:
1. Vào menu **Quản lý gói dịch vụ** hoặc **Owner packages**.
2. Xem danh sách các hộ kinh doanh đang trong trạng thái subscription mở / chờ thanh toán / hết hạn.
3. Kiểm tra thông tin:
   - tên hộ kinh doanh
   - gói hiện tại
   - ngày bắt đầu / hết hạn
   - trạng thái thanh toán
4. Thao tác xử lý có thể gồm:
   - **Xác nhận kích hoạt gói**
   - **Gia hạn / cập nhật gói**
   - **Khóa / vô hiệu hóa gói** nếu vi phạm
   - **Theo dõi lịch sử thay đổi gói**

> Mục tiêu: Manager không cần can thiệp sâu vào cấu hình nền tảng, nhưng có quyền hỗ trợ vận hành subscription lifecycle của owner ngay từ dashboard.

---

### 3.2 Kiểm duyệt hồ sơ Owner / Business approval
Khi có hộ kinh doanh mới đăng ký hoặc cập nhật thông tin giấy tờ:
1. Vào menu **Business approvals**.
2. Xem trạng thái hồ sơ `PENDING_VERIFICATION` hoặc `REJECTED`.
3. Đối soát các thông tin:
   - tên hộ kinh doanh
   - mã số thuế
   - địa chỉ
   - giấy phép / hồ sơ đính kèm
4. Thao tác:
   - **Approve** để kích hoạt tài khoản và quyền truy cập
   - **Request changes** nếu thiếu giấy tờ
   - **Reject** nếu hồ sơ không hợp lệ

---

### 3.3 Theo dõi Revenue Ledger và doanh thu theo ngày
Manager cần có thể kiểm tra tình hình kinh doanh tổng quan của Owner:
1. Vào menu **Revenue Ledger** hoặc **Doanh thu chi tiết**.
2. Chọn khoảng thời gian hoặc ngày cụ thể.
3. Xem các chỉ số:
   - doanh thu bán hàng
   - chi phí nhập hàng / stock import
   - lợi nhuận thực tế
   - doanh thu theo từng đơn hàng / từng ngày
4. Điều này rất hữu ích khi hỗ trợ owner phát hiện sai lệch doanh thu hoặc kiểm tra mặt bằng hoạt động cửa hàng.

---

### 3.4 Kiểm tra tồn kho, cảnh báo, và bookkeeping tự động
Manager có thể hỗ trợ owner khi có các vấn đề sau:
- sản phẩm sắp hết hàng
- số lượng tồn kho không khớp với đơn hàng
- mismatch giữa doanh thu và stock import cost

Các thao tác cần chú ý:
1. Vào dashboard **Inventory / Low stock / Bookkeeping**.
2. Xem các giao dịch biến động kho.
3. Kiểm tra xem stock adjustment, stock import và sales order có đang đồng bộ đúng với accounting flow.
4. Xác minh nếu có sự kiện biến động kho cần điều chỉnh lại hoặc báo cho owner.

---

### 3.5 Theo dõi lịch sử đơn hàng và thanh toán
1. Vào menu **Order history** hoặc **Invoice history**.
2. Lọc theo:
   - người bán / owner
   - ngày tạo đơn
   - trạng thái thanh toán
   - loại đơn hàng
3. Dùng để đối chiếu lỗi, phát hiện giao dịch sai, hoặc hỗ trợ khiếu nại khách hàng.

---

### 3.6 Hỗ trợ kỹ thuật & tra cứu audit log
Khi nhận phản hồi từ owner hoặc nhân viên về lỗi nghiệp vụ:
1. Vào menu **Audit Logs**.
2. Lọc theo:
   - Business ID
   - User name
   - thời gian
   - loại hành động
3. Kiểm tra các thao tác `CREATE`, `UPDATE`, `DELETE`, `PAYMENT`, `SUBSCRIPTION`, `STOCK_ADJUSTMENT`, `DEBT_PAYMENT`.

---

## 4. Ma trận Phân quyền giữa ADMIN và MANAGER

| Chức năng | Quản trị viên (ADMIN) | Quản lý / Chuyên viên (MANAGER) |
|---|:---:|:---:|
| Khóa / Mở khóa tài khoản admin khác | ✅ Toàn quyền | ❌ Không có quyền |
| Phê duyệt hồ sơ Owner | ✅ Có | ✅ Có |
| Quản lý gói đăng ký của Owner | ✅ Có | ✅ Có |
| Cấu hình giá gói dịch vụ | ✅ Toàn quyền | 👁️ Chỉ xem hoặc hỗ trợ vận hành |
| Theo dõi Revenue Ledger | ✅ Có | ✅ Có |
| Xem lịch sử đơn hàng / hóa đơn | ✅ Có | ✅ Có |
| Theo dõi stock import / inventory bookkeeping | ✅ Có | ✅ Có |
| Tra cứu Audit Log | ✅ Toàn hệ thống | ✅ Hỗ trợ vận hành |
| Thao tác Seek Data / Snapshot | ✅ Cần Database Key | ❌ Không có quyền |

---

## 5. Xử lý sự cố nghiệp vụ thường gặp

| Vấn đề | Nguyên nhân | Cách xử lý |
|---|---|---|
| Owner chưa nhận được gói đăng ký sau khi thanh toán | Chờ xác nhận hoặc route JWT / token hết hạn | Kiểm tra trạng thái subscription và refresh token / xác thực |
| Doanh thu không khớp với tồn kho | Stock import / sales order / adjustment chưa đồng bộ | Kiểm tra revenue ledger và inventory bookkeeping |
| Owner báo mã đơn hàng không hiển thị đúng | Lịch sử theo ngày chưa cập nhật hoặc dữ liệu cũ | Xem lại order history và audit log |
| Token hết hạn khi thao tác trên dashboard | JWT 401 / expired refresh flow | Kiểm tra login session và refresh token, đảm bảo hệ thống đang dùng JWT validate đúng |

---

## 6. Gợi ý vận hành tốt cho Manager
- Nên kiểm tra dashboard subscription mỗi ngày để phát hiện owner đang gần hết hạn hoặc chờ xác nhận thanh toán.
- Nên ưu tiên kiểm tra revenue ledger sau khi owner có nhiều giao dịch theo ngày.
- Nên kiểm tra low-stock alerts và stock adjustments nếu có dấu hiệu sai số hoặc miền dữ liệu không khớp.
- Nên đối chiếu audit log trước khi hỗ trợ owner khiếu nại hoặc khi phát hiện dữ liệu không thống nhất.
