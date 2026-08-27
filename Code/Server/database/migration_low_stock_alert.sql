-- HBDT-52: Cấu hình ngưỡng tồn kho và lưu lịch sử cảnh báo.
-- Chạy migration này trước khi deploy profile production (ddl-auto=validate).

ALTER TABLE products
    ADD COLUMN IF NOT EXISTS minimum_stock DECIMAL(18,3) NULL AFTER sale_price;

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
    PRIMARY KEY (id),
    KEY idx_inventory_alerts_business_status (business_id, status),
    KEY idx_inventory_alerts_product_status (product_id, status),
    CONSTRAINT fk_inventory_alerts_business
        FOREIGN KEY (business_id) REFERENCES businesses (id),
    CONSTRAINT fk_inventory_alerts_product
        FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
