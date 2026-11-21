---
description: Always keep only the single latest APK release and delete old APKs or temporary artifacts to keep disk storage lightweight.
globs: ["**/*"]
---

# Quy Tắc Tối Ưu Bộ Nhớ (Storage Hygiene Rule)
- Mỗi khi biên dịch bản APK mới hoặc cập nhật tính năng:
  - Chỉ giữ lại **duy nhất 1 tệp APK phiên bản mới nhất** trong `D:\ff-sensitivity-app` và trên `Desktop`.
  - Tự động xóa sạch các file APK phiên bản cũ hơn để tiết kiệm dung lượng ổ cứng.
  - Không lưu lại các tệp media nháp, video/audio render thử nghiệm, hoặc ảnh chụp màn hình tạm thời trong thư mục dự án.
