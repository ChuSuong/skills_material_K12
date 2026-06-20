# Evaluation Loop

Dùng vòng lặp này để biến mỗi lần sinh widget thành dữ liệu cải tiến skill, nhưng không biến skill thành template cứng nhắc.

## Khi Nào Chạy Loop

Chạy loop khi:

- Forward-test skill.
- Sinh widget mẫu để làm chuẩn cho các lần sau.
- User phàn nàn về chất lượng, layout, độ sinh động, thao tác, hoặc độ đúng Hóa học.
- Widget dùng thư viện mới hoặc pattern mới.

Không bắt buộc ghi record cho mọi output nhỏ nếu user chỉ cần sửa nhanh.

## Quy Trình

1. Design: chốt `learning loop`, pattern, thư viện và dependency rationale.
2. Generate: tạo HTML/JSX theo `SKILL.md`, pattern và checklist.
3. Validate: chạy kiểm tra kỹ thuật tối thiểu.
4. Verify: kiểm tra desktop/mobile, fallback, autoplay/manual flow, và nếu cần thì screenshot regression.
5. Score: chấm rubric 100 điểm.
6. Record: ghi JSON record vào `eval-runs/{slug}/{timestamp}.json`; nếu cần báo cáo người đọc, thêm Markdown trong `evaluations/`.
7. Improve: nếu score thấp hoặc lỗi lặp lại, sửa output trước; nếu lỗi là pattern chung, cập nhật `SKILL.md`, checklist, reference hoặc template.

## Feedback Triage Trước Khi Nâng Thành Rule

Khi user góp ý, không thêm ngay vào skill như một luật mới. Đi theo thứ tự:

1. Xác nhận feedback có đúng trên output hiện tại không.
2. Phân loại nó là `local defect`, `family defect`, hay `global invariant`.
3. Kiểm tra xem nó có tái xuất hiện ở ít nhất một output khác hoặc có nguy cơ lặp lại rõ ràng không.
4. Chỉ cập nhật `SKILL.md`, checklist, template khi feedback là `family defect` hoặc `global invariant`.
5. Nếu feedback chỉ phản ánh gu thẩm mỹ cá nhân mà không chạm mục tiêu học tập, verifier, hay usability, giữ ở mức note thay vì rule.

Ví dụ:

- `Đáp án bị lộ trước khi học sinh quan sát`: thường là `global invariant`, nên thêm vào skill/checklist.
- `Màu nền này chưa đẹp`: thường là `local defect`, sửa file hoặc note, không biến thành luật chung.
- `Stage cao nhưng trống`: nếu đã lặp lại nhiều lần, nâng thành invariant verify.

## Rubric 100 Điểm

| Tiêu chí | Điểm | Cách chấm |
|---|---:|---|
| Đúng Hóa học và sư phạm | 20 | Phương trình/hiện tượng đúng mức SGK, không overclaim, có mục tiêu học tập rõ |
| Trực quan và sinh động | 15 | Có chuyển động/hiện tượng chính rõ, không chỉ đổi text; evidence thị giác bám khái niệm |
| Tương tác và autoplay/demo | 15 | Người dùng thấy tiến trình nhanh; có auto-run/demo, pause/reset hoặc manual hợp lý |
| Lab-first layout | 15 | Stage chính hoặc hệ `stage + panel học tập` là trọng tâm; title/text gọn; không dashboard hóa vô nghĩa; mobile không bị che/lấn |
| Kỹ thuật HTML tự chứa | 15 | Scoped CSS/JS, không global cũ, CDN pin version, fallback lỗi tải, WebGL check |
| Performance và mobile | 10 | Particle vừa phải, camera/frame ổn, control dùng được trên desktop/mobile |
| Learning loop và khả năng học lại từ kết quả | 10 | Có dự đoán hoặc lựa chọn, quan sát chính, so sánh hoặc kết luận; record nêu điểm mạnh/yếu và action rõ |

Mốc quyết định:

