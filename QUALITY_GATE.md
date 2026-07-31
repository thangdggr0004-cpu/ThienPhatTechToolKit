# Quality Gate Standards

| Attribute | Value |
| :--- | :--- |
| **Document Name** | Quality Gate Standards |
| **Version** | 1.1 |
| **Status** | ACTIVE |
| **Architecture State** | LOCKED |
| **Owner** | Project Lead |
| **Last Updated** | 2026-07-26 |

---

## 1. Tổng quan

Cổng Chất lượng (Quality Gate) là một tập hợp các tiêu chí bắt buộc mà mọi thay đổi về mã nguồn phải vượt qua trước khi được hợp nhất vào nhánh chính. Mục tiêu là đảm bảo chất lượng, sự ổn định và tính bảo mật của sản phẩm.

## 2. Tiêu chí Cổng Chất lượng

Mỗi Pull Request (PR) phải đáp ứng **TẤT CẢ** các tiêu chí sau:

### 2.1. Unit Testing
- **Yêu cầu:** Mọi logic nghiệp vụ mới hoặc sửa lỗi đều phải có Unit Test đi kèm.
- **Công cụ:** Jest.
- **Tiêu chí PASS:** 100% các bài test phải chạy thành công.

### 2.2. Code Coverage (Độ bao phủ mã)
- **Yêu cầu:** Các module nghiệp vụ cốt lõi phải đạt độ bao phủ tối thiểu.
- **Ngưỡng tối thiểu:** 80%.
- **Tiêu chí PASS:** Báo cáo độ bao phủ phải đạt hoặc vượt ngưỡng đã định.

### 2.3. Static Analysis (Phân tích tĩnh)
- **Yêu cầu:** Toàn bộ mã nguồn phải tuân thủ các quy tắc trong **`CODING_STANDARD.md`**.
- **Công cụ:** ESLint, Prettier.
- **Tiêu chí PASS:** Quá trình lint không được báo bất kỳ lỗi (error) nào.

### 2.4. Peer Review (Review bởi đồng nghiệp)
- **Yêu cầu:** Mỗi PR phải được review và phê duyệt bởi ít nhất một kỹ sư khác.
- **Trách nhiệm của người review:**
  - Xác minh sự tuân thủ **`PROJECT_CONSTITUTION.md`**.
  - Đánh giá tính hợp lý của giải pháp.
  - Kiểm tra các trường hợp biên (edge cases).
- **Tiêu chí PASS:** Nhận được ít nhất một "Approve".

### 2.5. Architecture Review (Review kiến trúc)
- **Yêu cầu:** Các thay đổi có ảnh hưởng đến kiến trúc lõi phải được review bởi Project Architecture Authority.
- **Tiêu chí PASS:** Nhận được phê duyệt tường minh từ người có thẩm quyền.

### 2.6. Security Scan (Quét bảo mật)
- **Yêu cầu:** Quét tự động các thư viện phụ thuộc để tìm lỗ hổng đã biết.
- **Công cụ:** `npm audit` hoặc các công cụ tương đương.
- **Tiêu chí PASS:** Không có lỗ hổng ở mức độ "High" hoặc "Critical".

### 2.7. Regression Testing (Kiểm thử hồi quy)
- **Yêu cầu:** Đảm bảo các thay đổi không gây ra lỗi trên các tính năng đã tồn tại.
- **Tiêu chí PASS:** Không phát hiện lỗi hồi quy.

---
## Related Documents
- `PROJECT_CONSTITUTION.md`
- `CODING_STANDARD.md`