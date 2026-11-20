-- =========================================
-- HBDT Platform — Database Init Script
-- Charset: utf8mb4 (hỗ trợ Unicode tiếng Việt)
-- =========================================

CREATE DATABASE IF NOT EXISTS household_business_platform
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE household_business_platform;

-- Bảng này chỉ để kiểm tra DB khởi động thành công.
-- Schema thực sự được quản lý bởi Spring JPA (DDL auto).
SELECT 'Database household_business_platform initialized successfully' AS status;
