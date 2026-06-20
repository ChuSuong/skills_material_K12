# Library Recommendations

Dùng tài liệu này khi widget cần sinh động hơn mức CSS/JS tự viết: chuyển động nhiều bước, physics 2D, particle effects, đồ thị, drag/snap phức tạp, hoặc viewer phân tử thật.

Nguyên tắc chung: mỗi widget chỉ thêm thư viện khi nó làm rõ khái niệm Hóa học, hành động học tập của học sinh, hoặc cơ chế assessment/readout. Không thêm thư viện chỉ để trang trí.

## Guardrails

- Mỗi widget nên dừng ở mức `1 renderer chính + 1 animation engine + 1 helper library`.
- Không mix `Three.js` và `PixiJS` trừ khi có lý do rất rõ và có kiểm tra performance riêng.
- Không dùng physics engine để ám chỉ kinetics, thermo hoặc fluid behavior là “mô phỏng thật”.
- Không dùng molecular viewer để thay cho thí nghiệm; viewer chỉ phục vụ bài học về hình học/cấu trúc.
- Mỗi thư viện thêm vào phải kéo theo `verification checks` cụ thể trong record hoặc checklist.

## Bộ Mặc Định Khuyến Nghị

| Nhu cầu | Thư viện nên dùng | Khi dùng | Khi tránh |
|---|---|---|---|
| Scene 3D phòng thí nghiệm | `Three.js` | Cốc, ống nghiệm, phân tử minh họa, bọt khí, điện cực, chất lỏng, kết tủa 3D | Widget chỉ là quiz/sắp xếp đơn giản |
| Timeline phản ứng | `GSAP` | Chuỗi nhiều bước, cần pause/resume/replay/progress, hoặc mapping rõ các mốc phản ứng | Chỉ có 1-2 animation CSS đơn giản |
| Đồ thị phổ thông | `Chart.js` | pH chuẩn độ, nồng độ-thời gian, tốc độ phản ứng, nhiệt độ-thời gian | Cần đồ thị tùy biến rất sâu hoặc siêu nhẹ |
| Bọt/khói/kết tủa nhẹ | particle tự viết trong `Three.js` hoặc Canvas | Bọt khí, hạt kết tủa, độ đục, khói, tia lửa nhỏ | Scene Three.js đã tự render particle đủ tốt |

## Thư Viện Optional Theo Tình Huống

| Nhóm | Thư viện | Use case Hóa học K12 | Ưu điểm | Rủi ro | Khuyến nghị |
|---|---|---|---|---|---|
| Physics 2D | `Matter.js` | Dụng cụ va chạm, vật thể rơi, cân bằng cơ học, mini-game thao tác | Dễ dùng hơn Planck.js; đủ cho rigid-body 2D | Không mô phỏng hóa học thật; cần body count thấp, sleeping và reset sạch | Optional-first cho mini-game/lab 2D |
| Physics 2D nâng cao | `Planck.js` | Joint, constraint, Box2D-style mechanics phức tạp | Mạnh và ổn định cho physics 2D | API khó hơn Matter.js; thường dư cho K12 | Chỉ dùng khi Matter.js không đủ |
| Drag/gesture | `interact.js` | Dropzone, snap, inertia, resize/rotate dụng cụ | Hợp cho drag/drop HTML/SVG phức tạp | Dư nếu pointer events tự viết là đủ | Optional cho thao tác dụng cụ phức tạp |
| Molecular viewer | `3Dmol.js` | Hình học phân tử, cấu trúc không gian, VSEPR, chiral cơ bản | Đúng domain Hóa | Không thay cho reaction/lab scene; cần dữ liệu chuẩn | Optional chemistry-specific |
| Molecular viewer nặng | `Mol*` | Protein, đại phân tử, sinh-hóa nâng cao | Rất mạnh cho PDB/mmCIF | Bundle rất nặng, không hợp đa số K12 | Chỉ dùng khi bài thật sự cần đại phân tử |
| Công thức cấu tạo/editor | `Kekule.js` | Xem/vẽ công thức cấu tạo 2D, editor phân tử, cấu trúc hữu cơ | Đúng domain chemoinformatics | Setup/bundle nặng hơn nhu cầu thường gặp | Optional, ưu tiên module nhỏ |
| Chart tùy biến | `D3` | Đồ thị bespoke, marker giải thích điểm tương đương, sơ đồ electron/ion | Linh hoạt tối đa | Dễ over-engineer; code dài | Optional khi Chart.js không đủ |
| Chart nhẹ | `uPlot` | Time-series nhiều điểm, cần siêu nhẹ | Nhanh, nhỏ | API tiện ích ít hơn, annotation phải tự làm | Optional thay Chart.js khi cần tối ưu tải |
| Chart khoa học nặng | `Plotly.js` | 3D scatter/surface, hover/zoom khoa học phức tạp | Nhiều chart type có sẵn | Rất nặng | Không mặc định |
| Particle nâng cao | `tsParticles` | Overlay 2D cần preset/config rõ, độc lập với scene chính | Hiện đại, nhiều option | Config dài, bundle lớn, dễ biến bài thành screensaver | Optional khi particle tự viết không đủ |
| 2D WebGL game | `PixiJS` | Sprite lab 2D lớn, ion chạy mượt, game thí nghiệm nhiều asset | Render 2D mạnh | Nặng và trùng vai trò nếu đã dùng Three.js | Chỉ dùng cho game 2D lớn |
| Animation nhẹ | `Motion` | Spring/stagger DOM/SVG nhẹ | Gọn, hiện đại | ESM/CDN module cần setup cẩn thận | Optional thay GSAP cho animation nhỏ |
| Animation nhẹ | `Anime.js` | SVG path, giọt hóa chất, counter/readout | API đơn giản | Không dùng chung với GSAP trong cùng widget | Optional, chọn một trong GSAP/Anime/Motion |

