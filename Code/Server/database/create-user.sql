-- =============================================================
-- Thong nhat mat khau MySQL cho ca nhom: user root / pass 123456
-- Chay 1 lan tren moi may (can dang nhap MySQL bang root voi pass HIEN TAI cua may).
--
-- Cach chay (mo terminal, thay <pass_root_hien_tai> bang pass root that cua may):
--   mysql -u root -p < create-user.sql
-- roi nhap pass root hien tai khi duoc hoi.
--
-- Neu KHONG nho pass root hien tai -> phai reset (bao truong nhom huong dan rieng).
-- =============================================================

-- Tao san database (phong khi chua co)
CREATE DATABASE IF NOT EXISTS household_business_platform
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Doi mat khau root ve 123456 cho khop .env chung
ALTER USER 'root'@'localhost' IDENTIFIED BY '123456';

FLUSH PRIVILEGES;
