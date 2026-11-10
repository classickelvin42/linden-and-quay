import { trapTab, focusable } from "./a11y.js";
import { loadStore, loadProducts, money, categoryName } from "./catalog.js?v=3";
import { getCart, cartCount, setQty, removeLine, onCartChange } from "./cart.js";
import { bindForm } from "./forms.js?v=5";
import { getWishlist, toggleWish, onWishChange } from "./wishlist.js";

const ICONS = {
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M16 16.5 20 20.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  bag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 8h11l-.8 11.2a1 1 0 0 1-1 .8H8.3a1 1 0 0 1-1-.8L6.5 8Z" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M9 8V6.8A3 3 0 0 1 12 3.8 3 3 0 0 1 15 6.8V8" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>',
  user: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M5.5 19.2a6.5 6.5 0 0 1 13 0" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>',
  heart: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19.2s-6.2-3.9-6.2-8.1A3.4 3.4 0 0 1 12 8.2a3.4 3.4 0 0 1 6.2 2.9c0 4.2-6.2 8.1-6.2 8.1Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>'
};

let lastFocus = null;

function params() {
  return new URLSearchParams(location.search);
}

export async function mountShell(active) {
  const store = await loadStore();
  const products = await loadProducts();
  const query = params().get("q") || "";
  document.body.insertAdjacentHTML("afterbegin", headerMarkup(store, active, query));
  document.body.insertAdjacentHTML("beforeend", footerMarkup(store) + overlayMarkup(store));
  document.title = document.title.includes(store.name) ? document.title : `${document.title} · ${store.name}`;
  bindChrome(store, products);
  renderDrawer(store, products);
  onCartChange(() => {
    updateBadge();
    renderDrawer(store, products);
  });
  updateBadge();
  syncWishlistButtons();
  onWishChange(syncWishlistButtons);
  return { store, products };
}

function headerMarkup(store, active, query) {
  const links = store.categories.map((category) => {
    const current = active === category.id ? ' aria-current="page"' : "";
    return `<a href="shop.html?category=${category.id}"${current}>${category.name}</a>`;
  }).join("");
  return `
    <a class="skip" href="#main">Skip to content</a>
    <div class="announce"><p>${escapeHtml(store.announcement)}</p></div>
    <header class="site-header">
      <div class="header-bar">
        <button class="icon-btn menu-btn" type="button" aria-expanded="false" aria-controls="mobile-nav">
          <span class="menu-lines" aria-hidden="true"></span>
          <span class="visually-hidden">Open menu</span>
        </button>
        <a class="wordmark" href="index.html">${escapeHtml(store.name)}</a>
        <nav class="desk-nav" aria-label="Categories">
          <a href="shop.html"${active === "shop" ? ' aria-current="page"' : ""}>Shop</a>
          ${links}
        </nav>
        <div class="header-tools">
          <form class="header-search" action="shop.html" method="get" role="search">
            <label class="visually-hidden" for="header-q">Search products</label>
            <input id="header-q" name="q" type="search" value="${escapeAttr(query)}" placeholder="Search" autocomplete="off">
            <button class="icon-btn" type="submit">${ICONS.search}<span class="visually-hidden">Search</span></button>
          </form>
          <a class="icon-btn" href="wishlist.html" aria-label="Saved pieces">
            ${ICONS.heart}
            <span class="bag-count" data-wish-count>0</span>
          </a>
          <button class="icon-btn" type="button" data-open="account" aria-haspopup="dialog">${ICONS.user}<span class="visually-hidden">Account</span></button>
          <button class="icon-btn bag-btn" type="button" data-open="cart" aria-haspopup="dialog">
            ${ICONS.bag}
            <span class="visually-hidden">Bag</span>
            <span class="bag-count" data-count>0</span>
          </button>
        </div>
      </div>
    </header>
    <dialog class="nav-dialog" id="mobile-nav" aria-label="Menu">
      <div class="dialog-head">
        <p class="dialog-kicker">Browse</p>
        <button class="icon-btn" type="button" data-close>${ICONS.close}<span class="visually-hidden">Close menu</span></button>
      </div>
      <nav class="mobile-links" aria-label="Mobile">
        <a href="shop.html">All pieces</a>
        ${links}
        <a href="wishlist.html">Saved</a>
        <a href="journal.html">Journal</a>
        <a href="size-guide.html">Size guide</a>
        <a href="track.html">Track an order</a>
        <a href="about.html">The house</a>
        <a href="contact.html">Contact</a>
        <a href="cart.html">Bag</a>
      </nav>
      <form class="mobile-search" action="shop.html" method="get" role="search">
        <label for="mobile-q">Search</label>
        <input id="mobile-q" name="q" type="search" value="${escapeAttr(query)}" placeholder="Dresses, heels, watches">
        <button class="btn" type="submit">Search</button>
      </form>
    </dialog>`;
}

