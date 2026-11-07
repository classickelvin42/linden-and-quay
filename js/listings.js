import { clearListingsCache, loadListings } from "./data.js";
import { focusable, trapTab } from "./a11y.js";
import { mountSliders } from "./slider.js";
import { PAGE_SIZE, escapeHtml, fillPriceSelects, formatPrice, listingCard, typeLabel } from "./util.js";

const form = document.querySelector("#filters");
const status = document.querySelector("#result-status");
const results = document.querySelector("#results");
const heading = document.querySelector("#results-heading");
const sortSelect = document.querySelector("#sort");
const openButton = document.querySelector("#open-filters");
const closeButton = document.querySelector("#filters-close");
const minSelect = document.querySelector("#min");
const maxSelect = document.querySelector("#max");
const typeSelect = document.querySelector("#type");
const priceHint = document.querySelector("#price-hint");
const mobile = window.matchMedia("(max-width: 959px)");

let listings = [];
let filtersOpen = false;

function pageNumber(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 ? number : 1;
}

function readForm() {
  const data = new FormData(form);
  const type = String(data.get("type") || "");
  return {
    type,
    area: String(data.get("area") || ""),
    min: type ? String(data.get("min") || "") : "",
    max: type ? String(data.get("max") || "") : "",
    beds: String(data.get("beds") || ""),
    baths: String(data.get("baths") || ""),
    property: String(data.get("property") || ""),
    garden: data.get("garden") ? "1" : "",
    parking: data.get("parking") ? "1" : "",
    available: data.get("available") ? "1" : "",
    sort: sortSelect.value || "new",
    page: pageNumber(data.get("page"))
  };
}

function applyState(state) {
  typeSelect.value = state.type;
  fillPriceSelects(minSelect, maxSelect, state.type);
  updatePriceHint(state.type);
  form.elements.area.value = state.area;
  if ([...minSelect.options].some((option) => option.value === state.min)) minSelect.value = state.min;
  if ([...maxSelect.options].some((option) => option.value === state.max)) maxSelect.value = state.max;
  form.elements.beds.value = state.beds;
  form.elements.baths.value = state.baths;
  form.elements.property.value = state.property;
  form.elements.garden.checked = state.garden === "1";
  form.elements.parking.checked = state.parking === "1";
  form.elements.available.checked = state.available === "1";
  form.elements.page.value = String(state.page || 1);
  const sort = state.sort || "new";
  syncSort(state.type, sort);
}

function stateFromUrl() {
  const params = new URLSearchParams(location.search);
  return {
    type: params.get("type") || "",
    area: params.get("area") || "",
    min: params.get("min") || "",
    max: params.get("max") || "",
    beds: params.get("beds") || "",
    baths: params.get("baths") || "",
    property: params.get("property") || "",
    garden: params.get("garden") || "",
    parking: params.get("parking") || "",
    available: params.get("available") || "",
    sort: params.get("sort") || "new",
    page: pageNumber(params.get("page"))
  };
}

function writeUrl(state) {
  const params = new URLSearchParams();
  Object.entries(state).forEach(([key, value]) => {
    if (value === "" || value == null) return;
    if (key === "page" && Number(value) === 1) return;
    if (key === "sort" && value === "new") return;
    params.set(key, String(value));
  });
  const query = params.toString();
  const url = query ? `listings.html?${query}` : "listings.html";
  history.replaceState(null, "", url);
  sessionStorage.setItem("lq-search", `${location.pathname}${location.search}`);
}

function syncSort(type, preferred) {
  const priceDisabled = !type;
  [...sortSelect.options].forEach((option) => {
    if (option.value.startsWith("price")) option.disabled = priceDisabled;
  });
  const next = priceDisabled && preferred.startsWith("price") ? "new" : preferred;
  sortSelect.value = next;
  return next;
}

function updatePriceHint(type) {
  priceHint.hidden = Boolean(type);
}

function headingFor(state) {
  const market = state.type === "sale" ? "for sale" : state.type === "let" ? "to let" : "";
  const place = state.area || "Bristol and Long Ashton";
  if (market) return `Sample homes ${market} in ${place}`;
  if (state.area) return `Sample homes in ${state.area}`;
  return "Sample homes";
}

