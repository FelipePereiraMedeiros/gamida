# -*- coding: utf-8 -*-
"""
Test suite for Greek sentence morphological analysis (§ Bergmann Grammar)
"""

import os
import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
GREEK_JSON_PATH = os.path.join(ROOT_DIR, "data", "greek_chapters.json")
BUNDLE_PATH = os.path.join(ROOT_DIR, "data", "data-bundle.js")
MODULE_PATH = os.path.join(ROOT_DIR, "js", "modules", "sentence-analysis.js")

def test_greek_database():
    print("Testing data/greek_chapters.json...")
    assert os.path.exists(GREEK_JSON_PATH), "greek_chapters.json not found"
    with open(GREEK_JSON_PATH, "r", encoding="utf-8") as f:
        chapters = json.load(f)

    assert len(chapters) == 22, f"Expected 22 chapters, found {len(chapters)}"
    
    total_sentences = 0
    total_tokens = 0

    for ch in chapters:
        num = int(ch["id"].split("_")[1])
        sents = ch.get("sentences", [])
        if num == 1:
            continue
        assert len(sents) > 0, f"Chapter {num} has no sentences"
        for s_idx, s in enumerate(sents):
            total_sentences += 1
            assert "term" in s and s["term"].strip(), f"Ch {num} s{s_idx} missing term"
            assert "translations" in s and len(s["translations"]) > 0, f"Ch {num} s{s_idx} missing translations"
            assert "tokens" in s and len(s["tokens"]) > 0, f"Ch {num} s{s_idx} missing tokens"
            assert "syntax_type" in s, f"Ch {num} s{s_idx} missing syntax_type"

            for t_idx, t in enumerate(s["tokens"]):
                total_tokens += 1
                wc = t.get("word_class", "")
                sr = t.get("syntax_role", "")
                assert wc != "Vocábulo", f"Ch {num} s{s_idx} t{t_idx} has generic 'Vocábulo'"
                assert "Segmento " not in sr, f"Ch {num} s{s_idx} t{t_idx} has generic 'Segmento X'"
                assert t.get("text"), f"Ch {num} s{s_idx} t{t_idx} missing text"
                assert t.get("transliteration"), f"Ch {num} s{s_idx} t{t_idx} missing transliteration"
                assert t.get("lemma"), f"Ch {num} s{s_idx} t{t_idx} missing lemma"

    # Specific check for Chapter 13
    ch13 = next(c for c in chapters if c["id"] == "bergmann_13")
    assert len(ch13["sentences"]) == 8, f"Expected 8 sentences in Chapter 13, got {len(ch13['sentences'])}"
    print(f"✔ greek_chapters.json: 22 chapters, {total_sentences} sentences, {total_tokens} tokens valid!")


def test_bundle_js():
    print("Testing data/data-bundle.js...")
    assert os.path.exists(BUNDLE_PATH), "data-bundle.js not found"
    with open(BUNDLE_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    assert "window.GAMIDA_DEFAULT_DATA" in content, "Bundle missing window.GAMIDA_DEFAULT_DATA"
    assert "bergmann_13" in content, "Bundle missing bergmann_13"
    assert "Ἐγένετο ἄνθρωπος ἀπεσταλμένος παρὰ Θεοῦ" in content, "Bundle missing Chapter 13 sentence 1"
    assert "ἀπεσταλμένος" in content, "Bundle missing Greek tokens in Chapter 13"
    print("✔ data-bundle.js: successfully verified and contains all enriched Greek chapters!")


def test_sentence_analysis_module():
    print("Testing js/modules/sentence-analysis.js...")
    assert os.path.exists(MODULE_PATH), "sentence-analysis.js not found"
    with open(MODULE_PATH, "r", encoding="utf-8") as f:
        code = f.read()

    assert "inferGreekWordFallback" in code, "Missing inferGreekWordFallback"
    assert "normalizeGreekForSearch" in code, "Missing normalizeGreekForSearch"
    assert "pronoun" in code, "Missing pronoun category in sentence-analysis.js"
    assert "Passo 1: Classe Gramatical" in code, "Missing 4-step translation format"
    assert "Passo 2: Morfologia" in code, "Missing Step 2"
    assert "Passo 3: Vocabulário" in code, "Missing Step 3"
    assert "Passo 4: Linha Contínua" in code, "Missing Step 4"
    assert "gnorm:" in code, "Missing Greek normalization search index"
    print("✔ sentence-analysis.js: verified with 4-step framework and smart fallback!")


if __name__ == "__main__":
    test_greek_database()
    test_bundle_js()
    test_sentence_analysis_module()
    print("\n🎉 ALL TESTS PASSED SUCCESSFULLY!")
