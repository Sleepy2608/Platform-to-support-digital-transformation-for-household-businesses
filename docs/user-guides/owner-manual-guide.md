# Hướng Dẫn Sử Dụng Hệ Thống — Vai Trò Chủ Hộ Kinh Doanh (Business Owner Manual Guide)

| Thông tin | Nội dung |
|---|---|
| **Tài liệu** | Hướng Dẫn Sử Dụng Hệ Thống – Vai Trò Chủ Hộ Kinh Doanh (Business Owner) |
| **Dự án** | Nền tảng Hỗ trợ Chuyển đổi Số cho Hộ Kinh doanh (HBDT Platform) |
| **Vai trò áp dụng** | Chủ hộ kinh doanh (`BUSINESS_OWNER` / Business Owner) |
| **Phiên bản** | 1.0 — 07/09/2026 |
| **Cập nhật lần cuối** | 07/09/2026 |

---

## 1. Giới thiệu tổng quan

Tài liệu này hướng dẫn chi tiết các chức năng quản lý vận hành kinh doanh dành cho **Chủ Hộ Kinh Doanh (Business Owner)** trên Nền tảng HBDT Platform.

Chủ hộ kinh doanh là đối tượng trung tâm của nền tảng, có toàn quyền quản lý cửa hàng của mình bao gồm: Thiết lập thông tin hộ kinh doanh, Quản lý sản phẩm & tồn kho, Quản lý nhân viên cửa hàng, Lập đơn bán hàng & hóa đơn dịch vụ, Theo dõi báo cáo doanh thu và Xuất biểu mẫu sổ sách kế toán theo đúng quy định **Thông tư 88/2021/TT-BTC**.

---

## 2. Đăng ký, Đăng nhập và Thiết lập Ban đầu

### 2.1 Đăng ký tài khoản & Onboarding Cửa hàng
1. Truy cập trang chủ: `http://localhost:3000/register` (hoặc `/login` chọn tab Đăng ký).
2. Điền các thông tin cơ bản: Tên đăng nhập, Số điện thoại, Email và Mật khẩu.
3. **Xác thực Email (`/verify-email`):** Nhập mã OTP 6 số gửi về Email (hoặc hiển thị tại Console Log trong môi trường Dev).
4. **Màn hình Onboarding (`/onboarding`):**
   - Thiết lập tên cửa hàng, mã số thuế và địa chỉ theo địa giới hành chính.
   - Lựa chọn Gói dịch vụ ban đầu (Dùng thử miễn phí Free Plan hoặc đăng ký gói cước Basic/Pro).
5. Nhấn **Hoàn tất Onboarding** để vào trang quản lý chính.

### 2.2 Đăng nhập hệ thống
1. Vào đường dẫn `http://localhost:3000/login`.
2. Nhập **Tên đăng nhập / Email** (ví dụ demo: `owner` hoặc `owner@hbdt.com`).
3. Nhập **Mật khẩu** (Mật khẩu mặc định dev: `owner123`).
4. Nhấn **Đăng nhập**. Hệ thống chuyển vào **Owner Dashboard** (`/owner/products`).

### 2.3 Thiết lập Thông tin Hộ Kinh Doanh (Cửa hàng)
1. Vào menu **Cài đặt cửa hàng** (`/owner/account`).
2. Cập nhật các thông tin pháp lý bắt buộc:
   - **Tên hộ kinh doanh:** Ví dụ *Cửa hàng Tạp hóa Minh Phát*.
   - **Mã số thuế (MST):** Mã số thuế hộ kinh doanh.
   - **Địa chỉ kinh doanh:** Chọn Tỉnh/Thành phố, Quận/Huyện, Phường/Xã từ danh mục hệ thống.
   - **Lĩnh vực kinh doanh / Phương pháp tính thuế:** Chọn phương pháp Thuế khoán hoặc Kê khai theo Thông tư 88.

---

## 3. Các chức năng Quản lý Kinh doanh dành cho Chủ Hộ

