# Quy tắc chính xác hoá học và UX dễ dùng cho `chemistry-experiment-lab`

## Bối cảnh

Skill `chemistry-experiment-lab` sinh widget HTML thí nghiệm Hoá học K12 bằng cách để Claude tự viết code mỗi lần dựa trên `SKILL.md`, không qua template cố định. Hai vấn đề được nêu ra khi rà soát:

1. **Độ chính xác hoá học**: màu sắc, hiện tượng (kết tủa, khí, đổi màu, ngọn lửa...) hiện không có nguồn tham chiếu cố định nào — Claude tự suy đoán mỗi lần sinh, có rủi ro bịa hoặc sai lệch kiến thức hoá học giữa các lần sinh khác nhau.
2. **UX khi học sinh dùng widget**: 4 điểm cụ thể được xác nhận là vấn đề — (a) không biết bắt đầu thao tác từ đâu, (b) drag/slider khó dùng, (c) khó đọc kết quả/đồ thị, (d) không chắc thao tác đã được ghi nhận (thiếu phản hồi tức thì).

Đã thống nhất chọn hướng **chỉ sửa rule/skill** (không viết thêm automated check, không retrofit lại các widget đã có trong `outputs/`) — nhanh, đúng phạm vi yêu cầu hiện tại. Rủi ro của hướng này (rule có thể bị bỏ qua, không có gì enforce tự động, widget cũ không được sửa) đã được nêu rõ và người dùng chấp nhận đánh đổi để ưu tiên tốc độ.

## Mục tiêu

- Có một nguồn tham chiếu hoá học (màu sắc/hiện tượng) mà Claude phải tra trước khi viết bất kỳ widget mới nào, để giảm tình trạng tự suy đoán/bịa.
- Bổ sung 4 quy tắc UX cụ thể vào `SKILL.md`/`implementation-checklist.md` để giải quyết 4 vấn đề học sinh gặp phải khi dùng widget.
- Không phá vỡ các invariant đang hoạt động tốt (learning loop, lab-first layout, anti-spoiler, semantic test contract).

## Ngoài phạm vi (Out of scope)

- Viết thêm automated check trong `verify-widget.mjs`/`check_widget.py` để enforce các rule mới — chấp nhận rule-only, không có gì tự động chặn nếu Claude bỏ qua.
- Sửa lại các file `.html` đã có trong `outputs/` (kể cả nếu chúng đang sai hiện tượng/UX theo rule mới) — chỉ áp dụng cho widget sinh ra sau khi rule này có hiệu lực.
- Viết "toàn bộ" hoá học K12 trong một lần — `reaction-facts.md` sẽ là tài liệu sống, bổ sung dần, không coi là hoàn chỉnh ngay sau lần soạn đầu.
- Thay đổi schema, contract test, hoặc rubric 100 điểm trong `evaluation-loop.md`.
- Áp dụng cho skill khác ngoài `chemistry-experiment-lab`.

## Thay đổi 1 — File mới: `references/reaction-facts.md`

Một file duy nhất, là nguồn tham chiếu màu sắc/hiện tượng hoá học cho mọi widget sinh ra từ skill này.

**Cấu trúc:**

- Đầu file: đoạn ghi rõ đây là tài liệu sống — ưu tiên chính xác hơn đầy đủ tức thời; nếu phản ứng cần dùng chưa có trong file, Claude phải tự ghi rõ giả định hoá học trong data model (`reaction.note`) thay vì coi im lặng là đã đủ; khi thêm mục mới nên được người có chuyên môn hoá học review trước khi tin làm chuẩn.
- Nội dung chia theo chủ đề (không theo lớp/nhóm tương tác), ví dụ các nhóm chủ đề ban đầu:
  - Axit – bazơ & chất chỉ thị màu (phenolphtalein, quỳ, metyl đỏ, bromothymol blue...).
  - Oxi hoá – khử & điện hoá (điện phân, pin điện hoá, KMnO4, Cr2O7^2-...).
  - Kết tủa & nhận biết ion (AgCl, BaSO4, Fe(OH)3, Cu(OH)2...).
  - Ngọn lửa kim loại (Na vàng, K tím nhạt, Cu xanh lục, Ca đỏ cam...).
  - Khí sinh ra (CO2, SO2, H2, NH3 — màu, mùi, cách nhận biết).
  - Cân bằng dịch chuyển có đổi màu (Fe³⁺/SCN⁻, NO2/N2O4, Co(H2O)6²⁺...).
  - Phạm vi sẽ mở rộng dần khi skill được dùng cho các bài mới, không giới hạn cứng ở danh sách trên.
