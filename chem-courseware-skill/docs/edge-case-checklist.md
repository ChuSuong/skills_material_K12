# Chemistry 3D Edge-Case Checklist

Checklist này dùng để review scene chemistry 3D trước khi coi là hợp lệ.

Mục tiêu:

- chặn các lỗi ngớ ngẩn do LLM đoán tọa độ
- ép scene đi qua apparatus contract thay vì custom geometry tùy hứng
- biến các vấn đề thường gặp thành checklist rõ ràng cho generator, reviewer, và validator

Xem thêm:

- [Apparatus Standard](./apparatus-standard.md)

## Cách dùng

Áp dụng checklist này ở 3 thời điểm:

1. Trước khi generate scene mới
2. Sau khi scene render xong lần đầu
3. Trước khi chốt scene vào repo hoặc dùng làm mẫu cho generator

Nếu một mục thuộc nhóm `Blocker` bị fail, scene không nên được coi là hợp lệ.

## Mức độ ưu tiên

- `Blocker`: fail là phải sửa trước
- `Warning`: nên sửa trước khi dùng làm mẫu
- `Nice-to-have`: tăng độ tin cậy hoặc tính thẩm mỹ

## 1. Scene Contract

### Blocker

- Scene chỉ dùng `layout coordinates` cho bố cục bàn, camera, ánh sáng, vị trí nhóm dụng cụ.
- Mọi điểm vật lý quan trọng như `mouth`, `nozzle`, `pourTarget`, `effectOrigin`, `labelAnchor`, `heatZone` đều đi qua apparatus contract.
- Không có `localToWorld(new THREE.Vector3(...))` hoặc `new THREE.Vector3(...)` hard-code cho logic rót, mực chất lỏng, hoặc effect nếu apparatus đã có anchor tương ứng.
- Apparatus tham gia tương tác đều có đủ `group`, `meshes`, `anchors`, `constraints`, `controllers`, `validators`.

### Warning

- Scene không trộn hai pattern trái nhau, ví dụ vừa dùng shared apparatus library vừa inline helper bespoke cho cùng một loại logic.
- Tên apparatus và anchors dùng semantic naming nhất quán như `mouth`, `nozzle`, `pourTarget`, `steamOrigin`.

## 2. Apparatus Placement

### Blocker

- Dụng cụ không xuyên vào bàn, xuyên nhau, hoặc bị chìm một phần vô lý.
- Bottle, beaker, flask, test tube đều đứng hoặc nghiêng đúng pose dự kiến trước khi animation bắt đầu.
- Các vùng tương tác chính còn nằm trong camera frame mặc định.

### Warning

- Khoảng cách giữa các dụng cụ đủ để người học nhìn được dòng rót hoặc vùng phản ứng.
- Label không đè lên miệng cốc, mực nước, hoặc vùng phản ứng.

## 3. Pouring And Transfer

### Blocker

- `nozzle` nằm trong vùng cho phép phía trên `mouth` hoặc `pourTarget` của vật nhận.
- Dòng rót bắt đầu từ `nozzle`, không từ một điểm world-space tùy ý.
- Dòng rót kết thúc trong vùng miệng hoặc vùng nhận dự kiến của vật chứa.
- Pose rót không làm thân chai xuyên vào bình nhận.
- `setPourPose()` hoặc logic pose tương đương có clamp theo `tiltLimit`.

### Warning

- Dòng rót không nhìn như tia laser cứng nếu mục tiêu là chất lỏng chảy thông thường.
- Khi có phễu, burette, dropper, hoặc pipette, dòng rót dùng apparatus trung gian đúng cách thay vì nối thẳng nguồn tới vật nhận.

### Nice-to-have

- Tốc độ dòng rót và tốc độ giảm mực chất lỏng nhìn hợp lý với nhau.
- Có preset interaction riêng cho `pour`, `drip`, `stream`, thay vì scene tự vẽ từng kiểu.

## 4. Liquid Containment

### Blocker

