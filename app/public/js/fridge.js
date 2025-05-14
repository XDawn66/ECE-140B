// simple in-memory store
const fridgeItems = [];

// DOM refs
const scanBtn      = document.getElementById('scan-btn');
const searchInput  = document.getElementById('search-input');
const fridgeGrid   = document.getElementById('fridge-grid');
const expiredNow   = document.getElementById('expired-now');
const expiredSoon  = document.getElementById('expired-soon');

// helper: parse YYYY-MM-DD → Date
function parseDate(str) {
  const [y,m,d] = str.split('-').map(Number);
  return new Date(y, m-1, d);
}

// render all sections
function render() {
  fridgeGrid.innerHTML = '';
  expiredNow.innerHTML = '';
  expiredSoon.innerHTML = '';

  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);

  const query = searchInput.value.trim().toLowerCase();

  fridgeItems.forEach(item => {
    const { name, expDate } = item;
    const expires = parseDate(expDate);

    // categorize
    let section;
    let cls;
    if (expires < today) {
      section = expiredNow;
      cls = 'expired';
    } else if (expires <= nextWeek) {
      section = expiredSoon;
      cls = 'soon';
    } else {
      section = fridgeGrid;
      cls = '';
    }

    // filter search only on the fridge panel
    if (section === fridgeGrid && query && !name.toLowerCase().includes(query)) {
      return;
    }

    // build element
    const el = document.createElement('div');
    el.className = 'item ' + cls;
    const label = document.createElement('div');
    label.className = 'label';
    label.textContent = name;
    el.appendChild(label);
    section.appendChild(el);
  });
}

// simulate scanning by prompting user
scanBtn.addEventListener('click', () => {
  const name    = prompt("Item name?");
  const expDate = prompt("Expiration date (YYYY-MM-DD)?");
  if (name && expDate) {
    fridgeItems.push({ name, expDate });
    render();
  }
});

// live‐search
searchInput.addEventListener('input', render);

// initial render
render();
