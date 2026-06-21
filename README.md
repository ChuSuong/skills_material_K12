# skills_material_K12

Repo này là workspace cho việc tạo, thử nghiệm, đánh giá và tinh chỉnh học liệu Hóa học K12/THPT theo hướng tương tác. Nội dung chính tập trung vào các skill sinh widget thí nghiệm, các template HTML/JSX, pipeline verify/evaluate, và các artifact phục vụ vòng lặp cải tiến.

## Mục Tiêu

- Tạo học liệu Hóa học có tương tác rõ ràng, có `learning loop`, và mở được trực tiếp trong trình duyệt.
- Giữ tách bạch giữa source, template, output, record đánh giá, và artifact debug.
- Hỗ trợ vòng lặp `generate -> verify -> record -> improve` cho các skill trong repo.

## Cấu Trúc Chính

- `skills/chemistry-experiment-lab/`: skill chính cho widget thí nghiệm Hóa học tương tác, gồm `SKILL.md`, `references/`, `templates/`, `scripts/`, `tests/`, `runs/`, `eval-runs/`, `evaluations/`, và `outputs/`.
- `skills/chemistry-interactive/`: skill phụ cho các mẫu học liệu Hóa học tương tác khác như quiz, viewer, game phân loại, và virtual lab.
- `src/modules/gen_material/`: module tạo material và backend hỗ trợ pipeline sinh nội dung.
- `src/modules/gen_img/`: module hỗ trợ sinh ảnh và xử lý ảnh cho material.
- `.claude/`: hook và cấu hình Claude cho workflow feedback, summarize lessons, và các kiểm tra liên quan skill.

## Cách Dùng Nhanh

1. Chọn đúng skill trong `skills/` theo loại học liệu cần làm.
2. Đọc `SKILL.md` của skill đó trước khi sinh hoặc sửa output.
3. Dùng `references/` và `templates/` để bám vào quy trình, contract, và format hiện có.
4. Sinh output vào `outputs/` hoặc chạy pipeline tương ứng trong `src/modules/`.
5. Verify và ghi record theo workflow của skill, không chỉnh tay trực tiếp vào artifact sinh ra nếu chưa qua vòng kiểm tra.

## Workflow Cho `chemistry-experiment-lab`

- `SKILL.md` là điểm vào cho agent.
- `references/evaluation-loop.md` giữ logic triage feedback, rubric, và quy trình record/improve.
- `evaluations/feedback-lessons.md` là bản đọc nhanh cho agent khi có feedback gần đây.
- `templates/` giữ schema, blueprint, và prompt hỗ trợ tạo hoặc cải tiến widget.
- `scripts/check-widget.sh` và `scripts/verify-widget.sh` là lệnh kiểm tra chính cho output HTML.
- `outputs/` chứa widget đã xuất bản hoặc đang xem xét.
- `eval-runs/` và `runs/` chứa record, bundle, và artifact phục vụ đánh giá.

## Quy Ước

- Giữ source và artifact tách nhau rõ ràng.
- Không đưa artifact debug, screenshot, trace, hay note tạm vào PR nếu chúng chỉ phục vụ thử nghiệm cá nhân.
- Chỉ promote feedback thành rule chung khi nó đã được triage đủ bằng chứng theo workflow của skill.

## Ghi Chú

Repo này đang được dùng như workspace làm việc hơn là một package phát hành đơn lẻ. Khi cập nhật tài liệu, ưu tiên mô tả đúng trạng thái hiện tại của repo và giữ nội dung evergreen, không viết theo kiểu changelog.
