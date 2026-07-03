# Classic Kit Visual Standard

`classic-kit` là visual/runtime profile mỏng cho chemistry experiment scenes. Mục tiêu là bám ngôn ngữ hình của các HTML mẫu đẹp trong `generated_theme_and_style` và `generated/gemini gen without lib`, không mở rộng theo hướng apparatus platform nặng.

## Camera

- Dùng camera family theo layout, không dùng một preset chung cho mọi bài.
- `showcase-close`: một bình hoặc một cụm nhỏ.
- `rack-2tube-front`: so sánh hai ống nghiệm.
- `rack-3tube-front`: so sánh ba ống nghiệm.
- `flask-compare-front`: so sánh nhiều bình tam giác.
- `single-vessel-angle`: một bình chính, góc hơi nghiêng để đọc chất lỏng.

Quy tắc:
- Apparatus chính phải chiếm phần lớn viewport.
- Full vessel phải nằm trong khung.
- Không để vật thể tụt xuống dưới mặt bàn hoặc lọt thỏm trong stage.

## Asset grammar

- Glass assets dùng `classic-showcase` family: wall rõ, rim rõ, bottom đọc được; không dùng fake highlight dạng sọc trắng dán trên thân kính.
- Với learning scene kiểu Gemini, ưu tiên bỏ floating label trong không gian 3D; nhãn giải thích nên chuyển lên HUD/panel ngoài scene.
- Liquid là volume thật, không fake bằng overlay/sprite.
- Rack và bench phải đơn giản, tỷ lệ lớn, silhouette rõ.
- Vật liệu kim loại mẫu giữ hình đơn giản, dễ đọc, không decorative.

## Reaction containment

- Mọi hiện tượng phản ứng phải gắn với `createVesselReactionZone`.
- Bubble/gas/cloud không được thoát khỏi bình, lọ, ống nghiệm.
- Mọi mẫu rắn sau khi thả phải được đặt vào pose nằm trong vessel.
- Với mẫu mảnh như lá kim loại, kiểm tra containment theo các anchor dọc mẫu thay vì chỉ dùng bounding box thô.

## Migration rule

- Scene mới ưu tiên `classic-kit`.
- Lib cũ vẫn tồn tại như `legacy` cho scene cũ.
- Scene migrated phải import apparatus từ `lib/classic-kit/apparatus.js`, không import trực tiếp từ `lib/apparatus/index.js`.
- HTML self-contained của active recipes phải inline `templates/classic-apparatus-inline-snippet.js`; `templates/apparatus-inline-snippet.js` chỉ là compatibility bundle cho legacy/debug tooling.
- Khi thêm recipe experiment mới, ưu tiên compose từ:
  - `createClassicTestTubeApparatus`
  - `createClassicSolidReagentJarApparatus`
  - `createClassicReagentBottleApparatus`
  - `createClassicCopperPieceApparatus`
  - `createZincGranulesApparatus`

## Current reference slice

- `zinc-copper-hcl-compare` là vertical slice chuẩn đầu tiên cho `classic-kit`.
- Active migrated recipes hiện tại:
  - `zinc-copper-hcl-compare`
  - `hcl-nahco3-gas-release`
  - `halogen-halide-displacement-compare`
- Gate chính:
  - `showcase-visual-standard.test.mjs`
  - `recipe-scene-builder.test.mjs`
  - `verify:pw:interaction` với invariant:
    - `zincSampleContainedInTube`
    - `copperContainedInTube`
    - `bubbleFieldContainedInTube`
    - `zincJarReturnedHome`
