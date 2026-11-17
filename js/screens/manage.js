/*! Gamida — Copyright (c) 2026 Felipe Pereira Medeiros. Todos os direitos reservados. Software proprietário: uso, cópia, modificação e distribuição sujeitos ao arquivo LICENSE. */
/**
 * ==========================================================================
 * Gamida - Gerenciar conteúdo: capítulos e backup
 * ==========================================================================
 * Restaurar o vocabulário original, importar e exportar, e o editor de
 * capítulos em JSON (aberto pelo Perfil).
 * 
 * Script comum (sem módulo), carregado antes do js/app.js: as funções e variáveis
 * daqui são globais e conversam com as do app.js. Ver a tabela de navegação em
 * docs/desenvolvimento.md.
 */

/* ================= DATA MANAGEMENT ================= */
async function resetDefaultChapters() {
  if (!confirm("Deseja restaurar o vocabulário original desta língua? Quaisquer alterações locais serão perdidas.")) {
    return;
  }
  try {
    if (typeof DataLoader.resetChapters === "function") {
      await DataLoader.resetChapters(AppState.language);
    } else if (DataLoader.storage && typeof DataLoader.storage.removeItem === "function") {
      await DataLoader.storage.removeItem(`gamida_${AppState.language}_chapters`);
      await DataLoader.storage.removeItem(`gamida_data_version_${AppState.language}`);
      await DataLoader.storage.removeItem(`gamida_lastChap_${AppState.language}`);
      await DataLoader.storage.removeItem(`gamida_selectedChaps_${AppState.language}`);
      await DataLoader.storage.removeItem(`gamida_chapOrder_${AppState.language}`);
    }
    const defaults = await DataLoader.fetchDefaultChapters(AppState.language);
    AppState.chapters = JSON.parse(JSON.stringify(defaults));
    AppState.selectedChapterIds = [];
    await DataLoader.saveChapters(AppState.language, AppState.chapters);
    buildDistractorCache();
    setupGlobalChapterDropdown();
    switchTab("practice");
    alert("Capítulos padrão restaurados com sucesso!");
  } catch (e) {
    alert("Erro ao carregar capítulos padrão do arquivo JSON: " + e.message);
  }
}

function exportChaptersJSON() {
  const pathModule = typeof window !== "undefined" ? window.MasteryPathModule : null;
  const backupData = {
    version: APP_VERSION,
    language: AppState.language,
    exportedAt: new Date().toISOString(),
    chapters: AppState.chapters,
    srs: AppState.srs,
    mastery: AppState.mastery,
    masteryPath: pathModule ? pathModule.loadCompleted(AppState.language) : [],
    survivalHighScore: AppState.survivalHighScore,
    activity: typeof window !== "undefined" && window.ActivityModule ? window.ActivityModule.exportActivity() : {},
    dailyGoal: typeof window !== "undefined" && window.ActivityModule ? window.ActivityModule.getDailyGoal() : undefined,
    scribe: typeof window !== "undefined" && window.ScribeModule ? window.ScribeModule.loadProgress(AppState.language) : undefined,
  };
  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const fileName =
    AppState.language === "hebrew"
      ? "gamida_hebraico_capitulos.json"
      : "gamida_grego_capitulos.json";
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", url);
  downloadAnchor.setAttribute("download", fileName);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  setTimeout(() => {
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  }, 100);
}


/* ================= EDITOR VISUAL & GERENCIADOR DE CAPÍTULOS ================= */

function loadCurrentChapterIntoEditor() {
  const inputEl = document.getElementById("json-input");
  const statusEl = document.getElementById("json-status");
  if (!inputEl) return;

  if (!AppState.currentChapter) {
    if (statusEl) {
      statusEl.textContent = "⚠️ Nenhum capítulo selecionado atualmente.";
      statusEl.className = "text-xs font-mono text-amber-400";
    }
    return;
  }

  // Clona o capítulo atual omitindo propriedades internas transitórias
  const chapData = JSON.parse(JSON.stringify(AppState.currentChapter));
  delete chapData._userModified;

  inputEl.value = JSON.stringify(chapData, null, 2);
  validateChapterJSONInput();

  if (statusEl) {
    statusEl.textContent = `📝 Capítulo "${chapData.title || chapData.id}" carregado!`;
    statusEl.className = "text-xs font-mono text-brand-400";
  }
}

