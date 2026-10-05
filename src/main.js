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

let moments = loadMoments();
let logs = loadLogs();
let selectedMovie = null;
let rating = 8;
let stream = null;
let snapDataUrl = null;

function setView(name) {
  $$('.tab').forEach((t) => t.classList.toggle('on', t.dataset.view === name));
  $$('.view').forEach((v) => {
    const on = v.id === `view-${name}`;
    v.classList.toggle('on', on);
    v.hidden = !on;
  });
  if (name === 'diary') renderDiary();
  if (name === 'feed') renderFeed();
  if (name === 'log') renderSearch($('#movie-search').value);
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

function renderPosters() {
  const picks = [CATALOG[2], CATALOG[3], CATALOG[10]];
  $('#poster-stack').innerHTML = picks.map((m) =>
    `<div class="p" style="background:linear-gradient(160deg,${m.color},#111)">${escapeHtml(m.title)}</div>`
  ).join('');
}

function allMoments() {
  return [...moments].sort((a, b) => b.when - a.when);
}

function renderFeed() {
  const list = allMoments();
  const feed = $('#moment-feed');
  if (!list.length) {
    feed.innerHTML = `<div class="card empty"><h3>No moments yet</h3><p>Drop a watch moment, or load sample friends to see the vibe.</p></div>`;
    return;
  }
  feed.innerHTML = list.map((m) => `
    <article class="card moment">
      <div class="moment-photo" style="background-image:url('${m.photo}')">
        <span class="badge-live">${escapeHtml(m.vibe || 'watching')}</span>
      </div>
      <div class="moment-body">
        <div class="meta">${escapeHtml(m.who || 'You')} · ${timeAgo(m.when)}</div>
        <h3>${escapeHtml(m.movieTitle)}</h3>
        <span class="crew">with ${escapeHtml(m.crew)}</span>
        ${m.caption ? `<p class="caption">${escapeHtml(m.caption)}</p>` : ''}
      </div>
    </article>
  `).join('');
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
    </button>
  `).join('');
}

function renderStars() {
  $('#stars').innerHTML = Array.from({ length: 10 }, (_, i) => {
    const n = i + 1;
    return `<button type="button" class="star ${n <= rating ? 'on' : ''}" data-score="${n}">${n}</button>`;
  }).join('');
}

function pickMovie(id) {
  selectedMovie = CATALOG.find((m) => m.id === id);
  if (!selectedMovie) return;
  $('#log-form').hidden = false;
  $('#picked').innerHTML = `
    <div class="thumb" style="background:${selectedMovie.color}">${selectedMovie.short}</div>
    <div><strong>${escapeHtml(selectedMovie.title)}</strong><div class="meta">${selectedMovie.year} · ${escapeHtml(selectedMovie.genre)}</div></div>
  `;
  renderSearch($('#movie-search').value);
  renderStars();
}

function renderDiary() {
  const list = [...logs].sort((a, b) => b.when - a.when);
  const avg = list.length ? (list.reduce((s, x) => s + x.score, 0) / list.length).toFixed(1) : '—';
  $('#diary-stats').innerHTML = `
    <div class="stat"><strong>${list.length}</strong> logged</div>
    <div class="stat">avg <strong>${avg}</strong></div>
    <div class="stat"><strong>${moments.filter((m) => m.who === 'You' || !m.sample).length}</strong> moments</div>
  `;
  const box = $('#diary-list');
  if (!list.length) {
    box.innerHTML = `<div class="card empty"><h3>Diary is empty</h3><p>Rate something on the Log tab.</p></div>`;
    return;
  }
  box.innerHTML = list.map((l) => `
    <article class="card diary-item">
      <div class="thumb" style="background:${l.color || '#333'}">${escapeHtml(l.short || '•')}</div>
      <div>
        <strong>${escapeHtml(l.title)}</strong>
        <div class="meta">${l.year || ''} ${l.withWho ? `· with ${escapeHtml(l.withWho)}` : ''} ${l.rewatch ? '· rewatch' : ''}</div>
        ${l.review ? `<div class="caption">${escapeHtml(l.review)}</div>` : ''}
      </div>
      <div class="score-pill">${l.score}</div>
    </article>
  `).join('');
}

function fillDatalist() {
  $('#movie-list').innerHTML = CATALOG.map((m) =>
    `<option value="${escapeHtml(m.title)}"></option>`
  ).join('');
}

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
      audio: false,
    });
    const video = $('#cam');
    video.srcObject = stream;
    video.hidden = false;
    await video.play();
    $('#vf-ph').hidden = true;
    $('#snap-preview').hidden = true;
    $('#take-snap').disabled = false;
  } catch (err) {
    $('#vf-ph').innerHTML = `<p>Camera blocked (${escapeHtml(err.message)}). Upload a still instead — works great.</p>`;
  }
}

function takeSnap() {
  const video = $('#cam');
  const canvas = $('#snap-canvas');
  canvas.width = video.videoWidth || 720;
  canvas.height = video.videoHeight || 960;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  snapDataUrl = canvas.toDataURL('image/jpeg', 0.85);
  const img = $('#snap-preview');
  img.src = snapDataUrl;
  img.hidden = false;
  video.hidden = true;
  stopCam();
}

function stopCam() {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
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

// Events
$$('.tab').forEach((t) => t.addEventListener('click', () => setView(t.dataset.view)));
$$('[data-go]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.go)));

$('#seed-feed').addEventListener('click', () => {
  const existing = new Set(moments.map((m) => m.id));
  const extras = SAMPLE_MOMENTS.filter((m) => !existing.has(m.id)).map((m) => ({ ...m, sample: true }));
  moments = [...extras, ...moments];
  saveMoments(moments);
  renderFeed();
});

$('#movie-search').addEventListener('input', (e) => renderSearch(e.target.value));
$('#search-results').addEventListener('click', (e) => {
  const row = e.target.closest('[data-pick]');
  if (row) pickMovie(row.dataset.pick);
});
$('#stars').addEventListener('click', (e) => {
  const s = e.target.closest('[data-score]');
  if (!s) return;
  rating = Number(s.dataset.score);
  renderStars();
});

$('#log-form').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!selectedMovie) return;
  const fd = new FormData(e.target);
  logs.unshift({
    id: uid(),
    movieId: selectedMovie.id,
    title: selectedMovie.title,
    year: selectedMovie.year,
    genre: selectedMovie.genre,
    color: selectedMovie.color,
    short: selectedMovie.short,
    score: rating,
    review: String(fd.get('review') || '').trim(),
    withWho: String(fd.get('with') || '').trim(),
    rewatch: Boolean(fd.get('rewatch')),
    when: Date.now(),
  });
  saveLogs(logs);
  e.target.reset();
  selectedMovie = null;
  $('#log-form').hidden = true;
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
  $('#vf-ph').hidden = false;
  setView('feed');
});

fillDatalist();
renderPosters();
renderStars();
renderFeed();
renderSearch('');
