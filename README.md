# SDragon AssetTracker Pro v3.0 — Hệ Thống Web Quản Lý Tài Sản & Track Sheet Máy Móc Thiết Bị

> **Giải pháp chuyên nghiệp dành cho nhà máy sản xuất, xưởng cơ khí, dây chuyền SMT, ép nhựa và phòng kiểm tra chất lượng QC.**

---

## 🌟 Giới Thiệu Tổng Quan

**SDragon AssetTracker Pro** là ứng dụng Web Single-Page Application (SPA) cao cấp được thiết kế theo chuẩn công nghiệp, cho phép kỹ thuật viên, quản đốc phân xưởng và ban giám đốc theo dõi toàn diện vòng đời máy móc thiết bị:
- Quản lý lý lịch máy, mã tài sản (Asset Tag ID), chủng loại, phân xưởng, chuyền làm việc.
- Bảng **Track Sheet tương tác** (Data Grid) tra cứu tức thời, lọc đa tiêu chí và sắp xếp đa chiều.
- Bảng **Thẻ Kanban** trực quan hóa trạng thái máy (Đang chạy, Bảo trì định kỳ, Sự cố dừng chuyền, Chờ kiểm định).
- Hệ thống **cảnh báo hạn bảo dưỡng (PM Schedule)** tự động đếm ngược ngày và phân loại mức độ khẩn cấp (Quá hạn 🚨 / Đến hạn trong 7 ngày ⚠️ / An toàn ✅).
- **Tạo & In Tem Nhãn QR Code Công Nghiệp** trực tiếp dán lên thân máy, hỗ trợ quét QR xem nhanh lý lịch máy.
- **Nhật ký bảo trì & sửa chữa toàn diện**, tự động tính toán hạn bảo dưỡng tiếp theo và ghi nhận chi phí.
- **Xuất / Nhập dữ liệu linh hoạt** ra Excel/CSV (chuẩn UTF-8 tiếng Việt) và sao lưu/phục hồi Database JSON.
- **100% Offline-First**: Toàn bộ dữ liệu lưu trữ bền vững tại trình duyệt qua `LocalStorage`, không phụ thuộc internet.

---

## 🚀 Cách Khởi Chạy Ứng Dụng

### Cách 1: Mở Trực Tiếp (Khuyến nghị)
- Nhấp đúp chuột vào file:  
  📁 `start_asset_tracker.bat` (ở thư mục gốc)  
  hoặc  
  📁 `machinery_asset_tracker\start_server.bat`  
  hoặc mở thẳng file `machinery_asset_tracker\index.html` bằng bất kỳ trình duyệt nào (Chrome, Edge, Firefox, Cốc Cốc, Safari).

### Cách 2: Chạy Qua Local Server (Nếu muốn chia sẻ qua mạng nội bộ LAN xưởng)
Nếu muốn các kỹ thuật viên dùng điện thoại hoặc máy tính bảng kết nối vào xem máy móc trong xưởng:
1. Mở PowerShell hoặc Command Prompt tại thư mục `machinery_asset_tracker`:
   ```bash
   python -m http.server 8080
   ```
2. Truy cập từ máy tính hoặc điện thoại cùng mạng Wi-Fi:
   ```
   http://<IP_MAY_TINH>:8080
   ```

---

## 📋 Các Tính Năng Nghiệp Vụ Chính

### 1. Bảng Theo Dõi Track Sheet (Sheet View)
- Bảng hiển thị thông số: Mã tài sản, Tên máy, Phân xưởng, Trạng thái vận hành, Hạn bảo dưỡng kế tiếp, Kỹ thuật viên phụ trách, Nguyên giá đầu tư (VNĐ), Giờ hoạt động.
- **Bộ lọc thông minh**:
  - Theo Phân xưởng (Cơ Khí A, Đúc Ép B, SMT Điện Tử C, Đóng Gói D, Phòng QC, Trạm Cấp Nguồn...)
  - Theo Chủng loại (Máy CNC, Robot công nghiệp, Máy ép nhựa, Dây chuyền SMT, Vision AI, Máy nén khí...)
  - Theo Trạng thái vận hành (Operational, Maintenance, Down/Fault, Calibration, Standby)
  - Theo Chu kỳ bảo dưỡng (Quá hạn, Đến hạn 7 ngày, Đến hạn 30 ngày)
- **Thanh tìm kiếm toàn năng**: Nhấn phím tắt `/` để tìm nhanh theo tên máy, mã số, model hoặc tên người vận hành.
- **Thao tác hàng loạt (Bulk Actions)**: Chọn nhiều máy để xuất CSV, in tem QR hàng loạt hoặc xóa.

### 2. Thẻ Kanban Trực Quan (Kanban View)
- Phân chia thành 4 cột Kanban:
  1. **Đang Hoạt Động (Running)** — Màu xanh lá.
  2. **Bảo Trì Định Kỳ (Maintenance)** — Màu vàng hổ phách.
  3. **Sự Cố / Dừng Máy (Down)** — Màu đỏ rực.
  4. **Hiệu Chuẩn / Dự Phòng (Calibration/Standby)** — Màu tím / xám.
