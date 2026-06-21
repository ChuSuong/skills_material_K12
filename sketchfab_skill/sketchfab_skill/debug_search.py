"""
Chạy script này để debug search endpoint
python debug_search.py
"""
import requests, json, os
from dotenv import load_dotenv
load_dotenv()

TOKEN = os.getenv("SKETCHFAB_TOKEN") or input("Paste token: ")
BASE  = "https://api.sketchfab.com/v3"
H     = {"Authorization": f"Token {TOKEN}"}
KW    = "human heart"

print(f"\n{'='*50}")
print(f"Keyword: '{KW}'")
print(f"{'='*50}\n")

# --- Test 1: /v3/models với q ---
print("TEST 1: /v3/models?q=...")
r = requests.get(f"{BASE}/models", headers=H, params={
    "q": KW, "downloadable": "true", "count": 5
})
d = r.json()
print(f"  Status: {r.status_code} | Total: {d.get('count', '?')}")
for m in d.get("results", []):
    print(f"  → '{m['name']}' | tags: {[t['name'] for t in m.get('tags', [])][:5]}")

# --- Test 2: /v3/search ---
print("\nTEST 2: /v3/search?type=models&q=...")
r = requests.get(f"{BASE}/search", headers=H, params={
    "type": "models", "q": KW, "downloadable": "true", "count": 5
})
d = r.json()
print(f"  Status: {r.status_code} | Total: {d.get('count', '?')}")
for m in d.get("results", []):
    print(f"  → '{m['name']}' | tags: {[t['name'] for t in m.get('tags', [])][:5]}")

# --- Test 3: /v3/models với tags ---
print("\nTEST 3: /v3/models?tags=heart...")
r = requests.get(f"{BASE}/models", headers=H, params={
    "tags": "heart", "downloadable": "true", "count": 5
})
d = r.json()
print(f"  Status: {r.status_code} | Total: {d.get('count', '?')}")
for m in d.get("results", []):
    print(f"  → '{m['name']}' | tags: {[t['name'] for t in m.get('tags', [])][:5]}")
