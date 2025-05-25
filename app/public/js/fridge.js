// app/public/js/fridge.js
import { popupModal } from "./popup.js";

const lookupButton = document.getElementById("myButton");
const productName = document.getElementById("productName");
const productDescription = document.getElementById("productDescription");
const productImage = document.getElementById("productImage");
const inputbarcode = document.getElementById("productId");
const fridgeGrid = document.getElementById("fridge-grid");

let apiresponse = {
  status: 200,
  products: [
    {
      barcode_number: "021130240302",
      barcode_formats: "UPC-A 021130240302, EAN-13 0021130240302",
      mpn: "",
      model: "",
      asin: "B01EI0RCCQ",
      title: "Refreshe, Purified Drinking Water",
      category: "Food, Beverages & Tobacco > Beverages > Water > Spring Water",
      manufacturer: "Signature Select",
      brand: "Refreshe",
      contributors: [],
      age_group: "",
      ingredients: "Purified Water, Calcium Chloride, Sodium Bicarbonate**.",
      nutrition_facts:
        "Energy 0 kcal, Protein 0.00 g, Total lipid (fat) 0.00 g, Carbohydrate, by difference 0.00 g, Sodium, Na 0 mg",
      energy_efficiency_class: "",
      color: "",
      gender: "",
      material: "",
      pattern: "",
      format: "",
      multipack: "",
      size: "",
      length: "7.75",
      width: "7.13",
      height: "9.13",
      weight: "275",
      release_date: "",
      description: "Purified drinking water.",
      features: ["Soft Amaretti", "product of Italy"],
      images: ["https://images.barcodelookup.com/4739/47395152-1.jpg"],
      last_update: "2024-06-22 14:06:12",
      stores: [],
      reviews: [],
    },
  ],
};

let apiresponse2 = {
  status: 200,
  products: [
    {
      barcode_number: "070847898245",
      barcode_formats: "UPC-A 070847898245, EAN-13 0070847898245",
      mpn: "",
      model: "",
      asin: "",
      title: "Monster Ultra Blue Hawaiian, 16fl.oz CHOOSE YOUR PACK SIZE",
      category: "",
      manufacturer: "",
      brand: "Monster Energy",
      contributors: [],
      age_group: "",
      ingredients: "",
      nutrition_facts: "",
      energy_efficiency_class: "",
      color: "",
      gender: "",
      material: "",
      pattern: "",
      format: "",
      multipack: "",
      size: "",
      length: "",
      width: "",
      height: "",
      weight: "",
      release_date: "",
      description:
        "Whether youre in beast mode, vacay mode, or just chillin island style, Ultra Blue Hawaiian will fire you up to be your best! Blue Hawaiian is a killer combo of exotic island fruit flavors that are big on taste, but with zero sugar.",
      features: [],
      images: [
        "https://images.barcodelookup.com/133207/1332072904-1.jpg",
        "https://images.barcodelookup.com/133207/1332072904-2.jpg",
        "https://images.barcodelookup.com/133207/1332072904-3.jpg",
      ],
      last_update: "2025-01-31 05:33:49",
      stores: [],
      reviews: [],
    },
  ],
};

// your expiration lookup
const expiration_table = {
  Milk: 7,
  Lettuce: 5,
  Spinach: 3,
  Strawberries: 5,
  Bananas: 5,
  "Chicken (raw)": 2,
  "Fish (raw)": 2,
  "Ground beef": 2,
  Yogurt: 10,
  Bread: 4,
  Avocados: 3,
  Tomatoes: 5,
  Eggs: 21,
  Cucumbers: 7,
  Mushrooms: 5,
  water: 120,
  potatoes: 30,
};

// starting state
let current_fridge = {};

