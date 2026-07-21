# Thiên Phát Tech Toolkit Pro - Hướng Dẫn Sử Dụng & Chi Tiết Tính Năng

**Thiên Phát Tech Toolkit Pro** là bộ công cụ kỹ thuật toàn diện, được thiết kế đặc biệt dành riêng cho các kỹ thuật viên máy tính, chuyên viên IT và người dùng nâng cao. Phần mềm tập hợp những tiện ích mạnh mẽ nhất để chẩn đoán, tối ưu hóa, sửa lỗi hệ thống và quản lý bản quyền trên môi trường Windows một cách tự động, nhanh chóng và chuyên nghiệp.

---

## 🌟 Nhóm Chức Năng Chính

### 1. 🛡️ Quét & Xử Lý Bản Quyền (Activation Scanner)
Công cụ độc quyền giúp bóc tách và phân tích tình trạng bản quyền Windows/Office với thuật toán quét sâu 8 bước:
- **Phân tích chữ ký số phần cứng (HWID):** Nhận diện các hệ thống sử dụng Key chung (Generic Key) để ép kích hoạt kỹ thuật số (như công cụ MAS).
- **Phân tích Kênh cấp phép:** Nhận diện loại giấy phép đang dùng (Retail, OEM, Volume_MAK).
- **Truy vết máy chủ KMS:** Kiểm tra hệ thống có bị trỏ về các máy chủ ảo (KMS Host giả mạo) hay không.
- **Quét tệp tin & DLL bẻ khóa:** Tìm kiếm tàn dư của AutoKMS, KMSPico, SECOH-QAD, KMS38 v.v.
- **Kiểm tra Task Scheduler & Services:** Phát hiện các tác vụ tự động gia hạn bản quyền chạy ngầm trong máy.
- **Kiểm tra file Hosts:** Phát hiện hành vi chặn giao tiếp với máy chủ xác thực của Microsoft.
- **Truy vết Event Logs:** Đọc nhật ký hệ thống Event Viewer để tìm bằng chứng kích hoạt lậu trong quá khứ.
- **Tiêu diệt KMS / HWID 1-Click:** Khôi phục máy về trạng thái gốc bằng cách gỡ Product Key, dọn dẹp Registry, clear ClipSVC tokens và tắt/xóa các dịch vụ độc hại chỉ với 1 cú click.

### 2. 🖨️ Tiện Ích Máy In (Printer Utilities)
Bộ công cụ không thể thiếu cho dân văn phòng và IT support:
- **Quản lý danh sách máy in:** Hiển thị chi tiết trạng thái (Idle, Offline, Error), Port và thiết lập máy in mặc định.
- **Xem hàng đợi (Print Queue):** Theo dõi các lệnh in đang chờ trực quan.
- **Gỡ lỗi 1-Click:** Khởi động lại Print Spooler, xóa sạch hàng đợi bị kẹt cứng tức thì.
- **Fix Share Máy In LAN:** Tự động áp dụng các bản vá Registry để sửa lỗi chia sẻ mạng kinh điển (0x0000011b, 0x00000709).
- **Cài đặt Driver thủ công:** Mở nhanh Device Manager, xóa tận gốc máy in lỗi và tự động gọi hộp thoại Add Printer mặc định của Windows để kỹ thuật viên xử lý.
- **In Trang Test:** Gửi lệnh in trang kiểm tra (Test Page) trực tiếp tới máy in được chọn.

### 3. 🧹 Dọn Dẹp & Tối Ưu Hệ Thống
- **Bảng Điều Khiển (Dashboard):** Giám sát tình trạng CPU, RAM, Ổ cứng, Uptime, nhiệt độ và lưu lượng Mạng theo thời gian thực.
- **Dọn Dẹp Rác:** Dọn dẹp an toàn thư mục Temp, Windows Update Cache, Icon/Thumbnail Cache và Prefetch giúp giải phóng dung lượng ổ C.
- **Windows Fixer:** Tích hợp lệnh `SFC /scannow` và `DISM /RestoreHealth` để quét và phục hồi các file hệ thống (Corrupted Files) bị hỏng.
- **Reset Windows Update:** Sửa lỗi hệ điều hành không thể cập nhật bằng cách khởi động lại dịch vụ BITS, wuauserv và dọn sạch thư mục SoftwareDistribution.
- **Cấu hình chi tiết:** Truy xuất nhanh cấu hình Mainboard, RAM, CPU, Ổ cứng và gọi lệnh DxDiag.

