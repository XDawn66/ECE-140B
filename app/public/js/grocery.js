let fridgeItems = {};
let current_low_on_list = {};
document.addEventListener("DOMContentLoaded", () => {
  fill_fridge_list()
    .then((fridgeItems) => {
      console.log(fridgeItems);
      const fridgeGrid = document.getElementById("fridge-grid");
      Object.entries(fridgeItems).forEach(([name, meta]) => {
        const div = document.createElement("div");
        div.classList.add("item");

        // Example "today" date
        const today = new Date();

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
            // Fallback: assume 7 days shelf life or get_expected_expiration() if you have it
            expDate = new Date(entry.getTime() + 7 * 86400000);
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

        // (Add your modal popup event listener here as in your snippet)
      });
    })
    .catch((error) => {
      console.error("Failed to load fridge items:", error);
    });

  //  Load and then render
  get_low_list(render_grocery_items);

  groceryItems.forEach((item) => {
    if (item) {
      const div = document.createElement("div");
      div.textContent = `Name: ${item}\n Qty: 1 \n`;
      groceryGrid.appendChild(div);
    }
  });
});

function render_grocery_items() {
  const groceryGrid = document.getElementById("grocery-grid");
  groceryGrid.innerHTML = ""; // Clear previous items

  Object.keys(current_low_on_list).forEach((item) => {
    console.log("Adding item to grocery grid:", item);

    const itemData = current_low_on_list[item];

    const div = document.createElement("div");
    div.classList.add("grocery-item");

    // Name and quantity
    const label = document.createElement("div");
    label.textContent = `Name: ${item} | Qty: 1`;
    div.appendChild(label);

    // Image if available
    if (itemData.img_url) {
      console.log("Adding image for item:", item);
      const imgElement = document.createElement("img");
      imgElement.src = itemData.img_url;
      imgElement.alt = item;
      div.appendChild(imgElement);
    }

    // Last added info
    const lastAdded = document.createElement("div");
    lastAdded.textContent = `Last Added: ${itemData.last_added || "N/A"}`;
    div.appendChild(lastAdded);

    // Remove button
    const button = document.createElement("button");
    button.textContent = "Remove";
    button.addEventListener("click", (e) => {
      e.stopPropagation();
      remove_FromLowOnList(item);
      groceryGrid.removeChild(div);
    });
    div.appendChild(button);

    groceryGrid.appendChild(div);
  });
}

function get_low_list(callback) {
  fetch(`/api/low-on-items`)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load low list items");
      return res.json();
    })
    .then((items) => {
      items.forEach((item) => {
        const name = item.product_name;
        const days = item.last_entry_date;
        const img = item.img_url || "N/A";
        current_low_on_list[name] = {
          last_added: days,
          img_url: img,
        };
      });

      if (callback) callback(); // trigger render after data is ready
    })
    .catch((err) => {
      console.error(err);
      alert("Could not load low list: " + err.message);
    });
}

function remove_FromLowOnList(item_name) {
  fetch(`/api/remove_low_list/${item_name}`, {
    method: "DELETE",
  });
}

function fill_fridge_list() {
  return fetch("/api/fridge-items")
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load fridge items");
      return res.json();
    })
    .then((items) => {
      const fridgeItems = {};
      items.forEach((item) => {
        const name = item.product_name;
        const days = item.exp_date;
        const img = item.img_url || "N/A";

        if (!fridgeItems[name]) {
          fridgeItems[name] = {
            date_into_fridge: item.entry_date,
            expiration: days,
            quantity: 1,
            img_url: img,
          };
        } else {
          fridgeItems[name].quantity++;
        }
      });
      return fridgeItems;
    });
}
