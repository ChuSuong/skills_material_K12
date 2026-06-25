# Interaction Patterns

Tài liệu này tổng hợp các pattern tái sử dụng từ `skills_material_K12/src/brainstorm/*.md` và chuyển chúng thành quy tắc sinh widget an toàn hơn.

## Bản Đồ Pattern Nguồn

| Nguồn | Khái niệm | Tương tác | Render |
|---|---|---|---|
| `brainstorm.md` | Tốc độ trung bình phân hủy H2O2 | Kéo thời gian, readout nồng độ, đồ thị SVG | Cốc Three.js, phân tử, bọt khí |
| `brainstorm_1.md` | Chất xúc tác và năng lượng hoạt hóa | Kéo đèn cồn, kéo thìa MnO2 | Ống nghiệm Three.js, glow nhiệt, bọt khí |
| `brainstorm_2.md` | Diện tích bề mặt và nhiệt độ | Tabs, kéo đá vôi, cối nghiền, đèn cồn | Bình/ống nghiệm Three.js, khí CO2 |
| `brainstorm_3.md` | Ảnh hưởng nồng độ | Range slider, kéo ống nhỏ giọt acid, reset | Cốc Three.js, dấu X, độ đục |
| `brainstorm_4.md` | Phản ứng nhanh/chậm | Kéo item vào slot thang thời gian | Dụng cụ CSS/SVG-style và animation |
| `brainstorm_5.md` | Tốc độ trung bình phân hủy H2O2 | Giống `brainstorm.md` | Cốc Three.js, phân tử, bọt khí |

## Khung Widget Chung

Dùng một root tự chứa:

```html
<div id="chem-exp-topic-slug" class="chem-exp">
  <style>
    #chem-exp-topic-slug { /* biến giao diện */ }
    #chem-exp-topic-slug .stage { position: relative; }
  </style>
  <h2>...</h2>
  <p class="sub">...</p>
  <div class="stage"><canvas></canvas><!-- overlay --></div>
  <script>
    (function(rootId) {
      const root = document.getElementById(rootId);
      // không dùng global
    })("chem-exp-topic-slug");
  </script>
</div>
```

Quy tắc:

- Scope mọi selector dưới root id duy nhất. Tránh `*`, `.tray`, `.slot`, `.gk-card`, hoặc `document.querySelector(".stage")` nếu không scope theo root.
- Dùng id cục bộ theo instance hoặc `root.querySelector("[data-role='...']")`.
- Giữ toàn bộ trạng thái trong một object `state`.
- Chỉ dùng một vòng `requestAnimationFrame` cho mỗi widget và điều khiển bằng state cục bộ.

## Micro-Framework Three.js

Các helper nên tái tạo theo từng widget:

- `loadThree(callback, onFail)`: hai CDN fallback.
- `makeScene(canvas, options)`: renderer, camera, lights, resize, tùy chọn kéo để xoay.
- `atom`, `bond`, `molecule`: chỉ dùng khi hình phân tử thật sự giúp học sinh hiểu bài.
- `glass`, `liquid`, `bubbles`, `precipitate`, `flame`, `dropper`: primitive thị giác cho phòng thí nghiệm.

Không copy lại global `GK` cũ. Nếu helper dài, giữ bên trong IIFE dưới dạng `const kit = {...}`.

## Chọn Thư Viện Chuyển Động

Đọc `library-recommendations.md` trước khi thêm thư viện ngoài. Mặc định:

- Three.js xử lý scene 3D và particle 3D.
- GSAP xử lý timeline phản ứng nhiều bước.
- Chart.js xử lý đồ thị thí nghiệm phổ thông.
- Pointer events tự viết xử lý drag đơn giản; thêm interact.js khi cần snap/dropzone/inertia.
- Matter.js hoặc Planck.js chỉ dùng cho mini-game/physics 2D, không dùng để giả lập chất lỏng hay phản ứng hóa học định lượng.

Không trộn nhiều thư viện cùng vai trò trong một widget. Ví dụ: không dùng đồng thời GSAP, Anime.js và Motion cho cùng timeline.

## Pattern Điều Khiển

### Time Scrubber

Dùng cho tốc độ phản ứng, chu kỳ bán rã, phân hủy, đường cong nồng độ.

State:

