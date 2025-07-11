// app/public/js/fridge.js
import { popupModal } from "./popup.js";

//const lookupButton = document.getElementById("myButton");
// const productName = document.getElementById("productName");
// const productDescription = document.getElementById("productDescription");
// const productImage = document.getElementById("productImage");
// const inputbarcode = document.getElementById("productId");
const fridgeGrid = document.getElementById("fridge-grid");

const expiredPanel = document.querySelector(".expired-panel");

const fabMainButton = document.getElementById("fab-main");
const fabOptionsDiv = document.getElementById("fab-options");
const fabCustomBtn = document.getElementById("fab-custom");
const fabScanBtn = document.getElementById("fab-scan");

fabMainButton.addEventListener("click", () => {
  fabOptionsDiv.classList.toggle("hidden");
});

fabCustomBtn.addEventListener("click", () => {
  fabOptionsDiv.classList.add("hidden");
  showCustomItemOverlay();
});
fabScanBtn.addEventListener("click", () => {
  fabOptionsDiv.classList.add("hidden");
  showScanOverlay();
});

let expiredNowSection, expiredSoonSection, expiredNowGrid, expiredSoonGrid;

if (expiredPanel) {
  expiredNowSection = expiredPanel.querySelector(".subpanel:nth-of-type(1)");
  expiredSoonSection = expiredPanel.querySelector(".subpanel:nth-of-type(2)");
  expiredNowGrid = document.getElementById("expired-now");
  expiredSoonGrid = document.getElementById("expired-soon");
}

const searchInput =
  document.getElementById("search-input") ||
  document.querySelector(".fridge-panel .search-bar");

// your expiration lookup
const expiration_table = {
  // 🥛 Dairy
  Milk: 7,
  Yogurt: 10,
  Cheese: 14,
  Butter: 30,
  Cream: 7,
  Eggs: 21,
  SourCream: 10,
  CottageCheese: 7,

  // 🍖 Meat & Seafood
  Chicken: 2,
  Fish: 2,
  "Ground beef": 2,
  Beef: 3,
  Pork: 3,
  Bacon: 7,
  Sausage: 4,
  Turkey: 2,
  Ham: 5,
  Shrimp: 2,

  // 🥦 Vegetables
  Lettuce: 5,
  Spinach: 3,
  Tomatoes: 5,
  Cucumbers: 7,
  Mushrooms: 5,
  Avocados: 3,
  Broccoli: 5,
  Carrots: 21,
  Potatoes: 30,
  Onions: 30,
  BellPeppers: 5,
  Zucchini: 5,
  Celery: 10,
  Cauliflower: 5,

  // 🍓 Fruits
  Strawberries: 5,
  Bananas: 5,
  Apples: 30,
  Oranges: 21,
  Grapes: 7,
  Blueberries: 7,
  Lemons: 21,
  Limes: 21,
  Mangoes: 5,
  Pineapple: 7,

  // 🍞 Bakery & Grains
  Bread: 4,
  Bagels: 5,
  Tortillas: 7,
  Rice: 180,
  Pasta: 180,
  Cereal: 90,
  Crackers: 60,
  Oats: 90,

  // 🥫 Pantry
  PeanutButter: 180,
  Jam: 60,
  Honey: 365,
  CannedBeans: 365,
  CannedSoup: 365,
  Flour: 180,
  Sugar: 365,
  CookingOil: 180,

  // 🥤 Beverages
  Water: 620,
  Juice: 10,
  Soda: 180,
  Coffee: 120,
  Tea: 180,
  "Plant-based Milk": 7,

  // 🧂 Condiments & Sauces
  Ketchup: 90,
  Mustard: 90,
  Mayonnaise: 60,
  SoySauce: 180,
  HotSauce: 180,
  BBQSauce: 60,
  SaladDressing: 60,
  Vinegar: 365,
};

// starting state
let current_fridge = {};

