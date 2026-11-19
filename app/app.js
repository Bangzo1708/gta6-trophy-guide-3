// Vice Nights — GTA VI trophy guide & tracker.
// Static, offline: the only file it fetches is its own data/trophies.json.
// Progress lives in localStorage; export/import moves it as a file.
const KEY = 'vice-nights-progress-v1';
const HUNDRED_KEY = 'vice-nights-hundred-v1';
const SPOILER_KEY = 'vice-nights-spoiler-v1';
const RING_C = 2 * Math.PI * 52;

const $ = (id) => document.getElementById(id);
const listEl = $('trophyList');
const panelEl = $('guidePanel');
const nextListEl = $('nextList');
const nextNoteEl = $('nextNote');
const resultLineEl = $('resultLine');

const KINDS = [
  ['all', 'All'],
  ['story', 'Story'],
  ['missable', 'Missable'],
  ['collectibles', 'Collectibles'],
  ['activities', 'Activities'],
  ['side', 'Side strands'],
  ['platinum', 'Platinum'],
];
const KIND_LABEL = {
  story: 'Story', missable: 'Missable', collectibles: 'Collectibles',
  activities: 'Activities', side: 'Side strand', platinum: 'Platinum',
};
// The 100% completion checklist (PowerPyx, 18 Nov 2026; counts: PSNProfiles).
const HUNDRED = [
  ['Finish the story', '—', 'All story trophies'],
  ['Optional missions', '100', 'A Long Road'],
  ['Challenges', '70 of 80', 'One Last Thing · A Long Road'],
  ['Stunts', '300', 'Cunning Stunts · A Long Road'],
  ['Vehicles scanned (WAiNK)', '200 of 277', 'Whip It Good · A Long Road'],
  ['Animals studied (binoculars)', '100 of 255', 'A Long Road'],
  ['Collectible Card sets', '15 of 18', "Don't Touch My Deck · A Long Road"],
  ['Meditation spots', '15 of 18', 'Positive Mental Attitude · A Long Road'],
  ['Bank vaults robbed', '8', 'Maximum Withdrawal · A Long Road'],
  ['Illegal operations robbed', '39', 'Pest Control · A Long Road'],
  ['Shooting Range gold medals', '42', 'The Shootist · A Long Road'],
  ['Top Fun Drone Race wins', '14 locations', 'Top Fun · A Long Road'],
  ["Bret's target decks cleared", '15', 'Fair Game · A Long Road'],
];

let trophies = [];
let earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));
let hundredDone = new Set(JSON.parse(localStorage.getItem(HUNDRED_KEY) ?? '[]'));
let spoilerOn = localStorage.getItem(SPOILER_KEY) !== 'false';
let kindFilter = 'all';
let gradeFilter = 'all';
let searchText = '';
let onlyUnearned = false;
let selectedId = 28; // Positive Mental Attitude: the one missable, shown on load.

function saveProgress() {
  localStorage.setItem(KEY, JSON.stringify([...earned].sort()));
}
function saveHundred() {
  localStorage.setItem(HUNDRED_KEY, JSON.stringify([...hundredDone].sort()));
}
function isLocked(t) {
  return t.hidden && spoilerOn && !earned.has(t.name);
}
function trophyById(id) {
  return trophies.find((t) => t.id === id);
}
function gradeWord(t) {
  return t.grade.charAt(0).toUpperCase() + t.grade.slice(1);
}

function renderRing() {
  const n = earned.size;
  const total = trophies.length || 55;
  $('ringCount').textContent = n;
  $('ringFg').style.strokeDasharray = String(RING_C);
  $('ringFg').style.strokeDashoffset = String(RING_C * (1 - n / total));
}

function visibleTrophies() {
  return trophies.filter((t) => {
    if (kindFilter !== 'all' && t.kind !== kindFilter) return false;
    if (gradeFilter !== 'all' && t.grade !== gradeFilter) return false;
    if (onlyUnearned && earned.has(t.name)) return false;
    if (searchText) {
      if (isLocked(t)) return false; // never leak a hidden name through search
      const hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
      if (!hay.includes(searchText)) return false;
    }
    return true;
  });
}

