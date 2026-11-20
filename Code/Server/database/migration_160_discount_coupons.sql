-- MySQL. Run before deploying the coupon code to a database with ddl-auto=validate.
-- Existing bypass codes become 100% coupons and retain their original usage records.
-- Run with the application stopped. Back up the database and apply with the MySQL client without --force.
CREATE TABLE IF NOT EXISTS coupons (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    key_code VARCHAR(20) NOT NULL,
    max_uses INT NOT NULL,
    used_count INT NOT NULL,
    discount_percent INT NOT NULL CHECK (discount_percent BETWEEN 1 AND 100),
    status VARCHAR(20) NOT NULL,
    note VARCHAR(255),
    expires_at DATETIME(6),
    created_by VARCHAR(100) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    UNIQUE KEY idx_coupons_code (key_code),
    KEY idx_coupons_status (status)
);

CREATE TABLE IF NOT EXISTS coupon_usages (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    coupon_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    username VARCHAR(100) NOT NULL,
    business_id BIGINT UNSIGNED NOT NULL,
    package_type VARCHAR(50) NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL,
    original_amount DECIMAL(18,2) NOT NULL,
    discount_amount DECIMAL(18,2) NOT NULL,
    final_amount DECIMAL(18,2) NOT NULL,
    used_at DATETIME(6) NOT NULL,
    KEY idx_coupon_usages_key (coupon_id),
    KEY idx_coupon_usages_user (user_id),
    KEY idx_coupon_usages_business (business_id),
    CONSTRAINT fk_coupon_usages_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id)
);

CREATE TABLE IF NOT EXISTS coupon_checkouts (
    reference VARCHAR(22) NOT NULL PRIMARY KEY,
    coupon_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    business_id BIGINT UNSIGNED NOT NULL,
    plan_code VARCHAR(50) NOT NULL,
    billing_cycle VARCHAR(20) NOT NULL,
    renewal_months INT,
    subscription_id BIGINT UNSIGNED,
    original_amount DECIMAL(18,2) NOT NULL,
    final_amount DECIMAL(18,2) NOT NULL,
    expires_at DATETIME(6) NOT NULL,
    paid_at DATETIME(6),
    KEY idx_coupon_checkout_reservations (coupon_id, paid_at, expires_at)
);

SET @migrate_coupon_keys = IF(
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'bypass_keys'),
    'INSERT INTO coupons (id, key_code, max_uses, used_count, discount_percent, status, note, expires_at, created_by, created_at, updated_at)
     SELECT id, key_code, max_uses, used_count, discount_percent, status, note, expires_at, created_by, created_at, updated_at
     FROM bypass_keys AS legacy
     WHERE NOT EXISTS (SELECT 1 FROM coupons AS target WHERE target.id = legacy.id AND target.key_code = legacy.key_code)',
    'SELECT 1');
PREPARE migrate_coupon_keys FROM @migrate_coupon_keys;
EXECUTE migrate_coupon_keys;
DEALLOCATE PREPARE migrate_coupon_keys;

SET @migrate_coupon_usages = IF(
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'bypass_key_usages'),
    'INSERT INTO coupon_usages (id, coupon_id, user_id, username, business_id, package_type, billing_cycle, original_amount, discount_amount, final_amount, used_at)
     SELECT id, bypass_key_id, user_id, username, business_id, package_type, billing_cycle, original_amount, discount_amount, final_amount, used_at
     FROM bypass_key_usages AS legacy
     WHERE NOT EXISTS (SELECT 1 FROM coupon_usages AS target WHERE target.id = legacy.id AND target.coupon_id = legacy.bypass_key_id)',
    'SELECT 1');
PREPARE migrate_coupon_usages FROM @migrate_coupon_usages;
EXECUTE migrate_coupon_usages;
DEALLOCATE PREPARE migrate_coupon_usages;

SET @migrate_coupon_seed = IF(
    EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'seed_config'),
    'UPDATE seed_config SET table_name = ''coupons'', file_path = ''seed/coupons.json'' WHERE table_name = ''bypass_keys''',
    'SELECT 1');
PREPARE migrate_coupon_seed FROM @migrate_coupon_seed;
EXECUTE migrate_coupon_seed;
DEALLOCATE PREPARE migrate_coupon_seed;

DROP TABLE IF EXISTS bypass_key_usages;
DROP TABLE IF EXISTS bypass_keys;
