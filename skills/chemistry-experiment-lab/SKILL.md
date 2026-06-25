---
name: chemistry-experiment-lab
description: >
  Tạo học liệu Hóa học K12/THPT dạng phòng thí nghiệm tương tác: HTML 3D,
  Three.js/WebGL, kéo-thả dụng cụ, slider biến thực nghiệm, đồ thị tốc độ,
  mô phỏng chất xúc tác, nồng độ, nhiệt độ, diện tích bề mặt, kết tủa, khí,
  chuẩn độ, pH, điện phân, oxi hóa-khử, cân bằng, mini-game phân loại hiện
  tượng, animation timeline, particle effects, physics 2D, đồ thị dữ liệu và
  molecular viewer. Dùng skill này khi user muốn sinh hoặc cải tiến các widget
  thực nghiệm Hóa học sinh động tương tự các file brainstorm K12.
---

# Chemistry Experiment Lab

Dùng skill này để tạo hoặc cải tiến các widget thí nghiệm Hóa học tương tác, tự chứa, phù hợp học liệu K12/THPT.

Mặc định, thí nghiệm 3D xuất ra file `.html` trong `outputs/` để mở bằng trình duyệt thật. Chỉ dùng `.jsx` cho bản xem trước không dùng WebGL khi workflow host hỗ trợ React artifact.

## Quy Trình

1. Xác định mục tiêu thí nghiệm: khái niệm, lớp, ngộ nhận cần sửa, phản ứng cần dùng, và có cần HTML 3D hay không.
2. Thiết kế `learning loop` trước khi code: `dự đoán -> thao tác/quan sát -> so sánh -> kết luận`. Nếu widget chỉ “đẹp để xem”, coi như chưa đạt.
3. Chọn một nhóm tương tác trong `references/interaction-patterns.md`.
4. Nếu widget cần chuyển động giàu hơn, physics, particle, đồ thị, drag/snap phức tạp, hoặc viewer phân tử thật, đọc `references/library-recommendations.md` trước khi chọn thư viện.
5. Nếu user yêu cầu brainstorm rộng, đọc `references/experiment-catalog.md` và đề xuất 3-8 widget cụ thể trước khi triển khai.
6. Với mọi widget được tạo, làm theo `references/implementation-checklist.md`.
7. Trước khi generate, improve, hoặc forward-test một widget, nếu có `evaluations/feedback-lessons.md` thì đọc file đó trước. Ưu tiên áp dụng các lesson thuộc `local defect` cho output hiện tại; với `candidate pattern` hoặc scope rộng hơn, chỉ dùng như tín hiệu để kiểm tra thêm theo `references/evaluation-loop.md`, không tự biến thành rule mới.
8. Với mỗi output HTML/JSX trừ sửa nhanh rất nhỏ, chạy vòng `design -> generate -> validate -> verify -> score -> record -> improve` trong `references/evaluation-loop.md`.
9. Lưu output vào `outputs/{slug}.html` hoặc `outputs/{slug}.jsx` trong thư mục skill này.
10. Khi user phản hồi về chất lượng, xem feedback là tín hiệu để sửa output hiện tại trước; chỉ nâng feedback thành rule chung sau khi đã qua bước lọc trong `references/evaluation-loop.md`.

## Nguồn Chính

- `references/implementation-checklist.md`: guardrail triển khai và review widget.
- `references/evaluation-loop.md`: verify loop, triage feedback, rubric, record, và tiêu chí promote rule.
- `references/interaction-patterns.md`: chọn interaction family phù hợp.
- `references/library-recommendations.md`: chọn thư viện và dependency rationale.
- `references/experiment-catalog.md`: brainstorm và coverage theo chủ đề.
- `templates/`: blueprint, schema, và prompt/template hỗ trợ generate hoặc improve.
- `scripts/check-widget.sh` và `scripts/verify-widget.sh`: lệnh verify và audit chính.

## Invariants Mức Cao

- Widget phải phục vụ `learning loop`, không chỉ là animation đẹp.
- Layout phải `lab-first`: vùng thí nghiệm/quan sát là trọng tâm.
- Output phải tự chứa, scoped, và verify được trên desktop/mobile.
- Không lộ đáp án sớm làm hỏng bước dự đoán hoặc quan sát chính.
- Nếu feedback chỉ là lỗi một output, sửa output và ghi record; chỉ promote thành rule chung theo `references/evaluation-loop.md`.

## Feedback

- `evaluations/feedback-lessons.md` là bản đọc nhanh cho agent trước khi generate, improve, hoặc forward-test.
- Dùng các lesson đó theo quy trình trong `references/evaluation-loop.md`.
- Không tự cập nhật `SKILL.md` từ feedback nếu chưa đủ evidence.