function validateChapterJSONInput() {
  const inputEl = document.getElementById("json-input");
  const statusEl = document.getElementById("json-status");
  const feedbackEl = document.getElementById("json-schema-feedback");
  if (!inputEl) return;

  const raw = inputEl.value.trim();
  if (!raw) {
    if (statusEl) {
      statusEl.textContent = "Pronto";
      statusEl.className = "text-xs font-mono text-slate-500";
    }
    if (feedbackEl) {
      feedbackEl.classList.add("hidden");
      feedbackEl.innerHTML = "";
    }
    return;
  }

  try {
    const parsed = JSON.parse(raw);

    // 1. Caso seja backup completo estruturado
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && Array.isArray(parsed.chapters)) {
      if (statusEl) {
        statusEl.textContent = "Backup Estruturado";
        statusEl.className = "text-xs font-mono text-indigo-400";
      }
      if (feedbackEl) {
        feedbackEl.className = "px-3.5 py-2.5 rounded-xl border text-xs font-mono flex items-center justify-between gap-2 bg-indigo-950/40 border-indigo-700/50 text-indigo-300";
        feedbackEl.innerHTML = `
          <span>📦 <strong>Backup Completo</strong> (${parsed.chapters.length} capítulos)</span>
          <span class="text-[11px] text-indigo-400 font-sans">Idioma: ${escapeHTML(parsed.language || "Todos")}</span>
        `;
      }
      return;
    }

    // 2. Caso seja array de capítulos
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) {
        throw new Error("O array JSON de capítulos está vazio.");
      }
      const invalidIdx = parsed.findIndex((c) => !isValidChapter(c));
      if (invalidIdx >= 0) {
        throw new Error(`Capítulo na posição [${invalidIdx}] possui schema incompleto ou inválido.`);
      }
      if (statusEl) {
        statusEl.textContent = `${parsed.length} capítulos válidos`;
        statusEl.className = "text-xs font-mono text-emerald-400";
      }
      if (feedbackEl) {
        feedbackEl.className = "px-3.5 py-2.5 rounded-xl border text-xs font-mono flex items-center justify-between gap-2 bg-emerald-950/40 border-emerald-700/50 text-emerald-300";
        feedbackEl.innerHTML = `
          <span>✅ <strong>Coleção Válida</strong> (${parsed.length} capítulos)</span>
          <span class="text-[11px] text-emerald-400 font-sans">IDs únicos confirmados</span>
        `;
      }
      return;
    }

    // 3. Caso seja um único capítulo
    if (parsed && typeof parsed === "object") {
      if (!parsed.id || typeof parsed.id !== "string" || !parsed.id.trim()) {
        throw new Error("Campo obrigatório 'id' ausente ou vazio.");
      }
      if (!parsed.title || typeof parsed.title !== "string" || !parsed.title.trim()) {
        throw new Error("Campo obrigatório 'title' ausente ou vazio.");
      }
      const items = Array.isArray(parsed.items) ? parsed.items : (Array.isArray(parsed.vocabulary) ? parsed.vocabulary : null);
      if (!items && !Array.isArray(parsed.sentences)) {
        throw new Error("O capítulo precisa conter a coleção 'items' (ou 'vocabulary') ou 'sentences'.");
      }
      if (items && items.length > 0) {
        const itemInvalid = items.find((it) => {
          const t = it && (it.hebrew || it.greek || it.term);
          return !t || !Array.isArray(it.translations) || it.translations.length === 0;
        });
        if (itemInvalid) {
          throw new Error("Um ou mais vocábulos não possuem termo principal ou traduções válidas.");
        }
      }

      const totalItems = (items || []).length;
      const totalSents = (parsed.sentences || []).length;

      if (statusEl) {
        statusEl.textContent = "Schema Válido";
        statusEl.className = "text-xs font-mono text-emerald-400";
      }
      if (feedbackEl) {
        feedbackEl.className = "px-3.5 py-2.5 rounded-xl border text-xs font-mono flex items-center justify-between gap-2 bg-emerald-950/40 border-emerald-700/50 text-emerald-300";
        feedbackEl.innerHTML = `
          <span>✅ <strong>${escapeHTML(parsed.title)}</strong> (<code>${escapeHTML(parsed.id)}</code>)</span>
          <span class="text-[11px] text-emerald-400 font-sans">${totalItems} vocábulo(s) • ${totalSents} frase(s)</span>
        `;
      }
      return;
    }

    throw new Error("O formato JSON deve ser um objeto de capítulo, array de capítulos ou backup estruturado.");
  } catch (err) {
    if (statusEl) {
      statusEl.textContent = "Schema Inválido";
      statusEl.className = "text-xs font-mono text-rose-400";
    }
    if (feedbackEl) {
      feedbackEl.className = "px-3.5 py-2.5 rounded-xl border text-xs font-mono flex items-center justify-between gap-2 bg-rose-950/40 border-rose-700/50 text-rose-300";
      feedbackEl.innerHTML = `
        <span>⚠️ <strong>Atenção:</strong></span>
        <span class="text-[11px] text-rose-300 font-sans truncate">${escapeHTML(err.message)}</span>
      `;
    }
  }
}

