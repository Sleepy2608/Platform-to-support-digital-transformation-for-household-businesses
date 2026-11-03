# 📚 TỔNG HỢP TOÀN BỘ TÀI LIỆU DỰ ÁN HBDT (MASTER DOCUMENTATION INDEX)

> **Dự án:** Nền tảng Hỗ trợ Chuyển đổi Số cho Hộ Kinh doanh (Platform to Support Digital Transformation for Household Businesses - HBDT)  
> **Phiên bản tài liệu:** 2.5 (Hoàn thiện toàn diện)  
> **Ngày cập nhật:** 04/11/2026  
> **Trạng thái:** 13/13 Epic hoàn thành (100% `Done`), 45/45 Test Cases thông qua (`Passed`).

---

## 1. Giới thiệu Tổng quan Thư mục Tài liệu (`docs/`)

Thư mục `docs/` lưu trữ toàn bộ hệ thống tài liệu kỹ thuật, nghiệp vụ, pháp lý kế toán và hướng dẫn vận hành của đồ án **HBDT Platform**. Toàn bộ tài liệu được xây dựng chuẩn mực theo quy trình phát triển phần mềm chuyên nghiệp (từ khảo sát yêu cầu, đặc tả SRS, thiết kế kiến trúc ADD/DDD, triển khai, kiểm thử đến hướng dẫn sử dụng và báo cáo tổng kết).

```
docs/
├── 📋 Yêu cầu & Nghiệp vụ      : requirements/, user-requirements/, software-requirement-specification/
├── 🏛️ Kiến trúc & Thiết kế      : architecture-design/, detailed-design/, workflows/
├── ⚖️ Pháp lý & Kế toán TT88    : compliance/
├── 🤖 Trợ lý thông minh AI       : ai-design/
├── 🛠️ Cài đặt & Vận hành        : installation-guide/, run-guide/
├── 🧪 Kiểm thử & Chất lượng      : testing-documents/
├── 👥 Hướng dẫn sử dụng         : user-guides/
├── 📈 Tiến độ & Tính năng        : project-progress-and-feature/
└── 🎓 Báo cáo tổng kết          : final-report/
```

---

## 2. Bản đồ Tra cứu Nhanh theo Đối tượng Độc giả

| Đối tượng | Tài liệu khuyến nghị đọc trước | Mục tiêu |
| :--- | :--- | :--- |
| **Giảng viên / Hội đồng đánh giá** | 1. [Báo cáo tổng hợp](final-report/bao-cao-tong-hop.md)<br>2. [Phân công nhiệm vụ nhóm](final-report/phan-cong-nhiem-vu-nhom.md)<br>3. [Đặc tả SRS](software-requirement-specification/software-requirement-specification.md) | Nắm trọn bối cảnh, kết quả đạt được, tính tuân thủ pháp lý và đóng góp của từng thành viên. |
| **Lập trình viên / AI Developer** | 1. [Thiết kế kiến trúc ADD](architecture-design/architecture-design-document.md)<br>2. [Thiết kế chi tiết & DB](detailed-design/detailed-design.md)<br>3. [Quy chuẩn cài đặt](installation-guide/installation-guide.md)<br>4. [Graphify Knowledge Base](../.graphify/README.md) | Hiểu cấu trúc mã nguồn, luồng API, mô hình DB 40+ thực thể và phân hệ AI/SePay. |
| **Chuyên viên Kế toán / Thuế** | 1. [Ánh xạ Luật vào phần mềm](compliance/mapping-law-to-project.md)<br>2. [Thông tư 88/2021/TT-BTC](compliance/circular-88-2021-BTC.md)<br>3. [Chính sách thuế 2026](compliance/tax-policy-2026.md) | Thẩm định tính chính xác của sổ S1, S2, S4 và cơ chế tính thuế GTGT/TNCN tự động. |
| **Người dùng / Chủ hộ kinh doanh** | 1. [Cẩm nang Chủ hộ kinh doanh](user-guides/owner-manual-guide.md)<br>2. [Hướng dẫn Nhân viên bán hàng](user-guides/employee-manual-guide.md) | Làm quen với giao diện bán hàng nhanh (POS), quản lý kho, đổi gói và thanh toán SePay. |

---

## 3. Mục lục Chi tiết Toàn bộ Tài liệu theo Chuyên mục

### 3.1. Phân tích Yêu cầu & Nghiệp vụ Đề tài

