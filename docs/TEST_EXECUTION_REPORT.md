# Báo cáo thực thi Prompt 3

Ngày kiểm tra: 2026-10-27  |  Project: `C:\p3`

## Kết quả đối chiếu phiếu chấm

| STT | Hạng mục | Bằng chứng | Trạng thái |
|---:|---|---|---|
| 1 | Proto và cấu trúc dự án | `proto/customer.proto`, `proto/product.proto`, source trong `services/` và `lib/`; hướng dẫn tại `ARCHITECTURE_EXPLANATION.md` | Sẵn sàng trình bày |
| 2 | Compose và container | `docker compose ps`: 13 container đang chạy, app và dependency healthy; Gateway `/api/health` trả `UP` | PASS tại lần kiểm tra |
| 3 | Kafka | Topic `order-created`; Outbox publisher phát hai event có cùng `oid`; Shipment consumer lưu một shipment do upsert/idempotency | PASS cho luồng diagnostic Outbox → Kafka → Shipment; chưa phải Order API E2E |
| 4 | Chọn ngẫu nhiên testcase workbook 5 | `TC-CUS-05`, Customer & Membership, request không JWT; `GET /api/customers/8` trả HTTP 401, đúng expected | PASS |
| 5 | Workbook 6 | Không có file nguồn trong `C:\p3` | BLOCKED — thiếu workbook |
| 6 | Workbook 7 | Không có file nguồn trong `C:\p3` | BLOCKED — thiếu workbook |
| 7 | Workbook 8 | Không có file nguồn trong `C:\p3` | BLOCKED — thiếu workbook |
| 8 | Workbook 9 | Không có file nguồn trong `C:\p3` | BLOCKED — thiếu workbook |

## Kiểm tra bổ sung

- `TC-IAM-01`: đăng ký tài khoản hợp lệ trả HTTP 201; hồ sơ Customer được provision và truy vấn được.
- `TC-SHP-05`: diagnostic phát hai `OrderCreated` event cùng `oid=1247996705`; hai event được publish, Shipment chỉ lưu một document. Đây là kiểm tra idempotency qua Outbox/Kafka, không tạo Order qua `POST /api/orders`.
- Docker Compose gồm 13 service/container: Gateway, Auth, Auth DB, Customer, Customer DB, Product, Product DB, Order, Order DB, Shipment, Shipment DB, Redis, Kafka.

## Giới hạn còn lại

`.env` hiện chưa có `DISCOUNT_RULES_JSON` policy được phê duyệt. Order service từ chối tạo đơn khi thiếu policy; không tự đặt quy tắc discount. Vì vậy chưa có bằng chứng tạo Order qua API và đối chiếu Order thật → Kafka → Shipment. Workbook 6–9 cũng chưa có trong workspace nên không thể chọn testcase từ các file đó.

Các kiểm tra đã làm và hướng dẫn trình bày nằm trong `SCORING_CHECKLIST.md`, `PRACTICAL_EXAM_GUIDE.md`, `ARCHITECTURE_EXPLANATION.md` và `KAFKA_VERIFICATION.md`. `.env` không bị thay đổi.
