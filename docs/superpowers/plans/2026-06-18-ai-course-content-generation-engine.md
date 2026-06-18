# AI Course Content Generation Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Python CLI pipeline that reads a static concept graph and uses the Gemini API to generate structured course content (explanation, interactions, quiz, AI Tutor block) for each concept, written as validated YAML files.

**Architecture:** `concept_graph.py` loads and topologically sorts concepts from `concept_graph.yaml`. `prompt_builder.py` turns a concept (plus already-generated prerequisite context) into a prompt. `ai_client.py` wraps the Gemini API call using structured output. `schema.py` defines pydantic models for the output and validates/retries. `generator.py` orchestrates everything and exposes a CLI.

**Tech Stack:** Python 3.11+, pydantic v2, PyYAML, google-generativeai, pytest.

**Spec:** `docs/superpowers/specs/2026-06-18-ai-course-content-generation-engine-design.md`

---

## Task 1: Project Scaffolding

**Files:**
- Create: `course_AI/requirements.txt`
- Create: `course_AI/.env.example`
- Create: `course_AI/.gitignore`
- Create: `course_AI/pytest.ini`
- Create: `course_AI/src/__init__.py`
- Create: `course_AI/tests/__init__.py`

- [ ] **Step 1: Create `course_AI/requirements.txt`**

```
pydantic>=2.6
PyYAML>=6.0
google-generativeai>=0.7
python-dotenv>=1.0
pytest>=8.0
```

- [ ] **Step 2: Create `course_AI/.env.example`**

```
GEMINI_API_KEY=your_api_key_here
```

- [ ] **Step 3: Create `course_AI/.gitignore`**

```
.env
__pycache__/
*.pyc
.pytest_cache/
```

- [ ] **Step 4: Create `course_AI/pytest.ini`**

```ini
[pytest]
pythonpath = .
```

- [ ] **Step 5: Create empty package files**

`course_AI/src/__init__.py`:
```python
```

`course_AI/tests/__init__.py`:
```python
```

- [ ] **Step 6: Install dependencies**

Run: `cd course_AI && pip install -r requirements.txt`
Expected: all packages install without error.

- [ ] **Step 7: Commit**

```bash
git add course_AI/requirements.txt course_AI/.env.example course_AI/.gitignore course_AI/pytest.ini course_AI/src/__init__.py course_AI/tests/__init__.py
git commit -m "chore: scaffold course_AI content generation project"
```

---

## Task 2: Output Schema (pydantic models)

**Files:**
- Create: `course_AI/src/schema.py`
- Test: `course_AI/tests/test_schema.py`

- [ ] **Step 1: Write the failing tests**

`course_AI/tests/test_schema.py`:
```python
import pytest
from pydantic import ValidationError

from src.schema import ConceptContent, Interaction, PredictionContent

VALID_PREDICTION_INTERACTION = {
    "id": "pr_1",
    "type": "prediction",
    "title": "Predict the Pattern",
    "instructions": "Guess the next value.",
    "content": {
        "sequence": [{"input": "2", "output": "4"}],
        "question_input": "7",
        "answer": "14",
    },
    "key_insight": "Patterns let us predict new values.",
}


def test_prediction_content_valid():
    content = PredictionContent(
        sequence=[{"input": "2", "output": "4"}],
        question_input="7",
        answer="14",
    )
    assert content.answer == "14"


def test_interaction_parses_prediction_content():
    interaction = Interaction.model_validate(VALID_PREDICTION_INTERACTION)
    assert isinstance(interaction.content, PredictionContent)


def test_interaction_invalid_content_raises():
    bad = dict(VALID_PREDICTION_INTERACTION)
    bad["content"] = {"sequence": [{"input": "2"}]}
    with pytest.raises(ValidationError):
        Interaction.model_validate(bad)


def test_concept_content_full_valid():
    data = {
        "concept_id": "pattern_recognition",
        "explanation": "AI finds patterns in data.",
        "interactions": [VALID_PREDICTION_INTERACTION],
        "quiz": [
            {
                "question": "What is AI doing?",
                "options": ["A", "B", "C", "D"],
                "answer": "B",
                "explanation": "Because it learns rules from data.",
            }
        ],
        "ai_tutor": {
            "misconceptions": ["AI thinks like a human"],
            "socratic_questions": ["What pattern do you see?"],
            "challenge": ["Find your own pattern in a dataset"],
        },
    }
    content = ConceptContent.model_validate(data)
    assert content.concept_id == "pattern_recognition"
    assert content.interactions[0].title == "Predict the Pattern"


def test_concept_content_missing_field_raises():
    with pytest.raises(ValidationError):
        ConceptContent.model_validate({"concept_id": "x"})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd course_AI && pytest tests/test_schema.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'src.schema'`

