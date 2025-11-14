/* Remedies page interactions
   - category modal
   - expand remedy cards
   - suggest form: saves to localStorage
   - log symptom button (simple modal stub)
   - back-to-top, sticky nav, reveal on scroll
*/

document.addEventListener('DOMContentLoaded', () => {
  // Elements
  const nav = document.getElementById('mainNav');
  const catCards = document.querySelectorAll('.cat-card');
  const modal = document.getElementById('modal');
  const modalContent = document.getElementById('modalContent');
  const modalFooter = document.getElementById('modalFooter');
  const modalClose = modal.querySelector('.modal-close');
  const remedyGrid = document.getElementById('remedyGrid');
  const backToTop = document.getElementById('backToTop');
  const scrollToRemedies = document.getElementById('scrollToRemedies');

  // Sticky nav on scroll
  function onScrollNav(){
    if (window.scrollY > 50) nav.classList.add('scrolled'); else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScrollNav, {passive:true});
  onScrollNav();

  // Reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) en.target.classList.add('in-view');
    });
  }, {threshold:0.18});
  document.querySelectorAll('[data-animate]').forEach(el => io.observe(el));

  // Open category modal
  catCards.forEach(card => {
    card.addEventListener('click', () => {
      const title = card.getAttribute('data-title') || 'Category';
      const cat = card.getAttribute('data-cat') || '';
      const content = getCategoryContent(cat);
      modalContent.innerHTML = `<h2>${title}</h2><p class="muted">${content.text}</p><div class="examples">${content.examples}</div>`;
      modalFooter.innerHTML = `<button class="btn primary" id="modalTry">Try this</button>`;
      openModal();
      document.getElementById('modalTry').addEventListener('click', () => {
        closeModal();
        document.querySelector(`#remedies`)?.scrollIntoView({behavior:'smooth'});
      });
    });
  });

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });

  function openModal(){
    modal.style.display = 'flex';
    modal.setAttribute('aria-hidden','false');
  }
  function closeModal(){
    modal.style.display = 'none';
    modal.setAttribute('aria-hidden','true');
    modalContent.innerHTML = '';
    modalFooter.innerHTML = '';
  }

  function getCategoryContent(cat){
    // return simple content per category
    const map = {
      home: {
        text: 'Simple at-home comforts like warm compresses, hydration and rest.',
        examples: `<ul><li>Warm compress: 15–20 min</li><li>Ginger tea for nausea</li></ul>`
      },
      yoga: {
        text: 'Gentle poses and breathwork to ease cramps and calm the nervous system.',
        examples: `<ul><li>Child\'s pose</li><li>Legs up the wall</li></ul>`
      },
      tea: {
        text: 'Herbal infusions that soothe: chamomile, fennel, ginger, peppermint.',
        examples: `<ul><li>Chamomile before bed</li><li>Ginger for cramps</li></ul>`
      },
      self: {
        text: 'Rituals like baths, journaling, and compassionate rest.',
        examples: `<ul><li>A warm bath with Epsom</li><li>Journaling for emotions</li></ul>`
      }
    };
    return map[cat] || {text:'General tips and small rituals.', examples:''};
  }

  // Expand/collapse remedy card details and log symptom stub
  remedyGrid.addEventListener('click', (e) => {
    const expandBtn = e.target.closest('.expand');
    const logBtn = e.target.closest('.log');
    if (expandBtn) {
      const card = expandBtn.closest('.remedy-card');
      const more = card.querySelector('.remedy-more');
      const isHidden = more.getAttribute('aria-hidden') === 'true';
      if (isHidden) {
        more.style.display = 'block';
        more.setAttribute('aria-hidden','false');
        expandBtn.textContent = 'Show Less';
      } else {
        more.style.display = 'none';
        more.setAttribute('aria-hidden','true');
        expandBtn.textContent = 'Learn More';
      }
    }
    if (logBtn) {
      const card = logBtn.closest('.remedy-card');
      const title = card.querySelector('h3').textContent;
      modalContent.innerHTML = `<h2>Log symptom — ${title}</h2>
        <form id="logForm">
          <label>Intensity (1-10)<input id="intensity" type="number" min="1" max="10" value="5"></label>
          <label>Notes<textarea id="notes" rows="3"></textarea></label>
          <div style="text-align:right;margin-top:8px;"><button class="btn primary" type="submit">Save</button></div>
        </form>`;
      openModal();
      document.getElementById('logForm').addEventListener('submit', (ev) => {
        ev.preventDefault();
        const intensity = document.getElementById('intensity').value;
        const notes = document.getElementById('notes').value;
        // Save to localStorage as simple log (could be sent to backend later)
        const logs = JSON.parse(localStorage.getItem('saheli_remedy_logs') || '[]');
        logs.unshift({title, intensity, notes, ts: Date.now()});
        localStorage.setItem('saheli_remedy_logs', JSON.stringify(logs));
        modalFooter.innerHTML = `<div class="muted">Saved locally ✔️</div>`;
        setTimeout(closeModal, 900);
      });
    }
  });

  // Suggest form store locally
  const suggestForm = document.getElementById('suggestForm');
  const suggestMsg = document.getElementById('suggestMsg');
  suggestForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('sTitle').value.trim();
    const details = document.getElementById('sDetails').value.trim();
    const name = document.getElementById('sName').value.trim();
    if (!title || !details) {
      suggestMsg.textContent = 'Please fill required fields.';
      suggestMsg.style.color = 'crimson';
      return;
    }
    const suggestions = JSON.parse(localStorage.getItem('saheli_suggestions') || '[]');
    suggestions.unshift({name, title, details, ts: Date.now()});
    localStorage.setItem('saheli_suggestions', JSON.stringify(suggestions));
    suggestMsg.textContent = 'Thanks! Your suggestion is saved locally for review.';
    suggestMsg.style.color = 'green';
    suggestForm.reset();
    setTimeout(()=> suggestMsg.textContent = '', 3500);
  });

  // Back to top visibility
  window.addEventListener('scroll', () => {
    if (window.scrollY > 360) backToTop.style.display = 'block'; else backToTop.style.display = 'none';
  }, {passive:true});
  backToTop.addEventListener('click', () => window.scrollTo({top:0,behavior:'smooth'}));

  // Scroll CTA
  scrollToRemedies?.addEventListener('click', () => {
    document.getElementById('remedies').scrollIntoView({behavior:'smooth', block:'start'});
  });

  // Initialize remedy-more aria-hidden attributes
  document.querySelectorAll('.remedy-more').forEach(m => m.setAttribute('aria-hidden','true'));

  // Small accessibility: close modal with Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  // Minor console guard
  window.addEventListener('error', (ev) => console.warn('Non-blocking error:', ev.error));

}); // DOMContentLoaded end
