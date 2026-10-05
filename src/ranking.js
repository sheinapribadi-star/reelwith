/** Soft vibes + head-to-head insertion (Beli-style mechanics, no brand copy). */

export const VIBE = { liked: 'liked', mid: 'mid', dislike: 'dislike' };

export function vibeLabel(v) {
  return { liked: 'Liked', mid: 'Mid', dislike: 'Dislike' }[v] || v;
}

/** Score 1–10 from rank index (0 = best). */
export function scoreFromRank(index, n, vibe) {
  if (n <= 1) {
    return { liked: 8.6, mid: 6.1, dislike: 3.2 }[vibe] || 5;
  }
  const t = index / (n - 1);
  const raw = 9.7 - t * 8.2;
  return Math.round(raw * 10) / 10;
}

/**
 * Binary-search insertion plan.
 * Returns { done: true, index } or { done: false, compareId, lo, hi }.
 */
export function nextCompare(rankIds, lo, hi) {
  if (lo >= hi) return { done: true, index: lo };
  const mid = Math.floor((lo + hi) / 2);
  return { done: false, compareId: rankIds[mid], mid, lo, hi };
}

/** Prefer-new=true means insert before mid (higher rank). */
export function afterCompare(preferNew, mid, lo, hi) {
  if (preferNew) return { lo, hi: mid };
  return { lo: mid + 1, hi };
}

/** Seed insertion bounds by vibe band within existing entries. */
export function bandBounds(rankIds, entriesById, vibe) {
  const n = rankIds.length;
  if (!n) return { lo: 0, hi: 0 };
  const vibes = rankIds.map((id) => entriesById[id]?.vibe || 'mid');
  if (vibe === 'liked') {
    let hi = 0;
    while (hi < n && vibes[hi] === 'liked') hi += 1;
    return { lo: 0, hi };
  }
  if (vibe === 'dislike') {
    let lo = n;
    while (lo > 0 && vibes[lo - 1] === 'dislike') lo -= 1;
    return { lo, hi: n };
  }
  // mid: between liked block and dislike block
  let lo = 0;
  while (lo < n && vibes[lo] === 'liked') lo += 1;
  let hi = n;
  while (hi > lo && vibes[hi - 1] === 'dislike') hi -= 1;
  return { lo, hi };
}

export function recommendFromRank(rankIds, entriesById, catalog, limit = 8) {
  const seen = new Set(rankIds);
  const genreScore = {};
  rankIds.slice(0, Math.min(8, rankIds.length)).forEach((id, i) => {
    const e = entriesById[id];
    const g = e?.genre || catalog.find((m) => m.id === id)?.genre;
    if (!g) return;
    genreScore[g] = (genreScore[g] || 0) + (8 - i);
  });
  const picks = catalog
    .filter((m) => !seen.has(m.id))
    .map((m) => ({
      movie: m,
      score: genreScore[m.genre] || 0,
      reason: genreScore[m.genre]
        ? `Fits your ${m.genre.toLowerCase()} ranking`
        : 'Fresh pick',
    }))
    .sort((a, b) => b.score - a.score || b.movie.year - a.movie.year);
  if (!Object.keys(genreScore).length) {
    return catalog.filter((m) => !seen.has(m.id)).slice(0, limit).map((m) => ({
      movie: m,
      reason: 'Start ranking to personalize',
    }));
  }
  return picks.slice(0, limit);
}