- [ ] **Step 3: Write `course_AI/src/schema.py`**

```python
from enum import Enum
from typing import List, Optional, Union

from pydantic import BaseModel, model_validator


class InteractionType(str, Enum):
    PREDICTION = "prediction"
    DRAG_DROP = "drag_drop"
    SIMULATION = "simulation"
    DECISION = "decision"
    BUILD_MODEL = "build_model"


class SequencePair(BaseModel):
    input: str
    output: str


class PredictionContent(BaseModel):
    sequence: List[SequencePair]
    question_input: str
    answer: str
    hint: Optional[str] = None


class DragDropItem(BaseModel):
    id: str
    label: str
    correct_target: str


class DragDropTarget(BaseModel):
    id: str
    label: str


class DragDropContent(BaseModel):
    items: List[DragDropItem]
    targets: List[DragDropTarget]


class SimulationParameter(BaseModel):
    name: str
    min: float
    max: float
    step: float
    default: float
    unit: Optional[str] = None


class SimulationContent(BaseModel):
    parameter: SimulationParameter
    effect_description: str
    key_observation: str


class DecisionChoice(BaseModel):
    id: str
    text: str
    outcome: str
    is_correct: bool


class DecisionContent(BaseModel):
    scenario: str
    choices: List[DecisionChoice]


class BuildModelStep(BaseModel):
    step_number: int
    instruction: str
    options: List[str]


class BuildModelContent(BaseModel):
    steps: List[BuildModelStep]
    success_criteria: str


CONTENT_MODEL_BY_TYPE = {
    InteractionType.PREDICTION: PredictionContent,
    InteractionType.DRAG_DROP: DragDropContent,
    InteractionType.SIMULATION: SimulationContent,
    InteractionType.DECISION: DecisionContent,
    InteractionType.BUILD_MODEL: BuildModelContent,
}


class Interaction(BaseModel):
    id: str
    type: InteractionType
    title: str
    instructions: str
    content: Union[
        PredictionContent,
        DragDropContent,
        SimulationContent,
        DecisionContent,
        BuildModelContent,
    ]
    key_insight: str

    @model_validator(mode="before")
    @classmethod
    def parse_content_by_type(cls, data):
        if isinstance(data, dict) and isinstance(data.get("content"), dict):
            interaction_type = InteractionType(data["type"])
            model = CONTENT_MODEL_BY_TYPE[interaction_type]
            data = dict(data)
            data["content"] = model(**data["content"])
        return data


class QuizItem(BaseModel):
    question: str
    options: List[str]
    answer: str
    explanation: str


class AiTutor(BaseModel):
    misconceptions: List[str]
    socratic_questions: List[str]
    challenge: List[str]


class ConceptContent(BaseModel):
    concept_id: str
    explanation: str
    interactions: List[Interaction]
    quiz: List[QuizItem]
    ai_tutor: AiTutor
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd course_AI && pytest tests/test_schema.py -v`
Expected: PASS (5 passed)

- [ ] **Step 5: Commit**

```bash
git add course_AI/src/schema.py course_AI/tests/test_schema.py
git commit -m "feat: add pydantic schema for generated concept content"
```

---

## Task 3: Concept Graph Loader

**Files:**
- Create: `course_AI/src/concept_graph.py`
- Test: `course_AI/tests/test_concept_graph.py`

- [ ] **Step 1: Write the failing tests**

