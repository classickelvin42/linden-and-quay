const KEY = "precious-wishlist";

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function write(ids) {
  localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new CustomEvent("wish:change"));
}

export function getWishlist() {
  return read();
}

export function hasWish(id) {
  return read().includes(id);
}

export function toggleWish(id) {
  const ids = read();
  const next = ids.includes(id) ? ids.filter((item) => item !== id) : [id, ...ids];
  write(next);
  return next.includes(id);
}

export function onWishChange(handler) {
  window.addEventListener("wish:change", handler);
  window.addEventListener("storage", (event) => {
    if (event.key === KEY) handler();
  });
}
