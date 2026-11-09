import { mountShell, productCard, syncWishlistButtons } from "./shell.js?v=4";
import { filterProducts } from "./catalog.js?v=3";

const { store, products } = await mountShell("shop");
const params = new URLSearchParams(location.search);
const state = {
  category: params.get("category") || "",
  query: params.get("q") || "",
  sort: params.get("sort") || "featured",
  color: params.get("color") || "",
  size: params.get("size") || "",
  min: params.get("min") || "",
  max: params.get("max") || ""
};

const title = document.querySelector("[data-shop-title]");
const note = document.querySelector("[data-shop-note]");
const grid = document.querySelector("[data-grid]");
const empty = document.querySelector("[data-empty]");
const filters = document.querySelector("[data-filters]");
const sort = document.querySelector("[data-sort]");
const search = document.querySelector("[data-shop-search]");

filters.innerHTML = [`<button type="button" data-cat="" class="${state.category ? "" : "is-on"}">All</button>`]
  .concat(store.categories.map((category) => {
    const on = state.category === category.id ? "is-on" : "";
    const current = state.category === category.id ? ' aria-current="true"' : "";
    return `<button type="button" data-cat="${category.id}" class="${on}"${current}>${category.name}</button>`;
  })).join("");

sort.value = state.sort;
search.value = state.query;

const colorSelect = document.querySelector("[data-color]");
const sizeSelect = document.querySelector("[data-size]");
const minInput = document.querySelector("[data-min]");
const maxInput = document.querySelector("[data-max]");
const colors = [...new Set(products.map((item) => item.color).filter(Boolean))].sort();
const sizeOrder = ["XS", "S", "M", "L", "XL", "EU 36", "EU 37", "EU 38", "EU 39", "EU 40", "EU 41"];
const sizes = sizeOrder.filter((size) => products.some((item) => (item.sizes || []).includes(size)));
colorSelect.innerHTML = `<option value="">Any colour</option>` + colors.map((color) => `<option value="${color}">${color}</option>`).join("");
sizeSelect.innerHTML = `<option value="">Any size</option>` + sizes.map((size) => `<option value="${size}">${size}</option>`).join("");
colorSelect.value = state.color;
sizeSelect.value = state.size;
minInput.value = state.min;
maxInput.value = state.max;

function render() {
  const matches = filterProducts(products, state);
  const category = store.categories.find((item) => item.id === state.category);
  title.textContent = category ? category.name : "The shop";
  const bits = [`${matches.length} ${matches.length === 1 ? "piece" : "pieces"}`];
  if (state.query) bits.push(`matching “${state.query}”`);
  note.textContent = bits.join(" ");
  grid.innerHTML = matches.map((item) => productCard(item, store)).join("");
  syncWishlistButtons();
  empty.hidden = matches.length > 0;
  grid.hidden = matches.length === 0;
  const url = new URL(location.href);
  ["category", "q", "sort", "color", "size", "min", "max"].forEach((key) => url.searchParams.delete(key));
  if (state.category) url.searchParams.set("category", state.category);
  if (state.query) url.searchParams.set("q", state.query);
  if (state.sort !== "featured") url.searchParams.set("sort", state.sort);
  if (state.color) url.searchParams.set("color", state.color);
  if (state.size) url.searchParams.set("size", state.size);
  if (state.min) url.searchParams.set("min", state.min);
  if (state.max) url.searchParams.set("max", state.max);
  history.replaceState({}, "", url);
  if (category) document.title = `${category.name} · Precious and Things`;
  document.querySelectorAll(".desk-nav a, .mobile-links a").forEach((link) => {
    const url = new URL(link.href);
    const linkCategory = url.searchParams.get("category") || "";
    const shopAll = link.getAttribute("href") === "shop.html";
    const on = shopAll ? !state.category : linkCategory === state.category;
    if (on) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

filters.addEventListener("click", (event) => {
  const button = event.target.closest("[data-cat]");
  if (!button) return;
  state.category = button.dataset.cat;
  filters.querySelectorAll("button").forEach((item) => {
    const on = item === button;
    item.classList.toggle("is-on", on);
    if (on) item.setAttribute("aria-current", "true");
    else item.removeAttribute("aria-current");
  });
  render();
});

sort.addEventListener("change", () => {
  state.sort = sort.value;
  render();
});

search.addEventListener("input", () => {
  state.query = search.value;
  render();
});

colorSelect.addEventListener("change", () => {
  state.color = colorSelect.value;
  render();
});
sizeSelect.addEventListener("change", () => {
  state.size = sizeSelect.value;
  render();
});
minInput.addEventListener("input", () => {
  state.min = minInput.value;
  render();
});
maxInput.addEventListener("input", () => {
  state.max = maxInput.value;
  render();
});

render();
