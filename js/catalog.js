let storePromise;
let productPromise;

export function loadStore() {
  if (!storePromise) {
    storePromise = fetch("data/store.json?v=3").then((response) => {
      if (!response.ok) throw new Error("Could not load store settings.");
      return response.json();
    });
  }
  return storePromise;
}

export function loadProducts() {
  if (!productPromise) {
    productPromise = fetch("data/products.json?v=3").then((response) => {
      if (!response.ok) throw new Error("Could not load the catalog.");
      return response.json();
    }).then((data) => data.products);
  }
  return productPromise;
}

export function money(amount, store) {
  return new Intl.NumberFormat(store.locale || "en", {
    style: "currency",
    currency: store.currency || "USD"
  }).format(amount / 100);
}

export function categoryName(store, id) {
  const match = store.categories.find((item) => item.id === id);
  return match ? match.name : id;
}

export function needsSize(product) {
  return Array.isArray(product.sizes) && product.sizes.length > 0;
}

export function sortProducts(list, sort) {
  const items = [...list];
  if (sort === "newest") {
    items.sort((a, b) => b.added.localeCompare(a.added));
  } else if (sort === "price-asc") {
    items.sort((a, b) => a.price - b.price);
  } else if (sort === "price-desc") {
    items.sort((a, b) => b.price - a.price);
  } else {
    items.sort((a, b) => Number(b.featured) - Number(a.featured) || b.added.localeCompare(a.added));
  }
  return items;
}

export function filterProducts(products, { category = "", query = "", sort = "featured", color = "", size = "", min = "", max = "" } = {}) {
  const needle = query.trim().toLowerCase();
  const low = min === "" ? null : Number(min) * 100;
  const high = max === "" ? null : Number(max) * 100;
  const filtered = products.filter((product) => {
    if (category && product.category !== category) return false;
    if (color && product.color !== color) return false;
    if (size && !(product.sizes || []).includes(size)) return false;
    if (low !== null && !Number.isNaN(low) && product.price < low) return false;
    if (high !== null && !Number.isNaN(high) && product.price > high) return false;
    if (!needle) return true;
    const haystack = `${product.name} ${product.description} ${product.category} ${product.color || ""}`.toLowerCase();
    return haystack.includes(needle);
  });
  return sortProducts(filtered, sort);
}

export function relatedProducts(products, product) {
  const same = products.filter((item) => item.id !== product.id && item.category === product.category);
  const pairs = {
    dresses: "shirts",
    shirts: "dresses",
    heels: "shoes",
    shoes: "heels",
    slippers: "shoes",
    watches: "heels"
  };
  const extra = products.filter((item) => item.id !== product.id && item.category === pairs[product.category]);
  return [...same, ...extra].slice(0, 4);
}
