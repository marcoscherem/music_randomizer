/* Class Playlist Builder, browser-only version (static site, no server).
 *
 * Everything runs in the visitor's browser: songs are found through the public iTunes
 * and Deezer APIs, then matched to Spotify and saved as a playlist. Spotify sign-in is
 * asked for each time a playlist is sent, and the access token is never stored.
 * The Spotify Client ID is not part of this site: it is entered once per device and
 * kept in that browser.
 */
(() => {
'use strict';
const DEFAULTS = window.CPB_DEFAULTS;  // config.js

const host = document.getElementById('class-playlist-builder');
if (!host || host.shadowRoot) return;
// A shadow root keeps the site's theme styles out and ours in.
const root = host.attachShadow({ mode: 'open' });
root.innerHTML = `
<style>
  :host { display: block; }
  .app {
    --bg: #f4f2ef; --panel: #ffffff; --panel-2: #f8f6f3; --text: #1d1b19; --muted: #6f6a64;
    --line: #e4e0da; --accent: #c8102e; --accent-ink: #fff; --ok: #1f7a4d; --warn: #9a6200;
    --chip: #efebe6; --chip-on: #1d1b19; --chip-on-ink: #fff;
    container-type: inline-size; background: var(--bg); color: var(--text); border-radius: 14px; padding: 16px;
    font: 14px/1.45 "Segoe UI", system-ui, sans-serif; text-align: left;
  }
  * { box-sizing: border-box; }
  .top { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin: 0 0 16px; }
  .top h1 { font-size: 17px; margin: 0; font-weight: 650; letter-spacing: -.01em; color: var(--text); }
  .top h1 span { color: var(--accent); }
  main { display: grid; grid-template-columns: 360px 1fr; gap: 16px; }
  @container (max-width: 860px) { main { grid-template-columns: 1fr; } .main-col { order: -1; } }
  section { min-width: 0; }
  .card { background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 16px; margin-bottom: 16px; }
  .card h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); margin: 0 0 14px; font-weight: 600; }
  .card h3 { font-size: 13px; margin: 18px 0 8px; font-weight: 600; color: var(--text); }
  .card h3:first-of-type { margin-top: 0; }
  label { display: block; font-size: 12.5px; color: var(--muted); margin: 10px 0 4px; }
  .hint { font-size: 12px; color: var(--muted); margin: 4px 0 0; }
  input[type=text], input[type=number], input[type=password] {
    width: 100%; padding: 8px 10px; border-radius: 8px; border: 1px solid var(--line); background: var(--panel-2); color: var(--text); font: inherit;
  }
  input:focus { outline: 2px solid var(--accent); outline-offset: -1px; }
  .row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .check { display: flex; align-items: center; gap: 8px; margin: 10px 0 0; color: var(--text); font-size: 13px; }
  .check input { accent-color: var(--accent); width: 16px; height: 16px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 99px; background: var(--chip); font-size: 12.5px; cursor: pointer; user-select: none; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .chip.on { background: var(--chip-on); color: var(--chip-on-ink); }
  .chip button { border: 0; background: none; color: inherit; cursor: pointer; padding: 0; font-size: 14px; line-height: 1; opacity: .6; }
  .chipbox { border: 1px solid var(--line); background: var(--panel-2); border-radius: 8px; padding: 6px; }
  .chipbox input { border: 0 !important; background: transparent !important; padding: 4px !important; outline: none !important; }
  button.btn { border: 1px solid var(--line); background: var(--panel-2); color: var(--text); padding: 8px 14px; border-radius: 8px; font: inherit; font-weight: 550; cursor: pointer; }
  button.btn:hover { border-color: var(--muted); }
  button.btn.primary { background: var(--accent); border-color: var(--accent); color: var(--accent-ink); }
  button.btn:disabled { opacity: .5; cursor: default; }
  .actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
  .stats { display: flex; gap: 22px; margin: 14px 0 4px; flex-wrap: wrap; }
  .stat b { display: block; font-size: 22px; font-variant-numeric: tabular-nums; letter-spacing: -.02em; }
  .stat span { font-size: 12px; color: var(--muted); }
  .bar { height: 6px; border-radius: 99px; background: var(--chip); overflow: hidden; margin: 8px 0 14px; }
  .bar div { height: 100%; background: var(--accent); transition: width .3s; }
  table { width: 100%; border-collapse: collapse; margin: 0; border: 0; }
  td { padding: 7px 6px; border: 0; border-top: 1px solid var(--line); vertical-align: middle; }
  td.num { color: var(--muted); width: 28px; text-align: right; font-variant-numeric: tabular-nums; }
  td.art { width: 50px; }
  td.art img { width: 38px; height: 38px; border-radius: 5px; display: block; background: var(--chip); }
  td .t { font-weight: 550; } td .a { color: var(--muted); font-size: 12.5px; }
  td.meta { color: var(--muted); font-size: 12.5px; white-space: nowrap; font-variant-numeric: tabular-nums; text-align: right; }
  td.tools { white-space: nowrap; text-align: right; width: 110px; }
  .icon { border: 1px solid var(--line); background: var(--panel-2); color: var(--text); border-radius: 7px; width: 30px; height: 30px; cursor: pointer; font-size: 13px; padding: 0; }
  .icon.playing { background: var(--accent); color: #fff; border-color: var(--accent); }
  @container (max-width: 520px) { td.art, td.num { display: none; } td.tools { width: auto; } .icon { margin-bottom: 2px; } }
  .log { font: 12px/1.5 Consolas, monospace; background: var(--panel-2); border-radius: 8px; padding: 10px; max-height: 150px; overflow: auto; color: var(--muted); white-space: pre-wrap; }
  .msg { padding: 10px 12px; border-radius: 8px; margin: 10px 0; font-size: 13px; }
  .msg a { color: inherit; font-weight: 600; }
  .msg.warn { background: color-mix(in srgb, var(--warn) 14%, transparent); color: var(--warn); }
  .msg.err { background: color-mix(in srgb, var(--accent) 14%, transparent); color: var(--accent); }
  .msg.ok { background: color-mix(in srgb, var(--ok) 14%, transparent); color: var(--ok); }
  .empty { color: var(--muted); text-align: center; padding: 40px 10px; }
  details.hist { border-top: 1px solid var(--line); padding: 8px 0; }
  details.hist summary { cursor: pointer; display: flex; gap: 10px; flex-wrap: wrap; }
  details.hist summary .when { color: var(--muted); margin-left: auto; font-size: 12.5px; }
  details.hist ol { color: var(--muted); font-size: 12.5px; margin: 8px 0 4px; padding-left: 22px; }
  .hidden { display: none !important; }
  .name-input { font-size: 15px !important; font-weight: 600; }
</style>
<div class="app">
  <div class="top"><h1>🥋 Class Playlist <span>Builder</span></h1></div>
  <main>
    <section>
      <div class="card">
        <h2>Playlist</h2>
        <label>Name <span class="hint">— use {date}, {week} or {month}</span></label>
        <input type="text" data-k="playlist_name">
        <label>Description</label>
        <input type="text" data-k="description">
        <div class="row">
          <div><label>Class length (min)</label><input type="number" min="10" data-k="target_minutes"></div>
          <div><label>May run over by (min)</label><input type="number" min="0" data-k="overshoot_minutes"></div>
        </div>
        <label>Country</label>
        <input type="text" data-k="country" maxlength="2">
        <p class="hint">2-letter code: gb = UK, us = USA, br = Brazil…</p>
      </div>
      <div class="card">
        <h2>Where songs come from</h2>
        <h3>Genres</h3>
        <div class="chips" id="genreChips"></div>
        <p class="hint">Top songs in each genre, and the genre filter for keyword searches.</p>
        <h3>Mood / style keywords</h3>
        <div class="chipbox" data-list="keywords"></div>
        <p class="hint">Finds matching public playlists on Deezer (e.g. workout, kickboxing, phonk, epic) and uses their songs, filtered by your genres.</p>
        <h3>Artists</h3>
        <div class="chipbox" data-list="artists"></div>
        <p class="hint">All their songs are candidates, whatever the genre.</p>
        <h3>Deezer playlist links</h3>
        <div class="chipbox" data-list="seed_playlists"></div>
        <p class="hint">Paste links to public Deezer playlists. Best way to target a mood.</p>
      </div>
      <div class="card">
        <h2>Filters</h2>
        <h3>Tempo (BPM)</h3>
        <div class="row">
          <div><label>Min BPM</label><input type="number" data-k="bpm_min" placeholder="any"></div>
          <div><label>Max BPM</label><input type="number" data-k="bpm_max" placeholder="any"></div>
        </div>
        <label class="check"><input type="checkbox" data-k="bpm_half_double"> Count half/double time (a 75 BPM song feels like 150)</label>
        <label class="check"><input type="checkbox" data-k="allow_unknown_bpm"> Allow songs with unknown BPM</label>
        <h3>Songs</h3>
        <div class="row">
          <div><label>Min length (min)</label><input type="number" step="0.5" data-k="min_song_minutes"></div>
          <div><label>Max length (min)</label><input type="number" step="0.5" data-k="max_song_minutes"></div>
        </div>
        <div class="row">
          <div><label>Released from</label><input type="number" data-k="year_min" placeholder="any"></div>
          <div><label>Released until</label><input type="number" data-k="year_max" placeholder="any"></div>
        </div>
        <div class="row">
          <div><label>Max songs per artist</label><input type="number" min="0" data-k="max_per_artist"></div>
          <div><label>No repeats from last N playlists</label><input type="number" min="0" data-k="avoid_repeats_playlists"></div>
        </div>
        <label class="check"><input type="checkbox" data-k="allow_explicit"> Allow explicit lyrics</label>
        <h3>Exclude artists</h3>
        <div class="chipbox" data-list="exclude_artists"></div>
        <h3>Exclude songs whose title contains</h3>
        <div class="chipbox" data-list="exclude_words"></div>
      </div>
    </section>
    <section class="main-col">
      <div class="card hidden" id="setupCard">
        <h2>Spotify setup on this device</h2>
        <label>Spotify app Client ID</label>
        <input type="password" id="clientId" autocomplete="off" spellcheck="false">
        <p class="hint">Asked once per device and kept only in this browser. It is the Client ID of your app at developer.spotify.com/dashboard.</p>
        <div class="actions" style="margin-top:10px"><button class="btn" id="clientSave">Save</button></div>
      </div>
      <div class="card">
        <div class="actions">
          <button class="btn primary" id="genBtn">🎲 Generate playlist</button>
          <button class="btn" id="pushBtn" disabled>⬆ Send to Spotify</button>
        </div>
        <p class="hint">Sending asks you to sign in to Spotify each time; the sign-in is forgotten as soon as the playlist is saved.</p>
        <div id="progressBox" class="hidden" style="margin-top:14px"><div class="log" id="log"></div></div>
        <div id="messages"></div>
        <div id="result" class="hidden">
          <label>Playlist name</label>
          <input type="text" class="name-input" id="plName">
          <div class="stats">
            <div class="stat"><b id="stTime">–</b><span>total length</span></div>
            <div class="stat"><b id="stCount">–</b><span>songs</span></div>
            <div class="stat"><b id="stBpm">–</b><span>average BPM</span></div>
            <div class="stat"><b id="stPool">–</b><span>songs matched your filters</span></div>
          </div>
          <div class="bar"><div id="stBar"></div></div>
          <table><tbody id="tracks"></tbody></table>
        </div>
        <div id="emptyState" class="empty">Set your preferences, then hit <b>Generate playlist</b>.<br>The first run takes a minute or two while songs are collected; later runs are faster.</div>
      </div>
      <div class="card">
        <h2>History on this device</h2>
        <div id="history"></div>
        <p class="hint" style="margin-top:12px"><a href="#" id="clientForget">Forget the Spotify Client ID on this device</a></p>
      </div>
    </section>
  </main>
  <audio id="audio"></audio>
</div>`;

const $ = (id) => root.getElementById(id);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const DAY = 86400e3;

/* ---------- storage (settings, history and caches live in this browser only) ---------- */
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem('cpb:' + key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; }
  },
  set(key, value) {
    const text = JSON.stringify(value);
    try { localStorage.setItem('cpb:' + key, text); } catch {
      // Storage full: drop cached song lists and try once more.
      try {
        Object.keys(localStorage).filter(k => k.startsWith('cpb:cache:')).forEach(k => localStorage.removeItem(k));
        localStorage.setItem('cpb:' + key, text);
      } catch { /* storage unavailable: carry on without it */ }
    }
  },
};
async function cached(key, ttl, fetcher) {
  const hit = store.get('cache:' + key);
  if (hit && Date.now() - hit.t < ttl) return hit.v;
  const v = await fetcher();
  store.set('cache:' + key, { t: Date.now(), v });
  return v;
}
function throttle(ms) {
  let next = 0;
  return async () => { const now = Date.now(), wait = Math.max(0, next - now); next = Math.max(now, next) + ms; if (wait) await sleep(wait); };
}

