-- Migration: Add employee profile fields to users table
-- Feature: HBDT-114 - Employee Profile Management
-- Run this on your household_business_platform database

USE `household_business_platform`;

ALTER TABLE `users`
  ADD COLUMN `date_of_birth`    DATE          NULL COMMENT 'Ngày sinh',
  ADD COLUMN `gender`           VARCHAR(10)   NULL COMMENT 'Giới tính: MALE, FEMALE, OTHER',
  ADD COLUMN `address`          VARCHAR(500)  NULL COMMENT 'Địa chỉ',
  ADD COLUMN `national_id`      VARCHAR(20)   NULL COMMENT 'Số CCCD/CMND',
  ADD COLUMN `join_date`        DATE          NULL COMMENT 'Ngày vào làm',
  ADD COLUMN `position`         VARCHAR(100)  NULL COMMENT 'Chức vụ',
  ADD COLUMN `termination_date` DATE          NULL COMMENT 'Ngày nghỉ việc';
