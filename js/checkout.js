import { mountShell, escapeHtml } from "./shell.js?v=4";
import { money, categoryName } from "./catalog.js?v=3";
import { getCart, clearCart, onCartChange } from "./cart.js";

const { store, products } = await mountShell("checkout");
const root = document.querySelector("[data-checkout]");

function lines() {
  return getCart().map((line) => {
    const product = products.find((item) => item.id === line.id);
    return product ? { ...line, product } : null;
  }).filter(Boolean);
}

function summary(items) {
  const subtotal = items.reduce((sum, line) => sum + line.product.price * line.qty, 0);
  const rows = items.map((line) => `
    <li>
      <span>${escapeHtml(line.product.name)}${line.size ? `, ${escapeHtml(line.size)}` : ""} × ${line.qty}</span>
      <span>${money(line.product.price * line.qty, store)}</span>
    </li>`).join("");
  return `
    <h2>Bag</h2>
    <ul class="summary-list">${rows}</ul>
    <p class="sum-row"><span>Subtotal</span><strong>${money(subtotal, store)}</strong></p>
    <p class="fine">Shipping and tax are not included. This demo does not estimate them.</p>`;
}

function render() {
  const items = lines();
  if (!items.length) {
    root.innerHTML = `
      <div class="empty-panel">
        <h1>Nothing to check out</h1>
        <p>Add a piece to your bag before opening the demo checkout.</p>
        <a class="btn" href="shop.html">Continue shopping</a>
      </div>`;
    return;
  }
  root.innerHTML = `
    <p class="demo-banner">Demo checkout. Nothing is charged, and no order is placed. Card details are not collected.</p>
    <div class="checkout-grid">
      <form class="checkout-form" novalidate>
        <h1>Delivery details</h1>
        <p>These fields stay in your browser for this preview. They are not sent to a shop or a payment service.</p>
        <div class="error-summary" tabindex="-1" hidden><p>Please fix the following:</p><ul></ul></div>
        <label for="co-name">Full name</label>
        <input id="co-name" name="name" data-label="Full name" required autocomplete="name">
        <p class="field-error" id="co-name-error" hidden></p>
        <label for="co-email">Email</label>
        <input id="co-email" name="email" type="email" data-label="Email" required autocomplete="email">
        <p class="field-error" id="co-email-error" hidden></p>
        <label for="co-address">Address</label>
        <textarea id="co-address" name="address" data-label="Address" required minlength="8" rows="3" autocomplete="street-address"></textarea>
        <p class="field-error" id="co-address-error" hidden></p>
        <p class="fine">Payment is the integration point. Connect Stripe, Shopify, or another provider here. Do not add a homemade card form.</p>
        <button class="btn" type="submit">Review demo details</button>
      </form>
      <aside class="summary">${summary(items)}</aside>
    </div>`;
  root.querySelector("form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const problems = [];
    form.querySelectorAll("input, textarea").forEach((field) => {
      const error = document.getElementById(`${field.id}-error`);
      const value = field.value.trim();
      let message = "";
      if (!value) message = `Enter your ${field.dataset.label.toLowerCase()}.`;
      else if (field.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = "Enter an email address like name@example.com.";
      else if (field.minLength && value.length < field.minLength) message = "Enter a fuller address so the preview is useful.";
      if (message) {
        field.setAttribute("aria-invalid", "true");
        error.hidden = false;
        error.textContent = message;
        problems.push({ id: field.id, message });
      } else {
        field.removeAttribute("aria-invalid");
        error.hidden = true;
      }
    });
    const summaryBox = form.querySelector(".error-summary");
    if (problems.length) {
      summaryBox.hidden = false;
      summaryBox.querySelector("ul").innerHTML = problems.map((item) => `<li><a href="#${item.id}">${item.message}</a></li>`).join("");
      summaryBox.focus();
      return;
    }
    const data = Object.fromEntries(new FormData(form).entries());
    root.innerHTML = `
      <div class="demo-result">
        <p class="eyebrow">Preview only</p>
        <h1>No order was placed</h1>
        <p>This is a demo confirmation. Payment was not taken, stock was not reserved, and ${escapeHtml(data.name)} will not receive a receipt at ${escapeHtml(data.email)}.</p>
        <p>Delivery preview: ${escapeHtml(data.address)}</p>
        <div class="summary">${summary(lines())}</div>
        <p class="fine">To accept real orders, connect a payment provider and replace this page with its hosted checkout. The sample bag can be cleared below so you can keep browsing.</p>
        <button class="btn" type="button" data-clear>Clear the sample bag</button>
        <a class="text-link" href="shop.html">Return to the shop</a>
      </div>`;
    root.querySelector("[data-clear]").addEventListener("click", () => {
      clearCart();
      root.innerHTML = `
        <div class="empty-panel">
          <h1>Sample bag cleared</h1>
          <p>No order exists. You can keep browsing the sample catalog.</p>
          <a class="btn" href="shop.html">Continue shopping</a>
        </div>`;
    });
  });
}

render();
onCartChange(() => {
  if (!root.querySelector(".demo-result")) render();
});
