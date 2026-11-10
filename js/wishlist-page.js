import { mountShell, productCard, syncWishlistButtons } from "./shell.js?v=5";
import { getWishlist, onWishChange } from "./wishlist.js";

const { store, products } = await mountShell("saved");
const root = document.querySelector("[data-saved]");

function render() {
  const items = getWishlist().map((id) => products.find((item) => item.id === id)).filter(Boolean);
  root.innerHTML = items.length
    ? `<div class="grid">${items.map((item) => productCard(item, store)).join("")}</div>`
    : `<div class="empty-panel"><h2>Nothing saved yet</h2><p>Use the heart on a piece to keep it here.</p><a class="btn" href="shop.html">Explore the collection</a></div>`;
  syncWishlistButtons();
}

render();
onWishChange(render);
