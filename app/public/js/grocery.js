// app/public/js/grocery.js
import { load_fromFridge, renderFridge, current_fridge } from "./fridge.js";

import { popupModal }                                  from "./popup.js";

const fridgeSearchInput  = document.querySelector(".fridge-panel .search-bar");
const grocerySearchInput = document.querySelector(".grocery-panel .search-bar");
const groceryGrid        = document.getElementById("grocery-grid");


document.addEventListener("DOMContentLoaded", async () => {
  // — 1) Populate & render the fridge panel exactly like /dashboard
  await load_fromFridge();
  renderFridge(fridgeSearchInput.value);
  fridgeSearchInput.addEventListener("input", e =>
    renderFridge(e.target.value)
  );

  // — 2) Build your grocery-list array from the same current_fridge state
  const groceryItems = Object.entries(current_fridge).map(
    ([name, meta]) => ({
      product_name: name,
      entry_date:   meta.date_into_fridge,
      exp_date:     meta.expiration,
      img_url:      meta.img_url,
      quantity:     meta.quantity,
    })
  );

  // — 3) Render & hook up search for your grocery panel
  renderGrocery(grocerySearchInput.value, groceryItems);
  grocerySearchInput.addEventListener("input", e =>
    renderGrocery(e.target.value, groceryItems)
  );
});

/**
 * Renders the Grocery grid using the same “.item” cards & pop-ups
 */
function renderGrocery(filter = "", items = []) {
  groceryGrid.innerHTML = "";
  const q = filter.trim().toLowerCase();

  items.forEach(item => {
    // search-filter
    if (q && !item.product_name.toLowerCase().includes(q)) return;

    // card
    const card = document.createElement("div");
    card.className = "item";
    card.innerHTML = `<div class="label">${item.product_name} (${item.quantity})</div>`;

    // popup on click
    card.addEventListener("click", () => {
      const model = document.createElement("popup-card");
      model.style.display = "block";
      model.data = {
        titleTxt:         item.product_name,
        date_into_fridge: item.entry_date,
        imgSrc:           item.img_url,
        expiration:       item.exp_date,
      };

      const overlay = document.createElement("div");
      overlay.id = "model-overlay";
      overlay.append(model);
      document.body.append(overlay);

      overlay.addEventListener("click", e => {
        if (e.target === overlay) overlay.remove();
      });
    });

    groceryGrid.append(card);
  });
}
