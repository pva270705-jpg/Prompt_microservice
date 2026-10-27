# Docker Compose verification

Ngày kiểm tra: 2026-10-27. Project: `C:\p3`.

Compose khai báo 13 container: Gateway, Auth, Auth DB, Customer, Customer DB, Product, Product DB, Order, Order DB, Shipment, Shipment DB, Redis và Kafka. Gateway host port 3001 ánh xạ tới container port 3000.

## Kết quả runtime

Lần kiểm tra mới nhất bằng `docker compose ps`: cả 13 container đang `Up` và `healthy`, gồm sáu app service, năm database, Redis và Kafka. Gateway `/api/health` trả `UP` cho Gateway, Auth, Customer, Product, Order, Shipment và Redis.

Các lệnh trình bày:

```powershell
docker compose ps
docker compose logs --tail=100 gateway auth-service customer-service product-service order-service shipment-service kafka
Invoke-RestMethod http://localhost:3001/api/health
docker compose config --quiet
```

Compose config hợp lệ; `node --check` trên service/lib đã qua trong lần kiểm tra trước. Runtime healthy không tự chứng minh mọi luồng nghiệp vụ; kết quả testcase và Kafka được ghi riêng ở `TEST_EXECUTION_REPORT.md` và `KAFKA_VERIFICATION.md`.
