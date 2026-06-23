# Apparatus Standard

Standard chung để sinh chemistry 3D experiment mà không để LLM tự đoán các tọa độ vật lý quan trọng.

Xem thêm:

- [Chemistry 3D Edge-Case Checklist](./edge-case-checklist.md)

## Mục tiêu

- Giảm lỗi ngớ ngẩn như miệng bình lệch dòng rót, nước tràn khỏi cốc, hiệu ứng xuất hiện ngoài dụng cụ.
- Tách rõ `layout freedom` khỏi `physics-bound geometry`.
- Buộc generator suy ra hình học từ apparatus contract thay vì hard-code `Vector3(...)` rời rạc.

## Shared library entrypoints

Public apparatus surface hiện đi qua barrel `lib/apparatus/index.js`, gồm các nhóm chính:

- `lib/apparatus/core.js`
- `lib/apparatus/presets.js`
- `lib/apparatus/interactions.js`
- `lib/apparatus/chemicals.js`
- `lib/apparatus/contract.js`
- `lib/apparatus/capabilities.js`
- `lib/apparatus/registry.js`

Browser entry mặc định vẫn là:

- `templates/apparatus-scaffold.js`

Entry này re-export cùng public surface với barrel để scene browser và test import cùng một API.

Generator mới nên compose scene theo trình tự:

1. Chọn apparatus preset
2. Chọn chemical appearance preset
3. Nối apparatus bằng interaction primitives
4. Chạy scene validator gate trước khi coi output là hợp lệ

## Nguyên tắc cốt lõi

1. LLM được phép quyết định bố cục cấp cảnh:
   - vị trí tương đối của các dụng cụ trên bàn
   - camera framing
   - ánh sáng, màu, nhịp chuyển động
2. LLM không được tự quyết định các điểm vật lý gắn với dụng cụ:
   - điểm rót
   - miệng bình/cốc
   - mực chất lỏng
   - tâm bọt, khói, hơi, kết tủa nếu chúng sinh ra từ một apparatus cụ thể
   - điểm neo label theo vật thể
3. Mọi animation hoặc effect gắn với dụng cụ phải suy ra từ `anchors`, `constraints`, và `controllers`.
4. Mọi scene thí nghiệm phải có geometry validation pass trước khi coi là hợp lệ.

## Hai loại tọa độ

### 1. Layout coordinates

Được phép hard-code hoặc để model sinh:

- `group.position.set(-4, 1.5, 0)` để đặt một bình ở bên trái
- `camera.position.set(...)`
- `benchTop.position.set(...)`

Đây là tọa độ bố cục, không đại diện cho quan hệ vật lý tinh vi.

### 2. Physics-bound coordinates

Không được hard-code rời rạc nếu apparatus có thể expose contract:

- `mouth`
- `nozzle`
- `pourTarget`
- `liquid top`
- `effectOrigin`
- `labelAnchor`
- `heatZone`

Ví dụ không được khuyến khích:

```js
const target = flask.localToWorld(new THREE.Vector3(0, 2.58, 0));
```

Ví dụ chuẩn:

```js
const target = getAnchorWorld(flaskApparatus.anchors.pourTarget);
```

## Apparatus Contract

Mỗi apparatus phải trả về object có tối thiểu các phần sau:

```js
{
  kind: 'erlenmeyer',
  family: 'narrow-neck-vessel',
  group,
  meshes,
  anchors,
  constraints,
  controllers,
  validators,
  state,
  meta,
}
```

Nếu cần formalize metadata để register hoặc query ngoài scene, dùng thêm contract utilities:

```js
const contract = makeContract({
  kind: apparatus.kind,
  family: apparatus.family,
  capabilities: ['pour-target', 'heatable'],
  version: 1,
});
```

`capabilities` là danh sách semantic để filter apparatus theo năng lực thay vì đoán theo `kind`.
Registry chuẩn hóa qua `ApparatusContractRegistry` hoặc `defaultApparatusContractRegistry`.

```js
const registry = new ApparatusContractRegistry();
registry.register(contract);
const heatedTargets = registry.findByCapabilities(['heatable']);
```

`normalizeContract()`, `makeContract()`, `normalizeCapabilities()`, và `hasCapabilities()` là public helpers của apparatus surface.

## Required fields

### `group`

Group gốc của apparatus.

### `meshes`

Map chứa các mesh quan trọng để animation/controller dùng lại.

Ví dụ:

```js
meshes: {
  body,
  neck,
  liquid,
  liquidSurface,
}
```

### `anchors`

Các điểm semantic neo theo dụng cụ.

Mỗi apparatus phải có:

- `labelAnchor`

Nếu apparatus liên quan đến rót chất lỏng, cần thêm:

- `mouth`
- `pourTarget`

Nếu apparatus là nguồn rót, cần thêm:

- `nozzle`

Nếu apparatus sinh hiệu ứng:

- `effectOrigin`
- `steamOrigin`
- `bubbleOrigin`
- `heatZone`

Anchor phải là `Object3D` thật được attach vào `group`, không chỉ là object dữ liệu thuần.

### `constraints`

Tối thiểu:

- `innerRadius`
- `innerHeight`
- `safeFillHeight`

Khi có thao tác rót:

- `safePourRadius`
- `safePourClearance`
- `tiltLimit`

Khi là vùng nhiệt:

- `heatClearance`

### `controllers`

Hàm thao tác chuẩn hóa trên apparatus.

Nên có:

- `setLiquidLevel(fillRatio)`
- `setLiquidOpacity(alpha)`
- `setPourPose(progress)`
- `setEffectIntensity(value)`

Controller phải clamp dữ liệu theo `constraints`, không để caller tự set mesh theo cảm tính.

### `validators`

Danh sách validator cục bộ cho apparatus. Mỗi validator trả về:

```js
{
  ok: boolean,
  code: 'pour-alignment',
  message: 'Bottle nozzle misses flask mouth',
  details: { ... }
}
```

## Apparatus families

### `open-vessel`

Ví dụ:

- beaker
- crystallizing dish

Đặc điểm:

- miệng rộng
- mặt chất lỏng thường phẳng
- vùng rót tương đối rộng

Rule:

- `safePourRadius` có thể rộng hơn
- `liquidSurface` phải luôn nằm trong `innerRadius`

### `narrow-neck-vessel`

Ví dụ:

- erlenmeyer flask
- volumetric flask

Đặc điểm:

- miệng hẹp
- cần kiểm tra nozzle alignment chặt hơn

Rule:

- phải có `mouth` và `pourTarget`
- validator pour alignment là bắt buộc

### `sealed-vessel`

Ví dụ:

- flask có nút
- gas collection vessel

Đặc điểm:

- effect đi ra từ outlet riêng

Rule:

- không dùng chung `mouth` cho mọi effect
- phải có `outlet` hoặc `vent`

### `heated-vessel`

Ví dụ:

- test tube trên đèn cồn
- beaker trên burner

Rule:

- phải có `heatZone`
- effect nhiệt/steam phải neo theo `heatZone` hoặc `steamOrigin`

### `transfer-tool`

Ví dụ:

- dropper
- pipette
- burette

Rule:

- `nozzle` hoặc `tip` là anchor chính
- quỹ đạo chất lỏng phải phát sinh từ đầu tip

### `solid-reagent-container`

Ví dụ:

- lọ hóa chất rắn
- jar chứa bột hoặc hạt

Rule:

- phải có `mouth`, `pourTarget`, `scoopTarget`, `gripAnchor`
- không dùng lại contract bình dung dịch nếu logic chính là lớp chất rắn
- `solidSurfaceY` và `setFillLevel()` phải là nguồn sự thật cho lớp chất rắn

### `indicator-tool`

Ví dụ:

- giấy quỳ tím
- test strip chỉ thị

Rule:

- phải có `gripAnchor`, `tipAnchor`, `sampleZone`
- vùng đổi màu phải neo theo `sampleZone`, không đoán world point tiếp xúc
- màu chỉ thị phải đổi qua controller như `setIndicatorColor()` hoặc `setWetness()`

## Scene-level rules

1. Layout tự do, physics thì derive.
2. Không đặt label bằng tọa độ world tĩnh nếu apparatus có `labelAnchor`.
3. Không set `liquid.position.y` trực tiếp bên ngoài controller.
4. Không set `stream target` bằng số nếu target gắn với dụng cụ.
5. Không spawn khói/bọt từ một world point “ước lượng”.
6. Nếu thiếu apparatus phù hợp, tạo apparatus mới trước khi viết animation.

## Validators bắt buộc

Mỗi scene thí nghiệm nên có ít nhất các check sau nếu phù hợp:

- `pour-alignment`
  - nozzle nằm trong `safePourRadius` quanh `mouth`
  - nozzle cao hơn `mouth` ít nhất `safePourClearance`
- `fill-level`
  - liquid top không vượt `safeFillHeight`
  - radius chất lỏng không vượt lòng vật chứa
- `effect-origin`
  - smoke/bubble/precipitate origin nằm trong vùng hợp lệ
- `label-visibility`
  - label anchor không ra ngoài framing mặc định
