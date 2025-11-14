/* =========================================================
   Saheli — Sakhi Coach + Assistant (single-file inline)
   - mounts floating button (#sakhi) panel
   - adds Coach/Chat UI with clean formatting (no raw **)
   - phase-aware tips using localStorage('saheli_cycle')
   - remembers chat in localStorage('saheli_chat_history')
   - optional TTS/STT if browser supports
   - FULLSCREEN overlay + toggle, body scroll lock, dedup FAB
   ========================================================= */
(function(){
  // guard against double-loading
  if (window.__sakhiLoaded) return;
  window.__sakhiLoaded = true;

  const LS_KEYS = {
    cycle: 'saheli_cycle',          // { lastPeriod: ISO, cycleLength: number }
    user:  'saheli_user',           // { name?: string }
    chat:  'saheli_chat_history',   // [{role, content}]
    logs:  'saheli_remedy_logs'     // optional logs from Remedies page
  };

  // ---------- tiny utils ----------
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
  const later = (fn)=> (document.readyState==='loading'? document.addEventListener('DOMContentLoaded', fn) : fn());
  const load = (k, fallback=null)=> { try { return JSON.parse(localStorage.getItem(k)) ?? fallback; } catch { return fallback; } };
  const save = (k, v)=> localStorage.setItem(k, JSON.stringify(v));
  const clamp = (n,min,max)=> Math.max(min, Math.min(max, n));

  // inject minimal CSS for fullscreen/overlay if not present
  function ensureStyles(){
    if (document.getElementById('sakhi-inline-styles')) return;
    const css = `
      .sakhi-overlay{
        position: fixed; inset: 0; background: rgba(0,0,0,.35);
        backdrop-filter: blur(2px); display: none; z-index: 99998;
      }
      .sakhi-overlay.open{ display:block; }
      .sakhi-panel{
        position: fixed; right: 18px; bottom: 94px; width: 320px; max-height: 65vh;
        display: none; flex-direction: column; background: #fff; border-radius: 14px;
        box-shadow: 0 18px 40px rgba(0,0,0,.12); overflow: hidden; z-index: 99999;
      }
      .sakhi-panel.open{ display:flex; }
      .sakhi-panel.fullscreen{
        inset: 0 !important; right: 0 !important; bottom: 0 !important;
        width: 100vw !important; max-height: none !important; height: 100vh !important;
        border-radius: 0 !important; box-shadow: none !important;
      }
      body.sakhi-lock{ overflow: hidden; }
      .sakhi-head{
        display:flex; align-items:center; justify-content:space-between;
        padding: 10px 12px; border-bottom: 1px solid #f0f0f0;
      }
      .sakhi-actions{ display:flex; gap:8px; }
      .sakhi-iconbtn{
        border:0; background:#fff; cursor:pointer; border-radius:10px; padding:6px 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,.06);
      }
      .sakhi-iconbtn:hover{ transform: translateY(-1px); }
    `;
    const style = document.createElement('style');
    style.id = 'sakhi-inline-styles';
    style.textContent = css;
    document.head.appendChild(style);
  }

  // escape & format helper: turns **bold** into <strong>, "- " lines to list, newlines to paragraphs
  const sanitize = s => String(s).replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  function formatMsg(str){
    let s = sanitize(str ?? '');
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); // bold
    const lines = s.split(/\r?\n/);
    let html = '', inUl = false;
    for (const line of lines){
      const m = line.match(/^\s*[-•]\s+(.*)$/);
      if (m){
        if (!inUl){ html += '<ul class="sakhi-list">'; inUl=true; }
        html += `<li>${m[1]}</li>`;
      } else {
        if (inUl){ html += '</ul>'; inUl=false; }
        const t = line.trim();
        if (t) html += `<p>${t}</p>`;
      }
    }
    if (inUl) html += '</ul>';
    return html || '<p></p>';
  }

  // --------- phase helpers ---------
  function getPhase(){
    const cyc = load(LS_KEYS.cycle, null);
    if(!cyc) return { phase:'Unknown', dayInCycle:null };
    const last = new Date(cyc.lastPeriod);
    const len  = Number(cyc.cycleLength || 28);
    if (isNaN(last.getTime()) || len < 21 || len > 60) return { phase:'Unknown', dayInCycle:null };
    const today = new Date();
    const diff  = Math.floor((today - last) / (1000*60*60*24));
    const day   = ((diff % len) + len) % len; // 0-indexed
    let phase = 'Follicular';
    if (day >= 0 && day < 5) phase = 'Menstrual';
    else if (day >= len-19 && day < len-13) phase = 'Fertile';
    else if (day === len-14) phase = 'Ovulation';
    else if (day > len-14) phase = 'Luteal';
    return { phase, dayInCycle: day + 1, cycleLength: len };
  }

  function suggestMeal(P){
    const map = {
      Menstrual:  "Focus on iron + vitamin C (palak + citrus), and magnesium foods (oats, almonds, banana).",
      Follicular: "Lean proteins + greens + fresh fruit; rising energy — balanced carbs help creativity.",
      Ovulation:  "Add omega-3 (fish or flax), hydrate well, keep protein high to support peak energy.",
      Fertile:    "Zinc + protein (pumpkin seeds, lentils), steady hydration, whole grains.",
      Luteal:     "Magnesium (dark chocolate, nuts, oats) + complex carbs; reduce salt/caffeine."
    };
    return map[P] || "Balance carbs + protein + greens today. Personalize via the Tracker for phase-specific ideas.";
  }
  function suggestRemedy(P){
    const map = {
      Menstrual:  "Warm compress (15–20 min), gentle stretches, ginger or chamomile tea.",
      Follicular: "Light cardio + mobility, hydration, protein-rich breakfast.",
      Ovulation:  "Hydrate, short cool-down after workouts, add omega-3.",
      Fertile:    "Prioritize sleep, 5-min box breathing, moderate caffeine.",
      Luteal:     "Lower-intensity movement, warm bath, consistent bedtime, magnesium support."
    };
    return map[P] || "Try a warm compress, hydrate, short walk or stretches, and a soothing tea.";
  }
  function tipsForPhase(P){
    if (!P || P === 'Unknown'){
      return "Set your last period and average cycle length in Tracker for personalized tips.\n- Warm compress 15–20 mins\n- Hydrate (water / coconut water)\n- Gentle walk or stretches\n- Chamomile or ginger tea";
    }
    return `Tips for ${P} phase:\n- ${suggestMeal(P)}\n- ${suggestRemedy(P)}\n- Keep sleep regular and hydrate well`;
  }

  function explainProject(){
    return `Saheli is a privacy-first menstrual wellness app with:
- Cycle Tracker (phases, ovulation, fertile window, symptom trends)
- Nutrition Planner (phase-based weekly presets, editable, downloadable)
- Remedies (curated relief with quick how-tos)
- Doctor Connect (filter by language & specialty)
- Myths vs Facts (interactive stigma busters)
- Sakhi Coach (me) — context-aware guidance based on your saved cycle`;
  }
  function howToUseTracker(){
    return `Open Cycle Tracker → set Last Period Start Date + Average Cycle Length → Generate Calendar.
You’ll see predicted phases/dates, a phase bar chart, and a symptom trend. Once saved, Sakhi personalizes tips automatically.`;
  }
  function mythVsFact(){
    return "Myth: Exercise should be avoided during periods.\nFact: Light workouts or yoga can reduce cramps and improve mood.";
  }
  function doctorHelp(){
    return "Go to Doctor → filter by Language (e.g., Hindi) & Specialization → click Contact to view details.";
  }

  // ---------- panel mount ----------
  function mountPanel(){
    let panel = $('.sakhi-panel');
    if (panel) return panel; // already exists

    panel = document.createElement('div');
    panel.className = 'sakhi-panel';
    panel.setAttribute('role','dialog');
    panel.setAttribute('aria-hidden','true');

    panel.innerHTML = `
      <div class="sakhi-head">
        <div class="sakhi-title">🌸 <strong>Sakhi</strong> <span class="sakhi-sub">Personalize in Tracker</span></div>
        <div class="sakhi-actions">
          <button class="sakhi-iconbtn sakhi-size" title="Toggle full screen" aria-label="Toggle full screen">⤢</button>
          <button class="sakhi-iconbtn sakhi-close" title="Close" aria-label="Close">✕</button>
        </div>
      </div>
      <div class="sakhi-body">
        <div class="sakhi-intro">
          Hi! I’ve got a few gentle, phase-aware ideas for today.
          <ul class="sakhi-list">
            <li>Set your last period in the <em>Cycle Tracker</em> to personalize tips.</li>
          </ul>
          <div class="sakhi-actions">
            <button class="sakhi-log btn">Log symptom</button>
            <button class="sakhi-tip btn ghost">Today’s meal tip</button>
          </div>
          <div class="sakhi-streak" aria-live="polite">🔥 Streak 1</div>
        </div>
        <!-- chat will be injected below -->
      </div>
    `;
    document.body.appendChild(panel);

    // interactions for top section
    const closeBtn = $('.sakhi-close', panel);
    const sizeBtn  = $('.sakhi-size', panel);
    const logBtn   = $('.sakhi-log', panel);
    const tipBtn   = $('.sakhi-tip', panel);

    on(closeBtn,'click', closeAll);
    on(sizeBtn,'click', ()=> panel.classList.toggle('fullscreen'));

    on(logBtn,'click', ()=>{
      const logs = load(LS_KEYS.logs, []);
      logs.unshift({ title:'Quick log via Sakhi', ts: Date.now() });
      save(LS_KEYS.logs, logs);
      toast(panel, 'Saved locally ✔️');
    });
    on(tipBtn,'click', ()=>{
      const {phase} = getPhase();
      sakhiPushAssistant(panel, `Meal idea for ${phase==='Unknown'?'today':phase}:\n- ${suggestMeal(phase)}`);
    });

    return panel;
  }

  // small toast inside panel
  function toast(panel, msg){
    let t = $('.sakhi-toast', panel);
    if (!t){
      t = document.createElement('div');
      t.className = 'sakhi-toast';
      panel.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(()=> t.classList.remove('show'), 1200);
  }

  // ---------- assistant (inline) ----------
  function mountAssistant(panel){
    if (panel.__assistantMounted) return;
    const body = $('.sakhi-body', panel);
    if (!body) return;

    const chatWrap = document.createElement('div');
    chatWrap.className = 'sakhi-chat';
    chatWrap.innerHTML = `
      <div class="sakhi-chat-header">
        <div class="sakhi-tabs">
          <button class="sakhi-tab active" data-tab="coach">Coach</button>
          <button class="sakhi-tab" data-tab="chat">Chat</button>
        </div>
        <div class="sakhi-voice">
          <button class="sakhi-tts" title="Speak reply">🔈</button>
          <button class="sakhi-stt" title="Voice input">🎤</button>
        </div>
      </div>
      <div class="sakhi-chat-body" id="sakhiChatBody"></div>
      <div class="sakhi-chat-input">
        <textarea id="sakhiUserInput" rows="1" placeholder="Ask Sakhi anything… (e.g., Explain Saheli project)"></textarea>
        <button id="sakhiSendBtn" class="sakhi-send">Send</button>
      </div>
    `;
    body.appendChild(chatWrap);

    const chatBody = $('#sakhiChatBody', chatWrap);
    const input    = $('#sakhiUserInput', chatWrap);
    const sendBtn  = $('#sakhiSendBtn', chatWrap);
    const tabs     = $$('.sakhi-tab', chatWrap);
    const ttsBtn   = $('.sakhi-tts', chatWrap);
    const sttBtn   = $('.sakhi-stt', chatWrap);

    const scrollBottom = ()=> chatBody.scrollTop = chatBody.scrollHeight;
    function renderBubble(role, text){
      const b = document.createElement('div');
      b.className = `sakhi-bubble ${role}`;
      b.innerHTML = formatMsg(text);
      chatBody.appendChild(b);
      scrollBottom();
    }
    function pushAssistant(text){
      panel.__lastAssistantText = text;
      renderBubble('assistant', text);
      history.push({role:'assistant', content:text});
      save(LS_KEYS.chat, history.slice(-200));
    }
    function pushUser(text){
      renderBubble('user', text);
      history.push({role:'user', content:text});
      save(LS_KEYS.chat, history.slice(-200));
    }

    // seed / restore
    let history = load(LS_KEYS.chat, []);
    if (history.length === 0){
      pushAssistant("Hi! I’m Sakhi — your cycle-aware coach. Ask me about nutrition, remedies, phases, or “Explain Saheli project”.");
      seedCoach();
    } else {
      history.forEach(m=> renderBubble(m.role, m.content));
      scrollBottom();
    }

    function seedCoach(){
      renderSuggests(['Explain Saheli project','Which phase am I in?','Meal idea for today','Quick remedy for cramps','How to use the tracker?']);
    }
    function seedChat(){
      renderSuggests(['Tell me a myth vs fact','Doctor options for Hindi','Tips in Luteal phase','Improve sleep this week']);
    }
    function renderSuggests(arr){
      $$('.sakhi-suggests', chatBody).forEach(n=>n.remove());
      const strip = document.createElement('div');
      strip.className = 'sakhi-suggests';
      strip.innerHTML = arr.map(t=>`<button class="sakhi-suggest">${sanitize(t)}</button>`).join('');
      chatBody.appendChild(strip);
      $$('.sakhi-suggest', strip).forEach(b=> on(b,'click',()=>{ input.value=b.textContent; onSend(); }));
      scrollBottom();
    }

    // tabs
    tabs.forEach(t => on(t,'click', ()=>{
      tabs.forEach(x=>x.classList.remove('active'));
      t.classList.add('active');
      if (t.dataset.tab==='coach') seedCoach(); else seedChat();
    }));

    // send actions
    on(sendBtn,'click', onSend);
    on(input,'keydown', e=>{
      if (e.key==='Enter' && !e.shiftKey){ e.preventDefault(); onSend(); }
      // auto-grow
      const maxH = 96;
      input.style.height = 'auto';
      input.style.height = clamp(input.scrollHeight, 36, maxH) + 'px';
    });

    // TTS
    on(ttsBtn,'click', ()=>{
      const text = panel.__lastAssistantText;
      if (!text) return;
      try {
        const u = new SpeechSynthesisUtterance(text.replace(/\*\*(.+?)\*\*/g,'$1'));
        u.rate=1.02; u.pitch=1.05;
        speechSynthesis.cancel(); speechSynthesis.speak(u);
      } catch {}
    });

    // STT
    let sttActive = false, recog = null;
    on(sttBtn,'click', ()=>{
      if (sttActive){ try{ recog && recog.stop(); }catch{} return; }
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR){ alert('Speech recognition is not supported in this browser.'); return; }
      recog = new SR(); recog.lang='en-IN'; recog.interimResults=false;
      recog.onstart = ()=>{ sttActive=true; sttBtn.textContent='🛑'; };
      recog.onend   = ()=>{ sttActive=false; sttBtn.textContent='🎤'; };
      recog.onresult= (e)=>{ input.value = e.results[0][0].transcript; onSend(); };
      recog.start();
    });

    // typing indicator
    function showTyping(){
      const t = document.createElement('div');
      t.className = 'sakhi-typing';
      t.innerHTML = '<span></span><span></span><span></span>';
      chatBody.appendChild(t);
      scrollBottom();
      return { remove(){ t.remove(); } };
    }

    async function onSend(){
      const text = (input.value || '').trim();
      if (!text) return;
      input.value = ''; input.style.height = '36px';
      pushUser(text);
      const typing = showTyping();
      try{
        const reply = await brain(text);
        typing.remove(); pushAssistant(reply);
      }catch(err){
        typing.remove(); pushAssistant('Hmm, I hit a snag. Try asking about phases, nutrition, remedies, or the Saheli project.');
        console.error(err);
      }
    }

    // “demo brain” — deterministic intent logic (no backend)
    async function brain(q){
      const lc = q.toLowerCase();
      const { phase, dayInCycle } = getPhase();

      // explicit phase in question
      const phTokens = ['menstrual','follicular','ovulation','fertile','luteal'];
      const explicit = phTokens.find(p => lc.includes(p));
      const explicitPhase = explicit ? (explicit === 'fertile' ? 'Fertile' : explicit.charAt(0).toUpperCase()+explicit.slice(1)) : null;

      // capture "my name is ..."
      const nameSet = lc.match(/my name is\s+([a-z ]{2,30})/i);
      if (nameSet){
        const nm = nameSet[1].trim().replace(/\b\w/g,c=>c.toUpperCase());
        const user = load(LS_KEYS.user, {});
        save(LS_KEYS.user, { ...user, name: nm });
        return `Nice to meet you, ${nm}! I’ll personalize tips where I can.`;
      }

      // tips/advice
      if (lc.includes('tip') || lc.includes('tips') || lc.includes('advice')){
        return tipsForPhase(explicitPhase || phase);
      }

      if (lc.includes('which phase') || lc.includes('my phase')){
        return phase === 'Unknown'
          ? "I can’t tell yet — open Cycle Tracker and set your last period and average length."
          : `You’re likely in ${phase} (day ${dayInCycle}). Want nutrition or remedy tips for this phase?`;
      }

      if (lc.includes('meal') || lc.includes('diet') || lc.includes('what should i eat')){
        const P = explicitPhase || phase || 'today';
        return `Meal idea for ${P}:\n- ${suggestMeal(P)}\n\nOpen the Nutrition page for the full weekly planner.`;
      }

      if (lc.includes('remedy') || lc.includes('cramp') || lc.includes('pain')){
        const P = explicitPhase || phase || 'today';
        return tipsForPhase(P);
      }

      if (lc.includes('explain saheli') || lc.includes('about saheli') || lc.includes('project')) return explainProject();
      if (lc.includes('how to use') && lc.includes('tracker')) return howToUseTracker();
      if (lc.includes('myth') || lc.includes('fact')) return mythVsFact();
      if (lc.includes('doctor') || lc.includes('consult')) return doctorHelp();

      if (lc.includes('sleep') || lc.includes('stress') || lc.includes('breathe')){
        return "Calm routine:\n- Box breathing: inhale 4s, hold 4s, exhale 6s (10 cycles)\n- Dim screens 60 min before bed\n- Keep room cool and dark";
      }

      return "Here’s what I can help with:\n- Identify your likely cycle phase\n- Meal ideas and gentle remedies\n- Explain the Saheli project\n- Myths vs facts highlights\n- Doctor filters by language/specialty\n\nTry asking: Which phase am I in? • Meal idea for today • Explain Saheli project";
    }

    panel.__assistantMounted = true;
    console.log('Sakhi Assistant mounted');
  }

  // expose a helper used above (needed for tip button)
  function sakhiPushAssistant(panel, text){
    if (!panel.__assistantMounted) mountAssistant(panel);
    const chatBody = $('#sakhiChatBody', panel);
    if (!chatBody) return;
    const b = document.createElement('div');
    b.className = 'sakhi-bubble assistant';
    b.innerHTML = formatMsg(text);
    chatBody.appendChild(b);
    chatBody.scrollTop = chatBody.scrollHeight;

    const history = load(LS_KEYS.chat, []);
    history.push({role:'assistant', content:text});
    save(LS_KEYS.chat, history.slice(-200));
    panel.__lastAssistantText = text;
  }

  // ---------- overlay helpers & global close ----------
  function ensureOverlay(){
    let overlay = document.querySelector('.sakhi-overlay');
    if (!overlay){
      overlay = document.createElement('div');
      overlay.className = 'sakhi-overlay';
      document.body.appendChild(overlay);
    }
    return overlay;
  }
  function closeAll(){
    const panel = $('.sakhi-panel');
    const overlay = $('.sakhi-overlay');
    if (panel){
      panel.classList.remove('open','fullscreen');
      panel.style.display = 'none';
      panel.setAttribute('aria-hidden','true');
    }
    if (overlay) overlay.classList.remove('open');
    document.body.classList.remove('sakhi-lock');
  }

  // ---------- floating button + robust toggle ----------
  later(() => {
    ensureStyles();

    // remove duplicates, keep the first FAB only
    const allFab = [...document.querySelectorAll('#sakhi')];
    if (allFab.length === 0) {
      console.warn('Sakhi: #sakhi not found. Add <button id="sakhi" class="sakhi" aria-label="Open Sakhi">💬</button> before </body>.');
      return;
    }
    allFab.slice(1).forEach(n=>n.remove());
    let fab = allFab[0];

    const overlay = ensureOverlay();

    const togglePanel = () => {
      const panel = mountPanel();         // create if needed
      const willOpen = !panel.classList.contains('open');

      panel.classList.toggle('open', willOpen);
      panel.style.display = willOpen ? 'flex' : 'none';
      panel.setAttribute('aria-hidden', willOpen ? 'false' : 'true');

      overlay.classList.toggle('open', willOpen);
      document.body.classList.toggle('sakhi-lock', willOpen);

      if (willOpen){
        // Fullscreen on homepage by default; floating elsewhere (tweak as you like)
        const onHome = location.pathname.endsWith('index.html') || location.pathname === '/' || location.pathname === '';
        if (onHome) panel.classList.add('fullscreen');
        if (!panel.__assistantMounted) mountAssistant(panel);
      }
    };

    // bind FAB (fresh to avoid duplicate listeners)
    const fresh = fab.cloneNode(true);
    fab.replaceWith(fresh);
    fab = fresh;

    fab.addEventListener('click', togglePanel);
    fab.setAttribute('tabindex','0');
    fab.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); togglePanel(); }
    });

    // overlay click closes
    overlay.addEventListener('click', (e)=> {
      if (e.target === overlay) closeAll();
    });

    // ESC closes
    document.addEventListener('keydown', (e)=>{
      if (e.key === 'Escape') closeAll();
    });

    // optional: back-to-top if present
    const backTop = document.getElementById('backTop');
    if (backTop){
      window.addEventListener('scroll', ()=> backTop.style.display = (window.scrollY > 400 ? 'block' : 'none'), { passive:true });
      backTop.addEventListener('click', ()=> window.scrollTo({ top:0, behavior:'smooth' }));
    }

    // sticky nav style (if #nav exists)
    const nav = document.getElementById('nav');
    if (nav){
      window.addEventListener('scroll', ()=> nav.classList.toggle('scrolled', window.scrollY > 60), { passive:true });
    }

    // footer year (if present)
    const yearEl = document.getElementById('year');
    if (yearEl) yearEl.textContent = new Date().getFullYear();

    console.log('Sakhi loaded ✓');
  });

})();