function footerMarkup(store) {
  const cats = store.categories.map((category) => `<li><a href="shop.html?category=${category.id}">${category.name}</a></li>`).join("");
  return `
    <footer class="site-footer">
      <div class="footer-grid">
        <div>
          <p class="wordmark footer-mark">${escapeHtml(store.name)}</p>
          <p>${escapeHtml(store.tagline)} Sample copy for a store that is not yet taking orders.</p>
        </div>
        <div>
          <h2>Shop</h2>
          <ul>${cats}</ul>
        </div>
        <div>
          <h2>Visit</h2>
          <ul>
            <li><a href="about.html">The house</a></li>
            <li><a href="journal.html">Journal</a></li>
            <li><a href="size-guide.html">Size guide</a></li>
            <li><a href="track.html">Track an order</a></li>
            <li><a href="contact.html">Contact</a></li>
            <li><a href="privacy.html">Privacy</a></li>
            <li><a href="terms.html">Terms</a></li>
          </ul>
        </div>
        <div>
          <h2>Studio</h2>
          <p class="placeholder-note">${escapeHtml(store.addressNote)}</p>
          <p class="placeholder-note">${escapeHtml(store.contactNote)} <span>${escapeHtml(store.contactEmailPlaceholder)}</span></p>
        </div>
      </div>
      <p class="footer-base">Sample storefront. Prices, stock, and policies are placeholders until Precious and Things replaces them.</p>
    </footer>`;
}

function overlayMarkup() {
  return `
    <div class="toast-wrap" aria-live="polite" aria-atomic="true"></div>
    <dialog class="sheet" id="cart-drawer" aria-labelledby="cart-title">
      <div class="dialog-head">
        <h2 id="cart-title">Your bag</h2>
        <button class="icon-btn" type="button" data-close>${ICONS.close}<span class="visually-hidden">Close bag</span></button>
      </div>
      <div class="sheet-body" data-cart-body></div>
    </dialog>
    <dialog class="modal" id="account-dialog" aria-labelledby="account-title">
      <div class="dialog-head">
        <h2 id="account-title">Account</h2>
        <button class="icon-btn" type="button" data-close>${ICONS.close}<span class="visually-hidden">Close account</span></button>
      </div>
      <p>Sign-in is not connected. This sample store does not create accounts or save a customer profile.</p>
      <p>When a real authentication service is added, this button can open it. Until then, shopping stays on this device in the bag.</p>
      <a class="btn" href="contact.html">Contact the studio</a>
    </dialog>
    <button class="chat-launcher" type="button" data-open="chat">Message</button>
    <dialog class="modal" id="chat-dialog" aria-labelledby="chat-title">
      <div class="dialog-head">
        <h2 id="chat-title">Message the studio</h2>
        <button class="icon-btn" type="button" data-close>${ICONS.close}<span class="visually-hidden">Close message</span></button>
      </div>
      <p>No one is waiting on the other side. This note stays in the browser. It is not a live chat and it is not delivered.</p>
      <div>
        <form data-chat novalidate>
          <div class="error-summary" tabindex="-1" hidden><p>Please fix the following:</p><ul></ul></div>
          <label for="chat-note">Note</label>
          <textarea id="chat-note" name="message" required minlength="8" data-label="Message" rows="4"></textarea>
          <p class="field-error" id="chat-note-error" hidden></p>
          <div class="hp" aria-hidden="true"><label>Company<input name="company" tabindex="-1" autocomplete="off"></label></div>
          <button class="btn" type="submit">Keep on this page</button>
        </form>
        <div class="form-success" tabindex="-1" hidden>
          <p class="success-copy"></p>
          <button class="text-btn reset-form" type="button">Write another note</button>
        </div>
      </div>
    </dialog>`;
}

