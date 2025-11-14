/* =====================================================
   Saheli — Authentication Frontend Logic
   Connects signup.html and login.html to backend APIs
   ===================================================== */

const API_BASE = "http://localhost:5000/api"; // backend URL

document.addEventListener("DOMContentLoaded", () => {
  console.log("Saheli Auth.js loaded ✅");

  // Detect current page
  const signupForm = document.getElementById("signupForm");
  const loginForm = document.getElementById("loginForm");

  /* ========================
     SIGNUP FORM HANDLER
  ========================= */
  if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("signupName").value.trim();
      const email = document.getElementById("signupEmail").value.trim();
      const password = document.getElementById("signupPassword").value.trim();
      const confirm = document.getElementById("signupConfirm").value.trim();

      if (password !== confirm) {
        alert("❌ Passwords do not match!");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Signup failed");

        alert("🎉 Signup successful! Please log in.");
        window.location.href = "login.html";
      } catch (err) {
        alert("❌ " + err.message);
        console.error(err);
      }
    });
  }

  /* ========================
     LOGIN FORM HANDLER
  ========================= */
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("loginEmail").value.trim();
      const password = document.getElementById("loginPassword").value.trim();

      try {
        const res = await fetch(`${API_BASE}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Login failed");

        alert("✅ Login successful! Welcome back.");
        localStorage.setItem("saheli_user", JSON.stringify(data.user));

        // Redirect to home or tracker
        window.location.href = "index.html";
      } catch (err) {
        alert("❌ " + err.message);
        console.error(err);
      }
    });
  }
});
