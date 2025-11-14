// ============== Saheli Cycle Tracker 2.0 (local-only) ==============
(function(){
  const $ = (s, r=document)=> r.querySelector(s);
  const $$ = (s, r=document)=> Array.from(r.querySelectorAll(s));
  const save = (k,v)=> localStorage.setItem(k, JSON.stringify(v));
  const load = (k,f)=> { try{ return JSON.parse(localStorage.getItem(k)) ?? f; }catch{ return f; } };

  // Storage keys (keep Sakhi compatibility)
  const K = {
    settings: 'saheli_cycle_settings',          // { lastPeriodISO, cycleLength }
    history:  'saheli_cycle_history',           // [ ISO date strings of period starts ]
    logs:     'saheli_logs',                    // [{dateISO, mood, energy(1..3), flow, notes}]
    sakhi:    'saheli_cycle'                    // { lastPeriod, cycleLength }  (for Sakhi coach)
  };

  // Elements
  const lastPeriodInput = $('#lastPeriod');
  const cycleLengthInput= $('#cycleLength');
  const saveSettingsBtn = $('#saveSettings');
  const addPeriodBtn    = $('#addPeriodStart');

  const phaseRing   = $('#phaseRing');
  const phaseDayEl  = $('#phaseDay');
  const phaseNameEl = $('#phaseName');
  const phaseLineEl = $('#phaseLine');
  const nextBadge   = $('#nextPeriodBadge');
  const ovBadge     = $('#ovBadge');

  const healthScoreEl = $('#healthScore');
  const avgEnergyEl   = $('#avgEnergy');
  const streakEl      = $('#streak');

  const monthLabel = $('#monthLabel');
  const calendarEl = $('#calendar');
  const prevMonthBtn = $('#prevMonth');
  const nextMonthBtn = $('#nextMonth');

  const tabButtons = $$('.tab');
  const panels = {
    cal: $('#tab-cal'),
    logs: $('#tab-logs'),
    analytics: $('#tab-analytics'),
    history: $('#tab-history')
  };

  // Logs elements
  const logForm = $('#logForm');
  const logDate = $('#logDate');
  const logMood = $('#logMood');
  const logEnergy = $('#logEnergy');
  const logFlow = $('#logFlow');
  const logNotes = $('#logNotes');
  const clearLogsBtn = $('#clearLogs');
  const logsContainer = $('#logsContainer');

  // History elements
  const historyList = $('#historyList');
  const clearHistoryBtn = $('#clearHistory');

  // Charts
  let moodEnergyChart, cycleLenChart;

  // State
  let settings = load(K.settings, null); // { lastPeriodISO, cycleLength }
  let history  = load(K.history, []);
  let logs     = load(K.logs, []);

  // Year in footer
  $('#year').textContent = new Date().getFullYear();

  // Tabs
  tabButtons.forEach(b=>{
    b.addEventListener('click', ()=>{
      tabButtons.forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      const key = b.dataset.tab;
      Object.values(panels).forEach(p=> p.classList.remove('show'));
      panels[key].classList.add('show');
      if (key==='analytics') drawCharts();
      if (key==='history') renderHistory();
    });
  });

  // Load settings into form
  function hydrateSettings(){
    if (!settings) return;
    lastPeriodInput.value = settings.lastPeriodISO || '';
    cycleLengthInput.value = settings.cycleLength || 28;
  }

  // Save settings + update Sakhi compatibility key
  $('#settingsForm').addEventListener('submit', (e)=>{
    e.preventDefault();
    const lp = lastPeriodInput.value;
    const len = parseInt(cycleLengthInput.value);
    if (!lp || isNaN(len) || len < 21 || len > 60){
      alert('Enter a valid date and cycle length (21–60).'); return;
    }
    settings = { lastPeriodISO: lp, cycleLength: len };
    save(K.settings, settings);
    // Sakhi expects { lastPeriod, cycleLength }
    save(K.sakhi, { lastPeriod: lp, cycleLength: len });

    // ensure history contains this if not present
    if (!history.includes(lp)){ history.unshift(lp); save(K.history, history); }
    refreshAll();
  });

  // Add period start to history
  addPeriodBtn.addEventListener('click', ()=>{
    const lp = lastPeriodInput.value;
    if (!lp){ alert('Pick the date first.'); return; }
    if (!history.includes(lp)){
      history.unshift(lp);
      history.sort((a,b)=> new Date(b) - new Date(a)); // desc
      save(K.history, history);
      renderHistory();
      alert('Added to history.');
    } else {
      alert('This date already exists in history.');
    }
  });

  // Calendar — month navigation
  let viewYear, viewMonth; // 0-index month
  function setViewToToday(){
    const t = new Date();
    viewYear = t.getFullYear();
    viewMonth = t.getMonth();
  }
  prevMonthBtn.addEventListener('click', ()=>{ viewMonth--; if(viewMonth<0){ viewMonth=11; viewYear--; } renderCalendar(); });
  nextMonthBtn.addEventListener('click', ()=>{ viewMonth++; if(viewMonth>11){ viewMonth=0; viewYear++; } renderCalendar(); });

  // Phase helpers
  function getPhaseForDay(startISO, cycleLen, d){
    // returns {phase: 'Menstrual'|'Fertile'|'Ovulation'|'Luteal'|'Follicular', dayInCycle:1..cycleLen}
    if (!startISO || !cycleLen) return {phase:'Follicular', dayInCycle:null};
    const start = new Date(startISO);
    const diff = Math.floor((d - start) / (1000*60*60*24));
    const mod = ((diff % cycleLen) + cycleLen) % cycleLen; // 0..cycleLen-1
    let phase = 'Follicular';
    if (mod >= 0 && mod < 5) phase = 'Menstrual';
    else if (mod >= cycleLen-19 && mod < cycleLen-13) phase = 'Fertile';
    else if (mod === cycleLen-14) phase = 'Ovulation';
    else if (mod > cycleLen-14) phase = 'Luteal';
    return { phase, dayInCycle: mod+1 };
  }

  function computeSummary(){
    if (!settings) return null;
    const len = settings.cycleLength || 28;
    const last = new Date(settings.lastPeriodISO);
    const today = new Date();
    const { phase, dayInCycle } = getPhaseForDay(settings.lastPeriodISO, len, today);

    // next period
    const next = new Date(last);
    while (next <= today) next.setDate(next.getDate() + len);
    // ovulation
    const ovu = new Date(last); ovu.setDate(ovu.getDate() + len - 14);
    while (ovu <= today) ovu.setDate(ovu.getDate() + len);

    return { phase, dayInCycle, next, ovu };
  }

  function renderDashboard(){
    const sum = computeSummary();
    if (!sum){
      phaseNameEl.textContent = '—';
      phaseDayEl.textContent = '--';
      phaseLineEl.textContent = 'Set your last period and cycle length below.';
      nextBadge.textContent = `Next period — —`;
      ovBadge.textContent = `Ovulation — —`;
      // ring empty
      setRing(0);
      return;
    }
    const {phase, dayInCycle, next, ovu} = sum;
    phaseNameEl.textContent = phase;
    phaseDayEl.textContent = dayInCycle ?? '--';
    phaseLineEl.textContent = phaseTagline(phase);
    nextBadge.textContent = `Next period — ${dateStr(next)}`;
    ovBadge.textContent   = `Ovulation — ${dateStr(ovu)}`;

    const perc = settings ? Math.round(((dayInCycle-1) / settings.cycleLength) * 360) : 0;
    setRing(perc);
  }

  function phaseTagline(p){
    switch(p){
      case 'Menstrual': return 'Rest, warmth, iron + vitamin C. Be gentle with yourself.';
      case 'Follicular':return 'Energy rises — plan, create, lean protein helps.';
      case 'Ovulation': return 'Peak energy — hydrate, add omega-3.';
      case 'Fertile':   return 'Steady hydration + balanced meals.';
      case 'Luteal':    return 'Lower intensity, magnesium support, better sleep.';
      default: return '';
    }
  }

  function setRing(angle){
    // color by phase as well
    const sum = computeSummary();
    const color = ({
      Menstrual:'#e15b84',
      Follicular:'#6ab0ff',
      Ovulation:'#ff922b',
      Fertile:'#ffd166',
      Luteal:'#b7a6ff'
    })[sum?.phase || 'Follicular'];
    phaseRing.style.background = `conic-gradient(${color} ${angle}deg, #eaeaea ${angle}deg 360deg)`;
  }

  // Calendar rendering
  function renderCalendar(){
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    monthLabel.textContent = `${monthNames[viewMonth]} ${viewYear}`;

    calendarEl.innerHTML = '';
    if (!settings){
      calendarEl.innerHTML = `<div class="log-empty">Set your cycle to view the calendar.</div>`;
      return;
    }

    const firstDay = new Date(viewYear, viewMonth, 1);
    const startWeekDay = firstDay.getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth+1, 0).getDate();

    // Week headers
    const wk = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    wk.forEach(w=> {
      const wd = document.createElement('div');
      wd.className = 'weekday';
      wd.textContent = w;
      calendarEl.appendChild(wd);
    });

    // Empty cells before 1st
    for (let i=0;i<startWeekDay;i++){
      const e = document.createElement('div');
      e.className = 'cell';
      e.style.visibility = 'hidden';
      calendarEl.appendChild(e);
    }

    const today = new Date();
    for (let d=1; d<=daysInMonth; d++){
      const cell = document.createElement('div');
      cell.className = 'cell';
      const date = new Date(viewYear, viewMonth, d);

      // phase class
      const {phase} = getPhaseForDay(settings.lastPeriodISO, settings.cycleLength, date);
      cell.classList.add(phase.toLowerCase());

      // today mark
      if (isSameDate(date, today)) cell.classList.add('today');

      // contents
      cell.innerHTML = `
        <div class="num">${d}</div>
        <div class="tag">${phase}</div>
      `;

      // click -> prefills log date
      cell.addEventListener('click', ()=>{
        // switch to Logs tab
        tabButtons.forEach(x=>x.classList.remove('active'));
        tabButtons.find(x=>x.dataset.tab==='logs').classList.add('active');
        Object.values(panels).forEach(p=> p.classList.remove('show'));
        panels['logs'].classList.add('show');
        logDate.value = toISO(date);
      });

      calendarEl.appendChild(cell);
    }
  }

  // Logs
  logForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const entry = {
      dateISO: logDate.value || toISO(new Date()),
      mood: logMood.value,
      energy: Number(logEnergy.value), // 1..3
      flow: logFlow.value,
      notes: (logNotes.value || '').trim()
    };
    logs = [entry, ...logs].slice(0, 365); // keep last 1y
    save(K.logs, logs);
    renderLogs();
    // refresh stats & charts
    renderKPIs();
  });

  clearLogsBtn.addEventListener('click', ()=>{
    if (!confirm('Clear all logs?')) return;
    logs = []; save(K.logs, logs);
    renderLogs(); renderKPIs(); drawCharts();
  });

  function renderLogs(){
    if (!logs.length){
      logsContainer.innerHTML = `<div class="log-empty">No logs yet. Add your first log!</div>`;
      return;
    }
    logsContainer.innerHTML = '';
    logs.slice(0, 30).forEach(l=>{
      const row = document.createElement('div');
      row.className = 'log-item';
      const dt = new Date(l.dateISO);
      row.innerHTML = `
        <div><strong>${dt.toDateString().slice(0,10)}</strong><div class="meta">${phaseNameForDate(dt)}</div></div>
        <div><span class="mood">${l.mood}</span> • Energy ${['—','Low','Normal','High'][l.energy]} • Flow ${l.flow}<div class="meta">${l.notes||''}</div></div>
        <div class="meta">${timeAgo(dt)}</div>
      `;
      logsContainer.appendChild(row);
    });
  }

  function phaseNameForDate(d){
    if (!settings) return '—';
    return getPhaseForDay(settings.lastPeriodISO, settings.cycleLength, d).phase;
  }

  // KPIs
  function renderKPIs(){
    // Health score (toy formula):
    // base 100 – heavier flow penalty – low energy penalty – sad/irritable mood penalty
    let score = 100;
    const L = logs.slice(0, 30);
    const energyAvg = L.length ? (L.reduce((a,b)=>a+(b.energy||2),0)/L.length) : null;
    const moodPenalty = L.reduce((acc,l)=>{
      if (l.mood==='Sad') return acc+6;
      if (l.mood==='Irritable') return acc+4;
      return acc;
    },0);
    const flowPenalty = L.reduce((acc,l)=>{
      if (l.flow==='Heavy') return acc+6;
      if (l.flow==='Moderate') return acc+2;
      return acc;
    },0);
    const energyPenalty = energyAvg ? (3-energyAvg)*10 : 0;

    score = Math.max(0, Math.round(score - moodPenalty - flowPenalty - energyPenalty));

    // Streak: consecutive days (from today) with any log
    const daySet = new Set(L.map(l=>l.dateISO));
    let streak=0;
    for(let i=0;;i++){
      const d = new Date(); d.setDate(d.getDate()-i);
      if (daySet.has(toISO(d))) streak++; else break;
    }

    healthScoreEl.textContent = L.length ? score : '—';
    healthScoreEl.className = 'stat-kpi ' + (score>=80?'good':score>=60?'warn':'bad');
    avgEnergyEl.textContent = L.length ? (energyAvg?.toFixed(2) ?? '—') : '—';
    streakEl.textContent = L.length ? streak : '—';
  }

  // Charts
  function drawCharts(){
    // Mood vs Energy
    const L = logs.slice(0, 30).reverse(); // chronological
    const labels = L.map(l => shortDate(new Date(l.dateISO)));
    const energy = L.map(l => l.energy || 0);
    const moodMap = {Happy:3, Calm:2.5, Normal:2, Irritable:1.3, Sad:1};
    const mood = L.map(l => moodMap[l.mood] ?? 2);

    if (moodEnergyChart) moodEnergyChart.destroy();
    const ctx1 = $('#moodEnergyChart').getContext('2d');
    moodEnergyChart = new Chart(ctx1, {
      type:'line',
      data:{
        labels,
        datasets:[
          { label:'Energy (1–3)', data:energy, fill:true, tension:.35, borderColor:'#e15b84', backgroundColor:'rgba(225,91,132,0.18)' },
          { label:'Mood (scaled)', data:mood, fill:false, tension:.35, borderColor:'#6ab0ff' }
        ]
      },
      options:{ responsive:true, maintainAspectRatio:false, scales:{ y:{ min:0, max:3.5 } } }
    });

    // Cycle length history (diff between consecutive period starts)
    const diffs = [];
    for(let i=0; i<history.length-1; i++){
      const a = new Date(history[i]);
      const b = new Date(history[i+1]);
      diffs.push(Math.abs(Math.round((a-b)/(1000*60*60*24))) || null);
    }
    const labels2 = history.slice(0,-1).map(d=> shortDate(new Date(d)));
    if (cycleLenChart) cycleLenChart.destroy();
    const ctx2 = $('#cycleLenChart').getContext('2d');
    cycleLenChart = new Chart(ctx2, {
      type:'bar',
      data:{ labels: labels2.reverse(), datasets:[{ label:'Cycle Length (days)', data: diffs.reverse(), backgroundColor:'#ffd6a5' }] },
      options:{ responsive:true, maintainAspectRatio:false, scales:{ y:{ beginAtZero:true } } }
    });
  }

  // History
  function renderHistory(){
    if (!history.length){
      historyList.innerHTML = `<div class="log-empty">No period starts saved yet.</div>`;
      return;
    }
    historyList.innerHTML = '';
    history.forEach((iso, idx)=>{
      const row = document.createElement('div');
      row.className = 'hist-row';
      const dt = new Date(iso);
      const lenToPrev = (idx < history.length-1) ? Math.abs(Math.round((new Date(iso)-new Date(history[idx+1]))/(1000*60*60*24))) : '—';
      row.innerHTML = `
        <div><strong>${dt.toDateString()}</strong> <small>(${lenToPrev} days since previous)</small></div>
        <button class="icon-btn" title="Remove">×</button>
      `;
      row.querySelector('button').addEventListener('click', ()=>{
        history.splice(idx,1); save(K.history, history); renderHistory(); drawCharts();
      });
      historyList.appendChild(row);
    });
  }
  clearHistoryBtn.addEventListener('click', ()=>{
    if (!confirm('Clear all saved period starts?')) return;
    history = []; save(K.history, history); renderHistory(); drawCharts();
  });

  // Utilities
  function dateStr(d){ return d.toLocaleDateString(undefined, { month:'short', day:'numeric' }); }
  function shortDate(d){ return d.toLocaleDateString(undefined, { month:'short', day:'numeric' }); }
  function isSameDate(a,b){ return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate(); }
  function toISO(d){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }
  function timeAgo(d){
    const diff = Math.floor((Date.now() - d.getTime())/ (1000*60*60*24));
    if (diff<=0) return 'today';
    if (diff===1) return 'yesterday';
    return `${diff} days ago`;
  }

  // Initial load
  (function init(){
    // default view month = today
    setViewToToday();

    // hydrate form & UI
    hydrateSettings();
    renderDashboard();
    renderKPIs();
    renderCalendar();
    renderLogs();
    // charts when analytics tab is opened

    // default dates for log form
    logDate.value = toISO(new Date());
  })();

  function refreshAll(){
    renderDashboard();
    renderKPIs();
    renderCalendar();
    drawCharts();
    renderHistory();
  }

})();
/* =============================
   ✨ Animations & Hover Helpers
   ============================= */

