import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/600.css';
import '@fontsource/playfair-display/400-italic.css';
import './style.css';

import { CATALOG, searchMovies, findMovie, SAMPLE_MOMENTS } from './catalog.js';
import { loadMoments, saveMoments, loadLogs, saveLogs, uid } from './storage.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const ONBOARD_KEY = 'reelwith.onboarded.v1';
const WANT_KEY = 'reelwith.want.v1';

let moments = loadMoments();
let logs = loadLogs();
let want = (() => { try { return JSON.parse(localStorage.getItem(WANT_KEY) || '[]'); } catch { return []; } })();
let selectedMovie = null;
let vibe = null; // loved | fine | nah
let derivedScore = null;
let stream = null;
let snapDataUrl = null;

function saveWant() { localStorage.setItem(WANT_KEY, JSON.stringify(want)); }

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.hidden = true; }, 2600);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function timeAgo(ts) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/** Beli-ish: soft ternary → personal score with light jitter so it feels calibrated. */
function scoreFromVibe(v, title) {
  const base = { loved: 8.4, fine: 6.2, nah: 3.6 }[v];
  const jitter = ((title.length * 13) % 7) / 10; // 0.0–0.6 deterministic
  const s = Math.min(9.9, Math.max(1.0, base + (v === 'nah' ? -jitter : jitter)));
  return Math.round(s * 10) / 10;
}

/* Onboarding */
const SLIDES = [
  { emoji: '🎟️', title: 'Rate like Beli', body: 'Loved / fine / didn’t like — we turn that into your score. No forced invite wall.' },
  { emoji: '📸', title: 'Moments like BeReal', body: 'Snap what you’re watching and who’s with you. Authenticity > perfect poster stills.' },
  { emoji: '🌙', title: 'A warmer Letterboxd', body: 'Diary for you, feed for friends. Film + feeling + company.' },
];
let obIndex = 0;

function showOnboarding() {
  $('#onboard').hidden = false;
  $('#shell').hidden = true;
  renderOb();
}
function finishOnboarding() {
  localStorage.setItem(ONBOARD_KEY, '1');
  $('#onboard').hidden = true;
  $('#shell').hidden = false;
  bootUI();
}
function renderOb() {
  const s = SLIDES[obIndex];
  $('#ob-progress').innerHTML = SLIDES.map((_, i) => `<span class="${i <= obIndex ? 'on' : ''}"></span>`).join('');
  $('#ob-slides').innerHTML = `<div class="ob-emoji">${s.emoji}</div><h2>${s.title}</h2><p>${s.body}</p>`;
  $('#ob-next').textContent = obIndex === SLIDES.length - 1 ? 'Enter the lobby' : 'Continue';
}

function setView(name) {
  $$('.tab').forEach((t) => t.classList.toggle('on', t.dataset.view === name));
  $$('.view').forEach((v) => {
    const on = v.id === `view-${name}`;
    v.classList.toggle('on', on);
    v.hidden = !on;
  });
  if (name === 'diary') renderDiary();
  if (name === 'feed') renderFeed();
  if (name === 'log') { renderSearch($('#movie-search').value); renderWant(); }
}

function renderPosters() {
  const picks = [CATALOG[2], CATALOG[3], CATALOG[10]];
  $('#poster-stack').innerHTML = picks.map((m) =>
    `<div class="p" style="background:linear-gradient(160deg,${m.color},#111)">${escapeHtml(m.title)}</div>`
  ).join('');
}

function renderFeed() {
  const list = [...moments].sort((a, b) => b.when - a.when);
  const feed = $('#moment-feed');
  if (!list.length) {
    feed.innerHTML = `
      <div class="card empty">
        <div class="illus">🎬</div>
        <h3>Lobby’s quiet</h3>
        <p>Drop a watch moment, or load sample friends to feel the social loop.</p>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">
          <button class="btn primary" type="button" data-go="moment">Capture moment</button>
          <button class="btn ghost" type="button" id="empty-seed">Sample friends</button>
        </div>
      </div>`;
    feed.querySelector('[data-go]')?.addEventListener('click', () => setView('moment'));
    feed.querySelector('#empty-seed')?.addEventListener('click', seedFeed);
    return;
  }
  feed.innerHTML = list.map((m) => `
    <article class="card moment">
      <div class="moment-photo" style="background-image:url('${m.photo}')">
        <span class="badge-live">${escapeHtml(m.vibe || 'watching')}</span>
      </div>
      <div class="moment-body">
        <div class="meta">${escapeHtml(m.who || 'You')} · ${timeAgo(m.when)}${m.sample ? ' · friend' : ''}</div>
        <h3>${escapeHtml(m.movieTitle)}</h3>
        <span class="crew">with ${escapeHtml(m.crew)}</span>
        ${m.caption ? `<p class="caption">${escapeHtml(m.caption)}</p>` : ''}
      </div>
    </article>
  `).join('');
}

