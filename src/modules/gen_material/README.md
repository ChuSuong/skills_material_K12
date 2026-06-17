# gen_material demo_3d app

Thư mục này chứa 2 phần của app demo 3D:

- `demo_3d_viewer`: frontend React
- `backend`: backend FastAPI

## Cấu trúc

```text
src/modules/gen_material/
├── backend/
└── demo_3d_viewer/
```

## Yêu cầu

- Python 3.10+
- Node.js 18+
- npm
- CUDA-capable GPU nếu muốn chạy TRELLIS thật; nếu không có GPU thì backend sẽ rơi về mock mode ở một số luồng

## Backend

### 1. Tạo môi trường Python bằng uv

```bash
cd src/modules/gen_material/backend
uv venv .venv
source .venv/bin/activate
uv pip install -r requirements.txt
```

Nếu máy chưa có `uv`, cài theo hướng dẫn của team trước.

`requirements.txt` chỉ là bộ dependency nền để backend FastAPI lên được. Nếu muốn chạy TRELLIS thật với GPU/CUDA, tham khảo thêm `backend/requirements-gpu.txt` và phần thiết lập TRELLIS/CUDA bên dưới.

### 2. Thiết lập TRELLIS / CUDA nếu chạy bản GPU

Bản backend hiện tại không phải repo standalone hoàn toàn. Ngoài package Python, nó còn cần source TRELLIS ngoài repo và các dependency native/CUDA.

Các thành phần cần có nếu muốn chạy bản GPU giống môi trường hiện tại:

- PyTorch CUDA đúng bản của máy
- các package trong `backend/requirements-gpu.txt`
- source TRELLIS được checkout ở máy và trỏ bằng biến môi trường
- driver CUDA / NVIDIA phù hợp với máy đích

Các biến `.env.example` mặc định đang trỏ tới source ngoài repo:

- `TRELLIS2_SRC_PATH`
- `TRELLIS_SRC_PATH`
- `TRELLIS2_OVOXEL_PATH`

Với cấu hình hiện tại, máy đích nên clone thêm 2 repo ngoài source K12:

```bash
mkdir -p .tmp
git clone https://github.com/microsoft/TRELLIS.2.git .tmp/trellis2-src
git clone https://github.com/microsoft/TRELLIS.git .tmp/trellis-src
```

Sau đó trỏ `.env` về các thư mục này, hoặc giữ nguyên giá trị mặc định nếu bạn đặt chúng đúng theo cấu trúc `.tmp` ở trên. `TRELLIS2_OVOXEL_PATH` hiện đang tham chiếu tới thư mục `o-voxel` nằm bên trong repo `TRELLIS.2`.

`TRELLIS2_CONFIG_FILE` mặc định nên để `pipeline.json`. Trong source TRELLIS.2 đang dùng hiện tại không có file `pipeline_no_rembg.json`, nên nếu `.env` cũ của máy khác đang trỏ tới tên này thì cần đổi lại hoặc tự cung cấp file cấu hình tương ứng.

Nếu các đường dẫn này không tồn tại thì backend vẫn có thể lên, nhưng luồng generate 3D bằng TRELLIS có thể không chạy đúng như môi trường gốc.

### 3. Tạo file môi trường

```bash
cp .env.example .env
```

Các biến quan trọng trong `.env`:

- `GEMINI_API_KEY`: bắt buộc nếu dùng luồng generate image
- `TRELLIS_BACKEND`: mặc định `trellis2`
- `TRELLIS2_MODEL_PATH`: model TRELLIS
- `TRELLIS_SS_STEPS`, `TRELLIS_SLAT_STEPS`, `TRELLIS_TEX_SLAT_STEPS`: ảnh hưởng tốc độ/chất lượng generate 3D
- `TRELLIS2_DECIMATION_TARGET`: số polygon mục tiêu sau hậu xử lý
- `TRELLIS2_TEXTURE_SIZE`: độ phân giải texture output

### 4. Chạy backend

```bash
cd src/modules/gen_material/backend
uv run python -m uvicorn main:app --host 0.0.0.0 --port 8006
```

Swagger UI:

```text
http://127.0.0.1:8006/docs
```

## Frontend

### 1. Cài dependencies

```bash
cd src/modules/gen_material/demo_3d_viewer
npm install
```

### 2. Chạy frontend

```bash
cd src/modules/gen_material/demo_3d_viewer
npm start
```

Mặc định app dùng proxy tới backend tại `http://127.0.0.1:8006` trong `demo_3d_viewer/package.json`.

Nếu port `3000` đã bị chiếm, có thể chạy:

```bash
PORT=3002 npm start
```

## Ghi chú

- Không commit `node_modules`, môi trường ảo, model weights, output runtime hoặc file `.env` thật.
- Repo này hiện chỉ mang source của demo 3D app; các tài sản model lớn cần được tải/cấu hình riêng.
- `backend/requirements-gpu.txt` được chụp từ môi trường `.venv-trellis2` đang chạy trong repo gốc. Đây là file tham chiếu, không đảm bảo tự nó đủ để dựng lại 100% môi trường GPU trên máy khác.
- Nếu backend khởi động chậm, hãy giảm các biến steps và texture trong `.env` để ưu tiên tốc độ khi test.