function log(text) { $('log').textContent += text + '\n'; $('log').scrollTop = 1e9; }

/* ---------- iTunes: genre charts and artist catalogues ---------- */
const GENRE_IDS = { 'Alternative': 20, 'Blues': 2, 'Country': 6, 'Dance': 17, 'Electronic': 7, 'Hard Rock': 1152, 'Hip-Hop/Rap': 18,
  'Jazz': 11, 'K-Pop': 51, 'Latin': 12, 'Metal': 1153, 'Pop': 14, 'R&B/Soul': 15, 'Reggae': 24, 'Rock': 21, 'Soundtrack': 16, 'World': 19 };
// Sub-genre names (as returned by the APIs) that count as a match for each selectable genre.
const GENRE_FAMILIES = {
  'Alternative': ['alternative', 'indie', 'punk', 'grunge'],
  'Dance': ['dance', 'house', 'techno', 'trance', 'edm'],
  'Electronic': ['electro', 'dance', 'house', 'techno', 'trance', 'dubstep', 'drum & bass', 'breakbeat', 'hardstyle', 'edm'],
  'Hard Rock': ['hard rock', 'metal'],
  'Hip-Hop/Rap': ['hip-hop', 'hip hop', 'rap', 'dirty south', 'gangsta', 'trap', 'drill'],
  'Latin': ['latin', 'reggaeton', 'urbano', 'salsa', 'bachata', 'cumbia', 'funk brasileiro'],
  'Metal': ['metal'],
  'R&B/Soul': ['r&b', 'soul', 'funk'],
  'Rock': ['rock', 'metal', 'punk', 'grunge'],
  'Soundtrack': ['soundtrack', 'score', 'films'],
  'World': ['world', 'brazilian', 'african', 'afrobeats'],
};
function genreMatches(trackGenre, selected) {
  const g = (trackGenre || '').toLowerCase();
  return selected.some(name => (GENRE_FAMILIES[name] || [name.toLowerCase()]).some(token => g.includes(token)));
}

