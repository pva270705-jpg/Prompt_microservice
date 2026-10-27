# Testcase workbook status — Prompt 3

Ngày cập nhật: 2026-10-27.

Đã kiểm tra tất cả workbook `.xlsx` trong `C:\p3`, gồm tên sheet và nội dung shared strings. Chỉ `25_TestCases_5_BoundedContexts.xlsx` có danh sách 25 mã `TC-...`. Các workbook khác chứa API, requirements, traceability và use cases; không có các bộ TestCases 6–9.

| Workbook | Có trong project | Mã testcase | Đã chạy / trạng thái |
|---|---:|---|---|
| `25_TestCases_5_BoundedContexts.xlsx` | Có | 25 testcase | Rút thăm `TC-CUS-05`, HTTP 401 đúng expected — PASS |
| `25_TestCases_6_BoundedContexts.xlsx` | Không | Không có nguồn | BLOCKED |
| `25_TestCases_7_BoundedContexts.xlsx` | Không | Không có nguồn | BLOCKED |
| `25_TestCases_8_BoundedContexts.xlsx` | Không | Không có nguồn | BLOCKED |
| `25_TestCases_9_BoundedContexts.xlsx` | Không | Không có nguồn | BLOCKED |

Không thay thế workbook thiếu bằng testcase tự tạo. Xem `SCORING_CHECKLIST.md` để đối chiếu toàn bộ phiếu.
