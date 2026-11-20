<!-- 
  TIÊU ĐỀ PULL REQUEST (PR TITLE) - Hỗ trợ 2 định dạng chuẩn của dự án:
  - Kiểu 1 (Thẻ vuông) : [TYPE] <mô tả ngắn>            -> Ví dụ: [FEAT] Tích hợp cổng thanh toán SePay
  - Kiểu 2 (Scope)     : type(scope): <mô tả ngắn>      -> Ví dụ: feat(payment): tích hợp webhook SePay và VietQR
  
  Các scope phổ biến: auth, payment, sepay, inventory, order, accounting, tax, customer, admin, ai, ui, seed
-->

## 📌 Tóm Tắt Thay Đổi (Summary of Changes)
<!-- Mô tả ngắn gọn về những thay đổi hoặc tính năng được thêm vào trong Pull Request này -->


---

## 🎯 Loại Thay Đổi (Type of Change)
<!-- Đánh dấu [x] vào loại thay đổi phù hợp -->
- [ ] `[FEAT]` / `feat(scope)`: Tính năng mới (New feature)
- [ ] `[FIX]` / `fix(scope)`: Sửa lỗi (Bug fix)
- [ ] `[UI]` / `ui(scope)`: Tinh chỉnh giao diện người dùng (CSS/Tailwind/Component layout)
- [ ] `[DOCS]` / `docs(scope)`: Cập nhật hoặc bổ sung tài liệu
- [ ] `[TEST]` / `test(scope)`: Thêm mới hoặc cập nhật bộ kiểm thử (Unit / Integration Test)
- [ ] `[REFACTOR]` / `refactor(scope)`: Tái cấu trúc mã nguồn (không thay đổi nghiệp vụ)
- [ ] `[CHORE]` / `chore(scope)`: Cấu hình dự án, cập nhật dependencies hoặc dữ liệu seed
- [ ] `[GRAPHIFY]` / `graphify(scope)`: Cập nhật đồ thị tri thức kiến trúc mã nguồn

---

## 🧩 Phân Hệ Bị Ảnh Hưởng (Affected Subsystems)
- [ ] **Backend:** Spring Boot 3.3 / Java 21 (`Code/Server`)
- [ ] **Frontend:** Next.js 16 / TypeScript / Tailwind CSS (`Code/Client/src/frontend`)
- [ ] **AI Microservice:** Python FastAPI (`Code/AI`)
- [ ] **Cơ sở dữ liệu:** MySQL Schema / Migrations / Seed data
- [ ] **Cổng thanh toán:** SePay Webhook / VietQR / Bypass Key
- [ ] **Nghiệp vụ kế toán:** Sổ sách Thông tư 88/2021/TT-BTC (S1, S2, S4)

---

## 🔗 Liên Kết Nhiệm Vụ (Related Issue / Ticket)
<!-- Ví dụ: Closes #123, Fixes #45, Ref: HBDT-95 -->
- Issue / Ticket: 

---

## 📸 Bằng Chứng Kiểm Thử & Hình Ảnh (Verification & Screenshots)
<!-- Mô tả kịch bản test đã thực hiện hoặc đính kèm ảnh chụp màn hình kiểm thử thành công -->
- **Kịch bản kiểm thử:**
- **Ảnh minh họa (nếu có):**

---

## ✅ Danh Sách Kiểm Tra Trước Khi Merge (Pre-Merge Checklist)
<!-- Vui lòng tích chọn đầy đủ các mục trước khi yêu cầu review -->
- [ ] Mã nguồn đã tuân thủ đúng quy chuẩn trong [CONTRIBUTING.md](CONTRIBUTING.md).
- [ ] Nhánh làm việc đã được cập nhật mới nhất từ `develop` (`git pull origin develop`).
- [ ] Tiêu đề PR đặt đúng chuẩn `[TYPE] <mô tả>` hoặc `type(scope): <mô tả>`.
- [ ] **Backend:** Biên dịch thành công và Unit tests vượt qua (`.\mvnw test -Dtest="!AiServiceTest"`).
- [ ] **Frontend:** Không có lỗi cú pháp (`npx tsc --noEmit`) và test nghiệp vụ pass (`npm run test:inventory`).
- [ ] Tuyệt đối **không** commit file nhạy cảm (`.env`, mật khẩu DB thật, API secret key).
- [ ] Tuyệt đối **không** commit file rác (`target/`, `.next/`, `node_modules/`, cache tạm).
- [ ] Đã gán ít nhất một Reviewer trong nhóm để đối soát code.
