# Prompt 3 — repository review

Cập nhật lần cuối: 2026-10-27. Project root: `C:\p3`.

## Inventory

Project có source `services/`, `lib/`, `proto/`, Docker Compose, hướng dẫn và các tài liệu nghiệp vụ/test. Đã rà soát toàn bộ workbook `.xlsx`:

- `25_TestCases_5_BoundedContexts.xlsx` có sheet `25 Test Cases`, 25 case từ `TC-IAM-01` tới `TC-SHP-05`.
- `API_Specification_Ecommerce_MVP.xlsx` có sheet API Specification.
- `Customer_Business_Functional_Requirements_Traceability.xlsx` có các sheet Customer Requirements, Business Requirements, Requirements Traceability.
- `Functional_Requirements_Ecommerce_MVP.xlsx` có sheet Functional Requirements.
- `Use_Cases_Ecommerce_MVP.xlsx` có sheet Use Cases.
- Bốn workbook ngoài TestCases 5 không chứa danh sách testcase mã `TC-...`; không tìm thấy TestCases workbook 6–9.

## Kiến trúc quan sát trong source

Có sáu app service: Gateway, Auth, Customer, Product, Order, Shipment. Auth/Customer/Order dùng PostgreSQL riêng; Product/Shipment dùng MongoDB riêng. Gateway cung cấp REST/JWT và dùng Redis. Order gọi Customer/Product qua gRPC và gửi `OrderCreated` qua Outbox/Kafka; Shipment consume và upsert theo `oid`. Contract nằm trong `proto/customer.proto` và `proto/product.proto`; runtime nạp bằng `@grpc/proto-loader`.

## Kiểm tra runtime mới nhất

| Mục | Kết quả |
|---|---|
| Compose | 13 container healthy; Gateway map host port 3001 tới container 3000. |
| Gateway health | `/api/health` trả `UP` cho Gateway, Auth, Customer, Product, Order, Shipment và Redis. |
| Random testcase workbook 5 | Rút thăm `TC-CUS-05`, gọi `GET /api/customers/8` không JWT; nhận 401 đúng expected. |
| Kafka | Topic `order-created` có 3 partition, replication factor 1. Diagnostic duplicate event được Shipment xử lý; MongoDB có một Shipment theo `oid=1247996705`. Đây không phải Order API end-to-end. |

## Giới hạn còn lại

Phiếu chưa thể hoàn tất các testcase 6–9 vì không có workbook nguồn tương ứng trong repository. `.env` chưa có discount policy được duyệt nên chưa xác minh tạo Order qua API rồi đối chiếu Outbox/Kafka/Shipment. Không tự đặt policy hoặc tạo expected result thay thế.

Xem checklist cuối tại `SCORING_CHECKLIST.md` và báo cáo chạy tại `TEST_EXECUTION_REPORT.md`.
