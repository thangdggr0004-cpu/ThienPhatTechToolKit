# Developer Workflow

| Attribute | Value |
| :--- | :--- |
| **Document Name** | Developer Workflow |
| **Version** | 1.0 |
| **Status** | ACTIVE |
| **Owner** | Project Lead |
| **Last Updated** | 2026-07-26 |

---

## 1. Quy trình Khởi động (Startup Procedure)

Mọi thành viên phát triển bắt buộc phải tuân thủ nghiêm ngặt quy trình sau đây trong **mỗi phiên làm việc mới**:

1.  **Đọc Tài liệu Nền tảng:** Đọc và nạp vào ngữ cảnh toàn bộ các file trong thư mục `.ai/`.
2.  **Yêu cầu Ngữ cảnh File:** Yêu cầu và đọc toàn bộ nội dung của **tất cả** các file mã nguồn sẽ bị ảnh hưởng bởi nhiệm vụ.
3.  **Không Dùng Trí nhớ:** Tuyệt đối không dựa vào bộ nhớ từ các cuộc trò chuyện trước đó. Mỗi yêu cầu phải được xử lý như một phiên làm việc độc lập.

## 2. Lập kế hoạch (Planning)

1.  **Phân tích Yêu cầu:** Phân tích yêu cầu của người dùng và xác nhận đã hiểu rõ mục tiêu trong bối cảnh của Hiến pháp.
2.  **Trình bày Kế hoạch:** Đưa ra một kế hoạch triển khai chi tiết, bao gồm các file sẽ bị ảnh hưởng và các bước thực hiện.
3.  **Chờ Phê duyệt:** Không được viết hoặc sửa đổi bất kỳ dòng mã nào cho đến khi kế hoạch được phê duyệt.

## 3. Triển khai & Cung cấp Patch (Implementation & Patching)

1.  **Tuân thủ Tiêu chuẩn:** Toàn bộ mã nguồn mới phải tuân thủ **`CODING_STANDARD.md`**.
2.  **Tạo Patch:** Mọi thay đổi về mã nguồn phải được cung cấp dưới định dạng `diff` chuẩn.

## 4. Xác minh & Cổng Chất lượng (Verification & Quality Gate)

1.  **Tự kiểm tra (Self-Check):** Trước khi đưa ra kết quả, tự đối chiếu mã nguồn đã tạo với các quy tắc trong Hiến pháp.
2.  **Kiểm thử (Testing):** Viết Unit Test cho các logic mới theo tiêu chuẩn trong **`QUALITY_GATE.md`**.

## 5. Quy trình Review (Review Process)

- Mã nguồn sẽ được review bởi kỹ sư con người theo cùng quy trình như một Pull Request thông thường.

---
## Related Documents
- `PROJECT_CONSTITUTION.md`
- `QUALITY_GATE.md`
- `CODING_STANDARD.md`