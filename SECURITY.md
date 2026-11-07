# Security Policy

> **Dự án:** Nền tảng Hỗ trợ Chuyển đổi Số cho Hộ Kinh doanh (HBDT Platform)  
> **Áp dụng cho:** Toàn bộ hệ thống mã nguồn gồm Backend (Spring Boot), Frontend (Next.js), AI Microservice (FastAPI) và Cơ sở dữ liệu.  
> **Nguyên tắc cốt lõi:** Công bố có trách nhiệm (Coordinated Vulnerability Disclosure) nhằm bảo vệ toàn vẹn dữ liệu kinh doanh và sổ sách kế toán của hộ kinh doanh.

---

## Supported Versions

Dự án chỉ cung cấp các bản vá bảo mật và hỗ trợ kỹ thuật cho các phiên bản đang được duy trì tích cực trên các nhánh chính thức (`main` và `develop`):

| Phân hệ / Nền tảng | Phiên bản khuyến nghị | Trạng thái bảo mật |
| :--- | :---: | :---: |
| **Spring Boot Backend** | `3.3.x` (Java 21 LTS) | :white_check_mark: Được hỗ trợ tích cực |
| **Next.js Frontend** | `16.x` (React 19) | :white_check_mark: Được hỗ trợ tích cực |
| **Python AI Microservice** | `FastAPI` (Python 3.12) | :white_check_mark: Được hỗ trợ tích cực |
| **MySQL Database** | `8.0+` | :white_check_mark: Được hỗ trợ tích cực |
| **Các phiên bản tiền phát hành / Nhánh cũ** | `< 1.0` | :x: Không hỗ trợ |

---

## Reporting a Vulnerability

Nếu bạn phát hiện một vấn đề hoặc lỗ hổng bảo mật trong hệ thống HBDT Platform, **vui lòng không mở Public Issue, Discussion hoặc Pull Request công khai trên GitHub**. Báo cáo công khai có thể khiến dữ liệu của người dùng bị đe dọa trước khi nhóm kịp phát hành bản vá.

### Kênh tiếp nhận an toàn

Bạn có thể gửi báo cáo bảo mật qua một trong hai hình thức bảo mật sau:

