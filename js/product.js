import { mountShell, productCard, toast, escapeHtml, syncWishlistButtons } from "./shell.js?v=4";
import { money, categoryName, needsSize, relatedProducts } from "./catalog.js?v=3";
import { addToCart } from "./cart.js";

const { store, products } = await mountShell("");
const slug = new URLSearchParams(location.search).get("slug");
const product = products.find((item) => item.slug === slug);
const root = document.querySelector("[data-product]");

if (!product) {
  document.title = `Piece not found · ${store.name}`;
  root.innerHTML = `
    <div class="empty-panel">
      <h1>We can’t find that piece</h1>
      <p>The link may be out of date, or the sample catalog no longer includes it.</p>
      <a class="btn" href="shop.html">Back to the shop</a>
    </div>`;
} else {
  document.title = `${product.name} · ${store.name}`;
  const meta = document.querySelector('meta[name="description"]');
  if (meta) meta.content = product.description;
  const thumbs = product.images.map((image, index) => `
    <button type="button" class="${index === 0 ? "is-on" : ""}" data-src="${image.src}" data-alt="${escapeHtml(image.alt)}" aria-label="Show image ${index + 1}">
      <img src="${image.src}" alt="">
    </button>`).join("");
  const sizeBlock = needsSize(product) ? `
    <fieldset class="sizes">
      <legend>Size</legend>
      <div class="size-list">
        ${product.sizes.map((size) => `
          <label class="size-opt">
            <input type="radio" name="size" value="${escapeHtml(size)}">
            <span>${escapeHtml(size)}</span>
          </label>`).join("")}
      </div>
      <p class="field-error" id="size-error" hidden></p>
      <p><a href="size-guide.html">Size guide</a></p>
    </fieldset>` : `<p class="muted">No size to choose for this piece.</p>`;
  const compare = product.compareAt ? `<span class="compare">${money(product.compareAt, store)}</span> ` : "";
  const details = [
    product.materials ? `<h2>Materials</h2><p>${escapeHtml(product.materials)}</p>` : "",
    product.care ? `<h2>Care</h2><p>${escapeHtml(product.care)}</p>` : ""
  ].join("");
  root.innerHTML = `
    <nav class="crumbs" aria-label="Breadcrumb">
      <a href="shop.html">Shop</a>
      <span aria-hidden="true">/</span>
      <a href="shop.html?category=${product.category}">${escapeHtml(categoryName(store, product.category))}</a>
    </nav>
    <div class="pdp">
      <div class="gallery">
        <div class="frame"><img class="hero-photo" src="${product.images[0].src}" alt="${escapeHtml(product.images[0].alt)}"></div>
        ${product.images.length > 1 ? `<div class="thumbs">${thumbs}</div>` : ""}
      </div>
      <div class="buy">
        <p class="eyebrow">${escapeHtml(categoryName(store, product.category))}</p>
        <h1>${escapeHtml(product.name)}</h1>
        <p class="price price-lg">${compare}${money(product.price, store)}</p>
        <p>${escapeHtml(product.description)}</p>
        <p class="stock ${product.inStock ? "in" : "out"}">${product.inStock ? "In stock in this sample catalog" : "Sold out in this sample catalog"}</p>
        <form class="buy-form">
          ${sizeBlock}
          <div class="qty-field">
            <label for="qty">Quantity</label>
            <div class="qty-row">
              <button type="button" data-step="-1" aria-label="Decrease quantity">−</button>
              <input id="qty" name="qty" type="number" min="1" max="8" value="1" inputmode="numeric">
              <button type="button" data-step="1" aria-label="Increase quantity">+</button>
            </div>
          </div>
          <p class="field-error" id="form-error" hidden></p>
          <div class="buy-actions">
            <button class="btn" type="submit" ${product.inStock ? "" : "disabled"}>${product.inStock ? "Add to bag" : "Unavailable"}</button>
            <button class="btn btn-quiet" type="button" data-wish="${product.id}" data-name="${escapeHtml(product.name)}" data-wish-label>Save</button>
          </div>
        </form>
        <p class="added" role="status" hidden></p>
        ${details ? `<div class="details">${details}</div>` : ""}
      </div>
    </div>
    <section class="band">
      <div class="section-head"><h2>You may also like</h2></div>
      <div class="grid">${relatedProducts(products, product).map((item) => productCard(item, store)).join("")}</div>
    </section>`;
  syncWishlistButtons();

  const photo = root.querySelector(".hero-photo");
  photo.tabIndex = 0;
  photo.setAttribute("role", "button");
  photo.setAttribute("aria-pressed", "false");
  photo.setAttribute("aria-label", "Move this photo closer");
  root.querySelectorAll(".thumbs button").forEach((button) => {
    button.addEventListener("click", () => {
      photo.src = button.dataset.src;
      photo.alt = button.dataset.alt;
      photo.classList.remove("is-near");
      photo.setAttribute("aria-pressed", "false");
      root.querySelectorAll(".thumbs button").forEach((item) => item.classList.toggle("is-on", item === button));
    });
  });
  const qty = root.querySelector("#qty");
  root.querySelectorAll("[data-step]").forEach((button) => {
    button.addEventListener("click", () => {
      const next = Number(qty.value) + Number(button.dataset.step);
      qty.value = String(Math.min(8, Math.max(1, next)));
    });
  });
  root.querySelector(".buy-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const error = root.querySelector("#form-error");
    const sizeError = root.querySelector("#size-error");
    error.hidden = true;
    if (sizeError) sizeError.hidden = true;
    if (!product.inStock) return;
    const chosen = root.querySelector('input[name="size"]:checked');
    if (needsSize(product) && !chosen) {
      if (sizeError) {
        sizeError.hidden = false;
        sizeError.textContent = "Choose a size before adding this piece.";
      }
      root.querySelector(".sizes")?.scrollIntoView({ block: "nearest" });
      return;
    }
    let count = Number(qty.value);
    if (!Number.isInteger(count) || count < 1 || count > 8) {
      error.hidden = false;
      error.textContent = "Choose a quantity from 1 to 8.";
      return;
    }
    const size = chosen ? chosen.value : "";
    addToCart(product.id, size, count);
    const status = root.querySelector(".added");
    const label = size ? `${product.name}, size ${size}` : product.name;
    status.hidden = false;
    status.textContent = `${label} is in your bag.`;
    toast(`<p>Added ${escapeHtml(label)}.</p><a href="cart.html">View bag</a>`);
    const drawer = document.getElementById("cart-drawer");
    if (!drawer.open) document.querySelector('[data-open="cart"]').click();
  });
}
