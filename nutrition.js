// Nutrition weekly meal planner — vanilla JS
document.addEventListener('DOMContentLoaded', () => {
  const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const MEALS = ['Breakfast','Lunch','Dinner','Snacks'];
  const plannerGrid = document.getElementById('plannerGrid');
  const phaseSelect = document.getElementById('phaseSelect');
  const applyPhaseBtn = document.getElementById('applyPhase');
  const downloadBtn = document.getElementById('downloadPlan');

  // presets for each phase (7 days)
  const phasePresets = {
    menstrual: [
      // each day: {Breakfast, Lunch, Dinner, Snacks} (string + optional tag)
      [{text:'Iron smoothie (spinach+banana)', tag:'iron'},{text:'Lentil soup + wholegrain toast', tag:'protein'},{text:'Light stir-fry + quinoa', tag:'magnesium'},{text:'Dates & walnuts', tag:'magnesium'}],
      [{text:'Oatmeal + berries', tag:'magnesium'},{text:'Chickpea salad', tag:'protein'},{text:'Grilled fish + veggies', tag:'omega'},{text:'Yogurt & honey', tag:''}],
      [{text:'Spinach omelette', tag:'iron'},{text:'Mung dal + rice', tag:'protein'},{text:'Vegetable curry', tag:''},{text:'Fruit bowl', tag:''}],
      [{text:'Smoothie bowl', tag:''},{text:'Quinoa salad', tag:'protein'},{text:'Light soup', tag:''},{text:'Almonds', tag:'magnesium'}],
      [{text:'Banana oats', tag:'magnesium'},{text:'Palak paneer', tag:'iron'},{text:'Baked salmon', tag:'omega'},{text:'Dark chocolate', tag:'magnesium'}],
      [{text:'Poha with peanuts', tag:'protein'},{text:'Mixed bean salad', tag:'protein'},{text:'Stir-fry tofu', tag:'protein'},{text:'Roasted seeds', tag:''}],
      [{text:'Warm porridge', tag:'magnesium'},{text:'Lentil stew', tag:'protein'},{text:'Rice + dal', tag:''},{text:'Herbal tea & biscuits', tag:''}],
    ],
    follicular: [
      [{text:'Fruit smoothie + yoghurt', tag:''},{text:'Grain bowl with seeds', tag:'omega'},{text:'Veggie wrap', tag:''},{text:'Hummus & carrots', tag:'protein'}],
      [{text:'Avocado toast', tag:''},{text:'Quinoa salad', tag:'protein'},{text:'Grilled chicken', tag:'protein'},{text:'Mixed nuts', tag:'magnesium'}],
      [{text:'Greek yogurt + chia', tag:'protein'},{text:'Spinach salad + eggs', tag:'iron'},{text:'Salmon + greens', tag:'omega'},{text:'Apple & peanut butter', tag:'protein'}],
      [{text:'Green smoothie', tag:''},{text:'Miso soup + tofu', tag:'protein'},{text:'Veggie Buddha bowl', tag:''},{text:'Edamame', tag:'protein'}],
      [{text:'Berry bowl', tag:''},{text:'Lentil tabbouleh', tag:'protein'},{text:'Sushi/veg rolls', tag:'omega'},{text:'Seeds mix', tag:'magnesium'}],
      [{text:'Protein pancakes', tag:'protein'},{text:'Grilled veg + quinoa', tag:''},{text:'Chicken salad', tag:'protein'},{text:'Yogurt', tag:''}],
      [{text:'Smoothie', tag:''},{text:'Egg salad', tag:'protein'},{text:'Stir fry', tag:''},{text:'Fruit & nuts', tag:''}],
    ],
    ovulation: [
      [{text:'Pumpkin seed porridge', tag:'magnesium'},{text:'Zinc-rich salad (pumpkin seeds)', tag:'protein'},{text:'Grilled salmon + broccoli', tag:'omega'},{text:'Berries', tag:''}],
      [{text:'Egg & spinach', tag:'iron'},{text:'Quinoa + beans', tag:'protein'},{text:'Falafel bowl', tag:'protein'},{text:'Yoghurt & seeds', tag:'magnesium'}],
      [{text:'Greek yoghurt & oats', tag:'protein'},{text:'Turkey + avocado wrap', tag:'protein'},{text:'Roasted fish', tag:'omega'},{text:'Trail mix', tag:''}],
      [{text:'Berry smoothie', tag:''},{text:'Lentil salad', tag:'protein'},{text:'Grilled prawns', tag:'omega'},{text:'Banana', tag:'magnesium'}],
      [{text:'Muesli with seeds', tag:'omega'},{text:'Eggplant + chickpeas', tag:'protein'},{text:'Sardines + salad', tag:'omega'},{text:'Almonds', tag:'magnesium'}],
      [{text:'Oats + nuts', tag:'magnesium'},{text:'Chicken quinoa bowl', tag:'protein'},{text:'Veg curry', tag:''},{text:'Fruit salad', tag:''}],
      [{text:'Smoothie', tag:''},{text:'Bean chili', tag:'protein'},{text:'Baked fish', tag:'omega'},{text:'Dark chocolate', tag:'magnesium'}],
    ],
    luteal: [
      [{text:'Banana oats (magnesium)', tag:'magnesium'},{text:'Warm soup + wholegrain bread', tag:''},{text:'Sweet potato + beans', tag:''},{text:'Pumpkin seeds', tag:'magnesium'}],
      [{text:'Yoghurt bowl', tag:'protein'},{text:'Brown rice + tofu', tag:'protein'},{text:'Salmon + salad', tag:'omega'},{text:'Walnuts', tag:'omega'}],
      [{text:'Smoothie with flaxseed', tag:'omega'},{text:'Lentil curry', tag:'protein'},{text:'Chicken stew', tag:'protein'},{text:'Dates', tag:'iron'}],
      [{text:'Egg & toast', tag:'protein'},{text:'Quinoa + veg', tag:''},{text:'Roasted veggies', tag:''},{text:'Yoghurt', tag:''}],
      [{text:'Porridge + seeds', tag:'magnesium'},{text:'Bean salad', tag:'protein'},{text:'Grilled fish', tag:'omega'},{text:'Fruit & nuts', tag:''}],
      [{text:'Mango smoothie', tag:''},{text:'Palak dal', tag:'iron'},{text:'Steamed fish', tag:'omega'},{text:'Almonds', tag:'magnesium'}],
      [{text:'Oat bowl', tag:'magnesium'},{text:'Veg biryani', tag:''},{text:'Lentil soup', tag:'protein'},{text:'Herbal tea', tag:''}],
    ],
  };

  // state
  let plan = loadPlan() || createEmptyPlan();
  let editing = {day:null,meal:null};

  // build grid header & rows
  function buildGrid(){
    plannerGrid.innerHTML = '';
    // top-left blank
    const corner = document.createElement('div'); corner.className='header-cell'; corner.textContent='Meal / Day';
    plannerGrid.appendChild(corner);

    // day headers
    DAYS.forEach((d,i)=>{
      const hd = document.createElement('div'); hd.className='header-cell'; hd.textContent = `${d}`;
      plannerGrid.appendChild(hd);
    });

    // rows per meal
    MEALS.forEach(meal=>{
      const label = document.createElement('div'); label.className='meal-label'; label.textContent = meal;
      plannerGrid.appendChild(label);
      // cells
      for(let i=0;i<7;i++){
        const cell = document.createElement('div');
        cell.className='cell';
        cell.setAttribute('data-day', i);
        cell.setAttribute('data-meal', meal);
        // populate
        renderCell(cell,i,meal);
        // click to edit
        cell.addEventListener('click', ()=> openEdit(i,meal));
        plannerGrid.appendChild(cell);
      }
    });
  }

  function renderCell(cell, dayIndex, mealType){
    const entry = plan[dayIndex][MEALS.indexOf(mealType)] || {text:'', tag:''};
    cell.innerHTML = '';
    const t = document.createElement('div'); t.className='meal-title'; t.textContent = entry.text || '—';
    const p = document.createElement('div'); p.className='meal-text'; p.textContent = entry.text? entry.text : 'Tap to add';
    const tagWrap = document.createElement('div'); tagWrap.className='cell-tag';
    if(entry.tag){
      const tagDot = document.createElement('span'); tagDot.className = `tag ${entry.tag}`; tagWrap.appendChild(tagDot);
      const tagName = document.createElement('span'); tagName.style.color = 'var(--muted)'; tagName.style.fontSize='0.85rem';
      tagName.textContent = entry.tag.charAt(0).toUpperCase() + entry.tag.slice(1);
      tagWrap.appendChild(tagName);
    }
    cell.appendChild(t);
    cell.appendChild(p);
    cell.appendChild(tagWrap);
  }

  // modal
  const editModal = document.getElementById('editModal');
  const editDaySpan = document.getElementById('editDay');
  const editMealType = document.getElementById('editMealType');
  const mealText = document.getElementById('mealText');
  const tagButtons = Array.from(document.querySelectorAll('.tagbtn'));
  const editForm = document.getElementById('editForm');
  const deleteCellBtn = document.getElementById('deleteCell');
  const modalClose = document.querySelector('.modal-close');

  function openEdit(day, meal){
    editing.day = day; editing.meal = meal;
    editDaySpan.textContent = DAYS[day];
    editMealType.textContent = meal;
    const current = plan[day][MEALS.indexOf(meal)];
    mealText.value = current ? current.text : '';
    // clear tag active states
    tagButtons.forEach(b => b.classList.remove('active'));
    if(current && current.tag){
      const tb = tagButtons.find(b => b.dataset.tag === current.tag);
      if(tb) tb.classList.add('active');
    }
    editModal.style.display='flex';
    editModal.setAttribute('aria-hidden','false');
  }
  function closeModal(){
    editModal.style.display='none';
    editModal.setAttribute('aria-hidden','true');
  }
  modalClose.addEventListener('click', closeModal);
  editModal.addEventListener('click', (e)=>{ if(e.target === editModal) closeModal(); });

  // tag setters
  let selectedTag = '';
  tagButtons.forEach(btn=>{
    btn.addEventListener('click', () => {
      const tag = btn.dataset.tag || '';
      selectedTag = tag;
      tagButtons.forEach(b=>b.classList.remove('active'));
      if(tag) btn.classList.add('active');
    });
  });

  // save form
  editForm.addEventListener('submit', (e)=>{
    e.preventDefault();
    const text = mealText.value.trim();
    const day = editing.day;
    const mealIdx = MEALS.indexOf(editing.meal);
    plan[day][mealIdx] = {text, tag:selectedTag};
    savePlan();
    buildGrid();
    closeModal();
  });

  deleteCellBtn.addEventListener('click', ()=>{
    const day = editing.day; const mealIdx = MEALS.indexOf(editing.meal);
    plan[day][mealIdx] = {text:'', tag:''};
    savePlan(); buildGrid(); closeModal();
  });

  // apply phase presets
  applyPhaseBtn.addEventListener('click', ()=>{
    const phase = phaseSelect.value;
    applyPhasePlan(phase);
    savePlan();
    buildGrid();
  });

  function applyPhasePlan(phase){
    const preset = phasePresets[phase];
    if(!preset) return;
    for(let d=0; d<7; d++){
      plan[d] = [];
      for(let m=0;m<4;m++){
        const cellPreset = preset[d][m] || {text:'', tag:''};
        plan[d][m] = {text: cellPreset.text || '', tag: cellPreset.tag || ''};
      }
    }
  }

  // download/print plan
  downloadBtn.addEventListener('click', () => {
    const printable = buildPrintableHTML();
    const w = window.open('', '_blank', 'noopener,noreferrer');
    w.document.write(printable);
    w.document.close();
    // give browser a moment then call print
    setTimeout(()=> w.print(), 500);
  });

  function buildPrintableHTML(){
    let html = `<html><head><title>Saheli — Weekly Meal Plan</title>
    <style>body{font-family:sans-serif;padding:20px;color:#222}h1{color:${getComputedStyle(document.documentElement).getPropertyValue('--accent1') || '#ff6b6b'}}table{width:100%;border-collapse:collapse}td,th{border:1px solid #eee;padding:8px;text-align:left}th{background:#fafafa}</style></head><body>`;
    html += `<h1>Saheli — Weekly Meal Plan</h1>`;
    html += `<p>Phase: ${phaseSelect.value.charAt(0).toUpperCase()+phaseSelect.value.slice(1)}</p>`;
    html += `<table><thead><tr><th>Meal/Day</th>`;
    DAYS.forEach(d=> html += `<th>${d}</th>`);
    html += `</tr></thead><tbody>`;
    MEALS.forEach(m=>{
      html += `<tr><th>${m}</th>`;
      for(let d=0; d<7; d++){
        const entry = plan[d][MEALS.indexOf(m)] || {text:'', tag:''};
        html += `<td>${escapeHtml(entry.text || '')}${entry.tag ? `<br><small style="color:#666">[${entry.tag}]</small>` : ''}</td>`;
      }
      html += `</tr>`;
    });
    html += `</tbody></table></body></html>`;
    return html;
  }

  function escapeHtml(str){ return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

  // persistence
  function savePlan(){
    localStorage.setItem('saheli_weekly_plan', JSON.stringify(plan));
  }
  function loadPlan(){
    try{
      return JSON.parse(localStorage.getItem('saheli_weekly_plan'));
    }catch(e){ return null; }
  }
  function createEmptyPlan(){
    // 7 days x 4 meals
    const p = [];
    for(let d=0;d<7;d++){
      p[d]=[];
      for(let m=0;m<4;m++) p[d][m] = {text:'', tag:''};
    }
    return p;
  }

  // initial render
  if(!plan) plan = createEmptyPlan();
  buildGrid();

  // reveal animations
  const io = new IntersectionObserver(entries=>{
    entries.forEach(en=> { if(en.isIntersecting) en.target.classList.add('in-view'); });
  }, {threshold:0.16});
  document.querySelectorAll('[data-animate]').forEach(el=> io.observe(el));

  // utility: allow keyboard close modal
  document.addEventListener('keydown', (e)=>{
    if(e.key === 'Escape') closeModal();
  });
});
// Smooth scroll animation on load
document.addEventListener("DOMContentLoaded", () => {
  const animateEls = document.querySelectorAll("[data-animate]");
  animateEls.forEach(el => {
    el.style.opacity = 0;
    el.style.transform = "translateY(20px)";
    setTimeout(() => {
      el.style.transition = "all 0.8s ease";
      el.style.opacity = 1;
      el.style.transform = "translateY(0)";
    }, 300);
  });
});
