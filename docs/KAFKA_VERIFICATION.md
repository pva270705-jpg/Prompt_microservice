# Kiểm chứng Kafka

Ngày kiểm tra: 2026-10-27  |  Project: `C:\p3`

## Kiến trúc luồng

Order Service ghi Order, OrderDetail và OutboxEvent trong cùng transaction PostgreSQL. Publisher gửi event `OrderCreated` đến topic `order-created`; Shipment Service thuộc consumer group `shipment-service-v1` nhận event và upsert Shipment theo `oid`. Nếu publish bị lặp, khóa `oid` giúp không tạo shipment trùng. Không có distributed transaction giữa Product và Order; việc reserve/release stock là compensation best-effort. Source không khai báo DLQ.

## Kết quả đã quan sát

- Kafka container healthy; topic `order-created` tồn tại.
- Diagnostic tạo hai Outbox record có cùng event và `oid=1247996705`.
- Publisher đánh dấu cả hai record đã publish.
- Shipment consumer xử lý event; MongoDB chỉ có một Shipment document cho `oid` đó.
- Đây là kiểm tra Outbox → Kafka → consumer → Shipment và idempotency. Không tạo đơn qua API, vì vậy không được trình bày như Order API end-to-end.

## Lệnh để trình bày

Chạy từ `C:\p3`:

```powershell
docker compose ps
docker compose logs --tail=100 order-service shipment-service kafka
docker compose exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server kafka:9092 --describe --topic order-created
Invoke-RestMethod http://localhost:3001/api/health
```

Để chứng minh end-to-end từ nghiệp vụ, cần có `DISCOUNT_RULES_JSON` lấy từ policy được duyệt, tạo Order hợp lệ qua Gateway, rồi đối chiếu cùng `oid` trong Order/Outbox, message Kafka, log consumer và Shipment. Không tự điền discount policy.
