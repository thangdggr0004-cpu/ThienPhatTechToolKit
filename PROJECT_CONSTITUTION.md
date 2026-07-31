# Enterprise Windows Diagnostic Platform - Project Constitution

| Attribute | Value |
| :--- | :--- |
| **Document Name** | Project Constitution |
| **Version** | 2.0 |
| **Status** | ACTIVE |
| **Architecture State** | LOCKED |
| **Owner** | Project Architecture Authority |
| **Last Updated** | 2026-07-26 |

---

## Lời nói đầu

Tài liệu này, **"Hiến pháp Dự án"**, là văn bản có thẩm quyền cao nhất, quy định các nguyên tắc, quy tắc và tiêu chuẩn bất biến cho dự án **Enterprise Windows Diagnostic Platform**. Mọi thành viên trong nhóm phát triển bắt buộc phải đọc và tuân thủ nghiêm ngặt toàn bộ nội dung của tài liệu này.

Mục tiêu của tài liệu này là duy trì tầm nhìn và các nguyên tắc kiến trúc nền tảng của dự án.

---

## 1. Bộ Tài liệu Dự án (Project Documentation Suite)

Hiến pháp này là một phần của một bộ tài liệu Enterprise. Để có cái nhìn toàn diện, hãy tham khảo các tài liệu sau trong thư mục `.ai/`:

- **`ARCHITECTURE.md`**: Mô tả chi tiết kiến trúc hệ thống và luồng dữ liệu.
- **`ROADMAP.md`**: Lộ trình phát triển các Phase của dự án.
- **`PHASE_STATUS.md`**: Trạng thái đóng băng (Lock Status) của từng Phase.
- **`CODING_STANDARD.md`**: Các tiêu chuẩn và quy tắc viết mã.
- **`QUALITY_GATE.md`**: Các tiêu chí về chất lượng và kiểm thử.
- **`DEVELOPER_WORKFLOW.md`**: Quy trình làm việc được đề xuất.

## 2. Tầm nhìn Dự án (Project Vision)

Xây dựng một nền tảng chẩn đoán hệ thống Windows đẳng cấp thế giới, có khả năng cung cấp các đánh giá chính xác và đề xuất các hành động khắc phục hữu ích. Hệ thống phải được điều khiển bởi một bộ quy tắc (rule-driven) linh hoạt, dựa trên một cơ chế thu thập bằng chứng (evidence-based) đáng tin cậy, và có kiến trúc mở để dễ dàng bảo trì và mở rộng trong tương lai.

## 3. Nguyên tắc Thiết kế Doanh nghiệp (Enterprise Design Principles)

- **Độ tin cậy & Bền vững (Reliability & Resilience):** Hệ thống phải hoạt động ổn định, xử lý lỗi một cách mượt mà và có khả năng tự phục hồi.
- **Khả năng Mở rộng (Scalability & Extensibility):** Kiến trúc phải cho phép dễ dàng thêm các Collector, Engine và bộ quy tắc mới mà không cần sửa đổi các module cốt lõi đã tồn tại.
- **Bảo mật (Security):** Mọi tương tác phải được ủy quyền và kiểm soát thông qua lớp Backend an toàn.
- **Khả năng Bảo trì (Maintainability):** Mã nguồn phải sạch, có cấu trúc rõ ràng, và tuân thủ các tiêu chuẩn chung.

## 4. Nguyên tắc Kiến trúc (Architecture Principles)

- **Phân tách Trách nhiệm (Separation of Concerns - SoC):** Các lớp kiến trúc (UI, Backend, Core Logic) phải được phân tách rõ ràng.
- **Thiết kế Module hóa (Modularity):** Hệ thống được xây dựng từ các module độc lập, có khả năng thay thế và tái sử dụng cao.
- **Điều khiển bởi Dữ liệu (Data-Driven):** Hành vi của hệ thống phải được quyết định bởi các cấu hình và bộ quy tắc bên ngoài.
- **Giao tiếp Bất đồng bộ (Asynchronous Communication):** Sử dụng cơ chế giao tiếp không đồng bộ để đảm bảo giao diện người dùng luôn phản hồi nhanh chóng.

## 5. Quy tắc Đóng băng Tính năng (Feature Freeze Rules)

