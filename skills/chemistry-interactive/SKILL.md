---
name: chemistry-interactive
description: >
  Tạo học liệu hoá học tương tác với mô hình phân tử 3D, quiz, so sánh cấu trúc và sơ đồ phản ứng.
  Dùng skill này bất cứ khi nào user muốn: xem cấu trúc phân tử 3D, vẽ/hiển thị phân tử,
  tạo quiz hoá học, so sánh 2 phân tử, mô phỏng phản ứng hoá học, tạo học liệu/bài giảng hoá học
  tương tác. Trigger khi thấy các từ: phân tử, cấu trúc 3D, molecule, viewer, hoá học tương tác,
  học liệu hoá học, vẽ phân tử, SMILES, công thức cấu tạo, cấu trúc hoá học.
---

# Chemistry Interactive Skill

## 📁 Cấu trúc thư mục

```
chemistry-interactive/
├── SKILL.md              ← tài liệu skill này
├── references/
│   ├── molecules.md      ← danh sách CID, M, công thức các phân tử THPT
│   └── reactions.md      ← sơ đồ chuyển hoá mẫu, dữ liệu phản ứng
├── templates/            ← file mẫu (KHÔNG sửa trực tiếp)
│   ├── viewer.html / viewer.jsx
│   ├── compare.jsx
│   ├── quiz.html / quiz.jsx
│   ├── ai-quiz-gen.html
│   ├── smart-viewer.html
│   ├── lesson-builder.html
│   ├── pathway.jsx
│   ├── transformation-network.html / .jsx
│   ├── equation-balancer.html / .jsx
│   ├── redox-tracker.html / .jsx
│   ├── virtual-lab.html / .jsx
│   └── classify-game.html / .jsx
└── outputs/              ← ⭐ MỌI file output đều lưu vào đây
    └── (các file HTML / JSX đã tạo cho user)
```

> **Quy tắc lưu output**: Tất cả file tạo ra cho user (.html, .jsx) đều phải lưu vào thư mục `outputs/`.
> Ví dụ: `outputs/viewer-cacbon-dioxit.html`, `outputs/quiz-axit.jsx`.
> Không lưu file output trực tiếp vào thư mục gốc của skill.

---

Tạo học liệu hoá học tương tác dưới dạng **file HTML download** — user mở bằng browser thật.

## ⚠️ QUY TẮC OUTPUT BẮT BUỘC

**KHÔNG dùng `show_widget` / artifact inline cho mô hình 3D.** Claude artifact sandbox chặn WebGL bằng CSP.

**LUÔN dùng quy trình (cho 3D/3Dmol):**
1. Tạo file HTML tại `outputs/{ten-file}.html` (trong thư mục skill)
2. Nhắn user đường dẫn file và: *"Mở file bằng Chrome/Firefox → xem 3D đầy đủ"*

**Ngoại lệ — template .jsx không dùng WebGL** (`transformation-network.jsx`, `pathway.jsx`,
`compare.jsx`, `viewer.jsx`, `quiz.jsx`, `equation-balancer.jsx`, `redox-tracker.jsx`,
`virtual-lab.jsx`, `classify-game.jsx`): chỉ dùng SVG/HTML thường + iframe MolView (nhẹ,
optional). Các file này render trực tiếp như **React artifact**:
1. Tạo file tại `outputs/{ten-file}.jsx` (trong thư mục skill)
2. Không cần dặn "mở Chrome" — render ngay trong chat

**Lưu ý**: `virtual-lab.html` là **ngoại lệ ngược** — file `.html` này (không phải `.jsx`)
dùng Three.js/WebGL nên PHẢI theo quy trình 3D ở trên (bash_tool → present_files → dặn
"mở Chrome"), khác với các file `.html` còn lại trong skill (đều chỉ SVG/CSS, không WebGL).

---

## Cơ chế render 3D (QUAN TRỌNG)

**Không dùng iframe MolView** (bên thứ 3, không ổn định).

**Dùng: 3Dmol.js + PubChem REST API (của NIH — tin cậy, miễn phí)**

```js
// 1. Load thư viện (CDN)
<script src="https://cdnjs.cloudflare.com/ajax/libs/3Dmol/2.0.3/3Dmol-min.js"></script>

// 2. Fetch SDF từ PubChem
fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${CID}/SDF?record_type=3d`)
  .then(r => r.text())
  .then(sdf => {
    const viewer = $3Dmol.createViewer(divElement, { backgroundColor:'white', antialias:true });
    viewer.addModel(sdf, 'sdf');
    viewer.setStyle({}, { sphere:{scale:0.35,colorscheme:'Jmol'}, stick:{radius:0.18,colorscheme:'Jmol'} });
    viewer.zoomTo();
    viewer.render();
  });