`course_AI/tests/test_concept_graph.py`:
```python
import textwrap

import pytest

from src.concept_graph import load_concept_graph


def write_graph(tmp_path, text):
    path = tmp_path / "concept_graph.yaml"
    path.write_text(textwrap.dedent(text))
    return path


def test_loads_in_topological_order(tmp_path):
    path = write_graph(
        tmp_path,
        """
        concepts:
          - id: b
            title: B
            chapter: "Ch"
            difficulty: 1
            prerequisites: [a]
          - id: a
            title: A
            chapter: "Ch"
            difficulty: 1
            prerequisites: []
        """,
    )

    concepts = load_concept_graph(path)

    assert [c.id for c in concepts] == ["a", "b"]


def test_raises_on_missing_prerequisite(tmp_path):
    path = write_graph(
        tmp_path,
        """
        concepts:
          - id: a
            title: A
            chapter: "Ch"
            difficulty: 1
            prerequisites: [missing]
        """,
    )

    with pytest.raises(ValueError, match="missing"):
        load_concept_graph(path)


def test_raises_on_cycle(tmp_path):
    path = write_graph(
        tmp_path,
        """
        concepts:
          - id: a
            title: A
            chapter: "Ch"
            difficulty: 1
            prerequisites: [b]
          - id: b
            title: B
            chapter: "Ch"
            difficulty: 1
            prerequisites: [a]
        """,
    )

    with pytest.raises(ValueError, match="Cycle"):
        load_concept_graph(path)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd course_AI && pytest tests/test_concept_graph.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'src.concept_graph'`

- [ ] **Step 3: Write `course_AI/src/concept_graph.py`**

```python
from pathlib import Path
from typing import List

import yaml
from pydantic import BaseModel


class Concept(BaseModel):
    id: str
    title: str
    chapter: str
    difficulty: int
    prerequisites: List[str] = []


def load_concept_graph(path: Path) -> List[Concept]:
    data = yaml.safe_load(Path(path).read_text())
    raw_concepts = data["concepts"]
    concepts = {c["id"]: Concept.model_validate(c) for c in raw_concepts}

    for concept in concepts.values():
        for prereq_id in concept.prerequisites:
            if prereq_id not in concepts:
                raise ValueError(
                    f"Concept '{concept.id}' references unknown prerequisite "
                    f"'{prereq_id}'"
                )

    ordered: List[Concept] = []
    visited = set()
    visiting = set()

    def visit(concept_id: str) -> None:
        if concept_id in visited:
            return
        if concept_id in visiting:
            raise ValueError(f"Cycle detected in concept graph at '{concept_id}'")
        visiting.add(concept_id)
        for prereq_id in concepts[concept_id].prerequisites:
            visit(prereq_id)
        visiting.discard(concept_id)
        visited.add(concept_id)
        ordered.append(concepts[concept_id])

    for concept_id in concepts:
        visit(concept_id)

    return ordered
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd course_AI && pytest tests/test_concept_graph.py -v`
Expected: PASS (3 passed)

- [ ] **Step 5: Commit**

```bash
git add course_AI/src/concept_graph.py course_AI/tests/test_concept_graph.py
git commit -m "feat: add concept graph loader with topological sort"
```

---

## Task 4: Concept Graph Data File

**Files:**
- Create: `course_AI/concept_graph.yaml`

- [ ] **Step 1: Write the real concept graph data**

`course_AI/concept_graph.yaml`:
```yaml
concepts:
  - id: data
    title: Data
    chapter: "Machines That Learn"
    difficulty: 1
    prerequisites: []
  - id: pattern_recognition
    title: Pattern Recognition
    chapter: "Machines That Learn"
    difficulty: 1
    prerequisites: [data]
  - id: classification
    title: Classification
    chapter: "Teaching a Machine"
    difficulty: 1
    prerequisites: [pattern_recognition]
  - id: training
    title: Training
    chapter: "Teaching a Machine"
    difficulty: 2
    prerequisites: [classification]
  - id: neural_network
    title: Neural Network
    chapter: "Neural Networks"
    difficulty: 2
    prerequisites: [training]
  - id: deep_learning
    title: Deep Learning
    chapter: "Deep Learning"
    difficulty: 2
    prerequisites: [neural_network]
  - id: embedding
    title: Embedding
    chapter: "Embeddings"
    difficulty: 3
    prerequisites: [deep_learning]
  - id: attention
    title: Attention
    chapter: "Attention"
    difficulty: 3
    prerequisites: [embedding]
  - id: transformer
    title: Transformer
    chapter: "Transformers"
    difficulty: 3
    prerequisites: [attention]
  - id: llm
    title: Large Language Model
    chapter: "Large Language Models"
    difficulty: 4
    prerequisites: [transformer]
  - id: agent
    title: Agent
    chapter: "Agents"
    difficulty: 4
    prerequisites: [llm]
```