function renderFridge(filter = "") {
  fridgeGrid.innerHTML = "";
  const today = new Date();
  const q = filter.trim().toLowerCase();

  Object.entries(current_fridge).forEach(([name, meta]) => {
    if (q && !name.toLowerCase().includes(q)) return;

    const div = document.createElement("div");
    div.classList.add("item");

    if (meta.expiration === null) {
      div.classList.add("no-expiration");
    } else {
      const entry = new Date(meta.date_into_fridge);
      let expDate;
      if (
        typeof meta.expiration === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(meta.expiration)
      ) {
        expDate = new Date(meta.expiration);
      } else {
        const shelf = get_expected_expiration(name);
        expDate = new Date(entry.getTime() + shelf * 86400000);
      }
      if (expDate < today) {
        div.classList.add("expired");
      } else if (expDate - today < 7 * 86400000) {
        div.classList.add("soon");
      } else {
        div.classList.add("fresh");
      }
    }

    const labelDiv = document.createElement("div");
    labelDiv.classList.add("label");
    labelDiv.textContent = `${name} (${meta.quantity})`;

    div.appendChild(labelDiv);

    fridgeGrid.appendChild(div);

    // pop-up with choices
    div.addEventListener("click", () => {
      // 2a) Build overlay
      const overlay = document.createElement("div");
      overlay.classList.add("modal-overlay");
      overlay.id = "generic-modal";
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          document.body.removeChild(overlay);
        }
      });

      const modalBox = document.createElement("div");
      modalBox.classList.add("modal-content");

      // Back arrow button
      const backBtn = document.createElement("button");
      backBtn.classList.add("modal-close"); // reuse same styling as close “×”
      backBtn.innerHTML = "←";
      backBtn.style.position = "absolute";
      backBtn.style.top = ".75rem";
      backBtn.style.right = "22rem";
      backBtn.addEventListener("click", () => {
        editSection.style.display = "none";
        choiceRow.style.display = "flex";
      });
      modalBox.appendChild(backBtn);

      // Item image
      if (meta.img_url && meta.img_url !== "N/A") {
        const imgEl = document.createElement("img");
        imgEl.src = meta.img_url;
        imgEl.alt = name;
        imgEl.classList.add("modal-item-image");
        imgEl.style.display = "block";
        imgEl.style.margin = "1rem auto 0 auto";
        imgEl.style.width = "100px";
        imgEl.style.height = "100px";
        imgEl.style.objectFit = "cover";
        imgEl.style.border = "1px solid #e5e7eb";
        imgEl.style.borderRadius = "0.25rem";
        modalBox.appendChild(imgEl);
      }

      const titleH2 = document.createElement("h2");
      titleH2.classList.add("modal-title");
      titleH2.textContent = name;
      titleH2.style.textAlign = "center";
      titleH2.style.marginTop =
        meta.img_url && meta.img_url !== "N/A" ? "0.5rem" : "1rem";
      modalBox.appendChild(titleH2);

      const choiceRow = document.createElement("div");
      choiceRow.classList.add("modal-choice-row");

      // Edit Expiration
      const btnEdit = document.createElement("button");
      btnEdit.type = "button";
      btnEdit.classList.add("modal-option-button");
      btnEdit.textContent = "Edit Expiration";
      choiceRow.appendChild(btnEdit);

      // Remove Item
      const btnRemove = document.createElement("button");
      btnRemove.type = "button";
      btnRemove.classList.add("modal-remove-button");
      btnRemove.textContent = "Remove Item";
      choiceRow.appendChild(btnRemove);

      modalBox.appendChild(choiceRow);

      // Edit Expiration
      const editSection = document.createElement("div");
      editSection.classList.add("edit-exp-section");
      editSection.style.display = "none";

      // Expiration Date
      const expLabel = document.createElement("label");
      expLabel.setAttribute("for", "edit-exp");
      expLabel.classList.add("modal-label");
      expLabel.textContent = "Expiration Date";
      editSection.appendChild(expLabel);

      const expInput = document.createElement("input");
      expInput.type = "date";
      expInput.id = "edit-exp";
      expInput.classList.add("modal-date-input");
      if (meta.expiration && /^\d{4}-\d{2}-\d{2}$/.test(meta.expiration)) {
        expInput.value = meta.expiration;
      } else {
        const entryDate = new Date(meta.date_into_fridge);
        const shelf = get_expected_expiration(name) || 0;
        entryDate.setDate(entryDate.getDate() + shelf);
        expInput.value = entryDate.toISOString().split("T")[0];
      }
      editSection.appendChild(expInput);

      const adjustRow = document.createElement("div");
      adjustRow.classList.add("exp-adjust-row");

      function makeButton(label, delta) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.classList.add("exp-button");
        btn.textContent = label;
        btn.addEventListener("click", () => {
          let d = new Date(expInput.value);
          if (isNaN(d)) d = new Date();
          d.setDate(d.getDate() + delta);
          expInput.value = d.toISOString().split("T")[0];
        });
        return btn;
      }

      adjustRow.appendChild(makeButton("−1 Week", -7));
      adjustRow.appendChild(makeButton("−1 Day", -1));
      adjustRow.appendChild(makeButton("+1 Day", +1));
      adjustRow.appendChild(makeButton("+1 Week", +7));
      editSection.appendChild(adjustRow);

      // Save / Cancel row
      const actionRow = document.createElement("div");
      actionRow.classList.add("modal-action-row");

      const saveBtn = document.createElement("button");
      saveBtn.type = "button";
      saveBtn.classList.add("modal-save-button");
      saveBtn.textContent = "Save";
      saveBtn.addEventListener("click", () => {
        const sel = new Date(expInput.value);
        if (isNaN(sel)) {
          alert("Enter a valid expiration date");
          return;
        }
        const newExpISO = sel.toISOString().split("T")[0];
        fetch(
          `/update-fridge-items/${encodeURIComponent(name)}/${newExpISO}/${
            meta.date_into_fridge
          }`,
          { method: "POST" }
        )
          .then((res) => {
            if (!res.ok) {
              return res.text().then((txt) => {
                throw new Error(txt);
              });
            }
            return res.json();
          })
          .then(() => {
            document.body.removeChild(overlay);
            load_fromFridge();
          })
          .catch((err) => {
            alert("Update failed: " + err.message);
          });
      });
      actionRow.appendChild(saveBtn);

      const cancelBtn = document.createElement("button");
      cancelBtn.type = "button";
      cancelBtn.classList.add("modal-cancel-button");
      cancelBtn.textContent = "Cancel";
      cancelBtn.addEventListener("click", () => {
        document.body.removeChild(overlay);
      });
      actionRow.appendChild(cancelBtn);

      editSection.appendChild(actionRow);
      modalBox.appendChild(editSection);

      btnEdit.addEventListener("click", () => {
        choiceRow.style.display = "none";
        editSection.style.display = "block";
      });

      btnRemove.addEventListener("click", () => {
        removeItemFromFridge(name, meta.date_into_fridge);
        document.body.removeChild(overlay);
      });

      overlay.appendChild(modalBox);
      document.body.appendChild(overlay);
    });
  });
}