const itunesWait = throttle(3100);  // the public limit is roughly 20 requests per minute
async function itunes(path, params) {
  const url = 'https://itunes.apple.com' + path + (params ? '?' + new URLSearchParams(params) : '');
  for (let attempt = 0; attempt < 4; attempt++) {
    await itunesWait();
    let r;
    try { r = await fetch(url); } catch { await sleep(3000); continue; }
    if ([403, 429, 503].includes(r.status)) {
      const wait = 20 * (attempt + 1);
      log(`Rate limited by Apple, waiting ${wait}s...`);
      await sleep(wait * 1000);
      continue;
    }
    if (r.status === 404) return null;
    if (!r.ok) throw new Error(`iTunes HTTP ${r.status}`);
    return r.json();
  }
  throw new Error('iTunes request failed');
}
function itunesTracks(data) {
  return ((data || {}).results || []).filter(i => i.wrapperType === 'track' && i.kind === 'song').map(i => ({
    id: String(i.trackId), title: i.trackName || '', artist: i.artistName || '', album: i.collectionName || '',
    genre: i.primaryGenreName || '', duration_ms: i.trackTimeMillis || 0, explicit: i.trackExplicitness === 'explicit',
    year: /^\d{4}/.test(i.releaseDate || '') ? +i.releaseDate.slice(0, 4) : null, preview_url: i.previewUrl || null,
    artwork: i.artworkUrl100 || null, streamable: i.isStreamable !== false,
  }));
}
function genreTopSongs(genre, country) {
  return cached(`top:${country}:${genre}`, 2 * DAY, async () => {
    const feed = await itunes(`/${country}/rss/topsongs/limit=100/genre=${GENRE_IDS[genre]}/json`);
    let entries = ((feed || {}).feed || {}).entry || [];
    if (!Array.isArray(entries)) entries = [entries];
    const ids = entries.map(e => e.id.attributes['im:id']);
    return ids.length ? itunesTracks(await itunes('/lookup', { id: ids.join(','), country })) : [];
  });
}
function artistSongs(name, country) {
  return cached(`artist:${country}:${name.toLowerCase()}`, 7 * DAY, async () => {
    const found = ((await itunes('/search', { term: name, entity: 'musicArtist', attribute: 'artistTerm', limit: 5, country })) || {}).results || [];
    if (!found.length) { log(`Artist not found: ${name}`); return []; }
    const artist = found.find(a => (a.artistName || '').toLowerCase() === name.toLowerCase()) || found[0];
    return itunesTracks(await itunes('/lookup', { id: artist.artistId, entity: 'song', limit: 200, country }));
  });
}

