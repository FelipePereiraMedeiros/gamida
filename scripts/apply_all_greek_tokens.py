# -*- coding: utf-8 -*-
"""
Master script to apply morphological analysis tokens to all Greek chapters (6 to 22)
according to Johannes Bergmann's Greek Grammar and the 4-step translation framework.
"""

import os
import sys
import json

sys.stdout.reconfigure(encoding='utf-8')

# Ensure scratch path is available for imports
BRAIN_SCRATCH = r"C:\Users\karol\.gemini\antigravity-ide\brain\3e33808d-6e69-4b98-a265-665e8d329d46\scratch"
if BRAIN_SCRATCH not in sys.path:
    sys.path.insert(0, BRAIN_SCRATCH)

import build_part_a
import build_part_a_7_8_9
import build_part_b
import build_chapter_13
import build_part_c
import build_part_d_18_19
import build_part_d_20_22

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
GREEK_JSON = os.path.join(PROJECT_ROOT, "data", "greek_chapters.json")

def main():
    print(f"Loading {GREEK_JSON}...")
    with open(GREEK_JSON, "r", encoding="utf-8") as f:
        chapters = json.load(f)

    # Collect sentence generators
    chapter_updates = {
        "bergmann_06": build_part_a.get_chapter_06_sentences(),
        "bergmann_07": build_part_a_7_8_9.get_chapter_07_sentences(),
        "bergmann_08": build_part_a_7_8_9.get_chapter_08_sentences(),
        "bergmann_09": build_part_a_7_8_9.get_chapter_09_sentences(),
        "bergmann_10": build_part_b.get_chapter_10_sentences(),
        "bergmann_11": build_part_b.get_chapter_11_sentences(),
        "bergmann_12": build_part_b.get_chapter_12_sentences(),
        "bergmann_13": build_chapter_13.ch13_sentences,
        "bergmann_14": build_part_c.get_chapter_14_sentences(),
        "bergmann_15": build_part_c.get_chapter_15_sentences(),
        "bergmann_16": build_part_c.get_chapter_16_sentences(),
        "bergmann_17": build_part_c.get_chapter_17_sentences(),
        "bergmann_18": build_part_d_18_19.get_chapter_18_sentences(),
        "bergmann_19": build_part_d_18_19.get_chapter_19_sentences(),
        "bergmann_20": build_part_d_20_22.get_chapter_20_sentences(),
        "bergmann_21": build_part_d_20_22.get_chapter_21_sentences(),
        "bergmann_22": build_part_d_20_22.get_chapter_22_sentences(),
    }

    total_updated = 0
    total_tokens_count = 0

    for ch in chapters:
        ch_id = ch["id"]
        if ch_id in chapter_updates:
            new_sents = chapter_updates[ch_id]
            old_sents = ch.get("sentences", [])
            print(f"Updating {ch_id} ({ch['title']}): {len(old_sents)} existing -> {len(new_sents)} enriched sentences")
            
            # Validation
            for s_idx, s in enumerate(new_sents):
                assert "id" in s, f"Sentence {s_idx} in {ch_id} missing id"
                assert "term" in s, f"Sentence {s_idx} in {ch_id} missing term"
                assert "translations" in s, f"Sentence {s_idx} in {ch_id} missing translations"
                assert "tokens" in s, f"Sentence {s_idx} in {ch_id} missing tokens"
                assert len(s["tokens"]) > 0, f"Sentence {s_idx} in {ch_id} has empty tokens"
                for t in s["tokens"]:
                    assert t.get("word_class") != "Vocábulo", f"Invalid fallback word_class in {ch_id}: {t}"
                    assert "Segmento" not in t.get("syntax_role", ""), f"Invalid fallback syntax_role in {ch_id}: {t}"
                    total_tokens_count += 1
            
            ch["sentences"] = new_sents
            total_updated += len(new_sents)

    print(f"\nAll updates validated! Total sentences updated: {total_updated}, total tokens: {total_tokens_count}")

    with open(GREEK_JSON, "w", encoding="utf-8") as f:
        json.dump(chapters, f, ensure_ascii=False, indent=2)
    print(f"Successfully saved {GREEK_JSON}")

    # Now rebuild bundle
    bundle_script = os.path.join(PROJECT_ROOT, "scripts", "build-bundle.py")
    if os.path.exists(bundle_script):
        print(f"Running bundle script {bundle_script}...")
        os.system(f'python "{bundle_script}"')
    else:
        print("Bundle script not found!")

if __name__ == "__main__":
    main()
