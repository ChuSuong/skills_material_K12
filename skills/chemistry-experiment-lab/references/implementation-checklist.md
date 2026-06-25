# Implementation Checklist

Dùng checklist này trước khi code và trước khi review lần cuối.

## Phạm Vi Và Sư Phạm

- Nêu mục tiêu học tập trong một câu.
- Nêu `learning loop` tối thiểu: học sinh cần dự đoán/chọn gì, quan sát gì, và kết luận gì.
- Quyết định độ trung thực: định tính, bán định lượng, hoặc định lượng.
- Thêm phương trình cân bằng khi hữu ích; tránh nhồi phương trình nếu bài học đang ưu tiên quan sát hiện tượng.
- Không để các giá trị minh họa trông như hằng số thực nghiệm thật.
- Với thí nghiệm xúc tác, thể hiện rõ xúc tác làm tăng tốc độ nhưng không bị tiêu hao.
- Với thí nghiệm tốc độ, tách proxy quan sát được khỏi định luật tốc độ thật.

## Hợp Đồng HTML

- Một root node với id duy nhất.
- Inline CSS được scope dưới root id.
- Inline JS được bọc trong IIFE.
- Không dùng `document.querySelector` thiếu scope; dùng `root.querySelector`.
- Không dùng global `GK`, `gkStart`, `gkFail`, hoặc id cố định trùng lặp.
- Lưu file sinh ra dưới `skills_material_K12/skills/chemistry-experiment-lab/outputs/`.

## Hợp Đồng Three.js

- Load Three.js với CDN fallback:
  - `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`
  - `https://unpkg.com/three@0.137.0/build/three.min.js`
- Kiểm tra WebGL trước khi gọi `new THREE.WebGLRenderer()`.
- Render trạng thái lỗi rõ ràng nếu thư viện không tải được.
- Dùng `renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2))`.
- Resize bằng `ResizeObserver` khi có và fallback `window.resize`.
- Giữ camera framing ổn định trên desktop và mobile.
- Giữ số lượng particle vừa phải cho thiết bị học sinh.

## Hợp Đồng Thư Viện Ngoài

- Đọc `library-recommendations.md` trước khi thêm thư viện ngoài Three.js.
- Chỉ thêm thư viện khi nó phục vụ trực tiếp mục tiêu học tập hoặc làm interaction ổn định hơn.
- Nếu thêm thư viện mới, ghi rõ nó phục vụ `observable chemistry`, `learner action`, hay `assessment/readout`.
- Không thêm thư viện chỉ để tăng wow; nếu không kéo theo quan sát hoặc quyết định học tập rõ ràng, bỏ thư viện.
- Pin version CDN; không dùng URL không version cho file chia sẻ.
- Có fallback lỗi tải cho từng thư viện bắt buộc.
- Fallback không được chỉ là canvas trắng; vẫn cần giữ mục tiêu học tập, phương trình hoặc mô tả hiện tượng ở dạng text.
- Không trộn nhiều thư viện cùng vai trò: chọn một trong `GSAP`, `Anime.js`, hoặc `Motion` cho animation timeline.
- Không dùng physics/particles để ngụ ý mô phỏng định lượng nếu mô hình chỉ là minh họa.
- Nếu thêm nhiều hơn 2 dependency ngoài Three.js, ghi lý do ngắn trong comment gần data model.

## Hợp Đồng Tương Tác

- Có một hành động chính của học sinh, thấy được mà không cần đọc hướng dẫn dài.
- Có ít nhất một bước `dự đoán` hoặc `lựa chọn` trước/sau khi hiện tượng xảy ra.
- Mặc định có chế độ auto-run/demo cho thí nghiệm quan sát tiến trình; không bắt người dùng bấm nhiều lần để thấy toàn bộ hiện tượng.
- Nếu bài học cần học sinh tự thao tác, vẫn nên có nút replay/demo sau khi hoàn thành.
- Pointer drag phải hỗ trợ chuột và touch.
- Với bài 3D, cân nhắc thêm orbit/drag camera nhẹ nếu nó giúp nhìn rõ điện cực, kết tủa, bọt khí hoặc vùng phản ứng.
- Slider phải hiển thị giá trị hiện tại và đơn vị.
- Thí nghiệm nhiều bước cần nút reset.
- Hành động sai cần có feedback cục bộ, không được im lặng.
- Thay đổi trạng thái quan trọng phải cập nhật cả hình ảnh và text readout.
- Với bài có đáp án nhận biết/phân loại, không render sẵn bảng đáp án hoặc legend đối chiếu ngay từ đầu. Trước khi hoàn thành quan sát chính, UI chỉ nên nhắc dự đoán, tiêu chí quan sát, hoặc trạng thái tiến trình.

## Thiết Kế Thị Giác

