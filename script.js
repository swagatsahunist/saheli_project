// Saheli — vanilla JS: carousel, nav toggle, back-to-top, sakhi
document.addEventListener('DOMContentLoaded', () => {
  // year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* NAV toggle (mobile) */
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.querySelector('.nav-links');
  navToggle?.addEventListener('click', () => {
    if (!navLinks) return;
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
  });

  /* STICKY nav styling on scroll */
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    if (!nav) return;
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  /* CAROUSEL */
  const slides = Array.from(document.querySelectorAll('.slide'));
  const prev = document.querySelector('.arrow.prev');
  const next = document.querySelector('.arrow.next');
  const dots = Array.from(document.querySelectorAll('.dot'));
  let idx = 0;
  const INTERVAL = 4000;
  let timer = null;

  function show(i) {
    idx = (i + slides.length) % slides.length;
    slides.forEach((s, si) => s.classList.toggle('active', si === idx));
    dots.forEach((d, di) => d.classList.toggle('active', di === idx));
  }

  function nextSlide() { show(idx + 1); }
  function prevSlide() { show(idx - 1); }
  function play() { stop(); timer = setInterval(nextSlide, INTERVAL); }
  function stop() { if (timer) clearInterval(timer); timer = null; }

  // init
  show(0);
  play();

  // controls
  next?.addEventListener('click', () => { nextSlide(); stop(); });
  prev?.addEventListener('click', () => { prevSlide(); stop(); });
  dots.forEach((d, i) => d.addEventListener('click', () => { show(i); stop(); }));

  // pause on hover/focus
  const carouselEl = document.querySelector('.carousel');
  carouselEl?.addEventListener('mouseenter', stop);
  carouselEl?.addEventListener('mouseleave', play);

  // keyboard
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { prevSlide(); stop(); }
    if (e.key === 'ArrowRight') { nextSlide(); stop(); }
  });

  /* BACK TO TOP + SAKHI */
  const backTop = document.getElementById('backTop');
  const sakhi = document.getElementById('sakhi');
  window.addEventListener('scroll', () => {
    if (backTop) backTop.style.display = window.scrollY > 400 ? 'block' : 'none';
  }, { passive: true });

  backTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  sakhi?.addEventListener('click', () => alert('Sakhi 2.0 — AI companion coming soon.'));

  /* Accessibility: focus visible */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') document.body.classList.add('show-focus');
  });
});