## Decision Matrix

| Learning goal | Preferred lib | Avoid when | Verification checks |
|---|---|---|---|
| Quan sát phản ứng nhiều bước có pause/replay | `GSAP` | Chỉ có 1-2 transition đơn giản | Có `pause/play/restart`; timeline bám các bước như `drop`, `mix`, `gas`, `color-shift`, `graph-update` |
| Apparatus/game 2D có va chạm hoặc rơi | `Matter.js` | Đang mô tả kinetics/thermo thật | Body count thấp, reset world sạch, wording không overclaim “mô phỏng hóa học thật” |
| Apparatus 2D cần joint/constraint khó | `Planck.js` | Matter.js đã đủ | Có lý do vì sao Matter.js không đủ; test reset/constraint ổn định |
| Chart phổ thông cho học sinh đọc nhanh | `Chart.js` | Cần chart siêu nhẹ hoặc tùy biến thấp-level sâu | Chart không chiếm sân khấu; readout/annotation giải thích điểm học tập chính |
| Time-series nhiều điểm, ưu tiên nhẹ | `uPlot` | Cần tooltip/legend/annotation sư phạm sẵn | Có annotation hoặc marker tự viết; không biến widget thành dashboard |
| Sơ đồ/đồ thị bespoke là nội dung học | `D3` | Chỉ cần chart cơ bản | Có annotation, marker, hoặc tương tác học tập mà Chart.js không đáp ứng tốt |
| Xem hình học/cấu trúc phân tử | `3Dmol.js` | Đang cần lab scene hoặc phản ứng động | Có câu hỏi quan sát cấu trúc; input data chuẩn; không ám chỉ viewer là phản ứng |
| 2D asset-heavy hoặc ion/sprite dày | `PixiJS` | Đã có Three.js scene chính và overlay nhẹ là đủ | Không chồng renderer vô lý; kiểm tra texture cleanup và perf mobile |
| Overlay particle 2D chuyên biệt | `tsParticles` | Particle tự viết đã đủ | Có particle budget, fallback rõ, mobile check, particle không che hiện tượng chính |

## Mapping Theo Loại Thí Nghiệm

| Loại widget | Thư viện gợi ý | Ghi chú |
|---|---|---|
| `kinetics-time-slider` | Three.js + Chart.js; GSAP nếu có chuỗi chạy tự động | Particle nên tự viết trong Three.js để tránh thêm dependency |
| `variable-comparison-lab` | Three.js + GSAP | GSAP điều phối hai hoặc ba bình phản ứng cùng lúc |
| `apparatus-drag-drop` | Three.js + pointer events; thêm interact.js nếu cần snap/dropzone phức tạp | Tránh native HTML5 drag/drop nếu cần tablet |
| `timeline-classification` | Matter.js hoặc interact.js; GSAP cho feedback đúng/sai | Nếu chỉ sắp xếp đơn giản, DOM/CSS tự viết đủ |
| `virtual-mix-lab` | Three.js + particle tự viết; Chart.js nếu có readout theo thời gian | `tsParticles` chỉ dùng cho overlay 2D độc lập có lý do rõ |
| `titration-ph-indicator` | Chart.js + GSAP; Three.js nếu cần burette/cốc 3D | Chart.js làm pH curve mặc định |
| `electrolysis-redox-cell` | Three.js + GSAP; D3 nếu cần sơ đồ electron/ion 2D | Motion/electron phải bám đúng chiều dòng electron/ion |
| `equilibrium-le-chatelier` | Three.js hoặc D3; GSAP cho shift cân bằng | Ghi rõ mô hình định tính nếu population hạt là minh họa |
| Molecular viewer | 3Dmol.js; chỉ dùng Mol* cho đại phân tử | Không dùng viewer phân tử làm bằng chứng phản ứng đang xảy ra |
| Organic structure/editor | Kekule.js hoặc SVG tự viết | Chỉ dùng Kekule.js nếu cần editor/cấu trúc 2D thật |

