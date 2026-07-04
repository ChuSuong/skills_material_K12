# Apparatus Standard

Standard chung để sinh chemistry 3D experiment mà không để LLM tự đoán các tọa độ vật lý quan trọng.

Xem thêm:

- [Chemistry 3D Edge-Case Checklist](./edge-case-checklist.md)
- [Apparatus content-fit matrix](./apparatus-fit-matrix.md)

## Mục tiêu

- Giảm lỗi ngớ ngẩn như miệng bình lệch dòng rót, nước tràn khỏi cốc, hiệu ứng xuất hiện ngoài dụng cụ.
- Tách rõ `layout freedom` khỏi `physics-bound geometry`.
- Buộc generator suy ra hình học từ apparatus contract thay vì hard-code `Vector3(...)` rời rạc.

## Shared library entrypoints

Active experiment recipes dùng `classic-kit` làm default surface:

- `lib/classic-kit/apparatus.js`

Entry này export đúng apparatus/chemical surface đang dùng cho active classic recipes:

- `createClassicTestTubeApparatus`
- `createClassicSolidReagentJarApparatus`
- `createClassicCopperPieceApparatus`
- `createClassicReagentBottleApparatus`
- `createZincGranulesApparatus`
- `clearWater`
- `diluteAcid`

Self-contained browser entry mặc định cho active classic recipes là:

- `templates/classic-apparatus-inline-snippet.js`

Compatibility surface cho legacy/debug scenes vẫn tồn tại, nhưng không phải default path cho active recipes:

- `lib/apparatus/index.js`
- `lib/apparatus/presets.js`
- `templates/apparatus-scaffold.js`
- `templates/apparatus-inline-snippet.js`

Generator active nên compose scene theo trình tự:

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

## Label policy

Nhãn phải do apparatus preset cung cấp qua `controllers.setLabel(...)`, không để scene tự tạo hệ thống nhãn riêng cho dụng cụ đã đăng ký.

Với bình, lọ, cốc, ống nghiệm, bình tam giác, và lọ hóa chất rắn:

- `labelAnchor` đặt ở mặt trước thân dụng cụ.
- `attachFixedPlaneLabel(..., { role: 'vessel-body-label' })` dùng cho nhãn dán thân.
- Nhãn không được nổi phía trên miệng bình nếu nội dung là tên chất/dung dịch.

Với dụng cụ nhỏ, nguồn nhiệt, và mẫu vật rời như giấy quỳ, ống nhỏ giọt, phễu, đèn cồn, hoặc đinh sắt:

- `labelAnchor` đặt tại vị trí badge dễ đọc nhưng không che vùng thao tác.
- `attachFixedPlaneLabel(..., { role: 'floating-badge' })` dùng cho nhãn nhận diện.
- Scene chỉ gọi `controllers.setLabel(...)`; nếu preset chưa hỗ trợ thì cập nhật preset trước.

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

Library apparatus hiện có hai mặt tiền khác nhau:

1. Active classic surface:
   - `lib/classic-kit/apparatus.js`
   - `templates/classic-apparatus-inline-snippet.js`
   - `scripts/build-classic-apparatus-inline-bundle.mjs`
   - đây là đường mặc định cho active experiment recipes và các HTML self-contained tương ứng
2. Shared core + compatibility metadata:
   - `lib/apparatus/core.js`
   - `lib/apparatus/chemicals.js`
   - `lib/apparatus/contract.js`
   - `lib/apparatus/capabilities.js`
   - `lib/apparatus/registry.js`
   - các helper contract/anchor/controller vẫn là nền chung cho cả classic và legacy surfaces
3. Legacy preset surface:
   - `lib/apparatus/presets.js`
   - `lib/apparatus/index.js`
   - `templates/apparatus-scaffold.js`
   - `templates/apparatus-inline-snippet.js`
   - `scripts/build-apparatus-inline-bundle.mjs`
   - chỉ dùng cho legacy scenes hoặc debug tooling chưa migrate sang classic path

## Cách dùng khuyến nghị

### 1. Active scene module bình thường

```js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js';
import {
  createClassicTestTubeApparatus,
  createClassicReagentBottleApparatus,
  createZincGranulesApparatus,
  diluteAcid,
} from '../lib/classic-kit/apparatus.js';
import {
  makeContract,
  ApparatusContractRegistry,
  validatePourAlignment,
  runApparatusValidators,
} from '../lib/apparatus/core.js';

const registry = new ApparatusContractRegistry();
registry.register(makeContract({
  kind: 'classic-test-tube',
  family: 'narrow-vessel',
  capabilities: ['pour-target', 'effect-origin'],
}));

const pourableTargets = registry.findByCapabilities(['pour-target']);
console.log(pourableTargets.length);
```

