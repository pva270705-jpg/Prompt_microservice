# Giải thích kiến trúc Prompt 3

Project là backend E-commerce MVP Node.js theo microservice và database-per-service. Sơ đồ tham khảo nằm ở `Microservice-Architecture-Design.jpg`, `Bounded-Context.jpg` và `ERD.jpg`.

## Proto và giao tiếp nội bộ

- `proto/customer.proto` khai báo `CustomerService.GetMembershipScore`: Order gửi `uid`, nhận `mid`, `mname`, `score` để áp dụng discount.
- `proto/product.proto` khai báo `GetProduct`, `ReserveStock`, `ReleaseStock`: Order lấy thông tin sản phẩm và reserve/release tồn kho.
- `lib/grpc.js` nạp proto lúc runtime qua `@grpc/proto-loader`; repository không chứa mã gRPC đã generate.
- Customer gRPC chạy cổng nội bộ 50052, Product gRPC cổng 50053. Order là client của hai service.

## Cấu trúc và quyền sở hữu

| Thành phần | Trách nhiệm | Lưu trữ |
|---|---|---|
| `services/gateway` | REST entry point, JWT/role, routing, rate limit và product cache | Redis hỗ trợ cache/rate limit |
| `services/auth` | đăng ký/đăng nhập, bcrypt, JWT, user/role | PostgreSQL riêng |
| `services/customer` | hồ sơ, membership và score; gRPC server | PostgreSQL riêng |
| `services/product` | sản phẩm, tồn kho; gRPC server | MongoDB riêng |
| `services/order` | Order/OrderDetail, discount config, Outbox, gRPC client và Kafka publisher | PostgreSQL riêng |
| `services/shipment` | nhận OrderCreated, Shipment/Tracking và trạng thái | MongoDB riêng |
| `lib/` | kết nối DB, HTTP middleware, gRPC, Kafka, cache | mã dùng chung |
| `docker-compose.yml` | khai báo app và hạ tầng local | 13 container tổng cộng |

Các service không dùng chung database. Gateway public trên host port 3001, container port 3000. Giao tiếp REST đi qua Gateway; Order dùng gRPC cho Customer/Product; Kafka chuyển OrderCreated bất đồng bộ đến Shipment.

## Tạo đơn và giới hạn nhất quán

Order reserve stock ở Product rồi ghi Order, OrderDetail, OutboxEvent trong transaction PostgreSQL. Publisher gửi Outbox tới topic `order-created`; Shipment consumer upsert theo `oid` để chịu được event lặp. Product và Order thuộc hai database nên không có distributed transaction; compensation release stock là best-effort. Source hiện không có DLQ.

`DISCOUNT_RULES_JSON` trong `.env` chưa được thiết lập bằng policy được phê duyệt. Order API cần policy hợp lệ để tạo đơn; không suy đoán ngưỡng membership hay tỷ lệ discount từ source.

## Compose và bằng chứng runtime

Compose khai báo 6 app service, 5 database, Redis và Kafka. Lần kiểm tra ghi trong `TEST_EXECUTION_REPORT.md`: 13 container healthy và `GET http://localhost:3001/api/health` trả `UP`. Xem lệnh và giải thích trạng thái tại `PRACTICAL_EXAM_GUIDE.md`.