function rowHtml(t) {
  const locked = isLocked(t);
  const done = earned.has(t.name);
  const name = locked ? 'Hidden trophy' : t.name;
  const desc = locked
    ? 'Hidden until earned — ' + (t.kind === 'story' ? 'story trophy.' : 'side trophy.')
    : t.description;
  const gradeLabel = locked ? '?' : gradeWord(t).toUpperCase();
  const badges = [];
  if (!locked && t.missable) badges.push('<span class="badge miss">MISSABLE</span>');
  if (!locked && t.unconfirmed) badges.push('<span class="badge unconf">NOT CONFIRMED</span>');
  const count = !locked && t.count != null
    ? `<span class="count">Target: ${t.count.toLocaleString('en-US')}</span>` : '';
  const kind = locked ? '' : `<span class="kind-tag">${KIND_LABEL[t.kind] ?? t.kind}</span>`;
  return `<button type="button" class="row${done ? ' done' : ''}${locked ? ' locked' : ''}${t.id === selectedId ? ' selected' : ''}" data-id="${t.id}">
    <span class="box" data-toggle="${t.id}" role="checkbox" aria-checked="${done}" aria-label="Earned: ${locked ? 'hidden trophy' : t.name}">${done ? '&#10003;' : ''}</span>
    <span class="med ${locked ? 'hidden' : t.grade}"></span>
    <span class="t-main"><span class="t-name">${name}${badges.join('')}</span><span class="t-desc">${desc}</span></span>
    <span class="t-side"><span class="grade ${locked ? '' : t.grade}">${gradeLabel}</span>${count}${kind}</span>
  </button>`;
}

function renderList() {
  const shown = visibleTrophies();
  listEl.innerHTML = shown.map(rowHtml).join('');
  $('emptyNote').hidden = shown.length > 0;
  const done = earned.size;
  resultLineEl.textContent =
    `Showing ${shown.length} of ${trophies.length} trophies · ${done} earned (${Math.round((done / trophies.length) * 100)}%) · ` +
    (spoilerOn ? 'Spoilers hidden: 28 hidden trophies stay locked until earned.' : 'Spoilers off: all 55 names visible.');
}

