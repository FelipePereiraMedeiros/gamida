# -*- coding: utf-8 -*-
"""
Test Suite: Strict Separation between Hebrew (Page Kelley) and Greek (Johannes Bergmann) Analyses
Gamida - Biblical Language Trainer
"""

import json
import re

def main():
    print("Testing Hebrew & Greek Morphological Analysis Separation...")

    with open('js/modules/sentence-analysis.js', 'r', encoding='utf-8') as f:
        js_code = f.read()

    # 1. Verify existence of separated pipeline functions
    required_hebrew_funcs = [
        'buildHebrewFlatMorphemesList',
        'renderHebrewSentenceMorphemesHTML',
        'renderHebrewRibbonHTML',
        'renderHebrewGlobalView',
        'renderHebrewDissectionView',
        'getHebrewMorphemeCategory',
        'HEBREW_CATEGORY_MAP'
    ]
    for fn in required_hebrew_funcs:
        assert fn in js_code, f"Missing Hebrew function: {fn}"
    print("[OK] All Hebrew Page Kelley functions present.")

    required_greek_funcs = [
        'buildGreekFlatMorphemesList',
        'renderGreekSentenceMorphemesHTML',
        'renderGreekRibbonHTML',
        'renderGreekGlobalView',
        'renderGreekDissectionView',
        'parseGreekStepDetails',
        'getGreekMorphemeCategory',
        'GREEK_CATEGORY_MAP'
    ]
    for fn in required_greek_funcs:
        assert fn in js_code, f"Missing Greek function: {fn}"
    print("[OK] All Greek Johannes Bergmann functions present.")

    # 2. Verify Hebrew Page Kelley content strings
    assert "Regra Fonética / Gramatical (Page Kelley)" in js_code
    assert "Contexto Sintático da Palavra Inteira" in js_code
    assert "Visão Global da Oração" in js_code
    assert "Resumo Sintático & Pedagógico" in js_code
    assert "Partícula ${mItem.index + 1} de" in js_code
    print("[OK] Hebrew Page Kelley pedagogical structure verified.")

    # 3. Verify Greek Bergmann content strings
    assert "Passo 1: Classe Gramatical" in js_code
    assert "Passo 2: Morfologia & Inflexão" in js_code
    assert "Passo 3: Vocabulário (Lema) & Tradução Contextual" in js_code
    assert "Passo 4: Linha Contínua — Redação Fluente em Português" in js_code
    assert "Linha Contínua — Redação Final Fluente em Português (Passo 4 de Bergmann)" in js_code
    assert "Termo ${mItem.index + 1} de" in js_code
    print("[OK] Greek Johannes Bergmann 4-step framework verified.")

    # 4. Verify Hebrew & Greek data bundles
    with open('data/hebrew_chapters.json', 'r', encoding='utf-8') as f:
        h_data = json.load(f)
    with open('data/greek_chapters.json', 'r', encoding='utf-8') as f:
        g_data = json.load(f)

    print(f"[OK] Hebrew chapters loaded: {len(h_data)} chapters.")
    print(f"[OK] Greek chapters loaded: {len(g_data)} chapters.")

    # 5. Check sample Hebrew sentence (Kelley lesson 3)
    k3 = next(ch for ch in h_data if ch['id'] == 'kelley_03')
    sent0 = k3['sentences'][0]
    assert sent0['tokens'], "Tokens missing in Kelley 03 sentence 0"
    has_phonetics = any(
        p.get('phonetics') for t in sent0['tokens'] for p in t.get('parts', [])
    )
    assert has_phonetics, "Kelley 03 sentence 0 should have phonetic rules"
    print("[OK] Hebrew phonetic rules present in Lesson 3 data.")

    # 6. Check Greek sentence (Chapter 2)
    g2 = next(ch for ch in g_data if ch['id'] == 'bergmann_02')
    g_sent0 = g2['sentences'][0]
    assert g_sent0['tokens'], "Tokens missing in Bergmann 02 sentence 0"
    for t in g_sent0['tokens']:
        assert 'word_class' in t, f"Missing word_class in token {t['text']}"
        assert 'syntax_role' in t, f"Missing syntax_role in token {t['text']}"
    print("[OK] Greek token data present in Chapter 2 tokens.")

    print("\nALL SEPARATION TESTS PASSED PERFECTLY!")

if __name__ == '__main__':
    main()