```js
const state = { time: 0, maxTime: 12, concentration: 1 };
```

UI:

- Knob kéo được hoặc `<input type="range">`.
- Readout cho thời gian, đại lượng quan sát được, và tốc độ.
- Marker trên đồ thị bằng SVG hoặc canvas overlay.
- Số phân tử, chiều cao chất lỏng, tốc độ bọt khí, hoặc opacity màu gắn với `state`.
- Nếu đồ thị cần axis/tooltip rõ ràng, dùng Chart.js; nếu chỉ cần sparkline nhỏ, SVG tự viết đủ.

### Apparatus Drag

Dùng cho đèn cồn, thìa hóa chất, ống nhỏ giọt, mẫu rắn, điện cực, nhiệt kế.

Quy tắc:

- Ưu tiên pointer events và hit testing bằng bounding box thay vì native HTML5 drag/drop để hỗ trợ touch.
- Thả sai vùng thì snap về vị trí cũ.
- Thả đúng phải kích hoạt một thay đổi rõ: nhiệt tăng, xúc tác xuất hiện, acid được thêm, mạch điện đóng.
- Luôn có nút reset cho thí nghiệm nhiều bước.
- Thêm interact.js khi cần snap vào nhiều vùng thả hoặc drag/resize/rotate dụng cụ phức tạp.

### Variable Slider

Dùng cho nồng độ, nhiệt độ, pH, áp suất, diện tích bề mặt, cường độ ánh sáng.

Quy tắc:

- Hiển thị cả biến đầu vào và quan sát suy ra, không chỉ một con số.
- Nếu công thức được đơn giản hóa, ghi rõ bằng wording: "mô phỏng định tính" hoặc "theo mô hình lớp học".
- Clamp giá trị và luôn hiển thị đơn vị.

### Tabs / Comparative Lab

Dùng khi một chủ đề có hai cơ chế liên quan, ví dụ diện tích bề mặt và nhiệt độ.

Quy tắc:

- Mỗi tab cần giữ state riêng hoặc reset có chủ đích.
- Tránh chạy hai animation WebGL nếu chỉ một pane đang hiển thị, trừ khi cả hai canvas đều cần thiết.

### Timeline / Classification Game

Dùng khi mục tiêu học tập chính là sắp xếp/phân loại, không phải quan sát cơ chế phòng thí nghiệm.

Quy tắc:

- Native HTML5 drag/drop chấp nhận được cho desktop-only, nhưng pointer drag tốt hơn cho tablet K12.
- Đặt đúng phải chạy animation hiện tượng và mở một câu giải thích Hóa học.
- Có câu tổng kết cuối sau khi tất cả item đã đúng.
- Nếu item cần rơi, va chạm, lăn hoặc cân bằng, dùng Matter.js trước; Planck.js chỉ dùng khi cần constraint/joint kiểu Box2D.

## Thư Viện Hiện Tượng

- Khí: bọt trong suốt bay lên, bọt xốp, bóng phồng, ống khí dịch chuyển.
- Kết tủa: hạt xuất hiện rồi lắng xuống; độ đục/opacity tăng; lớp cặn ở đáy.
- Đổi màu: nội suy màu chất lỏng; swatch chỉ thị; front màu lan dần.
- Nhiệt: ngọn lửa, glow, nhiệt kế, phân tử chuyển động nhanh hơn, hiệu ứng hơi.
- Xúc tác: bột/chất rắn riêng biệt xuất hiện nhưng không bị tiêu hao; khi phù hợp, giải thích "xúc tác không bị tiêu hao".
- Cân bằng: mũi tên hai chiều, quần thể hạt, thước đo dịch chuyển Le Chatelier.
- Điện hóa: ion trôi, electron đi ngoài dung dịch, điện cực thay đổi khối lượng.

## Rủi Ro Từ Các File Brainstorm

- Id cố định xung đột khi nhiều snippet cùng nằm trên một trang.
- Global function và listener trên `window` dễ leak.
- CDN fail sẽ tạo canvas trắng nếu không có fallback UI.
- Vị trí phân tử/bọt khí random làm visual test khó ổn định.
- Một số ví dụ là định tính nhưng trông như định lượng; wording phải tránh overclaim.
- Accessibility yếu nếu thiếu keyboard/range alternative và status text đọc được.
