export class popupModal extends HTMLElement {
  // Called once when document.createElement('recipe-card') is called, or
  // the element is written into the DOM directly as <recipe-card>
  constructor() {
    super(); // Inherit everything from HTMLElement

    let shadowEl = this.attachShadow({ mode: "open" });
    let articleEl = document.createElement("article");
    shadowEl.appendChild(articleEl);
    this._article = articleEl; //  Save reference to article for later use
    let styleEl = document.createElement("style");
    shadowEl.appendChild(styleEl);
    styleEl.textContent = `      * {
        font-family: sans-serif;
        box-sizing: border-box;
      }

      article {
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        width: 300px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        text-align: center;
      }

      img {
        width: 10vw;
        max-height: 500px;
        object-fit: cover;
        border-radius: 8px;
      }

      h3 {
        font-size: 20px;
        margin: 0;
        color: #333;
      }

      p, time {
        margin: 0;
        color: #666;
        font-size: 14px;
      }

      .label {
        font-weight: bold;
        color: #444;
      }
        #edit-button,
#edit-button,
#remove-button {
  padding: 14px 24px;
  font-size: 16px;
  min-width: 120px;
  min-height: 48px; /* Ensures tap target size */
  border: none;
  border-radius: 10px;
  cursor: pointer;
  margin: 10px;
  transition: background-color 0.2s ease, transform 0.1s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  touch-action: manipulation;
}

#remove-button {
  background-color: #ff4d4f;
  color: white;
}

#remove-button:hover {
  background-color: #e04343;
  transform: scale(1.03);
}

#edit-button {
  background-color: #f0f0f0;
  color: #333;
}

#edit-button:hover {
  background-color: #dcdcdc;
  transform: scale(1.03);
}
    `;
    shadowEl.appendChild(styleEl);
  }

  set data(data) {
    // If nothing was passed in, return
    if (!data) return;

    let current_articleEl = this._article;

    current_articleEl.innerHTML = `<img src="${data.imgSrc}"">
  <p class="title">
    <h3>${data.titleTxt}</h3>
  </p>
  <p class="date_into_fridge"> Date into fridge:
  ${data.date_into_fridge}
  </p>
  <label>Expect expiration date: ${data.expiration || "N/A"}</label>
   <button id="edit-button">Edit</button>
  <button id="remove-button">Remove</button>
 `;
  }
}

customElements.define("popup-card", popupModal);