/* ---------- Deezer: mood playlists, genre/year details and BPM ---------- */
// Deezer's API has no cross-site headers, so it is called through its JSONP mode.
let jsonpCount = 0;
function jsonp(url) {
  return new Promise((resolve, reject) => {
    const name = 'cpbJsonp' + (++jsonpCount), script = document.createElement('script');
    const finish = (fn, value) => { clearTimeout(timer); window[name] = () => {}; script.remove(); fn(value); };
    const timer = setTimeout(() => finish(reject, new Error('Deezer timed out')), 20000);
    window[name] = (data) => finish(resolve, data);
    script.onerror = () => finish(reject, new Error('Deezer request failed'));
    script.src = `${url}${url.includes('?') ? '&' : '?'}output=jsonp&callback=${name}`;
    document.head.appendChild(script);
  });
}
const deezerWait = throttle(150);  // Deezer allows ~50 requests / 5 s
async function deezer(path, params) {
  const url = 'https://api.deezer.com' + path + (params ? '?' + new URLSearchParams(params) : '');
  for (let attempt = 0; attempt < 3; attempt++) {
    await deezerWait();
    const data = await jsonp(url);
    if (data && data.error && data.error.code === 4) { await sleep(5000); continue; }  // quota: back off
    return data;
  }
  throw new Error('Deezer is busy, try again in a minute');
}
function deezerTrack(i) {
  const album = i.album || {};
  return {
    id: 'dz' + i.id, deezer_id: i.id, deezer_album_id: album.id, title: i.title || '', artist: (i.artist || {}).name || '',
    album: album.title || '', genre: null /* looked up when needed */, duration_ms: (i.duration || 0) * 1000,
    explicit: !!i.explicit_lyrics, year: null, preview_url: i.preview || null, artwork: album.cover_medium || null,
    streamable: i.readable !== false, isrc: i.isrc || null,
  };
}
async function readDeezerPlaylist(id, maxTracks) {
  const tracks = [];
  while (tracks.length < maxTracks) {
    const data = (await deezer(`/playlist/${id}/tracks`, { limit: 100, index: tracks.length })) || {};
    if (data.error) throw new Error(data.error.message || 'Deezer error');
    const page = data.data || [];
    tracks.push(...page);
    if (!page.length || !data.next) break;
  }
  return tracks.slice(0, maxTracks).filter(i => i.type === 'track').map(deezerTrack);
}
async function keywordSongs(keyword) {
  const found = await cached(`mood:${keyword.toLowerCase()}`, 3 * DAY, async () =>
    (((await deezer('/search/playlist', { q: keyword, limit: 10 })) || {}).data || []).filter(p => p.nb_tracks).slice(0, 3)
      .map(p => ({ id: p.id, title: p.title })));
  const tracks = [];
  for (const p of found) tracks.push(...await readDeezerPlaylist(p.id, 100));
  log(`Mood "${keyword}" playlists: ${found.map(p => p.title).join(', ') || 'none found'}`);
  return tracks;
}
function playlistSongs(url) {
  const m = /playlist\/(\d+)/.exec(url);
  if (!url.includes('deezer') || !m) throw new Error('not a Deezer playlist link');
  return readDeezerPlaylist(m[1], 300);
}
async function enrich(t) {
  const album = await cached(`album:${t.deezer_album_id}`, 30 * DAY, async () => {
    const a = (await deezer(`/album/${t.deezer_album_id}`)) || {};
    return { genre: ((a.genres || {}).data || []).map(g => g.name).join(', '), date: a.release_date || '' };
  });
  t.genre = album.genre;
  t.year = /^\d{4}/.test(album.date) ? +album.date.slice(0, 4) : null;
}

const clean = (title) => title.replace(/\s*[(\[].*?[)\]]/g, '').split(' - ')[0].trim();
const leadArtist = (artist) => artist.split(/,|&| feat\.| ft\.| x | and /i)[0].trim();
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

async function bpmLookup(t) {
  const known = store.get('bpm', {});
  if (t.id in known) return known[t.id];
  let bpm = null;
  try {
    let d = null;
    if (t.deezer_id) d = await deezer(`/track/${t.deezer_id}`);
    else {
      const artist = leadArtist(t.artist);
      const found = ((await deezer('/search', { q: `${artist} ${clean(t.title)}`, limit: 15 })) || {}).data || [];
      const same = found.filter(r => { const n = norm((r.artist || {}).name || ''); return n && (n.includes(norm(artist)) || norm(artist).includes(n)); });
      const match = same.find(r => Math.abs((r.duration || 0) - t.duration_ms / 1000) <= 8) || same[0];
      if (match) d = await deezer(`/track/${match.id}`);
    }
    if (d && !d.error && d.bpm) bpm = Math.round(d.bpm * 10) / 10;
  } catch (e) {
    log(`BPM lookup failed for ${t.title}: ${e.message}`);
    return null;  // network hiccup: don't remember it, just treat as unknown this time
  }
  const all = store.get('bpm', {});
  all[t.id] = bpm;
  store.set('bpm', all);
  return bpm;
}
function bpmInRange(bpm, lo, hi, halfDouble) {
  return (halfDouble ? [bpm, bpm * 2, bpm / 2] : [bpm]).some(v => (lo == null || v >= lo) && (hi == null || v <= hi));
}

