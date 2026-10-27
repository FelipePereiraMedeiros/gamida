import json
import os
import sys
from datetime import datetime, timezone

sys.stdout.reconfigure(encoding='utf-8')

data_dir = os.path.join(os.path.dirname(__file__), '..', 'data')
hebrew_path = os.path.join(data_dir, 'hebrew_chapters.json')
greek_path = os.path.join(data_dir, 'greek_chapters.json')
bundle_path = os.path.join(data_dir, 'data-bundle.js')

print("Lendo dados dos capítulos...")
with open(hebrew_path, 'r', encoding='utf-8') as f:
    hebrew_data = json.load(f)

with open(greek_path, 'r', encoding='utf-8') as f:
    greek_data = json.load(f)

if not isinstance(hebrew_data, list) or len(hebrew_data) == 0:
    raise ValueError("hebrew_chapters.json não é um array válido ou está vazio")

if not isinstance(greek_data, list) or len(greek_data) == 0:
    raise ValueError("greek_chapters.json não é um array válido ou está vazio")

iso_now = datetime.now(timezone.utc).isoformat()
bundle_content = f"""/**
 * Gamida Data Bundle - Offline & Standalone Fallback
 * Gerado automaticamente via scripts/build-bundle.py
 * Data: {iso_now}
 */
window.GAMIDA_DEFAULT_DATA = {{
  hebrew: {json.dumps(hebrew_data, indent=2, ensure_ascii=False)},
  greek: {json.dumps(greek_data, indent=2, ensure_ascii=False)}
}};
"""

with open(bundle_path, 'w', encoding='utf-8') as f:
    f.write(bundle_content)

print(f"✔ Bundle offline gerado com sucesso em: {bundle_path}")
print(f"  - Hebraico: {len(hebrew_data)} capítulos")
print(f"  - Grego: {len(greek_data)} capítulos")
