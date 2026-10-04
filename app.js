'use strict';
const $ = (s) => document.querySelector(s);
const KEY = 'cozydesk.v1';
const def = { xp: 0, tasks: [], notes: [], pomos: 0, mode: { sleepy: false, focus: false, quiet: false, privacy: false } };
let S = Object.assign({}, def, JSON.parse(localStorage.getItem(KEY) || '{}'));
const save = () => localStorage.setItem(KEY, JSON.stringify(S));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
const esc = (t) => t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- Bunny ---------- */
const W = 'M91 144 Q95.5 151 100 144 Q104.5 151 109 144';
const MOODS = {
  happy: [W, 1], neutral: ['M94 146 Q100 148 106 146', 1], sleepy: ['M95 146 Q100 149 105 146', 0.3],
  excited: ['M91 143 Q100 160 109 143 Z', 1.12, '#ff8fab'], sad: ['M93 150 Q100 142 107 150', 0.9], surprised: ['M96 144 Q100 158 104 144 Q100 141 96 144 Z', 1.2, '#ff8fab'],
  bored: ['M94 147 L106 147', 0.6], playful: ['M92 144 Q100 158 108 144 Z', 1, '#ff8fab'], focused: ['M95 146 L105 146', 0.8], curious: ['M94 148 Q100 143 106 148', 1.1], confused: ['M93 149 Q97 143 101 149 T108 146', 1]
};
function mood(m) {
  const [d, s, f] = MOODS[m] || MOODS.happy;
  $('#mouth').setAttribute('d', d);
  $('#mouth').setAttribute('fill', f || 'none');
  $('#bunny').style.setProperty('--es', s);
}
function bounce() {
  const b = $('#bunny'); b.classList.remove('bounce'); void b.getBoundingClientRect(); b.classList.add('bounce');
}

/* ---------- Speech (random + cooldown) ---------- */
const LINES = {
  idle: ['Hey… are you still there? 👀', "Let's get something done today. ✨", "I'm bored. Game?", 'Did somebody say snacks?', 'You have been busy. Water break? 💧'],
  poke: ['Hehe, that tickles!', 'Boop! 🌷', 'Hi hi hi!', 'Yes? I was napping… almost.'],
  task: ['YESSS! Another one done! 🎉', 'Task crushed! ✨', 'Look at you go!'],
  timer: ['We did it! Take a tiny break. 🌷', 'Focus session complete! 🌷'],
  note: ['Got it! I will keep that safe. 🤫', 'Saved, locally on your PC.'],
  sleep: ["I'm sleepy…", 'Five more minutes? 🥺', 'Good night… 😴'],
  ignored: ["Wow. I'm invisible now? 😭"]
};
let lastSay = 0, lastAct = Date.now(), hideT;
const pick = (a) => a[Math.floor(Math.random() * a.length)];
function say(kind, force) {
  const quiet = S.mode.quiet || S.mode.sleepy || S.mode.privacy || S.mode.focus;
  if (!force && (quiet || Date.now() - lastSay < 60000)) return;
  lastSay = Date.now();
  const b = $('#bubble'); b.textContent = pick(LINES[kind]); b.classList.add('show');
  clearTimeout(hideT); hideT = setTimeout(() => b.classList.remove('show'), 4500);
}
// One low-frequency check (every 45s) instead of constant polling.
setInterval(() => {
  if (document.hidden) return;
  const idle = Date.now() - lastAct;
  if (idle > 600000) { mood('sad'); say('ignored'); }
  else if (Math.random() < 0.5) { mood(pick(['happy', 'curious', 'playful', 'bored'])); say('idle'); }
}, 45000);
document.addEventListener('pointerdown', () => (lastAct = Date.now()));
$('#bunny').addEventListener('click', () => { mood('excited'); bounce(); say('poke', true); setTimeout(applyMood, 2500); });

/* ---------- XP ---------- */
const lvlOf = (xp) => { let l = 1, need = 100; while (xp >= need) { xp -= need; l++; need = l * 100; } return { l, cur: xp, need }; };
function addXP(n) { S.xp += n; save(); renderStats(); }
function renderStats() {
  const { l, cur, need } = lvlOf(S.xp);
  $('#lvl').textContent = 'Lv ' + l; $('#xpTxt').textContent = `${cur}/${need}`; $('#xpFill').style.width = (cur / need) * 100 + '%';
  const open = S.tasks.filter((t) => !t.done).length;
  $('#homeSummary').textContent = `${open} open task(s) · ${S.notes.length} note(s) · ${S.pomos} focus session(s) completed.`;
}

/* ---------- Modes ---------- */
function applyMood() { mood(S.mode.sleepy ? 'sleepy' : S.mode.focus ? 'focused' : 'happy'); }
function applyModes() {
  const m = S.mode;
  document.body.classList.toggle('sleepy', m.sleepy); document.body.classList.toggle('focus', m.focus);
  document.body.classList.toggle('quiet', m.quiet); document.body.classList.toggle('private', m.privacy);
  $('#btnSleep').classList.toggle('on', m.sleepy); $('#btnFocus').classList.toggle('on', m.focus);
  $('#btnQuiet').classList.toggle('on', m.quiet); $('#btnPrivacy').classList.toggle('on', m.privacy);
  $('#btnSleep').textContent = m.sleepy ? 'Wake up' : 'Sleepy';
  applyMood(); save();
}
const toggle = (k, line) => () => { S.mode[k] = !S.mode[k]; applyModes(); if (S.mode[k] && line) { $('#bubble').textContent = line; $('#bubble').classList.add('show'); setTimeout(() => $('#bubble').classList.remove('show'), 3500); } };
$('#btnSleep').onclick = toggle('sleepy', "I'm sleepy… good night… 😴");
$('#btnFocus').onclick = toggle('focus', "Focus mode ON. I'll stay quiet. 🤫");
$('#btnQuiet').onclick = toggle('quiet', 'Quiet mode ON. 🤍');
$('#btnPrivacy').onclick = toggle('privacy', 'Privacy mode ON. 🔒');

