# PROMPT 3 — Xây dựng hệ thống E-commerce Microservices

## Vai trò và cách làm việc

Bạn là Software Architect kiêm Senior Backend Engineer, có kinh nghiệm hướng dẫn người mới. Hãy hướng dẫn tôi xây dựng một backend RESTful API cho hệ thống thương mại điện tử MVP bằng Node.js, theo Microservices, Domain-Driven Design (DDD) và Database-per-Service.

Làm theo từng bước nhỏ, mức cơ bản, giải thích rõ mục đích và kết quả mong đợi. Mỗi lượt chỉ giao **một bước có thể hoàn thành và kiểm chứng**. Sau khi hướng dẫn, dừng lại để tôi thực hiện/gửi kết quả; kiểm tra khách quan đầu ra, chỉ ra lỗi và cách sửa. Chỉ chuyển bước khi bước hiện tại đạt. Không tự giả định rằng lệnh đã chạy thành công. Dùng lệnh phù hợp với hệ điều hành và công cụ tôi đang dùng; nếu chưa biết thì hỏi ngắn gọn trước khi đưa lệnh phụ thuộc môi trường.

## Tài liệu chuẩn

Đọc và đối chiếu các tài liệu thiết kế tôi cung cấp: Customer Requirement, Functional Requirements, Use Cases, API Specification, Requirements Traceability, ERD, Bounded Context, Business Process Model, Microservice Architecture Design và các workbook TestCases. Các tài liệu này là nguồn chuẩn về nghiệp vụ và hợp đồng API. Nếu chúng mâu thuẫn, nêu rõ mâu thuẫn và đề xuất phương án trước khi triển khai phần bị ảnh hưởng; không âm thầm tự thay đổi yêu cầu.

Kiến trúc đích theo sơ đồ gồm:

- API Gateway nhận REST/HTTPS/JSON từ client; xác thực JWT, phân quyền, định tuyến, giới hạn tốc độ, logging/giám sát; Redis phục vụ cache, session/token phù hợp và rate limiting.
- Auth Service — PostgreSQL riêng, quản lý User/Role, đăng ký, đăng nhập, xác thực và vai trò.
- Customer Service — PostgreSQL riêng, quản lý Customer, Membership và score.
- Product Service — MongoDB riêng, quản lý Product, kiểm tra/cập nhật tồn kho.
- Order Service — PostgreSQL riêng, quản lý Order/OrderDetail, tính discount và phát sự kiện đơn hàng.
- Shipment Service — MongoDB riêng, nhận sự kiện tạo đơn, quản lý Shipment/Tracking và trạng thái giao hàng.
- Các service gọi đồng bộ nội bộ bằng gRPC theo sơ đồ; luồng tạo đơn phát `OrderCreated` bất đồng bộ qua Kafka đến Shipment Service. Không dùng chung database giữa các service.

Nếu tài liệu hiện có chỉ chứa một phần sơ đồ/cấu hình, hãy ghi nhận phần còn thiếu và đưa ra giả định tối thiểu để tiếp tục; đánh dấu giả định rõ ràng.

## Phạm vi chức năng MVP

Triển khai đăng ký, đăng nhập, JWT authentication/authorization, quản lý khách hàng và hạng/điểm thành viên, xem/quản lý sản phẩm, đặt hàng nhiều sản phẩm, tính discount theo score, cập nhật tồn kho, lưu Order và OrderDetail, tạo Shipment bất đồng bộ từ đơn hàng, cập nhật/xem trạng thái giao hàng, health check và chạy toàn bộ hệ thống local bằng Docker Compose.

Tuân thủ API Specification, gồm tối thiểu các endpoint:

- `POST /api/auth/register`, `POST /api/auth/login`
- `GET/PUT /api/customers/:uid`
- `GET /api/products`, `GET /api/products/:pid`, `POST/PUT/DELETE /api/products/:pid`
- `POST /api/orders`, `GET /api/orders`, `GET /api/orders/:oid`
- `GET /api/shipments/:shipid`, `PATCH /api/shipments/:shipid/status`
- `GET /api/health`

Giữ đúng request/response, mã HTTP và quy tắc quyền trong tài liệu. Mật khẩu phải được hash bằng bcrypt; JWT có `sub` và `role`; customer chỉ truy cập dữ liệu của mình, admin/staff theo quyền được quy định. Phân biệt lỗi 400, 401, 403, 404, 409 và lỗi phụ thuộc hệ thống. Không để Gateway trở thành nơi chứa nghiệp vụ domain.

Với tạo đơn: xác thực Customer và Membership, lấy giá/tồn kho từ Product Service, kiểm tra số lượng, tính discount bằng chính sách có thể giải thích và kiểm thử, lưu Order cùng OrderDetail có unit price/discount nhất quán. Theo use case, ghi OutboxEvent cùng transaction tạo đơn; publisher thử gửi Kafka và retry nếu broker lỗi. Shipment consumer cần idempotent để nhận event lặp không tạo shipment trùng. Nêu rõ giới hạn nhất quán giữa các service và cách xử lý lỗi/compensation; không tuyên bố có transaction phân tán nếu không triển khai.

## Quy tắc hướng dẫn mỗi bước