- Mực chất lỏng không vượt `safeFillHeight`.
- Bề mặt chất lỏng luôn nằm trong `innerRadius` hoặc `innerVolumeProfile`.
- Khi bình nghiêng, chất lỏng không xuyên thành, không lộ ra ngoài ở nơi không hợp lý.
- Liquid mesh không bị scale/translate tự do bỏ qua controller nếu apparatus đã có `setLiquidLevel()`.

### Warning

- Màu, độ trong, và độ đậm của dung dịch dùng preset chuẩn thay vì tự bịa random material từng scene.
- Các chất lỏng khác nhau trong cùng scene có khác biệt trực quan nhất quán.

## 5. Effects: Steam, Bubbles, Precipitate, Glow, Smoke

### Blocker

- `steamOrigin`, `bubbleOrigin`, `effectOrigin`, `heatZone` đều bám apparatus anchor hợp lệ.
- Hơi, bọt, kết tủa, splash không mọc ra ngoài bình nếu không có lý do thí nghiệm rõ ràng.
- Hiệu ứng không xuyên thành bình hoặc xuyên mặt bàn ở trạng thái mặc định.
- Nếu apparatus là `sealed-vessel`, effect đi ra từ `vent` hoặc `outlet`, không tự đi ra từ `mouth` chung.

### Warning

- Vùng phát sinh hiệu ứng không bị đặt bằng offset tay kiểu “dịch đại vài cm cho đẹp” nếu đã có anchor phù hợp.
- Cường độ effect đi qua controller như `setEffectIntensity()` thay vì sửa trực tiếp từng particle system.

### Nice-to-have

- Có preset effect chuẩn cho `denseSteam`, `gentleSteam`, `acidFume`, `precipitateCloud`, `burnerFlame`.

## 6. Heated Experiments

### Blocker

- Apparatus được đun có `heatZone` rõ ràng.
- Burner hoặc nguồn nhiệt không xuyên vào đáy bình, giá đỡ, hoặc mặt bàn.
- Flame, glow, hoặc steam bám vào apparatus/interaction đúng family, không tự đặt world-space gần gần.

### Warning

- Nếu có tripod, wire gauze, clamp stand, test tube holder, chúng tham gia bố cục đúng vai trò vật lý.
- Steam chỉ mạnh lên khi heating state tăng, không xuất hiện từ đầu vô cớ.

## 7. Narrow-Neck And Irregular Shapes

### Blocker

- Với `erlenmeyer`, `volumetric flask`, `test tube`, `burette`, `dropper`, chỉ `mouth` thôi là chưa đủ nếu scene cần rót chính xác; phải có thêm anchor/constraint phù hợp như `pourTarget`, `clearanceZone`, `innerVolumeProfile`.
- Validator alignment cho cổ hẹp được bật mặc định.

### Warning

- Apparatus hình bất quy tắc không dùng lại logic fill/stream của beaker một cách máy móc.
- Với funnel hoặc transfer chain nhiều bước, mỗi apparatus trung gian đều có validator riêng.

## 8. Camera And Visibility

### Blocker

- Người xem thấy rõ nơi chất lỏng đi vào vật nhận.
- Vùng phản ứng chính không bị che hoàn toàn bởi thành bình, nhãn, hoặc apparatus khác ở góc camera mặc định.
- Scene không phụ thuộc vào một góc camera quá hẹp để “giấu” lỗi hình học.

### Warning

- Với bình trong suốt, camera không làm phản xạ hoặc chồng lớp khiến người học hiểu sai dòng rót.
- Label và text annotation có anchor ổn định, không rung hoặc trôi khỏi apparatus.

## 9. Multi-Step Interactions

### Blocker

- Thứ tự state hợp lý: đặt pose rồi mới rót, rót rồi mới tăng effect, reset trả lại toàn bộ liquid/effect/pose.
- Reset scene đưa tất cả apparatus, effect, liquid level về trạng thái sạch.
- Tương tác nhiều dụng cụ như `pour -> heat -> steam` không bỏ sót apparatus state ở giữa.

