# HBDT-52 — Low-stock Alert

## Mục tiêu

Hệ thống cho phép chủ hộ cấu hình ngưỡng tồn kho tối thiểu cho từng sản phẩm,
tự phát hiện sản phẩm sắp hết và thông báo cho người dùng thuộc cùng hộ kinh doanh.

## Quy tắc nghiệp vụ

- `minimum_stock = null`: sản phẩm chưa được theo dõi.
- `quantity_on_hand < minimum_stock`: cảnh báo ở trạng thái `ACTIVE`.
- `quantity_on_hand >= minimum_stock`: cảnh báo hiện tại chuyển thành `RESOLVED`.
- Mỗi sản phẩm chỉ có một cảnh báo `ACTIVE`; các lần kiểm tra tiếp theo chỉ cập nhật
  số lượng và thời điểm phát hiện gần nhất.
- Database có unique key cho bản ghi `ACTIVE`, bảo vệ cả trường hợp hai giao dịch
  đồng thời cùng phát hiện tồn kho thấp.
- Lịch sử cảnh báo đã xử lý được giữ lại để truy vết.
- Owner và Employee được xem cảnh báo; chỉ Owner được cấu hình ngưỡng.

## Điểm kích hoạt tự động

Việc đánh giá tồn kho được chạy trong cùng transaction với:

1. Nhập kho.
2. Xuất kho, bao gồm xuất kho từ đơn bán hàng.
3. Hoàn kho khi hủy đơn.
4. Điều chỉnh số lượng trực tiếp từ chức năng quản lý sản phẩm.
5. Thay đổi ngưỡng tồn kho tối thiểu.

Nếu transaction kho thất bại, cảnh báo và notification cũng không được lưu.

## API

| Method | Endpoint | Quyền | Mục đích |
|---|---|---|---|
| `GET` | `/api/inventory/low-stock/alerts` | Owner, Employee | Cảnh báo đang hoạt động |
| `GET` | `/api/inventory/low-stock/alerts?includeResolved=true` | Owner, Employee | Cả lịch sử đã xử lý |
| `GET` | `/api/inventory/low-stock/summary?limit=5` | Owner, Employee | Widget tổng quan |
| `GET` | `/api/inventory/low-stock/thresholds` | Owner | Danh sách cấu hình |
| `PUT` | `/api/inventory/low-stock/thresholds/{productId}` | Owner | Đặt/cập nhật ngưỡng |
| `GET` | `/api/notifications` | Owner, Employee | Danh sách notification |
| `GET` | `/api/notifications/unread-count` | Owner, Employee | Số notification chưa đọc |
| `PATCH` | `/api/notifications/{id}/read` | Owner, Employee | Đánh dấu đã đọc |
| `GET` | `/api/notifications/stream` | Owner, Employee | Luồng SSE realtime |

Ví dụ cập nhật ngưỡng:

```json
{
  "minimumStock": 10
}
```

## Cập nhật database

Production dùng `spring.jpa.hibernate.ddl-auto=validate`, vì vậy phải chạy trước:

```text
Code/Server/database/migration_low_stock_alert.sql
```

Migration thêm `products.minimum_stock` và bảng `inventory_alerts`. Không sửa hay
xóa dữ liệu tồn kho hiện tại.

## Giao diện

- Owner: `/owner/inventory-alerts` — xem cảnh báo, lịch sử và sửa ngưỡng.
- Employee: `/employee/inventory-alerts` — chỉ xem cảnh báo.
- Dữ liệu tự làm mới mỗi 30 giây và cập nhật ngay khi nhận SSE notification.
- Tìm kiếm hỗ trợ tên tiếng Việt có dấu hoặc không dấu và mã sản phẩm.
- Danh sách có thể sắp xếp theo mức thiếu, thời gian phát hiện hoặc tên sản phẩm.
- Mỗi thẻ hiển thị tồn thực tế, ngưỡng, lượng thiếu và mức độ nghiêm trọng.
- Danh sách dài được phân trang 9 cảnh báo mỗi trang.
- Chuông thông báo trong sidebar hiển thị số chưa đọc, cập nhật realtime và cho phép
  đánh dấu từng thông báo hoặc toàn bộ thông báo là đã đọc.
- Một layout chỉ mở một kết nối SSE. Dashboard nhận sự kiện nội bộ từ chuông thông báo,
  tránh tạo nhiều kết nối trùng lặp.

## Kiểm thử tự động

Backend sử dụng JUnit 5, Mockito, AssertJ và Jakarta Bean Validation. Các nhóm test
HBDT-52 bao phủ vòng đời cảnh báo, chống trùng, API controller, validation, phân quyền,
notification theo đúng business/user và đánh dấu đã đọc.

```powershell
cd Code/Server
mvn -q '-DargLine=-Dnet.bytebuddy.experimental=true' test
```

Frontend dùng Node test runner cho logic thuần, không thêm dependency test vào bundle:

```powershell
cd Code/Client/src/frontend
npm run test:low-stock
npm run build
```

Các ca frontend kiểm tra tìm kiếm không dấu, mức độ tồn kho, sắp xếp, phân trang,
validation ngưỡng và thống kê dashboard. Production build tiếp tục là cổng kiểm tra
TypeScript và khả năng render toàn bộ route.

## An toàn kết nối realtime

`spring.jpa.open-in-view=false` được cấu hình ở mức ứng dụng. Request SSE tồn tại lâu
không giữ JPA session hoặc JDBC connection trong suốt thời gian kết nối; mỗi service
tự khai báo transaction boundary. Điều này ngăn cạn Hikari connection pool khi nhiều
Owner/Employee mở ứng dụng đồng thời.

## Kiểm thử nhanh

1. Owner đặt ngưỡng của sản phẩm thành `10`.
2. Xuất kho để số lượng còn `9`; xác nhận có đúng một cảnh báo.
3. Xuất thêm lần nữa; xác nhận không sinh cảnh báo trùng.
4. Đăng nhập Employee; xác nhận xem được nhưng không có phần sửa ngưỡng.
5. Nhập kho để số lượng đạt `10`; xác nhận cảnh báo chuyển `RESOLVED`.
6. Mở lịch sử; xác nhận cảnh báo cũ vẫn còn.