function seedFeed() {
  const existing = new Set(moments.map((m) => m.id));
  const extras = SAMPLE_MOMENTS.filter((m) => !existing.has(m.id)).map((m) => ({ ...m, sample: true }));
  moments = [...extras, ...moments];
  saveMoments(moments);
  renderFeed();
  toast('Friends rolled in');
}

function renderSearch(q) {
  const results = searchMovies(q || '');
  $('#search-results').innerHTML = results.map((m) => `
    <button type="button" class="movie-row ${selectedMovie?.id === m.id ? 'on' : ''}" data-pick="${m.id}">
      <div class="thumb" style="background:${m.color}">${m.short}</div>
      <div>
        <strong>${escapeHtml(m.title)}</strong>
        <span>${m.year} · ${escapeHtml(m.genre)}</span>
      </div>
      <button type="button" class="btn ghost sm" data-want="${m.id}" title="Want to watch">+</button>
    </button>
  `).join('');
}

function pickMovie(id) {
  selectedMovie = CATALOG.find((m) => m.id === id);
  if (!selectedMovie) return;
  vibe = null;
  derivedScore = null;
  $$('.vibe').forEach((b) => b.classList.remove('on'));
  $('#score-reveal').hidden = true;
  $('#log-form').hidden = false;
  $('#picked').innerHTML = `
    <div class="thumb" style="background:${selectedMovie.color}">${selectedMovie.short}</div>
    <div><strong>${escapeHtml(selectedMovie.title)}</strong><div class="meta">${selectedMovie.year} · ${escapeHtml(selectedMovie.genre)}</div></div>
  `;
  renderSearch($('#movie-search').value);
}

function setVibe(v) {
  vibe = v;
  $$('.vibe').forEach((b) => b.classList.toggle('on', b.dataset.vibe === v));
  if (!selectedMovie) return;
  derivedScore = scoreFromVibe(v, selectedMovie.title);
  const el = $('#score-reveal');
  el.hidden = false;
  el.textContent = `Your score lands at ${derivedScore} / 10`;
}

function renderWant() {
  const box = $('#want-list');
  if (!want.length) {
    box.innerHTML = `<p class="fine" style="margin:0">Tap + on a title to stash a want-to-watch.</p>`;
    return;
  }
  box.innerHTML = want.map((w) => `
    <div class="want-row">
      <span>${escapeHtml(w.title)} <span class="meta">(${w.year})</span></span>
      <button class="btn ghost sm" type="button" data-unwant="${w.id}">Remove</button>
    </div>
  `).join('');
}

function renderDiary() {
  const list = [...logs].sort((a, b) => b.when - a.when);
  const avg = list.length ? (list.reduce((s, x) => s + x.score, 0) / list.length).toFixed(1) : '—';
  $('#diary-stats').innerHTML = `
    <div class="stat"><strong>${list.length}</strong> logged</div>
    <div class="stat">avg <strong>${avg}</strong></div>
    <div class="stat"><strong>${moments.filter((m) => !m.sample).length}</strong> moments</div>
  `;
  const box = $('#diary-list');
  if (!list.length) {
    box.innerHTML = `
      <div class="card empty">
        <div class="illus">📓</div>
        <h3>Diary is blank</h3>
        <p>Rate something with Loved / Fine / Nah — your score appears like Beli magic.</p>
        <button class="btn primary" type="button" data-go="log">Rate a film</button>
      </div>`;
    box.querySelector('[data-go]')?.addEventListener('click', () => setView('log'));
    return;
  }
  box.innerHTML = list.map((l) => `
    <article class="card diary-item">
      <div class="thumb" style="background:${l.color || '#333'}">${escapeHtml(l.short || '•')}</div>
      <div>
        <strong>${escapeHtml(l.title)}</strong>
        <div class="meta">${l.vibeLabel || ''} ${l.withWho ? `· with ${escapeHtml(l.withWho)}` : ''} ${l.rewatch ? '· rewatch' : ''}</div>
        ${l.review ? `<div class="caption">${escapeHtml(l.review)}</div>` : ''}
      </div>
      <div class="score-pill">${l.score}</div>
    </article>
  `).join('');
}

function fillDatalist() {
  $('#movie-list').innerHTML = CATALOG.map((m) => `<option value="${escapeHtml(m.title)}"></option>`).join('');
}

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
    const video = $('#cam');
    video.srcObject = stream;
    video.hidden = false;
    await video.play();
    $('#vf-ph').hidden = true;
    $('#snap-preview').hidden = true;
    $('#take-snap').disabled = false;
  } catch (err) {
    $('#vf-ph').innerHTML = `<p>Camera blocked (${escapeHtml(err.message)}). Upload a still — still counts.</p>`;
  }
}

function takeSnap() {
  const video = $('#cam');
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 720;
  canvas.height = video.videoHeight || 960;
  canvas.getContext('2d').drawImage(video, 0, 0);
  snapDataUrl = canvas.toDataURL('image/jpeg', 0.85);
  const img = $('#snap-preview');
  img.src = snapDataUrl;
  img.hidden = false;
  video.hidden = true;
  $('#pip').hidden = false;
  stopCam();
}