/* ---------- generator ---------- */
const primaryArtist = (artist) => artist.toLowerCase().split(/,|&| feat\.| ft\.| x /)[0].trim();
// Identity that ignores remasters, album versions, compilations, etc.
const songKey = (title, artist) => primaryArtist(artist) + '|' + title.toLowerCase().replace(/\s*[(\[].*?[)\]]/g, '').split(' - ')[0].replace(/[^a-z0-9]/g, '');
const wordRe = (w) => new RegExp('\\b' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b');
const seconds = (tracks) => tracks.reduce((sum, t) => sum + t.duration_ms, 0) / 1000;

async function buildPool(s) {
  const pool = [];
  const add = async (source, genreFree, fetcher) => {
    let tracks = [];
    // One failing source shouldn't sink the whole playlist.
    try { tracks = await fetcher(); } catch (e) { log(`${source}: skipped (${e.message})`); }
    tracks.forEach(t => pool.push({ ...t, source, genre_free: genreFree }));
    log(`${source}: ${tracks.length} songs`);
  };
  for (const g of s.genres) await add(`Top ${g}`, false, () => genreTopSongs(g, s.country));
  // Artists and playlists you name explicitly are always allowed, regardless of genre.
  for (const a of s.artists) await add(`Artist ${a}`, true, () => artistSongs(a, s.country));
  for (const url of s.seed_playlists) await add(`Playlist ${url}`, true, () => playlistSongs(url));
  for (const kw of s.keywords) await add(`Mood "${kw}"`, false, () => keywordSongs(kw));
  return pool;
}

function filterPool(pool, s) {
  const excludedArtists = new Set(s.exclude_artists.map(a => a.toLowerCase()));
  const excludedWords = s.exclude_words.map(w => wordRe(w.toLowerCase()));
  const seen = new Set(), out = [];
  for (const t of pool) {
    const key = songKey(t.title, t.artist), title = t.title.toLowerCase();
    if (seen.has(key) || !t.streamable || !t.duration_ms) continue;
    if (t.explicit && !s.allow_explicit) continue;
    if (t.duration_ms < s.min_song_minutes * 60000 || t.duration_ms > s.max_song_minutes * 60000) continue;
    if (excludedArtists.has(primaryArtist(t.artist)) || excludedArtists.has(t.artist.toLowerCase())) continue;
    if (excludedWords.some(re => re.test(title))) continue;
    if (s.year_min && t.year && t.year < s.year_min) continue;
    if (s.year_max && t.year && t.year > s.year_max) continue;
    if (s.genres.length && !t.genre_free && t.genre !== null && !genreMatches(t.genre, s.genres)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

// Deezer songs arrive without genre or year; these are looked up only for songs about to be picked.
async function detailsOk(t, s) {
  if (t.genre !== null) return true;
  try { await enrich(t); } catch { t.genre = ''; }
  if (s.year_min && t.year && t.year < s.year_min) return false;
  if (s.year_max && t.year && t.year > s.year_max) return false;
  return !s.genres.length || t.genre_free || genreMatches(t.genre, s.genres);
}
async function bpmOk(t, s) {
  if (s.bpm_min == null && s.bpm_max == null) return true;
  t.bpm = await bpmLookup(t);
  if (t.bpm == null) return s.allow_unknown_bpm;
  return bpmInRange(t.bpm, s.bpm_min, s.bpm_max, s.bpm_half_double);
}

async function fill(candidates, s) {
  const target = s.target_minutes * 60, maxTotal = target + s.overshoot_minutes * 60;
  const chosen = [], leftovers = [], perArtist = {};
  let total = 0;
  for (const t of candidates) {
    const secs = t.duration_ms / 1000, artist = primaryArtist(t.artist);
    if (total >= target || total + secs > maxTotal || (s.max_per_artist && (perArtist[artist] || 0) >= s.max_per_artist)) {
      leftovers.push(t);
      continue;
    }
    if (!(await detailsOk(t, s) && await bpmOk(t, s))) continue;
    chosen.push(t);
    total += secs;
    perArtist[artist] = (perArtist[artist] || 0) + 1;
  }
  return { chosen, leftovers };
}

function shuffle(list) {
  for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
  return list;
}

async function generate(s) {
  log('Collecting songs from your sources...');
  const candidates = filterPool(await buildPool(s), s);
  log(`${candidates.length} unique songs pass your filters.`);
  const warnings = [];

  const recent = store.get('history', []).slice(0, Math.max(0, s.avoid_repeats_playlists)).flatMap(p => p.tracks);
  const recentIds = new Set(recent.map(r => r.id)), recentKeys = new Set(recent.map(r => songKey(r.title, r.artist)));
  const isFresh = (t) => !recentIds.has(t.id) && !recentKeys.has(songKey(t.title, t.artist));
  const fresh = shuffle(candidates.filter(isFresh)), usedBefore = shuffle(candidates.filter(t => !isFresh(t)));
  // Fresh songs first; recently used ones only if there isn't enough fresh music.
  const { chosen, leftovers } = await fill([...fresh, ...usedBefore], s);

  const repeats = chosen.filter(t => !isFresh(t)).length;
  if (repeats) warnings.push(`${repeats} song(s) were used in your last ${s.avoid_repeats_playlists} playlists (not enough fresh songs). Add more sources to avoid this.`);
  const total = seconds(chosen);
  if (total < s.target_minutes * 60) warnings.push(`Only found ${Math.round(total / 60)} minutes of matching music. Loosen filters or add genres, keywords, artists or playlists.`);

  log('Looking up tempos...');
  for (const t of chosen) if (!('bpm' in t)) t.bpm = await bpmLookup(t);
  log('Done.');
  return { name: playlistName(s), tracks: chosen, leftovers, total_seconds: Math.round(total), pool_size: candidates.length, warnings };
}

// Swap one track for another from the unused candidates, keeping the length on target.
async function replaceTrack(result, index, s) {
  const { tracks, leftovers } = result, old = tracks[index];
  const target = s.target_minutes * 60, maxTotal = target + s.overshoot_minutes * 60;
  const base = seconds(tracks) - old.duration_ms / 1000;
  const counts = {};
  tracks.forEach((t, i) => { if (i !== index) counts[primaryArtist(t.artist)] = (counts[primaryArtist(t.artist)] || 0) + 1; });
  const inList = new Set(tracks.map(t => t.id));
  const fits = (t, strict) => {
    if (inList.has(t.id)) return false;
    if (s.max_per_artist && (counts[primaryArtist(t.artist)] || 0) >= s.max_per_artist) return false;
    const total = base + t.duration_ms / 1000;
    return !strict || (target <= total && total <= maxTotal);
  };
  for (const strict of [true, false]) {
    for (const t of [...leftovers]) {
      if (fits(t, strict) && await detailsOk(t, s) && await bpmOk(t, s)) {
        leftovers.splice(leftovers.indexOf(t), 1);
        if (!('bpm' in t)) t.bpm = await bpmLookup(t);
        tracks[index] = t;
        leftovers.push(old);
        result.total_seconds = Math.round(seconds(tracks));
        return;
      }
    }
  }
  throw new Error('No other songs available that match your filters.');
}

function playlistName(s) {
  const now = new Date(), pad = (n) => String(n).padStart(2, '0');
  // ISO week number
  const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const week = Math.ceil(((d - Date.UTC(d.getUTCFullYear(), 0, 1)) / DAY + 1) / 7);
  return s.playlist_name
    .replaceAll('{date}', `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`)
    .replaceAll('{month}', now.toLocaleString('en-GB', { month: 'long', year: 'numeric' }))
    .replaceAll('{week}', `Week ${week} ${d.getUTCFullYear()}`);
}

/* ---------- Spotify (sign-in per playlist; the token only ever lives in a local variable) ---------- */
// Must match the Redirect URI registered for the Spotify app exactly.
const REDIRECT_URI = location.origin + location.pathname.replace(/index\.html$/, '');
const PENDING = 'cpb:pending';
const clientId = () => store.get('client_id', '');
const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const randomString = (n) => b64url(crypto.getRandomValues(new Uint8Array(n)));

async function startSpotifySignIn() {
  const verifier = randomString(64), state = randomString(16);
  // The page reloads when Spotify sends you back, so the playlist waits in this tab's session storage.
  sessionStorage.setItem(PENDING, JSON.stringify({ verifier, state, current }));
  const challenge = b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
  location.assign('https://accounts.spotify.com/authorize?' + new URLSearchParams({
    client_id: clientId(), response_type: 'code', redirect_uri: REDIRECT_URI, scope: 'playlist-modify-private', state,
    code_challenge_method: 'S256', code_challenge: challenge, show_dialog: 'true' }));
}

async function spotifyToken(code, verifier) {
  const r = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI, client_id: clientId(), code_verifier: verifier }) });
  if (!r.ok) throw new Error('Spotify sign-in failed: ' + (await r.text()).slice(0, 200));
  return (await r.json()).access_token;
}

