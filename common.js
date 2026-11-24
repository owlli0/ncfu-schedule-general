const WORKER_BASE = 'https://morning-cloud-895b.balavensydbu.workers.dev';
const WORKER_PROXY_URL = `${WORKER_BASE}/?url=`;

const MEMORY_CACHE = {};
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

function getCache(key, ignoreExpiry = false) {
  if (MEMORY_CACHE[key]) {
    if (!MEMORY_CACHE[key].isExpired || ignoreExpiry) {
      return MEMORY_CACHE[key].data;
    }
  }
  try {
    const stored = localStorage.getItem('cache_' + key);
    if (stored) {
      const parsed = JSON.parse(stored);
      const age = Date.now() - (parsed.ts || 0);
      const isExpired = age >= CACHE_TTL_MS;
      MEMORY_CACHE[key] = { data: parsed.data, isExpired, ts: parsed.ts };
      if (!isExpired || ignoreExpiry) return parsed.data;
    }
  } catch (e) {}
  return null;
}

function getCacheInfo(key) {
  try {
    const stored = localStorage.getItem('cache_' + key);
    if (stored) {
      const parsed = JSON.parse(stored);
      const age = Date.now() - (parsed.ts || 0);
      return { exists: true, isExpired: age >= CACHE_TTL_MS, date: new Date(parsed.ts) };
    }
  } catch (e) {}
  return { exists: false, isExpired: true, date: null };
}

function setCache(key, data) {
  if (!data || (Array.isArray(data) && data.length === 0)) return;
  MEMORY_CACHE[key] = { data: data, isExpired: false, ts: Date.now() };
  try {
    localStorage.setItem('cache_' + key, JSON.stringify({ ts: Date.now(), data }));
  } catch (e) {}
}

let toastTimer = null;
function showToast(text) {
  const el = document.getElementById('toastNotice');
  if (!el) return;
  el.innerText = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
}

// ========================================================
// УПРАВЛЕНИЕ ТЕМОЙ (ЕДИНОЕ ДЛЯ ВСЕХ СТРАНИЦ)
// ========================================================
const THEME_PRESETS = {
  dark: {
    '--bg': '#0b0f19',
    '--card-bg': '#151d30',
    '--text': '#f1f5f9',
    '--text-muted': '#94a3b8',
    '--border': 'rgba(255, 255, 255, 0.08)',
    '--accent': '#38bdf8',
    '--lecture-bg': 'rgba(16, 185, 129, 0.15)',
    '--lecture-border': 'rgba(16, 185, 129, 0.45)',
    '--lecture-badge': '#10b981',
    '--practice-bg': 'rgba(245, 158, 11, 0.15)',
    '--practice-border': 'rgba(245, 158, 11, 0.45)',
    '--practice-badge': '#f59e0b'
  },
  light: {
    '--bg': '#f8fafc',
    '--card-bg': '#ffffff',
    '--text': '#0f172a',
    '--text-muted': '#64748b',
    '--border': 'rgba(0, 0, 0, 0.08)',
    '--accent': '#0284c7',
    '--lecture-bg': 'rgba(16, 185, 129, 0.12)',
    '--lecture-border': 'rgba(16, 185, 129, 0.4)',
    '--lecture-badge': '#10b981',
    '--practice-bg': 'rgba(245, 158, 11, 0.12)',
    '--practice-border': 'rgba(245, 158, 11, 0.4)',
    '--practice-badge': '#f59e0b'
  },
  oled: {
    '--bg': '#000000',
    '--card-bg': '#0f0f11',
    '--text': '#ffffff',
    '--text-muted': '#a1a1aa',
    '--border': 'rgba(255, 255, 255, 0.12)',
    '--accent': '#38bdf8',
    '--lecture-bg': 'rgba(16, 185, 129, 0.15)',
    '--lecture-border': 'rgba(16, 185, 129, 0.5)',
    '--lecture-badge': '#10b981',
    '--practice-bg': 'rgba(245, 158, 11, 0.15)',
    '--practice-border': 'rgba(245, 158, 11, 0.5)',
    '--practice-badge': '#f59e0b'
  }
};

let userTheme = JSON.parse(localStorage.getItem('customUserTheme')) || THEME_PRESETS.dark;

function applyCurrentTheme() {
  Object.keys(userTheme).forEach(prop => {
    document.documentElement.style.setProperty(prop, userTheme[prop]);
  });
  syncThemePickers();
}

function syncThemePickers() {
  const getHex = (v) => v && v.startsWith('#') ? v : '#38bdf8';
  if (document.getElementById('picker-bg')) {
    document.getElementById('picker-bg').value = getHex(userTheme['--bg'] || '#0b0f19');
    document.getElementById('picker-card').value = getHex(userTheme['--card-bg'] || '#151d30');
    document.getElementById('picker-accent').value = getHex(userTheme['--accent'] || '#38bdf8');
    document.getElementById('picker-lecture').value = getHex(userTheme['--lecture-badge'] || '#10b981');
    document.getElementById('picker-practice').value = getHex(userTheme['--practice-badge'] || '#f59e0b');
    document.getElementById('picker-text').value = getHex(userTheme['--text'] || '#f1f5f9');
  }
}

function applyPreset(name) {
  userTheme = { ...THEME_PRESETS[name] };
  localStorage.setItem('customUserTheme', JSON.stringify(userTheme));
  applyCurrentTheme();
}

function onCustomColorChange(variableName, hexValue) {
  userTheme[variableName] = hexValue;
  document.documentElement.style.setProperty(variableName, hexValue);
  localStorage.setItem('customUserTheme', JSON.stringify(userTheme));
}

function onCustomLectureChange(hexValue) {
  userTheme['--lecture-badge'] = hexValue;
  userTheme['--lecture-bg'] = hexValue + '22';
  userTheme['--lecture-border'] = hexValue + '77';
  document.documentElement.style.setProperty('--lecture-badge', hexValue);
  document.documentElement.style.setProperty('--lecture-bg', hexValue + '22');
  document.documentElement.style.setProperty('--lecture-border', hexValue + '77');
  localStorage.setItem('customUserTheme', JSON.stringify(userTheme));
}

function onCustomPracticeChange(hexValue) {
  userTheme['--practice-badge'] = hexValue;
  userTheme['--practice-bg'] = hexValue + '22';
  userTheme['--practice-border'] = hexValue + '77';
  document.documentElement.style.setProperty('--practice-badge', hexValue);
  document.documentElement.style.setProperty('--practice-bg', hexValue + '22');
  document.documentElement.style.setProperty('--practice-border', hexValue + '77');
  localStorage.setItem('customUserTheme', JSON.stringify(userTheme));
}

function openThemeModal() {
  const m = document.getElementById('themeModal');
  if (m) {
    m.style.display = 'flex';
    syncThemePickers();
  }
}

function closeThemeModal() {
  const m = document.getElementById('themeModal');
  if (m) m.style.display = 'none';
}

// Сразу применяем тему до отрисовки элементов (чтобы не мигал экран)
applyCurrentTheme();

window.addEventListener('online', () => {
  const s = document.getElementById('statusText');
  if (s) s.innerText = 'В сети';
});
window.addEventListener('offline', () => {
  const s = document.getElementById('statusText');
  if (s) s.innerText = 'Офлайн (сохранено)';
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch((err) => {
      console.error('Ошибка регистрации Service Worker:', err);
    });
  });
}