- Dùng bằng chứng thị giác đặc trưng phòng thí nghiệm: bọt khí, kết tủa, độ đục, màu, nhiệt, thể tích khí, sản phẩm điện cực.
- Lab-first: scene thí nghiệm, đồ thị hoặc vùng thao tác phải là trọng tâm thị giác.
- Trên desktop, stage chính nên chiếm khoảng 70-85% viewport đầu tiên; panel chỉ số, graph, công thức và hướng dẫn cộng lại không nên lấn quá 25-30%.
- Stage lớn phải có “evidence density” đủ cao: nhìn lướt 2-3 giây phải thấy rõ hiện tượng hoặc apparatus đang hoạt động. Không chấp nhận canvas lớn nhưng chỉ có nền tối, vài vật nhỏ, hoặc tín hiệu quá mờ.
- Nếu stage gần như trống còn ý chính nằm ở card bên cạnh, giảm chiều cao stage hoặc đổi sang renderer nhẹ hơn. Không giữ Three.js chỉ để có cảm giác 3D.
- Ngoại lệ có chủ đích: nếu bản chất bài học là so sánh theo panel, đọc đồ thị, hoặc điều khiển biến rồi quan sát hệ quả, panel phụ có thể lớn hơn miễn là nó rõ ràng phục vụ suy luận học tập chứ không chỉ trang trí.
- Trong first viewport, mặc định chỉ dùng tối đa 2 panel phụ có giá trị cao. Không thêm card chỉ để nhắc lại learning loop bằng text.
- Tiêu đề và chú thích gọn; tránh hero headline lớn, card giới thiệu dài hoặc text chiếm màn hình đầu.
- Không dùng layout dashboard 2-3 cột nếu nó làm thí nghiệm nhỏ lại. Đồ thị nên là mini overlay hoặc card phụ nhỏ trừ khi đồ thị là đối tượng học tập chính.
- Chỉ số/readout phải nhỏ và sắc: ưu tiên 2-4 biến quan trọng, font 11-22px; tránh card số liệu lớn có nhiều khoảng trắng.
- Giữ overlay gọn, không che cốc/ống nghiệm đang thao tác.
- Không chỉ dựa vào màu; ghép màu với nhãn hoặc readout.
- Hiện tượng hóa học phải nhìn ra nhanh: nếu lớp đồng, bọt khí, độ đục, kết tủa hoặc đổi màu còn mờ, tăng scale/tương phản/mật độ particle trước khi thêm text giải thích.
- Text tiếng Việt có dấu, ngắn, đủ lớn trên mobile.
- Tránh trang trí lấn át thí nghiệm.

## Accessibility

- Ưu tiên native range input khi phù hợp.
- Button cần label rõ ràng.
- Status text phải cập nhật ở vùng đọc được.
- Không để điều khiển duy nhất là mouse-only drag nếu có thể thêm button/slider tương đương.

## Validation

- Mở HTML sinh ra trong trình duyệt hoặc server nhẹ khi có thể.
- Xác nhận canvas không trắng sau khi Three.js load.
- Kiểm tra auto-run/demo: mở trang là thấy tiến trình chạy, hoặc một nút chính chạy toàn bộ không cần thao tác lặp.
- Kiểm tra layout: title/chú thích không lấn át vùng thí nghiệm ở desktop và mobile.
- Kiểm tra stage không bị “to nhưng trống”: khi che toàn bộ panel phụ và chỉ nhìn vùng stage, vẫn phải đọc ra hiện tượng chính hoặc apparatus chính.
- Nếu stage có chiều cao rất lớn nhưng chỉ có ít tín hiệu thị giác, coi là fail review kể cả khi JS chạy bình thường.
- Kiểm tra `spoiler`: trước khi bấm demo hoặc trước khi hoàn thành bước quan sát chính, learner không được nhìn thấy mapping đáp án đầy đủ qua status, legend, focus box, card kết quả, hoặc caption.
- Nếu dùng Playwright hoặc browser automation, kiểm tra desktop và mobile emulation có screenshot artifact.
- Nếu dùng Chart.js/GSAP/Matter.js/3Dmol.js hoặc thư viện khác, kiểm tra fallback khi CDN fail bằng cách nhìn có message lỗi rõ ràng trong code.
- Nếu dùng `GSAP`, kiểm tra có `pause/resume/restart` hoặc control tương đương.
- Nếu dùng `Matter.js`/`Planck.js`, kiểm tra reset world sạch và body count hợp lý.
- Nếu dùng `PixiJS`, kiểm tra không đồng thời render thêm scene Three.js nặng nếu không cần.
- Nếu dùng `3Dmol.js`, kiểm tra có prompt/hướng dẫn quan sát cấu trúc thay vì chỉ xoay cho vui.
- Nếu dùng WebGL, kiểm tra code có nhánh xử lý thiết bị/trình duyệt không hỗ trợ WebGL.
- Test desktop khoảng 1200x800 và mobile khoảng 390x844.
- Kéo mọi draggable và reset sau một lượt hoàn chỉnh.
- Kiểm tra phương trình, sản phẩm, màu/kết tủa/khí.
- Search file để tìm global rủi ro: `var GK`, `function gk`, `document.querySelector(".`, `*{`.
- Search file để tìm URL CDN không pin version hoặc quá nhiều dependency không cần thiết.
- Search id trùng nếu ghép nhiều widget.
- Nếu là forward-test hoặc output quan trọng, chấm theo `evaluation-loop.md` và ghi JSON record vào `eval-runs/`; có thể thêm report Markdown trong `evaluations/` khi cần người đọc.

## Naming

- Tên file: lowercase kebab-case không dấu, ví dụ `lab-toc-do-h2o2.html`.
- Root id: prefix `chem-exp-`, ví dụ `chem-exp-toc-do-h2o2`.
- Data id: ASCII only, ví dụ `h2o2`, `mnO2` nên chuyển thành `mno2` trong id.