```

**4 style 3Dmol tương đương 4 mode MolView:**

| Mode | sphere | stick |
|---|---|---|
| Ball & Stick | `{scale:0.35,colorscheme:'Jmol'}` | `{radius:0.18,colorscheme:'Jmol'}` |
| Stick only   | `{}` | `{radius:0.15,colorscheme:'Jmol'}` |
| Space Fill   | `{scale:0.9,colorscheme:'Jmol'}` | `{}` |
| Wireframe    | `{}` | `{radius:0.05,colorscheme:'Jmol'}` |

**Tra CID:** xem `references/molecules.md`. Nếu không có → dùng PubChem name API:
```js
fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${name}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`)
```

---

## Loại output và template

| User muốn | Template | File output |
|---|---|---|
| Xem phân tử 3D (1 chất, file mở Chrome) | `viewer.html` | `viewer-{chat}.html` |
| Xem phân tử 3D (1 chất, preview trong chat) | `viewer.jsx` | `viewer-{chat}.jsx` |
| So sánh 2 phân tử/chất cạnh nhau | `compare.jsx` | `compare-{chu-de}.jsx` |
| Làm quiz / kiểm tra | `quiz.html` hoặc `.jsx` | `quiz-{chu-de}.html` / `.jsx` |
| AI tự sinh quiz theo chủ đề | `ai-quiz-gen.html` | `quiz-ai-{chu-de}.html` |
| Tìm bất kỳ + AI giải thích | `smart-viewer.html` | `smart-viewer.html` |
| Tạo trọn bộ học liệu 1 chương (lý thuyết + 3D + quiz) | `lesson-builder.html` | `lesson-{chu-de}.html` |
| 1 phản ứng, đi từng bước (chất đầu→điều kiện→sản phẩm) | `pathway.jsx` | `pathway-{chu-de}.jsx` |
| Sơ đồ chuyển hoá nhiều bước / có nhánh (A→B→C...) | `transformation-network.jsx` hoặc `.html` | `network-{chu-de}.jsx` / `.html` |
| Cân bằng PT / Tính theo PT (stoichiometry) | `equation-balancer.jsx` hoặc `.html` | `balancer-{chu-de}.jsx` / `.html` |
| Cân bằng electron (oxi hoá - khử) từng bước | `redox-tracker.jsx` hoặc `.html` | `redox-{chu-de}.jsx` / `.html` |
| Phòng thí nghiệm ảo (trộn 2 dung dịch, xem hiện tượng) | `virtual-lab.jsx` (2D, preview chat) hoặc `.html` (3D, mở Chrome) | `lab-{chu-de}.jsx` / `.html` |
| Game phân loại phản ứng (trắc nghiệm có điểm số) | `classify-game.jsx` hoặc `.html` | `classify-{chu-de}.jsx` / `.html` |

---

## Template VIEWER

Đọc `templates/viewer.html` (3Dmol.js thật, file mở Chrome — theo quy trình 3D ở đầu file)
hoặc `templates/viewer.jsx` (preview ngay trong chat, dùng iframe MolView thay 3Dmol.js).
Cả 2 thay placeholder giống nhau:
- `MOLECULE_NAME`, `MOLECULE_FORMULA`, `MOLECULE_CID`
- `MOLECULE_WEIGHT`, `MOLECULE_DESC`, `MOLECULE_INFO_HTML` (chỉ `.html` có trường này)

---

## Template COMPARE (so sánh 2 chất)

Đọc `templates/compare.jsx`. Render artifact trực tiếp (iframe MolView, không WebGL).
Thay:
- `MOL_A`, `MOL_B`: `{ name, formula, cid, weight, desc }`
- `COMPARE_POINTS`: mảng `[{ label, a, b }]` — các dòng so sánh (tính chất vật lý,
  ứng dụng, độ tan...). Mỗi chất có nút đổi mode hiển thị riêng (Balls/Stick/Fill).

---

## Template QUIZ

Đọc `templates/quiz.html` (file, có thể kèm 3D 3Dmol.js) hoặc `templates/quiz.jsx`
(preview chat, dùng iframe MolView nếu cần mô hình). Thay:
- `QUIZ_TITLE`, `QUIZ_SUBTITLE`
- Mảng `QUESTIONS`:

