document.addEventListener("DOMContentLoaded", () => {
  // Reveal on scroll animation
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("in-view");
    });
  }, { threshold: 0.2 });

  document.querySelectorAll("[data-animate]").forEach(el => observer.observe(el));
});
