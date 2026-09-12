# Hướng dẫn Cài đặt Hệ thống (Installation Guide)

| Thông tin | Nội dung |
|---|---|
| **Tên tài liệu** | Hướng dẫn Cài đặt Hệ thống (Installation Guide) – Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh |
| **Dự án** | Nền tảng Hỗ trợ Chuyển đổi Số cho Hộ Kinh doanh (HBDT Platform) |
| **Mã issue/ticket** | HBDT-95 |  
| **Phiên bản** | 1.1 |
| **Cập nhật lần cuối** | 10/09/2026 |
| **Trạng thái** | Đồng bộ với cấu hình hiện tại của repo và luồng dev local trên Windows |

---

## 0. Lưu ý quan trọng trước khi cài đặt (Crucial Notice)

> [!CAUTION]
> **ĐƯỜNG DẪN THƯ MỤC TUYỆT ĐỐI KHÔNG CHỨA DẤU TIẾNG VIỆT HOẶC KHOẢNG TRẮNG:**
> - **Sai:** `D:\Đồ Án\Nền Tảng HBDT\...` hoặc `C:\Users\Tên Người Dùng\Project\...` (chứa dấu/dấu cách).
> - **Đúng:** `D:\Projects\Platform-to-support-digital-transformation-for-household-businesses`
> - **Nguyên nhân:** Bộ biên dịch Java (JDK) và các công cụ build (Maven/Gradle) trên hệ điều hành Windows rất dễ văng lỗi `Could not find or load main class` hoặc lỗi nạp file class nếu đường dẫn chứa ký tự Unicode có dấu.

---

## 1. Yêu cầu hệ thống (Prerequisites)

### 1.1 Phần mềm bắt buộc
| Phần mềm | Phiên bản | Lệnh kiểm tra | Ghi chú |
|---|---|---|---|
| Java JDK | 21 (Temurin / OpenJDK 21 LTS) | `java -version` | Yêu cầu JDK 21 để tương thích Spring Boot 3.3 |
| Maven | 3.9+ (hoặc wrapper `mvnw`) | `mvn -v` hoặc `.\mvnw -v` | Quản lý build và dependency Java |
| Node.js | 20+ (hỗ trợ 20, 22, 24) | `node -v` | Môi trường runtime cho Next.js Frontend |
| npm | 10+ | `npm -v` | Quản lý package Node.js |
| MySQL | 8.0+ (khuyến nghị 8.0 / 8.4) | `mysql --version` | Hệ quản trị cơ sở dữ liệu quan hệ chính |

### 1.2 Phần mềm tùy chọn / Phân hệ AI / Container
| Phần mềm | Mục đích |
|---|---|
| Python 3.10+ | Môi trường chạy phân hệ AI Service (FastAPI / Uvicorn) |
| Docker & Docker Compose | Container hóa toàn bộ hệ thống (MySQL, Backend, Frontend, AI Service) |
| IntelliJ IDEA (Ưu tiên) | IDE phát triển Java Spring Boot được tối ưu tốt nhất |
| VS Code | IDE hỗ trợ tốt cho Frontend Next.js / TypeScript |

### 1.3 Tài nguyên phần cứng khuyến nghị
- **Môi trường Development**: Tối thiểu 4 CPU Cores, 8 GB RAM, 20 GB dung lượng ổ cứng còn trống.
- **Môi trường Production**: 4 CPU Cores, 8 GB RAM (dành riêng cho App Server) + Máy chủ Cơ sở dữ liệu MySQL 8.0 độc lập.

---

## 2. Cài đặt từ mã nguồn (Dev Environment)

### 2.1 Clone Repository
Mở PowerShell hoặc Git Bash và gõ lệnh:
```bat
git clone https://github.com/Sleepy2608/Platform-to-support-digital-transformation-for-household-businesses.git
cd Platform-to-support-digital-transformation-for-household-businesses
```

