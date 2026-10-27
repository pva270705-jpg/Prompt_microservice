# E-commerce Microservices MVP

Node.js MVP triển khai theo tài liệu ở thư mục gốc: API Gateway, Auth, Customer, Product, Order và Shipment; DDD theo bounded context; mỗi service sở hữu database riêng. Gateway cung cấp REST, gọi REST đến backend và dùng JWT để xác thực/phân quyền. Order gọi Customer và Product đồng bộ qua gRPC; Order phát `OrderCreated` qua Kafka bằng Outbox, Shipment tiêu thụ bất đồng bộ và xử lý idempotent.

## Chạy local

Cần Docker Desktop có Docker Compose. Tại thư mục này:

```powershell
Copy-Item .env.example .env
# Sửa .env và đặt JWT_SECRET / ADMIN_PASSWORD riêng cho môi trường của bạn.
# Điền DISCOUNT_RULES_JSON theo chính sách discount gốc trước khi thử tạo Order.
docker compose up --build -d
docker compose ps
docker compose logs -f gateway auth-service customer-service product-service order-service shipment-service kafka
```

Gateway lắng nghe tại `http://localhost:3001` (host) và `3000` (container). Kiểm tra `GET /api/health`; trạng thái tổng hợp health endpoint của backend và Redis. Compose app healthcheck kiểm tra dependency của từng service. Dừng bằng `docker compose down`; thêm `-v` sẽ xóa dữ liệu database local.

Các container trong Compose: `gateway`, `auth-service`, `auth-db`, `customer-service`, `customer-db`, `product-service`, `product-db`, `order-service`, `order-db`, `shipment-service`, `shipment-db`, `redis`, `kafka`. Mỗi database phục vụ một service duy nhất. Tài khoản Admin local được tạo khi khởi động Auth nếu có `ADMIN_USERNAME`/`ADMIN_PASSWORD` trong environment; Compose cung cấp giá trị mặc định phục vụ học tập. Đổi các giá trị trước khi dùng ngoài máy local.

## Thử luồng cơ bản

Ví dụ PowerShell dùng `Invoke-RestMethod`:

```powershell
$customer = Invoke-RestMethod http://localhost:3001/api/auth/register -Method Post -ContentType 'application/json' -Body '{"username":"demo","password":"DemoPass123","email":"demo@example.com"}'
$login = Invoke-RestMethod http://localhost:3001/api/auth/login -Method Post -ContentType 'application/json' -Body '{"username":"demo","password":"DemoPass123"}'
$token = $login.accessToken
$headers = @{ Authorization = "Bearer $token" }
Invoke-RestMethod http://localhost:3001/api/customers/$($customer.uid) -Headers $headers
```

Đăng nhập Admin bằng thông tin `.env`, tạo sản phẩm qua `POST /api/products` với `Authorization: Bearer <admin-token>` và JSON `{"pname":"Laptop","price":1500,"quantity":10}`. Sau đó tạo đơn bằng customer token: `POST /api/orders`, body `{"items":[{"pid":1,"qty":2}]}`. Xem kết quả consumer ở `docker compose logs -f shipment-service`; shipment ID của ví dụ hiện được cấp bằng `oid + 5000`. Kiểm tra shipment qua `GET /api/shipments/{shipid}`.

## API và dữ liệu

Các endpoint công khai ở Gateway: `POST /api/auth/register`, `POST /api/auth/login`, `GET/PUT /api/customers/:uid`, `GET /api/products`, `GET /api/products/:pid`, `POST/PUT/DELETE /api/products/:pid` (Admin), `POST/GET /api/orders`, `GET /api/orders/:oid`, `GET /api/shipments/:shipid`, `PATCH /api/shipments/:shipid/status` (ShipmentStaff/Admin), `GET /api/health`.

Auth hash mật khẩu bằng bcrypt và phát JWT một giờ có `sub`/`role`. Customer được tạo hồ sơ cơ bản sau đăng ký. Mã hiện seed các mức Bronze (score 0), Silver (100), Gold (500); chưa có tài liệu nghiệp vụ trong repository để xác nhận các ngưỡng này. Tỷ lệ discount không được hard-code nữa: Order đọc `DISCOUNT_RULES_JSON`. Cấu hình phải lấy từ chính sách được giao; nếu thiếu hoặc sai định dạng, tạo Order trả `503` thay vì áp dụng tỷ lệ tự giả định.

