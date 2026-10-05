import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/playfair-display/400.css';
import '@fontsource/playfair-display/600.css';
import './style.css';

import {
  CATALOG, searchMovies, getMovie, recommend, SAMPLE_ENTRIES,
} from './catalog.js';
import { loadEntries, saveEntries, uid } from './storage.js';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

let entries = loadEntries();
let selected = null;
let liked = null; // true | false | null
let photo = null;
let skippedPhoto = false;
let stream = null;

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

function timeAgo(ts) {
  const m = Math.round((Date.now() - ts) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 48) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function poster(m) {
  return m?.poster || '';
}

function enrich(e) {
  const m = getMovie(e.movieId);
  return {
    ...e,
    title: m?.title || e.title || 'Unknown',
    year: m?.year,
    genre: m?.genre || e.genre,
    posterUrl: poster(m),
    color: m?.color || '#333',
  };
}

function setView(name) {
  $$('.tab').forEach((t) => t.classList.toggle('on', t.dataset.view === name));
  $$('.view').forEach((v) => {
    const on = v.id === `view-${name}`;
    v.classList.toggle('on', on);
    v.hidden = !on;
  });
  if (name === 'home') { renderRecs(); renderFeed(); }
  if (name === 'shelf') renderShelf();
  if (name === 'log') renderSearch($('#movie-search').value);
}

function hideIntroOnce() {
  if (entries.some((e) => !e.sample)) $('#intro').classList.add('hidden');
}

function renderRecs() {
  const mine = entries.filter((e) => !e.sample);
  const picks = recommend(mine.map(enrich), 8);
  const box = $('#recs');
  if (!picks.length) {
    box.innerHTML = `<div class="empty card" style="grid-column:1/-1"><h3>No picks yet</h3><p>Log a film you liked and we&rsquo;ll fill this rail.</p></div>`;
    return;
  }
  box.innerHTML = picks.map(({ movie, reason }) => `
    <button type="button" class="rec" data-pick="${movie.id}">
      <img src="${movie.poster}" alt="" loading="lazy" width="120" height="180"
        onerror="this.style.background='${movie.color}';this.removeAttribute('src')" />
      <div class="t">${escapeHtml(movie.title)}</div>
      <div class="r">${escapeHtml(reason)}</div>
    </button>
  `).join('');
}

function renderFeed() {
  const list = [...entries].sort((a, b) => b.when - a.when).map(enrich);
  const feed = $('#feed');
  if (!list.length) {
    feed.innerHTML = `
      <div class="card empty">
        <h3>Nothing logged yet</h3>
        <p>Tap + Log. Photo, liked or not, short note. Done.</p>
        <button class="btn primary" type="button" id="empty-log">Start a log</button>
      </div>`;
    $('#empty-log')?.addEventListener('click', () => setView('log'));
    return;
  }
  feed.innerHTML = list.map((e) => {
    const bg = e.photo
      ? `url('${e.photo}')`
      : e.posterUrl
        ? `url('${e.posterUrl}')`
        : `linear-gradient(160deg,${e.color},#111)`;
    return `
      <article class="card entry">
        <div class="entry-photo" style="background-image:${bg}">
          <span class="badge ${e.liked ? 'yes' : 'no'}">${e.liked ? 'liked' : 'pass'}</span>
        </div>
        <div class="entry-body">
          <div class="meta">${escapeHtml(e.who || 'You')} · ${timeAgo(e.when)}${e.sample ? ' · friend' : ''}</div>
          <h3>${escapeHtml(e.title)}</h3>
          ${e.withWho ? `<span class="crew">with ${escapeHtml(e.withWho)}</span>` : ''}
          ${e.note ? `<p style="margin:0">${escapeHtml(e.note)}</p>` : ''}
        </div>
      </article>`;
  }).join('');
}

function renderSearch(q) {
  const results = searchMovies(q || '');
  $('#search-results').innerHTML = results.map((m) => `
    <button type="button" class="pick ${selected?.id === m.id ? 'on' : ''}" data-pick="${m.id}">
      <img src="${m.poster}" alt="" loading="lazy"
        onerror="this.style.background='${m.color}';this.removeAttribute('src')" />
      <span>${escapeHtml(m.title)}</span>
    </button>
  `).join('');
}

function pickMovie(id) {
  selected = getMovie(id);
  if (!selected) return;
  const box = $('#picked');
  box.hidden = false;
  box.innerHTML = `
    <img src="${selected.poster}" alt=""
      onerror="this.style.background='${selected.color}';this.removeAttribute('src')" />
    <div>
      <strong>${escapeHtml(selected.title)}</strong>
      <div class="meta">${selected.year} · ${escapeHtml(selected.genre)}</div>
    </div>`;
  renderSearch($('#movie-search').value);
}

function setLiked(val) {
  liked = val;
  $$('.vibe').forEach((b) => {
    const yes = b.dataset.liked === 'yes';
    b.classList.toggle('on', val === yes);
  });
}

function stopCam() {
  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }
}

async function startCamera() {
  try {
    stopCam();
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    });
    const video = $('#cam');
    video.srcObject = stream;
    video.hidden = false;
    await video.play();
    $('#vf-ph').hidden = true;
    $('#snap-preview').hidden = true;
    $('#take-snap').disabled = false;
    skippedPhoto = false;
  } catch (err) {
    $('#vf-ph').innerHTML = `<p>Camera unavailable. Upload a still instead.</p>`;
    toast('Try Upload');
  }
}

