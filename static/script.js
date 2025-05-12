const lookupButton = document.getElementById("myButton");
const productName = document.getElementById("productName");
const productDescription = document.getElementById("productDescription");
const productImage = document.getElementById("productImage");
const inputbarcode = document.getElementById("productId");

let expire_date = new Date();
expire_date.setDate(expire_date.getDate() + 30);

let lookup_expireation = []



lookupButton.addEventListener("click", () => {
  const apiKey = "vbmp1grglop7pimfbyx5imbqwogmu8";
  let barcode = inputbarcode.value; // Example barcode number - update accordingly
  console.log(barcode); // Log the barcode to the console for debugging
  const apiUrl = `https://cors-anywhere.herokuapp.com/https://api.barcodelookup.com/v3/products?barcode=${barcode}&key=${apiKey}`;
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
        let product_name = data.products[0]["brand"];
        let product_description = data.products[0]["description"];
        let product_image = data.products[0]["images"][0];
        console.log(product_image); // Log the data to the console for debugging

        productName.textContent = product_name;
        productDescription.textContent = product_description;
        productImage.src = product_image;
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