| Thư mục / Tài liệu | Phiên bản | Nội dung cốt lõi |
| :--- | :---: | :--- |
| [requirements/detailed-topic-requirements.md](requirements/detailed-topic-requirements.md) | v1.1 | Phân tích bài toán thực tế của hộ kinh doanh cá thể Nhóm 1 & Nhóm 2 theo Quyết định 3389/QĐ-BTC, nỗi đau quản lý thủ công bằng sổ tay. |
| [requirements/topic-requirements.txt](requirements/topic-requirements.txt) | v1.0 | Đề cương yêu cầu gốc của đề tài môn học Lập trình Java. |
| [user-requirements/user-requirements.md](user-requirements/user-requirements.md) | v1.3 | Hệ thống User Stories và ma trận yêu cầu chức năng theo 4 vai trò (Owner, Employee, Manager, Admin). |
| [software-requirement-specification/software-requirement-specification.md](software-requirement-specification/software-requirement-specification.md) | **v1.4** | **Tài liệu Đặc tả Yêu cầu Phần mềm (SRS)** chuẩn IEEE 830: 13 phân hệ chức năng, yêu cầu phi chức năng (NFR), tích hợp cổng thanh toán SePay, AI OCR/NLP và ma trận truy vết (Traceability Matrix). |

---

### 3.2. Thiết kế Kiến trúc & Thiết kế Chi tiết Hệ thống

| Thư mục / Tài liệu | Phiên bản | Nội dung cốt lõi |
| :--- | :---: | :--- |
| [architecture-design/architecture-design-document.md](architecture-design/architecture-design-document.md) | **v2.3** | **Tài liệu Thiết kế Kiến trúc (ADD)**: Kiến trúc 3 tầng (Next.js 16 + Spring Boot 3.3 + MySQL 8.0) kết hợp AI Microservice (Python FastAPI), cô lập dữ liệu hộ kinh doanh (Multi-tenancy isolation), bảo mật JWT & RBAC, giải pháp Webhook SePay chịu lỗi cao. |
| [detailed-design/detailed-design.md](detailed-design/detailed-design.md) | **v2.4** | **Thiết kế Chi tiết Hệ thống (DDD)**: Cấu trúc chi tiết 25+ package Spring Boot, Class Diagram, xử lý ngoại lệ tập trung, phân hệ thanh toán SePay (`SepayWebhookService`), cơ chế Polling Realtime không cache. |
| [detailed-design/database-design.md](detailed-design/database-design.md) | v2.2 | Thiết kế cơ sở dữ liệu quan hệ MySQL: 40+ JPA Entities & Enums, từ điển dữ liệu (Data Dictionary), chiến lược Index và khóa ngoại. |
| [detailed-design/diagrams/erd-overall.png](detailed-design/diagrams/erd-overall.png) | v2.0 | Sơ đồ thực thể liên kết (ERD) trực quan toàn bộ hệ thống. |
| [workflows/workflow.md](workflows/workflow.md) | v1.2 | Sơ đồ luồng nghiệp vụ chi tiết: Bán hàng nhanh POS tại quầy, Cảnh báo cạn kho, Theo dõi và trả nợ từng phần, Vòng đời gói SaaS và gia hạn tự động qua SePay. |

---

### 3.3. Pháp lý Kế toán & Tuân thủ Thông tư 88/2021/TT-BTC

| Thư mục / Tài liệu | Phiên bản | Nội dung cốt lõi |
| :--- | :---: | :--- |
| [compliance/circular-88-2021-BTC.md](compliance/circular-88-2021-BTC.md) | v1.0 | Trích xuất toàn văn quy định Chế độ kế toán cho hộ kinh doanh, cá nhân kinh doanh theo Thông tư số 88/2021/TT-BTC của Bộ Tài chính. |
| [compliance/decision-3389-BTC.md](compliance/decision-3389-BTC.md) | v1.0 | Phân loại hộ kinh doanh theo Quyết định 3389/QĐ-BTC (2025). |
| [compliance/mapping-law-to-project.md](compliance/mapping-law-to-project.md) | v1.2 | **Bảng đối soát Ánh xạ Pháp lý vào Mã nguồn**: Liên kết trực tiếp giữa các điều khoản TT88 với các trường trong Database và phương thức tính toán sổ S1, S2, S4. |
| [compliance/tax-policy-2026.md](compliance/tax-policy-2026.md) | v1.0 | Cập nhật chính sách thuế GTGT & TNCN năm 2026 đối với từng nhóm ngành nghề kinh doanh. |
| [compliance/templates/books/](compliance/templates/books/) | Gốc BTC | Thư mục lưu trữ các file Excel mẫu chuẩn: S1 (Sổ doanh thu), S2 (Sổ chi phí), S4 (Sổ kho) theo quy định của Bộ Tài chính. |
| [compliance/references/](compliance/references/) | v1.0 | Thư mục tài liệu văn bản quy phạm pháp luật đối chiếu. |