```js
{
  q: "Câu hỏi?",
  cid: 962,          // PubChem CID, null nếu không cần 3D
  molName: "H₂O",
  opts: ["A. ...", "B. ...", "C. ...", "D. ..."],
  ans: 1,            // index 0–3
  exp: "Giải thích...",
  diff: "easy"       // easy | medium | hard
}
```

---

## Template AI QUIZ GEN

Đọc `templates/ai-quiz-gen.html`. File đã hoàn chỉnh — chỉ cần `present_files` (theo
quy trình 3D vì có thể render 3Dmol.js). Tính năng: user nhập chủ đề/chương → gọi
Gemini API qua proxy server cục bộ (`fetch` tới `http://localhost:8787/api/gemini`)
sinh bộ câu hỏi JSON → tự render thành quiz tương tác → chấm điểm + review từng câu
cuối bài. **Cần chạy proxy trước** (`cd server && npm install && npm start`, đọc
`GEMINI_API_KEY` từ `.env` ở thư mục gốc).

---

## Template SMART VIEWER

Đọc `templates/smart-viewer.html`. File đã hoàn chỉnh — chỉ cần `present_files`.
Tính năng: nhập tên → PubChem lookup → render 3Dmol → hỏi AI (Gemini qua proxy
`server/`, cần chạy `npm start` trước, đọc `GEMINI_API_KEY` từ `.env`).

---

## Template LESSON BUILDER

Đọc `templates/lesson-builder.html`. File đã hoàn chỉnh — chỉ cần `present_files`
(theo quy trình 3D). Tính năng: user nhập tên chương/chủ đề → gọi Gemini API qua
proxy server cục bộ tạo outline + danh sách phân tử chính + 5 câu quiz trong 1 lần
gọi → PubChem lookup từng phân tử → render viewer 3D đồng loạt → ghép tất cả thành
1 bộ học liệu hoàn chỉnh (tóm tắt lý thuyết + các mô hình 3D + quiz). Phù hợp khi
user muốn "soạn cả bài/chương" thay vì 1 hoạt động đơn lẻ. **Cần chạy proxy trước**
(`cd server && npm install && npm start`).

---

## Template TRANSFORMATION NETWORK (sơ đồ chuyển hoá)

Đọc `templates/transformation-network.jsx`. Dùng cho dạng bài "Hoàn thành sơ đồ
chuyển hoá A → B → C → ..." (kể cả có nhánh). Thay object `SCHEME`:

- `title`, `subtitle` — tên sơ đồ + lớp/chương
- `nodes`: mảng chất, mỗi chất có `id, formula, name, cid?, desc?, row, col`
  - `row`/`col` (bắt đầu từ 1) xếp theo layout của sơ đồ trong đề: chuỗi chính
    đi ngang (cùng `row`, `col` tăng dần), nhánh phụ xuống `row` mới
  - `cid` (PubChem, optional) → bấm vào chất sẽ hiện mô hình 3D nhỏ (MolView iframe)
- `edges`: mảng phản ứng, mỗi phản ứng có `from, to, num, equation, condition, note?`
  - `num` đánh số (1)(2)(3)... khớp với cách đánh số trong đề bài
  - nếu phản ứng cần 2 chất tham gia, vẫn vẽ 1 edge giữa 2 node chính —
    `equation` ghi đầy đủ tất cả chất

Tính năng có sẵn: chuyển đổi xem **Sơ đồ ↔ Danh sách**, bấm vào chất/mũi tên
xem chi tiết, và chế độ **"Tự kiểm tra"** (ẩn điều kiện/phương trình để học sinh
tự viết trước khi bấm xem đáp án).

Lấy dữ liệu mẫu (CID, phương trình, điều kiện) từ `references/reactions.md`
— mục "Sơ đồ chuyển hoá mẫu" có sẵn 1 SCHEME hoàn chỉnh để copy/sửa.

Dùng template này khi sơ đồ có **≥2 phản ứng/nhiều chất**. Nếu chỉ 1 phản ứng
đơn lẻ cần đi từng bước chi tiết (chất đầu → điều kiện → sản phẩm), dùng
`pathway.jsx` thay vì template này.

**2 bản tương đương, cùng dữ liệu SCHEME, chọn 1 trong 2:**
- `transformation-network.jsx` → React artifact, xem ngay trong chat (`create_file` vào
  `/mnt/user-data/outputs`, `present_files`, không cần dặn mở browser)
