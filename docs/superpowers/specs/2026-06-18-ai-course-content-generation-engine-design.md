# AI Course Content Generation Engine — Design

## Mục tiêu

Xây dựng một pipeline Python sinh nội dung học (explanation, interactions, quiz, AI Tutor block) cho course "How AI Works" (xem `course_AI/docs.md`), dựa trên Gemini API, theo style tương tác/trực quan của Brilliant.org. Output là file YAML structured theo schema cố định, sẵn sàng cho một frontend render sau này (frontend không thuộc scope của thiết kế này).

## Phạm vi

**Trong scope:**
- Đọc 1 file Concept Graph tĩnh (`concept_graph.yaml`) định nghĩa trước.
- Với mỗi concept, gọi Gemini API 1 lần (Approach A) để sinh: explanation, 1-2 interactions (AI tự chọn loại phù hợp trong 5 loại), quiz, AI Tutor block (misconceptions, socratic_questions, challenge).
- Dùng structured output (Gemini `response_schema` từ pydantic model) để đảm bảo đúng format.
- Validate + retry (tối đa 3 lần) khi output sai schema.
- Xử lý concept theo thứ tự topological (dựa trên prerequisites), dùng nội dung đã sinh của prerequisite làm context cho prompt tiếp theo.
- Ghi mỗi concept ra 1 file `generated/<concept_id>.yaml`.
- CLI: sinh tất cả, sinh 1 concept cụ thể, hoặc force ghi đè.
- Ngôn ngữ nội dung sinh ra: tiếng Anh.

**Ngoài scope (làm sau):**
- Frontend render các interaction.
- Sinh concept graph tự động từ 1 chủ đề mới (mục 9 docs.md, "Long-Term Vision").
- Sinh code UI component.
- Lưu vào database (MVP dùng file YAML trên disk).
- Pipeline nhiều bước/concept (Approach B) — có thể nâng cấp sau nếu chất lượng 1-call không đủ tốt.

## Kiến trúc & Data Flow

```
concept_graph.yaml (input, viết tay)
        ↓
generator.py đọc concept theo topological order
        ↓
với mỗi concept: prompt_builder.py build prompt
  (concept info + explanation/key_insight của prerequisite đã sinh làm context)
        ↓
ai_client.py gọi Gemini API với response_schema (từ pydantic model)
        ↓
schema.py validate output — retry tối đa 3 lần nếu lỗi, nhắc lỗi cụ thể vào prompt
        ↓
ghi generated/<concept_id>.yaml
```

Lý do tách 3 lớp (concept graph → AI client → output schema): dễ đổi AI backend (Gemini → khác) sau này, dễ nâng cấp lên pipeline nhiều bước, và dễ thêm script sinh concept graph tự động mà không phải viết lại phần sinh content.

## Input Schema — `concept_graph.yaml`

```yaml
concepts:
  - id: pattern_recognition
    title: Pattern Recognition
    chapter: "Machines That Learn"
    difficulty: 1
    prerequisites: []
  - id: classification
    title: Classification
    chapter: "Teaching a Machine"
    difficulty: 1
    prerequisites: [pattern_recognition]
  # ... toàn bộ 11 concept theo Dependency Graph (docs.md mục 3):
  # Data, Pattern Recognition, Classification, Training, Neural Network,
  # Deep Learning, Embedding, Attention, Transformer, LLM, Agent
```

Nếu graph có cycle hoặc tham chiếu prerequisite không tồn tại, engine fail ngay từ đầu với thông báo rõ concept nào lỗi — không chạy nửa chừng.

## Output Schema — `generated/<concept_id>.yaml`

