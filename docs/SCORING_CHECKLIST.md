# Bằng chứng chuẩn bị phiếu chấm Prompt 3

Ngày cập nhật: 2026-10-27. Project root: `C:\p3`.

## Tình trạng từng dòng phiếu

| STT | Hạng mục | Bằng chứng trong project hiện tại | Trạng thái |
|---:|---|---|---|
| 1 | Giải thích proto và cấu trúc dự án | `proto/customer.proto`, `proto/product.proto`, `README.md`, `docs/ARCHITECTURE_EXPLANATION.md`; xem ghi chú bên dưới | Sẵn sàng trình bày |
| 2 | Compose và danh sách container | `docker compose ps` trả 13 service/container; app, database, Redis, Kafka healthy; Gateway `/api/health` trả `UP` | PASS tại lần kiểm tra 2026-10-27 |
| 3 | Kiểm tra và giải thích Kafka | Topic `order-created`; hai bản ghi Outbox cùng event được publisher phát; Shipment consumer tạo đúng một document cho `oid=1247996705` | PASS cho Outbox→Kafka→Shipment diagnostic; chưa phải Order API end-to-end |
| 4 | Rút thăm một testcase workbook số 5 | Rút thăm `TC-CUS-05`; GET `/api/customers/8` không JWT trả 401 đúng expected. Bổ sung: `TC-IAM-01` trả 201; diagnostic `TC-SHP-05` hai event chỉ tạo một Shipment | PASS cho testcase rút thăm và kiểm tra bổ sung |
| 5 | Một testcase từ workbook số 6 | Không tìm thấy workbook nguồn trong `C:\p3` | BLOCKED |
| 6 | Một testcase từ workbook số 7 | Không tìm thấy workbook nguồn trong `C:\p3` | BLOCKED |
| 7 | Một testcase từ workbook số 8 | Không tìm thấy workbook nguồn trong `C:\p3` | BLOCKED |
| 8 | Một testcase từ workbook số 9 | Không tìm thấy workbook nguồn trong `C:\p3` | BLOCKED |

Workbook số 5 có trong workspace. Testcase được chọn ngẫu nhiên bằng `Get-Random` từ 25 dòng. Workbook 6–9 chưa có trong workspace; không tạo testcase hoặc expected result thay thế.

## Giải thích nhanh proto và kiến trúc

- `proto/customer.proto`: package `ecommerce.customer.v1`, RPC `GetMembershipScore`; Order gửi `uid`, nhận `mid`, `mname`, `score`.
- `proto/product.proto`: Product RPC `GetProduct`, `ReserveStock`, `ReleaseStock`; Order lấy snapshot giá/tồn và giữ/hoàn kho bằng gRPC.
- `lib/grpc.js` nạp file proto lúc chạy bằng `@grpc/proto-loader`; không cần generated source.
- `services/` chia theo Gateway, Auth, Customer, Product, Order, Shipment; `lib/` chứa bootstrap dùng chung; mỗi bounded context sở hữu database riêng.
- Auth/Customer/Order dùng PostgreSQL; Product/Shipment dùng MongoDB; Redis phục vụ Gateway cache/rate-limit; Kafka chuyển `OrderCreated` tới Shipment.

## Compose và Kafka

Chạy từ `C:\p3`:

```powershell
docker compose ps
docker compose logs --tail=100 gateway auth-service customer-service product-service order-service shipment-service kafka
Invoke-RestMethod http://localhost:3001/api/health
docker compose exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server kafka:9092 --describe --topic order-created
```

Lần kiểm tra thực tế có 13 container healthy và `/api/health` trả `UP` cho Gateway, Auth, Customer, Product, Order, Shipment và Redis.

Kafka diagnostic đã gửi hai bản ghi Outbox cho cùng `oid=1247996705`. Order publisher đánh dấu cả hai đã publish; Shipment consumer nhận event và MongoDB chỉ có một Shipment document cho `oid` đó. Đây là kiểm tra Outbox/Kafka/consumer/idempotency; nó không tạo Order qua API.

## Điều kiện còn thiếu để thử Order API

`DISCOUNT_RULES_JSON` trong `.env` hiện chưa được cấu hình. Order service chủ động trả `503` khi chưa có policy hợp lệ, tránh tự đặt phần trăm giảm giá không có trong yêu cầu. Cần lấy bảng discount đã được duyệt trước khi chạy các testcase Order cần tạo đơn hoặc đánh giá discount. Không điền policy giả vào `.env`.

TC-SHP-05 đã để lại dữ liệu diagnostic trong local Order Outbox và Shipment MongoDB với `oid=1247996705`. Tài khoản đăng ký để thử TC-IAM-01 cũng còn trong local database; không có password/token nào được lưu vào tài liệu này.

\n