### Warning

- Scene không copy-paste logic effect giữa các phase mà không có abstraction chung.
- Nếu interaction đủ phổ biến, nên được kéo vào library thay vì lặp lại ở nhiều file.

## 10. Packaging And Reuse

### Blocker

- Scene module-based import từ shared library phải resolve ổn định trong browser target hiện tại.
- Scene self-contained phải mở trực tiếp bằng browser qua `file://` mà không bị blank do import/path pattern không tương thích.
- Scene self-contained không phụ thuộc vào import mà môi trường mở HTML trực tiếp không hỗ trợ.

### Warning

- Không để cùng một apparatus logic tồn tại song song dưới nhiều bản gần giống nhau. Shared logic thuộc về `lib/`; `templates/` chỉ chứa generated inline bundles.
- Khi cần self-contained HTML, nên build từ shared source hoặc inline bundle sinh tự động, không copy tay helper cũ.

## 11. Validator Gate

### Blocker

- Scene phải chạy qua validator gate trước khi coi là hợp lệ.
- Với shared library hiện tại, mặc định dùng `createSceneValidatorGate(...).validate()`.
- Ít nhất phải có:
  - `pour-alignment`
  - `fill-level`
  - `effect-containment`
  - `visibility`
- Validator fail ở mức `Blocker` phải trả trạng thái fail, không chỉ `console.warn`.

### Warning

- Validator output nên có `code`, `message`, `details`, `severity`, `apparatusId` nếu có.
- Có thể snapshot validator metrics để so regression giữa các scene.

## 12. Catalog Coverage

### Blocker

- Nếu scene dùng một dụng cụ lặp đi lặp lại giữa nhiều bài, ưu tiên thêm nó vào apparatus catalog thay vì viết bespoke lần nữa.

### Warning

- Các family nên sớm có preset chuẩn tối thiểu:
  - `beaker`
  - `erlenmeyer`
  - `test-tube`
  - `reagent-bottle`
  - `dropper`
  - `alcohol-burner`
  - `funnel`

### Nice-to-have

- Có chemical appearance presets chuẩn như:
  - `clearWater`
  - `diluteAcid`
  - `blueSolution`
  - `yellowPrecipitate`
  - `denseSteam`
  - `burnerFlame`

## 13. Escape Hatch Rules

Custom geometry vẫn có thể cần, nhưng chỉ nên dùng khi thật sự không có preset phù hợp.

### Blocker

- Nếu tạo apparatus bespoke, vẫn phải expose đủ contract chuẩn.
- Apparatus bespoke phải có validator tương ứng với family của nó.
- Không được bỏ qua validator chỉ vì “scene này đặc biệt”.

### Warning

- Nếu cùng một custom apparatus xuất hiện lần thứ hai, nên nâng nó thành preset trong catalog.

## Preflight Quick Pass

Trước khi merge hoặc dùng làm mẫu cho LLM, đi nhanh qua 10 câu này:

1. Scene có đang hard-code world coordinate cho `mouth`, `nozzle`, `pourTarget`, `effectOrigin` không?
2. Mọi liquid level có đi qua controller không?
3. Dòng rót có thật sự bắt đầu từ apparatus source không?
4. Có dụng cụ nào xuyên nhau hoặc xuyên mặt bàn không?
5. Có effect nào mọc ngoài bình/cốc không?
6. Có family cổ hẹp nào đang dùng logic của beaker một cách máy móc không?
7. Camera mặc định có nhìn rõ vùng phản ứng không?
8. Reset có đưa mọi apparatus/effect/liquid về trạng thái sạch không?
9. Scene có đang duplicate helper bespoke thay vì dùng shared library không?
10. Validator gate có fail thật khi vi phạm `Blocker` không?

Nếu còn trả lời `có` cho câu 1, 5, 9 hoặc `không` cho câu 2, 3, 10 thì scene chưa nên được coi là chuẩn.
