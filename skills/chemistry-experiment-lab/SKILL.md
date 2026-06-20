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
7. Với mỗi output HTML/JSX trừ sửa nhanh rất nhỏ, chạy vòng `design -> generate -> validate -> verify -> score -> record -> improve` trong `references/evaluation-loop.md`.
8. Lưu output vào `outputs/{slug}.html` hoặc `outputs/{slug}.jsx` trong thư mục skill này.

## Hợp Đồng Output

Với HTML 3D:

- Tạo một file HTML mở được trực tiếp bằng trình duyệt, có inline CSS và JS.
- Dùng Three.js cho scene 3D chính, trừ khi tương tác phù hợp hơn với 2D sorting/game.
- Load Three.js với ít nhất hai CDN fallback, và hiển thị lỗi rõ ràng nếu WebGL hoặc thư viện không tải được.
- Khi dùng thêm thư viện JS, chỉ chọn thư viện thật sự cần cho mục tiêu học tập; pin version CDN, có fallback lỗi tải, và không trộn nhiều thư viện cùng vai trò.
- Mỗi dependency ngoài Three.js phải có lý do rõ: phục vụ `observable chemistry`, `learner action`, hoặc `assessment/readout`; không thêm thư viện chỉ để tăng wow.
- Giới hạn thông thường: tối đa `1 renderer chính + 1 animation engine + 1 helper library` cho mỗi widget. Nếu vượt quá, ghi lý do trong code/data model.
- Giữ root id duy nhất, ví dụ `chem-exp-{slug}`, và scope toàn bộ CSS dưới root đó.
- Tránh global name như `GK`, `gkStart`, `gkLoadThree`; bọc JS trong IIFE hoặc namespace theo từng root.
- Ghi rõ độ trung thực của mô hình trong code/data: định tính, bán định lượng, hoặc định lượng.
- Ưu tiên autoplay hoặc một nút chạy toàn bộ thí nghiệm nếu mục tiêu học tập là quan sát tiến trình; vẫn giữ pause/reset/chỉnh tay khi cần.
- Layout phải lab-first: vùng thí nghiệm/đồ thị là trọng tâm, tiêu đề và chú thích gọn, không dùng hero headline lớn chiếm màn hình.
- Tránh layout kiểu dashboard nhiều card. Trên desktop, vùng sân khấu thí nghiệm nên chiếm khoảng 70-85% diện tích nhìn đầu tiên; chỉ số/đồ thị nên là overlay nhỏ, strip mỏng, hoặc panel phụ dưới 25% diện tích.
- Không sinh panel riêng chỉ để lặp lại `predict -> observe -> compare -> explain` bằng text. Learning loop là logic thiết kế nội bộ; chỉ render ra UI khi nó thêm thông tin mới hoặc tạo thao tác học tập rõ ràng.

Với tương tác 2D:

- Dùng SVG/CSS/DOM khi mô hình 3D không làm tăng giá trị học tập.
- Ưu tiên pointer-based drag thay vì native HTML5 drag/drop nếu cần hỗ trợ tablet/mobile.
- Feedback phải tức thì: đúng/sai, hiện tượng quan sát được, và giải thích khoa học.
- Với game/phân loại, có thể manual-first nếu thao tác của học sinh là mục tiêu chính; vẫn nên có reset và replay.

## Schema Thí Nghiệm

Trước khi code, định nghĩa data model nhẹ trong comment hoặc JS data:

```js
const EXPERIMENT = {
  title: "Ảnh hưởng của nồng độ đến tốc độ phản ứng",
  grade: "Hóa 10",
  mode: "bán định lượng",
  learningGoal: "Liên hệ nồng độ với tần suất va chạm hiệu quả.",
  learningLoop: {
    predict: "Cốc nào làm dấu X biến mất nhanh nhất?",
    observe: "Quan sát độ đục và thời gian mất dấu X.",
    compare: "So sánh ba cốc theo nồng độ.",
    explain: "Nồng độ cao làm tăng số va chạm hiệu quả."
  },
  reaction: {
    equation: "Na2S2O3 + H2SO4 -> Na2SO4 + SO2 + S + H2O",
    note: "Mô phỏng định tính hiện tượng kết tủa S làm mờ dấu X."
  },
  variables: [{ id: "concentration", label: "Nồng độ", unit: "%", min: 30, max: 100 }],
  observations: ["dung dịch đục dần", "dấu X biến mất", "tốc độ tăng khi nồng độ tăng"]
};
```

