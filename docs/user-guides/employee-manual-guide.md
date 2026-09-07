# Hướng Dẫn Sử Dụng Hệ Thống — Vai Trò Nhân Viên Cửa Hàng (Employee Manual Guide)

| Thông tin | Nội dung |
|---|---|
| **Tài liệu** | Hướng Dẫn Sử Dụng Hệ Thống – Vai Trò Nhân Viên Cửa Hàng (Employee) |
| **Dự án** | Nền tảng Hỗ trợ Chuyển đổi Số cho Hộ Kinh doanh (HBDT Platform) |
| **Vai trò áp dụng** | Nhân viên cửa hàng / Thu ngân (`EMPLOYEE` / Store Staff) |
| **Phiên bản** | 1.0 — 07/09/2026 |
| **Cập nhật lần cuối** | 07/09/2026 |

---

## 1. Giới thiệu tổng quan

Tài liệu này hướng dẫn các thao tác thường nhật dành riêng cho **Nhân Viên Cửa Hàng / Thu Ngân (Employee)** trên Nền tảng HBDT Platform.

Nhân viên cửa hàng được Chủ hộ kinh doanh tạo tài khoản và phân quyền trực tiếp, chịu trách nhiệm chính trong các hoạt động: Bán hàng tại quầy (POS), Quét mã vạch, Tra cứu tồn kho sản phẩm, Tiếp nhận đơn đặt hàng, Áp dụng giảm giá và In hóa đơn thanh toán cho khách hàng.

---

## 2. Đăng nhập và Bắt đầu Ca làm việc

### 2.1 Đăng nhập hệ thống
1. Truy cập vào đường dẫn: `http://localhost:3000/login`.
2. Nhập **Tên đăng nhập / Số điện thoại** do Chủ hộ kinh doanh cấp.
3. Nhập **Mật khẩu** khởi tạo.
4. Nhấn nút **Đăng nhập**. Hệ thống chuyển trực tiếp vào màn hình **Bán Hàng POS**.

> [!NOTE]
> **Đổi mật khẩu ca đầu tiên:**
> Nhân viên nên bấm vào biểu tượng Avatar ở góc phải trên cùng và chọn **Đổi mật khẩu** để bảo mật tài khoản cá nhân trong ca làm việc.

---

## 3. Các thao tác Bán hàng & Thu ngân (POS)

### 3.1 Quy trình Bán hàng tại Quầy (Lập Hóa đơn Mới)

```text
[Tìm sản phẩm / Quét mã Barcode] ──> [Chọn số lượng] ──> [Chọn Khách hàng] 
                                                                 │
[In Hóa đơn & Giao hàng] <── [Xác nhận Thanh toán] <── [Chọn Phương thức TT]
```

#### Bước 1: Chọn sản phẩm vào giỏ hàng
Có 3 cách để thêm sản phẩm vào đơn hàng:
- **Cách 1 - Quét mã vạch (Khuyên dùng):** Dùng máy quét mã vạch chĩa vào mã Barcode/QR trên bao bì sản phẩm. Sản phẩm sẽ tự động nhảy vào giỏ với số lượng `+1`.
- **Cách 2 - Tìm kiếm theo tên/mã SKU:** Gõ tên mặt hàng (ví dụ: *Nước ngọt Coca Cola 330ml*) vào ô tìm kiếm nhanh và bấm chọn.
- **Cách 3 - Chọn từ danh mục trực quan:** Nhấp vào hình ảnh sản phẩm hiển thị trên màn hình cảm ứng POS.

#### Bước 2: Điều chỉnh số lượng và đơn giá
- Bấm dấu `+` hoặc `-` để tăng/giảm số lượng sản phẩm.
- Nhập trực tiếp số lượng nếu khách mua sỉ số lượng lớn (ví dụ: 50 gói).
- Hệ thống tự động tính thành tiền dựa trên quy tắc giá niêm yết của cửa hàng.

#### Bước 3: Nhập thông tin Khách hàng
- Nếu là khách vãng lai: Để mặc định **Khách lẻ**.
- Nếu là khách quen: Gõ số điện thoại vào ô tìm kiếm khách hàng. Nếu chưa có thông tin, bấm **+ Thêm khách hàng nhanh** (chỉ cần nhập Tên + Số điện thoại).

#### Bước 4: Thanh toán và Xuất hóa đơn
1. Chọn phương thức thanh toán khách lựa chọn:
   - **Tiền mặt:** Nhập số tiền khách đưa, hệ thống tự tính số tiền thừa trả lại khách.
   - **Chuyển khoản VietQR:** Màn hình tự động sinh mã VietQR động kèm chính xác số tiền và nội dung thanh toán để khách quét qua App Ngân hàng.
   - **Ví điện tử:** Quét mã MoMo / ZaloPay.
   - **Ghi nợ (Khách nợ):** Chỉ áp dụng khi có sự đồng ý của Chủ hộ, số tiền nợ sẽ ghi nhận vào Sổ nợ của khách hàng.
