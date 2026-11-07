import { loadListings } from "./data.js";
import { mountSliders } from "./slider.js";
import { fillPriceSelects, listingCard } from "./util.js";

const typeSelect = document.querySelector("#home-type");
const minSelect = document.querySelector("#home-min");
const maxSelect = document.querySelector("#home-max");
const hint = document.querySelector("#home-price-hint");
const featured = document.querySelector("#featured");

function syncPrices() {
  fillPriceSelects(minSelect, maxSelect, typeSelect.value);
  hint.hidden = Boolean(typeSelect.value);
}

typeSelect.addEventListener("change", syncPrices);
syncPrices();
mountSliders();

loadListings()
  .then((listings) => {
    const picks = listings.filter((property) => property.featured).slice(0, 3);
    featured.innerHTML = picks.map((property) => listingCard(property)).join("");
    featured.setAttribute("aria-busy", "false");
    mountSliders(featured);
  })
  .catch(() => {
    featured.setAttribute("aria-busy", "false");
    featured.innerHTML = `<div class="empty-state"><p>The sample homes could not be loaded. Open the listings page to try again.</p><p><a class="button button-secondary" href="listings.html">Go to listings</a></p></div>`;
  });