- [ ] **Step 2: Verify it loads correctly**

Run:
```bash
cd course_AI && python -c "from src.concept_graph import load_concept_graph; from pathlib import Path; print([c.id for c in load_concept_graph(Path('concept_graph.yaml'))])"
```
Expected: `['data', 'pattern_recognition', 'classification', 'training', 'neural_network', 'deep_learning', 'embedding', 'attention', 'transformer', 'llm', 'agent']`

- [ ] **Step 3: Commit**

```bash
git add course_AI/concept_graph.yaml
git commit -m "data: add the 11-concept dependency graph for How AI Works"
```

---

## Task 5: Prompt Builder

**Files:**
- Create: `course_AI/src/prompt_builder.py`
- Test: `course_AI/tests/test_prompt_builder.py`

- [ ] **Step 1: Write the failing tests**

`course_AI/tests/test_prompt_builder.py`:
```python
from src.concept_graph import Concept
from src.prompt_builder import build_prompt
from src.schema import AiTutor, ConceptContent, Interaction, QuizItem


def make_concept(prerequisites=None):
    return Concept(
        id="classification",
        title="Classification",
        chapter="Teaching a Machine",
        difficulty=1,
        prerequisites=prerequisites or [],
    )


def make_prior_content():
    interaction = Interaction.model_validate(
        {
            "id": "pr_1",
            "type": "prediction",
            "title": "Predict the Pattern",
            "instructions": "Guess the next value.",
            "content": {
                "sequence": [{"input": "2", "output": "4"}],
                "question_input": "7",
                "answer": "14",
            },
            "key_insight": "Patterns let us predict new values.",
        }
    )
    return ConceptContent(
        concept_id="pattern_recognition",
        explanation="AI finds patterns in data.",
        interactions=[interaction],
        quiz=[
            QuizItem(
                question="What is AI doing?",
                options=["A", "B", "C", "D"],
                answer="B",
                explanation="Because it learns rules from data.",
            )
        ],
        ai_tutor=AiTutor(
            misconceptions=["AI thinks like a human"],
            socratic_questions=["What pattern do you see?"],
            challenge=["Find your own pattern"],
        ),
    )


def test_includes_concept_title_and_chapter():
    prompt = build_prompt(make_concept(), context=[])
    assert "Classification" in prompt
    assert "Teaching a Machine" in prompt


def test_no_context_section_when_no_prerequisites():
    prompt = build_prompt(make_concept(), context=[])
    assert "Previously taught concepts" not in prompt


def test_includes_prerequisite_context():
    prompt = build_prompt(
        make_concept(prerequisites=["pattern_recognition"]),
        context=[make_prior_content()],
    )
    assert "Previously taught concepts" in prompt
    assert "AI finds patterns in data." in prompt
    assert "Patterns let us predict new values." in prompt


def test_includes_error_feedback_when_provided():
    prompt = build_prompt(
        make_concept(), context=[], error_feedback="missing field 'answer'"
    )
    assert "missing field 'answer'" in prompt
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd course_AI && pytest tests/test_prompt_builder.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'src.prompt_builder'`

- [ ] **Step 3: Write `course_AI/src/prompt_builder.py`**