---

### 3.4. Phân hệ Trợ lý Thông minh (AI Smart Assistant)

| Thư mục / Tài liệu | Phiên bản | Nội dung cốt lõi |
| :--- | :---: | :--- |
| [ai-design/ai-pipeline-spec.md](ai-design/ai-pipeline-spec.md) | v1.1 | Đặc tả đường ống xử lý AI (AI Pipeline): Quy trình OCR hình ảnh hóa đơn viết tay, NLP trích xuất đơn hàng từ tin nhắn tự nhiên. |
| [ai-design/ai-service-guide.md](ai-design/ai-service-guide.md) | v1.2 | Hướng dẫn phát triển và cấu hình Microservice Python FastAPI, cơ chế xác thực nội bộ qua header `X-API-Secret`. |
| [ai-design/prompt-templates.md](ai-design/prompt-templates.md) | v1.0 | Bộ mẫu Prompt tối ưu hóa độ chính xác trích xuất cho các mô hình ngôn ngữ lớn (LLM - B.ai / Gemini / Qwen). |
| [ai-design/bookkeeping-guide.md](ai-design/bookkeeping-guide.md) | v1.1 | Hướng dẫn ứng dụng AI hỗ trợ tự động phân loại chi phí và ghi chép sổ kế toán. |

---

### 3.5. Cài đặt, Cấu hình Môi trường & Khởi chạy

| Thư mục / Tài liệu | Phiên bản | Nội dung cốt lõi |
| :--- | :---: | :--- |
| [installation-guide/installation-guide.md](installation-guide/installation-guide.md) | **v1.4** | **Hướng dẫn Cài đặt Toàn diện Hệ thống**: Yêu cầu tiên quyết (Java 21, Node 20+, Python 3.12, MySQL 8.0), cấu hình file `.env`, triển khai Docker Compose, tích hợp SePay Webhook và bộ giải pháp khắc phục sự cố (Troubleshooting). |
| [run-guide/run-guide-on-intellij.md](run-guide/run-guide-on-intellij.md) | v1.2 | Hướng dẫn từng bước cấu hình IntelliJ IDEA, kích hoạt Lombok Annotation Processing và khởi chạy Spring Boot. |
| [run-guide/run-guide-on-vscode.txt](run-guide/run-guide-on-vscode.txt) | v1.0 | Hướng dẫn cấu hình Visual Studio Code để phát triển và debug giao diện Next.js TypeScript. |

---

### 3.6. Hiện thực hóa Hệ thống, Kiểm thử & Đảm bảo Chất lượng

| Thư mục / Tài liệu | Phiên bản | Nội dung cốt lõi |
| :--- | :---: | :--- |
| [system-implementation/system-implementation.md](system-implementation/system-implementation.md) | **v1.2** | Tài liệu Hiện thực hóa Hệ thống: Công nghệ sử dụng, giải pháp kỹ thuật, cơ chế Idempotency chống trừ trùng lặp, xác thực STK ngân hàng và kiến trúc Webhook SePay. |
| [testing-documents/test-cases.md](testing-documents/test-cases.md) | **v1.4** | **Bộ 45 Test Cases Hệ thống**: Bao phủ toàn bộ 13 module chức năng, bao gồm TC45 (Tự động kích hoạt & gia hạn gói qua SePay Webhook). Kết quả: **45/45 Passed (100%)**. |
| [testing-documents/hbdt-system-test-cases.xlsx](testing-documents/hbdt-system-test-cases.xlsx) | v1.4 | File Excel bảng kiểm thử chi tiết phục vụ nghiệm thu và đánh giá. |

---

### 3.7. Cẩm nang Hướng dẫn Sử dụng (User Manual Guides)

