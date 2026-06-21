# Sketchfab 3D Model Downloader Skill

Search và download free 3D models từ Sketchfab, output ra file GLB.

## Setup

```bash
pip install requests python-dotenv
```

Tạo file `.env`:
```
SKETCHFAB_TOKEN=your_token_here
```

## Usage

```bash
# Basic
python sketchfab_skill.py --keyword "car" --count 5

# Full options
python sketchfab_skill.py \
  --token "YOUR_TOKEN" \
  --keyword "tree" \
  --count 10 \
  --output "./my_models"
```

## Output

```
sketchfab_downloads/
├── 01_<uid>/
│   ├── model.glb
│   └── metadata.json
├── 02_<uid>/
│   ├── model.glb
│   └── metadata.json
└── download_report.json
```

## Notes
- Chỉ download model có license CC BY (free & downloadable)
- Ưu tiên format: GLB > GLTF > Source ZIP
- Nếu download về là ZIP, tự động extract và tìm file 3D
- Rate limit: 0.5s delay giữa các request
