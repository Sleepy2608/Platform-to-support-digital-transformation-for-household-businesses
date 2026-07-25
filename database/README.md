# Database

- Loai: MySQL 8.
- `init.sql`: chi tao database rong (dung 1 lan khi container khoi dong).
- Schema thuc te (bang, khoa ngoai, index) nam trong
  `backend/src/main/resources/db/migration/V*.sql` va duoc Flyway tu dong
  ap dung moi khi backend khoi dong.
- Khi them bang/cot moi, tao file migration moi voi so thu tu tang dan,
  KHONG sua lai file migration da chay o moi truong khac.