function renderExpiredPanels() {
  if (!expiredPanel) return;
  const expiredHeader = expiredPanel.querySelector("h1");
  if (expiredHeader) {
    expiredHeader.style.display = "none";
  }

  expiredNowGrid.innerHTML = "";
  expiredSoonGrid.innerHTML = "";

  const today = new Date();
  const weekMs = 7 * 24 * 60 * 60 * 1000;

  let hasExpired = false;
  let hasSoon = false;

  for (const [name, meta] of Object.entries(current_fridge)) {
    if (!meta.expiration) continue;
    const expDate = new Date(meta.expiration);
    if (isNaN(expDate)) continue;

    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `<div class="label">${name} (${meta.quantity})</div>`;

    if (expDate < today) {
      div.classList.add("expired");
      expiredNowGrid.appendChild(div);
      hasExpired = true;
    } else if (expDate - today < weekMs) {
      div.classList.add("soon");
      expiredSoonGrid.appendChild(div);
      hasSoon = true;
    }
  }

  if (!hasExpired && !hasSoon) {
    expiredNowSection.style.display = "";
    expiredSoonSection.style.display = "none";
    expiredNowSection.querySelector("h2").textContent = "Expired";
    expiredNowGrid.innerHTML = `<div class="empty"></div>`;
  } else if (hasExpired && !hasSoon) {
    //  expired‐now items
    expiredNowSection.style.display = "";
    expiredSoonSection.style.display = "none";
    expiredNowSection.querySelector("h2").textContent = "Expired Now";
  } else if (!hasExpired && hasSoon) {
    //  next‐week items
    expiredNowSection.style.display = "";
    expiredSoonSection.style.display = "none";
    expiredNowSection.querySelector("h2").textContent = "Expires Next Week";

    expiredNowGrid.innerHTML = expiredSoonGrid.innerHTML;
  } else {
    expiredNowSection.style.display = "";
    expiredSoonSection.style.display = "";
    expiredNowSection.querySelector("h2").textContent = "Expired Now";
    expiredSoonSection.querySelector("h2").textContent = "Expires Next Week";
  }
}

