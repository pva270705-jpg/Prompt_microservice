# Hướng dẫn kiểm thử API Prompt 3

Base URL: `http://localhost:3001`. Các endpoint nghiệp vụ cần Bearer JWT, trừ register, login, health. Payload và expected result của từng route được mô tả theo implementation trong source.

## Testcase đã chạy

Rút thăm từ `25_TestCases_5_BoundedContexts.xlsx`:

- `TC-CUS-05`, Customer & Membership: không gửi JWT khi gọi `GET /api/customers/8`.
- Expected: `401 Unauthorized`.
- Actual: HTTP 401 tại Gateway. Kết luận: ĐẠT.

Kiểm tra bổ sung: `TC-IAM-01` đăng ký hợp lệ trả HTTP 201 và Customer profile được provision. Kafka diagnostic `TC-SHP-05` được ghi riêng trong `KAFKA_VERIFICATION.md`.

## Lệnh chạy testcase CUS-05

```powershell
Invoke-WebRequest -Uri http://localhost:3001/api/customers/8 -Method Get
```

PowerShell có thể ném exception cho HTTP 401; xem status code trong response exception.

## Các route chính

| Method/path | Quyền | Kết quả dự kiến |
|---|---|---|
| `POST /api/auth/register` | Public | 201 khi thông tin hợp lệ; 409 nếu trùng |
| `POST /api/auth/login` | Public | 200 và access token; 401 nếu sai thông tin |
| `GET/PUT /api/customers/:uid` | Chủ hồ sơ hoặc Admin | Đọc/cập nhật hồ sơ; không JWT 401 |
| `GET /api/products`, `GET /api/products/:pid` | JWT | Danh sách/chi tiết; 404 nếu thiếu |
| `POST/PUT/DELETE /api/products/:pid` | Admin | Tạo/cập nhật/xóa Product |
| `POST /api/orders` | Customer JWT | Tạo Order khi dependencies và discount policy hợp lệ |
| `GET /api/orders`, `GET /api/orders/:oid` | JWT/owner | Đọc đơn theo quyền |
| `GET /api/shipments/:shipid` | Chủ shipment/Admin/ShipmentStaff | Đọc trạng thái giao hàng |
| `PATCH /api/shipments/:shipid/status` | Admin/ShipmentStaff | Cập nhật trạng thái |
| `GET /api/health` | Public | Health tổng hợp |

Không chạy Order API khi `DISCOUNT_RULES_JSON` chưa có policy được phê duyệt; service trả 503 nếu policy thiếu. Không coi expected result trong bảng là bằng chứng testcase đã chạy nếu không có kết quả HTTP thực tế.