### 2. Active scene cần self-contained

1. Chạy:

```bash
rtk node scripts/build-classic-apparatus-inline-bundle.mjs
```

2. Paste nội dung `templates/classic-apparatus-inline-snippet.js` vào trong `<script type="module">` sau khi đã import `THREE`.

3. Chỉ dùng `templates/apparatus-inline-snippet.js` nếu bạn đang làm legacy/debug scene cần compatibility surface cũ.

### 3. Cảnh báo tham số khởi tạo (Initialization Parameters Warning)

- **Tuyệt đối sử dụng `parent: <group>` thay vì `group: <group>`** khi gọi các hàm khởi tạo preset (như `createTestTubeApparatus`, `createReagentBottleApparatus`, v.v.).
- Apparatus sẽ tự động tạo `group` của riêng nó bên trong và `add` vào `parent` mà bạn truyền vào. Nếu bạn truyền `group: <group>`, đối tượng apparatus sẽ không được đưa vào cảnh 3D và dẫn đến việc không hiển thị gì cả.

Ví dụ đúng:
```js
const tubeApparatus = createTestTubeApparatus({
  parent: tubeGroup, // ĐÚNG
  radius: 0.18
});
```

Ví dụ sai:
```js
const tubeApparatus = createTestTubeApparatus({
  group: tubeGroup, // SAI (apparatus sẽ không được render)
  radius: 0.18
});
```



## Free-drag-pour contract

Khi recipe có cả hai mode — autoplay và free drag-drop tự do — phải theo contract sau. Sai contract này là lý do phổ biến nhất khiến drag-drop build nhưng không hoạt động.

### Tại sao `beginStep` bị block trong drag

`createSequencedPourController.beginStep` gọi `dragController.canStartSequencedMotion(sourceId)`, hàm này kiểm tra `isAtHome(sourceId) === true`. Trong suốt quá trình drag, `isAtHome` luôn là `false` (đây là hành vi đúng — nguồn đang di chuyển). Kết quả: `beginStep` luôn trả `false` khi người dùng kéo thả, khiến pour không bao giờ bắt đầu.

### API chuẩn cho manual drag-drop

**Scene side — khi drop xảy ra:**

Dùng `pourSequence.beginStepFromActiveDrag(stepId)` thay vì `pourSequence.beginStep(stepId, 'manual')`.

```js
// Trong onDropTarget callback của validTargets:
onDropTarget() {
  beginPour(addToNafStep.id, 'manual');
},

// Trong beginPour:
function beginPour(stepId, mode = 'manual') {
  if (mode === 'autoplay') return pourSequence.beginStep(stepId, mode);
  return pourSequence.beginStepFromActiveDrag(stepId);  // bypasses isAtHome guard
}
```

`beginStepFromActiveDrag` bỏ qua đúng một check: `dragController.canStartSequencedMotion`. Tất cả check còn lại (đang có pending/active step, motion đang chạy) vẫn được giữ nguyên.

**KHÔNG làm:** mutate `pourSequence.state` trực tiếp từ ngoài closure.

```js
// SAI — fragile, phụ thuộc vào implementation detail:
const seqState = pourSequence.state;
seqState.pendingStepId = stepId;
seqState.pendingMode = 'manual';
```

### API chuẩn cho test harness

Dùng `dragController.simulateDrop(sourceId, targetId)` trong `dragFromPageApi`.

```js
dragFromPageApi() {
  return dragController.simulateDrop('agno3_bottle', 'tube_naf.pourTarget');
},
```

`simulateDrop`:
1. Set `isAtHome = false` trên entry (đúng như drag thật).
2. Tìm target bằng `targetId` trong `entry.validTargets`.
3. Gọi `entry.onDropTarget(payload)` và `target.onDropTarget(payload)` — cùng path như drag thật.
4. Gọi `commitSuccess` để trigger return-home.

**KHÔNG dùng** `dragFromPageApi` gọi trực tiếp `beginPour(stepId, 'manual')` — cách đó bypass `isAtHome = false` và không test code path thật của drag.

### Checklist khi implement free-drag-pour

- [ ] Mỗi `onDropTarget` trong `validTargets` gọi `beginPour(stepId, 'manual')`.
- [ ] `beginPour` với mode manual dùng `pourSequence.beginStepFromActiveDrag(stepId)`.
- [ ] `dragFromPageApi` dùng `dragController.simulateDrop(sourceId, targetId)`.
- [ ] `pourSequence` được tạo với `dragController` được truyền vào, `startArgs` đúng cho mỗi step.
- [ ] Playwright test (golden path) dùng `runVerifierStep` cho autoplay; `dragFromPageApi` cho manual test.