- `90-100`: mẫu tốt, có thể dùng làm reference.
- `80-89`: dùng được, ghi vài cải tiến nhỏ.
- `65-79`: cần sửa trước khi dùng làm mẫu.
- `<65`: không đạt; sửa lại hoặc đổi pattern.
- Nếu dependency lạm dụng, không phục vụ mục tiêu học tập, hoặc làm scene bị lấn át: trừ `5-15` điểm, chủ yếu ở `learning loop`, `visual_dynamism`, hoặc `lab_first_layout`.

## Gate 1: Structural

- `node --check` cho JS inline nếu có thể tách ra.
- `rg` tìm global rủi ro: `var GK`, `function gk`, `gkStart`, `gkLoadThree`, `document.querySelector(".`.
- `rg` tìm CDN không pin version: `latest`, `next`, hoặc URL thư viện thiếu số version.
- Kiểm tra có fallback message cho thư viện bắt buộc.
- Kiểm tra mỗi dependency có `rationale`: phục vụ hiện tượng Hóa học, thao tác học sinh, hoặc assessment/readout.

## Gate 2: Behavioral

- Kiểm tra có autoplay/demo hoặc giải thích vì sao manual-first.
- Kiểm tra title/text không chiếm quá nhiều diện tích so với scene/đồ thị.
- Kiểm tra chỉ số/graph không phình thành dashboard vô nghĩa. Nếu panel lớn nhưng đang phục vụ dự đoán, so sánh hoặc kết luận học tập, không tự động trừ điểm.
- Trừ điểm nếu có card/process diagram chỉ lặp lại learning loop bằng text mà không thêm thao tác, dữ kiện hoặc quan sát mới.
- Kiểm tra `hero/stage` hiện diện, canvas hoặc fallback không trắng, và control chính còn dùng được.
- Với bài 3D, kiểm tra hiện tượng chính có đọc ra được nhanh không: bọt khí, lớp bám, đổi màu, kết tủa phải đủ nổi bật ngay cả trước khi đọc text dài.
- Kiểm tra `spoiler`: trước khi hoàn thành bước dự đoán/quan sát chính, UI không được lộ mapping đáp án đầy đủ qua legend, hint, focus card, status hoặc result panel.
- Nếu dùng `GSAP`, kiểm tra có `pause/resume/restart` hoặc control tương đương.
- Nếu dùng `Matter.js`/`Planck.js`, kiểm tra reset world sạch và wording không overclaim “mô phỏng hóa học thật”.
- Nếu dùng `PixiJS`, kiểm tra không chồng vô lý với `Three.js`.
- Nếu dùng `3Dmol.js`, kiểm tra có câu hỏi hoặc hướng dẫn quan sát cấu trúc.
- Nếu dùng particle library, kiểm tra particle budget và mobile fallback.

## Gate 3: Regression

- Không dùng snapshot toàn trang như tiêu chí pass/fail chính cho mọi output.
- Chỉ promote exemplar theo `interaction family`, ví dụ `titration`, `kinetics`, `apparatus-drag-drop`, `molecular-viewer`.
- Chỉ khi output đạt `>= 90`, không có blocker, và ổn định trên desktop/mobile mới được làm baseline.
- Nếu dùng visual diff, giữ cùng môi trường và dùng mask hoặc `stylePath` cho phần chủ ý biến động.

## Verify Loop

Tối thiểu:

- Mở HTML trong trình duyệt thật hoặc headless browser.
- Chụp ít nhất 1 screenshot desktop và 1 screenshot mobile.
- Xác nhận scene không trắng và control chính còn đọc được.
- Nếu muốn agent tự test nhanh bằng một lệnh thay vì đọc file thủ công, chạy `scripts/check-widget.sh <html-hoặc-attempt-dir>`. Lệnh này gộp runtime verify với static audit cho spoiler UI và một số guardrail cấu trúc.

Khi output quan trọng hoặc đang forward-test skill:

- Dùng Playwright để mở trang ở desktop và mobile emulation.
- Có thể gọi trực tiếp `scripts/verify-widget.sh path/to/output.html` để tạo screenshot, trace và JSON result.
- Nếu có trạng thái autoplay, chụp sau một khoảng `waitForTimeout` hoặc chờ readout/state text đổi.
- Có thể dùng `trace: 'retain-on-failure'` và `video: 'retain-on-failure'`.
- Nếu layout đã ổn định, dùng visual snapshot/regression cho exemplar thay vì mọi output.

