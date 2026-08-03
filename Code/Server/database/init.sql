-- =========================================
-- HBDT Platform — Database Init Script
-- Charset: utf8mb4 (hỗ trợ Unicode tiếng Việt)
-- =========================================
--
-- Script này chỉ tạo database rỗng. Toàn bộ schema (bảng, khoá, index)
-- do Spring JPA / Hibernate sinh ra qua `spring.jpa.hibernate.ddl-auto=update`.
--
-- LƯU Ý: Hibernate KHÔNG sửa được kiểu cột đã tồn tại. Nếu trỏ app vào một
-- database đã có bảng `users` / `roles` từ schema khác (ví dụ khoá chính là
-- `bigint unsigned` trong khi entity Java dùng `Long` -> `bigint`), app sẽ
-- fail khi khởi động với lỗi:
--   "foreign key constraint ... are incompatible"
-- Khi đó hãy dùng một database rỗng.

CREATE DATABASE IF NOT EXISTS hbdt_platform
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE hbdt_platform;
