const lookupButton = document.getElementById("myButton");
const productName = document.getElementById("productName");
const productDescription = document.getElementById("productDescription");
const productImage = document.getElementById("productImage");
const inputbarcode = document.getElementById("productId");

let currentBarcode = "";
let expiration_table = {
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

let current_fridge = {
  egg: { date_into_fridge: "2023-10-01", expiration: 21, quantity: 1 },
  Milk: { date_into_fridge: "2023-10-01", expiration: 7, quantity: 1 },
  Lettuce: { date_into_fridge: "2023-10-01", expiration: 5, quantity: 1 },
  Spinach: { date_into_fridge: "2023-10-01", expiration: 3, quantity: 1 },
  Strawberries: { date_into_fridge: "2023-10-01", expiration: 5, quantity: 1 },
  Bananas: { date_into_fridge: "2023-10-01", expiration: 5, quantity: 1 },
  Chicken_raw: { date_into_fridge: "2023-10-01", expiration: 2, quantity: 1 },
  Fish_raw: { date_into_fridge: "2023-10-01", expiration: 2, quantity: 1 },
  Ground_beef: { date_into_fridge: "2023-10-01", expiration: 2, quantity: 1 },
  Yogurt: { date_into_fridge: "2023-10-01", expiration: 10, quantity: 1 },
  Bread: { date_into_fridge: "2023-10-01", expiration: 4, quantity: 1 },
  Avocados: { date_into_fridge: "2023-10-01", expiration: 3, quantity: 1 },
  Tomatoes: { date_into_fridge: "2023-10-01", expiration: 5, quantity: 1 },
  Cucumbers: { date_into_fridge: "2023-10-01", expiration: 7, quantity: 1 },
  Mushrooms: { date_into_fridge: "2023-10-01", expiration: 5, quantity: 1 },
};

let product_name = "";
let product_description = "";
let product_image = "";

lookupButton.addEventListener("click", () => {
  const apiKey = "vbmp1grglop7pimfbyx5imbqwogmu8";
  let barcode = inputbarcode.value; // Example barcode number - update accordingly
  console.log(barcode); // Log the barcode to the console for debugging
  const apiUrl = `https://cors-anywhere.herokuapp.com/https://api.barcodelookup.com/v3/products?barcode=${barcode}&key=${apiKey}`;

  // const apiUrl = `https://cors-anywhere.herokuapp.com/https://api.barcodelookup.com/v3/products?barcode=${barcode}&key=${apiKey}`;
  //https://cors-anywhere.herokuapp.com/corsdemo to show on the local server
  const xhr = new XMLHttpRequest();

  xhr.open("GET", apiUrl, true);

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      // Done
      const output = document.getElementById("output");

      if (xhr.status === 200) {
        const data = JSON.parse(xhr.responseText);
        console.log(data.products[0]); // Log the data to the console for debugging
        // output.textContent = JSON.stringify(data, null, 2); // Pretty-print
        product_name = data.products[0]["title"];
        product_description = data.products[0]["description"];
        product_image = data.products[0]["images"][0];

        productName.textContent = product_name;
        productDescription.textContent = product_description;
        productImage.src = product_image;

        for (let item in expiration_table) {
          // Check if the product name contains the item
          if (product_name.toLowerCase().includes(item.toLowerCase())) {
            console.log("Found item in expiration table: " + item);
            // add_toFridge(item);
            get_expected_expiration(item);
            break; // Exit the loop after finding the first match
          }
        }
      } else if (xhr.status === 403) {
        output.textContent = "Error 403: Invalid API key";
      } else if (xhr.status === 404) {
        output.textContent = "Error 404: No data returned";
      } else if (xhr.status === 429) {
        output.textContent = "Error 429: Exceeded API call limits";
      } else {
        output.textContent = "Error " + xhr.status + ": " + xhr.statusText;
      }
    }
  };
  xhr.send();
});

function getBarcode() {
  pass;
}

function add_toFridge(item_name) {
  if (current_fridge[item_name] == undefined) {
    current_fridge[item_name] = {
      date_into_fridge: new Date().toISOString().split("T")[0],
      expiration: expiration_table[item_name],
      quantity: 1,
    };
    alert(item_name + " has been added to the fridge.");
    return;
  }
  current_fridge[item_name].quantity += 1;
  alert(
    "One unit of " +
      item_name +
      " has been added to the fridge. Total quantity: " +
      current_fridge[item_name].quantity
  );
}

function remove_fromFridge(item_name) {
  if (current_fridge[item_name] == undefined) {
    alert("Item not found in the fridge.");
    return;
  }
  if (current_fridge[item_name].quantity > 1) {
    current_fridge[item_name].quantity -= 1;
    alert(
      "One unit of " +
        item_name +
        " has been removed from the fridge. Remaining quantity: " +
        current_fridge[item_name].quantity
    );
    return;
  }
  delete current_fridge[item_name];
  alert(item_name + " has been removed from the fridge.");
}

function add_toShoppingList() {
  pass;
}

function add_new_expiration(item_name, item_expiration) {
  if (expiration_table[item_name] == undefined) {
    expiration_table[item_name] = item_expiration;
  }
  alert(
    "Expiration date for " +
      item_name +
      " has been added to the expiration table."
  );
}

function get_expected_expiration(item_name) {
  if (expiration_table[item_name] == undefined) {
    alert("Item not found in the expiration table.");
    return;
  }
  let current_date = new Date();
  let expiration_date = new Date(
    current_date.getTime() + expiration_table[item_name] * 24 * 60 * 60 * 1000
  );
  alert(
    item_name + " will expire on " + expiration_date.toLocaleDateString() + "."
  );
}

function check_expiration(item_name) {
  if (expiration_table[item_name] == undefined) {
    alert("Item not found in the expiration table.");
    return;
  }
  let current_date = new Date();
  let date_into_fridge = new Date(current_fridge[item_name].date_into_fridge);
  let expiration_date = new Date(
    date_into_fridge.getTime() +
      expiration_table[item_name] * 24 * 60 * 60 * 1000
  );
  if (current_date > expiration_date) {
    alert(item_name + " has expired.");
  } else {
    alert(
      item_name +
        " is still fresh. It will expire on " +
        expiration_date.toLocaleDateString()
    );
  }
}

function load_fromFridge() {
  pass;
}