## Blocker Và Warning

Blocker làm output chưa đạt dù tổng điểm cao:

- Sai phương trình, sai sản phẩm chính, hoặc hiện tượng Hóa học gây hiểu nhầm.
- Canvas trắng mà không có fallback.
- Không mở được HTML do lỗi JS parse.
- Global/CSS leak rõ ràng khi ghép nhiều widget.
- Không có cách quan sát tiến trình chính: không autoplay/demo và manual quá vụn.
- Learning loop rỗng: chỉ có animation hoặc chỉ có dashboard mà không có dự đoán/quan sát/kết luận.
- Lộ đáp án sớm làm vô hiệu bước dự đoán hoặc quan sát chính.

Warning cần ghi nhưng có thể chấp nhận tạm:

- Text còn dài hoặc title hơi lớn.
- Particle hơi nhiều nhưng vẫn mượt.
- Thiếu keyboard alternative cho drag/drop.
- Chart thiếu tooltip/legend nhưng readout vẫn đủ.
- Thư viện thêm vào hợp lý nhưng verification checks còn thiếu.

## Format Record JSON

Dùng `templates/evaluation-record.schema.json` làm record chính để loop đọc lại được. Record đặt tại:

`eval-runs/{slug}/{timestamp}.json`

Các field chính:

- Metadata: ngày, output path, chủ đề, pattern, thư viện, `design_family`.
- Learning loop và dependency rationale nếu có.
- Score tổng và điểm từng tiêu chí.
- Validation commands và kết quả.
- Artifact path cho screenshot, trace, video nếu có.
- Điều đã tốt.
- Vấn đề phát hiện.
- Action: sửa output, cập nhật skill, hoặc không cần.

Có thể dùng `templates/evaluation-record.md` để sinh report cho người đọc, nhưng JSON là nguồn chính cho cải tiến tự động.

## Quy Tắc Cải Tiến Skill

- Một lỗi trong một widget: sửa widget hoặc ghi record.
- Cùng lỗi lặp lại 2 lần: cập nhật checklist hoặc interaction pattern.
- Cùng lỗi lặp lại 3 lần: cập nhật `SKILL.md` hoặc template blueprint.
- Nếu một thư viện gây lỗi/khó dùng lặp lại, hạ khuyến nghị trong `library-recommendations.md`.
- Nếu cùng một loại dependency bị lạm dụng 2 lần, thêm guardrail vào skill/checklist.
- Nếu cùng một loại feedback người dùng lặp lại 2 lần và verify được là lỗi tổng quát, thêm guardrail vào checklist hoặc evaluation loop trước.
- Nếu cùng một loại feedback lặp lại 3 lần ở nhiều family, mới nâng vào `SKILL.md` hoặc template nền.
- Khi sửa output dựa trên record, dùng `templates/improvement-prompt.md` để giữ scope sửa hẹp và tránh rewrite toàn bộ khi không cần.

## Không Làm Template Cứng Nhắc

Loop phải kiểm soát `invariants`, không khóa visual style. Widget có thể đổi bố cục, palette, camera, interaction và thư viện miễn là:

- Đúng Hóa học.
- Có learning loop rõ.
- Thí nghiệm là trọng tâm.
- Code tự chứa, scoped, có fallback.
- Có cách để học sinh quan sát tiến trình đủ nhanh.

## Nguồn Chính

- Playwright visual comparisons: https://playwright.dev/docs/test-snapshots
- Playwright screenshots: https://playwright.dev/docs/screenshots
- Playwright emulation: https://playwright.dev/docs/emulation
- Playwright trace viewer: https://playwright.dev/docs/trace-viewer
- Playwright videos: https://playwright.dev/docs/videos
- Playwright best practices: https://playwright.dev/docs/best-practices
- JSON Schema validation draft 2020-12: https://json-schema.org/draft/2020-12/json-schema-validation
