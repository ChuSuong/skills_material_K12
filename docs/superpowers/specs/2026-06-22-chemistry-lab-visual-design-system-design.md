# Visual Design System cho `chemistry-experiment-lab` (theo hướng Brilliant.org)

## Bối cảnh

Skill `chemistry-experiment-lab` đã có guideline mạnh về sư phạm (learning loop dự đoán→quan sát→so sánh→giải thích), layout lab-first, và kỹ thuật HTML tự chứa (xem `SKILL.md`, `references/implementation-checklist.md`, `references/evaluation-loop.md`). Khi xem code thật của một output hiện có (`outputs/khai-niem-toc-do-phan-ung-chang-1.html`), phần cấu trúc/layout/anti-spoiler đều tốt, nhưng phần **thị giác** còn ở mức "AI-generated widget mặc định":

- Font dùng system stack mặc định, không có thang vai trò rõ giữa heading/caption/số liệu.
- Bảng màu chỉ 4-5 CSS variable phẳng, không có lớp elevation/độ sâu.
- Transition chủ yếu `linear` (kể cả ở chỗ học sinh "cảm" được chuyển động, không chỉ progress bar đo thời gian thực).
- Không có preset easing chuẩn khi dùng D3/Chart.js cho đồ thị.

Tham khảo Brilliant.org (nghiên cứu qua web search): điểm mạnh của họ không nằm ở sư phạm "học bằng làm" (skill đã có tương đương qua learning loop), mà ở **độ tinh tế thị giác và chuyển động** — type/color/motion polish nhất quán, không phải mascot/gamification (đã loại khỏi scope theo quyết định bên dưới).

## Mục tiêu

Nâng chất lượng thị giác (type, color, elevation, motion easing) của widget sinh ra từ `chemistry-experiment-lab`, mà **không** thay đổi các invariant sư phạm/layout đang hoạt động tốt (learning loop, lab-first, anti-spoiler, semantic test contract).

## Ngoài phạm vi (Out of scope)

- Micro-celebration/gamification (confetti, streak, mascot, XP) — đã quyết định không đưa vào lần này.
- Sửa lại các output `.html` đã có trong `outputs/`.
- Tạo template CSS/JS cứng nhắc (skill hiện giữ chủ trương "không dùng template giao diện cứng nhắc" — vẫn giữ nguyên).
- Thay đổi cấu trúc thư mục, schema contract, hoặc rubric tổng (100 điểm) của `evaluation-loop.md`.
- Áp dụng cho skill `chemistry-interactive` (đã chốt scope chỉ `chemistry-experiment-lab`).

## Thay đổi 1 — File mới: `references/visual-design-system.md`

File reference mới, đọc khi cần nâng type/color/elevation/motion cho một widget. Có 4 mục, mỗi mục có 1 đoạn code CSS ngắn minh hoạ (ví dụ, không phải template bắt buộc copy nguyên):

### 1. Type scale theo vai trò

- Heading/tiêu đề: 18-28px, weight 700-800 (giữ nguyên rule cũ trong `SKILL.md`).
- Caption/label/section-label: 11-13px, weight 500-700, có thể dùng letter-spacing nhẹ cho label uppercase.
- Số liệu/readout (nồng độ, thời gian, pH, tốc độ...): 16-22px, weight 700-800, ưu tiên font có **tabular figures** (`font-variant-numeric: tabular-nums;`) để số không làm layout nhảy khi giá trị đổi.
- Optional: nếu muốn vượt khỏi "look mặc định hệ thống", có thể nạp 1 webfont (`Inter`, `Manrope`, hoặc `Sora`) qua CDN có version pin, luôn có fallback về system font stack hiện tại nếu tải lỗi. Không bắt buộc — chỉ dùng khi widget cần nâng cấp rõ rệt.
- Optional fluid scale: với widget cần co giãn mượt theo viewport mà không muốn rải nhiều media query, có thể dùng `clamp()` thay px cố định, ví dụ `--font-size-base: clamp(1rem, 0.9rem + 0.5vw, 1.25rem);`. Không bắt buộc — chỉ dùng khi widget có nhiều breakpoint hoặc layout co giãn phức tạp.

### 2. Color system có chiều sâu

Thay bộ biến phẳng kiểu `--ink/--muted/--accent/--accent-2/--bad` bằng cấu trúc thêm tầng nền:

```css
--surface-0: #0b1020; /* nền ngoài cùng */
--surface-1: rgba(255,255,255,.05); /* panel/stage */
--surface-2: rgba(255,255,255,.09); /* card/chip nổi trên panel */
--ink: #e8eefb;
--muted: #9fb2dd;
--accent: #5ad1a8;
--accent-2: #f0b94d;
--danger: #f06868;
```

Quy tắc:
- Chọn `accent`/`accent-2` theo cặp màu hài hòa (analogous hoặc complementary trên color wheel), không chọn ngẫu nhiên hai màu bất kỳ.
- Text trên mọi surface phải đạt contrast tối thiểu rõ ràng — mục tiêu cụ thể `7:1` (tương đương WCAG AAA) cho text thường/readout chính; có thể nới xuống mức AA cho caption rất nhỏ/phụ.
- `surface-0/1/2` dùng để phân tầng nền↔panel↔card, không cần đúng tên biến này nhưng phải có khái niệm tương đương.
- Optional: với widget muốn màu chuyển sắc đều hơn khi nội suy (ví dụ dung dịch đổi màu dần), có thể khai báo màu bằng `oklch()` thay hex/rgb — nội suy trong không gian OKLCH giữ độ sáng/độ bão hòa cảm nhận đều hơn khi blend giữa hai màu xa nhau trên color wheel.

### 3. Elevation/độ sâu

4 cấp rõ ràng, ánh xạ theo vai trò UI:

```css
--elev-1: 0 1px 3px rgba(0,0,0,.12); /* chip, button ở trạng thái nghỉ */
--elev-2: 0 4px 8px rgba(0,0,0,.15); /* card nhỏ, chip hover */
--elev-3: 0 8px 16px rgba(0,0,0,.18); /* panel nổi trên stage */
--elev-4: 0 16px 32px rgba(0,0,0,.2); /* overlay/modal hiếm dùng */
```

- Nền tối: ưu tiên glow nhẹ (box-shadow màu accent mờ) kết hợp shadow đen ở trên.
- Nền sáng: ưu tiên soft shadow xám, tránh glow màu sặc.
- Glassmorphism (nếu dùng panel kính như overlay hiện có): chuẩn hoá recipe `backdrop-filter: blur(8-12px) saturate(150-180%); border: 1px solid rgba(255,255,255,.18-.2);` thay vì mỗi widget tự chế giá trị riêng.
- Không dùng elevation để phá rule lab-first hiện có (stage vẫn phải là trọng tâm chiếm 70-85% viewport).

### 4. Motion easing

- **Cấm `linear`** cho transition mà học sinh "cảm" được trực tiếp: hover, tap, state change, reveal kết quả, chip chọn/bỏ chọn.
- **Ngoại lệ hợp lệ**: progress bar/timeline đo thời gian thực (ví dụ thanh tiến trình phản ứng chạy đúng theo `state.time`) — `linear` ở đây là đúng vì biểu diễn thời gian, không phải cảm giác chuyển động.
- Token duration/easing chuẩn (đặt trong root widget, dùng lại cho mọi transition):
  ```css
  --duration-fast: 150ms;   /* hover, tap, chip chọn/bỏ chọn */
  --duration-normal: 250ms; /* state change, hiện/ẩn panel */
  --duration-slow: 400ms;   /* reveal kết quả, chuyển phase */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);     /* hover/tap — nhanh, dứt khoát */
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);   /* state change — chuẩn, trung tính */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* hiện tượng chính — overshoot nhẹ, có "sự sống" */
  ```
- Hiện tượng chính (đổi màu dung dịch, kết tủa lắng, reveal kết quả...): dùng `--ease-spring` ở duration dài hơn (~600-900ms), hoặc nếu dùng GSAP/Anime.js/Motion thì dùng preset `back`/`elastic` nhẹ của thư viện đó.
- Micro-interaction scale cho phần tử bấm được (button, chip): hover `transform: scale(1.03-1.08)`, active/tap `transform: scale(0.95-0.97)` — giữ nhẹ, tránh giật mạnh gây mất tập trung khỏi stage chính.
- Nếu widget đã dùng `D3` hoặc `Chart.js` cho đồ thị, ưu tiên preset có sẵn trong module `d3-ease` (ví dụ `d3.easeCubicOut`, `d3.easeElasticOut`) thay vì tự đoán cubic-bezier riêng — nguồn: https://d3js.org/d3-ease