function matches(property, state) {
  if (state.type && property.market !== state.type) return false;
  if (state.area && property.area !== state.area) return false;
  if (state.property && property.propertyType !== state.property) return false;
  if (state.beds && property.beds < Number(state.beds)) return false;
  if (state.baths && property.baths < Number(state.baths)) return false;
  if (state.garden === "1" && !property.garden) return false;
  if (state.parking === "1" && !property.parking) return false;
  if (state.available === "1" && (property.status === "under-offer" || property.status === "let-agreed")) return false;
  if (state.min && property.price < Number(state.min)) return false;
  if (state.max && property.price > Number(state.max)) return false;
  return true;
}

function compare(sort) {
  return (a, b) => {
    if (sort === "price-asc") return a.price - b.price || a.id.localeCompare(b.id);
    if (sort === "price-desc") return b.price - a.price || a.id.localeCompare(b.id);
    return b.added.localeCompare(a.added) || a.id.localeCompare(b.id);
  };
}

function chips(state) {
  const items = [];
  if (state.type) items.push(["type", state.type === "sale" ? "Buy" : "Rent"]);
  if (state.area) items.push(["area", state.area]);
  if (state.min) items.push(["min", `From ${formatPrice({ price: Number(state.min), market: state.type })}`]);
  if (state.max) items.push(["max", `Up to ${formatPrice({ price: Number(state.max), market: state.type })}`]);
  if (state.beds) items.push(["beds", `${state.beds}+ beds`]);
  if (state.baths) items.push(["baths", `${state.baths}+ baths`]);
  if (state.property) items.push(["property", typeLabel(state.property)]);
  if (state.garden) items.push(["garden", "Garden"]);
  if (state.parking) items.push(["parking", "Parking"]);
  if (state.available) items.push(["available", "Still on the sample market"]);
  if (!items.length) return "";
  return `<ul class="chips">${items.map(([key, label]) => {
    return `<li><button type="button" data-clear="${escapeHtml(key)}">Remove ${escapeHtml(label)} <span aria-hidden="true">×</span></button></li>`;
  }).join("")}</ul>`;
}

function rangeProblem(state) {
  if (state.min && state.max && Number(state.min) > Number(state.max)) {
    return "The minimum price is higher than the maximum.";
  }
  return "";
}

function render(state) {
  const problem = rangeProblem(state);
  const filtered = problem ? [] : listings.filter((property) => matches(property, state)).sort(compare(state.sort));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(pageNumber(state.page), pages);
  if (page !== state.page) {
    state.page = page;
    form.elements.page.value = String(page);
    writeUrl(state);
  }
  const start = (page - 1) * PAGE_SIZE;
  const slice = filtered.slice(start, start + PAGE_SIZE);
  heading.textContent = headingFor(state);
  document.title = `${heading.textContent} · Linden & Quay`;
  document.querySelectorAll("[data-nav]").forEach((link) => link.removeAttribute("aria-current"));
  if (state.type === "sale" || state.type === "let") {
    document.querySelector(`[data-nav="${state.type}"]`)?.setAttribute("aria-current", "page");
  }

  const priceNote = !state.type && new URLSearchParams(location.search).get("sort")?.startsWith("price")
    ? " Choose buy or rent before sorting by price. Sale prices and monthly rents are not on the same scale."
    : "";

  if (problem) {
    status.textContent = problem;
  } else if (!filtered.length) {
    status.textContent = "No sample homes match these filters.";
  } else {
    const from = start + 1;
    const to = start + slice.length;
    status.textContent = `Showing ${from}–${to} of ${filtered.length} sample ${filtered.length === 1 ? "home" : "homes"}, page ${page} of ${pages}.${priceNote}`;
  }

  const empty = `<div class="empty-state">
      <p>${problem || "Nothing in the sample catalogue matches. Reset the filters or widen the budget."}</p>
      <button type="button" class="button button-secondary" id="empty-reset">Reset filters</button>
    </div>`;

  const grid = slice.length
    ? `<div class="results-grid">${slice.map((property) => listingCard(property)).join("")}</div>`
    : empty;

  const pager = pages > 1 ? pagination(page, pages) : "";
  results.setAttribute("aria-busy", "false");
  results.innerHTML = `${chips(state)}${grid}${pager}`;
  mountSliders(results);
  sessionStorage.setItem("lq-search", `${location.pathname}${location.search}`);
}

function pagination(page, pages) {
  const buttons = [];
  for (let number = 1; number <= pages; number += 1) {
    const current = number === page ? ' aria-current="page"' : "";
    buttons.push(`<button type="button" data-page="${number}"${current}>${number}</button>`);
  }
  return `<nav class="pager" aria-label="Pagination">
    <button type="button" data-page="${page - 1}" ${page === 1 ? "disabled" : ""}>Previous</button>
    ${buttons.join("")}
    <button type="button" data-page="${page + 1}" ${page === pages ? "disabled" : ""}>Next</button>
  </nav>`;
}

