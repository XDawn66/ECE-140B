let current_low_on_list = {};
document.addEventListener("DOMContentLoaded", () => {
  const fridgeGrid = document.getElementById("fridge-grid");
  const fridgeItems = ["Milk", "Eggs", "Spinach", "Bread"];

  fridgeItems.forEach((item) => {
    const div = document.createElement("div");
    div.textContent = item;
    fridgeGrid.appendChild(div);
  });

  //  Load and then render
  get_low_list(render_grocery_items);
  groceryItems.forEach((item) => {
    const div = document.createElement("div");
    div.textContent = `Name: ${item}\nQty: 1`;
    groceryGrid.appendChild(div);
  });
});
function render_grocery_items() {
  const groceryGrid = document.getElementById("grocery-grid");

  Object.keys(current_low_on_list).forEach((item) => {
    console.log("Adding item to grocery grid:", item);

    const itemData = current_low_on_list[item];

    const div = document.createElement("div");
    div.classList.add("grocery-item");
    div.textContent = `Name: ${item}\nQty: 1`;
    console.log("Item data:", itemData);
    if (itemData.img_url) {
      console.log("Adding image for item:", item);
      const imgElement = document.createElement("img");
      imgElement.src = itemData.img_url;
      imgElement.alt = item;
      div.appendChild(imgElement);
    }

    div.textContent += `\nLast Added: ${itemData.last_added || "N/A"}`;

    let button = document.createElement("button");
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
