# Hướng Dẫn Sử Dụng Hệ Thống — Vai Trò Chủ Hộ Kinh Doanh (Business Owner Manual Guide)

| Thông tin | Nội dung |
|---|---|
| **Tài liệu** | Hướng Dẫn Sử Dụng Hệ Thống – Vai Trò Chủ Hộ Kinh Doanh (Business Owner) |
| **Dự án** | Nền tảng Hỗ trợ Chuyển đổi Số cho Hộ Kinh doanh (HBDT Platform) |
| **Vai trò áp dụng** | Chủ hộ kinh doanh (`BUSINESS_OWNER` / Business Owner) |
| **Phiên bản** | 1.2 |
| **Cập nhật lần cuối** | 10/09/2026 |

---

## 1. Giới thiệu tổng quan

Tài liệu này mô tả luồng thao tác chính dành cho **Chủ hộ kinh doanh (Owner)** sau khi hệ thống tích hợp các tính năng mới: quản lý gói thuê bao, revenue ledger chi tiết, stock import, bookkeeping tự động và lịch sử đơn hàng theo ngày.

Owner là vai trò trung tâm của nền tảng, có quyền quản lý sản phẩm, tồn kho, nhân viên, đơn hàng, nợ khách hàng, doanh thu và các sổ kế toán theo Thông tư 88/2021/TT-BTC.

---

## 2. Đăng ký, Đăng nhập và Thiết lập Ban đầu

### 2.1 Đăng ký tài khoản & Onboarding Cửa hàng
1. Truy cập trang chủ: `http://localhost:3000/register` (hoặc `/login` chọn tab đăng ký).
2. Điền các thông tin cơ bản: tên đăng nhập, số điện thoại, email và mật khẩu.
3. Xác thực Email bằng OTP (ở môi trường Dev, mã OTP có thể hiện trong console log của backend).
4. Hoàn tất onboarding cửa hàng với các thông tin:
   - tên cửa hàng
   - mã số thuế
   - địa chỉ
   - loại hình kinh doanh
5. Chọn hoặc cập nhật gói dịch vụ phù hợp.

### 2.2 Đăng nhập hệ thống
1. Vào `http://localhost:3000/login`.
2. Nhập tài khoản owner (demo: `owner` hoặc `owner@hbdt.com`).
3. Nhập mật khẩu demo (`owner123` trong môi trường dev).
4. Nhấn **Đăng nhập** để vào dashboard chính của Owner.

### 2.3 Thiết lập thông tin cửa hàng
1. Vào menu **Cài đặt cửa hàng**.
2. Bổ sung các thông tin bắt buộc:
   - tên hộ kinh doanh
   - mã số thuế
   - địa chỉ kinh doanh
   - lĩnh vực kinh doanh
   - phương pháp tính thuế / báo cáo kế toán

---

## 3. Các chức năng quản lý kinh doanh chính

### 3.1 Quản lý sản phẩm và tồn kho
#### a. Thêm sản phẩm mới
1. Vào menu **Quản lý sản phẩm**.
2. Chọn **Thêm sản phẩm mới**.
3. Nhập thông tin:
   - tên sản phẩm
   - mã SKU / barcode
   - danh mục
   - đơn vị tính
   - giá nhập và giá bán
   - ngưỡng cảnh báo tồn kho
4. Tải lên ảnh nếu cần.
5. Lưu sản phẩm.

#### b. Tồn kho và cảnh báo sắp hết hàng
- Hệ thống theo dõi tự động lượng tồn kho khi có đơn hàng hoặc nhập hàng.
- Nếu số lượng giảm xuống dưới ngưỡng cảnh báo thì dashboard sẽ hiển thị cảnh báo low stock.
- Quản lý stock import và stock adjustment đã được bổ sung để hỗ trợ đồng bộ kho với sổ kế toán.

---

### 3.2 Quản lý nhân viên cửa hàng
1. Vào menu **Quản lý nhân viên**.
2. Chọn **Thêm nhân viên**.
3. Nhập thông tin nhân viên và mật khẩu ban đầu.
4. Phân quyền theo vai trò phù hợp (`EMPLOYEE`, `MANAGER`, ... nếu hệ thống cho phép).
5. Lưu tài khoản nhân viên.

---

### 3.3 Bán hàng tại quầy và lịch sử đơn hàng
#### a. Bán hàng / POS
1. Vào **Bán hàng (POS)**.
2. Chọn sản phẩm và số lượng.
3. Chọn khách hàng hoặc khách lẻ.
4. Chọn phương thức thanh toán: tiền mặt, chuyển khoản, ghi nợ,...
5. Xác nhận thanh toán và in hóa đơn nếu cần.