function setFiltersOpen(next) {
  filtersOpen = next && mobile.matches;
  form.classList.toggle("is-open", filtersOpen);
  openButton.setAttribute("aria-expanded", String(filtersOpen));
  document.body.classList.toggle("scroll-lock", filtersOpen);
  if (filtersOpen) {
    form.setAttribute("role", "dialog");
    form.setAttribute("aria-modal", "true");
    form.setAttribute("aria-labelledby", "filters-title");
    closeButton.focus();
  } else {
    form.removeAttribute("role");
    form.removeAttribute("aria-modal");
  }
}

function commit(resetPage = true) {
  const state = readForm();
  if (resetPage) state.page = 1;
  state.sort = syncSort(state.type, state.sort);
  form.elements.page.value = String(state.page);
  updatePriceHint(state.type);
  writeUrl(state);
  render(state);
}

function boot(list) {
  listings = list;
  const state = stateFromUrl();
  applyState(state);
  state.sort = syncSort(state.type, state.sort);
  writeUrl(readForm());
  render(readForm());
}

function showError(error) {
  results.setAttribute("aria-busy", "false");
  status.textContent = "The sample listings could not be loaded.";
  results.innerHTML = `<div class="empty-state">
    <p>${escapeHtml(error.message || "Something went wrong while loading the catalogue.")}</p>
    <button type="button" class="button button-secondary" id="retry-load">Try again</button>
  </div>`;
  document.querySelector("#retry-load").addEventListener("click", () => {
    clearListingsCache();
    status.textContent = "Loading sample homes…";
    results.innerHTML = skeleton();
    loadListings().then(boot).catch(showError);
  });
}

function skeleton() {
  return `<div class="results-grid" aria-hidden="true">${"<div class='skeleton'></div>".repeat(3)}</div>`;
}

openButton.addEventListener("click", () => {
  setFiltersOpen(true);
});

closeButton.addEventListener("click", () => {
  setFiltersOpen(false);
  openButton.focus();
});

document.addEventListener("keydown", (event) => {
  if (!filtersOpen) return;
  if (event.key === "Escape") {
    setFiltersOpen(false);
    openButton.focus();
  } else {
    trapTab(event, () => focusable(form));
  }
});

mobile.addEventListener("change", () => setFiltersOpen(false));

typeSelect.addEventListener("change", () => {
  fillPriceSelects(minSelect, maxSelect, typeSelect.value);
  updatePriceHint(typeSelect.value);
  commit();
});

form.addEventListener("change", (event) => {
  if (event.target === typeSelect) return;
  commit();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  commit();
  if (mobile.matches) {
    setFiltersOpen(false);
    heading.focus();
  }
});

document.querySelector("#filters-reset").addEventListener("click", () => {
  form.reset();
  sortSelect.value = "new";
  fillPriceSelects(minSelect, maxSelect, "");
  form.elements.page.value = "1";
  commit();
  if (mobile.matches) setFiltersOpen(false);
});

sortSelect.addEventListener("change", () => {
  if (!typeSelect.value && sortSelect.value.startsWith("price")) {
    sortSelect.value = "new";
    status.textContent = "Choose buy or rent before sorting by price. Sale prices and monthly rents are not on the same scale.";
    return;
  }
  commit(false);
});

results.addEventListener("click", (event) => {
  const clear = event.target.closest("[data-clear]");
  if (clear) {
    const key = clear.dataset.clear;
    const field = form.elements[key];
    if (field.type === "checkbox") field.checked = false;
    else field.value = "";
    if (key === "type") fillPriceSelects(minSelect, maxSelect, "");
    commit();
    return;
  }
  const pageButton = event.target.closest(".pager button[data-page]");
  if (pageButton && !pageButton.disabled) {
    form.elements.page.value = String(pageNumber(pageButton.getAttribute("data-page")));
    const state = readForm();
    writeUrl(state);
    render(state);
    heading.focus();
  }
  if (event.target.closest("#empty-reset")) {
    document.querySelector("#filters-reset").click();
  }
});

window.addEventListener("popstate", () => {
  const state = stateFromUrl();
  applyState(state);
  render(readForm());
});

heading.tabIndex = -1;
loadListings().then(boot).catch(showError);