async function load_fromFridge() {
  fetch("/api/fridge-items")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load fridge items");
      return res.json();
    })
    .then((items) => {
      current_fridge = {};
      items.forEach((item) => {
        const name = item.product_name;
        const days = item.exp_date;
        const img = item.img_url || "N/A"; // optional image URL

        if (!current_fridge[name]) {
          current_fridge[name] = {
            date_into_fridge: item.entry_date,
            expiration: days,
            quantity: 1,
            img_url: img,
          };
        } else {
          current_fridge[name].quantity++;
        }
      });
      renderFridge();
      if (expiredPanel) renderExpiredPanels();
    })
    .catch((err) => {
      console.error(err);
      alert("Could not load fridge: " + err.message);
    });
}

// add an item into the current_fridge and re-render
function add_toFridge(item_name, barcode, days, img_src) {
  const todayISO = new Date().toISOString().split("T")[0];
  const expDateISO =
    days !== null
      ? new Date(Date.now() + days * 86400000).toISOString().split("T")[0]
      : null;
  if (!current_fridge[item_name]) {
    current_fridge[item_name] = {
      date_into_fridge: todayISO,
      expiration: days,
      quantity: 1,
    };
  } else {
    current_fridge[item_name].quantity++;
  }
  renderFridge();
  if (typeof renderExpiredPanels === "function") {
    renderExpiredPanels();
  }

  const payload = {
    barcode: barcode,
    product_name: item_name,
    entry_date: todayISO,
    exp_date: expDateISO,
  };

  if (days != null) {
    payload.exp_date = new Date(Date.now() + days * 86400000)
      .toISOString()
      .split("T")[0];
  }
  renderFridge();

  //save to the sql database
  fetch("/api/fridge-items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      barcode: barcode,
      product_name: item_name,
      entry_date: todayISO,
      exp_date: expDateISO, // always present, even if null
      img_url: img_src || "N/A", // optional image URL
    }),
  })
    .then((res) => {
      if (!res.ok)
        return res.text().then((t) => {
          throw new Error(t);
        });
      return res.json();
    })
    .then(() => {
      alert("Item saved to your fridge!");
    })
    .catch((err) => {
      console.error("Save failed:", err);
      alert("Could not save: " + err.message);
    });

  load_fromFridge();
  //alert(`${item_name} added to fridge (${current_fridge[item_name].quantity})`);
}

// existing expiration checker
function get_expected_expiration(item_name) {
  for (let item in expiration_table) {
    if (item_name.toLowerCase().includes(item.toLowerCase())) {
      return expiration_table[item];
    }
  }
  return -1; // not found
}

function removeItemFromFridge(itemName, entryDate) {
  if (!current_fridge[itemName]) {
    alert("Item not found in fridge: " + itemName);
    return;
  }
  current_fridge[itemName].quantity--;
  // If quantity is 1 or less, add to low on lis
  if (current_fridge[itemName].quantity <= 1) {
    console.log("Sending to /api/add_low_list:", {
      product_name: itemName,
      last_entry_date: entryDate,
      img_url: current_fridge[itemName].img_url || "N/A",
    });
    add_ToLowOnList(itemName, entryDate, current_fridge[itemName].img_url);
  }
  if (current_fridge[itemName].quantity <= 0) {
    delete current_fridge[itemName];
  }
  renderFridge();
  if (typeof renderExpiredPanels === "function") {
    renderExpiredPanels();
  }

  fetch(`/remove-fridge-items/${itemName}/${entryDate}`, {
    method: "DELETE",
  });
  alert(`${itemName} removed from fridge.`);
}

