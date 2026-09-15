# Cách chạy (How to run)

## 1. Yêu cầu
- **Intellij IDEA 2026.2**
- **Java 21**
- **Apache Maven**
- **MySQL** đã có sẵn dữ liệu (local hoặc cloud)

## 2. Clone source code

```
git clone https://github.com/Sleepy2608/Platform-to-support-digital-transformation-for-household-businesses.git
```

## 3. Cấu hình `.env` cho server
Tạo file `Code/Server/.env`:
```env
DB_HOST=<host>
DB_PORT=3000
DB_NAME=<dbname>
DB_USERNAME=<username>
DB_PASSWORD=<password>
```

Vào mục Edit Configurations -> Chọn Evironment variables -> Thêm file .env vừa tạo

## 4. Chạy nhanh bằng file `.bat`

Repo có sẵn **4 file script ở thư mục gốc** — double-click là chạy, không cần gõ lệnh:

| File | Chạy gì | Cần cài trước |
| :--- | :--- | :--- |
| `run-backend.bat` | Backend Spring Boot — cổng **8080** | **JDK 21** + biến môi trường `JAVA_HOME` |
| `run-frontend.bat` | Frontend Next.js — cổng **3000** | **Node.js 20+** |
| `run-frontend-clean.bat` | Như trên nhưng **xóa `.next` + `node_modules`** rồi cài lại | **Node.js 20+** |
| `run-ai.bat` | AI Service (FastAPI) — cổng **8000** | **Python 3.10+** |

> **`run-ai.bat` cần tải thư viện về máy:** lần chạy đầu tiên script tạo môi trường ảo `Code\AI\.venv` (khoảng 50 MB) và **tải các thư viện Python cần thiết** (fastapi, uvicorn, pydantic, httpx, python-dotenv…) → cần **Internet** và mất khoảng **1–2 phút**. Các lần sau chạy nhanh vì đã có `.venv`. Khi `requirements.txt` thay đổi, chạy `run-ai.bat reinstall`.

> **`run-backend.bat` cần `JAVA_HOME`:** nếu máy chưa có, chạy 1 lần trong PowerShell (thay bằng JDK 21 thật trên máy bạn): `[Environment]::SetEnvironmentVariable('JAVA_HOME', 'C:\Program Files\Eclipse Adoptium\jdk-21.0.12.8-hotspot', 'User')` rồi mở lại terminal.

## 5. Backend (cách chạy thủ công)

- Vào thư mục `Code\Server\src\main\java\com.hbdt`

- Chạy thư mục `HbdtApplication`. Click vào `Run 'HbdtApplication.main()'`

## 6. Frontend (cách chạy thủ công)

- Chuyển đường dẫn sang file frontend (`Code\Client\src\frontend`)
```text
cd ..Code\Client\src\frontend
```

- Tải thư viện npm
```text
npm install
```

- Chạy frontend
```text
npm run dev
```

- Web được chạy ở:
  * Local: http://localhost:3000/
  * Network: http://192.168.23.1:3000
> Lưu ý: Trang đăng nhập vào Manager/Owner/Employee được chạy ở url `http://localhost:3000/login` còn trang Admin được chạy ở url `http://localhost:3000/admin/login`.
> Thay vì gõ tay các bước trên, có thể double-click `run-frontend.bat` (chạy bình thường) hoặc `run-frontend-clean.bat` (khi cần xóa cache `.next` + `node_modules` rồi cài lại).