- `transformation-network.html` → file độc lập (React+Babel qua CDN), user tải về
  mở Chrome/Firefox để dùng offline hoặc chia sẻ cho học sinh. Cách thay SCHEME giống
  hệt bản `.jsx`. Nhắc user: *"Tải file → mở Chrome/Firefox để xem"*

Mặc định: nếu user chỉ muốn xem nhanh trong chat → dùng `.jsx`. Nếu user xin
file/"html"/để chia sẻ/lưu lại → dùng `.html`.

---

## Template EQUATION BALANCER (cân bằng PT & tính theo PT)

Đọc `templates/equation-balancer.jsx` (hoặc `.html`). 2 tab trong 1 file:

1. **Cân bằng phương trình**: học sinh chỉnh hệ số (nút ±, 1-9) cho từng chất,
   bảng nguyên tố cập nhật real-time (Trái/Phải/✓-✗), banner báo đã cân bằng hay chưa.
2. **Tính theo phương trình**: PT đã cân bằng (hiển thị tĩnh) + 1 ô input "Cho biết"
   (khối lượng/mol/thể tích) → tự tính các chất còn lại + nút "Hiện lời giải" từng bước.

Thay object `DATA`:
- `balance.compounds`: `[{ formula, side: "reactant"|"product", correctCoef }]`
  — `formula` viết ASCII thường (`C2H5OH`, `Ca(OH)2`) — UI tự hiển thị subscript.
- `stoich.compounds`: `[{ formula, side, coef, unit }]` — `unit`: `"g"` (khối lượng),
  `"L"` (thể tích khí ở đktc, dùng 22.4), hoặc `"mol"`.
- `stoich.given`: `{ formula, value, unit }` — chất/đại lượng đã biết (phải khớp 1
  formula trong `stoich.compounds`).

Trình parser công thức hỗ trợ ngoặc đơn lồng nhau (`(NH4)2SO4`) và bảng nguyên tử khối
THPT có sẵn trong file — không cần tra cứu thêm. Có thể dùng 2 phản ứng khác nhau cho
2 tab (vd tab cân bằng dùng phản ứng cháy, tab tính toán dùng phản ứng kim loại + axit)
hoặc cùng 1 phản ứng cho cả 2 — tuỳ đề bài.

---

## Template REDOX TRACKER (cân bằng electron)

Đọc `templates/redox-tracker.jsx` (hoặc `.html`). Stepper 4 bước đi theo đúng
"phương pháp cân bằng electron" THPT: xác định số oxi hoá thay đổi → viết 2 quá
trình oxi hoá/khử → cân bằng electron (BCNN, có nút minh hoạ animation e⁻ "bay"
giữa 2 quá trình) → hoàn thành PTHH.

Thay object `DATA`:
- `unbalanced`, `balanced`: phương trình chưa/đã cân bằng (string hiển thị, subscript Unicode)
- `processes`: **đúng 2 phần tử**, 1 cái `type:"oxidation"`, 1 cái `type:"reduction"`
  - `element`, `before`, `after`: nguyên tố và số oxi hoá trước/sau (vd `"0"`, `"+3"`)
  - `half`: bán phản ứng electron, vd `"Al⁰ → Al⁺³ + 3e⁻"`
  - `role`: vai trò, vd `"Chất khử (bị oxi hoá)"`
  - `electronsPerUnit` × `multiplier` của **cả 2 quá trình phải bằng nhau** —
    đây chính là tổng số electron trao đổi (tính BCNN trước khi điền vào DATA)

Chỉ dùng cho phản ứng oxi hoá - khử **đơn giản, 1 nguyên tố thay đổi số oxi hoá
mỗi vế** (phù hợp Hoá 10). Phản ứng phức tạp hơn (nhiều nguyên tố thay đổi, môi
trường axit/bazơ cần thêm H⁺/OH⁻/H₂O) nên giải thích bằng text thay vì ép vào
template này.

---

## Template VIRTUAL LAB (phòng thí nghiệm ảo)

Có **2 bản tương đương**, dùng **chung object `LAB`** — sửa data 1 lần, áp dụng cho cả 2:

- **`virtual-lab.jsx`** — bản 2D, vẽ cốc bằng CSS (bo góc, vòi rót, ánh sáng kính, mặt
  chất lỏng cong). Render trực tiếp như **React artifact** (`create_file` →
  `/mnt/user-data/outputs`, `present_files`, không cần dặn "mở Chrome").