function update_expiration(itemName, newDays, entry_date) {
  if (!current_fridge[itemName]) {
    alert("Item not found in fridge: " + itemName);
    return;
  }
  fetch(`/update-fridge-items/${itemName}/${newDays}/${entry_date}`, {
    method: "POST",
  });
  alert("Successfully update the current expiration date to: ", newDays);
}

function add_ToLowOnList(item_name, last_entry_date, img_src) {
  let not_to_add = ["Meat", "Takeout", "Produce"];
  if (item_name in not_to_add) {
    return;
  }
  if (item_name)
    fetch("/api/add_low_list", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_name: item_name,
        last_entry_date: last_entry_date,
        img_url: img_src || "N/A", // optional image URL
      }),
    });
}

if (searchInput) {
  document.addEventListener("DOMContentLoaded", () => {
    load_fromFridge().then(() => {
      renderFridge(searchInput.value);
    });
  });
  searchInput.addEventListener("input", (e) => renderFridge(e.target.value));
}

function createModal() {
  const overlay = document.createElement("div");
  overlay.classList.add("modal-overlay");
  overlay.id = "generic-modal";

  const modalBox = document.createElement("div");
  modalBox.classList.add("modal-content");
  modalBox.style.position = "relative";

  const closeBtn = document.createElement("button");
  closeBtn.classList.add("modal-close");
  closeBtn.innerHTML = "&times;";

  closeBtn.addEventListener("click", () => {
    document.body.removeChild(overlay);
  });

  modalBox.appendChild(closeBtn);
  overlay.appendChild(modalBox);

  document.body.appendChild(overlay);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      document.body.removeChild(overlay);
    }
  });

  return modalBox;
}