function takeSnap() {
  const video = $('#cam');
  if (!video.srcObject) return;
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth || 720;
  canvas.height = video.videoHeight || 960;
  canvas.getContext('2d').drawImage(video, 0, 0);
  photo = canvas.toDataURL('image/jpeg', 0.85);
  const img = $('#snap-preview');
  img.src = photo;
  img.hidden = false;
  video.hidden = true;
  $('#vf-ph').hidden = true;
  skippedPhoto = false;
  stopCam();
}

function useUpload(file) {
  const reader = new FileReader();
  reader.onload = () => {
    photo = reader.result;
    const img = $('#snap-preview');
    img.src = photo;
    img.hidden = false;
    $('#cam').hidden = true;
    $('#vf-ph').hidden = true;
    skippedPhoto = false;
    stopCam();
  };
  reader.readAsDataURL(file);
}

function saveLog() {
  if (!selected) { toast('Pick a film first'); return; }
  if (liked == null) { toast('Tap Liked it or Not for me'); return; }
  if (!photo && !skippedPhoto) {
    toast('Add a photo or tap Skip photo');
    return;
  }
  const note = $('#note').value.trim();
  const withWho = $('#with').value.trim();
  entries.unshift({
    id: uid(),
    movieId: selected.id,
    liked,
    note,
    withWho,
    who: 'You',
    photo: photo || null,
    when: Date.now(),
    sample: false,
    genre: selected.genre,
  });
  saveEntries(entries);
  // reset form
  selected = null;
  liked = null;
  photo = null;
  skippedPhoto = false;
  $('#picked').hidden = true;
  $('#note').value = '';
  $('#with').value = '';
  $('#movie-search').value = '';
  $$('.vibe').forEach((b) => b.classList.remove('on'));
  $('#snap-preview').hidden = true;
  $('#snap-preview').removeAttribute('src');
  $('#vf-ph').hidden = false;
  $('#vf-ph').innerHTML = `<p>Snap the couch, the screen, whoever&rsquo;s there.</p>`;
  stopCam();
  hideIntroOnce();
  toast('Saved');
  setView('home');
}

function renderShelf() {
  const mine = entries.filter((e) => !e.sample).map(enrich);
  const likes = mine.filter((e) => e.liked).length;
  $('#stats').innerHTML = `
    <div class="stat"><strong>${mine.length}</strong> logged</div>
    <div class="stat"><strong>${likes}</strong> liked</div>
  `;
  const box = $('#diary');
  if (!mine.length) {
    box.innerHTML = `<div class="card empty"><h3>Shelf is empty</h3><p>Your logs land here.</p></div>`;
    return;
  }
  box.innerHTML = [...mine].sort((a, b) => b.when - a.when).map((e) => `
    <article class="card diary-item">
      <img src="${e.posterUrl}" alt="" loading="lazy"
        onerror="this.style.background='${e.color}';this.removeAttribute('src')" />
      <div>
        <strong>${escapeHtml(e.title)}</strong>
        <div class="meta">${e.year || ''} ${e.withWho ? `· with ${escapeHtml(e.withWho)}` : ''}</div>
        ${e.note ? `<div>${escapeHtml(e.note)}</div>` : ''}
      </div>
      <div class="pill ${e.liked ? 'yes' : 'no'}">${e.liked ? '♥' : '–'}</div>
    </article>
  `).join('');
}

function seedFriends() {
  const existing = new Set(entries.map((e) => e.id));
  const extras = SAMPLE_ENTRIES.filter((s) => !existing.has(s.id)).map((s) => ({ ...s, sample: true }));
  if (!extras.length) { toast('Samples already loaded'); return; }
  entries = [...extras, ...entries];
  saveEntries(entries);
  renderFeed();
  renderRecs();
  toast('Friend logs added');
}

// events
$$('.tab').forEach((t) => t.addEventListener('click', () => setView(t.dataset.view)));
$('#go-log').addEventListener('click', () => setView('log'));
$('#seed').addEventListener('click', seedFriends);
$('#movie-search').addEventListener('input', (e) => renderSearch(e.target.value));
$('#search-results').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-pick]');
  if (btn) pickMovie(btn.dataset.pick);
});
$('#recs').addEventListener('click', (e) => {
  const btn = e.target.closest('[data-pick]');
  if (!btn) return;
  pickMovie(btn.dataset.pick);
  setView('log');
});
$$('.vibe').forEach((b) => b.addEventListener('click', () => setLiked(b.dataset.liked === 'yes')));
$('#start-cam').addEventListener('click', startCamera);
$('#take-snap').addEventListener('click', takeSnap);
$('#upload-snap').addEventListener('change', (e) => {
  const f = e.target.files?.[0];
  if (f) useUpload(f);
});
$('#skip-photo').addEventListener('click', () => {
  skippedPhoto = true;
  photo = null;
  $('#snap-preview').hidden = true;
  $('#cam').hidden = true;
  $('#vf-ph').hidden = false;
  $('#vf-ph').innerHTML = `<p>Photo skipped. Poster will stand in on your feed.</p>`;
  stopCam();
  toast('Photo skipped');
});
$('#save').addEventListener('click', saveLog);
window.addEventListener('beforeunload', stopCam);

hideIntroOnce();
renderRecs();
renderFeed();
renderSearch('');
