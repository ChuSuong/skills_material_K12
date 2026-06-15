# Danh sách phản ứng mẫu — Chương trình THPT Việt Nam

Format: `ID | Tên PƯ | Chất tham gia (CID) | Sản phẩm (CID) | Điều kiện | Chương trình`

---

## Phản ứng vô cơ cơ bản

| ID | Tên phản ứng | Phương trình | Reactant CIDs | Product CIDs | Điều kiện | Lớp |
|---|---|---|---|---|---|---|
| R01 | Tổng hợp nước | 2H₂ + O₂ → 2H₂O | H₂:783, O₂:977 | H₂O:962 | đốt cháy | Hoá 10 |
| R02 | Nhiệt phân CaCO₃ | CaCO₃ → CaO + CO₂ | CaCO₃:10112 | CO₂:280 | t° cao | Hoá 10 |
| R03 | Tổng hợp NH₃ (Haber) | N₂ + 3H₂ → 2NH₃ | N₂:947, H₂:783 | NH₃:222 | Fe xúc tác, t°, P | Hoá 11 |
| R04 | Oxi hoá SO₂ → SO₃ | 2SO₂ + O₂ → 2SO₃ | SO₂:1119, O₂:977 | SO₃:24682 | V₂O₅, t° | Hoá 10 |
| R05 | SO₃ + H₂O → H₂SO₄ | SO₃ + H₂O → H₂SO₄ | SO₃:24682, H₂O:962 | H₂SO₄:1118 | — | Hoá 10 |
| R06 | HCl + NaOH → muối | HCl + NaOH → NaCl + H₂O | HCl:313, NaOH:14798 | NaCl:5234, H₂O:962 | dung dịch | Hoá 10 |
| R07 | Fe + HCl | Fe + 2HCl → FeCl₂ + H₂ | HCl:313 | H₂:783 | — | Hoá 10 |
| R08 | Điện phân NaCl | 2NaCl + 2H₂O → 2NaOH + Cl₂ + H₂ | NaCl:5234, H₂O:962 | NaOH:14798 | điện phân | Hoá 12 |

## Phản ứng hữu cơ

| ID | Tên phản ứng | Phương trình | Reactant CIDs | Product CIDs | Điều kiện | Lớp |
|---|---|---|---|---|---|---|
| R09 | Đốt cháy metan | CH₄ + 2O₂ → CO₂ + 2H₂O | CH₄:297, O₂:977 | CO₂:280, H₂O:962 | đốt | Hoá 11 |
| R10 | Đốt cháy etanol | C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O | C₂H₅OH:702, O₂:977 | CO₂:280, H₂O:962 | đốt | Hoá 11 |
| R11 | Etilen → Etanol (cộng H₂O) | C₂H₄ + H₂O → C₂H₅OH | C₂H₄:6325, H₂O:962 | C₂H₅OH:702 | H⁺, t° | Hoá 11 |
| R12 | Etanol → Etilen (tách H₂O) | C₂H₅OH → C₂H₄ + H₂O | C₂H₅OH:702 | C₂H₄:6325, H₂O:962 | H₂SO₄, 170°C | Hoá 11 |
| R13 | Etanol + Axit axetic (este hoá) | C₂H₅OH + CH₃COOH ⇌ CH₃COOC₂H₅ + H₂O | C₂H₅OH:702, CH₃COOH:176 | C₂H₅OOC₂H₅:8857, H₂O:962 | H₂SO₄, t° | Hoá 12 |
| R14 | Thuỷ phân este | CH₃COOC₂H₅ + NaOH → CH₃COONa + C₂H₅OH | — | C₂H₅OH:702 | NaOH, t° | Hoá 12 |
| R15 | Axetilen → Benzen | 3C₂H₂ → C₆H₆ | C₂H₂:6326 | C₆H₆:241 | C, 600°C | Hoá 11 |
| R16 | Glucozơ lên men | C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂ | Glucose:5793 | C₂H₅OH:702, CO₂:280 | men, 30-35°C | Hoá 12 |
| R17 | Glucozơ + Cu(OH)₂ | — | Glucose:5793 | — | t° | Hoá 12 |
| R18 | Đốt cháy benzen | 2C₆H₆ + 15O₂ → 12CO₂ + 6H₂O | C₆H₆:241, O₂:977 | CO₂:280, H₂O:962 | đốt | Hoá 11 |
| R19 | CH₄ → C₂H₂ (cracking) | 2CH₄ → C₂H₂ + 3H₂ | CH₄:297 | C₂H₂:6326, H₂:783 | 1500°C | Hoá 11 |
| R20 | Thuỷ phân saccarozơ | C₁₂H₂₂O₁₁ + H₂O → C₆H₁₂O₆ + C₆H₁₂O₆ | Sucrose:5988, H₂O:962 | Glucose:5793, Fructose:2723872 | H⁺, t° | Hoá 12 |