async function deleteCurrentCustomChapter() {
  if (!AppState.currentChapter) {
    alert("Nenhum capítulo selecionado para exclusão.");
    return;
  }
  if (!AppState.chapters || AppState.chapters.length <= 1) {
    alert("Não é possível excluir o único capítulo restante da coleção.");
    return;
  }

  const target = AppState.currentChapter;
  const isConfirmed = confirm(
    `Deseja realmente excluir o capítulo:\n"${target.title}" (ID: ${target.id})?\nEsta ação removerá o capítulo desta sessão local.`
  );
  if (!isConfirmed) return;

  AppState.chapters = AppState.chapters.filter((c) => c.id !== target.id);
  if (Array.isArray(AppState.selectedChapterIds)) {
    AppState.selectedChapterIds = AppState.selectedChapterIds.filter((id) => id !== target.id);
  }

  saveChaptersToStorage();
  buildDistractorCache();
  setupGlobalChapterDropdown();

  if (AppState.chapters.length > 0) {
    changeGlobalChapter(AppState.chapters[0].id);
  }

  const inputEl = document.getElementById("json-input");
  if (inputEl) inputEl.value = "";
  const statusEl = document.getElementById("json-status");
  if (statusEl) {
    statusEl.textContent = `Capítulo "${target.title}" excluído`;
    statusEl.className = "text-xs font-mono text-amber-400";
  }
  const feedbackEl = document.getElementById("json-schema-feedback");
  if (feedbackEl) {
    feedbackEl.classList.add("hidden");
    feedbackEl.innerHTML = "";
  }
}