function stopCam() {
  if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; }
}

function useUpload(file) {
  const reader = new FileReader();
  reader.onload = () => {
    snapDataUrl = reader.result;
    const img = $('#snap-preview');
    img.src = snapDataUrl;
    img.hidden = false;
    $('#cam').hidden = true;
    $('#vf-ph').hidden = true;
    $('#pip').hidden = false;
    stopCam();
  };
  reader.readAsDataURL(file);
}

function defaultSnap(title) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='520'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
      <stop stop-color='#1a1a28'/><stop offset='1' stop-color='#3a2a18'/>
    </linearGradient></defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <text x='50%' y='48%' text-anchor='middle' fill='#e8a23a' font-family='Georgia' font-size='28'>ReelWith</text>
    <text x='50%' y='58%' text-anchor='middle' fill='#f4efe6' font-family='sans-serif' font-size='14'>${title.replace(/[<>&]/g, '')}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

function bootUI() {
  fillDatalist();
  renderPosters();
  renderFeed();
  renderSearch('');
  renderWant();
}

/* Events */
$('#ob-skip').addEventListener('click', finishOnboarding);
$('#ob-next').addEventListener('click', () => {
  if (obIndex >= SLIDES.length - 1) finishOnboarding();
  else { obIndex += 1; renderOb(); }
});
$$('.tab').forEach((t) => t.addEventListener('click', () => setView(t.dataset.view)));
$$('[data-go]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.go)));
$('#prompt-moment').addEventListener('click', () => setView('moment'));
$('#seed-feed').addEventListener('click', seedFeed);

$('#movie-search').addEventListener('input', (e) => renderSearch(e.target.value));
$('#search-results').addEventListener('click', (e) => {
  const wantBtn = e.target.closest('[data-want]');
  if (wantBtn) {
    e.preventDefault();
    e.stopPropagation();
    const m = CATALOG.find((x) => x.id === wantBtn.dataset.want);
    if (m && !want.some((w) => w.id === m.id)) {
      want.unshift({ id: m.id, title: m.title, year: m.year });
      saveWant();
      renderWant();
      toast(`Queued ${m.title}`);
    }
    return;
  }
  const row = e.target.closest('[data-pick]');
  if (row) pickMovie(row.dataset.pick);
});
$('#want-list').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-unwant]');
  if (!btn) return;
  want = want.filter((w) => w.id !== btn.dataset.unwant);
  saveWant();
  renderWant();
});
$$('#vibe-row .vibe').forEach((b) => b.addEventListener('click', () => setVibe(b.dataset.vibe)));

$('#log-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!selectedMovie || !vibe) {
    toast('Pick Loved / Fine / Nah first');
    return;
  }
  const fd = new FormData(e.target);
  const labels = { loved: 'Loved it', fine: 'It was fine', nah: "Didn't like" };
  logs.unshift({
    id: uid(),
    movieId: selectedMovie.id,
    title: selectedMovie.title,
    year: selectedMovie.year,
    genre: selectedMovie.genre,
    color: selectedMovie.color,
    short: selectedMovie.short,
    score: derivedScore,
    vibe,
    vibeLabel: labels[vibe],
    review: String(fd.get('review') || '').trim(),
    withWho: String(fd.get('with') || '').trim(),
    rewatch: Boolean(fd.get('rewatch')),
    when: Date.now(),
  });
  saveLogs(logs);
  want = want.filter((w) => w.id !== selectedMovie.id);
  saveWant();
  e.target.reset();
  selectedMovie = null;
  vibe = null;
  $('#log-form').hidden = true;
  toast(`Logged · ${derivedScore}/10`);
  setView('diary');
});

$('#start-cam').addEventListener('click', startCamera);
$('#take-snap').addEventListener('click', takeSnap);
$('#upload-snap').addEventListener('change', (e) => {
  const f = e.target.files?.[0];
  if (f) useUpload(f);
});

$('#moment-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const title = $('#moment-movie').value.trim();
  const movie = findMovie(title);
  const movieTitle = movie?.title || title;
  moments.unshift({
    id: uid(),
    movieId: movie?.id || uid(),
    movieTitle,
    crew: String(fd.get('crew') || '').trim(),
    caption: String(fd.get('caption') || '').trim(),
    vibe: String(fd.get('vibe') || 'cozy couch'),
    who: 'You',
    when: Date.now(),
    photo: snapDataUrl || defaultSnap(movieTitle),
  });
  saveMoments(moments);
  snapDataUrl = null;
  e.target.reset();
  $('#snap-preview').hidden = true;
  $('#pip').hidden = true;
  $('#vf-ph').hidden = false;
  toast('Moment posted');
  setView('feed');
});

if (!localStorage.getItem(ONBOARD_KEY)) showOnboarding();
else {
  $('#onboard').hidden = true;
  $('#shell').hidden = false;
  bootUI();
}