- Thẻ máy hiển thị nguyên giá, thời gian còn lại đến hạn bảo dưỡng và tên người phụ trách.

### 3. Lịch Trình & Nhật Ký Bảo Dưỡng (Maintenance Track Schedule)
- Cột **Cảnh Báo Khẩn Cấp**: Tự động liệt kê các máy móc đã quá hạn bảo trì hoặc sẽ đến hạn trong vòng 7 ngày tới, kèm nút bấm xử lý nhanh.
- **Nhật Ký Bảo Trì Toàn Nhà Máy**: Ghi nhận ngày thực hiện, mã máy, loại hình công việc (PM định kỳ, Sửa chữa sự cố, Thay linh kiện, Hiệu chuẩn), mô tả chi tiết, kỹ thuật viên thực hiện, chi phí và trạng thái sau xử lý.
- Khi lập phiếu bảo trì thành công, hệ thống **tự động tính toán ngày bảo dưỡng tiếp theo** dựa trên chu kỳ ngày của máy và cập nhật lại trạng thái máy!

### 4. Tạo & In Tem Nhãn QR Code Máy Móc (Industrial QR Tag)
- Nhấn vào biểu tượng mã QR ở bất kỳ máy móc nào để mở bản xem trước tem nhãn công nghiệp (Kích thước chuẩn tem kim loại / Decal xưởng).
- Tem hiển thị: Logo nhà máy SDragon, Tên máy, Mã thiết bị nổi bật, Model/Serial, Hạn kiểm định kế tiếp, Hotline kỹ thuật và mã QR Matrix sắc nét.
- Nhấn nút **"In Tem Nhãn Ngay"** để in trực tiếp qua máy in mã vạch (Zebra, Brother, Xprinter) hoặc lưu file PDF.

### 5. Xuất / Nhập & Phục Hồi Dữ Liệu (Backup & Restore)
- **Xuất CSV / Excel**: Tải xuống file bảng tính có gắn cờ UTF-8 BOM, mở trực tiếp bằng Microsoft Excel mà không bị lỗi font tiếng Việt.
- **Sao Lưu JSON (Backup)**: Lưu toàn bộ cơ sở dữ liệu gồm 16+ máy móc và nhật ký ra file JSON để chuyển sang máy tính khác.
- **Phục Hồi Dữ Liệu (Restore)**: Kéo thả file JSON vào vùng tải lên để khôi phục toàn vẹn dữ liệu.
- **Tải Lại Dữ Liệu Mẫu**: Nút nạp lại 16 máy móc công nghiệp chuẩn nhà máy khi cần demo hoặc đào tạo công nhân mới.

### 6. Giao Diện Công Nghiệp Tối & Sáng (Dark / Light Theme)
- Nhấn nút biểu tượng Mặt trời / Mặt trăng trên thanh công cụ góc phải để chuyển đổi mượt mà giữa giao diện Dark Slate (chống mỏi mắt trong xưởng) và Light Clean (phù hợp in ấn và thuyết trình).

---

## 🛠️ Cấu Trúc Thư Mục Ứng Dụng

```
machinery_asset_tracker/
├── index.html              ← Giao diện chính Semantic HTML5 chuẩn SEO & A11y
├── start_server.bat        ← File nhấp đúp để mở ứng dụng ngay lập tức
├── README.md               ← Hướng dẫn sử dụng và tài liệu kỹ thuật
├── css/
│   └── style.css           ← Hệ thống thiết kế CSS hoàn chỉnh (Dark/Light mode, Glassmorphism, Print CSS)
└── js/
    ├── data.js             ← Cơ sở dữ liệu mẫu, LocalStorage Manager, Export CSV/JSON
    ├── qrcode_util.js      ← Bộ sinh mã QR Code Canvas 100% offline & in tem
    ├── sheet.js            ← Logic bảng tính Track Sheet, bộ lọc đa chiều, phân trang, Kanban
    ├── maintenance.js      ← Quản lý hạn bảo dưỡng, cảnh báo đếm ngược, nhật ký sửa chữa
    ├── dashboard.js        ← Tính toán KPI tỷ lệ sẵn sàng OEE, biểu đồ phân bổ
    └── app.js              ← Điều phối master controller, modals, sự kiện toàn cục, toast
```

---

*Hệ thống được phát triển bởi SDragon Industrial Automation & QC Vision AI.*


## 🔐 HỆ THỐNG TÀI KHOẢN VÀ PHÂN QUYỀN

- admin / 123 (Quản trị viên toàn quyền)
- kythuat / 123 (Kỹ thuật viên thêm/sửa/bảo trì)
- vanhanh / 123 (Người vận hành chỉ xem)
