"""
Testes automatizados para Melhorias P3 (A11y, Focus Trap e Editor Visual de Capítulos)
"""
import unittest
import re

class TestP3Improvements(unittest.TestCase):
    def setUp(self):
        with open("index.html", "r", encoding="utf-8") as f:
            self.index_html = f.read()
        with open("js/app.js", "r", encoding="utf-8") as f:
            self.app_js = f.read()
        with open("js/modules/ui.js", "r", encoding="utf-8") as f:
            self.ui_js = f.read()
        with open("js/modules/sentence-analysis.js", "r", encoding="utf-8") as f:
            self.sentence_js = f.read()

    def test_aria_dropdown_attributes(self):
        # 1. Custom chapter selector button & list
        self.assertIn('aria-controls="chapter-dropdown-list"', self.index_html)
        self.assertIn('aria-controls="chapter-dropdown-list"', self.index_html)
        self.assertIn('role="listbox"', self.index_html)
        self.assertIn('aria-label="Lista de Capítulos"', self.index_html)

        # 2. Practice picker button & checklist
        self.assertIn('aria-controls="practice-chapters-dropdown-menu"', self.index_html)
        self.assertIn('aria-label="Lista de Capítulos para Prática"', self.index_html)

        # 3. Dynamic option attributes in ui.js
        self.assertIn('li.setAttribute("role", "option");', self.ui_js)
        self.assertIn('li.setAttribute("aria-selected", isChecked ? "true" : "false");', self.ui_js)
        self.assertIn('btn.setAttribute("aria-expanded", String(isExpanded));', self.ui_js)

    def test_focus_trap_and_restore(self):
        # 1. Sentence analysis focus trap function
        self.assertIn("trapSentenceAnalysisModalFocus", self.sentence_js)
        self.assertIn("_lastFocusedElementBeforeModal", self.sentence_js)

        # 2. Keydown handler intercepting Tab
        self.assertIn('if (e.key === "Tab")', self.sentence_js)
        self.assertIn("trapSentenceAnalysisModalFocus(e)", self.sentence_js)

        # 3. Focus restoration on modal close
        self.assertIn("_lastFocusedElementBeforeModal.focus()", self.sentence_js)

        # 4. Focus on modal open close button
        self.assertIn("closeBtnHebrew.focus()", self.sentence_js)
        self.assertIn("closeBtnGreek.focus()", self.sentence_js)

    def test_chapter_editor_and_management(self):
        # 1. HTML Controls
        self.assertIn("btn-load-current-chapter", self.index_html)
        self.assertIn("btn-delete-custom-chapter", self.index_html)
        self.assertIn("json-schema-feedback", self.index_html)
        self.assertIn("validateChapterJSONInput()", self.index_html)

        # 2. JS Functions in app.js
        self.assertIn("function loadCurrentChapterIntoEditor()", self.app_js)
        self.assertIn("function validateChapterJSONInput()", self.app_js)
        self.assertIn("function deleteCurrentCustomChapter()", self.app_js)

        # 3. Exports in app.js
        self.assertIn("window.loadCurrentChapterIntoEditor = loadCurrentChapterIntoEditor;", self.app_js)
        self.assertIn("window.validateChapterJSONInput = validateChapterJSONInput;", self.app_js)
        self.assertIn("window.deleteCurrentCustomChapter = deleteCurrentCustomChapter;", self.app_js)
        self.assertIn("loadCurrentChapterIntoEditor,", self.app_js)
        self.assertIn("validateChapterJSONInput,", self.app_js)
        self.assertIn("deleteCurrentCustomChapter,", self.app_js)

if __name__ == "__main__":
    unittest.main()