// Renders the `current_fridge` object into the #fridge-grid
function renderFridge() {
  fridgeGrid.innerHTML = "";
  const today = new Date();

  for (const [name, meta] of Object.entries(current_fridge)) {
    let data = {
      titleTxt: name,
      date_into_fridge: meta.date_into_fridge || "",
      imgSrc: meta.img_url || "",
      expiration: meta.expiration,
    };

    const div = document.createElement("div");
    div.className = "item";

    if (meta.expiration === null) {
      // no known expiration → special styling
      div.classList.add("no-expiration");
    } else {
      // compute real expiry date for colored states
      const entry = new Date(meta.date_into_fridge);
      const exp = new Date(
        entry.getTime() + get_expected_expiration(name) * 86400000
      );
      console.log("Exp date:", entry);
      console.log("Today date:", exp);
      if (exp < today) div.classList.add("expired");
      else if (exp - today < 7 * 86400000) div.classList.add("soon");
      else div.classList.add("fresh");
    }

    div.innerHTML = `<div class="label">${name} (${meta.quantity})</div>`;
    fridgeGrid.appendChild(div);

    //a pop up with more info
    div.addEventListener("click", () => {
      let model = document.createElement("popup-card");
      model.style.display = "block";
      model.data = data;

      const deleteButton = model.shadowRoot.getElementById("remove-button");
      const editButton = model.shadowRoot.getElementById("edit-button");
      deleteButton.addEventListener("click", () => {
        removeItemFromFridge(name, data.date_into_fridge);
        document.body.removeChild(overlay);
      });

      //update the current expiration date base on name of the item + date_into_fridge
      editButton.addEventListener("click", () => {
        let newday = prompt("Please enter a new expiration date");
        if (newday === null || newday.trim() === "") {
          alert("Invalid expiration date");
          return;
        }
        update_expiration(name, newday, data.date_into_fridge);
        document.body.removeChild(overlay);
        load_fromFridge(); // reload fridge to reflect changes
      });

      const overlay = document.createElement("div");
      overlay.id = "model-overlay";

      overlay.appendChild(model);
      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
          document.body.removeChild(overlay);
        }
      });
      document.body.appendChild(overlay);
    });
  }
}

function load_fromFridge() {
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
  console.log("Adding to fridge:", item_name, barcode, days, img_src);
  if (!current_fridge[item_name]) {
    current_fridge[item_name] = {
      date_into_fridge: todayISO,
      expiration: days,
      quantity: 1,
    };
  } else {
    current_fridge[item_name].quantity++;
  }
  console.log("Current fridge state22:", current_fridge);
  renderFridge();

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
  alert(`${item_name} added to fridge (${current_fridge[item_name].quantity})`);
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

// your lookup + scan button
lookupButton.addEventListener("click", () => {
  const barcode = inputbarcode.value.trim();
  if (!barcode) {
    alert("Enter a barcode");
    return;
  }
  let data = apiresponse; // #TODO: replace with actual API call

  let product = data.products[0];
  let title = product.title;
  let desc = product.description || "";
  let img = product.images[0] || "";

  productName.textContent = title;
  productDescription.textContent = desc;
  productImage.src = img;

  // Example logic to match expiration table
  let matched = false;
  for (let item in expiration_table) {
    if (title.toLowerCase().includes(item.toLowerCase())) {
      matched = true;

      add_toFridge(title, barcode, expiration_table[item], img); // product name, barcode, matched item
      get_expected_expiration(item);

      break;
    }
  }

  if (!matched) {
    add_toFridge(title, barcode, null, img);
    alert("Item added to fridge with no expiration date: " + title);
  }

  // const apiUrl = `/lookup?barcode=${barcode}`; // Your FastAPI backend
  // #TODO
  // fetch(apiUrl)
  //   .then((response) => {
  //     if (!response.ok) {
  //       throw new Error(`Error ${response.status}: ${response.statusText}`);
  //     }
  //     return response.json();
  //   })
  //   .then((data) => {
  //     const product = data.products[0];
  //     const title = product.title;
  //     const desc = product.description || "";
  //     const img = product.images[0] || "";

  //     productName.textContent = title;
  //     productDescription.textContent = desc;
  //     productImage.src = img;

  //     // Example logic to match expiration table
  //     let matched = false;
  //     console.log(1);
  //     for (let item in expiration_table) {
  //       if (title.toLowerCase().includes(item.toLowerCase())) {
  //         matched = true;
  //         console.log("Matched:", item);
  //         add_toFridge(title, barcode, expiration_table[item]); // product name, barcode, matched item
  //         get_expected_expiration(item);
  //         console.log(2);
  //         break;
  //       }
  //     }
  //     console.log(3);
  //     if (!matched) {
  //       console.log(4);
  //       add_toFridge(title, barcode, null);
  //       alert("Item added to fridge with no expiration date: " + title);
  //     }
  //   });
});

function removeItemFromFridge(itemName, entryDate) {
  if (!current_fridge[itemName]) {
    alert("Item not found in fridge: " + itemName);
    return;
  }
  current_fridge[itemName].quantity--;
  if (current_fridge[itemName].quantity <= 0) {
    delete current_fridge[itemName];
  }
  renderFridge();

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
  console.log(itemName, newDays, entry_date);
  fetch(`/update-fridge-items/${itemName}/${newDays}/${entry_date}`, {
    method: "POST",
  });
  alert("Successfully update the current expiration date to: ", newDays);
}

// initial render
document.addEventListener("DOMContentLoaded", load_fromFridge);
