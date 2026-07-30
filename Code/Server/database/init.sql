-- =========================================
-- AgriTrade Platform — Database Init Script
-- Charset: utf8mb4 (hỗ trợ Unicode tiếng Việt)
-- =========================================

CREATE DATABASE IF NOT EXISTS agritrade
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE agritrade;

-- Bảng này chỉ để kiểm tra DB khởi động thành công.
-- Schema thực sự được quản lý bởi Spring JPA (DDL auto).
SELECT 'Database agritrade initialized successfully' AS status;