1. **GitHub Private Vulnerability Reporting (Khuyến nghị):**
   * Truy cập tab [Security > Advisories](https://github.com/Sleepy2608/Platform-to-support-digital-transformation-for-household-businesses/security/advisories) của kho mã nguồn.
   * Chọn **Report a vulnerability** để mở kênh trao đổi riêng tư trực tiếp với nhóm phát triển.

2. **Email trực tiếp tới Ban Điều phối (Team Leader):**
   * **Địa chỉ:** `huytamnguyenle2608@gmail.com`
   * **Tiêu đề email:** `[SECURITY VULNERABILITY] - HBDT Platform - <Tên lỗ hổng>`

### Thông tin cần cung cấp trong báo cáo

Để giúp nhóm xác minh và xử lý nhanh chóng, vui lòng cung cấp:

* **Loại lỗ hổng:** (ví dụ: SQL Injection, Broken Authentication, IDOR, Webhook Spoofing, Sensitive Data Exposure, v.v.).
* **Phân hệ bị ảnh hưởng:** Backend API, Frontend Client, AI Service hoặc Database.
* **Các bước tái hiện (Steps to Reproduce):** Hướng dẫn từng bước cụ thể, curl command hoặc kịch bản request.
* **Bằng chứng khái niệm (Proof of Concept - PoC):** Ảnh chụp màn hình, payload mẫu hoặc log phản hồi (đã che các thông tin nhạy cảm thực tế).
* **Đánh giá tác động (Impact Analysis):** Kẻ tấn công có thể làm gì và dữ liệu nào có nguy cơ bị xâm phạm.

---

## Response & Patching SLA

Nhóm cam kết phản hồi và xử lý các báo cáo bảo mật theo khung thời gian cụ thể:

* **Tiếp nhận & Xác nhận ban đầu:** Trong vòng **24 - 48 giờ** kể từ khi nhận báo cáo.
* **Đánh giá mức độ ảnh hưởng & Tái hiện:** Trong vòng **72 giờ**.
* **Phát hành bản vá (Hotfix):** 
  * *Mức độ Nghiêm trọng / Khẩn cấp (Critical / High):* **1 - 3 ngày làm việc**.
  * *Mức độ Trung bình / Thấp (Medium / Low):* **3 - 7 ngày làm việc**.
* **Công bố công khai (Public Disclosure):** Chỉ sau khi bản vá đã được kiểm thử, merge vào nhánh chính và thông báo tới người báo cáo.

---

## Security Architecture & Defenses

Hệ thống HBDT Platform được thiết kế với các tầng bảo vệ kỹ thuật cụ thể:

1. **Mã hóa mật khẩu & Dữ liệu nhạy cảm:**
   * Mật khẩu người dùng được băm bằng thuật toán **BCrypt** kết hợp Salt ngẫu nhiên trước khi lưu trữ vào cơ sở dữ liệu.
   * Dữ liệu cấu hình, secret key và token bên thứ ba được nạp thông qua biến môi trường (`.env`), không commit vào kho mã nguồn.

2. **Xác thực & Phân quyền đa cấp (RBAC):**
   * Quản lý phiên làm việc không trạng thái (stateless) qua **JWT (JSON Web Token)** với thời gian sống ngắn, kết hợp cơ chế xoay vòng Refresh Token.
   * Phân quyền nghiêm ngặt theo 4 vai trò: `OWNER` (Chủ hộ), `MANAGER` (Quản lý), `EMPLOYEE` (Nhân viên), và `ADMIN` (Quản trị hệ thống).

3. **Cô lập dữ liệu đa người thuê (Multi-Tenancy Isolation):**
   * Mọi truy vấn dữ liệu nghiệp vụ (hóa đơn, đơn hàng, tồn kho, đối tác, sổ sách kế toán) đều bắt buộc lọc theo ngữ cảnh `businessId` của hộ kinh doanh hiện tại, ngăn chặn triệt để lỗ hổng truy cập chéo tài nguyên (IDOR).

4. **Bảo vệ tích hợp Thanh toán & Webhook (SePay Integration):**
   * Endpoint tiếp nhận Webhook thanh toán yêu cầu xác thực API Key qua header `Authorization: Apikey <SECRET>`.
   * Kiểm tra số tài khoản ngân hàng thụ hưởng (`107882760609`) và áp dụng cơ chế **Idempotency** thông qua mã giao dịch `referenceCode` nhằm ngăn chặn các cuộc tấn công gửi lại (Replay Attacks).

5. **Giao tiếp nội bộ Microservice (AI Service Protection):**
   * Giao tiếp giữa Spring Boot Backend và Python FastAPI AI Microservice được bảo vệ bởi khóa bí mật nội bộ `X-API-Secret`.

6. **Toàn vẹn Sổ sách Kế toán:**
   * Dữ liệu sổ chi tiết doanh thu, chi phí và nghĩa vụ thuế tuân thủ **Thông tư 88/2021/TT-BTC** với lịch sử ghi vết kiểm toán (Audit Trail) để đảm bảo tính minh bạch và chống giả mạo số liệu.

---

## Out of Scope

Các hành vi và kịch bản thử nghiệm sau **không** thuộc phạm vi tiếp nhận và bị nghiêm cấm trên các môi trường thử nghiệm công khai:

* Tấn công từ chối dịch vụ phân tán (DDoS / DoS) làm cạn kiệt băng thông hoặc tài nguyên máy chủ.
* Các hình thức tấn công phi kỹ thuật (Social Engineering, Phishing, v.v.) nhắm vào thành viên nhóm phát triển hoặc người dùng.
* Khai thác lỗ hổng đòi hỏi quyền truy cập vật lý trực tiếp vào máy tính của nạn nhân hoặc thông qua thiết bị đã bị can thiệp root/jailbreak.
* Báo cáo phát hiện tự động từ công cụ quét (automated vulnerability scanners) mà không có PoC chứng minh tác động thực tế.
* Spam tin nhắn, thư rác hoặc làm gián đoạn hạ tầng của các dịch vụ bên thứ ba (SePay, Cloudinary, Firebase, v.v.).

---

## Recognition & Responsible Disclosure

Nhóm phát triển HBDT Platform tôn trọng và đánh giá cao sự đóng góp của cộng đồng an toàn thông tin:

* Nhóm cam kết **không thực hiện hành động pháp lý** đối với các nhà nghiên cứu bảo mật tuân thủ đúng chính sách công bố có trách nhiệm (Responsible Disclosure).
* Các báo cáo hợp lệ sẽ được ghi danh (Attribution / Credits) trong Release Notes của phiên bản vá lỗi tương ứng.