### 2.2 Cấu hình biến môi trường Backend (`Code/Server/.env`)
Hiện tại repo có file mẫu `Code/Server/.env.example`, nhưng khi chạy local bạn nên tạo file `.env` theo cấu hình thực của backend hiện tại. Một template khởi chạy đúng cho môi trường dev là:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=household_business_platform
DB_USERNAME=root
DB_PASSWORD=root

APP_SEED_DEMO_USERS_ENABLED=true
APP_SEED_ROLES_ENABLED=true
APP_REFERENCE_DATA_ENABLED=true
OTP_DEV_MODE=true
OTP_TTL_MINUTES=5

JWT_SECRET=dev-secret-key-hbdt-platform-256-bits-long-minimum-change-in-production
JWT_ACCESS_EXPIRATION_MS=900000
JWT_REFRESH_EXPIRATION_MS=604800000

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password

SERVER_PORT=8080
SPRING_PROFILES_ACTIVE=dev
```

> [!TIP]
> **Lưu ý thiết yếu khi chạy local:**
> 1. `spring.datasource.url` trong [Code/Server/src/main/resources/application-dev.properties](Code/Server/src/main/resources/application-dev.properties) đã có `createDatabaseIfNotExist=true`, nên bạn không cần tạo database bằng tay nếu tài khoản MySQL có quyền tạo schema.
> 2. `spring.jpa.hibernate.ddl-auto=update` cho phép Hibernate tự đồng bộ schema với entity khi chạy local.
> 3. `app.otp.dev-mode=true` làm OTP xuất ra console log thay vì gửi email thật, rất phù hợp với môi trường phát triển.
> 4. `Code/Server/.env.example` chỉ là mẫu tối thiểu; nếu có trường muốn override trong dev thì nên bổ sung thêm như `JWT_*`, `MAIL_*`, `OTP_*` để phù hợp với thực tế hiện tại.

### 2.3 Cấu hình IDE IntelliJ IDEA (Khuyến nghị cho Backend)
1. **Mở dự án:** Chọn menu `File` → `Open` → Chọn thư mục `Code/Server` (hoặc mở root repository).
2. **Chọn SDK:** Vào `File` → `Project Structure` → `Project` → Đảm bảo **SDK là Java 21**.
3. **Kích hoạt Lombok:**
   - Vào `Settings` (hoặc `Preferences`) → `Build, Execution, Deployment` → `Compiler` → `Annotation Processors`.
   - Tích chọn **Enable annotation processing** (bắt buộc để Lombok sinh mã getter/setter/builder).
4. **Nạp biến môi trường `.env`:**
   - Chạy thử `HbdtApplication` một lần để tạo Run Configuration.
   - Chọn `Edit Configurations...` → Tại mục **Environment variables**, trỏ đến file `Code/Server/.env` (hoặc cài đặt plugin *EnvFile* trong IntelliJ).
5. **Đảm bảo đường dẫn dự án hợp lệ:** Không đặt project dưới thư mục chứa tiếng Việt hoặc khoảng trắng; ưu tiên `D:\Projects\Platform-to-support-digital-transformation-for-household-businesses`.

### 2.4 Khởi chạy Backend (Spring Boot API)
**Cách 1: Khởi chạy bằng IntelliJ IDEA (Đơn giản nhất)**
- Điều hướng tới file `Code/Server/src/main/java/com/hbdt/HbdtApplication.java`.
- Click chuột phải vào file và chọn **Run 'HbdtApplication.main()'**.

**Cách 2: Khởi chạy bằng Maven dòng lệnh**
```bat
cd Code/Server
.\mvnw.cmd spring-boot:run
```
*(Trên Linux/macOS: `./mvnw spring-boot:run`)*

**Dấu hiệu khởi chạy thành công:**
- Xuất hiện log: `Started HbdtApplication in X.XXX seconds`.
- Backend phục vụ tại: `http://localhost:8080/`.
- Kiểm tra trạng thái sức khỏe: `http://localhost:8080/actuator/health` → trả về `{"status":"UP"}`.