```python
from typing import List, Optional

from src.concept_graph import Concept
from src.schema import ConceptContent

OUTPUT_GUIDE = (
    "Generate course content in English, in the style of Brilliant.org: "
    "concise, visual, discovery-driven. Choose the 1-2 interaction types "
    "that best fit this concept from: prediction, drag_drop, simulation, "
    "decision, build_model. Do not force-fit every type into one concept."
)


def build_prompt(
    concept: Concept,
    context: List[ConceptContent],
    error_feedback: Optional[str] = None,
) -> str:
    lines = [
        f"Concept: {concept.title} (id: {concept.id})",
        f"Chapter: {concept.chapter}",
        f"Difficulty: {concept.difficulty}",
        "",
        OUTPUT_GUIDE,
    ]

    if context:
        lines.append("")
        lines.append(
            "Previously taught concepts (avoid repeating, build on these):"
        )
        for prior in context:
            lines.append(f"- {prior.concept_id}: {prior.explanation}")
            insights = ", ".join(
                interaction.key_insight for interaction in prior.interactions
            )
            if insights:
                lines.append(f"  Key insights already covered: {insights}")

    if error_feedback:
        lines.append("")
        lines.append(
            "Your previous response did not match the required schema. "
            f"Fix this error and try again: {error_feedback}"
        )

    return "\n".join(lines)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd course_AI && pytest tests/test_prompt_builder.py -v`
Expected: PASS (4 passed)

- [ ] **Step 5: Commit**

```bash
git add course_AI/src/prompt_builder.py course_AI/tests/test_prompt_builder.py
git commit -m "feat: add prompt builder with prerequisite context and retry feedback"
```

---

## Task 6: Gemini Client Wrapper

**Files:**
- Create: `course_AI/src/ai_client.py`
- Test: `course_AI/tests/test_ai_client.py`

- [ ] **Step 1: Write the failing tests**

`course_AI/tests/test_ai_client.py`:
```python
import json

import pytest

from src import ai_client


class FakeResponse:
    def __init__(self, text):
        self.text = text


class FakeModel:
    def __init__(self):
        self.calls = []

    def generate_content(self, prompt, generation_config=None):
        self.calls.append((prompt, generation_config))
        return FakeResponse(json.dumps({"ok": True}))


def test_generate_returns_parsed_json(monkeypatch):
    fake_model = FakeModel()
    monkeypatch.setattr(ai_client.genai, "configure", lambda api_key: None)
    monkeypatch.setattr(
        ai_client.genai, "GenerativeModel", lambda name: fake_model
    )

    client = ai_client.GeminiClient(api_key="fake-key")
    result = client.generate("hello")

    assert result == {"ok": True}
    assert fake_model.calls[0][0] == "hello"
    assert (
        fake_model.calls[0][1]["response_mime_type"] == "application/json"
    )


def test_missing_api_key_raises(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    with pytest.raises(RuntimeError):
        ai_client.GeminiClient(api_key=None)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd course_AI && pytest tests/test_ai_client.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'src.ai_client'`

- [ ] **Step 3: Write `course_AI/src/ai_client.py`**

```python
import json
import os
from typing import Optional

import google.generativeai as genai

from src.schema import ConceptContent

DEFAULT_MODEL_NAME = "gemini-2.0-flash"


class GeminiClient:
    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: str = DEFAULT_MODEL_NAME,
    ):
        api_key = api_key or os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise RuntimeError(
                "GEMINI_API_KEY is not set. Set it in the environment or "
                "course_AI/.env."
            )
        genai.configure(api_key=api_key)
        self._model = genai.GenerativeModel(model_name)

    def generate(self, prompt: str) -> dict:
        response = self._model.generate_content(
            prompt,
            generation_config={
                "response_mime_type": "application/json",
                "response_schema": ConceptContent.model_json_schema(),
            },
        )
        return json.loads(response.text)
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd course_AI && pytest tests/test_ai_client.py -v`
Expected: PASS (2 passed)

- [ ] **Step 5: Commit**

```bash
git add course_AI/src/ai_client.py course_AI/tests/test_ai_client.py
git commit -m "feat: add Gemini client wrapper with structured output"
```

---

## Task 7: Generator Pipeline & CLI

**Files:**
- Create: `course_AI/src/generator.py`
- Test: `course_AI/tests/test_generator.py`

- [ ] **Step 1: Write the failing tests**

