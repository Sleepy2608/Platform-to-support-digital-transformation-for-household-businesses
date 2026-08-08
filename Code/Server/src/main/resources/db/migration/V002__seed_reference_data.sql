-- HBDT Platform
-- V002: immutable/reference data only. No local user or business data is stored here.

SET NAMES utf8mb4;

INSERT INTO `roles` (`id`, `role_code`, `role_name`, `description`) VALUES
  (1, 'ADMIN', 'Quản trị viên', 'Quản trị viên hệ thống'),
  (2, 'BUSINESS_OWNER', 'Chủ hộ kinh doanh', 'Chủ hộ kinh doanh'),
  (3, 'EMPLOYEE', 'Nhân viên', 'Nhân viên cửa hàng');

INSERT INTO `subscription_plans`
  (`id`, `plan_code`, `plan_name`, `monthly_price`, `annual_price`, `description`, `status`)
VALUES
  (1, 'STANDARD', 'Gói Standard', 199000.00, 1990000.00, 'Gói tiêu chuẩn cho hộ kinh doanh.', 'ACTIVE'),
  (2, 'VIP', 'Gói VIP', 399000.00, 3990000.00, 'Gói nâng cao cho hộ kinh doanh.', 'ACTIVE');

INSERT INTO `report_templates`
  (`id`, `created_by`, `template_code`, `template_name`, `template_type`, `official_form_code`, `legal_basis`, `description`, `status`)
VALUES
  (1, NULL, 'S1-HKD', 'Sổ chi tiết doanh thu', 'ACCOUNTING_BOOK', 'S1-HKD', 'Thông tư số 88/2021/TT-BTC', 'Mẫu sổ doanh thu trong phạm vi học thuật được phê duyệt.', 'ACTIVE'),
  (2, NULL, 'S2-HKD', 'Sổ chi tiết vật liệu, dụng cụ, sản phẩm, hàng hóa', 'ACCOUNTING_BOOK', 'S2-HKD', 'Thông tư số 88/2021/TT-BTC', 'Mẫu sổ hàng hóa trong phạm vi học thuật được phê duyệt.', 'ACTIVE'),
  (3, NULL, 'S4-HKD', 'Sổ chi tiết nghĩa vụ thuế', 'ACCOUNTING_BOOK', 'S4-HKD', 'Thông tư số 88/2021/TT-BTC', 'Mẫu sổ thuế trong phạm vi học thuật được phê duyệt.', 'ACTIVE');

INSERT INTO `tax_types`
  (`id`, `tax_code`, `tax_name`, `description`, `status`)
VALUES
  (1, 'VAT', 'Thuế giá trị gia tăng', 'Nghĩa vụ thuế giá trị gia tăng.', 'ACTIVE'),
  (2, 'PIT', 'Thuế thu nhập cá nhân', 'Nghĩa vụ thuế thu nhập cá nhân.', 'ACTIVE'),
  (3, 'LICENSE_FEE', 'Lệ phí môn bài', 'Nghĩa vụ lệ phí môn bài.', 'ACTIVE'),
  (4, 'OTHER', 'Nghĩa vụ khác', 'Các nghĩa vụ thuế, phí khác thuộc phạm vi theo dõi.', 'ACTIVE');
