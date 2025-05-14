document.addEventListener("DOMContentLoaded", () => {
  const fridgeGrid = document.getElementById("fridge-grid");
  const groceryGrid = document.getElementById("grocery-grid");

  // Fake data for testing
  const fridgeItems = ["Milk", "Eggs", "Spinach", "Bread"];
  const groceryItems = ["Milk", "Bread", "Bananas"];

  fridgeItems.forEach((item) => {
    const div = document.createElement("div");
    div.textContent = item;
    fridgeGrid.appendChild(div);
  });

  groceryItems.forEach((item) => {
    const div = document.createElement("div");
    div.textContent = `Name: ${item}\nQty: 1`;
    groceryGrid.appendChild(div);
  });
});