Token type/color/elevation/motion ở trên tổng hợp và rút gọn từ skill `modern-web-design` (repo `claudedesignskills` do user cung cấp), chỉ giữ phần áp dụng được cho widget học liệu tự chứa 1 trang; các phần khác của repo đó (3D engine, scroll-trigger, cursor UX, Lottie/Rive, AI personalization, atomic design component system) không liên quan và không đưa vào.

## Thay đổi 2 — `SKILL.md`, mục "Chính Sách UI/UX"

Thêm (không xóa rule cũ):
- 1 dòng trỏ: "Đọc `references/visual-design-system.md` khi cần nâng type scale, color system, elevation, hoặc motion easing cho widget."
- 1 rule bắt buộc ngắn: "Không dùng `transition: ... linear` cho hover, tap, state change, hoặc reveal kết quả mà học sinh cảm nhận trực tiếp; chỉ `linear` hợp lệ cho progress đo thời gian thực."

## Thay đổi 3 — `references/implementation-checklist.md`, mục "Thiết Kế Thị Giác"

Thêm 3 checklist item:
- Có thang type rõ theo vai trò (heading/caption/số liệu), số liệu dùng tabular figures nếu thay đổi liên tục.
- Có tối thiểu 2 cấp elevation/độ sâu phân tầng nền↔panel↔card.
- Không có transition `linear` ở chuyển động cảm nhận trực tiếp (trừ progress đo thời gian thực).

## Thay đổi 4 — `references/evaluation-loop.md`, rubric

Không thêm cột điểm mới. Mở rộng diễn giải "Cách chấm" của tiêu chí **Trực quan và sinh động (15đ)** để gồm cả: type scale rõ vai trò, color system có chiều sâu (không phẳng), elevation hợp lý, và motion easing không bị "máy" (không linear ở chỗ cảm nhận trực tiếp). Giữ nguyên tổng 100 điểm và các tiêu chí khác.

## Thay đổi 5 — `references/library-recommendations.md`

- Thêm dòng `GeoGebra` vào bảng "Thư Viện Optional Theo Tình Huống": dùng khi cốt lõi bài học là hàm số/đồ thị định lượng thật (bậc phản ứng, hằng số cân bằng K, đường chuẩn độ pH theo phương trình) — học sinh tương tác trực tiếp với biểu diễn toán học. Tránh khi cần đồng bộ visual chặt với scene lab chính, vì giao diện GeoGebra (nhúng qua iframe Applet API) không theo style riêng của widget.
- Thêm 1 dòng "Decision Matrix": `Learning goal = đọc/khám phá hàm số định lượng (kinetics order, K cân bằng, đường chuẩn độ)` → `Preferred lib = GeoGebra` → `Avoid when = cần đồng bộ chrome/style với scene lab chính` → `Verification checks = iframe load có fallback lỗi; không dùng GeoGebra để thay cho hiện tượng lab chính`.

## Không thay đổi

- Cấu trúc thư mục, semantic test contract, rubric 100 điểm tổng, các rule lab-first/anti-spoiler/learning-loop hiện có trong `SKILL.md`.
- `chemistry-interactive` skill — không trong scope lần này.
- Không sửa file output `.html`/`.jsx` đã tồn tại trong `outputs/`.

## Rủi ro / lưu ý khi triển khai

- File mới phải nêu rõ đây là **gợi ý nâng chất lượng thị giác**, không phải template bắt buộc — giữ tinh thần "mỗi widget tự do chọn bố cục/màu/nhịp chuyển động" đã có trong `SKILL.md`.
- Khi thêm rule "cấm linear", cần đảm bảo không mâu thuẫn với các nơi đang dùng `linear` hợp lệ cho progress đo thời gian thực (ví dụ `.bar-fill { transition: width linear; }` trong output hiện có) — rule mới phải phân biệt rõ 2 trường hợp.
- GeoGebra là dependency ngoài, cần đi qua `library-recommendations.md` guardrail hiện có (chỉ thêm khi phục vụ rõ mục tiêu học tập, có fallback lỗi tải).
