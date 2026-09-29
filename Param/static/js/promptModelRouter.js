// Automatic model selector — heuristically picks the best already-configured
// model for a given prompt. Pure keyword/length matching, no extra LLM call.

import uiModule from './ui.js';

const AUTO_MODEL_KEY = 'param-auto-model-enabled';

export function isAutoModelEnabled() {
  try { return localStorage.getItem(AUTO_MODEL_KEY) === '1'; } catch (_) { return false; }
}

export function setAutoModelEnabled(on) {
  try { localStorage.setItem(AUTO_MODEL_KEY, on ? '1' : '0'); } catch (_) { /* ignore */ }
}

const CODE_RE = /```|\bfunction\b|\bdef |\bclass \w|stack ?trace|traceback|syntax ?error|typeerror|nullpointerexception|npm err|\bcompile\b|\bbug\b|\bimport \w+ from\b/i;
const REASONING_RE = /step by step|explain in depth|analy[sz]e|compare .* (vs|versus)|why does|prove that|derive|architecture|trade-?off|pros and cons/i;
const VISION_HINT_RE = /\battach(ed|ment)?\b.*(image|photo|screenshot)|\bimage\b|\bphoto\b|\bscreenshot\b/i;

export function classifyPrompt(text, hasImageAttachment = false) {
  const t = String(text || '');
  if (hasImageAttachment || VISION_HINT_RE.test(t)) return 'vision';
  if (CODE_RE.test(t)) return 'code';
  if (REASONING_RE.test(t) || t.length > 600) return 'reasoning';
  if (t.trim().length > 0 && t.trim().length < 40) return 'fast';
  return 'general';
}

const CATEGORY_KEYWORDS = {
  vision: ['vision', '4o', 'gemini', 'llava', 'pixtral', 'claude-3', 'claude-opus-4', 'claude-sonnet', 'gpt-4o'],
  code: ['coder', 'code', 'codestral', 'starcoder', 'deepseek-coder', 'copilot'],
  reasoning: ['o1', 'o3', 'r1', 'reasoning', 'opus', '405b', '70b', 'large', ':pro', '-pro'],
  fast: ['mini', 'haiku', 'flash', '8b', '3b', '1b', 'tiny', 'nano', 'small'],
};

/**
 * flatModels: [{mid, url, endpointId, display, stale, offline}, ...]
 * (same shape modelPicker.js builds from window.modelsModule.getCachedItems())
 */
export function pickBestModel(category, flatModels) {
  const all = Array.isArray(flatModels) ? flatModels : [];
  const usable = all.filter(m => !m.stale && !m.offline);
  const pool = usable.length ? usable : all;
  if (!pool.length) return null;

  const words = CATEGORY_KEYWORDS[category] || [];
  for (const w of words) {
    const hit = pool.find(m => (m.mid || '').toLowerCase().includes(w));
    if (hit) return hit;
  }
  return pool[0];
}

export function flattenAvailableModels() {
  try {
    const items = (window.modelsModule && window.modelsModule.getCachedItems) ? window.modelsModule.getCachedItems() : [];
    const result = [];
    const seen = new Set();
    items.forEach(item => {
      const allModels = (item.models || []).concat(item.models_extra || []);
      const allDisplay = (item.models_display || []).concat(item.models_extra_display || []);
      allModels.forEach((mid, i) => {
        const key = `${item.endpoint_id || item.url || 'ep'}::${mid}`;
        if (seen.has(key)) return;
        seen.add(key);
        result.push({
          mid,
          display: (allDisplay[i] || mid).split('/').pop(),
          url: item.url,
          endpointId: item.endpoint_id,
          stale: !!item.offline,
          offline: !!item.offline,
        });
      });
    });
    return result;
  } catch (_) {
    return [];
  }
}

export function chooseModelForPrompt(text, hasImageAttachment = false) {
  const category = classifyPrompt(text, hasImageAttachment);
  const picked = pickBestModel(category, flattenAvailableModels());
  return picked ? { ...picked, category } : null;
}

let _brainTimer = null;
let _lastBrainTrigger = 0;

export function triggerBrainModelNotification(promptText, hasImageAttachment = false, fallbackModel = '') {
  if (typeof document === 'undefined') return;
  const now = Date.now();
  if (now - _lastBrainTrigger < 800) return;
  _lastBrainTrigger = now;

  const brainBtn = document.getElementById('tool-memory-btn');
  if (brainBtn) {
    brainBtn.classList.remove('brain-selected');
    brainBtn.classList.add('brain-analyzing');
  }

  if (_brainTimer) {
    clearTimeout(_brainTimer);
    _brainTimer = null;
  }

  // Phase 1: Immediate visual feedback that Brain is analyzing prompt
  if (uiModule && typeof uiModule.showToast === 'function') {
    uiModule.showToast('Brain: Analyzing prompt & routing model...', {
      duration: 1800,
      leadingIcon: 'spinner'
    });
  }

  // Phase 2: Announce model chosen according to user prompt
  _brainTimer = setTimeout(() => {
    try {
      const category = classifyPrompt(promptText, hasImageAttachment);
      const categoryTitles = {
        code: 'Code Logic',
        reasoning: 'Deep Reasoning',
        vision: 'Vision Multimodal',
        fast: 'Quick Response',
        general: 'General Tasks'
      };
      const taskName = categoryTitles[category] || 'Reasoning';

      let modelName = '';
      const picked = chooseModelForPrompt(promptText, hasImageAttachment);
      if (picked && (picked.display || picked.mid)) {
        modelName = picked.display || picked.mid.split('/').pop().replace(/:latest$/, '');
      } else if (fallbackModel) {
        modelName = fallbackModel.split('/').pop().replace(/:latest$/, '');
      } else if (window.sessionModule && typeof window.sessionModule.getCurrentModel === 'function') {
        const cur = window.sessionModule.getCurrentModel();
        if (cur) modelName = cur.split('/').pop().replace(/:latest$/, '');
      }
      if (!modelName) modelName = 'Optimal Model';

      if (uiModule && typeof uiModule.showToast === 'function') {
        uiModule.showToast(`Brain: Selected ${modelName} for ${taskName}`, {
          duration: 3800,
          leadingIcon: 'brain'
        });
      }

      if (brainBtn) {
        brainBtn.classList.remove('brain-analyzing');
        brainBtn.classList.add('brain-selected');
        setTimeout(() => {
          brainBtn.classList.remove('brain-selected');
        }, 2200);
      }
    } catch (_) {
      if (brainBtn) brainBtn.classList.remove('brain-analyzing');
    }
  }, 650);
}

if (typeof window !== 'undefined') {
  window._triggerBrainRoutingNotification = triggerBrainModelNotification;
}

