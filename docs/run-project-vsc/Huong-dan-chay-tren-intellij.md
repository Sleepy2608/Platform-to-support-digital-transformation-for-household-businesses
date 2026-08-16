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

## 4. Backend

- Vào thư mục `Code\Server\src\main\java\com.hbdt`

- Chạy thư mục `HbdtApplication`. Click vào `Run 'HbdtApplication.main()'`

## 5. Frontend

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