async function spotify(token, method, path, params, body) {
  const url = 'https://api.spotify.com/v1' + path + (params ? '?' + new URLSearchParams(params) : '');
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(url, { method, headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined });
    const text = await r.text();
    if (r.status === 429 && !text.includes('QUOTA_EXCEEDED')) { await sleep(Math.min(+r.headers.get('Retry-After') || 5, 30) * 1000); continue; }
    if (!r.ok) throw new Error(`Spotify error (HTTP ${r.status}): ${text.slice(0, 200)}`);
    return text ? JSON.parse(text) : null;
  }
  throw new Error('Spotify is busy, try again in a minute.');
}

// The Spotify URI for a song found elsewhere, or null if Spotify doesn't have it.
async function matchOnSpotify(token, t, s) {
  const artist = leadArtist(t.artist), title = clean(t.title).replaceAll('"', '');
  const queries = [`track:${title} artist:${artist}`, `${artist} ${title}`];
  if (t.isrc) queries.unshift(`isrc:${t.isrc}`);
  const excluded = s.exclude_words.map(w => wordRe(w.toLowerCase()));
  for (const q of queries) {
    const sameRecording = q.startsWith('isrc:');
    const data = await spotify(token, 'GET', '/search', { q, type: 'track', limit: 10, market: s.country.toUpperCase() });
    const ok = (((data || {}).tracks || {}).items || []).filter(c => {
      if (!c || c.is_playable === false || (c.explicit && !s.allow_explicit)) return false;
      if (sameRecording) return true;
      const names = (c.artists || []).map(a => norm(a.name || ''));
      if (!names.some(n => n && (n.includes(norm(artist)) || norm(artist).includes(n)))) return false;
      if (norm(clean(c.name || '')) !== norm(title)) return false;
      // Same title but a different length is usually another version (live, remix, edit).
      if (Math.abs(c.duration_ms - t.duration_ms) > 15000) return false;
      return !excluded.some(re => re.test((c.name || '').toLowerCase()));
    });
    if (ok.length) return ok.reduce((a, b) => Math.abs(a.duration_ms - t.duration_ms) <= Math.abs(b.duration_ms - t.duration_ms) ? a : b).uri;
  }
  log(`Not on Spotify: ${t.artist} - ${t.title}`);
  return null;
}

