import { mountShell, cartInner } from "./shell.js?v=4";
import { onCartChange } from "./cart.js";

const { store, products } = await mountShell("cart");
const root = document.querySelector("[data-cart-page]");

function render() {
  root.innerHTML = cartInner(store, products, false);
}

render();
onCartChange(render);
