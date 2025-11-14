/* =====================================
   Saheli | Myths vs Facts Interactivity
   ===================================== */

// 🌸 Smooth scroll-in animation for sections
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
      }
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll("[data-animate]").forEach((el) => observer.observe(el));

// 🌼 Tooltip setup
const tooltip = document.createElement("div");
tooltip.classList.add("tooltip");
document.body.appendChild(tooltip);

// Function to show tooltip
function showTooltip(text, x, y) {
  tooltip.textContent = text;
  tooltip.style.left = `${x + 10}px`;
  tooltip.style.top = `${y + 10}px`;
  tooltip.classList.add("visible");
}

// Function to hide tooltip
function hideTooltip() {
  tooltip.classList.remove("visible");
}

// 🌺 Handle hover and click on cards
const cards = document.querySelectorAll(".card");

cards.forEach((card) => {
  const factText = card.getAttribute("data-fact");

  // Hover events (desktop)
  card.addEventListener("mouseenter", (e) => {
    if (window.innerWidth > 768) {
      const rect = card.getBoundingClientRect();
      showTooltip(factText, rect.x + rect.width / 2, rect.y + 20);
    }
  });

  card.addEventListener("mouseleave", () => {
    hideTooltip();
  });

  // Click/tap events (mobile)
  card.addEventListener("click", (e) => {
    const rect = card.getBoundingClientRect();
    if (tooltip.classList.contains("visible")) {
      hideTooltip();
    } else {
      showTooltip(factText, rect.x + rect.width / 2, rect.y + 20);
    }
  });
});

// 🌷 Scroll to top button
const backToTop = document.createElement("button");
backToTop.textContent = "↑";
backToTop.classList.add("back-to-top");
document.body.appendChild(backToTop);

backToTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

window.addEventListener("scroll", () => {
  if (window.scrollY > 300) {
    backToTop.classList.add("show");
  } else {
    backToTop.classList.remove("show");
  }
});

// 🌹 Add floating hover effect for cards
cards.forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.transform = `rotateY(${(x / rect.width - 0.5) * 10}deg) rotateX(${-(y / rect.height - 0.5) * 10}deg) scale(1.03)`;
  });
  card.addEventListener("mouseleave", () => {
    card.style.transform = "rotateY(0) rotateX(0) scale(1)";
  });
});

// 🌸 Add style for back-to-top dynamically
const style = document.createElement("style");
style.textContent = `
  .back-to-top {
    position: fixed;
    bottom: 25px;
    right: 25px;
    background-color: var(--primary-color);
    color: #fff;
    border: none;
    font-size: 1.4rem;
    width: 45px;
    height: 45px;
    border-radius: 50%;
    cursor: pointer;
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.4s, transform 0.4s;
    box-shadow: 0 4px 10px var(--shadow);
  }
  .back-to-top.show {
    opacity: 1;
    transform: translateY(0);
  }
`;
document.head.appendChild(style);
/* ================================
   Did You Know? Tooltip Logic
   ================================ 
document.querySelectorAll('.did-you-know-btn').forEach(button => {
  button.addEventListener('click', (e) => {
    e.stopPropagation();

    // Remove existing tooltip if any
    const existingTooltip = document.querySelector('.tooltip');
    if (existingTooltip) existingTooltip.remove();

    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = button.getAttribute('data-tip') || 'Interesting fact coming soon!';
    document.body.appendChild(tooltip);

    // Position tooltip near the button
    const rect = button.getBoundingClientRect();
    const scrollY = window.scrollY || window.pageYOffset;
    tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + 'px';
    tooltip.style.top = rect.top + scrollY - tooltip.offsetHeight - 12 + 'px';

    // Animate in
    requestAnimationFrame(() => tooltip.classList.add('visible'));

    // Remove tooltip on next click anywhere else
    const removeTooltip = () => {
      tooltip.classList.remove('visible');
      setTimeout(() => tooltip.remove(), 250);
      document.removeEventListener('click', removeTooltip);
    };
    setTimeout(() => document.addEventListener('click', removeTooltip), 100);
  });
});
*/