> [!NOTE]
> **Tự động đồng bộ Reference Data & Địa giới hành chính:**
> Trong lần chạy đầu tiên, hệ thống cần kết nối Internet để nạp danh mục 63 Tỉnh/Thành, Quận/Huyện, Phường/Xã vào in-memory, đồng thời nạp dữ liệu chuẩn Thông tư 88 (`report_templates.json`) và các loại thuế khoán/thuế GTGT (`tax_types.json`).

### 2.5 Cơ chế Seek / Seed Data mẫu dùng chung nhóm (Đặc thù HBDT)
HBDT trang bị cơ chế **Seek Data** để các thành viên trao đổi dữ liệu mẫu (danh mục, sản phẩm, gói thuê bao...) thông qua Git mà không làm mất hay xung đột dữ liệu trên máy nhau:
- **Tài khoản mặc định được seed sẵn:**
  - Quản trị viên (Admin): `admin` / `admin`
  - Chủ hộ kinh doanh (Owner): `owner` / `owner123`
- **Các file seed:** Được lưu tại `seed/` và `Code/Server/seed/` dưới dạng mã hóa AES.
- **Màn hình Seek Data:**
  - Đăng nhập với quyền `ADMIN` tại `http://localhost:3000/admin/login`.
  - Nhập **Database Key** do Trưởng nhóm cung cấp để mở khóa tính năng Snapshot / Restore dữ liệu mẫu.

### 2.6 Khởi chạy Phân hệ AI Service (`Code/AI` - Tùy chọn)
Phân hệ AI hỗ trợ bóc tách ngôn ngữ tự nhiên từ tin nhắn thoại/văn bản tiếng Việt để tự động lập đơn hàng. Hướng dẫn chạy thực tế theo repo hiện tại:
```bat
cd Code/AI
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
- Endpoint AI: `http://localhost:8000`
- Trong môi trường dev, AI service nên chạy độc lập bên cạnh backend và frontend, không cần phụ thuộc vào Docker Compose nếu Docker config hiện tại chưa đồng bộ với cấu trúc thư mục hiện nay.

### 2.7 Khởi chạy Frontend (Next.js 16 App Router)
Mở một cửa sổ Terminal mới:
```bat
cd Code/Client/src/frontend
npm install
npm run dev
```
- Giao diện người dùng: `http://localhost:3000/`
- Trang Đăng nhập Chủ hộ / Nhân viên / Quản lý: `http://localhost:3000/login`
- Trang Đăng nhập Quản trị viên hệ thống: `http://localhost:3000/admin/login`

> [!IMPORTANT]
> Port frontend theo luồng dev hiện tại là `3000`, không phải port `5173` như trong một số cấu hình Docker cũ. Nếu bạn dùng Docker Compose ở repo, hãy kiểm tra lại file [docker-compose.yml](docker-compose.yml) vì cấu hình hiện tại còn đang là phiên bản legacy và có thể không đồng bộ hoàn toàn với cấu trúc hiện tại của repo.

---

## 3. Cài đặt Production