`course_AI/tests/test_generator.py`:
```python
import textwrap

import yaml

from src import generator
from src.concept_graph import Concept

VALID_CONTENT = {
    "concept_id": "pattern_recognition",
    "explanation": "AI finds patterns in data.",
    "interactions": [
        {
            "id": "pr_1",
            "type": "prediction",
            "title": "Predict the Pattern",
            "instructions": "Guess the next value.",
            "content": {
                "sequence": [{"input": "2", "output": "4"}],
                "question_input": "7",
                "answer": "14",
            },
            "key_insight": "Patterns let us predict new values.",
        }
    ],
    "quiz": [
        {
            "question": "What is AI doing?",
            "options": ["A", "B", "C", "D"],
            "answer": "B",
            "explanation": "Because it learns rules from data.",
        }
    ],
    "ai_tutor": {
        "misconceptions": ["AI thinks like a human"],
        "socratic_questions": ["What pattern do you see?"],
        "challenge": ["Find your own pattern"],
    },
}


class FakeClient:
    def __init__(self, responses):
        self.responses = list(responses)
        self.calls = 0

    def generate(self, prompt):
        self.calls += 1
        return self.responses.pop(0)


def make_concept(prerequisites=None):
    return Concept(
        id="pattern_recognition",
        title="Pattern Recognition",
        chapter="Machines That Learn",
        difficulty=1,
        prerequisites=prerequisites or [],
    )


def test_generate_concept_writes_file_on_first_success(tmp_path):
    concept = make_concept()
    client = FakeClient([VALID_CONTENT])

    result = generator.generate_concept(concept, client, tmp_path)

    assert result is not None
    output_path = tmp_path / "pattern_recognition.yaml"
    assert output_path.exists()
    saved = yaml.safe_load(output_path.read_text())
    assert saved["concept_id"] == "pattern_recognition"
    assert client.calls == 1


def test_generate_concept_retries_on_invalid_response(tmp_path):
    concept = make_concept()
    invalid = {"concept_id": "pattern_recognition"}
    client = FakeClient([invalid, VALID_CONTENT])

    result = generator.generate_concept(concept, client, tmp_path, max_retries=3)

    assert result is not None
    assert client.calls == 2


def test_generate_concept_gives_up_after_max_retries(tmp_path):
    concept = make_concept()
    invalid = {"concept_id": "pattern_recognition"}
    client = FakeClient([invalid, invalid, invalid])

    result = generator.generate_concept(concept, client, tmp_path, max_retries=3)

    assert result is None
    assert not (tmp_path / "pattern_recognition.yaml").exists()
    assert client.calls == 3


def test_run_skips_existing_output_unless_forced(tmp_path):
    concepts_path = tmp_path / "concept_graph.yaml"
    concepts_path.write_text(
        textwrap.dedent(
            """
            concepts:
              - id: pattern_recognition
                title: Pattern Recognition
                chapter: "Machines That Learn"
                difficulty: 1
                prerequisites: []
            """
        )
    )
    generated_dir = tmp_path / "generated"
    generated_dir.mkdir()
    (generated_dir / "pattern_recognition.yaml").write_text(
        yaml.dump(VALID_CONTENT)
    )

    client = FakeClient([VALID_CONTENT])
    generator.run(concepts_path, generated_dir, client)
    assert client.calls == 0

    generator.run(concepts_path, generated_dir, client, force=True)
    assert client.calls == 1
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd course_AI && pytest tests/test_generator.py -v`
Expected: FAIL with `ModuleNotFoundError: No module named 'src.generator'`

- [ ] **Step 3: Write `course_AI/src/generator.py`**

