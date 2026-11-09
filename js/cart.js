const KEY = "precious-cart";

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => item && item.id && Number.isInteger(item.qty) && item.qty > 0);
  } catch {
    return [];
  }
}

function write(items) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("cart:change"));
}

export function lineKey(id, size) {
  return `${id}::${size || ""}`;
}

export function getCart() {
  return read();
}

export function cartCount() {
  return read().reduce((sum, item) => sum + item.qty, 0);
}

export function addToCart(id, size, qty) {
  const items = read();
  const key = lineKey(id, size);
  const existing = items.find((item) => lineKey(item.id, item.size) === key);
  const nextQty = Math.min(8, (existing ? existing.qty : 0) + qty);
  if (existing) existing.qty = nextQty;
  else items.push({ id, size: size || "", qty: nextQty });
  write(items);
}

export function setQty(id, size, qty) {
  const items = read().flatMap((item) => {
    if (lineKey(item.id, item.size) !== lineKey(id, size)) return [item];
    if (qty < 1) return [];
    return [{ ...item, qty: Math.min(8, qty) }];
  });
  write(items);
}

export function removeLine(id, size) {
  write(read().filter((item) => lineKey(item.id, item.size) !== lineKey(id, size)));
}

export function clearCart() {
  write([]);
}

export function onCartChange(handler) {
  window.addEventListener("cart:change", handler);
  window.addEventListener("storage", (event) => {
    if (event.key === KEY) handler();
  });
}