function bindChrome(store, products) {
  const menuBtn = document.querySelector(".menu-btn");
  const nav = document.getElementById("mobile-nav");
  menuBtn.addEventListener("click", () => openDialog(nav, menuBtn));
  document.querySelectorAll("[data-open]").forEach((button) => {
    button.addEventListener("click", () => {
      const dialog = document.getElementById(`${button.dataset.open === "cart" ? "cart-drawer" : button.dataset.open === "account" ? "account-dialog" : "chat-dialog"}`);
      if (dialog) openDialog(dialog, button);
    });
  });
  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog(dialog);
    });
    dialog.addEventListener("close", () => document.body.classList.remove("scroll-lock"));
    dialog.querySelectorAll("[data-close]").forEach((button) => {
      button.addEventListener("click", () => closeDialog(dialog));
    });
    dialog.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDialog(dialog);
      }
      trapTab(event, () => focusable(dialog));
    });
  });
  const newsletter = document.querySelector("[data-newsletter]");
  if (newsletter) {
    bindForm(newsletter, {
      successText: () => "Saved. This email is stored on the shop server. It is not sent to a mailing company.",
      submit: async (form) => {
        const data = Object.fromEntries(new FormData(form).entries());
        const response = await fetch("/api/subscribers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: data.email.trim(), consent: true })
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || "The email could not be saved.");
        return "Saved. This email is stored on the shop server. It is not sent to a mailing company.";
      }
    });
  }
  const chat = document.querySelector("[data-chat]");
  if (chat) {
    bindForm(chat, {
      successText: () => "Kept on this page only. It was not sent, because no chat service is connected."
    });
  }
  document.addEventListener("click", (event) => {
    const wish = event.target.closest("[data-wish]");
    if (!wish) return;
    event.preventDefault();
    event.stopPropagation();
    const saved = toggleWish(wish.dataset.wish);
    toast(saved ? `<p>Saved ${escapeHtml(wish.dataset.name || "this piece")}.</p><a href="wishlist.html">View saved</a>` : `<p>Removed from saved pieces.</p>`);
  });
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-qty], [data-remove]");
    if (!button) return;
    const id = button.dataset.id;
    const size = button.dataset.size || "";
    if (button.dataset.remove != null) removeLine(id, size);
    if (button.dataset.qty != null) setQty(id, size, Number(button.dataset.qty));
  });
  bindPhotoMotion();
}

function bindPhotoMotion() {
  document.querySelectorAll("main .frame img").forEach((img) => {
    if (img.closest("a")) return;
    img.tabIndex = 0;
    img.setAttribute("role", "button");
    img.setAttribute("aria-pressed", "false");
    if (!img.hasAttribute("aria-label")) img.setAttribute("aria-label", "Move this photo closer");
  });
  const release = (img) => {
    img.classList.remove("is-near");
    if (img.getAttribute("role") === "button") img.setAttribute("aria-pressed", "false");
  };
  document.addEventListener("click", (event) => {
    const img = event.target.closest("main img");
    if (!img || img.closest(".thumbs, .line")) return;
    const link = img.closest("a");
    if (link && img.classList.contains("is-near")) return;
    if (link) event.preventDefault();
    document.querySelectorAll("main img.is-near").forEach((other) => {
      if (other !== img) release(other);
    });
    const near = img.classList.toggle("is-near");
    if (img.getAttribute("role") === "button") img.setAttribute("aria-pressed", near ? "true" : "false");
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const img = event.target instanceof Element ? event.target.closest("img[role='button']") : null;
    if (!img || img.closest(".thumbs, .line")) return;
    event.preventDefault();
    img.click();
  });
}

function openDialog(dialog, trigger) {
  lastFocus = trigger;
  dialog.showModal();
  document.body.classList.add("scroll-lock");
  const focusTarget = focusable(dialog)[0];
  if (focusTarget) focusTarget.focus();
  if (dialog.id === "mobile-nav") {
    document.querySelector(".menu-btn").setAttribute("aria-expanded", "true");
  }
}

function closeDialog(dialog) {
  if (dialog.open) dialog.close();
  document.body.classList.remove("scroll-lock");
  if (dialog.id === "mobile-nav") {
    document.querySelector(".menu-btn").setAttribute("aria-expanded", "false");
  }
  if (lastFocus) lastFocus.focus();
}

function updateBadge() {
  const count = cartCount();
  document.querySelectorAll("[data-count]").forEach((node) => {
    node.textContent = String(count);
    node.classList.toggle("is-empty", count === 0);
  });
}

function renderDrawer(store, products) {
  const body = document.querySelector("[data-cart-body]");
  if (!body) return;
  body.innerHTML = cartInner(store, products, true);
}

