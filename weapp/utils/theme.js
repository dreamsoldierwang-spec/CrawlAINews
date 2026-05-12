const THEME_KEY = 'app_theme_mode';
const THEMES = ['day', 'night', 'eye'];

const iconMap = { day: '☀️', night: '🌙', eye: '👁️' };
const labelMap = { day: '白天', night: '夜晚', eye: '护眼' };

let currentTheme = 'day';
let listeners = [];

function loadTheme() {
  try {
    const saved = wx.getStorageSync(THEME_KEY);
    if (saved && THEMES.includes(saved)) {
      currentTheme = saved;
    }
  } catch (e) {
    console.error('Load theme failed', e);
  }
  return currentTheme;
}

function saveTheme(mode) {
  if (!THEMES.includes(mode)) return;
  currentTheme = mode;
  try {
    wx.setStorageSync(THEME_KEY, mode);
  } catch (e) {
    console.error('Save theme failed', e);
  }
  notifyListeners();
}

function getNextTheme() {
  const currentIndex = THEMES.indexOf(currentTheme);
  const nextIndex = (currentIndex + 1) % THEMES.length;
  return THEMES[nextIndex];
}

function getThemeInfo(mode) {
  const m = mode || currentTheme;
  return {
    mode: m,
    icon: iconMap[m] || '☀️',
    label: labelMap[m] || '白天',
  };
}

function subscribe(callback) {
  if (typeof callback === 'function') {
    listeners.push(callback);
  }
  return () => {
    listeners = listeners.filter(fn => fn !== callback);
  };
}

function notifyListeners() {
  const info = getThemeInfo();
  listeners.forEach(fn => {
    try {
      fn(info);
    } catch (e) {
      console.error('Theme listener error', e);
    }
  });
}

module.exports = {
  THEMES,
  loadTheme,
  saveTheme,
  getNextTheme,
  getThemeInfo,
  subscribe,
};
