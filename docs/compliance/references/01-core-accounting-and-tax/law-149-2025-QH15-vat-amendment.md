# Luật Số 149/2025/QH15 — Sửa Đổi, Bổ Sung Một Số Điều Của Luật Thuế GTGT

- **Cơ quan ban hành**: Quốc hội khóa XV
- **Số hiệu**: 149/2025/QH15
- **Ngày thông qua**: 11/12/2025
- **Ngày có hiệu lực**: 01/01/2026
- **Nguồn chính thống**: [Cổng Thông Tin Điện Tử Chính Phủ](https://vanban.chinhphu.vn/?classid=1&docid=216588&pageid=27160&typegroupid=3)

---

## 1. Tóm Tắt Nội Dung Chính
Luật 149/2025/QH15 sửa đổi, bổ sung các quy định về chính sách thuế GTGT áp dụng từ năm 2026:
1. **Nâng mức ngưỡng không chịu thuế GTGT**: Nâng mức doanh thu không chịu thuế GTGT của hộ, cá nhân kinh doanh lên **500 triệu đồng/năm** (thay cho các ngưỡng cũ trước đây).
2. **Cơ chế áp dụng đối với HKD vượt ngưỡng**:
   - HKD có doanh thu trong năm từ 500 triệu đồng trở xuống: **Không chịu thuế GTGT**.
   - HKD có doanh thu trong năm trên 500 triệu đồng: Thực hiện tính và nộp thuế GTGT theo phương pháp tỷ lệ % trên doanh thu đối với toàn bộ doanh thu hoặc phần doanh thu theo quy định.

---

## 2. Ứng Dụng Trong Đồ Án
- Căn cứ then chốt để Tax Engine thiết lập bước **Check Annual Revenue Threshold**:
  - `revenue <= 500,000,000` $\implies$ `VAT = 0`, trạng thái `NOT_SUBJECT_TO_TAX`.
  - `revenue > 500,000,000` $\implies$ Tính thuế GTGT theo tỷ lệ ngành nghề (`1%` cho phân phối hàng hóa VLXD/kim khí).