/* 1) Reveal-on-scroll (no HTML edits needed) */
const revealTargets = [
  '.input-section',
  '.info-section',
  '.info-card',
  '.calendar-section',
  '.graph-section',
  '.graph-card',
  '.legend',
  '#calendar .day'
];

document.querySelectorAll(revealTargets.join(',')).forEach(el => {
  el.classList.add('reveal');
});

const io = new IntersectionObserver((entries) => {
  entries.forEach(en => {
    if (en.isIntersecting) {
      en.target.classList.add('in-view');
      // unobserve small items to avoid re-animating
      if (!en.target.matches('.graph-card')) io.unobserve(en.target);
    }
  });
}, { threshold: 0.14 });

document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* 2) Ripple effect for primary buttons (lightweight) */
function attachRipple(cls) {
  document.querySelectorAll(cls).forEach(btn => {
    btn.style.overflow = 'hidden';
    btn.addEventListener('click', (e) => {
      const r = document.createElement('span');
      const d = Math.max(btn.clientWidth, btn.clientHeight);
      r.style.width = r.style.height = d + 'px';
      r.style.position = 'absolute';
      r.style.borderRadius = '50%';
      r.style.background = 'rgba(255,255,255,.4)';
      r.style.left = (e.offsetX - d/2) + 'px';
      r.style.top = (e.offsetY - d/2) + 'px';
      r.style.transform = 'scale(0)';
      r.style.opacity = '0.8';
      r.style.pointerEvents = 'none';
      r.style.transition = 'transform 500ms ease, opacity 600ms ease';
      btn.appendChild(r);
      requestAnimationFrame(() => {
        r.style.transform = 'scale(1)';
        r.style.opacity = '0';
      });
      setTimeout(() => r.remove(), 650);
    });
  });
}
// attach to your main buttons
attachRipple('.input-section button, .graph-section button, .calendar-section button, button');

/* 3) Calendar “selected” pulse when a day is clicked */
const calendarEl = document.getElementById('calendar');
if (calendarEl) {
  calendarEl.addEventListener('click', (e) => {
    const d = e.target.closest('.day');
    if (!d) return;
    d.classList.remove('selected');
    // retrigger animation
    void d.offsetWidth;
    d.classList.add('selected');
  });
}

/* 4) Smooth scroll when switching to Analytics (if you link via anchor) */
const analytics = document.getElementById('phaseChart') || document.getElementById('symptomChart');
if (analytics) {
  // expose helper if you want to call it from a button: scrollToAnalytics()
  window.scrollToAnalytics = () => {
    analytics.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
}

/* 5) Safety: fix chart parents’ height so the page never “keeps scrolling” */
document.querySelectorAll('.graph-card').forEach(card => {
  if (!card.style.height) {
    card.style.height = '350px';
  }
});
