# Tự động tổng hợp sổ sách và báo cáo quản trị

## Nguyên tắc

Phần kế toán không dùng mô hình AI để tính tiền. Backend tổng hợp trực tiếp từ dữ liệu giao dịch đã xác nhận để kết quả có thể kiểm tra và truy vết:

- Đơn bán hàng `CONFIRMED` tạo các dòng sổ doanh thu. Hủy đơn chuyển các dòng liên quan sang `CANCELLED`.
- Phiếu nhập kho chỉ được tính khi ở trạng thái `CONFIRMED`.
- Công nợ được tính từ các giao dịch `DEBT_INCREASE`, `PAYMENT`, `VOID` và `ADJUSTMENT` đang hoạt động.
- Thay đổi khoảng ngày hoặc từ khóa sẽ tính lại báo cáo từ dữ liệu nguồn.

AI hỗ trợ hai việc: tạo đơn nháp từ câu tiếng Việt và viết nhận xét cho báo cáo từ các tổng số do backend cung cấp. AI không tự tính lại tiền, tự hạch toán hoặc tự xác nhận báo cáo. Người dùng vẫn phải kiểm tra và xác nhận đơn; bước xác nhận này mới làm phát sinh sổ sách.

Phiên bản hiện tại chỉ nhận văn bản. Voice-to-text không nằm trong phạm vi triển khai.

## Các màn hình

Owner và Employee vào mục **Doanh thu** để xem:

1. **Doanh thu bán hàng**: sổ chi tiết theo từng mặt hàng của đơn đã xác nhận, tham chiếu mẫu S1-HKD của Thông tư 88/2021/TT-BTC.
2. **Tiền nhập kho**: các phiếu nhập đã xác nhận và tổng giá trị nhập hàng trong kỳ.
3. **Công nợ**: dư đầu kỳ, nợ phát sinh, tiền đã thu, điều chỉnh và dư cuối kỳ theo từng khách hàng.
4. **Hoạt động kinh doanh**: doanh thu, tiền thu, công nợ, giá trị nhập hàng và dòng tiền hoạt động.

Trong tab **Hoạt động kinh doanh**, Owner có thể yêu cầu AI tạo nhận xét, sau đó **Xác nhận báo cáo** hoặc **Yêu cầu chỉnh sửa** kèm lý do. Employee được xem báo cáo nhưng không có quyền duyệt. Kết quả kiểm tra được lưu theo kỳ và theo dấu vân tay dữ liệu. Khi các tổng số của kỳ thay đổi, bản báo cáo mới quay lại trạng thái `DRAFT` để được kiểm tra lại.

Tính năng AI dùng entitlement `AI_ASSISTANT`. Mặc định gói VIP có quyền; Employee dùng quyền của gói mà cửa hàng đang đăng ký. Với cơ sở dữ liệu đã có, Admin cần kiểm tra ma trận gói - tính năng vì seeder giữ nguyên cấu hình đã tùy chỉnh.

“Báo cáo công nợ” và “Báo cáo hoạt động kinh doanh” là báo cáo quản trị của hệ thống, không phải tên biểu mẫu chính thức trong Thông tư 88. Dòng tiền hoạt động cũng không phải lợi nhuận kế toán vì chưa bao gồm đầy đủ giá vốn hàng đã bán và các chi phí vận hành.

## Kiểm tra nhanh

1. Tạo và xác nhận một đơn đã thanh toán đủ; kiểm tra đơn xuất hiện trong tab **Doanh thu bán hàng**.
2. Tạo một đơn còn nợ và chọn khách hàng; kiểm tra tab **Công nợ** tăng phần nợ phát sinh và dư cuối kỳ.
3. Ghi nhận khách trả nợ; kiểm tra phần đã thu tăng và dư cuối kỳ giảm.
4. Tạo rồi xác nhận phiếu nhập kho; kiểm tra tab **Tiền nhập kho** và **Hoạt động kinh doanh**.
5. Hủy một đơn; kiểm tra doanh thu và công nợ liên quan được đảo khỏi số đang hoạt động.
6. Nhập một câu đặt hàng ở trang tạo đơn; kiểm tra đơn xuất hiện trong **Đơn nháp đang chờ duyệt** và tài khoản Owner/Employee khác nhận thông báo thời gian thực.
7. Chỉnh sửa giỏ rồi xác nhận; kiểm tra đơn nháp chuyển sang `CONFIRMED`. Tạo một nháp khác và từ chối kèm lý do; kiểm tra nháp không còn trong danh sách chờ.
8. Ở tab **Hoạt động kinh doanh**, dùng **Tạo nhận xét bằng AI**, đối chiếu nhận xét với số liệu rồi thử xác nhận hoặc yêu cầu chỉnh sửa bằng tài khoản Owner.

## Phiên bản pháp lý

Đồ án yêu cầu tham chiếu Thông tư 88/2021/TT-BTC nên giao diện ghi rõ phạm vi S1-HKD. Trong môi trường sử dụng thực tế từ ngày 01/01/2026, cần cập nhật bộ mẫu theo Thông tư 152/2025/TT-BTC, văn bản đã thay thế Thông tư 88.