---

## Cách dùng file này

```
1. Tìm phản ứng user yêu cầu theo ID hoặc tên
2. Lấy CID của reactants và products
3. Dùng template pathway.jsx để tạo stepper:
   Step 1 → hiển thị reactants (iframe MolView)
   Step 2 → điều kiện phản ứng
   Step 3 → hiển thị products (iframe MolView)
4. Viết mô tả ngắn từng bước phù hợp học sinh THPT
```

---

## Sơ đồ chuyển hoá mẫu (cho transformation-network.jsx)

Ví dụ SCHEME hoàn chỉnh — chuỗi chuyển hoá từ Etilen (kết hợp R11, R13, oxi hoá
ancol và phản ứng cháy). Copy object này vào `SCHEME` trong
`templates/transformation-network.jsx`, chỉnh `row`/`col` theo layout đề bài
nếu cần:

```js
const SCHEME = {
  title: "Sơ đồ chuyển hoá từ Etilen",
  subtitle: "Hoá 11-12 — Hiđrocacbon, Ancol, Axit cacboxylic, Este",
  nodes: [
    { id: "A", formula: "C₂H₄",       name: "Etilen",        cid: 6325, row: 1, col: 1,
      desc: "Hiđrocacbon không no, có 1 liên kết đôi C=C." },
    { id: "B", formula: "C₂H₅OH",     name: "Etanol",        cid: 702,  row: 1, col: 2,
      desc: "Ancol etylic — nhiên liệu, dung môi, nguyên liệu sản xuất giấm." },
    { id: "C", formula: "CH₃COOH",    name: "Axit axetic",   cid: 176,  row: 1, col: 3,
      desc: "Axit cacboxylic — thành phần chính của giấm ăn." },
    { id: "D", formula: "CH₃COOC₂H₅", name: "Etyl axetat",   cid: 8857, row: 2, col: 3,
      desc: "Este có mùi thơm — dung môi, hương liệu." },
    { id: "E", formula: "CO₂",        name: "Cacbon đioxit", cid: 280,  row: 2, col: 1,
      desc: "Sản phẩm của phản ứng đốt cháy hoàn toàn hợp chất hữu cơ." },
  ],
  edges: [
    { from: "A", to: "B", num: 1,
      equation: "C₂H₄ + H₂O → C₂H₅OH",
      condition: "H⁺ (xt), t°",
      note: "Phản ứng cộng nước (hiđrat hoá) vào liên kết đôi C=C." },
    { from: "B", to: "C", num: 2,
      equation: "C₂H₅OH + O₂ → CH₃COOH + H₂O",
      condition: "men giấm, 25–30°C",
      note: "Oxi hoá ancol bậc 1 thành axit cacboxylic." },
    { from: "C", to: "D", num: 3,
      equation: "CH₃COOH + C₂H₅OH ⇌ CH₃COOC₂H₅ + H₂O",
      condition: "H₂SO₄ đặc, t°",
      note: "Phản ứng este hoá — phản ứng thuận nghịch (⇌)." },
    { from: "A", to: "E", num: 4,
      equation: "C₂H₄ + 3O₂ → 2CO₂ + 2H₂O",
      condition: "đốt",
      note: "Phản ứng cháy hoàn toàn." },
  ],
};
```

Layout: A(1,1)→B(1,2)→C(1,3)→D(2,3) là chuỗi chính đi ngang rồi rẽ xuống;
A(1,1)→E(2,1) là nhánh phụ (đốt cháy) đi thẳng xuống — tạo hình chữ "L" gồm
2 nhánh từ A.