function saveChapterFromJSON() {
  const jsonText = document.getElementById("json-input").value.trim();
  const statusEl = document.getElementById("json-status");
  const getPathNote = (added) => (added > 0 ? ` Caminho do domínio: +${added} capítulo(s).` : "");
  if (!jsonText) {
    statusEl.textContent = "⚠️ O campo JSON está vazio.";
    statusEl.className = "text-xs font-mono text-amber-400";
    return;
  }
  try {
    let parsed = JSON.parse(jsonText);
    let pathChaptersAdded = 0;

    // Suporte para backup completo estruturado: { chapters: [...], srs: {...}, survivalHighScore: N, language: "hebrew"|"greek" }
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && Array.isArray(parsed.chapters)) {
      if (parsed.language && parsed.language !== AppState.language) {
        const langTarget = parsed.language === "greek" ? "Grego" : "Hebraico";
        const langCurrent = AppState.language === "greek" ? "Grego" : "Hebraico";
        throw new Error(`Este backup pertence ao idioma '${langTarget}', mas o sistema está atualmente em '${langCurrent}'. Alterne o idioma antes de importar.`);
      }
      if (parsed.srs && typeof parsed.srs === "object") {
        AppState.srs = { ...AppState.srs, ...parsed.srs };
        saveSRS();
      }
      if (parsed.mastery && typeof parsed.mastery === "object") {
        AppState.mastery = { ...AppState.mastery, ...parsed.mastery };
        if (typeof localStorage !== "undefined") {
          try {
            localStorage.setItem(`gamida_${AppState.language}_mastery`, JSON.stringify(AppState.mastery));
          } catch (storageErr) {
            console.warn("Aviso ao salvar domínio no localStorage:", storageErr);
          }
        }
      }
      if (typeof parsed.survivalHighScore === "number" && parsed.survivalHighScore > AppState.survivalHighScore) {
        AppState.survivalHighScore = parsed.survivalHighScore;
        if (typeof localStorage !== "undefined") {
          try {
            localStorage.setItem(`gamida_${AppState.language}_survival_high`, AppState.survivalHighScore);
          } catch (storageErr) {
            console.warn("Aviso ao salvar recorde de sobrevivência no localStorage:", storageErr);
          }
        }
      }
      if (parsed.activity && typeof window !== "undefined" && window.ActivityModule) {
        window.ActivityModule.mergeActivity(parsed.activity);
      }
      if (parsed.scribe && typeof window !== "undefined" && window.ScribeModule) {
        window.ScribeModule.mergeProgress(AppState.language, parsed.scribe);
        window.ScribeModule.updateScribeCardStat();
      }
      if (parsed.dailyGoal !== undefined && typeof window !== "undefined" && window.ActivityModule) {
        window.ActivityModule.adoptDailyGoal(parsed.dailyGoal);
      }
      const pathModule = typeof window !== "undefined" ? window.MasteryPathModule : null;
      if (pathModule && Array.isArray(parsed.masteryPath)) {
        pathChaptersAdded = pathModule.mergeCompleted(AppState.language, parsed.masteryPath);
        pathModule.updatePathDashboardStat();
      }
      // Capítulos padrão não editados seguem a versão atual do app; importá-los os congelaria
      const knownIds = new Set(AppState.chapters.map((c) => c && c.id));
      parsed = parsed.chapters.filter(
        (c) => !c || c._userModified === true || c._custom === true || !knownIds.has(c.id),
      );
      if (parsed.length === 0) {
        if (AppState.currentChapter) changeGlobalChapter(AppState.currentChapter.id);
        statusEl.textContent = `✅ Progresso importado. Os capítulos padrão seguem atualizados.${getPathNote(pathChaptersAdded)}`;
        statusEl.className = "text-xs font-mono text-emerald-400";
        return;
      }
    }

    // Suporte para importação de backup completo com múltiplos capítulos
    if (Array.isArray(parsed)) {
      if (parsed.length === 0) throw new Error("O array JSON está vazio.");
      if (AppState.language === "hebrew" && parsed.every((c) => c && typeof c.id === "string" && c.id.startsWith("bergmann_"))) {
        throw new Error("Estes capítulos pertencem ao curso de Grego (Bergmann). Alterne o idioma para Grego antes de importar.");
      }
      if (AppState.language === "greek" && parsed.every((c) => c && typeof c.id === "string" && c.id.startsWith("kelley_"))) {
        throw new Error("Estes capítulos pertencem ao curso de Hebraico (Kelley). Alterne o idioma para Hebraico antes de importar.");
      }
      if (!parsed.every(isValidChapter)) {
        throw new Error("Um ou mais capítulos no array possuem formato inválido.");
      }
      if (!hasUniqueChapterIds(parsed)) {
        throw new Error("Existem capítulos com IDs duplicados no arquivo informado.");
      }

      const updatedChapters = [...AppState.chapters];
      parsed.forEach((incomingChap) => {
        if (incomingChap && typeof incomingChap === "object") {
          incomingChap._userModified = true;
        }
        const existingIdx = updatedChapters.findIndex((c) => c.id === incomingChap.id);
        if (existingIdx >= 0) {
          updatedChapters[existingIdx] = incomingChap;
        } else {
          updatedChapters.push(incomingChap);
        }
      });

      if (!hasUniqueChapterIds(updatedChapters)) {
        throw new Error("Conflito de IDs únicos com capítulos já existentes.");
      }

      AppState.chapters = updatedChapters;
      saveChaptersToStorage();
      buildDistractorCache();
      setupGlobalChapterDropdown();
      changeGlobalChapter(parsed[0].id);

      statusEl.textContent = `✅ ${parsed.length} capítulo(s) importado(s) com sucesso!${getPathNote(pathChaptersAdded)}`;
      statusEl.className = "text-xs font-mono text-emerald-400";
      return;
    }

    const newChap = parsed;
    if (AppState.language === "hebrew" && newChap && typeof newChap.id === "string" && newChap.id.startsWith("bergmann_")) {
      throw new Error("Este capítulo pertence ao curso de Grego (Bergmann). Alterne o idioma para Grego antes de importar.");
    }
    if (AppState.language === "greek" && newChap && typeof newChap.id === "string" && newChap.id.startsWith("kelley_")) {
      throw new Error("Este capítulo pertence ao curso de Hebraico (Kelley). Alterne o idioma para Hebraico antes de importar.");
    }
    if (!isValidChapter(newChap)) throw new Error("Formato inválido.");
    if (newChap && typeof newChap === "object") {
      newChap._userModified = true;
    }
    const existingIdx = AppState.chapters.findIndex(
      (c) => c.id === newChap.id,
    );
    const updatedChapters = [...AppState.chapters];
    if (existingIdx >= 0) updatedChapters[existingIdx] = newChap;
    else updatedChapters.push(newChap);

    if (!hasUniqueChapterIds(updatedChapters)) {
      throw new Error("Já existe um capítulo com este ID.");
    }

    AppState.chapters = updatedChapters;

    saveChaptersToStorage();
    buildDistractorCache();
    setupGlobalChapterDropdown();
    changeGlobalChapter(newChap.id);

    statusEl.textContent = "✅ Salvo com sucesso!";
    statusEl.className = "text-xs font-mono text-emerald-400";
  } catch (err) {
    statusEl.textContent = `❌ Erro: ${err.message}`;
    statusEl.className = "text-xs font-mono text-rose-400";
  }
}