2. Nhấn **Hoàn tất thanh toán**: Hệ thống tự động trừ tồn kho và gửi lệnh in ra máy in hóa đơn nhiệt (Bill 80mm / 58mm).

---

### 3.2 Lập đơn hàng bằng Trợ lý Giọng nói AI (Smart AI Order)
Khi bán hàng bận rộn hoặc tiếp nhận đơn hàng qua điện thoại/tin nhắn:
1. Bấm vào nút **Micro / Trợ lý AI** trên giao diện POS.
2. Đọc rõ nội dung đơn hàng:
   - *Ví dụ: "Lấy 3 chai dầu ăn Neptune 1 lít và 2 bao đường Biên Hòa 1kg cho cô Lan"*
3. Hệ thống AI tự động phân tích và đưa chính xác các sản phẩm vào giỏ hàng.
4. Nhân viên đối soát lại màn hình và bấm **Thanh toán**.

---

### 3.3 Tra cứu Nhanh Giá và Tồn kho Sản phẩm
1. Nhấn phím tắt `F2` hoặc chọn tab **Tra cứu sản phẩm**.
2. Tìm kiếm tên sản phẩm.
3. Màn hình hiển thị: Tên hàng, Đơn vị tính, Giá bán niêm yết, Vị trí kệ hàng và **Số lượng tồn kho thực tế**.
4. Nếu sản phẩm hiển thị nhãn đỏ **"Hết hàng"** hoặc **"Sắp hết"**, nhân viên kịp thời báo lại cho Chủ hộ kinh doanh để nhập bổ sung.

---

### 3.4 Xem Lịch sử Đơn hàng trong Ca làm việc
1. Vào menu **Lịch sử đơn hàng**.
2. Nhân viên có thể xem lại tất cả các đơn hàng do chính mình lập trong ngày.
3. Thao tác hỗ trợ:
   - **In lại hóa đơn:** Dành cho khách hàng làm mất hóa đơn cần in lại.
   - **Yêu cầu hủy đơn / Đổi trả hàng:** Nếu khách trả lại hàng, nhân viên lập phiếu yêu cầu hoàn trả để Chủ hộ phê duyệt hoàn tiền.

---

## 4. Những điều Nhân viên Cần Lưu ý & Giới hạn Quyền hạn

| Tính năng | Nhân viên có thể làm | Giới hạn quyền hạn |
|---|---|---|
| **Bán hàng & Thu ngân** | ✅ Quét mã, chọn hàng, in hóa đơn | ❌ Không được tự ý sửa giá bán gốc của sản phẩm |
| **Tồn kho** | ✅ Tra cứu số lượng tồn trong kho | ❌ Không được xóa sản phẩm hoặc chỉnh sửa số lượng tồn thủ công |
| **Báo cáo** | ✅ Xem tổng tiền bán trong ca của mình | ❌ Không được truy cập Báo cáo doanh thu tổng và Sổ sách thuế TT88 của Hộ kinh doanh |
| **Quản trị** | ✅ Đổi mật khẩu của chính mình | ❌ Không được tạo hoặc xóa tài khoản nhân viên khác |

---

## 5. Xử lý Tình huống Sự cố Thường gặp

| Tình huống | Cách xử lý |
|---|---|
| Quét mã vạch máy tít nhưng không ra sản phẩm | Mã vạch sản phẩm này chưa được Chủ hộ khai báo trong kho. Gõ tìm kiếm thủ công bằng tên và báo Chủ hộ cập nhật mã SKU/Barcode sau |
| Khách quét mã VietQR thành công nhưng hệ thống chưa nhảy "Đã thanh toán" | Yêu cầu khách cho xem màn hình thông báo chuyển tiền thành công trên App Ngân hàng, đối soát đúng số tiền và bấm "Xác nhận đã nhận tiền mặt/chuyển khoản" |
| Máy in hóa đơn không in ra bill | Kiểm tra cáp kết nối USB máy in nhiệt, kiểm tra giấy in hóa đơn có bị hết hoặc kẹt giấy hay không |
| Nhập nhầm số lượng hàng cho khách | Nếu chưa thanh toán: Bấm icon thùng rác để xóa dòng sản phẩm hoặc bấm `-` để giảm. Nếu đã in bill: Báo Chủ hộ lập phiếu hủy đơn hàng |