### 3.1 Cấu hình Cơ sở dữ liệu Production
1. Tạo schema MySQL độc lập với mã ký tự UTF-8 đầy đủ:
   ```sql
   CREATE DATABASE household_business_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Thiết lập profile production: `SPRING_PROFILES_ACTIVE=prod`.
3. Hibernate sẽ chạy ở chế độ an toàn: `spring.jpa.hibernate.ddl-auto=validate` (chỉ kiểm tra hợp lệ, không tự ý can thiệp cấu trúc bảng).

### 3.2 Bảng biến môi trường bắt buộc (Production)
| Tên biến | Kiểu dữ liệu / Yêu cầu | Mục đích |
|---|---|---|
| `SPRING_PROFILES_ACTIVE` | `prod` | Kích hoạt cấu hình `application-prod.properties` |
| `DB_HOST`, `DB_PORT`, `DB_NAME` | Host / Cổng / Tên DB | Kết nối MySQL Database thật |
| `DB_USERNAME`, `DB_PASSWORD` | Tên user & Pass | Tài khoản MySQL có đặc quyền CRUD |
| `JWT_SECRET` | Base64 string ≥ 256 bits | Sinh chuỗi an toàn: `openssl rand -base64 48` |
| `JWT_ACCESS_EXPIRATION_MS` | Milliseconds (vd: `900000`) | Thời hạn token truy cập (15 phút) |
| `JWT_REFRESH_EXPIRATION_MS` | Milliseconds (vd: `604800000`) | Thời hạn refresh token (7 ngày) |
| `MAIL_HOST`, `MAIL_PORT` | SMTP Host & Port (587) | Cấu hình máy chủ gửi Email OTP thật |
| `MAIL_USERNAME`, `MAIL_PASSWORD` | Gmail App Password | Tài khoản gửi email thông báo |
| `OTP_DEV_MODE` | `false` | Bắt buộc gửi mã OTP qua Email thực |
| `UPLOAD_DIR` | Absolute path | Đường dẫn lưu trữ ảnh đại diện, hóa đơn trên volume bền vững |
| `APP_PUBLIC_BASE_URL` | Domain URL (vd: `https://api.hbdt.vn`) | Domain phục vụ truy xuất tài nguyên tĩnh/ảnh |

### 3.3 Triển khai trọn gói bằng Docker Compose
Repo hiện có file [docker-compose.yml](docker-compose.yml), nhưng cấu hình này đang là phiên bản legacy và chưa hoàn toàn khớp với cấu trúc hiện tại của project. Theo tình trạng hiện tại, luồng chạy đáng tin cậy nhất vẫn là:

1. Chạy backend ở `Code/Server`
2. Chạy AI service ở `Code/AI`
3. Chạy frontend ở `Code/Client/src/frontend`
4. Chỉ dùng Docker Compose nếu bạn đã cập nhật lại các đường dẫn và service config cho đúng repo hiện tại.

Nếu vẫn muốn dùng Docker Compose, nên kiểm tra lại trước khi chạy:
```bash
cd Platform-to-support-digital-transformation-for-household-businesses
docker compose config
```

Lưu ý: file hiện tại đang tham chiếu các context như `./ai-service` và `5173:80`, trong khi repo thực tế hiện đang là `Code/AI`, `Code/Client/src/frontend` và port dev frontend là `3000`.

### 3.4 Quy trình cập nhật phiên bản (Rolling Update)
```bash
git pull origin main
cd Code/Server
./mvnw clean package -DskipTests
cd ../..
```
Sau đó khởi động lại từng service theo luồng dev local:
```bash
cd Code/Server
./mvnw spring-boot:run
cd Code/AI
uvicorn main:app --reload --port 8000
cd Code/Client/src/frontend
npm run dev
```

---

## 4. Xác minh cài đặt (Smoke Test)

Sau khi hoàn tất cài đặt, tiến hành kiểm thử nhanh để đảm bảo toàn bộ hệ thống hoạt động ổn định:

