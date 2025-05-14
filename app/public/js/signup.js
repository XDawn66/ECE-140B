document.addEventListener('DOMContentLoaded', () => {
  const fields = [
    'fname',
    'lname',
    'user',
    'email',
    'pword'
  ].map(id => document.getElementById(id));

  const btn = document.getElementById('signup-btn');

  function toggleButton() {
    btn.disabled = !fields.every(el => el.value.trim());
  }

  fields.forEach(el => el.addEventListener('input', toggleButton));

  // initialize disabled state
  toggleButton();
});
