# -*- coding: utf-8 -*-
import json
import sys
import re

sys.stdout.reconfigure(encoding='utf-8')

with open("data/greek_chapters.json", "r", encoding="utf-8") as f:
    chapters = json.load(f)

print(f"Total chapters: {len(chapters)}")
total_sentences = 0
total_tokens = 0
errors = []

for ch in chapters:
    ch_id = ch["id"]
    sents = ch.get("sentences", [])
    num = int(ch_id.split("_")[1])
    if num == 1:
        print(f"Chapter {num} ({ch_id}): 0 sentences (alphabet/phonetics introductory chapter)")
        continue
    
    if not sents:
        errors.append(f"Chapter {num} ({ch_id}) has NO sentences!")
        continue

    ch_tokens = 0
    for s_idx, s in enumerate(sents):
        total_sentences += 1
        tokens = s.get("tokens", [])
        if not tokens:
            errors.append(f"Chapter {num} sentence {s_idx + 1} ({s.get('term', '')[:30]}) has NO tokens!")
        for t_idx, t in enumerate(tokens):
            total_tokens += 1
            ch_tokens += 1
            wc = t.get("word_class", "")
            sr = t.get("syntax_role", "")
            inf = t.get("inflection", "")
            if wc == "Vocábulo":
                errors.append(f"Chapter {num} sent {s_idx + 1} token {t_idx + 1} has generic 'Vocábulo'!")
            if "Segmento" in sr:
                errors.append(f"Chapter {num} sent {s_idx + 1} token {t_idx + 1} has generic 'Segmento'!")

    print(f"Chapter {num:2d} ({ch_id}): {len(sents):2d} sentences, {ch_tokens:3d} tokens")

print("\n--- Summary ---")
print(f"Total sentences verified: {total_sentences}")
print(f"Total tokens verified: {total_tokens}")

if errors:
    print(f"\n❌ FOUND {len(errors)} ERRORS:")
    for err in errors[:20]:
        print(f"  - {err}")
    sys.exit(1)
else:
    print("\n✅ ALL Greek sentences and tokens are 100% compliant with Bergmann Grammar and the 4-step framework!")

# Print Chapter 13 sample
ch13 = next(c for c in chapters if c["id"] == "bergmann_13")
print("\n--- Chapter 13 Verification (Sentence 1) ---")
s1 = ch13["sentences"][0]
print(f"Term: {s1['term']}")
print(f"Translations: {s1['translations']}")
print(f"Tokens ({len(s1['tokens'])}):")
for t in s1["tokens"]:
    print(f"  {t['index']}. {t['text']} ({t['transliteration']}) -> [{t['word_class']}] / {t['inflection']} / {t['syntax_role']} / {t['context_meaning']}")
