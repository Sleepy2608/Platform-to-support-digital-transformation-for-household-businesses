-- HBDT-52: Cấu hình ngưỡng tồn kho và lưu lịch sử cảnh báo.
-- Chạy migration này trước khi deploy profile production (ddl-auto=validate).

SET @add_minimum_stock_column = (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE()
              AND TABLE_NAME = 'products'
              AND COLUMN_NAME = 'minimum_stock'
        ),
        'SELECT 1',
        'ALTER TABLE products ADD COLUMN minimum_stock DECIMAL(18,3) NULL AFTER sale_price'
    )
);
PREPARE add_minimum_stock_column_stmt FROM @add_minimum_stock_column;
EXECUTE add_minimum_stock_column_stmt;
DEALLOCATE PREPARE add_minimum_stock_column_stmt;

CREATE TABLE IF NOT EXISTS inventory_alerts (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    business_id BIGINT UNSIGNED NOT NULL,
    product_id BIGINT UNSIGNED NOT NULL,
    status VARCHAR(20) NOT NULL,
    quantity_snapshot DECIMAL(18,3) NOT NULL,
    threshold_snapshot DECIMAL(18,3) NOT NULL,
    triggered_at DATETIME(6) NOT NULL,
    last_detected_at DATETIME(6) NOT NULL,
    resolved_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    updated_at DATETIME(6) NOT NULL,
    active_marker TINYINT
        GENERATED ALWAYS AS (CASE WHEN status = 'ACTIVE' THEN 1 ELSE NULL END) STORED,
    PRIMARY KEY (id),
    UNIQUE KEY uk_inventory_alerts_one_active
        (business_id, product_id, active_marker),
    KEY idx_inventory_alerts_business_status (business_id, status),
    KEY idx_inventory_alerts_product_status (product_id, status),
    CONSTRAINT fk_inventory_alerts_business
        FOREIGN KEY (business_id) REFERENCES businesses (id),
    CONSTRAINT fk_inventory_alerts_product
        FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Dọn các cảnh báo còn ACTIVE của sản phẩm đã ngừng sử dụng từ phiên bản cũ.
UPDATE inventory_alerts alerts
JOIN products product ON product.id = alerts.product_id
SET alerts.status = 'RESOLVED',
    alerts.resolved_at = COALESCE(alerts.resolved_at, CURRENT_TIMESTAMP(6)),
    alerts.updated_at = CURRENT_TIMESTAMP(6)
WHERE alerts.status = 'ACTIVE'
  AND product.status <> 'ACTIVE';

-- Cho phép hệ thống lưu thông báo phát sinh và được xử lý của HBDT-52.
-- Dùng câu lệnh động để migration vẫn chạy được trên database chưa có constraint cũ.
SET @drop_notification_type_check = (
    SELECT IF(
        EXISTS (
            SELECT 1
            FROM information_schema.TABLE_CONSTRAINTS
            WHERE CONSTRAINT_SCHEMA = DATABASE()
              AND TABLE_NAME = 'notifications'
              AND CONSTRAINT_NAME = 'chk_notifications_type'
              AND CONSTRAINT_TYPE = 'CHECK'
        ),
        'ALTER TABLE notifications DROP CHECK chk_notifications_type',
        'SELECT 1'
    )
);
PREPARE drop_notification_type_check_stmt FROM @drop_notification_type_check;
EXECUTE drop_notification_type_check_stmt;
DEALLOCATE PREPARE drop_notification_type_check_stmt;

ALTER TABLE notifications
    ADD CONSTRAINT chk_notifications_type CHECK (
        notification_type IN (
            'AI_DRAFT_CREATED',
            'ORDER_STATUS_CHANGED',
            'GENERAL',
            'LOW_STOCK',
            'LOW_STOCK_RESOLVED'
        )
    );