Dùng tiếng Việt có dấu cho UI học sinh. Có thể giữ công thức và parser ở ASCII trong data, rồi render subscript/superscript ở UI.

## Chính Sách UI/UX

- Không dùng template giao diện cứng nhắc. Mỗi widget được tự do chọn bố cục, màu, nhịp chuyển động và hình thức phù hợp khái niệm.
- Giữ phần title nhỏ và định hướng nhanh: thường 18-28px trong panel/tool surface, tránh H1 hero 50px+ trừ khi user thật sự yêu cầu landing page.
- Vùng thí nghiệm, đồ thị, mô hình hoặc game phải chiếm phần nhìn chính. Text giải thích nên là caption, badge, readout, panel gọn hoặc collapsible.
- Nếu có nhiều số liệu, chỉ hiển thị 2-4 chỉ số sống quan trọng nhất ở kích thước nhỏ; đưa phần còn lại vào tooltip, mini chart hoặc trạng thái ẩn/mở rộng.
- Trong first viewport, mặc định chỉ giữ tối đa `2 panel phụ giá trị cao` bên cạnh stage. Nếu cần nhiều hơn, phải có lý do sư phạm mạnh và mỗi panel phải thêm thông tin không trùng lặp.
- Ưu tiên bố cục giống các mẫu `src/brainstorm`: một sân khấu 3D lớn, overlay thủy tinh nhỏ, control rõ nhưng không chiếm sân khấu. Không biến output thành trang dashboard/báo cáo.
- Tuy nhiên, nếu giá trị sư phạm đến từ `so sánh`, `dự đoán theo mốc`, `đọc đồ thị`, hoặc `control panel` rõ ràng, có thể dùng layout `stage + side panel` hoặc `stage + chart panel` lớn hơn. Không phạt layout nhiều panel nếu chính các panel đó là nơi học sinh suy luận.
- Mặc định autoplay cho tiến trình quan sát như chuẩn độ, phân hủy, kết tủa, điện phân, cân bằng dịch chuyển. Dùng manual-first cho bài mà thao tác kéo/thả/chọn đáp án là nội dung học tập.
- Nếu autoplay, cần có `Tạm dừng`, `Chạy lại` hoặc control tương đương; nếu manual-first, nên có `Chạy demo` để giáo viên/học sinh xem toàn bộ nhanh.
- Chú thích không được che vùng thí nghiệm; ưu tiên overlay nhỏ hoặc side panel hẹp.
- Với bài 3D, mặc định nên có orbit/drag hoặc camera interaction nhẹ nếu nó giúp đọc hiện tượng rõ hơn mà không làm UX rối.
- Hiện tượng chính phải đọc được trong vài giây đầu: tăng tương phản, kích thước vùng tác động, particle density hoặc motion amplitude khi cần; tránh scene đẹp nhưng dấu hiệu hóa học quá mờ.
- Motion phải có ý nghĩa sư phạm: mỗi biến đổi chính cần map được sang một bước học như dự đoán, quan sát, so sánh hoặc giải thích.
- Nếu thêm hiệu ứng đẹp nhưng không tạo ra quan sát hoặc quyết định học tập nào, ưu tiên bỏ bớt hiệu ứng thay vì giữ lại.

## Nhóm Tương Tác

- `kinetics-time-slider`: kéo thời gian, readout nồng độ, tốc độ trung bình, marker trên đồ thị, phân tử/bọt khí động.
- `variable-comparison-lab`: so sánh chất xúc tác, nồng độ, nhiệt độ, diện tích bề mặt, hoặc áp suất giữa hai bình.
- `apparatus-drag-drop`: kéo đèn cồn/ống nhỏ giọt/thìa hóa chất/chất rắn vào vùng đích để kích hoạt phản ứng.
- `timeline-classification`: sắp xếp phản ứng theo thang thời gian hoặc phân loại hiện tượng.
- `virtual-mix-lab`: chọn thuốc thử, trộn, quan sát khí/kết tủa/đổi màu/nhiệt, rồi mở phương trình.
- `titration-ph-indicator`: thêm chất chuẩn từng bước, hiển thị đường cong pH, màu chỉ thị, điểm tương đương.
- `electrolysis-redox-cell`: nối mạch điện, mô phỏng ion/electron, sản phẩm điện cực và bán phản ứng.
- `equilibrium-le-chatelier`: thay đổi nồng độ, nhiệt độ, hoặc áp suất và quan sát cân bằng dịch chuyển.