| Thư mục / Tài liệu | Phiên bản | Nội dung cốt lõi |
| :--- | :---: | :--- |
| [user-guides/README.md](user-guides/README.md) | v1.0 | Tổng quan và hướng dẫn phân vai trò người dùng trong hệ thống. |
| [user-guides/owner-manual-guide.md](user-guides/owner-manual-guide.md) | **v1.5** | **Cẩm nang Chủ hộ kinh doanh**: Đăng ký, thiết lập cửa hàng, chọn gói cước và quét mã VietQR SePay, sử dụng POS bán hàng nhanh, quản lý tồn kho & cảnh báo cạn hàng, theo dõi sổ nợ khách hàng và xuất báo cáo kế toán TT88. |
| [user-guides/employee-manual-guide.md](user-guides/employee-manual-guide.md) | v1.2 | Sổ tay Nhân viên bán hàng: Thao tác giao diện POS Fast Sales, tạo đơn trong ca, in hóa đơn và tra cứu số lượng tồn kho. |
| [user-guides/manager-manual-guide.md](user-guides/manager-manual-guide.md) | v1.1 | Hướng dẫn Quản lý / Kế toán: Giám sát hồ sơ hộ kinh doanh, đối soát hóa đơn dịch vụ hệ thống và tiếp nhận hỗ trợ. |
| [user-guides/admin-manual-guide.md](user-guides/admin-manual-guide.md) | v1.2 | Hướng dẫn Quản trị viên: Quản lý người dùng, cấu hình gói cước SaaS, cấp phát Bypass Key thử nghiệm và quản lý mẫu biểu kế toán. |

---

### 3.8. Báo cáo Tiến độ, Danh mục Tính năng & Báo cáo Tổng kết

| Thư mục / Tài liệu | Phiên bản | Nội dung cốt lõi |
| :--- | :---: | :--- |
| [final-report/bao-cao-tong-hop.md](final-report/bao-cao-tong-hop.md) | **v2.0** | **Báo cáo Tổng kết Đồ án Toàn diện** (680+ dòng): Bối cảnh đề tài, kiến trúc công nghệ, báo cáo chi tiết 13 module, kết quả kiểm thử, hướng dẫn chạy và đánh giá kết quả đạt được. |
| [final-report/phan-cong-nhiem-vu-nhom.md](final-report/phan-cong-nhiem-vu-nhom.md) | v2.0 | Bảng phân công chi tiết vai trò, trách nhiệm và tỷ lệ đóng góp của các thành viên trong nhóm phát triển. |
| [project-progress-and-feature/project-progress.md](project-progress-and-feature/project-progress.md) | v1.4 | Nhật ký tiến độ phát triển qua các Sprint, danh sách các issue/ticket Jira đã hoàn thành. |
| [project-progress-and-feature/feature.md](project-progress-and-feature/feature.md) | v1.3 | Danh mục tổng hợp tính năng phần mềm và ma trận phân quyền tính năng theo gói cước (Free, Standard, VIP). |

---

## 4. Các Điểm Nổi bật & Cập nhật Quan trọng Nhất (Tháng 11/2026)

1. **Cổng thanh toán tự động SePay:**
   - Hoàn thiện luồng tự động 100%: Quét mã VietQR ➔ SePay gửi Webhook ➔ Backend kích hoạt gói `ACTIVE` và gia hạn ngày sử dụng tức thì ➔ Frontend Polling tự động đóng modal thành công.
   - Cơ chế chịu lỗi cao: Luôn trả về HTTP `200 OK` cho SePay để tránh gửi lại 7 lần (retry storm), kiểm tra số tài khoản thụ hưởng (`107882760609`), chống trùng lặp giao dịch (Idempotency) và tự động tạo mới `Subscription` nếu hộ kinh doanh đăng ký lần đầu.
2. **Tuân thủ Chế độ Kế toán Thông tư 88/2021/TT-BTC:**
   - Tự động sinh sổ Doanh thu (S1), Sổ chi phí (S2), Sổ kho (S4) chuẩn định dạng Excel của Bộ Tài chính từ dữ liệu bán hàng thực tế.
3. **Trợ lý thông minh AI:**
   - Microservice Python FastAPI hỗ trợ nhận diện và trích xuất đơn hàng từ văn bản/ảnh/tin nhắn qua giao thức bảo mật `X-API-Secret`.
4. **Hệ thống Tri thức Graphify (GraphRAG):**
   - Lưu trữ tại thư mục [`.graphify/`](../.graphify/README.md) gồm **5.003 nodes** và **17.929 edges**, cung cấp bản đồ kiến trúc toàn diện hỗ trợ AI và lập trình viên tra cứu mã nguồn tức thì.

---
*Tài liệu được quản lý tập trung và đồng bộ hóa với toàn bộ mã nguồn của dự án HBDT Platform.*