| # | Hạng mục kiểm tra | Thao tác thực hiện | Kết quả kỳ vọng |
|---|---|---|---|
| 1 | Trạng thái Backend | Gọi `curl http://localhost:8080/actuator/health` | Trả về JSON `{"status":"UP"}` |
| 2 | Giao diện Frontend | Mở trình duyệt truy cập `http://localhost:3000/` | Trang chủ hiển thị đầy đủ hiệu ứng & giao diện |
| 3 | Đăng nhập Hộ kinh doanh | Mở `http://localhost:3000/login`, nhập `owner` / `owner123` | Đăng nhập thành công, chuyển tiếp vào Owner Dashboard |
| 4 | Đăng nhập Quản trị viên | Mở `http://localhost:3000/admin/login`, nhập `admin` / `admin` | Đăng nhập thành công, vào giao diện Quản trị hệ thống |
| 5 | Seed Master Data | Kiểm tra danh mục sản phẩm, biểu mẫu TT88 | Bảng dữ liệu có đầy đủ danh mục và danh sách tỉnh thành |
| 6 | Kiểm tra kết nối AI Service | Gọi `curl http://localhost:8000/` | Trả về HTTP Status 200 OK |
| 7 | Kiểm thử tự động Backend | Chạy lệnh `mvn test` trong `Code/Server` | Toàn bộ các bộ kiểm thử tự động (Unit Tests) đều PASS |
| 8 | Kiểm thử Frontend | Chạy `npm run test:low-stock` trong `Code/Client/src/frontend` | Kịch bản cảnh báo tồn kho thấp vượt qua kiểm thử thành công |

---

## 5. Khắc phục sự cố thường gặp (Troubleshooting)

| Triệu chứng lỗi | Nguyên nhân gốc rễ | Cách xử lý dứt điểm |
|---|---|---|
| `Could not find or load main class com.hbdt.HbdtApplication` | Đường dẫn thư mục chứa tiếng Việt có dấu hoặc khoảng cách | Di chuyển/Cắt toàn bộ thư mục dự án sang đường dẫn không dấu (vd: `D:\Projects\...`) |
| `Access denied for user 'root'@'localhost'` | Mật khẩu MySQL cục bộ không khớp với cấu hình trong `.env` | Kiểm tra mật khẩu MySQL trên máy và cập nhật lại dòng `DB_PASSWORD=...` trong `Code/Server/.env` |
| `Communications link failure` | Dịch vụ MySQL chưa được khởi chạy | Mở PowerShell quyền Admin và chạy lệnh `Start-Service MySQL84` (hoặc bật MySQL từ XAMPP / Services) |
| IntelliJ báo đỏ hàng loạt hàm `getter`, `setter`, `builder` | Chưa bật tính năng biên dịch Annotation cho thư viện Lombok | Vào `Settings` → `Build, Execution, Deployment` → `Compiler` → `Annotation Processors` → Tích chọn **Enable annotation processing** |
| Log báo lỗi `Port 8080 already in use` | Cổng 8080 đang bị ứng dụng khác chiếm giữ | Thêm dòng `SERVER_PORT=8081` vào `Code/Server/.env` hoặc giải phóng tiến trình đang chiếm cổng |
| Danh sách Tỉnh / Huyện / Xã bị trống rỗng | Máy tính mất kết nối Internet trong lần đầu backend boot | Bật kết nối mạng Internet và tiến hành khởi động lại backend để hệ thống đồng bộ dữ liệu địa giới |
| Bấm thao tác trên Web bị quay vòng / báo Network Error | Backend chưa khởi chạy hoặc cổng API không khớp | Đảm bảo Spring Boot backend đang chạy song song tại cổng 8080 trước khi thao tác trên giao diện |
| Không nhận được Email mã OTP khi test đăng ký | `OTP_DEV_MODE` chưa bật hoặc chưa cấu hình SMTP | Trong môi trường Dev, mở cửa sổ Console Log của Spring Boot để copy trực tiếp mã OTP 6 số |

---

## 6. Gỡ cài đặt và dọn dẹp hệ thống (Uninstallation)
- Dừng tiến trình Backend Java (`Ctrl + C` hoặc dừng trên IDE).
- Dừng tiến trình Frontend Node.js (`Ctrl + C`).
- Nếu sử dụng Docker:
  ```bash
  docker compose down -v
  ```
- Xóa thư mục lưu trữ file tạm `Code/Server/uploads/` và xóa cơ sở dữ liệu `household_business_platform` trên MySQL nếu muốn xóa bỏ hoàn toàn dữ liệu. Ứng dụng không ghi bất kỳ khóa nào vào Registry của hệ điều hành Windows.