/* ---------- Tabs ---------- */
document.querySelectorAll('nav [data-tab]').forEach((b) => (b.onclick = () => {
  document.querySelectorAll('nav [data-tab]').forEach((x) => x.classList.toggle('active', x === b));
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.id === 'tab-' + b.dataset.tab));
}));

/* ---------- Tasks ---------- */
function renderTasks() {
  const order = { high: 0, med: 1, low: 2 };
  const list = [...S.tasks].sort((a, b) => a.done - b.done || order[a.prio] - order[b.prio]);
  $('#taskList').innerHTML = list.map((t) => `<li class="p-${t.prio} ${t.done ? 'done' : ''}" data-id="${t.id}">
    <input type="checkbox" ${t.done ? 'checked' : ''}><span class="grow">${esc(t.text)} ${t.due ? `<small class="muted">· ${t.due}</small>` : ''}</span><button class="del">✕</button></li>`).join('');
  renderStats();
}
$('#addTask').onclick = () => {
  const text = $('#taskText').value.trim(); if (!text) return;
  S.tasks.push({ id: uid(), text, prio: $('#taskPrio').value, due: $('#taskDue').value, done: false });
  $('#taskText').value = ''; save(); renderTasks();
};
$('#taskList').onclick = (e) => {
  const li = e.target.closest('li'); if (!li) return;
  const t = S.tasks.find((x) => x.id === li.dataset.id);
  if (e.target.classList.contains('del')) S.tasks = S.tasks.filter((x) => x !== t);
  else if (e.target.type === 'checkbox') {
    t.done = e.target.checked;
    if (t.done) { addXP(20); mood('excited'); bounce(); say('task', true); setTimeout(applyMood, 3000); }
  }
  save(); renderTasks();
};

/* ---------- Notes ---------- */
function renderNotes() {
  const q = $('#noteSearch').value.toLowerCase();
  const list = S.notes.filter((n) => n.text.toLowerCase().includes(q)).sort((a, b) => b.pin - a.pin || b.at - a.at);
  $('#noteList').innerHTML = list.map((n) => `<li data-id="${n.id}"><span class="grow">${n.pin ? '📌 ' : ''}${esc(n.text)}</span><button class="pin">Pin</button><button class="del">✕</button></li>`).join('');
  renderStats();
}
$('#noteText').value = localStorage.getItem('cozydesk.draft') || '';
$('#noteText').oninput = (e) => localStorage.setItem('cozydesk.draft', e.target.value); // auto-save draft
$('#noteSearch').oninput = renderNotes;
$('#addNote').onclick = () => {
  const text = $('#noteText').value.trim(); if (!text) return;
  S.notes.push({ id: uid(), text, pin: false, at: Date.now() });
  $('#noteText').value = ''; localStorage.removeItem('cozydesk.draft'); save(); renderNotes(); say('note', true);
};
$('#noteList').onclick = (e) => {
  const li = e.target.closest('li'); if (!li) return;
  const n = S.notes.find((x) => x.id === li.dataset.id);
  if (e.target.classList.contains('del')) S.notes = S.notes.filter((x) => x !== n);
  if (e.target.classList.contains('pin')) n.pin = !n.pin;
  save(); renderNotes();
};

/* ---------- Timer (interval only runs while active) ---------- */
let secs = 1500, total = 1500, tick = null, isFocus = true;
const fmt = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
function setTimer(min, focus) { stop(); secs = total = min * 60; isFocus = focus; $('#clock').textContent = fmt(secs); }
function stop() { clearInterval(tick); tick = null; }
function done() {
  stop(); const msg = isFocus ? 'Focus session complete! 🌷' : 'Break is over. Ready?';
  if (isFocus) { S.pomos++; addXP(50); save(); }
  mood('excited'); bounce(); say('timer', true); setTimeout(applyMood, 4000); renderStats();
  $('#pomoCount').textContent = `Focus sessions completed: ${S.pomos}`;
  if ('Notification' in window) { Notification.requestPermission().then((p) => p === 'granted' && new Notification('CozyDesk', { body: msg })); }
  secs = total; $('#clock').textContent = fmt(secs);
}
$('#tStart').onclick = () => {
  if (tick) return stop();
  tick = setInterval(() => { secs--; $('#clock').textContent = fmt(Math.max(secs, 0)); if (secs <= 0) done(); }, 1000);
};
$('#tFocus').onclick = () => setTimer(25, true);
$('#tBreak').onclick = () => setTimer(5, false);
$('#tReset').onclick = () => setTimer(total / 60, isFocus);

/* ---------- Windows helper ---------- */
document.querySelectorAll('[data-act]').forEach((b) => (b.onclick = () => window.cozy && window.cozy.systemAction(b.dataset.act)));
$('#resetAll').onclick = () => { if (confirm('Delete all CozyDesk data?')) { localStorage.clear(); location.reload(); } };

/* ---------- Init ---------- */
$('#pomoCount').textContent = `Focus sessions completed: ${S.pomos}`;
renderTasks(); renderNotes(); applyModes();
