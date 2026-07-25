-- Script nay chi dung de MySQL container tao san database khi khoi dong lan dau.
-- Toan bo schema (bang, index, khoa ngoai) duoc quan ly boi Flyway trong
-- backend/src/main/resources/db/migration/ - KHONG chinh sua schema thu cong o day.

CREATE DATABASE IF NOT EXISTS agritrade
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
