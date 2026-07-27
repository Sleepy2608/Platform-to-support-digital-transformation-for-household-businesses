-- =============================================================================
-- SCRUM-07 — Database Skeleton
-- Nền tảng hỗ trợ chuyển đổi số cho hộ kinh doanh
-- MySQL 8 | utf8mb4 | InnoDB | Multi-tenant (shared schema + business_id)
-- =============================================================================

CREATE DATABASE IF NOT EXISTS household_business_platform
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_0900_ai_ci;

USE household_business_platform;

SET NAMES utf8mb4;
SET time_zone = '+07:00';

-- -----------------------------------------------------------------------------
-- 4.1 Business Core (Sprint 1: đăng ký Owner + đăng nhập)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  role_code     VARCHAR(32)  NOT NULL,
  role_name     VARCHAR(100) NOT NULL,
  description   VARCHAR(255) NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_roles_code (role_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS businesses (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  business_code   VARCHAR(32)  NOT NULL,
  business_name   VARCHAR(255) NOT NULL,
  tax_code        VARCHAR(32)  NULL,
  address         VARCHAR(500) NULL,
  representative  VARCHAR(255) NULL,
  phone           VARCHAR(20)  NULL,
  email           VARCHAR(255) NULL,
  status          VARCHAR(32)  NOT NULL DEFAULT 'PENDING',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_businesses_code (business_code),
  KEY idx_businesses_status (status),
  CONSTRAINT chk_businesses_status CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS users (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  business_id     BIGINT UNSIGNED NULL COMMENT 'NULL = Administrator toàn nền tảng',
  role_id         BIGINT UNSIGNED NOT NULL,
  username        VARCHAR(100) NOT NULL,
  email           VARCHAR(255) NOT NULL,
  phone           VARCHAR(20)  NULL,
  full_name       VARCHAR(255) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  status          VARCHAR(32)  NOT NULL DEFAULT 'ACTIVE',
  last_login_at   DATETIME     NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_username (username),
  UNIQUE KEY uk_users_email (email),
  KEY idx_users_business (business_id),
  KEY idx_users_role (role_id),
  CONSTRAINT fk_users_business FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE RESTRICT,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles (id) ON DELETE RESTRICT,
  CONSTRAINT chk_users_status CHECK (status IN ('ACTIVE', 'LOCKED', 'INACTIVE', 'PENDING_VERIFY'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS subscription_plans (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  plan_code       VARCHAR(32)  NOT NULL,
  plan_name       VARCHAR(100) NOT NULL,
  description     TEXT         NULL,
  price_monthly   DECIMAL(15,2) NOT NULL DEFAULT 0,
  price_yearly    DECIMAL(15,2) NOT NULL DEFAULT 0,
  benefits_json   JSON         NULL,
  status          VARCHAR(32)  NOT NULL DEFAULT 'ACTIVE',
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uk_plans_code (plan_code),
  CONSTRAINT chk_plans_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS subscriptions (
  id              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  business_id     BIGINT UNSIGNED NOT NULL,
  plan_id         BIGINT UNSIGNED NOT NULL,
  billing_cycle   VARCHAR(16)  NOT NULL,
  status          VARCHAR(32)  NOT NULL DEFAULT 'PENDING_PAYMENT',
  start_date      DATE         NULL,
  end_date        DATE         NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_subs_business (business_id),
  KEY idx_subs_plan (plan_id),
  KEY idx_subs_status (status),
  CONSTRAINT fk_subs_business FOREIGN KEY (business_id) REFERENCES businesses (id) ON DELETE RESTRICT,
  CONSTRAINT fk_subs_plan FOREIGN KEY (plan_id) REFERENCES subscription_plans (id) ON DELETE RESTRICT,
  CONSTRAINT chk_subs_cycle CHECK (billing_cycle IN ('MONTHLY', 'YEARLY')),
  CONSTRAINT chk_subs_status CHECK (status IN ('PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- -----------------------------------------------------------------------------
-- Seed tối thiểu (Sprint 1)
-- -----------------------------------------------------------------------------

INSERT INTO roles (role_code, role_name, description) VALUES
  ('ADMIN', 'Administrator', 'Quản trị toàn nền tảng'),
  ('OWNER', 'Owner', 'Chủ hộ kinh doanh'),
  ('EMPLOYEE', 'Employee', 'Nhân viên bán hàng')
ON DUPLICATE KEY UPDATE role_name = VALUES(role_name);

INSERT INTO subscription_plans (plan_code, plan_name, description, price_monthly, price_yearly, benefits_json) VALUES
  ('STANDARD', 'Gói Thường', 'Gói cơ bản cho hộ kinh doanh', 199000.00, 1990000.00,
   JSON_ARRAY('Bán hàng tại quầy', 'Quản lý kho', 'Công nợ cơ bản', 'Báo cáo doanh thu')),
  ('VIP', 'Gói VIP', 'Gói nâng cao kèm AI Draft Order', 399000.00, 3990000.00,
   JSON_ARRAY('Tất cả quyền lợi gói Thường', 'AI Draft Order', 'Voice-to-text', 'Báo cáo kế toán Thông tư 88', 'Ưu tiên hỗ trợ'))
ON DUPLICATE KEY UPDATE plan_name = VALUES(plan_name);

-- -----------------------------------------------------------------------------
-- Placeholder: các phân hệ còn lại (sẽ mở rộng theo Database Design — 29 bảng)
-- Product & Inventory | Sales & Customer Debt | AI & System | Accounting
-- Xem: docs/detailed-design/database-design.md
-- -----------------------------------------------------------------------------