async function sendToSpotify(code, verifier) {
  const s = S;
  $('pushBtn').disabled = true; $('genBtn').disabled = true; $('pushBtn').textContent = 'Sending…';
  $('progressBox').classList.remove('hidden'); $('log').textContent = '';
  try {
    const token = await spotifyToken(code, verifier);
    log('Signed in. Finding your songs on Spotify...');
    const found = [], missing = [];
    for (const t of current.tracks) {
      t.spotify_uri = await matchOnSpotify(token, t, s);
      (t.spotify_uri ? found : missing).push(t);
    }
    // Top up from the unused songs so the playlist still fills the class.
    const target = s.target_minutes * 60, maxTotal = target + s.overshoot_minutes * 60, perArtist = {};
    found.forEach(t => { perArtist[primaryArtist(t.artist)] = (perArtist[primaryArtist(t.artist)] || 0) + 1; });
    let total = seconds(found);
    if (missing.length) log('Replacing songs Spotify does not have...');
    for (const t of missing.length ? [...current.leftovers] : []) {
      if (total >= target) break;
      const artist = primaryArtist(t.artist);
      if (total + t.duration_ms / 1000 > maxTotal || (s.max_per_artist && (perArtist[artist] || 0) >= s.max_per_artist)) continue;
      if (!(await detailsOk(t, s) && await bpmOk(t, s))) continue;
      t.spotify_uri = await matchOnSpotify(token, t, s);
      if (!t.spotify_uri) continue;
      if (!('bpm' in t)) t.bpm = await bpmLookup(t);
      current.leftovers.splice(current.leftovers.indexOf(t), 1);
      found.push(t);
      total += t.duration_ms / 1000;
      perArtist[artist] = (perArtist[artist] || 0) + 1;
    }
    if (!found.length) throw new Error('None of these songs were found on Spotify.');

    const playlist = await spotify(token, 'POST', '/me/playlists', null, { name: current.name, description: s.description, public: false });
    const uris = found.map(t => t.spotify_uri);
    for (let i = 0; i < uris.length; i += 100) await spotify(token, 'POST', `/playlists/${playlist.id}/items`, null, { uris: uris.slice(i, i + 100) });

    current.tracks = found;
    current.total_seconds = Math.round(total);
    const history = store.get('history', []);
    history.unshift({ created_at: new Date().toISOString(), name: current.name, total_seconds: current.total_seconds,
      tracks: found.map(t => ({ id: t.id, title: t.title, artist: t.artist })) });
    store.set('history', history.slice(0, 30));
    renderResult(); renderHistory();
    $('progressBox').classList.add('hidden');
    const link = (playlist.external_urls || {}).spotify;
    message('ok', `Created "${current.name}" with ${found.length} songs in your Spotify library. You are signed out of this page again.`,
      link ? ` <a href="${esc(link)}" target="_blank" rel="noopener">Open in Spotify</a>` : '');
    if (missing.length) message('warn', `${missing.length} song(s) weren't on Spotify and were swapped or left out: ${missing.map(t => `${t.artist} - ${t.title}`).join('; ')}`);
  } catch (e) {
    message('err', e.message);
  }
  $('pushBtn').disabled = !current.tracks.length; $('genBtn').disabled = false; $('pushBtn').textContent = '⬆ Send to Spotify';
}

/* ---------- UI ---------- */
let S = { ...DEFAULTS, ...store.get('settings', {}) }, current = null;
const LIST_KEYS = ['genres', 'keywords', 'artists', 'seed_playlists', 'exclude_artists', 'exclude_words'];
LIST_KEYS.forEach(k => { if (!Array.isArray(S[k])) S[k] = []; });