- `reaction-visibility`
  - camera mặc định nhìn thấy vùng phản ứng

## Cho phép ngoại lệ như thế nào

Có edge case thật, nên chuẩn này không cấm mọi phép custom.

Cho phép override nếu:

1. Apparatus family mới chưa đủ controller.
2. Hình dạng custom cần target phụ tạm thời.
3. Scene cần trick thị giác để người học nhìn rõ hơn.

Nhưng khi override phải:

- đặt tên semantic cho điểm mới
- attach nó thành anchor
- ghi chú vì sao không dùng anchor mặc định
- thêm validator nếu hành vi đó ảnh hưởng vật lý

## Prompt rules cho generator

Khi gọi LLM sinh một chemistry experiment mới, prompt phải yêu cầu rõ:

1. Build apparatus trước, animation sau.
2. Expose `anchors`, `constraints`, `controllers`, `validators`.
3. Chỉ dùng layout coordinates cho bố cục.
4. Không hard-code physics-bound targets nếu đã có anchor.
5. Chạy geometry validation pass và log warning khi vi phạm.

## Library layout cho repo này

Library apparatus chuẩn hiện được tách thành 4 tầng:

1. Core helpers:
   - [lib/apparatus/core.js](/home/ding/chem-courseware-skill-base/lib/apparatus/core.js)
   - chứa anchor helpers, liquid controllers, validator runners, và apparatus composer
2. Contract metadata:
   - [lib/apparatus/contract.js](/home/ding/chem-courseware-skill-base/lib/apparatus/contract.js)
   - [lib/apparatus/capabilities.js](/home/ding/chem-courseware-skill-base/lib/apparatus/capabilities.js)
   - [lib/apparatus/registry.js](/home/ding/chem-courseware-skill-base/lib/apparatus/registry.js)
   - chuẩn hóa contract metadata, capability matching, và registry query
3. Preset apparatus:
   - [lib/apparatus/presets.js](/home/ding/chem-courseware-skill-base/lib/apparatus/presets.js)
   - hiện export các preset factory dùng chung như `createBeakerApparatus`, `createBottleApparatus`, `createReagentBottleApparatus`, `createErlenmeyerApparatus`, `createTestTubeApparatus`, `createDropperApparatus`, `createAlcoholBurnerApparatus`, `createSolidReagentJarApparatus`, `createLitmusPaperApparatus`, và `createFunnelApparatus`
4. Integration layer:
   - [lib/apparatus/index.js](/home/ding/chem-courseware-skill-base/lib/apparatus/index.js) là public barrel cho Node/test/browser facade
   - [templates/apparatus-scaffold.js](/home/ding/chem-courseware-skill-base/templates/apparatus-scaffold.js) là browser module facade để import nhanh
   - [scripts/build-apparatus-inline-bundle.mjs](/home/ding/chem-courseware-skill-base/scripts/build-apparatus-inline-bundle.mjs) sinh ra [templates/apparatus-inline-snippet.js](/home/ding/chem-courseware-skill-base/templates/apparatus-inline-snippet.js) cho các HTML self-contained
   - inline bundle được giữ gần với public surface của apparatus để scene self-contained vẫn dùng được các helper/preset/registry chính, nhưng nếu cần canonical module surface đầy đủ thì ưu tiên import từ barrel hoặc scaffold tùy môi trường dùng thật sự của scene đó.

## Cách dùng khuyến nghị

### 1. Scene module bình thường

```js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import {
  createBeakerApparatus,
  createBottleApparatus,
  createErlenmeyerApparatus,
  makeContract,
  ApparatusContractRegistry,
  validatePourAlignment,
  runApparatusValidators,
} from '../templates/apparatus-scaffold.js';

const registry = new ApparatusContractRegistry();
registry.register(makeContract({
  kind: 'erlenmeyer',
  family: 'narrow-neck-vessel',
  capabilities: ['pour-target', 'effect-origin'],
}));

const pourableTargets = registry.findByCapabilities(['pour-target']);
console.log(pourableTargets.length);
```

### 2. Scene cần self-contained

1. Chạy:

```bash
rtk node scripts/build-apparatus-inline-bundle.mjs
```

2. Paste nội dung [templates/apparatus-inline-snippet.js](/home/ding/chem-courseware-skill-base/templates/apparatus-inline-snippet.js) vào trong `<script type="module">` sau khi đã import `THREE`.

### 3. Smoke reference

File tham chiếu import-library tối thiểu:

- [examples/apparatus-library-smoke.html](/home/ding/chem-courseware-skill-base/examples/apparatus-library-smoke.html)