export function cartInner(store, products, compact) {
  const lines = getCart().map((line) => {
    const product = products.find((item) => item.id === line.id);
    return product ? { ...line, product } : null;
  }).filter(Boolean);
  if (!lines.length) {
    return `<p class="empty-copy">Your bag is empty.</p><a class="btn" href="shop.html">Continue shopping</a>`;
  }
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.qty, 0);
  const rows = lines.map((line) => {
    const size = line.size ? `<p class="muted">Size ${escapeHtml(line.size)}</p>` : "";
    return `
      <article class="line">
        <a href="product.html?slug=${line.product.slug}"><img src="${line.product.images[0].src}" alt=""></a>
        <div>
          <h3><a href="product.html?slug=${line.product.slug}">${escapeHtml(line.product.name)}</a></h3>
          <p class="muted">${escapeHtml(categoryName(store, line.product.category))}</p>
          ${size}
          <p class="line-price">${money(line.product.price * line.qty, store)}</p>
          <div class="qty-row">
            <button type="button" data-qty="${line.qty - 1}" data-id="${line.product.id}" data-size="${escapeAttr(line.size)}" aria-label="Decrease quantity of ${escapeAttr(line.product.name)}">−</button>
            <span>${line.qty}</span>
            <button type="button" data-qty="${line.qty + 1}" data-id="${line.product.id}" data-size="${escapeAttr(line.size)}" aria-label="Increase quantity of ${escapeAttr(line.product.name)}" ${line.qty >= 8 ? "disabled" : ""}>+</button>
            <button type="button" class="text-btn" data-remove data-id="${line.product.id}" data-size="${escapeAttr(line.size)}">Remove</button>
          </div>
        </div>
      </article>`;
  }).join("");
  return `
    ${rows}
    <div class="totals">
      <p><span>Subtotal</span><strong>${money(subtotal, store)}</strong></p>
      <p class="fine">Shipping and tax are not calculated in this sample store. No rate is shown because none has been configured.</p>
      ${compact ? `<a class="btn btn-block" href="cart.html">Review bag</a>` : ""}
      <a class="btn ${compact ? "btn-quiet btn-block" : "btn-block"}" href="checkout.html">Continue to demo checkout</a>
      <a class="text-link" href="shop.html">Continue shopping</a>
    </div>`;
}

export function syncWishlistButtons() {
  const saved = new Set(getWishlist());
  document.querySelectorAll("[data-wish]").forEach((button) => {
    const on = saved.has(button.dataset.wish);
    const name = button.dataset.name || "this piece";
    button.setAttribute("aria-pressed", on ? "true" : "false");
    button.setAttribute("aria-label", on ? `Remove ${name} from saved pieces` : `Save ${name}`);
    if (button.dataset.wishLabel != null) button.textContent = on ? "Saved" : "Save";
  });
  document.querySelectorAll("[data-wish-count]").forEach((node) => {
    node.textContent = String(saved.size);
    node.classList.toggle("is-empty", saved.size === 0);
  });
}

export function productCard(product, store) {
  const price = product.compareAt
    ? `<p class="price"><span class="compare">${money(product.compareAt, store)}</span> ${money(product.price, store)}</p>`
    : `<p class="price">${money(product.price, store)}</p>`;
  const badge = !product.inStock
    ? `<span class="badge">Sold out</span>`
    : product.compareAt
      ? `<span class="badge">Sample sale</span>`
      : "";
  const alt = product.images[1];
  const second = alt
    ? `<img class="photo-alt" src="${alt.src}" alt="" aria-hidden="true">`
    : `<img class="photo-alt" src="${product.images[0].src}" alt="" aria-hidden="true">`;
  return `
    <article class="card">
      <div class="card-frame">
        <a class="card-media" href="product.html?slug=${product.slug}">
          ${badge}
          <img src="${product.images[0].src}" alt="${escapeAttr(product.images[0].alt)}">
          ${second}
        </a>
        <button class="wish-btn" type="button" data-wish="${product.id}" data-name="${escapeAttr(product.name)}" aria-pressed="false">${ICONS.heart}<span class="visually-hidden">Save</span></button>
      </div>
      <p class="card-cat">${escapeHtml(categoryName(store, product.category))}${product.color ? ` · ${escapeHtml(product.color)}` : ""}</p>
      <h3><a href="product.html?slug=${product.slug}">${escapeHtml(product.name)}</a></h3>
      ${price}
      <a class="text-link" href="product.html?slug=${product.slug}">${product.inStock ? "View piece" : "View details"}</a>
    </article>`;
}

export function toast(message) {
  const wrap = document.querySelector(".toast-wrap");
  if (!wrap) return;
  const node = document.createElement("div");
  node.className = "toast";
  node.innerHTML = message;
  wrap.appendChild(node);
  setTimeout(() => node.remove(), 4200);
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value);
}