## Quy Tắc Tích Hợp

- Chỉ chọn một thư viện animation chính trong mỗi widget: `GSAP`, `Anime.js`, hoặc `Motion`.
- Pin version CDN. Không dùng URL không version trong output chia sẻ cho học sinh.
- Luôn có fallback lỗi tải rõ ràng cho thư viện bên ngoài.
- Mỗi thư viện thêm vào phải map sang ít nhất một trong ba mục: `observable chemistry`, `learner action`, `assessment/readout`.
- Không để thư viện physics/particles ngụ ý mô phỏng hóa học định lượng. Ghi rõ "mô phỏng định tính" khi chuyển động chỉ là minh họa.
- Nếu đã dùng Three.js để render particle 3D, tránh thêm `tsParticles` trừ khi cần overlay 2D độc lập.
- Với file HTML tự chứa, ưu tiên ít dependency hơn. Mức tải hợp lý: 1 thư viện 3D + 1 thư viện chart hoặc animation là đủ cho đa số bài.
- Nếu cần offline tuyệt đối, copy asset/library local theo workflow dự án thay vì CDN.

## Quyết Định Nhanh

- Nếu cần phòng thí nghiệm 3D: dùng Three.js.
- Nếu cần đồ thị học sinh đọc được: thêm Chart.js.
- Nếu cần chuỗi animation nhiều bước, pause/resume/reset hoặc replay: thêm GSAP.
- Nếu chỉ cần kéo-thả phân loại: dùng DOM/SVG/CSS và pointer events.
- Nếu chỉ cần bọt khí, kết tủa, ion: tự viết particle nhẹ trong Canvas hoặc Three.js trước.
- Nếu cần mô phỏng va chạm vật lý thật: cân nhắc Matter.js trước Planck.js.
- Nếu cần xem phân tử 3D thật: cân nhắc 3Dmol.js.
- Nếu thư viện không làm rõ khái niệm Hóa học hơn, không thêm.

## Fallback Khi Lỗi Tải

Mọi widget dùng CDN phải có fallback UI rõ ràng:

- Không để vùng canvas trắng.
- Hiển thị thông báo tiếng Việt có dấu.
- Nêu thư viện hoặc năng lực trình duyệt nào không tải hoặc không hỗ trợ.
- Vẫn giữ mục tiêu học tập, phương trình, mô tả hiện tượng hoặc bảng quan sát ở ngoài canvas.
- Nếu có thể, fallback sang sơ đồ SVG/CSS tĩnh.

Với Three.js:

- Kiểm tra WebGL trước khi gọi `new THREE.WebGLRenderer()`.
- Không khởi tạo renderer nếu `THREE` chưa tồn tại.
- Nếu WebGL không khả dụng, hiển thị mô tả hiện tượng hoặc sơ đồ 2D thay thế.

## Loader Pattern

Khi dùng CDN, dùng loader có fallback tương tự:

```js
function loadScript(urls, globalName, done, fail) {
  if (window[globalName]) { done(window[globalName]); return; }
  let index = 0;
  function tryUrl() {
    if (index >= urls.length) {
      fail("Không tải được " + globalName + ".");
      return;
    }
    const script = document.createElement("script");
    script.src = urls[index++];
    script.onload = function() {
      window[globalName] ? done(window[globalName]) : tryUrl();
    };
    script.onerror = tryUrl;
    document.head.appendChild(script);
  }
  tryUrl();
}
```

Giữ loader bên trong IIFE của widget, không đưa ra global.

## Nguồn Chính

- GSAP timeline docs: https://gsap.com/docs/v3/GSAP/Timeline/
- Matter.js docs: https://brm.io/matter-js/docs/
- Planck.js README: https://github.com/piqnt/planck.js/
- PixiJS intro: https://pixijs.com/8.x/guides/getting-started/intro
- PixiJS performance tips: https://pixijs.com/8.x/guides/concepts/performance-tips
- D3 “What is D3?”: https://d3js.org/what-is-d3
- uPlot repo/docs: https://github.com/leeoniya/uPlot
- 3Dmol.js docs: https://3dmol.csb.pitt.edu/doc/index.html
- 3Dmol.js learning environment tutorial: https://3dmol.csb.pitt.edu/doc/tutorial-learning_environment.html
- tsParticles options: https://particles.js.org/options
