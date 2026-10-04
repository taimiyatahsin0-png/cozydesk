'use strict';
/* CozyDesk part 3: Faith & Reflection, Wellness, optional private tracker */
const E = (S.ext2 = S.ext2 || {});
E.faith = Object.assign({ on: false, rel: 'none', lat: '', lng: '', tz: '', method: 'karachi', asr: 1, lead: 0, pray: false, custom: [], last: '' }, E.faith);
E.well = Object.assign({ water: { on: false, min: 60 }, stretch: { on: false, min: 60 }, eyes: { on: false, min: 20 }, screen: { on: false, min: 90 }, breathe: { on: false, min: 120 }, sleep: { on: false, time: '23:00' } }, E.well);
E.cycle = Object.assign({ on: false, len: 28, dur: 5, starts: [] }, E.cycle);
const askPerm = () => { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); };
const sysNotif = (t) => { if ('Notification' in window && Notification.permission === 'granted') new Notification('CozyDesk', { body: t, silent: true }); };

//PT-START  (prayer times computed locally from latitude, longitude, UTC offset and date)
const _r = Math.PI / 180;
const sin = (a) => Math.sin(a * _r), cos = (a) => Math.cos(a * _r), tan = (a) => Math.tan(a * _r);
const asin = (x) => Math.asin(x) / _r, acos = (x) => Math.acos(x) / _r, atan2 = (y, x) => Math.atan2(y, x) / _r, acot = (x) => Math.atan(1 / x) / _r;
const fx = (a, b) => { a = a - b * Math.floor(a / b); return a < 0 ? a + b : a; };
const METHODS = { karachi: [18, 18], mwl: [18, 17], isna: [15, 15], egypt: [19.5, 17.5], makkah: [18.5, 'm90'] };
function prayerTimes(date, lat, lng, tz, method, asrF) {
  let y = date.getFullYear(), M = date.getMonth() + 1; const D = date.getDate();
  if (M <= 2) { y--; M += 12; }
  const A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
  const jd0 = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (M + 1)) + D + B - 1524.5 - lng / 360;
  const sp = (t) => { const d = jd0 + t - 2451545; const g = fx(357.529 + 0.98560028 * d, 360), q = fx(280.459 + 0.98564736 * d, 360); const L = fx(q + 1.915 * sin(g) + 0.02 * sin(2 * g), 360); const e = 23.439 - 0.00000036 * d; const ra = fx(atan2(cos(e) * sin(L), cos(L)) / 15, 24); return { decl: asin(sin(e) * sin(L)), eqt: q / 15 - ra }; };
  const mid = (t) => fx(12 - sp(t).eqt, 24);
  const at = (ang, t, ccw) => { const dec = sp(t).decl; const T = acos((-sin(ang) - sin(dec) * sin(lat)) / (cos(dec) * cos(lat))) / 15; return mid(t) + (ccw ? -T : T); };
  const asr = (t) => { const dec = sp(t).decl; return at(-acot(asrF + tan(Math.abs(lat - dec))), t, false); };
  const [fa, ia] = METHODS[method] || METHODS.karachi, adj = tz - lng / 15;
  const mag = at(0.833, 18 / 24, false);
  const out = { Fajr: at(fa, 5 / 24, true) + adj, Dhuhr: mid(12 / 24) + adj, Asr: asr(13 / 24) + adj, Maghrib: mag + adj, Isha: (ia === 'm90' ? mag + 1.5 : at(ia, 18 / 24, false)) + adj };
  for (const k in out) { if (isNaN(out[k])) return null; out[k] = fx(out[k], 24); }
  return out;
}
//PT-END
const fmtH = (t) => { const m = Math.round(t * 60) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
function getPrayer() {
  const f = E.faith, lat = parseFloat(f.lat), lng = parseFloat(f.lng), tz = parseFloat(f.tz);
  if ([lat, lng, tz].some(isNaN) || Math.abs(lat) > 60) return null;
  return prayerTimes(new Date(), lat, lng, tz, f.method, +f.asr);
}

/* ---------- inject tabs ---------- */
[['faith', 'Faith'], ['wellness', 'Wellness']].forEach(([id, label]) => { const b = document.createElement('button'); b.dataset.tab = id; b.textContent = label; nav.insertBefore(b, $('.spacer')); });
sec('faith', `<h2>Faith &amp; Reflection</h2>
<p class="muted">Optional. No religion is the default and CozyDesk is not a religious authority. Turn it off any time.</p>
<label><input type="checkbox" id="fOn"> Enable this module</label>
<div id="fBody" class="hidden">
<div class="row wrap"><select id="fRel"></select></div>
<div id="fMuslim" class="hidden">
<p class="muted">Prayer times are calculated on this PC from your location and today's date. Nothing is sent anywhere.</p>
<div class="row wrap"><input id="fLat" placeholder="Latitude (e.g. 22.70)"><input id="fLng" placeholder="Longitude (e.g. 90.37)"><input id="fTz" placeholder="UTC offset (e.g. 6)"><button id="fTzBtn">Use this PC's offset</button></div>
<div class="row wrap"><select id="fMethod"><option value="karachi">Karachi (Univ. of Islamic Sciences)</option><option value="mwl">Muslim World League</option><option value="isna">ISNA</option><option value="egypt">Egyptian Authority</option><option value="makkah">Umm al-Qura (Makkah)</option></select>
<select id="fAsr"><option value="1">Asr: Shafi / Maliki / Hanbali</option><option value="2">Asr: Hanafi</option></select></div>
<div class="row wrap"><label class="muted"><input type="checkbox" id="fPray"> Remind me</label><label class="muted"><input type="number" id="fLead" min="0" max="60" size="3"> minutes before</label></div>
<ul id="fTimes"></ul></div>
<h3>Reminders</h3><div id="fChips" class="row wrap"></div>
<div class="row wrap"><input type="time" id="fTime"><input id="fLabel" placeholder="Label (prayer, meditation, reflection…)"><button id="fAdd">Add</button></div><ul id="fList"></ul></div>`);

sec('wellness', `<h2>Wellness</h2><p class="muted">Friendly reminders, not medical advice. They stay quiet in Focus, Quiet, Sleepy and Privacy modes.</p>
<ul id="wList"></ul>
<h3>Breathing break</h3><div class="row"><button id="bBtn">Start</button><span id="bTxt" class="muted"></span></div><div id="bCircle"></div>
<div id="cycleBox"><h3>Private tracker (optional)</h3>
<label><input type="checkbox" id="cOn"> Enable (stored only on this PC, hidden in Privacy mode)</label>
<div id="cBody" class="hidden"><div class="row wrap"><input type="date" id="cStart"><button id="cAdd">Log period start</button></div>
<div class="row wrap"><label class="muted">Cycle length <input type="number" id="cLen" min="20" max="45"></label><label class="muted">Period days <input type="number" id="cDur" min="1" max="10"></label></div>
<p class="muted" id="cNext"></p><ul id="cList"></ul></div></div>`);

nav.addEventListener('click', (e) => { const b = e.target.closest('[data-tab]'); if (!b) return; if (b.dataset.tab === 'faith') renderFaith(); if (b.dataset.tab === 'wellness') renderWell(); });

/* ---------- Faith ---------- */
const RELS = [['none', 'None / prefer not to say'], ['Muslim', 'Muslim'], ['Christian', 'Christian'], ['Hindu', 'Hindu'], ['Buddhist', 'Buddhist'], ['Jewish', 'Jewish'], ['Other', 'Other'], ['Custom', 'Custom']];
const CHIPS = { Muslim: ['Reflection'], Christian: ['Morning prayer', 'Evening prayer', 'Gratitude'], Hindu: ['Morning puja', 'Evening aarti', 'Meditation'], Buddhist: ['Meditation', 'Mindfulness', 'Evening chanting'], Jewish: ['Shacharit', 'Mincha', 'Maariv'], Other: ['Reflection', 'Meditation', 'Gratitude'], Custom: ['Reflection'], none: ['Reflection', 'Meditation', 'Gratitude'] };
function renderFaith() {
  const f = E.faith;
  $('#fOn').checked = f.on; $('#fBody').classList.toggle('hidden', !f.on);
  $('#fRel').innerHTML = RELS.map(([v, l]) => `<option value="${v}">${l}</option>`).join(''); $('#fRel').value = f.rel;
  $('#fMuslim').classList.toggle('hidden', f.rel !== 'Muslim');
  $('#fLat').value = f.lat; $('#fLng').value = f.lng; $('#fTz').value = f.tz; $('#fMethod').value = f.method; $('#fAsr').value = f.asr; $('#fPray').checked = f.pray; $('#fLead').value = f.lead;
  $('#fChips').innerHTML = (CHIPS[f.rel] || CHIPS.none).map((c) => `<button class="chip">${c}</button>`).join('');
  $('#fList').innerHTML = [...f.custom].sort((a, b) => a.time.localeCompare(b.time)).map((c) => `<li data-id="${c.id}"><span class="grow"><b>${c.time}</b> ${esc(c.label)}</span><button class="del">✕</button></li>`).join('');
  renderTimes();
}
function renderTimes() {
  const pt = getPrayer(), box = $('#fTimes');
  if (!pt) { box.innerHTML = '<li class="muted">Enter latitude, longitude and UTC offset to see today\'s times (very high latitudes are not supported).</li>'; return; }
  const cur = new Date().getHours() * 60 + new Date().getMinutes(); let nx = Object.keys(pt).find((k) => Math.round(pt[k] * 60) > cur) || 'Fajr';
  box.innerHTML = Object.entries(pt).map(([n, t]) => `<li class="${n === nx ? 'next' : ''}"><span class="grow">${n}</span><b>${fmtH(t)}</b></li>`).join('') + '<li class="muted">Calculated estimates. Check with your local mosque or authority.</li>';
}
const sf = () => { save(); renderTimes(); };
$('#fOn').onchange = (e) => { E.faith.on = e.target.checked; save(); renderFaith(); askPerm(); };
$('#fRel').onchange = (e) => { E.faith.rel = e.target.value; save(); renderFaith(); };
[['fLat', 'lat'], ['fLng', 'lng'], ['fTz', 'tz']].forEach(([id, k]) => ($('#' + id).onchange = (e) => { E.faith[k] = e.target.value.trim(); sf(); }));
$('#fTzBtn').onclick = () => { E.faith.tz = String(-new Date().getTimezoneOffset() / 60); $('#fTz').value = E.faith.tz; sf(); };
$('#fMethod').onchange = (e) => { E.faith.method = e.target.value; sf(); };
$('#fAsr').onchange = (e) => { E.faith.asr = +e.target.value; sf(); };
$('#fPray').onchange = (e) => { E.faith.pray = e.target.checked; save(); askPerm(); };
$('#fLead').onchange = (e) => { E.faith.lead = Math.min(60, Math.max(0, +e.target.value || 0)); save(); };
$('#fChips').onclick = (e) => { if (e.target.classList.contains('chip')) $('#fLabel').value = e.target.textContent; };
$('#fAdd').onclick = () => { const time = $('#fTime').value; if (!time) return; E.faith.custom.push({ id: uid(), time, label: $('#fLabel').value.trim() || 'Reminder' }); $('#fLabel').value = ''; save(); renderFaith(); askPerm(); };
$('#fList').onclick = (e) => { const li = e.target.closest('li'); if (li && e.target.classList.contains('del')) { E.faith.custom = E.faith.custom.filter((c) => c.id !== li.dataset.id); save(); renderFaith(); } };
setInterval(() => { // every 20s, only does work if the module is on
  const f = E.faith; if (!f.on) return;
  const now = new Date(), hhmm = now.toTimeString().slice(0, 5), key = today() + ' ' + hhmm; if (f.last === key) return;
  const hits = f.custom.filter((c) => c.time === hhmm).map((c) => c.label);
  if (f.rel === 'Muslim' && f.pray) { const pt = getPrayer(), cur = now.getHours() * 60 + now.getMinutes(); if (pt) Object.entries(pt).forEach(([n, t]) => { if ((Math.round(t * 60) - f.lead + 1440) % 1440 === cur) hits.push(f.lead ? `${n} in ${f.lead} min` : `${n} time`); }); }
  if (!hits.length) return;
  f.last = key; save();
  if (S.mode.privacy || S.mode.quiet) return sysNotif('You have a personal reminder.');
  shout('🌙 ' + hits.join(' · '), 8000); sysNotif(hits.join(' · '));
}, 20000);

/* ---------- Wellness ---------- */
const WL = [['water', 'Water', 'Water time? 💧'], ['stretch', 'Stretch', "You've been sitting a while. Stretch break? 🌿"], ['eyes', 'Eye break', 'Look at something far away for 20 seconds. 👀'], ['screen', 'Long screen time', 'Long screen session. Short break?'], ['breathe', 'Breathing break', 'Tiny breathing break? 🌬️']];
const nextDue = {}; let sleepKey = '';
function renderWell() {
  $('#wList').innerHTML = WL.map(([k, l]) => `<li data-k="${k}"><input type="checkbox" class="won" ${E.well[k].on ? 'checked' : ''}><span class="grow">${l}</span> every <input type="number" class="wmin" min="5" max="240" value="${E.well[k].min}"> min</li>`).join('')
    + `<li data-k="sleep"><input type="checkbox" class="won" ${E.well.sleep.on ? 'checked' : ''}><span class="grow">Sleep reminder</span><input type="time" class="wtime" value="${E.well.sleep.time}"></li>`;
  $('#cOn').checked = E.cycle.on; $('#cBody').classList.toggle('hidden', !E.cycle.on); $('#cLen').value = E.cycle.len; $('#cDur').value = E.cycle.dur; renderCycle();
}
$('#wList').onchange = (e) => {
  const li = e.target.closest('li'); if (!li) return; const w = E.well[li.dataset.k];
  if (e.target.classList.contains('won')) { w.on = e.target.checked; delete nextDue[li.dataset.k]; if (w.on) askPerm(); }
  if (e.target.classList.contains('wmin')) { w.min = Math.min(240, Math.max(5, +e.target.value || 60)); delete nextDue[li.dataset.k]; }
  if (e.target.classList.contains('wtime')) w.time = e.target.value;
  save();
};
function remind(text) { mood('curious'); shout(text, 7000); sysNotif(text); setTimeout(applyMood, 4000); }
setInterval(() => { // one check per minute
  const now = Date.now(), calm = S.mode.quiet || S.mode.sleepy || S.mode.focus || S.mode.privacy;
  WL.forEach(([k, , msg]) => {
    const w = E.well[k]; if (!w.on) { delete nextDue[k]; return; }
    if (!nextDue[k]) nextDue[k] = now + w.min * 60000;
    if (now >= nextDue[k]) { if (calm) nextDue[k] = now + 5 * 60000; else { remind(msg); nextDue[k] = now + w.min * 60000; } }
  });
  const sl = E.well.sleep, hhmm = new Date().toTimeString().slice(0, 5);
  if (sl.on && hhmm === sl.time && sleepKey !== today() && !calm) { sleepKey = today(); remind("It's getting late. Sleep soon? 🌙"); }
  const c = E.cycle; if (c.on && c.starts.length && E.cycle.noted !== today()) { const n = nextStart(); if (n && dd(n) >= 0 && dd(n) <= 2) { E.cycle.noted = today(); save(); sysNotif('You have a personal reminder.'); if (!S.mode.privacy && !S.mode.quiet) shout('You have a personal reminder. 🤍', 6000); } }
}, 60000);

/* breathing */
let br = false;
function bstep(t, s, ms, nxt) { if (!br) return bcycle(); $('#bTxt').textContent = t; $('#bCircle').style.transform = `scale(${s})`; setTimeout(nxt, ms); }
function bcycle() {
  if (!br) { $('#bTxt').textContent = ''; $('#bCircle').style.transform = 'scale(1)'; $('#bBtn').textContent = 'Start'; applyMood(); return; }
  bstep('Inhale… 4', 1.8, 4000, () => bstep('Hold… 4', 1.8, 4000, () => bstep('Exhale… 6', 1, 6000, bcycle)));
}
$('#bBtn').onclick = () => { br = !br; if (br) { mood('focused'); $('#bBtn').textContent = 'Stop'; bcycle(); } };

/* private tracker (estimates only, local storage only) */
const addDays = (d, n) => { const x = new Date(d + 'T00:00'); x.setDate(x.getDate() + n); return x.toLocaleDateString('en-CA'); };
function cycLen() { const s = [...E.cycle.starts].sort(); if (s.length < 3) return E.cycle.len; const g = []; for (let i = 1; i < s.length; i++) g.push((new Date(s[i]) - new Date(s[i - 1])) / 864e5); const l = g.slice(-6); return Math.round(l.reduce((a, b) => a + b, 0) / l.length); }
function nextStart() { const s = [...E.cycle.starts].sort(); return s.length ? addDays(s[s.length - 1], cycLen()) : null; }
function renderCycle() {
  const n = nextStart();
  $('#cNext').textContent = n ? `Estimated next start: ${n} (${dd(n)} days). This is only an estimate, not medical advice.` : 'Log a start date to see an estimate.';
  $('#cList').innerHTML = [...E.cycle.starts].sort().reverse().slice(0, 8).map((d) => `<li data-d="${d}"><span class="grow">Started ${d}</span><button class="del">✕</button></li>`).join('');
}
$('#cOn').onchange = (e) => { E.cycle.on = e.target.checked; save(); renderWell(); askPerm(); };
$('#cLen').onchange = (e) => { E.cycle.len = Math.min(45, Math.max(20, +e.target.value || 28)); save(); renderCycle(); };
$('#cDur').onchange = (e) => { E.cycle.dur = Math.min(10, Math.max(1, +e.target.value || 5)); save(); };
$('#cAdd').onclick = () => { const d = $('#cStart').value; if (d && !E.cycle.starts.includes(d)) { E.cycle.starts.push(d); save(); renderCycle(); } };
$('#cList').onclick = (e) => { const li = e.target.closest('li'); if (li && e.target.classList.contains('del')) { E.cycle.starts = E.cycle.starts.filter((d) => d !== li.dataset.d); save(); renderCycle(); } };
