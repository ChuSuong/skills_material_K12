"""
Sketchfab Skill — Search & Download Free 3D Models as GLB
Usage:
    python sketchfab_skill.py --keyword "human heart" --count 5
"""

import token
import os, sys, json, time, zipfile, shutil, argparse, requests
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()
BASE_URL = "https://api.sketchfab.com/v3"

def get_headers(token):
    return {"Authorization": f"Token {token}"}

# ── 1. AUTH ──────────────────────────────────
def verify_token(token):
    r = requests.get(f"{BASE_URL}/me", headers=get_headers(token), timeout=10)
    if r.status_code != 200:
        print(f"❌ Token không hợp lệ: {r.status_code}")
        sys.exit(1)
    u = r.json()
    print(f"✅ Login: {u.get('username')} ({u.get('email')})")

# MỚI
def search_models(token, keyword, count, sort_by=None):
    print(f"\n🔍 Searching '{keyword}' via /v3/search ...")
    # Fetch gấp 5x để có đủ để sort
    fetch_count = min(count * 5, 100)
    r = requests.get(f"{BASE_URL}/search", headers=get_headers(token), params={
        "type":         "models",
        "q":            keyword,
        "downloadable": "true",
        "count":        fetch_count,
    }, timeout=15)

    results = r.json().get("results", [])

    # Sort local theo tiêu chí
    if sort_by == "views":
        results.sort(key=lambda m: m.get("viewCount", 0), reverse=True)
    elif sort_by == "downloads":
        results.sort(key=lambda m: m.get("downloadCount", 0), reverse=True)
    elif sort_by == "best":
        results.sort(key=lambda m: m.get("viewCount", 0) + m.get("likeCount", 0) * 50, reverse=True)
    
    print(f"✅ Tìm thấy {len(results)} | Lấy top {count} theo '{sort_by or 'relevance'}':")
    for i, m in enumerate(results[:count], 1):
        print(f"   {i}. {m['name']} | views: {m.get('viewCount',0):,} | likes: {m.get('likeCount',0):,}")
    
    return results[:count]

# ── 3. GET DOWNLOAD URL ───────────────────────
def get_download_url(token, uid):
    r = requests.get(f"{BASE_URL}/models/{uid}/download",
                     headers=get_headers(token), timeout=10)
    if r.status_code == 403: return None, "not_downloadable"
    if r.status_code == 404: return None, "not_found"
    if r.status_code != 200: return None, f"error_{r.status_code}"

    data = r.json()
    for fmt in ["glb", "gltf", "usdz"]:
        if fmt in data and data[fmt].get("url"):
            return data[fmt]["url"], fmt
    return None, "no_format"

# ── 4. DOWNLOAD ───────────────────────────────
def download_file(url, dest):
    try:
        r = requests.get(url, stream=True, timeout=120)
        r.raise_for_status()
        size = 0
        with open(dest, "wb") as f:
            for chunk in r.iter_content(8192):
                if chunk:
                    f.write(chunk)
                    size += len(chunk)
        print(f"   📥 {dest.name} ({size/1024/1024:.1f} MB)")
        return True
    except Exception as e:
        print(f"   ❌ Download lỗi: {e}")
        return False

# ── 5. EXTRACT ZIP → GLB ─────────────────────
def extract_glb(zip_path, model_dir):
    tmp = model_dir / "_tmp"
    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(tmp)
        zip_path.unlink()
        for ext in [".glb", ".gltf"]:
            hits = list(tmp.rglob(f"*{ext}"))
            if hits:
                out = model_dir / "model.glb"
                shutil.copy2(hits[0], out)
                shutil.rmtree(tmp, ignore_errors=True)
                print(f"   ✅ Extracted → model.glb")
                return out
        print("   ⚠️ Không tìm thấy GLB trong zip")
        return None
    except zipfile.BadZipFile:
        print("   ❌ Zip bị lỗi")
        return None

# ── 6. METADATA ───────────────────────────────
def save_metadata(model, model_dir, fmt):
    lic = model.get("license") or {}
    meta = {
        "uid":           model.get("uid"),
        "name":          model.get("name"),
        "author":        model.get("user", {}).get("username"),
        "license":       lic.get("label", "Unknown"),
        "sketchfab_url": model.get("viewerUrl", ""),
        "tags":          [t["name"] for t in model.get("tags", [])],
        "face_count":    model.get("faceCount"),
        "format":        fmt,
        "downloaded_at": datetime.utcnow().isoformat(),
    }
    with open(model_dir / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2, ensure_ascii=False)

# ── 7. MAIN ───────────────────────────────────
def run(token, keyword, count, output_dir, sort_by=None):
    out = Path(output_dir)
    out.mkdir(parents=True, exist_ok=True)

    verify_token(token)
    # MỚI
    models = search_models(token, keyword, count, sort_by=sort_by)
    if not models:
        print("Không có model nào.")
        return

    report = {"keyword": keyword, "total_found": len(models),
              "downloaded": 0, "failed": 0, "skipped": 0,
              "models": [], "output_dir": str(out.resolve())}

    for i, model in enumerate(models[:count], 1):
        uid  = model.get("uid")
        name = model.get("name", "unknown")
        print(f"\n[{i}/{min(count, len(models))}] {name}")

        url, fmt = get_download_url(token, uid)
        if not url:
            print(f"   ⚠️ Skip: {fmt}")
            report["skipped"] += 1
            report["models"].append({"uid": uid, "name": name, "status": fmt})
            continue

        model_dir = out / f"{i:02d}_{uid}"
        model_dir.mkdir(exist_ok=True)

        dest = model_dir / ("model.glb" if fmt == "glb" else "source.zip")
        ok = download_file(url, dest)

        if ok and fmt in ("gltf", "usdz"):
            glb = extract_glb(dest, model_dir)
            ok  = glb is not None

        if ok:
            save_metadata(model, model_dir, fmt)
            report["downloaded"] += 1
            report["models"].append({"uid": uid, "name": name, "status": "success", "format": fmt})
        else:
            report["failed"] += 1
            report["models"].append({"uid": uid, "name": name, "status": "failed"})
            shutil.rmtree(model_dir, ignore_errors=True)

        time.sleep(0.5)

    with open(out / "download_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    print(f"""
╔══════════════════════════════════╗
║         DOWNLOAD REPORT          ║
╠══════════════════════════════════╣
║  Keyword  : {keyword:<22} ║
║  ✅ Success: {report['downloaded']:<22} ║
║  ⚠️  Skipped: {report['skipped']:<22} ║
║  ❌ Failed : {report['failed']:<22} ║
╚══════════════════════════════════╝
📁 {out.resolve()}
""")

# ── 8. CLI ────────────────────────────────────
if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--token",   default=os.getenv("SKETCHFAB_TOKEN"))
    p.add_argument("--keyword", required=True)
    p.add_argument("--count",   type=int, default=5)
    p.add_argument("--output",  default="./sketchfab_downloads")
    p.add_argument("--sort", choices=["views", "downloads", "best"], default=None,
               help="Sort: views | downloads | best (views+downloads)")
    args = p.parse_args()

    if not args.token:
        print("❌ Thiếu token! Dùng --token hoặc SKETCHFAB_TOKEN trong .env")
        sys.exit(1)

    run(token=args.token, keyword=args.keyword, count=args.count, output_dir=args.output, sort_by=args.sort)