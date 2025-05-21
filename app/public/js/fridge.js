// app/public/js/fridge.js

const lookupButton = document.getElementById("myButton");
const productName = document.getElementById("productName");
const productDescription = document.getElementById("productDescription");
const productImage = document.getElementById("productImage");
const inputbarcode = document.getElementById("productId");
const fridgeGrid = document.getElementById("fridge-grid");

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
let current_fridge = {
 
};

// Renders the `current_fridge` object into the #fridge-grid
function renderFridge() {
  fridgeGrid.innerHTML = "";
  const today = new Date();

  for (const [name, meta] of Object.entries(current_fridge)) {
    const div = document.createElement("div");
    div.className = "item";

    if (meta.expiration === null) {
      // no known expiration → special styling
      div.classList.add("no-expiration");
    } else {
      // compute real expiry date for colored states
      const entry = new Date(meta.date_into_fridge);
      const exp   = new Date(entry.getTime() + meta.expiration * 86400000);
      if (exp < today)              div.classList.add("expired");
      else if (exp - today < 7*86400000) div.classList.add("soon");
    }

    div.innerHTML = `<div class="label">${name} (${meta.quantity})</div>`;
    fridgeGrid.appendChild(div);
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
        const days = expiration_table[name] || 7;
        if (!current_fridge[name]) {
          current_fridge[name] = {
            date_into_fridge: item.entry_date,
            expiration: days,
            quantity: 1,
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
function add_toFridge(item_name, barcode, days = expiration_table[item_name] ?? null) {
  const todayISO = new Date().toISOString().split("T")[0];

  
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

  const payload = {
  barcode:      barcode,
  product_name: item_name,
  entry_date:   todayISO,
  exp_date:     expDateISO 
  };

  if (days != null) {
    payload.exp_date = new Date(Date.now() + days * 86400000).toISOString().split("T")[0];
  }
  renderFridge;

  const expDateISO = days !== null
    ? new Date(Date.now() + days * 86400000)
        .toISOString()
        .split("T")[0]
    : null;


  fetch("/api/fridge-items", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
    barcode:      barcode,
    product_name: item_name,
    entry_date:   todayISO,
    exp_date:     expDateISO,   // always present, even if null
    }),
  })
  .then(res => {
    if (!res.ok) return res.text().then(t => { throw new Error(t) });
    return res.json();
  })
  .then(() => {
    alert("Item saved to your fridge!");
  })
  .catch(err => {
    console.error("Save failed:", err);
    alert("Could not save: " + err.message);
  });

  load_fromFridge();
  alert(`${item_name} added to fridge (×${current_fridge[item_name].quantity})`);
}


// existing expiration checker
function get_expected_expiration(item_name) {
  if (!expiration_table[item_name]) {
    return alert("No expiration for “" + item_name + "”");
  }
  const now = new Date(),
    d = new Date(now.getTime() + expiration_table[item_name] * 86400000);
  alert(`${item_name} will expire on ${d.toLocaleDateString()}.`);
}

// your lookup + scan button
lookupButton.addEventListener("click", () => {
  // const apiKey = "vbmp1grglop7pimfbyx5imbqwogmu8";
  // const barcode = inputbarcode.value.trim();
  // if (!barcode) return alert("Enter a barcode");
  // const apiUrl = `https://cors-anywhere.herokuapp.com/https://api.barcodelookup.com/v3/products?barcode=${barcode}&key=${apiKey}`;
  // const xhr = new XMLHttpRequest();
  // xhr.open("GET", Url, true);
  // xhr.onreadystatechange = () => {
  //   if (xhr.readyState !== 4) return;
  //   if (xhr.status === 200) {
  //     const data = JSON.parse(xhr.responseText).products[0];
  //     const title = data.title;
  //     const desc = data.description || "";
  //     const img = data.images[0] || "";
  //     productName.textContent = title;
  //     productDescription.textContent = desc;
  //     productImage.src = img;
  //     // find a match in expiration_table and add to fridge
  //     for (let item in expiration_table) {
  //       if (title.toLowerCase().includes(item.toLowerCase())) {
  //         console.log("Matched:", item);
  //         add_toFridge(item); // ← UNCOMMENTED HERE
  //         get_expected_expiration(item);
  //         break;
  //       }
  //     }
  //   } else {
  //     alert(`Lookup error ${xhr.status}: ${xhr.statusText}`);
  //   }
  // };
  // xhr.send();
  const barcode = inputbarcode.value.trim();
  if (!barcode) {
    alert("Enter a barcode");
    return;
  }

  const apiUrl = `/lookup?barcode=${barcode}`; // Your FastAPI backend

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

      productName.textContent = title;
      productDescription.textContent = desc;
      productImage.src = img;

      // Example logic to match expiration table
      let matched = false;
      for (let item in expiration_table) {
        if (title.toLowerCase().includes(item.toLowerCase())) {
          mathced = true;
          console.log("Matched:", item);
          add_toFridge(title, barcode, expiration_table[item]); // product name, barcode, matched item
          get_expected_expiration(item);
          break;
        }
      }
      if (!matched) {
        add_toFridge(title, barcode, null);
    }
    })
    .catch((error) => {
      console.error("Lookup failed:", error);
      alert("Failed to fetch product info.");
    });
});

// initial render
document.addEventListener("DOMContentLoaded", load_fromFridge);
