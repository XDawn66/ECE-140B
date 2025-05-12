document.addEventListener("DOMContentLoaded", deviceLoad);

function deviceLoad(event) {
  event.preventDefault();

  fetch(`wardrobe/look`)
    .then((response) => response.json())
    .then((data) => {
      let i;
      for (i = 0; i < data.length; i++) {
        const figure_container = document.getElementById(
          `${data[i]["category"]}_clothes`
        );
        const figure = document.createElement("figure");

        let img = document.createElement("img");
        if (data[i]["category"] == "casual") {
          img.src = "../public/static/casual_1.jpg";
        } else {
          img.src = "../public/static/formal_1.webp";
        }

        let figcaption_container = document.createElement("div");
        figcaption_container.className = "figcaption_container";
        let figcaption = document.createElement("figcaption");
        figcaption.textContent = data[i]["clothes"];
        let figcaption2 = document.createElement("figcaption");
        figcaption2.textContent = `type:${data[i]["types"]}`;

        let update_btn = document.createElement("button");
        update_btn.textContent = "Update";
        update_btn.id = "update_btn";

        update_btn.addEventListener("click", function () {
          let newName = prompt("Enter new item name:");
          let newType = prompt("Enter new item type:");
          if (newName && newType) {
            let oldname = figcaption.textContent;
            let oldtype = figcaption2.textContent;
            figcaption.textContent = newName;
            figcaption2.textContent = `type:${newType}`;
            fetch(`wardrobe/${oldname}/${newName}/${newType}`, {
              method: "POST",
            });
          }
        });

        figure.appendChild(img);
        figcaption_container.appendChild(figcaption);
        figcaption_container.appendChild(figcaption2);
        figure.appendChild(figcaption_container);
        figure.appendChild(update_btn);
        figure_container.appendChild(figure);
      }
    });
}
document.getElementById("add_casual").addEventListener("click", function () {
  const casual_container = document.getElementById("casual_clothes");
  let figures = casual_container.getElementsByTagName("figure");
  if (figures.length > 2) {
    alert("You can only add 3 items to each category");
    return;
  }
  let clothes_name = prompt("Enter the name of the item:");
  if (!clothes_name) {
    alert("Please enter a name");
    return;
  }
  let type = prompt("Enter the type of the item:");
  if (!type) {
    alert("Please enter a type");
    return;
  }

  let figure = document.createElement("figure");
  let img = document.createElement("img");
  img.src = "../public/static/casual_1.jpg";

  let figcaption_container = document.createElement("div");
  figcaption_container.className = "figcaption_container";
  let figcaption = document.createElement("figcaption");
  figcaption.textContent = clothes_name;
  let figcaption2 = document.createElement("figcaption");
  figcaption2.textContent = `type:${type}`;
  let update_btn = document.createElement("button");
  update_btn.textContent = "Update";
  update_btn.id = "update_btn";

  let newName = "";
  let newType = "";
  update_btn.addEventListener("click", function () {
    newName = prompt("Enter new item name:");
    newType = prompt("Enter new item type:");
    if (newName && newType) {
      let oldname = figcaption.textContent;
      let oldtype = figcaption2.textContent;
      figcaption.textContent = newName;
      figcaption2.textContent = `type:${newType}`;
      fetch(`wardrobe/${oldname}/${newName}/${newType}`, {
        method: "POST",
      })
        .then((response) => response.json())
        .then((data) => console.log("Updated successfully:", data))
        .catch((error) => console.error("Error:", error));
    }
  });
  figure.appendChild(img);
  figcaption_container.appendChild(figcaption);
  figcaption_container.appendChild(figcaption2);
  figure.appendChild(figcaption_container);
  figure.appendChild(update_btn);
  casual_container.appendChild(figure);
  let new_clothes = "casual";
  fetch(`/wardrobe/${new_clothes}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ clothes: clothes_name, types: type }), // Data to add
  })
    .then((response) => response.json())
    .then((data) => console.log("Updated successfully:", data))
    .catch((error) => console.error("Error:", error));
});

document.getElementById("remove_casual").addEventListener("click", function () {
  let clothes_name = prompt("Enter the name of the item:");
  if (!clothes_name) {
    alert("Please enter a name");
    return;
  }
  const casual_container = document.getElementById("casual_clothes");
  let figures = casual_container.getElementsByTagName("figure");
  if (figures.length == 0) {
    alert("No items to remove");
    return;
  }
  for (let i = 0; i < figures.length; i++) {
    if (
      figures[i].getElementsByTagName("figcaption")[0].textContent ==
      clothes_name
    ) {
      casual_container.removeChild(figures[i]);
      fetch(`wardrobe/${clothes_name}`, {
        method: "DELETE",
      })
        .then((response) => response.json())
        .then((data) => console.log("Updated successfully:", data))
        .catch((error) => console.error("Error:", error));
      return;
    }
  }
  alert("Item not found");
});

document.getElementById("add_formal").addEventListener("click", function () {
  const casual_container = document.getElementById("formal_clothes");
  let figures = casual_container.getElementsByTagName("figure");
  if (figures.length > 2) {
    alert("You can only add 3 items to each category");
    return;
  }
  let clothes_name = prompt("Enter the name of the item:");
  if (!clothes_name) {
    alert("Please enter a name");
    return;
  }
  let type = prompt("Enter the type of the item:");
  if (!type) {
    alert("Please enter a type");
    return;
  }

  let figure = document.createElement("figure");
  let img = document.createElement("img");
  img.src = "../public/static/formal_1.webp";

  let figcaption_container = document.createElement("div");
  figcaption_container.className = "figcaption_container";
  let figcaption = document.createElement("figcaption");
  figcaption.textContent = clothes_name;
  let figcaption2 = document.createElement("figcaption");
  figcaption2.textContent = `type:${type}`;
  let update_btn = document.createElement("button");
  update_btn.textContent = "Update";
  update_btn.id = "update_btn";
  update_btn.addEventListener("click", function () {
    let newName = prompt("Enter new item name:");
    let newType = prompt("Enter new item type:");
    if (newName && newType) {
      let oldname = figcaption.textContent;
      let oldtype = figcaption2.textContent;
      figcaption.textContent = newName;
      figcaption2.textContent = `type:${newType}`;
      fetch(`wardrobe/${oldname}/${newName}/${newType}`, {
        method: "POST",
      });
    }
  });
  figure.appendChild(img);
  figcaption_container.appendChild(figcaption);
  figcaption_container.appendChild(figcaption2);
  figure.appendChild(figcaption_container);
  figure.appendChild(update_btn);
  casual_container.appendChild(figure);

  let new_clothes = "formal";
  fetch(`/wardrobe/${new_clothes}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ clothes: clothes_name, types: type }), // Data to update
  });
});

document.getElementById("remove_formal").addEventListener("click", function () {
  let clothes_name = prompt("Enter the name of the item:");
  if (!clothes_name) {
    alert("Please enter a name");
    return;
  }
  const casual_container = document.getElementById("formal_clothes");
  let figures = casual_container.getElementsByTagName("figure");
  if (figures.length == 0) {
    alert("No items to remove");
    return;
  }
  for (let i = 0; i < figures.length; i++) {
    if (
      figures[i].getElementsByTagName("figcaption")[0].textContent ==
      clothes_name
    ) {
      casual_container.removeChild(figures[i]);
      fetch(`wardrobe/${clothes_name}`, {
        method: "DELETE",
      });
      return;
    }
  }
  alert("Item not found");
});
