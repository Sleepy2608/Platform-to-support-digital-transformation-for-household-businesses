# Chính Sách Giảm Thuế GTGT: Nghị Quyết 204/2025/QH15 & Nghị Định 174/2025/NĐ-CP

- **Nghị quyết 204/2025/QH15**:
  - Cơ quan ban hành: Quốc hội khóa XV
  - Ngày ban hành: 17/06/2025
  - Ngày có hiệu lực: 01/07/2025
  - Nguồn chính thống: [Cổng Thông Tin Điện Tử Chính Phủ](https://vanban.chinhphu.vn/?docid=214209&pageid=27160)
- **Nghị định 174/2025/NĐ-CP**:
  - Cơ quan ban hành: Chính phủ
  - Ngày ban hành: 2025
  - Nguồn chính thống: [Cổng Thông Tin Điện Tử Chính Phủ](https://vanban.chinhphu.vn/?classid=1&docid=214310&pageid=27160)

---

## 1. Tóm Tắt Nội Dung Chính
Quy định về việc giảm thuế giá trị gia tăng đối với các nhóm hàng hóa, dịch vụ theo từng thời kỳ hỗ trợ phục hồi kinh tế:
1. Quy định các nhóm ngành hàng được áp dụng chính sách giảm mức tỷ lệ % để tính thuế GTGT (giảm 20% mức tỷ lệ % tính thuế GTGT khi xuất hóa đơn đối với hộ, cá nhân kinh doanh).
2. Quy định rõ ràng về hiệu lực thời gian áp dụng chính sách giảm thuế.

---

## 2. Ứng Dụng Trong Đồ Án: Tính Năng Tax Policy Versioning
- Chính sách giảm thuế theo thời kỳ chứng minh tính cấp thiết của thiết kế **Quản lý phiên bản quy tắc thuế theo thời gian (Tax Rule Versioning)** trong đồ án:
  - Hệ thống không được hard-code thuế suất cố định trong code.
  - Khi chính sách thuế thay đổi (ví dụ: giai đoạn giảm thuế hoặc hết hạn giảm thuế), Administrator chỉ cần cập nhật `tax_rules` với `effective_from` và `effective_to`.
  - Các đơn hàng và giao dịch trong quá khứ tiếp tục giữ nguyên mức thuế suất áp dụng tại thời điểm giao dịch phát sinh.
