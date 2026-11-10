import { mountShell, productCard, escapeHtml, syncWishlistButtons } from "./shell.js?v=5";
import { sortProducts } from "./catalog.js?v=3";

const { store, products } = await mountShell("home");
const newest = sortProducts(products, "newest").slice(0, 4);
const featured = products.filter((item) => item.featured).slice(0, 4);

document.querySelector("[data-categories]").innerHTML = store.categories.map((category) => `
  <a class="cat-tile" href="shop.html?category=${category.id}">
    <img src="${category.image}" alt="">
    <span>
      <strong>${escapeHtml(category.name)}</strong>
      <em>${escapeHtml(category.blurb)}</em>
    </span>
  </a>`).join("");

document.querySelector("[data-new]").innerHTML = newest.map((item) => productCard(item, store)).join("");
document.querySelector("[data-featured]").innerHTML = featured.map((item) => productCard(item, store)).join("");
syncWishlistButtons();

const hero = document.querySelector("[data-hero]");
if (hero) {
  const photos = [...hero.querySelectorAll("img")];
  const dots = [...hero.querySelectorAll(".slide-dots button")];
  let index = 0;
  let timer = 0;
  photos.forEach((photo) => {
    photo.tabIndex = photo.classList.contains("is-on") ? 0 : -1;
    photo.setAttribute("role", "button");
    photo.setAttribute("aria-pressed", "false");
    photo.setAttribute("aria-label", `Move this photo closer. ${photo.alt}`);
  });
  const show = (next) => {
    const previous = index;
    index = (next + photos.length) % photos.length;
    photos.forEach((photo, i) => {
      const on = i === index;
      photo.classList.toggle("is-on", on);
      photo.classList.toggle("is-leaving", i === previous && !on);
      if (!on) photo.classList.remove("is-near");
      photo.toggleAttribute("inert", !on);
      photo.tabIndex = on ? 0 : -1;
      if (!on) photo.setAttribute("aria-pressed", "false");
    });
    dots.forEach((dot, i) => dot.setAttribute("aria-selected", i === index ? "true" : "false"));
  };
  const start = () => {
    window.clearInterval(timer);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || photos.length < 2) return;
    timer = window.setInterval(() => {
      if (photos[index].classList.contains("is-near")) return;
      show(index + 1);
    }, 7200);
  };
  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      show(i);
      start();
    });
  });
  hero.addEventListener("click", (event) => {
    if (event.target.closest(".slide-dots, img")) return;
    photos[index].click();
  });
  show(0);
  start();
}
