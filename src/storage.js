const KEY = 'reelwith.entries.v2';

export function loadEntries() {
  try {
    const v2 = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (Array.isArray(v2)) return v2;
    // migrate old split stores if present
    const moments = JSON.parse(localStorage.getItem('reelwith.moments.v1') || '[]');
    const logs = JSON.parse(localStorage.getItem('reelwith.logs.v1') || '[]');
    if (!moments.length && !logs.length) return [];
    const merged = [];
    logs.forEach((l) => {
      merged.push({
        id: l.id,
        movieId: l.movieId,
        liked: l.vibe === 'loved' || l.vibe === 'fine' || l.liked === true,
        note: l.review || l.note || '',
        withWho: l.withWho || '',
        who: 'You',
        photo: null,
        when: l.when || Date.now(),
        sample: false,
      });
    });
    return merged;
  } catch {
    return [];
  }
}

export function saveEntries(list) {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}