#### b. Lịch sử đơn hàng theo ngày
- Hệ thống hiện có chế độ xem lịch sử đơn hàng theo ngày và theo trạng thái.
- Owner có thể lọc theo:
  - ngày
  - khách hàng
  - trạng thái thanh toán
  - trạng thái đơn hàng

---

### 3.4 Quản lý khách hàng và công nợ
1. Vào menu **Quản lý khách hàng**.
2. Xem danh sách khách hàng, số dư công nợ và lịch sử giao dịch.
3. Khi lập đơn hàng với hình thức ghi nợ:
   - doanh thu vẫn được ghi nhận
   - số tiền còn nợ được cập nhật vào hồ sơ khách hàng
4. Khi khách hàng trả nợ, chọn **Debt Payment** và nhập số tiền thanh toán.
5. Hệ thống cập nhật lịch sử trả nợ tự động.

---

### 3.5 Sổ sách kế toán và báo cáo doanh thu
Owner có thể xem các báo cáo sau:
1. **Revenue Ledger**: doanh thu, lợi nhuận, chi phí nhập hàng, doanh thu theo ngày.
2. **Inventory bookkeeping**: nhập kho, xuất kho, stock adjustment.
3. **Invoice history**: lịch sử hóa đơn, xem và in hóa đơn.
4. **Báo cáo kế toán theo mẫu TT88**: hỗ trợ S1-HKD, S2-HKD, S4-HKD.

> Tính năng revenue ledger đã được cập nhật để hiển thị giá trị thực tế sau khi trừ chi phí nhập hàng, phù hợp với yêu cầu tài chính kinh doanh.

---

### 3.6 Quản lý gói thuê bao & thanh toán
1. Vào menu **Gói dịch vụ cửa hàng**.
2. Xem gói hiện tại và ngày hết hạn.
3. Chọn gói mong muốn để nâng cấp hoặc gia hạn.
4. Xác nhận cách thanh toán qua VietQR hoặc phương thức khác.
5. Sau khi thanh toán, hệ thống cập nhật trạng thái gói và quyền truy cập tương ứng.

> Manager có thể hỗ trợ xác nhận và kiểm tra trạng thái gói đăng ký của Owner trong các trường hợp thanh toán chờ xử lý hoặc gia hạn không rõ ràng.

---

## 4. Bảng tóm tắt luồng thao tác hàng ngày của Owner

```text
[Đăng nhập] -> [Kiểm tra dashboard] -> [Xem tồn kho / cảnh báo] -> [Lập đơn / POS]
      |                                                  |
      -> [Xem revenue ledger / invoice history] -> [Theo dõi công nợ]
      -> [Quản lý gói dịch vụ / hạn sử dụng] -> [Xuất báo cáo kế toán]
```

---

## 5. Hướng dẫn xử lý sự cố cho Owner

| Triệu chứng | Nguyên nhân | Cách xử lý |
|---|---|---|
| Không thể đăng nhập | Token hết hạn hoặc session lỗi | Đăng nhập lại và kiểm tra JWT refresh flow |
| Số lượng tồn kho không khớp | Stock import hoặc adjustment chưa đồng bộ | Kiểm tra inventory bookkeeping và order history |
| Doanh thu không đúng như kỳ vọng | Chi phí nhập hàng chưa trừ hoặc dữ liệu cũ | Xem revenue ledger chi tiết và kiểm tra ngày / giao dịch |
| Gói đã thanh toán nhưng chưa được kích hoạt | Chờ xác nhận từ Manager hoặc trạng thái chưa cập nhật | Kiểm tra trạng thái subscription và liên hệ Manager |
| Hóa đơn không hiển thị đúng | Dữ liệu hóa đơn / lịch sử không đồng bộ | Mở order history hoặc invoice history để đối chiếu |

---

## 6. Gợi ý sử dụng tốt hơn
- Kiểm tra dashboard mỗi ngày sau khi có đơn hàng mới hoặc có nhập kho.
- Theo dõi low-stock alerts để tránh thiếu hàng.
- Xem revenue ledger định kỳ để kiểm tra lợi nhuận thực tế sau khi trừ chi phí nhập hàng.
- Nếu phát hiện sai số lớn, nên đối chiếu audit log trước khi quyết định chỉnh sửa dữ liệu.
