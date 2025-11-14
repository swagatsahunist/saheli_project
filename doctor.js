/* -------------------------
   Saheli Doctor Consultation — JS
   ------------------------- */
document.addEventListener("DOMContentLoaded", () => {
  const slides = document.querySelectorAll(".slide");
  let index = 0;
  function nextSlide() {
    slides.forEach((s) => s.classList.remove("active"));
    index = (index + 1) % slides.length;
    slides[index].classList.add("active");
  }
  setInterval(nextSlide, 4000);

  const doctors = [
    { name: "Dr. Nisha Mehta", speciality: "Gynecologist", exp: 12, lang: ["English","Hindi"], img: "images/doc1.jpg", email: "nisha@saheli.com", phone: "+91 9876543210" },
    { name: "Dr. Aarti Banerjee", speciality: "Nutritionist", exp: 8, lang: ["English","Bengali"], img: "images/doc2.jpg", email: "aarti@saheli.com", phone: "+91 9845238745" },
    { name: "Dr. Sneha Kapoor", speciality: "Psychologist", exp: 10, lang: ["Hindi","English"], img: "images/doc3.jpg", email: "sneha@saheli.com", phone: "+91 9811122233" },
    { name: "Dr. Ritu Sharma", speciality: "Gynecologist", exp: 14, lang: ["English","Hindi"], img: "images/doc4.jpg", email: "ritu@saheli.com", phone: "+91 9832456123" },
    { name: "Dr. Lata Krishnan", speciality: "Nutritionist", exp: 9, lang: ["English","Tamil"], img: "images/doc5.jpg", email: "lata@saheli.com", phone: "+91 9941122200" },
    { name: "Dr. Meera Joshi", speciality: "General Physician", exp: 11, lang: ["English","Marathi"], img: "images/doc6.jpg", email: "meera@saheli.com", phone: "+91 9784512365" },
    { name: "Dr. Priya Sen", speciality: "Gynecologist", exp: 13, lang: ["English","Bengali"], img: "images/doc7.jpg", email: "priya@saheli.com", phone: "+91 9988776655" },
    { name: "Dr. Deepa Rao", speciality: "Psychologist", exp: 7, lang: ["English","Tamil"], img: "images/doc8.jpg", email: "deepa@saheli.com", phone: "+91 9123456789" },
    { name: "Dr. Kavita Mishra", speciality: "Nutritionist", exp: 10, lang: ["English","Hindi"], img: "images/doc9.jpg", email: "kavita@saheli.com", phone: "+91 9912345678" },
    { name: "Dr. Anjali Deshmukh", speciality: "General Physician", exp: 15, lang: ["English","Marathi"], img: "images/doc10.jpg", email: "anjali@saheli.com", phone: "+91 9988771122" },
    { name: "Dr. Ishita Roy", speciality: "Psychologist", exp: 6, lang: ["English","Bengali"], img: "images/doc11.jpg", email: "ishita@saheli.com", phone: "+91 9798991122" },
    { name: "Dr. Varsha Pillai", speciality: "Nutritionist", exp: 8, lang: ["English","Tamil"], img: "images/doc12.jpg", email: "varsha@saheli.com", phone: "+91 9812347654" },
    { name: "Dr. Poonam Tiwari", speciality: "Gynecologist", exp: 16, lang: ["Hindi","English"], img: "images/doc13.jpg", email: "poonam@saheli.com", phone: "+91 9876512345" },
    { name: "Dr. Shreya Patil", speciality: "General Physician", exp: 10, lang: ["English","Marathi"], img: "images/doc14.jpg", email: "shreya@saheli.com", phone: "+91 9865432198" },
    { name: "Dr. Reena Das", speciality: "Nutritionist", exp: 9, lang: ["English","Bengali"], img: "images/doc15.jpg", email: "reena@saheli.com", phone: "+91 9933445566" },
    { name: "Dr. Alka Jain", speciality: "Gynecologist", exp: 18, lang: ["English","Hindi"], img: "images/doc16.jpg", email: "alka@saheli.com", phone: "+91 9823456789" },
  ];

  const container = document.getElementById("doctorList");
  const langFilter = document.getElementById("language");
  const specFilter = document.getElementById("speciality");
  const modal = document.getElementById("contactModal");
  const closeModal = document.getElementById("closeModal");

  const modalName = document.getElementById("modalName");
  const modalSpeciality = document.getElementById("modalSpeciality");
  const modalEmail = document.getElementById("modalEmail");
  const modalPhone = document.getElementById("modalPhone");

  function renderDoctors() {
    const langVal = langFilter.value;
    const specVal = specFilter.value;

    container.innerHTML = "";

    const filtered = doctors.filter(
      (d) =>
        (langVal === "all" || d.lang.includes(langVal)) &&
        (specVal === "all" || d.speciality === specVal)
    );

    filtered.forEach((d) => {
      const card = document.createElement("div");
      card.className = "doctor-card";
      card.innerHTML = `
        <img src="${d.img}" alt="${d.name}">
        <h4>${d.name}</h4>
        <p><strong>${d.speciality}</strong> • ${d.exp} yrs exp</p>
        <p>Languages: ${d.lang.join(", ")}</p>
        <button>Contact</button>
      `;
      card.querySelector("button").addEventListener("click", () => {
        modalName.textContent = d.name;
        modalSpeciality.textContent = d.speciality;
        modalEmail.textContent = d.email;
        modalPhone.textContent = d.phone;
        modal.style.display = "flex";
      });
      container.appendChild(card);
    });
  }

  renderDoctors();

  langFilter.addEventListener("change", renderDoctors);
  specFilter.addEventListener("change", renderDoctors);

  closeModal.addEventListener("click", () => (modal.style.display = "none"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });

  document.getElementById("year").textContent = new Date().getFullYear();
});
