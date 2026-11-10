import { mountShell, escapeHtml } from "./shell.js?v=5";

await mountShell("track");
const form = document.querySelector("[data-track]");
const result = document.querySelector("[data-track-result]");
const heading = result.querySelector("h2");
const copy = document.querySelector("[data-track-copy]");
const summary = form.querySelector(".error-summary");
const field = form.querySelector("#ref");

function money(amount, currency) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD"
  }).format(amount / 100);
}

function showProblem(message) {
  field.setAttribute("aria-invalid", "true");
  const error = document.getElementById("ref-error");
  error.hidden = false;
  error.textContent = message;
  summary.hidden = false;
  summary.querySelector("ul").innerHTML = `<li><a href="#ref">${escapeHtml(message)}</a></li>`;
  summary.focus();
  result.hidden = true;
}

async function lookup(value) {
  const response = await fetch(`/api/orders?reference=${encodeURIComponent(value)}`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    heading.textContent = "No order found";
    copy.textContent = payload.error || "No order matches that reference.";
    result.hidden = false;
    result.focus();
    return;
  }
  const items = payload.items.map((item) => {
    const size = item.size ? `, ${item.size}` : "";
    return `${item.name}${size} × ${item.qty}`;
  }).join("; ");
  heading.textContent = payload.reference;
  copy.textContent = `Status: ${payload.status}. Payment has not been taken. ${items}. Subtotal ${money(payload.subtotal, payload.currency)}.`;
  result.hidden = false;
  result.focus();
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const error = document.getElementById("ref-error");
  const value = field.value.trim();
  error.hidden = true;
  summary.hidden = true;
  if (value.length < 4) {
    showProblem("Enter a reference of at least 4 characters.");
    return;
  }
  field.removeAttribute("aria-invalid");
  const button = form.querySelector('[type="submit"]');
  button.disabled = true;
  try {
    await lookup(value);
  } catch {
    showProblem("The shop could not look up that reference.");
  } finally {
    button.disabled = false;
  }
});

const preset = new URLSearchParams(location.search).get("ref");
if (preset) {
  field.value = preset;
  form.requestSubmit();
}
