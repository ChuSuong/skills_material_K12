import os
from dotenv import load_dotenv
load_dotenv()

import json
import re
from openai import AzureOpenAI

class AzureLLMService:
    def __init__(self):
        self.endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        self.api_key = os.getenv("AZURE_OPENAI_API_KEY")
        self.api_version = os.getenv("AZURE_API_VERSION", "2024-02-15-preview")
        self.deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT")

        if not all([self.endpoint, self.api_key, self.deployment_name]):
            raise ValueError(
                "Missing required Azure OpenAI environment variables: "
                "AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_KEY, AZURE_OPENAI_DEPLOYMENT"
            )

        self.client = AzureOpenAI(
            azure_endpoint=self.endpoint,
            api_key=self.api_key,
            api_version=self.api_version
        )

    def _title_from_object(self, obj: dict) -> str:
        base = (obj.get("title") or obj.get("name") or obj.get("type") or obj.get("id") or "Đối tượng").strip()
        return re.sub(r"[_\-]+", " ", base).title()

    def _normalize_quiz(self, obj: dict) -> dict | None:
        quiz = obj.get("quiz")
        if not isinstance(quiz, dict):
            return None

        question = quiz.get("question")
        answers = quiz.get("answers") or quiz.get("options")
        correct_answer = quiz.get("correctAnswer")

        if correct_answer is None and isinstance(answers, list):
            answer_index = quiz.get("answer_index")
            if isinstance(answer_index, int) and 0 <= answer_index < len(answers):
                correct_answer = answers[answer_index]

        if not question or not isinstance(answers, list) or len(answers) < 2 or not correct_answer:
            return None

        return {
            "question": question,
            "answers": answers,
            "correctAnswer": correct_answer,
        }

    def _normalize_object(self, obj: dict) -> dict:
        normalized = dict(obj)
        title = self._title_from_object(normalized)
        object_type = normalized.get("type", "object")

        normalized["title"] = title
        normalized["interactable"] = True
        normalized["position"] = normalized.get("position") or [0, 0, 0]
        normalized["scale"] = normalized.get("scale") or [1, 1, 1]
        normalized["rotation"] = normalized.get("rotation") or [0, 0, 0]
        normalized["description"] = normalized.get("description") or (
            f"{title} là một thành phần trong học liệu 3D được tạo từ prompt người dùng."
        )
        normalized["info"] = normalized.get("info") or normalized["description"]

        quiz = self._normalize_quiz(normalized)
        if quiz:
            normalized["quiz"] = quiz
        else:
            normalized.pop("quiz", None)

        if "color" not in normalized:
            color_palette = {
                "apple": "#ef4444",
                "table": "#8b5a2b",
                "tree": "#16a34a",
                "rock": "#64748b",
                "house": "#f59e0b",
                "planet": "#3b82f6",
                "sun": "#f59e0b",
            }
            normalized["color"] = color_palette.get(str(object_type).lower(), "#38bdf8")

        return normalized

    def _build_visual_profile(self, obj: dict, prompt: str, theme: str) -> dict:
        haystack = " ".join(
            str(value)
            for value in [
                prompt,
                theme,
                obj.get("type"),
                obj.get("title"),
                obj.get("description"),
                obj.get("image_prompt"),
            ]
            if value
        ).lower()

        profile = {
            "sceneStyle": "galleryLight",
            "backgroundColor": "#e8eef5",
            "floorColor": "#cbd5e1",
            "pedestalColor": "#f8fafc",
            "accentColor": "#38bdf8",
            "secondaryAccentColor": "#0f172a",
            "particleColor": "#38bdf8",
        }

        if any(keyword in haystack for keyword in ["space", "planet", "solar", "moon", "galaxy", "star", "vũ trụ", "hành tinh"]):
            profile.update({
                "sceneStyle": "spaceGallery",
                "backgroundColor": "#08111f",
                "floorColor": "#111c2f",
                "pedestalColor": "#1f2b44",
                "accentColor": "#7dd3fc",
                "secondaryAccentColor": "#c084fc",
                "particleColor": "#a78bfa",
            })
        elif any(keyword in haystack for keyword in ["tree", "plant", "forest", "flower", "leaf", "animal", "bird", "cat", "dog", "fox", "cây", "động vật", "thực vật"]):
            profile.update({
                "sceneStyle": "natureStudio",
                "backgroundColor": "#eef8ef",
                "floorColor": "#d9ead7",
                "pedestalColor": "#fbfdf7",
                "accentColor": "#22c55e",
                "secondaryAccentColor": "#f59e0b",
                "particleColor": "#4ade80",
            })
        elif any(keyword in haystack for keyword in ["egypt", "desert", "sand", "pyramid", "pharaoh", "ai cập", "sa mạc", "kim tự tháp"]):
            profile.update({
                "sceneStyle": "desertStudio",
                "backgroundColor": "#f7ecd7",
                "floorColor": "#ead3a4",
                "pedestalColor": "#fff7e8",
                "accentColor": "#d97706",
                "secondaryAccentColor": "#92400e",
                "particleColor": "#f59e0b",
            })

        return profile

    def _to_focus_object(self, obj: dict) -> dict:
        focus = dict(obj)
        # Generated showcase scenes should not trust arbitrary LLM transforms.
        focus["position"] = [0, 0.66, 0]
        focus["scale"] = [1.0, 1.0, 1.0]
        focus["rotation"] = [0, 0, 0]
        focus["displayMode"] = "museumFocus"
        return focus

    def _normalize_scene(self, scene_data: dict, prompt: str) -> dict:
        theme = scene_data.get("theme") or prompt.strip() or "Học liệu 3D tạo từ AI"
        objects = [self._normalize_object(obj) for obj in scene_data.get("objects", []) if isinstance(obj, dict)]
        if objects:
            objects = [self._to_focus_object(objects[0])]
        visual_profile = self._build_visual_profile(objects[0] if objects else {}, prompt, theme)

        return {
            "id": scene_data.get("id") or "generated_scene",
            "theme": theme,
            "allowDissolve": scene_data.get("allowDissolve", True),
            "particleColor": scene_data.get("particleColor") or visual_profile["particleColor"],
            "environment": "museumFocus",
            "sceneStyle": visual_profile["sceneStyle"],
            "backgroundColor": visual_profile["backgroundColor"],
            "floorColor": visual_profile["floorColor"],
            "pedestalColor": visual_profile["pedestalColor"],
            "accentColor": visual_profile["accentColor"],
            "secondaryAccentColor": visual_profile["secondaryAccentColor"],
            "character": scene_data.get("character") or {
                "name": "Trợ giảng AI",
                "voice_id": "vi-VN",
                "animation": "idle",
            },
            "interactions": scene_data.get("interactions") or [
                {
                    "trigger": "start",
                    "action": "speak",
                    "text": f"Scene AI: {theme}. Kéo chuột để xoay, scroll để zoom, bấm vào từng đối tượng để xem giải thích và câu hỏi ôn tập.",
                }
            ],
            "objects": objects,
        }

    def generate_scene(self, prompt: str) -> dict:
        system_prompt = """
You are an AI assistant that generates 3D Scene JSON configurations based on user prompts.
The JSON must strictly follow this schema:
{
    "id": "string (unique identifier for the scene)",
    "theme": "string (the overall theme of the scene)",
    "allowDissolve": true,
    "particleColor": "string hex color like #38bdf8",
    "character": {
        "name": "string",
        "voice_id": "vi-VN",
        "animation": "idle"
    },
    "interactions": [
        {
            "trigger": "start",
            "action": "speak",
            "text": "short onboarding text for the learner"
        }
    ],
    "objects": [
        {
            "id": "string (unique identifier for the object)",
            "type": "string (type of the 3D object, e.g., 'tree', 'rock', 'building')",
            "position": [x, y, z] (array of 3 floats),
            "scale": [x, y, z] (array of 3 floats),
            "rotation": [x, y, z] (array of 3 floats, optional),
            "title": "string short learner-facing object title",
            "description": "string, 2-4 sentences explaining the object educationally",
            "info": "string, 1-2 concise sentences for the quick side panel",
            "quiz": {
                "question": "string",
                "answers": ["string", "string", ... exactly 4 items],
                "correctAnswer": "string matching one item in answers"
            },
            "image_prompt": "string (a detailed prompt to generate the 3D model's texture or appearance using an image generation AI)"
        }
    ]
}

Requirements:
- Output must be suitable for an interactive educational 3D scene.
- Focus on a single main 3D object only. Do not create background props or extra environment objects.
- The object position and scale will be standardized by the app, so keep them simple and centered.
- Include learner-friendly `title`, `description`, `info`, and `quiz` for the main object.
- Use Vietnamese for learner-facing text.
- The object should represent the core concept from the prompt and be visually easy to inspect in a museum-style showcase.
- Make `image_prompt` describe exactly one centered object with a plain studio background, no extra props, no text, and the full silhouette visible.

Return ONLY valid JSON. Do not include markdown code blocks (e.g. ```json ... ```) or any additional text.
"""

        try:
            response = self.client.chat.completions.create(
                model=self.deployment_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
            )

            response_content = response.choices[0].message.content.strip()
            
            # Clean up markdown if the LLM accidentally included it
            if response_content.startswith("```json"):
                response_content = response_content[7:]
            elif response_content.startswith("```"):
                response_content = response_content[3:]
            
            if response_content.endswith("```"):
                response_content = response_content[:-3]
            scene_data = json.loads(response_content.strip())
            return self._normalize_scene(scene_data, prompt)
        except Exception as e:
            print(f"Error generating scene: {e}")
            raise