```python
import argparse
import logging
from pathlib import Path
from typing import List, Optional

import yaml
from pydantic import ValidationError

from src.ai_client import GeminiClient
from src.concept_graph import Concept, load_concept_graph
from src.prompt_builder import build_prompt
from src.schema import ConceptContent

logger = logging.getLogger(__name__)

MAX_RETRIES = 3


def _context_for(concept: Concept, generated_dir: Path) -> List[ConceptContent]:
    context = []
    for prereq_id in concept.prerequisites:
        prereq_path = generated_dir / f"{prereq_id}.yaml"
        if prereq_path.exists():
            data = yaml.safe_load(prereq_path.read_text())
            context.append(ConceptContent.model_validate(data))
    return context


def generate_concept(
    concept: Concept,
    client,
    generated_dir: Path,
    max_retries: int = MAX_RETRIES,
) -> Optional[ConceptContent]:
    context = _context_for(concept, generated_dir)
    error_feedback = None

    for attempt in range(1, max_retries + 1):
        prompt = build_prompt(concept, context, error_feedback=error_feedback)
        raw = client.generate(prompt)
        try:
            content = ConceptContent.model_validate(raw)
        except ValidationError as exc:
            logger.warning(
                "Validation failed for %s (attempt %d/%d): %s",
                concept.id,
                attempt,
                max_retries,
                exc,
            )
            error_feedback = str(exc)
            continue

        generated_dir.mkdir(parents=True, exist_ok=True)
        output_path = generated_dir / f"{concept.id}.yaml"
        output_path.write_text(
            yaml.dump(content.model_dump(mode="json"), sort_keys=False)
        )
        return content

    logger.error("Giving up on %s after %d attempts", concept.id, max_retries)
    return None


def run(
    concepts_path: Path,
    generated_dir: Path,
    client,
    force: bool = False,
    only_concept: Optional[str] = None,
) -> None:
    concepts = load_concept_graph(concepts_path)
    for concept in concepts:
        if only_concept and concept.id != only_concept:
            continue
        output_path = generated_dir / f"{concept.id}.yaml"
        if output_path.exists() and not force:
            logger.info("Skipping %s (already exists)", concept.id)
            continue
        generate_concept(concept, client, generated_dir)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate AI course content from a concept graph"
    )
    parser.add_argument("--concepts", default="concept_graph.yaml")
    parser.add_argument("--out", default="generated")
    parser.add_argument(
        "--concept", default=None, help="Only generate this concept id"
    )
    parser.add_argument(
        "--force", action="store_true", help="Regenerate even if output exists"
    )
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    client = GeminiClient()
    run(
        Path(args.concepts),
        Path(args.out),
        client,
        force=args.force,
        only_concept=args.concept,
    )


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd course_AI && pytest tests/test_generator.py -v`
Expected: PASS (4 passed)

- [ ] **Step 5: Run the full test suite**

Run: `cd course_AI && pytest -v`
Expected: All tests across `test_schema.py`, `test_concept_graph.py`, `test_prompt_builder.py`, `test_ai_client.py`, `test_generator.py` pass.

- [ ] **Step 6: Commit**

```bash
git add course_AI/src/generator.py course_AI/tests/test_generator.py
git commit -m "feat: add generator pipeline with retry/skip logic and CLI"
```

---

## Task 8: Usage README

**Files:**
- Create: `course_AI/README.md`

- [ ] **Step 1: Write `course_AI/README.md`**

```markdown
# How AI Works — Content Generation Engine

Generates structured course content (explanation, interactions, quiz, AI Tutor
block) for the "How AI Works" course from `concept_graph.yaml`, using the
Gemini API. See `docs/superpowers/specs/2026-06-18-ai-course-content-generation-engine-design.md`
for the full design.

## Setup

```bash
cd course_AI
pip install -r requirements.txt
cp .env.example .env
# edit .env and set GEMINI_API_KEY
```

## Usage

```bash
# Generate all concepts that don't have output yet, in dependency order
python -m src.generator

# Generate only one concept
python -m src.generator --concept attention

# Regenerate everything, overwriting existing output
python -m src.generator --force
```

Generated files are written to `generated/<concept_id>.yaml`.

## Tests

```bash
pytest -v
```

Tests run fully offline against fake AI clients — no Gemini API calls or
quota are used.
```

- [ ] **Step 2: Commit**

```bash
git add course_AI/README.md
git commit -m "docs: add usage README for the content generation engine"
```

---

## Plan Self-Review Notes

- Spec coverage: input schema (Task 4), output schema incl. all 5 interaction content types (Task 2), prompt context from prerequisites (Task 5), structured-output Gemini call (Task 6), retry/skip/CLI behavior (Task 7), error handling for cycles/missing prerequisites (Task 3) and missing API key (Task 6) are all covered by a task.
- All code steps contain full, runnable code — no placeholders.
- Type/name consistency checked: `Concept`, `ConceptContent`, `Interaction`, `GeminiClient.generate`, `generate_concept`, `run` are used with the same signatures across Tasks 3, 5, 6, 7.
- Real Gemini API integration test intentionally omitted from this plan (per spec: manual/optional, costs quota) — can be run manually with a real `GEMINI_API_KEY` after Task 7 by executing `python -m src.generator --concept data`.
