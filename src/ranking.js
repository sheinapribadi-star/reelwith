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

/**
 * Blended ranking inspired by Netflix's approach (Amatriain & Basilico, 2012).
 * Combines personal preference (inferred from ranked titles) with popularity.
 * Popularity alone is a strong baseline but not personalized; predicted preference
 * alone can surface overly niche titles. A blend beats pure popularity and provides
 * a balance of familiar hits and personalized taste.
 */
export function recommendFromRank(rankIds, entriesById, catalog, limit = 8) {
  const n = rankIds.length;

  // Build set of already-ranked movie IDs
  const seenMovieIds = new Set(
    rankIds.map((id) => entriesById[id]?.movieId).filter(Boolean)
  );

  if (!n) {
    return catalog.filter((m) => !seenMovieIds.has(m.id)).slice(0, limit).map((m) => ({
      movie: m,
      reason: 'Start ranking to personalize',
    }));
  }

  // 1. Infer personal preference from ranked titles (genre affinity + positional weight)
  const genreScore = {};
  const likedTitles = [];
  rankIds.slice(0, Math.min(10, n)).forEach((id, i) => {
    const e = entriesById[id];
    const g = e?.genre || catalog.find((m) => m.id === id)?.genre;
    if (!g) return;
    const weight = 10 - i;
    genreScore[g] = (genreScore[g] || 0) + weight;
    if (e?.vibe === 'liked' && i < 5) {
      likedTitles.push({ title: e.title, genre: g });
    }
  });

  // 2. Normalize popularity to 0-1 range for blending
  const maxPop = Math.max(...catalog.map((m) => m.popularity || 0));
  const minPop = Math.min(...catalog.map((m) => m.popularity || 0));
  const popRange = maxPop - minPop || 1;

  // 3. Score each unseen movie with a blend of preference + popularity
  const picks = catalog
    .filter((m) => !seenMovieIds.has(m.id))
    .map((m) => {
      const prefScore = genreScore[m.genre] || 0;
      const normPop = ((m.popularity || 0) - minPop) / popRange;
      // Blend: 60% personal preference, 40% popularity
      // This weights personalization higher but keeps popular titles visible
      const blendedScore = 0.6 * (prefScore / 10) + 0.4 * normPop;

      // Generate transparent explanation based on scoring factors
      let reason = '';
      let explainSource = null;
      if (prefScore > 0) {
        const anchorTitle = likedTitles.find((t) => t.genre === m.genre);
        if (anchorTitle) {
          reason = `You liked ${anchorTitle.title}`;
          explainSource = 'liked-title';
        } else {
          reason = `Fits your ${m.genre.toLowerCase()} taste`;
          explainSource = 'genre-affinity';
        }
      } else if (normPop > 0.7) {
        reason = 'Popular pick';
        explainSource = 'popularity';
      } else {
        reason = 'Fresh pick';
        explainSource = 'fallback';
      }

      return {
        movie: m,
        score: blendedScore,
        prefScore,
        popScore: normPop,
        reason,
        explainSource,
      };
    })
    .sort((a, b) => b.score - a.score || b.movie.year - a.movie.year);

  return picks.slice(0, limit);
}