function showCustomItemOverlay() {
  const modalBox = createModal();

  const titleH2 = document.createElement("h2");
  titleH2.className = "text-xl font-semibold text-gray-900";
  titleH2.textContent = "Add Custom Item";
  modalBox.appendChild(titleH2);

  const catContainer = document.createElement("div");
  catContainer.style.display = "flex";
  catContainer.style.flexDirection = "row";
  catContainer.style.justifyContent = "space-between";
  catContainer.style.alignItems = "center";
  catContainer.style.marginTop = "1rem";
  catContainer.style.gap = "0.75rem";

  let selectedImgUrl = "";

  function makeCategoryCard(label, imgUrl) {
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.flexDirection = "column";
    wrapper.style.alignItems = "center";
    wrapper.style.cursor = "pointer";

    const img = document.createElement("img");
    img.src = imgUrl;
    img.alt = label;
    img.style.width = "100px";
    img.style.height = "100px";
    img.className = "object-cover rounded-md border border-gray-300";

    const caption = document.createElement("span");
    caption.textContent = label;
    caption.style.marginTop = "0.5rem";
    caption.style.fontSize = "0.875rem";
    caption.style.fontWeight = "500";
    caption.style.color = "#4b5563";

    wrapper.appendChild(img);
    wrapper.appendChild(caption);

    return { wrapper, label, url: imgUrl }; // return imgUrl so we know which URL to save
  }

  // Produce
  const {
    wrapper: produceCard,
    label: produceLabel,
    url: produceUrl,
  } = makeCategoryCard("Produce", "/public/static/fruit.png");
  catContainer.appendChild(produceCard);

  // Meat
  const {
    wrapper: meatCard,
    label: meatLabel,
    url: meatUrl,
  } = makeCategoryCard("Meat", "/public/static/steak.png");
  catContainer.appendChild(meatCard);

  // Takeout
  const {
    wrapper: takeoutCard,
    label: takeoutLabel,
    url: takeoutUrl,
  } = makeCategoryCard("Takeout", "/public/static/takeout.jpg");
  catContainer.appendChild(takeoutCard);

  modalBox.appendChild(catContainer);

  // Item Name optional
  const nameLabel = document.createElement("label");
  nameLabel.setAttribute("for", "custom-name");
  nameLabel.className = "block mt-6 text-sm font-medium text-gray-700";
  nameLabel.textContent = "Item Name (or tap a photo)";
  modalBox.appendChild(nameLabel);

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.id = "custom-name";
  nameInput.className =
    "mt-1 block w-full border-gray-300 rounded-md shadow-sm";
  nameInput.placeholder = "Optional";
  modalBox.appendChild(nameInput);

  function selectCategory(labelText, cardElement, imgUrl) {
    [produceCard, meatCard, takeoutCard].forEach((c) => {
      c.querySelector("img").classList.remove("ring-2", "ring-emerald-500");
    });
    cardElement
      .querySelector("img")
      .classList.add("ring-2", "ring-emerald-500");
    nameInput.value = labelText;
    selectedImgUrl = imgUrl;
  }

  produceCard.addEventListener(
    "click",
    () => selectCategory(produceLabel, produceCard, produceUrl) // ← HERE
  );
  meatCard.addEventListener(
    "click",
    () => selectCategory(meatLabel, meatCard, meatUrl) // ← HERE
  );
  takeoutCard.addEventListener(
    "click",
    () => selectCategory(takeoutLabel, takeoutCard, takeoutUrl) // ← HERE
  );

  const expLabel = document.createElement("label");
  expLabel.setAttribute("for", "custom-exp");
  expLabel.className = "block mt-6 text-sm font-medium text-gray-700";
  expLabel.textContent = "Expiration Date";
  modalBox.appendChild(expLabel);

  const expInput = document.createElement("input");
  expInput.type = "date";
  expInput.id = "custom-exp";
  expInput.className = "mt-1 block w-full border-gray-300 rounded-md shadow-sm";
  const today = new Date();
  expInput.value = today.toISOString().split("T")[0];
  modalBox.appendChild(expInput);

  const adjustRow = document.createElement("div");
  adjustRow.className = "exp-adjust-row mt-4 flex gap-2";

  function makeButton(label, delta) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.classList.add("exp-button");
    btn.textContent = label;
    btn.addEventListener("click", () => {
      let d = new Date(expInput.value);
      if (isNaN(d)) d = new Date();
      d.setDate(d.getDate() + delta);
      expInput.value = d.toISOString().split("T")[0];
    });
    return btn;
  }

  adjustRow.appendChild(makeButton("−1 Week", -7));
  adjustRow.appendChild(makeButton("−1 Day", -1));
  adjustRow.appendChild(makeButton("+1 Day", +1));
  adjustRow.appendChild(makeButton("+1 Week", +7));
  modalBox.appendChild(adjustRow);

  nameInput.addEventListener("input", () => {
    [produceCard, meatCard, takeoutCard].forEach((c) => {
      c.querySelector("img").classList.remove("ring-2", "ring-emerald-500");
    });
    selectedImgUrl = ""; // no photo if they typed their own name
  });

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.textContent = "Save Item";
  saveBtn.style.marginTop = "1.5rem";
  saveBtn.style.width = "100%";
  saveBtn.style.padding = "0.75rem 1rem";
  saveBtn.style.backgroundColor = "#10b981";
  saveBtn.style.color = "#ffffff";
  saveBtn.style.fontSize = "1rem";
  saveBtn.style.fontWeight = "600";
  saveBtn.style.border = "none";
  saveBtn.style.borderRadius = "0.375rem";
  saveBtn.style.cursor = "pointer";

  saveBtn.addEventListener("mouseenter", () => {
    saveBtn.style.backgroundColor = "#059669";
  });
  saveBtn.addEventListener("mouseleave", () => {
    saveBtn.style.backgroundColor = "#10b981";
  });

  modalBox.appendChild(saveBtn);

  saveBtn.addEventListener("click", async () => {
    let baseName = nameInput.value.trim();
    if (!baseName) baseName = "Custom Item";
    const newDateISO = expInput.value;
    const sel = new Date(newDateISO);
    let daysUntilExp = null;
    if (!isNaN(sel)) {
      const diffMs = sel.getTime() - new Date().getTime();
      daysUntilExp = Math.round(diffMs / (1000 * 60 * 60 * 24));
    }

    let foundKey = null;
    Object.keys(current_fridge).forEach((existingKey) => {
      if (existingKey === baseName || existingKey.startsWith(baseName + " ")) {
        const meta = current_fridge[existingKey];
        let existingDateISO;
        if (
          typeof meta.expiration === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(meta.expiration)
        ) {
          existingDateISO = meta.expiration;
        } else {
          const entryDateObj = new Date(meta.date_into_fridge);
          entryDateObj.setDate(entryDateObj.getDate() + meta.expiration);
          existingDateISO = entryDateObj.toISOString().split("T")[0];
        }

        if (existingDateISO === newDateISO) {
          foundKey = existingKey;
        }
      }
    });

    if (foundKey) {
      add_toFridge(
        foundKey,
        "",
        daysUntilExp,
        current_fridge[foundKey].img_url || ""
      );
    } else {
      let highestSuffix = 0;
      Object.keys(current_fridge).forEach((existingKey) => {
        if (
          existingKey === baseName ||
          existingKey.startsWith(baseName + " ")
        ) {
          if (existingKey === baseName) {
            highestSuffix = Math.max(highestSuffix, 1);
          } else {
            const maybeNum = parseInt(
              existingKey.slice(baseName.length + 1),
              10
            );
            if (!isNaN(maybeNum)) {
              highestSuffix = Math.max(highestSuffix, maybeNum);
            }
          }
        }
      });

      const newSuffix = highestSuffix === 0 ? "" : " " + (highestSuffix + 1);
      const finalName = baseName + newSuffix;

      add_toFridge(finalName, "", daysUntilExp, selectedImgUrl || "");
    }

    // Close overlay
    const overlay = document.getElementById("generic-modal");
    if (overlay) overlay.remove();
  });
}