function renderPanel() {
  const t = trophyById(selectedId) ?? trophies[0];
  if (!t) { panelEl.innerHTML = ''; return; }
  if (isLocked(t)) {
    panelEl.innerHTML = `<h2>Hidden trophy</h2>
      <p class="meta">HIDDEN &middot; SPOILER SAFE</p>
      <p class="locked-note">This is one of the 28 hidden trophies. Its name and description stay hidden until you earn it — that is how PlayStation shows it too. Tick it off in the checklist once it pops and the guide will open here.</p>
      <p class="src">Tip: hidden trophies are the 12 story trophies and 16 side ones. They are never missable except through the story itself — just keep playing.</p>`;
    return;
  }
  const meta = [gradeWord(t).toUpperCase(), KIND_LABEL[t.kind] ?? t.kind.toUpperCase()];
  if (t.missable && t.kind !== 'missable') meta.push('MISSABLE');
  if (t.count != null) meta.push(`TARGET ${t.count.toLocaleString('en-US')}`);
  if (t.unconfirmed) meta.push('METHOD NOT YET CONFIRMED');
  const paras = t.guide.split(/(?<=[.!?])\s+(?=[A-Z“"])/).map((p) => `<p>${p}</p>`).join('');
  panelEl.innerHTML = `<h2>${t.name}</h2>
    <p class="meta">${meta.join(' &middot; ')}</p>
    <p class="desc">&ldquo;${t.description}&rdquo; — official description, as PlayStation publishes it.</p>
    <p class="src"><b>Sources:</b> ${t.sources.join('; ')}.</p>
    <div class="guide">${paras}</div>`;
}

function nextUp() {
  // Spoiler-safe: only visible trophies (or earned hidden ones) can be suggested.
  const pool = trophies
    .filter((t) => !earned.has(t.name) && !isLocked(t) && t.kind !== 'platinum')
    .sort((a, b) => (a.step - b.step) || (a.id - b.id));
  const picks = pool.slice(0, 5);
  nextNoteEl.textContent = picks.length
    ? 'Suggested next, in roadmap order. Hidden trophies join this list once you earn them — they are never named here first.'
    : 'Everything visible is earned. Hidden trophies will appear here once you earn them.';
  nextListEl.innerHTML = picks.length
    ? picks.map((t) => `<li data-id="${t.id}"><b>${t.name}</b><span class="why">Step ${t.step} · ${KIND_LABEL[t.kind] ?? t.kind}${t.count != null ? ` · target ${t.count.toLocaleString('en-US')}` : ''}${t.missable ? ' · do it early, it can be missed' : ''}</span></li>`).join('')
    : '<li class="none">Nothing left to suggest — the platinum is yours.</li>';
}

function renderAll() {
  renderRing();
  renderList();
  renderPanel();
  nextUp();
}

function buildKindChips() {
  $('kindChips').innerHTML = KINDS.map(([v, label]) =>
    `<button type="button" class="chip${v === kindFilter ? ' on' : ''}" data-kind="${v}">${label}</button>`).join('');
}

function setView(name) {
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('on', b.dataset.view === name));
  $('view-checklist').hidden = name !== 'checklist';
  $('view-roadmap').hidden = name !== 'roadmap';
  $('view-missables').hidden = name !== 'missables';
  if (location.hash !== '#/' + name) history.replaceState(null, '', '#/' + name);
}

function renderHundred() {
  $('hundredBody').innerHTML = HUNDRED.map(([req, target, feeds], i) =>
    `<tr class="${hundredDone.has(String(i)) ? 'done' : ''}"><td><input type="checkbox" data-hundred="${i}" ${hundredDone.has(String(i)) ? 'checked' : ''} aria-label="${req}"></td><td>${req}</td><td>${target}</td><td>${feeds}</td></tr>`).join('');
}

// ---- events ----
listEl.addEventListener('click', (e) => {
  const toggle = e.target.closest('[data-toggle]');
  if (toggle) {
    const t = trophyById(Number(toggle.dataset.toggle));
    if (t) {
      if (earned.has(t.name)) earned.delete(t.name);
      else earned.add(t.name);
      saveProgress();
      selectedId = t.id;
      renderAll();
    }
    return;
  }
  const row = e.target.closest('.row');
  if (row) { selectedId = Number(row.dataset.id); renderList(); renderPanel(); }
});
nextListEl.addEventListener('click', (e) => {
  const li = e.target.closest('li[data-id]');
  if (!li) return;
  selectedId = Number(li.dataset.id);
  renderList();
  renderPanel();
  document.querySelector('.aside').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});
$('kindChips').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-kind]');
  if (!chip) return;
  kindFilter = chip.dataset.kind;
  buildKindChips();
  renderList();
});
$('gradeFilter').addEventListener('change', (e) => { gradeFilter = e.target.value; renderList(); });
$('search').addEventListener('input', (e) => { searchText = e.target.value.trim().toLowerCase(); renderList(); });
$('onlyUnearned').addEventListener('change', (e) => { onlyUnearned = e.target.checked; renderList(); });
$('spoilerToggle').addEventListener('change', (e) => {
  spoilerOn = e.target.checked;
  localStorage.setItem(SPOILER_KEY, String(spoilerOn));
  renderAll();
});
$('roadmapStrip').addEventListener('click', () => setView('roadmap'));
$('roadmapStrip').addEventListener('keydown', (e) => { if (e.key === 'Enter') setView('roadmap'); });
document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
$('missableBanner').addEventListener('click', (e) => {
  const link = e.target.closest('[data-open-trophy]');
  if (!link) return;
  const t = trophies.find((x) => x.name === link.dataset.openTrophy);
  if (t) { selectedId = t.id; renderList(); renderPanel(); }
});
$('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned].sort(), exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'vice-nights-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
$('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = new Set(trophies.map((t) => t.name));
    const imported = (Array.isArray(data) ? data : data.earned ?? []).filter((n) => names.has(n));
    earned = new Set(imported);
    saveProgress();
    renderAll();
  } catch {
    resultLineEl.textContent = 'That file could not be imported — it is not a Vice Nights progress file.';
  }
  e.target.value = '';
});
$('resetBtn').addEventListener('click', () => {
  if (!earned.size) return;
  if (window.confirm('Clear all earned ticks? This cannot be undone (export first if you want a backup).')) {
    earned = new Set();
    saveProgress();
    renderAll();
  }
});
$('hundredBody').addEventListener('change', (e) => {
  const box = e.target.closest('[data-hundred]');
  if (!box) return;
  const i = box.dataset.hundred;
  if (box.checked) hundredDone.add(i);
  else hundredDone.delete(i);
  saveHundred();
  renderHundred();
});

// ---- boot ----
const doc = await (await fetch('data/trophies.json')).json();
trophies = doc.trophies;
if (!trophyById(selectedId)) selectedId = trophies[0]?.id ?? 0;
$('spoilerToggle').checked = spoilerOn;
buildKindChips();
renderHundred();
const startView = (location.hash.replace('#/', '') || 'checklist');
setView(['checklist', 'roadmap', 'missables'].includes(startView) ? startView : 'checklist');
renderAll();