## Mặc Định Về Thư Viện

- Dùng `Three.js` làm nền tảng 3D mặc định cho scene phòng thí nghiệm.
- Dùng `GSAP` làm animation engine mặc định khi widget cần timeline nhiều bước, pause/resume/replay, hoặc mapping rõ các mốc phản ứng.
- Dùng `Chart.js` cho đồ thị thí nghiệm phổ thông như pH, nồng độ-thời gian, tốc độ.
- Dùng particle tự viết nhẹ trong `Three.js` hoặc Canvas trước; chỉ thêm `tsParticles` khi cần overlay 2D có preset/config rõ.
- Ưu tiên `Matter.js` trước `Planck.js` cho apparatus/game 2D; `Planck.js` chỉ dùng khi thật sự cần joint/constraint kiểu Box2D.
- Dùng `3Dmol.js` khi mục tiêu là xem hình học/cấu trúc phân tử thật; không dùng nó thay cho lab scene hoặc để ám chỉ phản ứng đang xảy ra thật.
- Chỉ dùng `PixiJS`, `D3`, `uPlot`, `Planck.js`, `tsParticles`, `Mol*`, `Kekule.js`, hoặc `Plotly.js` khi `references/library-recommendations.md` cho thấy phù hợp.

## Tài Liệu Tham Chiếu

- Đọc `references/interaction-patterns.md` khi mapping yêu cầu sang pattern UI/JS.
- Đọc `references/library-recommendations.md` khi chọn thư viện animation, physics, particles, chart, drag/gesture, hoặc molecular viewer.
- Đọc `references/experiment-catalog.md` khi brainstorm kế hoạch bao phủ môn Hóa.
- Đọc `references/implementation-checklist.md` trước khi code hoặc review widget đã sinh.
- Đọc `references/evaluation-loop.md` khi cần chấm điểm, ghi record, hoặc nâng cấp skill từ kết quả test.
- Dùng `scripts/verify-widget.sh` khi cần verify desktop/mobile, screenshot artifact, và invariant checks cho một HTML output cụ thể.
- Dùng `templates/single-widget-blueprint.html` làm khung kỹ thuật gọn cho widget Three.js tự chứa; không copy nguyên visual style nếu chủ đề cần một bố cục khác.
- Dùng `templates/evaluation-record.schema.json` làm schema record máy đọc được trong `eval-runs/{slug}/{timestamp}.json`.
- Dùng `templates/evaluation-record.md` nếu cần báo cáo người đọc trong `evaluations/`.
- Dùng `templates/improvement-prompt.md` khi cần sửa output dựa trên record mà không rewrite tùy tiện.

## Chuẩn Chất Lượng

Mỗi widget hoàn chỉnh cần đạt các điểm sau:

- Học sinh có một hành động cụ thể, không chỉ xem animation.
- Widget có `learning loop` rõ: ít nhất một dự đoán hoặc lựa chọn của học sinh, một quan sát chính, và một kết luận ngắn.
- Hiện tượng nhìn thấy được gắn trực tiếp với khái niệm Hóa học bằng giải thích ngắn.
- Mô phỏng không tạo cảm giác chính xác giả; mô hình định tính phải được nói rõ trong wording.
- Nhiều widget có thể cùng nằm trên một trang mà không xung đột CSS, id, hoặc JS.
- Layout desktop và mobile giữ control dễ đọc, scene 3D không bị trắng hoặc lệch khung.
- Dependency không được lấn át bài học: nếu thư viện hoặc hiệu ứng làm giảm tính lab-first hoặc không phục vụ mục tiêu học tập, phải bỏ hoặc đổi.
- Widget nên đạt tối thiểu 80/100 theo rubric trong `references/evaluation-loop.md`; nếu thấp hơn, sửa output hoặc ghi rõ lý do chấp nhận.