```yaml
concept_id: pattern_recognition
explanation: "..."          # ngắn gọn, có analogy, giọng Brilliant
interactions:
  - id: pr_1
    type: prediction         # | drag_drop | simulation | decision | build_model
    title: "Predict the Pattern"
    instructions: "..."
    content: {...}           # schema riêng theo type, xem dưới
    key_insight: "..."
quiz:
  - question: "..."
    options: ["A...", "B...", "C...", "D..."]
    answer: "B"
    explanation: "..."
ai_tutor:
  misconceptions: ["...", "..."]
  socratic_questions: ["...", "..."]
  challenge: ["..."]
```

AI tự chọn 1-2 interaction type phù hợp nhất cho mỗi concept thay vì nhồi đủ 5 type vào mỗi concept.

### Content sub-schema theo từng interaction type

| Type | `content` fields |
|---|---|
| `prediction` | `sequence: [{input, output}]`, `question_input`, `answer`, `hint` |
| `drag_drop` | `items: [{id, label, correct_target}]`, `targets: [{id, label}]` |
| `simulation` | `parameter: {name, min, max, step, default, unit}`, `effect_description`, `key_observation` |
| `decision` | `scenario`, `choices: [{id, text, outcome, is_correct}]` |
| `build_model` | `steps: [{step_number, instruction, options:[...]}]`, `success_criteria` |

Các sub-schema này được định nghĩa là pydantic models với discriminated union theo field `type`, dùng trực tiếp để build Gemini `response_schema`.

## Cấu trúc thư mục

```
course_AI/
  concept_graph.yaml          # input, viết tay
  generated/                  # output, mỗi concept 1 file
    pattern_recognition.yaml
    classification.yaml
    ...
  src/
    generator.py               # CLI entrypoint
    ai_client.py                # wrap Gemini API call + response_schema
    schema.py                   # pydantic models cho output + 5 content type
    prompt_builder.py           # build prompt từ concept + context
  .env                         # GEMINI_API_KEY
```

## Luồng xử lý (generator.py)

1. Đọc `concept_graph.yaml`, tính topological order; fail sớm nếu cycle/prerequisite thiếu.
2. Với mỗi concept (bỏ qua nếu file output đã tồn tại và không có `--force`):
   - Đọc lại file YAML đã sinh của các prerequisite để lấy `explanation` + `key_insight` làm context.
   - Gọi `ai_client.generate(concept, context)` → Gemini trả JSON theo `response_schema`.
   - Validate bằng pydantic. Nếu lỗi → retry tối đa 3 lần, mỗi lần đưa lỗi cụ thể vào prompt để Gemini tự sửa.
   - Nếu vẫn lỗi sau 3 lần → log lỗi, skip concept, tiếp tục concept tiếp theo (không crash toàn batch).
3. Ghi `generated/<concept_id>.yaml`.

## CLI

```bash
python src/generator.py                      # sinh tất cả concept còn thiếu
python src/generator.py --concept attention   # chỉ sinh 1 concept
python src/generator.py --force               # sinh lại tất cả, ghi đè
```

## Error Handling

- Gemini API lỗi (rate limit, timeout): retry với backoff (3 lần), sau đó skip + log.
- `concept_graph.yaml` có cycle hoặc thiếu prerequisite: fail sớm, báo rõ concept lỗi.
- Thiếu `GEMINI_API_KEY` trong `.env`: fail ngay từ đầu, không gọi API.

## Testing

- Unit test cho `prompt_builder` (build đúng context từ prerequisite).
- Unit test cho `schema.py` (validate đúng/sai theo từng content type, dùng input giả, không gọi API thật).
- Test tích hợp gọi Gemini thật: để riêng, chạy manual/optional (tốn quota).

## Mở rộng trong tương lai (không nằm trong scope hiện tại)

- Đổi/song song nhiều AI backend: chỉ cần thay `ai_client.py`.
- Nâng cấp lên pipeline nhiều bước/concept (Approach B) nếu chất lượng 1-call không đủ.
- Thêm script sinh `concept_graph.yaml` tự động từ 1 chủ đề mới bằng AI (mục 9 docs.md).
- Build frontend render các interaction theo schema đã định nghĩa ở trên.
