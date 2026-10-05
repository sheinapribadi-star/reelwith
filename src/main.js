import '@fontsource/syne/700.css';
import '@fontsource/syne/800.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/600.css';
import '@fontsource/ibm-plex-mono/700.css';
import './style.css';

import { CATALOG, searchMovies, getMovie } from './catalog.js';
import { loadState, saveState, uid } from './storage.js';
import {
  vibeLabel, scoreFromRank, nextCompare, afterCompare, bandBounds, recommendFromRank,
} from './ranking.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

let state = loadState();
let selected = null;
let vibe = null;
let mainShot = null;
let pipShot = null;
let skipped = false;
let stream = null;
let camMode = null; // 'back' | 'front'
let cmp = null; // { lo, hi } during head-to-head
let pendingInsert = null;

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.hidden = true; }, 2400);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function persist() { saveState(state); }

function setView(name) {
  $$('.nav__btn').forEach((b) => b.classList.toggle('on', b.dataset.view === name));
  $$('.view').forEach((v) => {
    const on = v.id === `view-${name}`;
    v.classList.toggle('on', on);
    v.hidden = !on;
  });
  if (name === 'home') renderFeed();
  if (name === 'rank') renderRank();
  if (name === 'picks') renderPicks();
  if (name === 'log') renderGrid($('#q').value);
}

function stopCam() {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
  camMode = null;
  $('#cam').hidden = true;
}

async function openCam(facing) {
  try {
    stopCam();
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facing === 'front' ? 'user' : { ideal: 'environment' } },
      audio: false,
    });
    const video = $('#cam');
    video.srcObject = stream;
    video.hidden = false;
    await video.play();
    camMode = facing;
    if (facing === 'back') {
      $('#ph-main').hidden = true;
      $('#shot-main').hidden = true;
      $('#snap-main').disabled = false;
    } else {
      $('#ph-pip').hidden = true;
      $('#shot-pip').hidden = true;
      $('#snap-pip').disabled = false;
    }
  } catch {
    toast(facing === 'back' ? 'Camera blocked — upload room still' : 'Front cam blocked — upload a selfie still');
  }
}

