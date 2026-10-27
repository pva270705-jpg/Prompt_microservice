# Hướng dẫn trình bày thực hành Prompt 3

## 1. Proto và kiến trúc

Trình bày hai proto: Customer cung cấp RPC lấy membership score; Product cung cấp RPC đọc sản phẩm và reserve/release stock. `lib/grpc.js` nạp contract lúc runtime bằng `@grpc/proto-loader`. Chỉ ra sáu service trong `services/`, thư viện chung `lib/`, hợp đồng tại `proto/`, database riêng và sơ đồ trong các file ảnh ở root. Chi tiết nằm trong `ARCHITECTURE_EXPLANATION.md`.

## 2. Compose

Tại terminal ở `C:\p3` chạy:

```powershell
docker compose ps
docker compose logs --tail=100 gateway order-service shipment-service kafka
Invoke-RestMethod http://localhost:3001/api/health
```

Compose có 13 container: sáu app, năm database, Redis và Kafka. `healthy` nghĩa healthcheck của container đạt; health API Gateway kiểm tra các dependency ứng dụng.

## 3. Kafka

Topic là `order-created`. Order dùng transactional Outbox và publisher; Shipment consume rồi upsert theo `oid`. Lần diagnostic đã gửi hai event lặp và chỉ có một Shipment document. Nói rõ đây là diagnostic từ Outbox, không phải Order tạo qua API. Lệnh topic và phần giới hạn được ghi trong `KAFKA_VERIFICATION.md`.

## 4. Testcase từ workbook 5

Đã rút thăm một testcase trong file `25_TestCases_5_BoundedContexts.xlsx`:

- Mã: `TC-CUS-05`; bounded context: Customer & Membership.
- Input: gọi API không gửi JWT.
- Lệnh: `Invoke-WebRequest -Uri http://localhost:3001/api/customers/8 -Method Get`.
- Expected: HTTP 401 Unauthorized.
- Actual: HTTP 401 Unauthorized.
- Kết luận: ĐẠT.

Workbook 5 có thêm `TC-SHP-05`; diagnostic event trùng và Shipment upsert đã cho một Shipment duy nhất. `TC-IAM-01` đăng ký hợp lệ cũng đã trả 201 trong kiểm tra bổ sung.

## 5–8. Workbook 6–9

Các file `25_TestCases_6_BoundedContexts.xlsx` đến `_9_` hiện không có trong `C:\p3`. Phiếu chấm yêu cầu đọc từng workbook và rút thăm riêng một test case; không thể tạo testcase hoặc expected result thay thế. Cần đặt đúng bốn file vào project rồi chọn/chạy mỗi file độc lập.

## Điều kiện chạy Order

Không tạo Order qua API khi `DISCOUNT_RULES_JSON` chưa có policy được phê duyệt. Không sửa `.env` bằng tỷ lệ discount giả. Khi có policy, chạy testcase Order đúng workbook và đối chiếu cùng `oid` qua Outbox, Kafka consumer và Shipment.
