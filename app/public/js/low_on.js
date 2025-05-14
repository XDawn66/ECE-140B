async function fetchAndRender() {
  let [now, soon] = await Promise.all([
    fetch('/low_on/expired_now').then(r => r.json()),
    fetch('/low_on/expiring_soon').then(r => r.json())
  ]);

  const renderGrid = (elId, items, cssClass) => {
    const container = document.getElementById(elId);
    container.innerHTML = '';
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = `item-card ${cssClass}`;
     
      let title = document.createElement('div');
      title.textContent = item.product_name;
      card.appendChild(title);

      let date = document.createElement('div');
      date.textContent = new Date(item.exp_date).toLocaleDateString();
      card.appendChild(date);

      container.appendChild(card);
    });
  };

  renderGrid('expired-now', now, 'expired');
  renderGrid('expires-soon', soon, 'soon');
}

document.addEventListener('DOMContentLoaded', fetchAndRender);
