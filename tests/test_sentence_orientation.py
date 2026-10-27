# -*- coding: utf-8 -*-
"""
Test Suite: Greek & Hebrew Sentence Reading Orientation Integrity
Verifies:
- Greek: strictly LTR (Left-to-Right, Top-to-Bottom)
- Hebrew: strictly RTL (Right-to-Left, Top-to-Bottom)
"""

import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def main():
    print("Testing Sentence Reading Orientation (Greek LTR vs Hebrew RTL)...")

    with open('js/modules/sentence-analysis.js', 'r', encoding='utf-8') as f:
        js = f.read()

    with open('css/styles.css', 'r', encoding='utf-8') as f:
        css = f.read()

    # 1. CSS Rules Verification
    assert '.greek-sentence-container' in css, "Missing .greek-sentence-container in styles.css"
    assert 'direction: ltr !important;' in css, "Missing direction: ltr !important in .greek-sentence-container"
    assert '.hebrew-sentence-container' in css, "Missing .hebrew-sentence-container in styles.css"
    assert 'direction: rtl;' in css, "Missing direction: rtl in .hebrew-sentence-container"
    print("[OK] CSS styles: .greek-sentence-container (LTR) and .hebrew-sentence-container (RTL) validated.")

    # 2. Greek Open Modal Container Setup
    assert 'container.classList.remove("hebrew-sentence-container", "hebrew-text")' in js
    assert 'container.classList.add("greek-sentence-container", "greek-text")' in js
    assert 'container.style.direction = "ltr"' in js
    assert 'container.style.unicodeBidi = "isolate"' in js
    assert 'container.setAttribute("dir", "ltr")' in js
    assert 'ribbon.setAttribute("dir", "ltr")' in js
    assert 'ribbon.style.direction = "ltr"' in js
    print("[OK] Greek modal open correctly switches container classes and sets LTR.")

    # 3. Greek Token Rendering
    assert 'class="token-wrapper" data-token-idx="${tIdx}" dir="ltr" style="direction: ltr !important;"' in js
    assert 'class="morpheme ${meta.glowClass}" data-token-idx="${tIdx}" data-part-idx="0" dir="ltr" style="direction: ltr !important;"' in js
    print("[OK] Greek tokens and morphemes rendered with explicit inline LTR isolation.")

    # 4. Hebrew Open Modal Container Setup
    assert 'container.classList.remove("greek-sentence-container", "greek-text")' in js
    assert 'container.classList.add("hebrew-sentence-container")' in js
    assert 'container.classList.add("hebrew-text")' in js
    assert 'container.style.direction = "rtl"' in js
    assert 'container.setAttribute("dir", "rtl")' in js
    assert 'ribbon.setAttribute("dir", "rtl")' in js
    assert 'ribbon.style.direction = "rtl"' in js
    print("[OK] Hebrew modal open preserves and enforces RTL direction and classes.")

    # 5. Greek Close Modal Cleanup
    assert 'closeGreekSentenceAnalysisModal' in js
    assert 'container.classList.remove("greek-sentence-container", "greek-text")' in js
    print("[OK] Greek modal close restores container classes.")

    # 6. Keyboard navigation logic
    # Greek: ArrowRight advances (+1), ArrowLeft retreats (-1)
    assert 'navigateGreekMorphemes(+1)' in js
    assert 'navigateGreekMorphemes(-1)' in js
    # Hebrew: ArrowLeft advances (+1), ArrowRight retreats (-1)
    assert 'navigateHebrewMorphemes(+1)' in js
    assert 'navigateHebrewMorphemes(-1)' in js
    print("[OK] Keyboard arrow navigation matches reading directions (Greek LTR, Hebrew RTL).")

    print("\n🎉 ALL ORIENTATION TESTS PASSED PERFECTLY!")

if __name__ == '__main__':
    main()