### 4. 🌐 Mạng & Sao Lưu
- **Quản lý DNS:** Đổi nhanh DNS sang Google, Cloudflare, OpenDNS, Quad9 để vượt tường lửa hoặc tăng tốc độ mạng.
- **Đánh giá Ping:** Đo độ trễ (Latency) trực tiếp tới các máy chủ lớn để chẩn đoán nghẽn mạng.
- **Sao Lưu Wi-Fi:** Trích xuất toàn bộ tên và mật khẩu Wi-Fi từng lưu trên máy ra một file Text duy nhất.
- **Sao Lưu Driver:** Xuất toàn bộ Driver hiện tại của máy (dạng file .INF) ra thư mục dự phòng để chuẩn bị cho việc cài lại Win.

### 5. 🔓 Công Cụ Bổ Trợ Khác
- **Tắt BitLocker:** Tự động dò tìm các phân vùng bị khóa BitLocker và thực hiện lệnh giải mã (Decrypt) hàng loạt để cứu hộ dữ liệu.
- **Chuẩn hóa Office:** Fix nhanh các lỗi phổ biến (font chữ, lề), dọn dẹp macro rác, chuẩn hóa định dạng văn bản cho Word/Excel.
- **Kiểm tra sức khỏe ổ cứng:** Hiển thị trạng thái SMART thực tế của ổ cứng.

---

## 🚀 Đặc Điểm Kỹ Thuật
- **Kiến trúc Portable (Di Động):** Phần mềm được biên dịch và đóng gói cực kỳ gọn nhẹ thành **1 file `.exe` duy nhất**. Không yêu cầu cài đặt, dễ dàng chép qua USB, Google Drive để mang đi chạy trực tiếp trên bất kỳ máy khách nào.
- **Phân quyền tự động & Bảo mật:** Tự động xin cấp quyền Quản trị viên (UAC Administrator) khi khởi chạy. Toàn bộ mã nguồn và tệp tin thực thi được **ký chứng chỉ số (Digital Signature)** nhằm đảm bảo an toàn tuyệt đối, không bị các phần mềm diệt Virus (Windows Defender, Kaspersky...) nhận diện nhầm là mã độc.
- **Kiến trúc hiện đại:** Được xây dựng trên nền tảng **React 19, Vite, Tailwind CSS và Electron**. Giao diện ứng dụng ngôn ngữ thiết kế "Thẻ lưới" (Grid) trực quan, các Animations mượt mà và tốc độ phản hồi gần như tức thời. Các lệnh hệ thống được thực thi ngầm qua PowerShell tối ưu.

---

## 👨‍💻 Thông Tin Tác Giả & Phát Triển
**Thiên Phát Tech Toolkit Pro** được lên ý tưởng, thiết kế và phát triển độc quyền bởi anh **Thắng (Thiên Phát Tech)**. 

Bắt nguồn từ nhu cầu thực tiễn trong nhiều năm đi làm dịch vụ IT sửa chữa máy tính, phần mềm được ra đời nhằm mục đích tự động hóa các quy trình kỹ thuật rườm rà, giải quyết các lỗi kinh điển mà kỹ thuật viên thường xuyên gặp phải (chia sẻ máy in, kẹt lệnh in, diệt KMS lậu...). Tool giúp tiết kiệm hàng ngàn giờ đồng hồ thao tác tay và nâng cao tính chuyên nghiệp trong mắt khách hàng. 

Mã nguồn được chắt lọc và tối ưu cực kỳ tỉ mỉ để tương thích hoàn hảo trên các phiên bản Windows 10 và 11 mới nhất.

🔗 **Mọi chi tiết, góp ý nâng cấp hoặc báo lỗi, vui lòng liên hệ trực tiếp với Thiên Phát Tech để được hỗ trợ nhanh nhất.**

*Phiên bản hiện tại: 1.0.6 (Bản quyền thuộc về Thiên Phát Tech)*
