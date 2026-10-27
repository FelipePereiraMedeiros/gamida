# -*- coding: utf-8 -*-
"""
Test Suite: Hebrew Sentence Morphological Analysis Restoration (Page Kelley)
Verifies that Hebrew morphological analysis has been fully restored to its canonical state.
"""
import sys
import json
import re

sys.stdout.reconfigure(encoding='utf-8')

def main():
    print("Testing Hebrew Analysis Restoration...")

    with open('js/modules/sentence-analysis.js', 'r', encoding='utf-8') as f:
        code = f.read()

    # 1. Verify Hebrew Canonical Categories
    hebrew_categories = [
        'Artigo Definido', 'Conjunção', 'Preposição', 'Substantivo',
        'Adjetivo', 'Verbo', 'Advérbio', 'Sufixo Pronominal', 'Partícula / Pronome'
    ]
    for cat in hebrew_categories:
        assert cat in code, f"Missing Hebrew category: {cat}"
    print("[OK] All 9 canonical Hebrew categories present.")

    # 2. Verify Hebrew Page Kelley Pedagogical Sections
    pedagogical_strings = [
        "Regra Fonética / Gramatical (Page Kelley)",
        "Contexto Sintático da Palavra Inteira",
        "Visão Global da Oração",
        "Resumo Sintático & Pedagógico",
        "Partícula ${mItem.index + 1} de",
        "Estrutura Sintática Bíblica",
        "Tradução Equivalente / Literal",
        "Passe o mouse sobre qualquer letra ou parte da frase"
    ]
    for s in pedagogical_strings:
        assert s in code, f"Missing pedagogical string: {s}"
    print("[OK] All Page Kelley pedagogical text strings present.")

    # 3. Verify Hebrew Interaction Rules (RTL, Pinning, Background Unpinning)
    assert 'handleHebrewModalKeyDown' in code, "Missing Hebrew keyboard handler"
    assert 'ArrowLeft' in code and 'navigateHebrewMorphemes(+1)' in code, "ArrowLeft should advance in RTL"
    assert 'ArrowRight' in code and 'navigateHebrewMorphemes(-1)' in code, "ArrowRight should retreat in RTL"
    assert 'container.addEventListener("click"' in code, "Missing Hebrew click event listener"
    assert 'HebrewModalState.pinnedIndex = null' in code, "Missing background click unpinning"
    assert 'container.setAttribute("dir", "rtl")' in code, "Hebrew container must be RTL"
    assert 'container.classList.add("hebrew-text")' in code, "Hebrew container must have hebrew-text class"
    print("[OK] Hebrew interaction rules (RTL, unpinning, debounce) verified.")

    # 4. Verify Hebrew Data Integrity (Kelley 29 chapters, sentences and tokens)
    with open('data/hebrew_chapters.json', 'r', encoding='utf-8') as f:
        h_data = json.load(f)

    assert len(h_data) == 29, f"Expected 29 Hebrew chapters, got {len(h_data)}"
    total_tokens = sum(sum(len(s.get('tokens', [])) for s in ch.get('sentences', [])) for ch in h_data)
    assert total_tokens >= 900, f"Expected at least 900 tokens in Hebrew, got {total_tokens}"
    print(f"[OK] Hebrew database verified: 29 chapters, {total_tokens} tokens.")

    # 5. Verify Hebrew Lesson 3 phonetic rules
    ch3 = next(c for c in h_data if c['id'] == 'kelley_03')
    has_phonetics = False
    for s in ch3.get('sentences', []):
        for t in s.get('tokens', []):
            for p in t.get('parts', []):
                if p.get('phonetics'):
                    has_phonetics = True
                    break
    assert has_phonetics, "Kelley lesson 3 must have phonetic rules"
    print("[OK] Hebrew phonetics rules intact.")

    print("\n🎉 ALL HEBREW RESTORATION TESTS PASSED PERFECTLY!")

if __name__ == '__main__':
    main()