- Các module được đánh dấu `LOCKED` trong **`PHASE_STATUS.md`** được coi là đã ổn định.
- **Nghiêm cấm** thêm bất kỳ tính năng mới nào vào một module đã bị đóng băng.
- Việc sửa lỗi (bug fix) được cho phép nhưng phải trải qua một quy trình review nghiêm ngặt.

## 6. Quy tắc Hợp đồng Công khai (Public Contract Rules)

- Hợp đồng Công khai (Public Contract) được định nghĩa bởi các API được expose thông qua `preload.js`.
- Hợp đồng này là **bất biến (immutable)**. Không được phép thay đổi nếu không có kế hoạch nâng cấp phiên bản lớn và kế hoạch di dời rõ ràng.

## 7. Quy tắc về các Engine Cốt lõi (Core Engine Principles)

- Mỗi Engine (Collector, Decision, Confidence, etc.) phải là một module độc lập với một trách nhiệm duy nhất.
- Các Engine xử lý dữ liệu (Decision, Confidence) phải là các hàm thuần túy (pure functions) và không trạng thái (stateless).
- Chi tiết về từng Engine được mô tả trong **`ARCHITECTURE.md`**.

## 8. Kiến trúc Sạch & SOLID (Clean Architecture & SOLID)

- Luồng phụ thuộc phải luôn hướng vào trong. Các lớp lõi không được phép phụ thuộc vào các lớp ngoài.
- Các nguyên tắc Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, và Dependency Inversion phải được tuân thủ nghiêm ngặt.

## 9. Chính sách Thay đổi Kiến trúc (Architecture Change Policy)

- Mọi đề xuất thay đổi có ảnh hưởng đến kiến trúc lõi hoặc các module đã `LOCKED` phải được review và phê duyệt bởi **Project Architecture Authority** (hoặc Project Lead).
- Thay đổi chỉ được thực hiện trên một nhánh (branch) riêng biệt và phải đi kèm với đầy đủ Unit Test.

## 10. Quy tắc về Ngữ cảnh & Trạng thái (Context & State Rules)

- **Không Tự tạo Ký ức:** Các công cụ và thành viên phát triển không được phép lưu trữ hoặc tạo ra "ký ức" về trạng thái dự án giữa các phiên làm việc.
- **Nguồn Sự thật Duy nhất:** Bộ tài liệu trong thư mục `.ai/` là nguồn sự thật duy nhất.
- **Hỏi khi Không chắc chắn:** Nếu một yêu cầu không rõ ràng hoặc mâu thuẫn với Hiến pháp, phải đặt câu hỏi để làm rõ thay vì đưa ra giả định.

## 11. Các Hành động Bị cấm (Forbidden Actions)

- **NGHIÊM CẤM** hardcode logic nghiệp vụ.
- **NGHIÊM CẤM** sửa đổi các module đã được đóng băng tính năng.
- **NGHIÊM CẤM** thay đổi Public Contract nếu không có sự phê duyệt.
- **NGHIÊM CẤM** tự ý chuyển sang Phase tiếp theo.
- **NGHIÊM CẤM** tạo ra mã nguồn trùng lặp.
- **NGHIÊM CẤM** phá vỡ các nguyên tắc của Clean Architecture.
- **NGHIÊM CẤM** commit mã nguồn không có Unit Test đi kèm.

## 12. Định nghĩa Hoàn thành (Definition of Done)

Một Phase của dự án chỉ được coi là "Hoàn thành" (Done) khi tất cả các tiêu chí sau được đáp ứng:
- **Code Implementation:** Đã triển khai đầy đủ theo đúng thiết kế.
- **Unit & Integration Tests:** Đã vượt qua toàn bộ kiểm thử.
- **Quality Gate:** Đã vượt qua tất cả các kiểm tra chất lượng tự động (Xem **`QUALITY_GATE.md`**).
- **Architecture Review:** Đã được review và xác nhận tuân thủ Hiến pháp.

---
## Related Documents
- `ARCHITECTURE.md`
- `ROADMAP.md`
- `PHASE_STATUS.md`
- `CODING_STANDARD.md`
- `QUALITY_GATE.md`
- `DEVELOPER_WORKFLOW.md`