- Mỗi mục ghi tối thiểu: phản ứng/chất liên quan → hiện tượng quan sát được → màu trước/sau (nếu có) → điều kiện áp dụng/ghi chú độ tin cậy (định tính hay bán định lượng, có ngoại lệ nào cần lưu ý).

## Thay đổi 2 — Cập nhật `SKILL.md`

- Thêm `references/reaction-facts.md` vào mục "Tài Liệu Tham Chiếu", kèm rule bắt buộc: trước khi viết hiện tượng/màu sắc cho phản ứng trong widget, phải tra file này; nếu phản ứng chưa có trong file, phải tự ghi rõ giả định hoá học ngay trong code/data thay vì suy đoán ngầm.
- Thêm mục quy tắc UX mới (đặt cạnh "Chính Sách UI/UX" hiện có), gồm 4 rule:
  1. **Affordance bước đầu**: phần tử thao tác đầu tiên (nút chính/`primary-action`) phải nổi bật rõ ngay khi tải trang mà không cần đọc hết text xung quanh — ví dụ viền sáng, hiệu ứng nhấp nhẹ (pulse/glow), hoặc nhãn ngắn dạng "Bấm để bắt đầu".
  2. **Drag/slider dễ dùng**: giữ nguyên rule ưu tiên pointer-based drag, bổ sung yêu cầu cụ thể: vùng chạm tối thiểu khoảng 40-44px theo cả hai chiều, có chỉ báo thị giác rõ phần tử kéo được được (handle nổi khối, đổi `cursor` khi hover/active).
  3. **Đọc kết quả/đồ thị dễ dàng**: cỡ chữ tối thiểu cho readout chính đủ đọc nhanh trên màn hình nhỏ, nhãn trục/đơn vị trên đồ thị phải rõ, không nhồi quá nhiều số liệu cùng lúc trong vùng nhìn chính (nhắc lại và làm rõ thêm rule 2-4 chỉ số đã có).
  4. **Phản hồi ngay sau thao tác**: mọi hành động chính (bấm nút, kéo, thả, chọn) phải tạo ra thay đổi thị giác quan sát được trong khoảng thời gian ngắn (tham khảo ~300ms) — đổi màu, animation, hoặc cập nhật số liệu — để học sinh chắc chắn thao tác đã được ghi nhận.

## Thay đổi 3 — Cập nhật `references/implementation-checklist.md`

Thêm các mục checklist tương ứng để Claude tự rà trước khi coi một widget là hoàn chỉnh (bước 6 trong Quy Trình của `SKILL.md`):

- Đã tra `reaction-facts.md` cho mọi hiện tượng/màu sắc dùng trong widget; nếu phản ứng không có trong file, đã ghi rõ giả định trong code/data.
- Nút/khu vực thao tác đầu tiên có affordance rõ ràng khi tải trang.
- Mọi phần tử kéo/thả/slider có vùng chạm đủ lớn và chỉ báo kéo được rõ.
- Readout chính và đồ thị đủ lớn, nhãn rõ, không quá tải số liệu.
- Mọi thao tác chính có phản hồi thị giác ngay (không cần chờ lâu để biết đã bấm/kéo thành công).

## Đánh giá rủi ro đã ghi nhận (không xử lý trong lần này)

- Rule-only không có gì tự động chặn nếu bị bỏ qua khi context dài hoặc nhiều rule cộng dồn trong `SKILL.md`.
- 9 widget hiện có trong `outputs/` không được rà lại — có thể vẫn sai hiện tượng hoặc thiếu các điểm UX mới cho tới khi có người chủ động sửa.
- Nội dung `reaction-facts.md` do Claude soạn ban đầu cần người có chuyên môn hoá học review trước khi tin là nguồn chuẩn tuyệt đối.
- Phạm vi "đầy đủ hiện tượng" là mục tiêu mở, sẽ không đạt 100% ngay sau lần soạn đầu tiên.