const fmt = (sec) => { sec = Math.round(sec); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`; };
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function message(kind, text, trustedHtml = '') { $('messages').insertAdjacentHTML('beforeend', `<div class="msg ${kind}">${esc(text)}${trustedHtml}</div>`); }

function renderSettings() {
  root.querySelectorAll('[data-k]').forEach(el => {
    const v = S[el.dataset.k];
    if (el.type === 'checkbox') el.checked = !!v; else el.value = v ?? '';
  });
  root.querySelectorAll('[data-list]').forEach(renderChipbox);
  $('genreChips').innerHTML = Object.keys(GENRE_IDS).map(g => `<span class="chip ${S.genres.includes(g) ? 'on' : ''}" data-g="${esc(g)}">${esc(g)}</span>`).join('');
}
function renderChipbox(box) {
  const key = box.dataset.list;
  box.innerHTML = `<div class="chips">${S[key].map((v, i) => `<span class="chip" title="${esc(v)}">${esc(v)}<button data-i="${i}" aria-label="remove">×</button></span>`).join('')}</div>
    <input type="text" placeholder="Type and press Enter…">`;
  box.querySelectorAll('button').forEach(b => b.onclick = () => { S[key].splice(+b.dataset.i, 1); renderChipbox(box); save(); });
  const input = box.querySelector('input');
  input.onkeydown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && input.value.trim()) {
      e.preventDefault();
      input.value.split(',').map(v => v.trim()).filter(Boolean).forEach(v => { if (!S[key].includes(v)) S[key].push(v); });
      renderChipbox(box); box.querySelector('input').focus(); save();
    }
  };
}
$('genreChips').onclick = (e) => {
  const g = e.target.dataset?.g; if (!g) return;
  S.genres = S.genres.includes(g) ? S.genres.filter(x => x !== g) : [...S.genres, g];
  e.target.classList.toggle('on'); save();
};
function collectSettings() {
  root.querySelectorAll('[data-k]').forEach(el => {
    S[el.dataset.k] = el.type === 'checkbox' ? el.checked : (el.type === 'number' ? (el.value === '' ? null : Number(el.value)) : el.value);
  });
  // Pending text typed into a chip box but not yet "Entered"
  root.querySelectorAll('[data-list]').forEach(box => {
    const v = box.querySelector('input').value.trim();
    if (v && !S[box.dataset.list].includes(v)) S[box.dataset.list].push(v);
    box.querySelector('input').value = '';
  });
  ['target_minutes', 'overshoot_minutes', 'min_song_minutes', 'max_song_minutes', 'max_per_artist', 'avoid_repeats_playlists']
    .forEach(k => { S[k] = S[k] || 0; });
  S.country = (S.country || 'us').trim().toLowerCase();
  if (S.country === 'uk') S.country = 'gb';
  return S;
}
function save() { store.set('settings', collectSettings()); }
root.addEventListener('change', (e) => { if (e.target.dataset?.k) save(); });

$('genBtn').onclick = async () => {
  save();
  $('genBtn').disabled = true; $('pushBtn').disabled = true; $('messages').innerHTML = '';
  $('genBtn').textContent = 'Generating…'; $('progressBox').classList.remove('hidden'); $('log').textContent = '';
  try {
    current = await generate(S);
    renderResult(); $('progressBox').classList.add('hidden');
  } catch (e) { message('err', e.message); }
  $('genBtn').disabled = false; $('genBtn').textContent = '🎲 Generate again';
};

function renderResult() {
  if (!current) return;
  $('emptyState').classList.add('hidden'); $('result').classList.remove('hidden');
  $('pushBtn').disabled = !current.tracks.length;
  if (root.activeElement !== $('plName')) $('plName').value = current.name;
  $('messages').innerHTML = ''; (current.warnings || []).forEach(w => message('warn', w));
  $('stTime').textContent = fmt(current.total_seconds);
  $('stCount').textContent = current.tracks.length;
  const bpms = current.tracks.map(t => t.bpm).filter(Boolean);
  $('stBpm').textContent = bpms.length ? Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length) : '–';
  $('stPool').textContent = current.pool_size;
  $('stBar').style.width = Math.min(100, current.total_seconds / (S.target_minutes * 60) * 100) + '%';
  $('tracks').innerHTML = current.tracks.map((t, i) => `
    <tr>
      <td class="num">${i + 1}</td>
      <td class="art">${t.artwork ? `<img src="${esc(t.artwork)}" alt="" loading="lazy">` : ''}</td>
      <td><div class="t">${esc(t.title)}${t.explicit ? ' <span title="Explicit">🅴</span>' : ''}</div><div class="a">${esc(t.artist)}${t.genre ? ' · ' + esc(t.genre) : ''}</div></td>
      <td class="meta">${t.bpm ? Math.round(t.bpm) + ' BPM' : '— BPM'}<br>${fmt(t.duration_ms / 1000)}</td>
      <td class="tools">
        ${t.preview_url ? `<button class="icon" data-play="${i}" title="Preview">▶</button>` : ''}
        <button class="icon" data-swap="${i}" title="Swap for another song">↻</button>
        <button class="icon" data-del="${i}" title="Remove">✕</button>
      </td>
    </tr>`).join('');
}

$('tracks').onclick = async (e) => {
  const b = e.target.closest('button'); if (!b) return;
  try {
    if (b.dataset.play !== undefined) return togglePreview(b, current.tracks[+b.dataset.play]);
    b.disabled = true;
    if (b.dataset.swap !== undefined) await replaceTrack(current, +b.dataset.swap, S);
    if (b.dataset.del !== undefined) {
      current.leftovers.push(...current.tracks.splice(+b.dataset.del, 1));
      current.total_seconds = Math.round(seconds(current.tracks));
    }
    renderResult();
  } catch (err) { b.disabled = false; message('err', err.message); }
};

let playingBtn = null;
function togglePreview(btn, t) {
  const audio = $('audio');
  if (playingBtn === btn) { audio.pause(); btn.classList.remove('playing'); btn.textContent = '▶'; playingBtn = null; return; }
  if (playingBtn) { playingBtn.classList.remove('playing'); playingBtn.textContent = '▶'; }
  audio.src = t.preview_url; audio.play(); btn.classList.add('playing'); btn.textContent = '❚❚'; playingBtn = btn;
  audio.onended = () => { btn.classList.remove('playing'); btn.textContent = '▶'; playingBtn = null; };
}

function showSetup() { $('setupCard').classList.toggle('hidden', !!clientId()); $('clientForget').classList.toggle('hidden', !clientId()); }
$('clientSave').onclick = () => { store.set('client_id', $('clientId').value.trim()); $('clientId').value = ''; showSetup(); };
$('clientForget').onclick = (e) => { e.preventDefault(); localStorage.removeItem('cpb:client_id'); showSetup(); };

$('pushBtn').onclick = async () => {
  if (!clientId()) {
    $('messages').innerHTML = ''; message('err', 'Enter your Spotify Client ID in the "Spotify setup" box first.');
    $('setupCard').scrollIntoView({ behavior: 'smooth' }); return;
  }
  current.name = $('plName').value.trim() || current.name;
  $('pushBtn').disabled = true; $('pushBtn').textContent = 'Opening Spotify…';
  try { await startSpotifySignIn(); } catch (e) { message('err', e.message); $('pushBtn').disabled = false; $('pushBtn').textContent = '⬆ Send to Spotify'; }
};

function renderHistory() {
  const h = store.get('history', []);
  $('history').innerHTML = h.length ? h.map(p => `
    <details class="hist"><summary><b>${esc(p.name)}</b> <span class="hint">${p.tracks.length} songs · ${fmt(p.total_seconds)}</span><span class="when">${esc(p.created_at.replace('T', ' ').slice(0, 16))}</span></summary>
    <ol>${p.tracks.map(t => `<li>${esc(t.artist)} — ${esc(t.title)}</li>`).join('')}</ol></details>`).join('')
    : '<p class="hint">Playlists you send to Spotify from this device will show up here.</p>';
}

/* ---------- boot ---------- */
renderSettings();
renderHistory();
showSetup();
const query = new URLSearchParams(location.search);
if (query.has('code') || query.has('error')) {
  // Back from Spotify: pick up the waiting playlist and finish sending it.
  let pending = null;
  try { pending = JSON.parse(sessionStorage.getItem(PENDING)); } catch { /* nothing waiting */ }
  sessionStorage.removeItem(PENDING);
  history.replaceState(null, '', location.pathname);
  if (pending) { current = pending.current; renderResult(); }
  if (query.has('error')) message('err', 'Spotify sign-in was cancelled.');
  else if (!pending || pending.state !== query.get('state')) message('err', 'That sign-in attempt has expired. Generate a playlist and send it again.');
  else sendToSpotify(query.get('code'), pending.verifier);
}
})();
