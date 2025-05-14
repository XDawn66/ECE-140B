// app/public/js/login.js
document.addEventListener('DOMContentLoaded', () => {
  const userEl  = document.getElementById('user');
  const passEl  = document.getElementById('pword');
  const btn     = document.getElementById('login-btn');

  function toggleButton() {
    btn.disabled = !(userEl.value.trim() && passEl.value.trim());
  }

  userEl.addEventListener('input', toggleButton);
  passEl.addEventListener('input', toggleButton);

  // initialize
  toggleButton();
});