function captureTo(target) {
  const video = $('#cam');
  if (!video.srcObject) return null;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 720;
  canvas.height = video.videoHeight || 960;
  const ctx = canvas.getContext('2d');
  if (target === 'pip') {
    // mirror front cam feel
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL('image/jpeg', 0.88);
}

function setMain(dataUrl) {
  mainShot = dataUrl;
  skipped = false;
  const img = $('#shot-main');
  img.src = dataUrl;
  img.hidden = false;
  $('#ph-main').hidden = true;
  $('#cam-front').disabled = false;
}

function setPip(dataUrl) {
  pipShot = dataUrl;
  skipped = false;
  const img = $('#shot-pip');
  img.src = dataUrl;
  img.hidden = false;
  $('#ph-pip').hidden = true;
}

function readFile(file, cb) {
  const r = new FileReader();
  r.onload = () => cb(r.result);
  r.readAsDataURL(file);
}

function renderGrid(q) {
  const list = searchMovies(q || '');
  $('#grid').innerHTML = list.map((m) => `
    <button type="button" class="poster-tile ${selected?.id === m.id ? 'on' : ''}" data-id="${m.id}">
      <img src="${m.poster}" alt="" loading="lazy" />
      <span>${escapeHtml(m.title)}</span>
    </button>
  `).join('');
}

function pickFilm(id) {
  selected = getMovie(id);
  if (!selected) return;
  const box = $('#picked');
  box.hidden = false;
  box.innerHTML = `
    <img src="${selected.poster}" alt="" />
    <div><strong>${escapeHtml(selected.title)}</strong><div class="night__meta">${selected.year} · ${escapeHtml(selected.genre)}</div></div>`;
  renderGrid($('#q').value);
  resetCompare();
}

function setVibe(v) {
  vibe = v;
  $$('.vibe__btn').forEach((b) => b.classList.toggle('on', b.dataset.vibe === v));
  if (!selected) { toast('Pick a film first'); return; }
  startCompare();
}

function resetCompare() {
  cmp = null;
  pendingInsert = null;
  $('#compare-panel').hidden = true;
  $('#btn-save').hidden = true;
  $('#compare').innerHTML = '';
}

function startCompare() {
  const bounds = bandBounds(state.rank, state.entries, vibe);
  cmp = { lo: bounds.lo, hi: bounds.hi };
  tickCompare();
}

function tickCompare() {
  const step = nextCompare(state.rank, cmp.lo, cmp.hi);
  if (step.done) {
    pendingInsert = step.index;
    $('#compare-panel').hidden = true;
    $('#btn-save').hidden = false;
    $('#btn-save').textContent = state.rank.length
      ? `Save · lands at #${step.index + 1}`
      : 'Save · first on your ladder';
    return;
  }
  const other = getMovie(step.compareId);
  $('#compare-panel').hidden = false;
  $('#btn-save').hidden = true;
  $('#compare-prompt').textContent = 'Which do you like more right now?';
  $('#compare').innerHTML = `
    <button type="button" class="cmp" data-prefer="new">
      <img src="${selected.poster}" alt="" />
      <div class="cmp__meta"><strong>${escapeHtml(selected.title)}</strong>new log</div>
      <div class="cmp__btn">This one</div>
    </button>
    <button type="button" class="cmp" data-prefer="old">
      <img src="${other?.poster || ''}" alt="" />
      <div class="cmp__meta"><strong>${escapeHtml(other?.title || 'Film')}</strong>on your ladder</div>
      <div class="cmp__btn">This one</div>
    </button>`;
  cmp._mid = step.mid;
}

function onPrefer(preferNew) {
  const next = afterCompare(preferNew, cmp._mid, cmp.lo, cmp.hi);
  cmp.lo = next.lo;
  cmp.hi = next.hi;
  tickCompare();
}

function saveEntry() {
  if (!selected) { toast('Pick a film'); return; }
  if (!vibe) { toast('Tap Liked / Mid / Dislike'); return; }
  if (pendingInsert == null) { toast('Finish placing it'); return; }
  if (!skipped && !mainShot && !pipShot) {
    toast('Add dual snap or skip');
    return;
  }
  const id = uid();
  const entry = {
    id,
    movieId: selected.id,
    title: selected.title,
    year: selected.year,
    genre: selected.genre,
    poster: selected.poster,
    color: selected.color,
    vibe,
    note: $('#note').value.trim(),
    withWho: $('#with').value.trim(),
    main: mainShot,
    pip: pipShot,
    when: Date.now(),
  };
  state.entries[id] = entry;
  // rank stores entry ids in order
  const rankIds = [...state.rank];
  // if movie already ranked, remove old entry ref
  const existingIdx = rankIds.findIndex((eid) => state.entries[eid]?.movieId === selected.id);
  if (existingIdx >= 0) {
    const oldId = rankIds.splice(existingIdx, 1)[0];
    delete state.entries[oldId];
    if (pendingInsert > existingIdx) pendingInsert -= 1;
  }
  rankIds.splice(pendingInsert, 0, id);
  state.rank = rankIds;
  state.feed = [id, ...(state.feed || []).filter((x) => x !== id)].slice(0, 40);
  persist();
  resetForm();
  toast(`Logged · #${pendingInsert + 1} on your ladder`);
  pendingInsert = null;
  if (state.rank.length) $('#lede').classList.add('hidden');
  setView('rank');
}

function resetForm() {
  selected = null;
  vibe = null;
  mainShot = null;
  pipShot = null;
  skipped = false;
  stopCam();
  $('#picked').hidden = true;
  $('#note').value = '';
  $('#with').value = '';
  $('#q').value = '';
  $$('.vibe__btn').forEach((b) => b.classList.remove('on'));
  $('#shot-main').hidden = true;
  $('#shot-pip').hidden = true;
  $('#shot-main').removeAttribute('src');
  $('#shot-pip').removeAttribute('src');
  $('#ph-main').hidden = false;
  $('#ph-pip').hidden = false;
  $('#snap-main').disabled = true;
  $('#snap-pip').disabled = true;
  $('#cam-front').disabled = true;
  resetCompare();
  renderGrid('');
}

function composeFallbackPoster(entry) {
  return entry.poster || '';
}

function renderFeed() {
  const ids = (state.feed?.length ? state.feed : state.rank).slice(0, 12);
  const box = $('#feed');
  if (!ids.length) {
    box.innerHTML = `<div class="empty"><strong>No nights yet</strong>Tap Log one. Dual snap, vibe, place on the ladder.</div>`;
    return;
  }
  box.innerHTML = ids.map((id) => {
    const e = state.entries[id];
    if (!e) return '';
    const main = e.main || composeFallbackPoster(e);
    const pip = e.pip;
    return `
      <article class="night">
        <div class="night__snap">
          ${main ? `<img class="main" src="${main}" alt="" />` : `<div class="dual__ph"><span>${escapeHtml(e.title)}</span></div>`}
          ${pip ? `<img class="pip" src="${pip}" alt="" />` : ''}
        </div>
        <div class="night__body">
          <div class="night__meta">${new Date(e.when).toLocaleDateString()} ${e.withWho ? `· with ${escapeHtml(e.withWho)}` : ''}</div>
          <h3>${escapeHtml(e.title)}</h3>
          <span class="tag ${e.vibe}">${vibeLabel(e.vibe)}</span>
          ${e.note ? `<p style="margin:8px 0 0;font-size:0.9rem">${escapeHtml(e.note)}</p>` : ''}
        </div>
      </article>`;
  }).join('');
}

function renderRank() {
  const n = state.rank.length;
  $('#rank-meta').textContent = n ? `${n} film${n === 1 ? '' : 's'} · head-to-head placed` : 'empty ladder';
  const list = $('#rank-list');
  if (!n) {
    list.innerHTML = `<li class="empty"><strong>Nothing ranked</strong>Log a watch to start the ladder.</li>`;
    return;
  }
  list.innerHTML = state.rank.map((id, i) => {
    const e = state.entries[id];
    if (!e) return '';
    const score = scoreFromRank(i, n, e.vibe);
    return `
      <li class="ladder__row">
        <span class="ladder__n">#${i + 1}</span>
        <img src="${e.poster}" alt="" loading="lazy" />
        <div>
          <div class="ladder__title">${escapeHtml(e.title)}</div>
          <div class="ladder__sub">${vibeLabel(e.vibe)} · ${e.year || ''} · ${escapeHtml(e.genre || '')}</div>
        </div>
        <span class="ladder__score">${score}</span>
      </li>`;
  }).join('');
}

function renderPicks() {
  const box = $('#picks');
  const movieRank = state.rank.map((eid) => state.entries[eid]).filter(Boolean);
  const byMovie = {};
  movieRank.forEach((e) => { byMovie[e.movieId] = e; });
  const rankMovieIds = movieRank.map((e) => e.movieId);
  const recs = recommendFromRank(rankMovieIds, byMovie, CATALOG, 8);
  if (!recs.length) {
    box.innerHTML = `<div class="empty"><strong>No picks yet</strong>Rank a few films first.</div>`;
    return;
  }
  box.innerHTML = recs.map(({ movie, reason }) => `
    <button type="button" class="pick" data-id="${movie.id}">
      <img src="${movie.poster}" alt="" loading="lazy" />
      <div class="pick__cap">
        <strong>${escapeHtml(movie.title)}</strong>
        <span>${escapeHtml(reason)}</span>
      </div>
    </button>
  `).join('');
}

function seedDemo() {
  if (state.rank.length) { toast('Ladder already has films'); return; }
  const demo = [
    { movieId: 'past-lives', vibe: 'liked', note: 'quietly devastating', withWho: 'Maya' },
    { movieId: 'dune-2', vibe: 'liked', note: 'IMAX was correct', withWho: 'Jordan' },
    { movieId: 'challengers', vibe: 'mid', note: 'messy on purpose', withWho: 'solo' },
    { movieId: 'barbie', vibe: 'mid', note: 'fun, loud pink', withWho: 'Sam' },
    { movieId: 'substance', vibe: 'dislike', note: 'too much for me', withWho: 'solo' },
  ];
  demo.forEach((d, i) => {
    const m = getMovie(d.movieId);
    if (!m) return;
    const id = `demo${i}`;
    state.entries[id] = {
      id, movieId: m.id, title: m.title, year: m.year, genre: m.genre,
      poster: m.poster, color: m.color, vibe: d.vibe, note: d.note,
      withWho: d.withWho, main: null, pip: null, when: Date.now() - i * 86400000,
    };
    state.rank.push(id);
  });
  state.feed = [...state.rank];
  persist();
  $('#lede').classList.add('hidden');
  renderFeed();
  toast('Demo reel loaded');
}

// events
$$('.nav__btn').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
$('#btn-new').addEventListener('click', () => setView('log'));
$('#btn-seed').addEventListener('click', seedDemo);
$('#q').addEventListener('input', (e) => renderGrid(e.target.value));
$('#grid').addEventListener('click', (e) => {
  const t = e.target.closest('[data-id]');
  if (t) pickFilm(t.dataset.id);
});
$('#cam-back').addEventListener('click', () => openCam('back'));
$('#cam-front').addEventListener('click', () => openCam('front'));
$('#snap-main').addEventListener('click', () => {
  const url = captureTo('main');
  if (url) { setMain(url); stopCam(); }
});
$('#snap-pip').addEventListener('click', () => {
  const url = captureTo('pip');
  if (url) { setPip(url); stopCam(); }
});
$('#up-main').addEventListener('change', (e) => {
  const f = e.target.files?.[0];
  if (f) readFile(f, setMain);
});
$('#up-pip').addEventListener('change', (e) => {
  const f = e.target.files?.[0];
  if (f) readFile(f, (url) => { setPip(url); $('#cam-front').disabled = false; });
});
$('#skip-snap').addEventListener('click', () => {
  skipped = true;
  mainShot = null;
  pipShot = null;
  stopCam();
  $('#shot-main').hidden = true;
  $('#shot-pip').hidden = true;
  $('#ph-main').hidden = false;
  $('#ph-pip').hidden = false;
  $('#ph-main').innerHTML = '<span>skipped</span><small>poster stands in</small>';
  toast('Snaps skipped');
});
$$('.vibe__btn').forEach((b) => b.addEventListener('click', () => setVibe(b.dataset.vibe)));
$('#compare').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-prefer]');
  if (!btn) return;
  onPrefer(btn.dataset.prefer === 'new');
});
$('#btn-save').addEventListener('click', saveEntry);
$('#picks').addEventListener('click', (e) => {
  const t = e.target.closest('[data-id]');
  if (!t) return;
  pickFilm(t.dataset.id);
  setView('log');
});
window.addEventListener('beforeunload', stopCam);

if (state.rank.length) $('#lede').classList.add('hidden');
renderGrid('');
renderFeed();