### 3.1 Quản lý Danh mục & Sản phẩm (Products & Stock)

#### a. Thêm Sản phẩm Mới
1. Vào menu **Quản lý sản phẩm** → Chọn **Thêm sản phẩm mới**.
2. Nhập thông tin sản phẩm:
   - Tên sản phẩm, Mã SKU / Mã vạch (Barcode).
   - Chọn Danh mục sản phẩm (Tạp hóa, Thực phẩm, Vật tư,...).
   - Đơn vị tính (Cái, Chai, Gói, Kg,...).
   - Giá nhập (Giá vốn) và Giá bán niêm yết.
   - Tồn kho ban đầu & Ngưỡng cảnh báo tồn kho tối thiểu (ví dụ: Cảnh báo khi tồn kho < 10).
3. Tải lên hình ảnh đại diện cho sản phẩm.
4. Nhấn **Lưu sản phẩm**.

#### b. Quản lý Tồn kho & Cảnh báo Tồn kho Thấp
- Hệ thống tự động theo dõi biến động số lượng tồn kho theo thời gian thực khi có đơn bán hàng mới.
- Dashboard tự động hiển thị thẻ cảnh báo **Sản phẩm sắp hết hàng** khi số lượng tồn xuống dưới ngưỡng tối thiểu giúp Chủ hộ chủ động nhập hàng.

---

### 3.2 Quản lý Nhân viên Cửa hàng (Employee Management)
Chủ hộ kinh doanh có thể tạo tài khoản cho nhân viên bán hàng và phân quyền truy cập.

1. Vào menu **Quản lý nhân viên** → Nhấn **Thêm nhân viên**.
2. Nhập Họ tên, Số điện thoại, Email và Mật khẩu khởi tạo cho nhân viên.
3. **Phân quyền chức năng:**
   - Chọn vai trò `EMPLOYEE` (Chỉ có quyền Lập đơn hàng, Bán hàng tại quầy, Không được xem báo cáo doanh thu tổng hoặc thay đổi cài đặt giá).
4. Nhấn **Tạo tài khoản nhân viên**.

---

### 3.3 Lập Đơn Bán Hàng & Bán Hàng Nhanh (Sales Order & POS)

#### a. Bán hàng tại Quầy (POS / Thu ngân)
1. Vào menu **Bán hàng (POS)**.
2. Tìm kiếm sản phẩm theo Tên, Mã SKU hoặc Quét mã vạch Barcode.
3. Chọn số lượng sản phẩm.
4. Chọn Khách hàng (hoặc chọn Khách lẻ).
5. Áp dụng giảm giá / Chiết khấu (nếu có).
6. Nhấn **Thanh toán**:
   - Phương thức: Tiền mặt, Chuyển khoản ngân hàng (VietQR), hoặc Ví điện tử.
7. Nhấn **Xác nhận & In hóa đơn**: Hệ thống trừ tồn kho tương ứng và xuất file hóa đơn bán hàng.

#### b. Lập đơn hàng bằng Trợ lý AI (Smart Voice / Text Order)
1. Nhấn vào biểu tượng **Trợ lý AI** ở góc màn hình.
2. Nhập câu lệnh văn bản hoặc thu âm giọng nói:
   - *Ví dụ: "Bán cho anh Hùng 2 thùng bia 333 và 5 gói mì Hảo Hảo thanh toán tiền mặt"*.
3. Phân hệ AI tự động phân tích câu lệnh, bóc tách tên khách hàng, danh sách sản phẩm, số lượng và tổng tiền.
4. Chủ hộ kiểm tra lại đơn hàng do AI tạo ra và bấm **Xác nhận tạo đơn**.

---

### 3.4 Quản lý Khách hàng & Sổ Nợ (Customers & Receivables)
1. Vào menu **Quản lý khách hàng**.
2. Lưu trữ thông tin khách hàng thân thiết: Họ tên, Số điện thoại, Địa chỉ, Điểm tích lũy.
3. **Quản lý Sổ nợ (Ghi nợ):**
   - Cho phép chọn hình thức **Ghi nợ (Khách nợ)** khi thanh toán đơn hàng.
   - Màn hình Sổ nợ hiển thị tổng số tiền khách còn nợ, lịch sử mua hàng và nút **Ghi nhận trả nợ** khi khách thanh toán.