- **`virtual-lab.html`** — bản 3D thật (Three.js): 1 cốc thuỷ tinh 3D tông tối, kéo
  để xoay, chất lỏng dâng lên + đổi màu mượt, bong bóng khí/hạt kết tủa là mesh 3D.
  **Dùng WebGL → KHÔNG render được trong artifact sandbox** (bị CSP chặn). Phải đi
  theo quy trình 3D ở đầu file: `bash_tool` tạo file → `present_files` → dặn user
  *"Tải file → mở Chrome/Firefox để xem mô hình 3D"*.

Mặc định: nếu user chỉ muốn xem nhanh trong chat → dùng `.jsx`. Nếu user muốn "mô
hình 3D"/"giống ảnh phòng thí nghiệm 3D"/file để tải về dùng offline → dùng `.html`.
Có thể đưa cả 2 nếu user muốn so sánh.

Cả 2 hoạt động chung trên 1 luồng: chọn 2 dung dịch (lưới ô vuông, bấm vào "Ống 1"/
"Ống 2" để chọn ống đang gán, rồi bấm 1 ô hoá chất) → bấm "⚗️ Trộn" → cốc kết quả đổi
màu + hiệu ứng (sủi bọt khí / kết tủa lắng) → hiện PTHH + hiện tượng + giải thích.

Thay object `LAB`:
- `reagents`: `[{ id, name, formula, color }]` — `color` là màu hex hiển thị trong cốc
  (bản 3D dùng làm màu chất lỏng); dung dịch không màu dùng `"#eef2f7"`.
- `reactions`: `[{ pair:[id1,id2], equation, phenomenon, effect, resultColor, explanation }]`
  — chỉ cần khai báo các **cặp có phản ứng**; `effect` là `"precipitate"` (có hạt lắng
  xuống đáy), `"gas"` (có bong bóng khí bay lên), `"color-change"`, hoặc `"none"`
  (không hiện tượng rõ, vd phản ứng trung hoà).
- `noReactionMessage`: hiển thị tự động cho mọi cặp KHÔNG có trong `reactions`.

Nên chọn 3-5 reagents sao cho có ít nhất 1 cặp kết tủa, 1 cặp sủi khí, và 1-2 cặp
không phản ứng — giúp học sinh tự khám phá quy luật phản ứng trao đổi.


---

## Template CLASSIFY GAME (game phân loại phản ứng)

Đọc `templates/classify-game.jsx` (hoặc `.html`). Mỗi câu hiện 1 PTHH, học sinh
bấm chọn loại phản ứng đúng trong các nút category → phản hồi ✓/✗ ngay + giải thích
→ "Câu tiếp theo". Hết danh sách → hiện điểm số (X/N) + nhận xét + "Làm lại" (tự
xáo trộn lại thứ tự câu hỏi).

Thay object `GAME`:
- `categories`: `[{ id, name }]` — 3-5 loại phản ứng, hiển thị thành nút bấm.
- `items`: `[{ id, equation, categoryId, explanation }]` — `categoryId` là đáp án
  đúng (phải khớp 1 id trong `categories`); `explanation` hiện ra sau khi trả lời
  để giải thích vì sao PT thuộc loại đó. Nên có 8-12 items, rải đều các categories.

Gợi ý 2 cách phân loại phổ biến (chọn 1 phù hợp với bài đang dạy, không trộn 2 hệ
trong cùng 1 game vì 1 PT có thể thuộc nhiều loại của hệ khác nhau):
- **4 loại phản ứng vô cơ cơ bản (Hoá 8/9)**: Hoá hợp, Phân huỷ, Thế, Trao đổi —
  phân loại theo cấu trúc PT (số chất tham gia/tạo thành), ít mơ hồ.
- **Oxi hoá - khử vs không oxi hoá - khử (Hoá 10)**: chỉ 2 nhóm, dựa vào có/không
  có sự thay đổi số oxi hoá.

---

## Quy tắc chất lượng

- `div` viewer 3D: chiều cao tối thiểu 380px (viewer đơn), 220px (quiz)
- Luôn có loading spinner khi fetch SDF
- Luôn có fallback lỗi nếu fetch thất bại
- Tên file: kebab-case không dấu, vd: `quiz-h2o.html`, `viewer-etanol.html`, `network-ankan.jsx`
- Sau `present_files` cho file **.html** (3D/3Dmol) luôn nhắc: *"Tải file → mở Chrome/Firefox → xem 3D đầy đủ"*
- File **.jsx** render ngay trong chat — không cần nhắc tải/mở browser

## Lưu ý

- Ưu tiên chương trình THPT VN: Hoá 10, 11, 12
- Tên tiếng Việt trong UI, IUPAC ở ghi chú