`DISCOUNT_RULES_JSON` là một JSON array gồm các object có `minScore` (số nguyên không âm) và `discountPercent` (số từ 0 đến 100), cần có rule `minScore: 0`. Đặt các giá trị được duyệt trong `.env`; file `.env.example` chỉ để trống cấu hình để tránh đưa ra chính sách giả. Admin mới được phép cập nhật membership tier; customer chỉ cập nhật thông tin hồ sơ của chính mình.

ERD gốc gom nhiều bounded context trong một sơ đồ. Bản triển khai phân tách User/Role, Customer/Membership, Order/OrderDetail vào ba PostgreSQL riêng; Product/Inventory và Shipment/Tracking vào hai MongoDB riêng. Quan hệ giữa database khác service chỉ lưu ID, không tạo cross-database foreign key. Product API dùng PID số tăng dần, tương thích với OrderDetail trong ERD.

## Proto, gRPC và cấu trúc mã

`proto/customer.proto` định nghĩa package `ecommerce.customer.v1`, service `CustomerService`, RPC `GetMembershipScore` và message request/reply. `proto/product.proto` định nghĩa `GetProduct`, `ReserveStock`, `ReleaseStock` của `ProductService`. Các file này là hợp đồng kiểu dữ liệu giữa service; runtime nạp proto bằng `@grpc/proto-loader` trong `lib/grpc.js`, nên không cần tạo mã sinh trước khi chạy. Customer phục vụ cổng 50052, Product cổng 50053; các cổng chỉ dùng trong mạng Compose.

```tex
services/       gateway, auth, customer, product, order, shipment (mỗi bounded context có entrypoint)
lib/            bootstrap HTTP, kết nối database, Kafka và nạp/khởi tạo gRPC
proto/          hợp đồng RPC nội bộ
docker-compose.yml  service, database, broker, healthcheck, volume và mạng local
```

## Kafka và Outbox

Topic: `order-created`. Order ghi Order, OrderDetail và OutboxEvent trong cùng transaction PostgreSQL; publisher đọc các event chưa publish, gửi Kafka rồi đánh dấu đã gửi. Nếu gửi lỗi, bản ghi vẫn pending để lần polling tiếp retry. Shipment consumer kiểm tra `eventType`/`oid` và upsert theo `oid` duy nhất nên event lặp không tạo shipment thứ hai.

Quan sát broker và topic:

```powershell
docker compose exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server kafka:9092 --lis
docker compose exec kafka /opt/kafka/bin/kafka-console-consumer.sh --bootstrap-server kafka:9092 --topic order-created --from-beginning --timeout-ms 5000
docker compose logs -f order-service shipment-service kafka
```

## Giới hạn MVP cần biế

- Dự trữ kho và ghi đơn thuộc hai service/database. Mã hiện tại bù tồn kho khi transaction tạo đơn lỗi, nhưng nếu tiến trình chết sau khi giảm kho mà trước khi ghi đơn thì có thể cần đối soát thủ công; production nên bổ sung saga/reservation có timeout và retry bền vững.
- Tên/role token được so sánh chính xác (`Admin`, `ShipmentStaff`). Admin bootstrap không đổi mật khẩu một tài khoản đã tồn tại; quản lý credential ngoài Compose khi triển khai.
- Tốc độ giới hạn mặc định 100 request/phút/IP, dùng Redis counter khi Redis hoạt động; fallback memory chỉ dành cho local phát triển.
- Hồ sơ nguồn hiện có trong workspace gồm tài liệu `.doc`, các workbook yêu cầu/API/use case/traceability, sơ đồ và workbook `25_TestCases_5_BoundedContexts.xlsx`. Workbook số 6–9 chưa có trong thư mục nên các mục tương ứng trên phiếu chưa thể chạy. Kết quả kiểm chứng hiện tại được ghi tại `docs/SCORING_CHECKLIST.md`.


\n