function showScanOverlay() {
  const modalBox = createModal();

  const titleH2 = document.createElement("h2");
  titleH2.className = "text-xl font-semibold text-gray-900";
  titleH2.textContent = "Scan & Add";
  modalBox.appendChild(titleH2);

  const barcodeLabel = document.createElement("label");
  barcodeLabel.setAttribute("for", "scan-barcode");
  barcodeLabel.className = "block mt-4 text-sm font-medium text-gray-700";
  barcodeLabel.textContent = "Barcode";
  modalBox.appendChild(barcodeLabel);

  const barcodeInput = document.createElement("input");
  barcodeInput.type = "text";
  barcodeInput.id = "scan-barcode";
  barcodeInput.className =
    "mt-1 block w-full border-gray-300 rounded-md shadow-sm";
  barcodeInput.placeholder = "e.g. 021130240302";
  modalBox.appendChild(barcodeInput);
  barcodeInput.focus();

  const lookupBtn = document.createElement("button");
  lookupBtn.type = "button";
  lookupBtn.id = "scan-lookup-btn";
  lookupBtn.className =
    "mt-6 w-full py-2 bg-emerald-500 text-white font-semibold rounded-md hover:bg-emerald-600";
  lookupBtn.textContent = "Lookup & Add";
  modalBox.appendChild(lookupBtn);

  const resultDiv = document.createElement("div");
  resultDiv.className = "mt-4";
  modalBox.appendChild(resultDiv);

  function runLookup() {
    const code = barcodeInput.value.trim();
    if (!code) {
      alert("Enter a barcode");
      return;
    }

    const apiUrl = `/lookup?barcode=${code}`;
    fetch(apiUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        const product = data.products[0];
        const title = product.title;
        const desc = product.description || "";
        const img = product.images[0] || "";

        resultDiv.innerHTML = `
        <div class="lookup-result flex items-start gap-4 mt-2">
          <img id="popupProductImage" src="${img}" alt="${title}"
               class="w-16 h-16 object-cover border border-gray-200 rounded-md" />
          <div class="lookup-info">
            <h3 id="popupProductName" class="text-lg font-medium text-gray-900">${title}</h3>
            <p id="popupProductDescription" class="text-sm text-gray-600">${desc}</p>
          </div>
        </div>
      `;

        let matched = false;
        for (let item in expiration_table) {
          if (title.toLowerCase().includes(item.toLowerCase())) {
            matched = true;
            add_toFridge(title, code, expiration_table[item], img);
            get_expected_expiration(item);
            break;
          }
        }

        if (!matched) {
          add_toFridge(title, code, null, img);
          alert("Item added to fridge with no expiration date: " + title);
        }
      })
      .catch((error) => {
        console.error("Lookup failed:", error);
        alert("Failed to look up barcode. Please try again.");
      });
  }

  // Attach event listeners
  lookupBtn.addEventListener("click", runLookup);
  barcodeInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      runLookup();
    }
  });
}

export { load_fromFridge, renderFridge, current_fridge };
