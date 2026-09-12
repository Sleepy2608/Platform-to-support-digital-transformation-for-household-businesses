-- =============================================================================
-- Migration: HBDT-66 Automatic Debt Bookkeeping
-- Mục đích: Chuẩn hóa loại giao dịch công nợ, thêm index tối ưu và ràng buộc
-- =============================================================================

-- 1. Chuẩn hóa tên loại giao dịch cũ còn tồn tại trong database (nếu có)
UPDATE debt_transactions
SET transaction_type = 'PAYMENT'
WHERE transaction_type = 'DEBT_PAYMENT';

UPDATE debt_transactions
SET transaction_type = 'VOID'
WHERE transaction_type = 'DEBT_REVERSAL';

-- 2. Đảm bảo các chỉ mục (indexes) phục vụ tra cứu tenant, khách hàng & đơn hàng
CREATE INDEX IF NOT EXISTS idx_debt_tx_business_customer
    ON debt_transactions (business_id, customer_id);

CREATE INDEX IF NOT EXISTS idx_debt_tx_business_order
    ON debt_transactions (business_id, sales_order_id);

-- 3. Chỉ mục tối ưu cho truy vấn lịch sử công nợ theo thời gian
CREATE INDEX IF NOT EXISTS idx_debt_tx_bus_cust_date
    ON debt_transactions (business_id, customer_id, transaction_date DESC, id DESC);

-- 4. Ràng buộc duy nhất business_id + transaction_code chống duplicate
-- Lưu ý: JPA ddl-auto=update đã tự động quản lý constraint uk_debt_transactions_business_code.
-- Câu lệnh dưới đây dành cho môi trường chạy DDL script thuần:
-- ALTER TABLE debt_transactions 
--     ADD CONSTRAINT uk_debt_transactions_business_code UNIQUE (business_id, transaction_code);
