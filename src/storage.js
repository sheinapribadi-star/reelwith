const KEY = 'reelwith.v3';

export function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (raw && Array.isArray(raw.rank) && raw.entries) return raw;
  } catch { /* fall through */ }
  return { rank: [], entries: {}, feed: [] };
}

export function saveState(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