---

### 3.5 Báo cáo Kế toán & Sổ sách Kế toán Thông tư 88/2021/TT-BTC
Điểm vượt trội của HBDT Platform là hỗ trợ Chủ hộ xuất đầy đủ 7 biểu mẫu sổ sách kế toán bắt buộc cho hộ kinh doanh theo Thông tư 88:

1. Vào menu **Báo cáo & Sổ sách kế toán**.
2. Select chọn khoảng thời gian báo cáo (Theo ngày, tuần, tháng, quý hoặc năm).
3. **Danh sách sổ sách hỗ trợ xuất (PDF / Excel):**
   - **S1-HKD:** Sổ chi tiết doanh thu bán hàng hóa, dịch vụ.
   - **S2-HKD:** Sổ chi tiết vật liệu, dụng cụ, sản phẩm, hàng hóa.
   - **S3-HKD:** Sổ chi phí sản xuất, kinh doanh.
   - **S4-HKD:** Sổ theo dõi thực hiện nghĩa vụ thuế với NSNN.
   - **S5-HKD:** Sổ theo dõi tình hình thanh toán tiền lương và các khoản nộp theo lương.
   - **S6-HKD:** Sổ tiền mặt.
   - **S7-HKD:** Sổ tiền gửi ngân hàng.
4. Nhấn nút **Tải xuống Báo cáo (PDF / Excel)** để nộp cho cơ quan thuế hoặc lưu trữ.

---

### 3.6 Quản lý Gói Thuê Bao & Thanh toán Hóa đơn Dịch vụ (Subscriptions)
1. Vào menu **Gói dịch vụ cửa hàng**.
2. Màn hình hiển thị gói cước hiện tại (Free, Basic, Pro) và thời hạn sử dụng còn lại.
3. **Nâng cấp / Gia hạn gói:**
   - Chọn gói cước mong muốn (Basic hoặc Pro).
   - Chọn thời hạn (6 tháng, 12 tháng).
   - Hệ thống hiển thị mã VietQR chuyển khoản thanh toán.
   - Sau khi thanh toán, hệ thống tự động kích hoạt tính năng mới của gói.

---

## 4. Bảng tóm tắt Luồng Thao tác Hàng ngày của Chủ Hộ

```text
[Mở Cửa Hàng] ──> [Đăng nhập Owner] ──> [Kiểm tra Cảnh báo Tồn kho]
                                                │
[Thanh toán / Xuất Sổ] <── [Xem Báo cáo Doanh thu] <── [Thực hiện Bán hàng (POS / AI)]
```

---

## 5. Hướng dẫn Xử lý Sự cố cho Chủ Hộ

| Triệu chứng | Nguyên nhân | Cách xử lý |
|---|---|---|
| Không tạo được sản phẩm mới | Đã đạt giới hạn tối đa số sản phẩm của gói Free | Nâng cấp lên gói Basic/Pro để tạo không giới hạn sản phẩm |
| Không quét được mã vạch Barcode | Thiết bị quét chưa kết nối hoặc camera chưa cấp quyền | Kiểm tra dây cắm đầu quét mã vạch hoặc cho phép trình duyệt truy cập Camera |
| Trợ lý AI nhận diện sai tên sản phẩm | Tên sản phẩm trong kho chưa rõ ràng | Vào Quản lý sản phẩm cập nhật lại tên rõ ràng (vd: "Mì Hảo Hảo Tôm Chua Cay") |
| Sổ sách kế toán TT88 bị trống dữ liệu | Chưa chọn đúng khoảng thời gian hoặc chưa có đơn hàng thành công | Chọn lại từ ngày - đến ngày có phát sinh đơn hàng bán xuất kho |
