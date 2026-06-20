# Improvement Prompt

Bạn đang sửa một widget thí nghiệm Hóa học đã có sẵn.

Input:

- Output file:
- Evaluation JSON:
- User feedback:

Yêu cầu:

- Chỉ sửa các vấn đề được nêu trong evaluation/user feedback.
- Không rewrite toàn bộ file nếu lỗi có thể sửa cục bộ.
- Giữ root id, scoped CSS/JS và các fallback hiện có.
- Không thêm thư viện mới nếu evaluation không yêu cầu.
- Sau khi sửa, chạy lại validation và cập nhật evaluation record.

Ưu tiên sửa theo thứ tự:

1. Blocker Hóa học hoặc JS runtime.
2. Canvas/fallback/WebGL/CDN.
3. Autoplay/demo và interaction.
4. Lab-first layout, title/text gọn.
5. Performance/mobile/accessibility.
