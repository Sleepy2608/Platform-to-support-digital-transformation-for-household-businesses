# Danh Mục Tài Liệu Pháp Lý & Căn Cứ Tham Chiếu Chính Thống

> **Tài liệu tổng hợp các văn bản quy phạm pháp luật, quyết định và chính sách thuế chính thống áp dụng cho Nền tảng hỗ trợ chuyển đổi số hộ kinh doanh (áp dụng từ 2026)**

---

## 1. Bảng Tổng Hợp Phân Tầng Văn Bản Pháp Lý

| Mức độ | Văn bản pháp lý | Cơ quan ban hành / Số hiệu | Ngày hiệu lực | Phạm vi áp dụng trong đồ án | Link tra cứu chính thống |
| :---: | :--- | :--- | :---: | :--- | :--- |
| 🔴 **Core** | **Thông tư 88/2021/TT-BTC** | Bộ Tài chính | 01/01/2022 | Chế độ kế toán hộ kinh doanh: lập sổ S1-HKD, S2-HKD, S4-HKD, chứng từ kho & bán hàng | [Cổng TTĐT Chính phủ](https://vanban.chinhphu.vn/?docid=204329&pageid=27160) |
| 🔴 **Core** | **Quyết định 3389/QĐ-BTC** | Bộ Tài chính | 06/10/2025 | Đề án chuyển đổi mô hình quản lý thuế HKD: bỏ thuế khoán, tự khai tự nộp, tự động hóa từ dữ liệu bán hàng | [Bản PDF](https://cdn.haiphong.gov.vn/gov-hpg/6770/tintuc/2025/11/b3c1c4c9-c817-41b9-a7e8-f4b2c509e087-1-638979588602510210.pdf) / [Thư viện Pháp luật](https://thuvienphapluat.vn/phap-luat/ho-tro-phap-luat/toan-van-quyet-dinh-3389qdbtc-phe-duyet-de-an-chuyen-doi-mo-hinh-phuong-phap-quan-ly-thue-khi-bo-th-235689.html) |
| 🔴 **Core** | **Luật Thuế GTGT 48/2024/QH15** | Quốc hội | 01/07/2025 | Căn cứ tính thuế GTGT, đối tượng không chịu thuế, phương pháp tính trực tiếp trên doanh thu | [Cổng TTĐT Chính phủ](https://vanban.chinhphu.vn/?docid=212476&pageid=27160) |
| 🔴 **Core** | **Luật 149/2025/QH15** | Quốc hội | 01/01/2026 | Sửa đổi Luật Thuế GTGT: xác lập ngưỡng doanh thu không chịu thuế GTGT 500 triệu đồng áp dụng từ 2026 | [Cổng TTĐT Chính phủ](https://vanban.chinhphu.vn/?classid=1&docid=216588&pageid=27160&typegroupid=3) |
| 🔴 **Core** | **Luật Thuế TNCN 109/2025/QH15** | Quốc hội | 01/07/2026 | Căn cứ tính thuế TNCN của chủ hộ: phương pháp doanh thu vượt 500tr (0.5%) và phương pháp thu nhập tính thuế (15%, 17%, 20%) | [Cổng TTĐT Chính phủ](https://vanban.chinhphu.vn/?docid=216495&pageid=27160) |
| 🟠 **Quan trọng** | **Thông tư 94/2025/TT-BTC** | Bộ Tài chính | 2025 | Sửa đổi TT 80/2021 & TT 40/2021 về quy trình quản lý, kê khai thuế và mẫu biểu quản lý thuế HKD | [Cổng TTĐT Chính phủ](https://vanban.chinhphu.vn/?classid=1&docid=215644&orggroupid=4&pageid=27160) |
| 🟠 **Quan trọng** | **Nghị quyết 204/2025/QH15** & **Nghị định 174/2025/NĐ-CP** | Quốc hội / Chính phủ | 01/07/2025 | Chính sách và hướng dẫn giảm thuế GTGT; cơ sở thiết kế tính năng Tax Policy Versioning | [NQ 204 Cổng TTĐT](https://vanban.chinhphu.vn/?docid=214209&pageid=27160) / [NĐ 174 Cổng TTĐT](https://vanban.chinhphu.vn/?classid=1&docid=214310&pageid=27160) |
| 🟡 **Future** | **Luật Thuế TNDN 67/2025/QH15** | Quốc hội | 01/10/2025 | Thuế TNDN (Corporate Income Tax): Phạm vi mở rộng trong tương lai nếu platform hỗ trợ chuyển đổi lên Doanh nghiệp | [Cổng TTĐT Chính phủ](https://vanban.chinhphu.vn/?classid=1&docid=214607&pageid=27160&typ=) |
| 🟡 **Future** | **Luật Thuế TTĐB 66/2025/QH15** | Quốc hội | 01/01/2026 | Thuế Tiêu thụ đặc biệt: Phân loại hàng hóa đặc thù, thiết kế sẵn trong schema CSDL để cấu hình khi phát sinh | [Cổng TTĐT Chính phủ](https://vanban.chinhphu.vn/?docid=214598&pageid=27160) |

---

## 2. Cấu Trúc Thư Mục Tham Chiếu (References Directory Structure)

```
docs/compliance/references/
├── README.md                                    # Mục lục tổng quan và danh mục liên kết chính thống
├── 01-core-accounting-and-tax/                  # Nhóm tài liệu cốt lõi (Core)
│   ├── 88-btc.pdf                               # Bản PDF gốc Thông tư 88/2021/TT-BTC
│   ├── full-88-2021-BTC.md                      # Toàn văn Thông tư 88/2021/TT-BTC kèm hướng dẫn mẫu sổ
│   ├── summary-88-2021-BTC.md                   # Bản tóm tắt Thông tư 88/2021/TT-BTC
│   ├── circular-88-2021-TT-BTC.md               # Tóm lược chế độ kế toán Thông tư 88
│   ├── decision-3389-QD-BTC.md                  # Đề án chuyển đổi mô hình quản lý thuế HKD
│   ├── law-48-2024-QH15-vat.md                  # Luật Thuế Giá trị gia tăng 2024
│   ├── law-149-2025-QH15-vat-amendment.md       # Luật sửa đổi Thuế GTGT 2025 (Ngưỡng 500tr)
│   └── law-109-2025-QH15-pit.md                 # Luật Thuế Thu nhập cá nhân 2025
├── 02-tax-guidance-and-reductions/              # Nhóm hướng dẫn & quản lý thuế (Important)
│   ├── circular-94-2025-TT-BTC.md               # Thông tư hướng dẫn kê khai, quản lý thuế HKD
│   └── vat-reduction-policy.md                  # NQ 204/2025/QH15 & NĐ 174/2025/NĐ-CP về giảm thuế GTGT
└── 03-future-extensions/                        # Nhóm mở rộng tương lai (Future Scope)
    ├── law-67-2025-QH15-cit.md                  # Luật Thuế TNDN (Doanh nghiệp)
    └── law-66-2025-QH15-sct.md                  # Luật Thuế Tiêu thụ đặc biệt (Configurable)
```

---

## 3. Ý Nghĩa Đối Với Đồ Án & Báo Cáo Tốt Nghiệp

1. **Minh chứng học thuật chuẩn xác**: Thay vì chỉ dựa trên bảng tỷ lệ thuế đơn giản trong quá khứ, đồ án cập nhật toàn diện theo hệ thống văn bản pháp luật hiện hành áp dụng từ năm 2026.
2. **Khớp nối hoàn hảo với Quyết định 3389/QĐ-BTC**: Đề tài thể hiện xuất sắc định hướng chuyển đổi số của Bộ Tài chính: lấy dữ liệu giao dịch thực tế (bán hàng, kho hàng) $\to$ tự động tổng hợp S1, S2 $\to$ Tax Engine tính toán số thuế dự kiến $\to$ hỗ trợ chủ hộ kiểm tra, phê duyệt và lập sổ S4-HKD.
3. **Thiết kế CSDL linh hoạt (Extensible Schema)**: Căn cứ vào các văn bản trên để thiết kế các thực thể `tax_types`, `tax_activity_groups`, `tax_rules` có `effective_from`, `effective_to` giúp hệ thống không bị lỗi thời khi chính sách thuế có sự điều chỉnh.