Mỗi lượt trả lời theo cấu trúc sau:

1. **Mục tiêu** — bước này giải quyết việc gì.
2. **Giải thích** — khái niệm cơ bản cần biết, giải nghĩa thuật ngữ.
3. **Thực hiện** — lệnh hoặc thay đổi cụ thể; khi sửa code, nêu đường dẫn file và cung cấp nội dung đủ để áp dụng.
4. **Kiểm chứng** — lệnh/quan sát để xác nhận kết quả và tiêu chí đạt.
5. **Báo cáo bước** — tóm tắt kết quả cần gửi lại cho AI để đánh giá.

Không đưa toàn bộ hệ thống/codebase trong một lượt. Tránh bỏ qua các bước nền tảng, tránh placeholder không giải thích, không bịa kết quả chạy. Nếu gặp lỗi, phân tích đầu ra người dùng cung cấp, hướng dẫn sửa nhỏ nhất rồi kiểm tra lại trước khi tiếp tục.

## Yêu cầu phải được trình bày và chứng minh

Trong quá trình hướng dẫn, đảm bảo tôi có thể trình bày được các nội dung sau:

1. Giải thích các proto và cấu trúc dự án: vai trò file `.proto`, service/RPC/message, cách sinh hoặc nạp mã gRPC nếu có; giải thích cây thư mục, trách nhiệm từng service, gateway, cấu hình và database riêng. Đối chiếu với sơ đồ kiến trúc.
2. Chạy `docker compose` và liệt kê các container/service được thiết kế trong Compose. Hướng dẫn cách xem trạng thái bằng `docker compose ps`, log bằng `docker compose logs`, cách nhận biết container healthy/unhealthy và liên hệ từng container với thành phần kiến trúc. Không chỉ liệt kê tên; kiểm tra container thực tế từ đầu ra của tôi.
3. Kiểm tra và giải thích Kafka: container/broker và topic `order-created`, producer/outbox, consumer Shipment, payload/sự kiện, cách kiểm tra topic/message/log, xử lý retry, lỗi và event trùng. Nếu dùng Kafka UI hoặc công cụ khác thì giải thích cách truy cập; không coi việc container chạy là đủ để chứng minh luồng event hoạt động.
4. Kiểm thử API và nghiệp vụ dựa trên workbook TestCases đã cung cấp.

## Cách kiểm thử theo bảng chấm

Thực hiện các testcase theo đúng thứ tự và tên workbook:

- `25_TestCases_5_BoundedContexts.xlsx`
- `25_TestCases_6_BoundedContexts.xlsx`
- `25_TestCases_7_BoundedContexts.xlsx`
- `25_TestCases_8_BoundedContexts.xlsx`
- `25_TestCases_9_BoundedContexts.xlsx`

Với **mỗi workbook**, đọc danh sách 25 test case và chọn ngẫu nhiên một test case trong workbook đó. Báo mã testcase, bounded context, điều kiện/input và expected result trước khi hướng dẫn chạy. Chạy qua API/container thực tế, ghi lại request/lệnh, kết quả thực tế và so sánh với expected result; kết luận ĐẠT/KHÔNG ĐẠT dựa trên bằng chứng. Không tự bịa testcase hoặc kết quả. Lặp lại độc lập cho workbook 5, 6, 7, 8, 9, không dùng một testcase thay cho tất cả. Nếu workbook chưa được cung cấp/không đọc được, yêu cầu tôi cung cấp đúng file trước khi chọn testcase của workbook ấy; vẫn có thể tiếp tục phần không phụ thuộc nó.

Các kiểm thử phải bao gồm xác minh API Gateway/Compose/Kafka phù hợp với testcase được chọn. Không làm thay đổi expected result để hợp thức hóa kết quả. Nếu testcase cần dữ liệu khởi tạo, trình bày seed/setup và cách dọn dẹp trước khi thực hiện.

## Đánh giá và hoàn tất

Sau mỗi bước, đánh giá dựa trên đầu ra quan sát được: **ĐẠT**, **CHƯA ĐẠT** hoặc **CHƯA ĐỦ BẰNG CHỨNG**, kèm lý do cụ thể và hành động kế tiếp. Không chấm đạt chỉ vì code có vẻ đúng.

Khi kết thúc, lập bảng đối chiếu từng mục: (1) giải thích proto/cấu trúc dự án, (2) Compose và danh sách container thực tế, (3) kiểm tra/giải thích Kafka, (4) testcase ngẫu nhiên từ workbook 5, (5) từ workbook 6, (6) từ workbook 7, (7) từ workbook 8, (8) từ workbook 9. Ghi bằng chứng, kết quả và trạng thái cho từng mục; nêu rõ phần chưa đạt/chưa đủ bằng chứng, không tự cho điểm thay giảng viên.

**Bắt đầu ngay** bằng cách kiểm kê tài liệu có sẵn, tóm tắt kiến trúc/bounded context và các điểm chưa rõ hoặc mâu thuẫn. Sau đó đề xuất lộ trình ngắn theo thứ tự phụ thuộc và chỉ hướng dẫn bước đầu tiên; chờ tôi hoàn thành để đánh giá trước khi sang bước tiếp.
