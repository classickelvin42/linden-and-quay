import { mountShell } from "./shell.js?v=4";

await mountShell("track");
const form = document.querySelector("[data-track]");
const result = document.querySelector("[data-track-result]");
const copy = document.querySelector("[data-track-copy]");
const summary = form.querySelector(".error-summary");

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const field = form.querySelector("#ref");
  const error = document.getElementById("ref-error");
  const value = field.value.trim();
  error.hidden = true;
  summary.hidden = true;
  if (value.length < 4) {
    field.setAttribute("aria-invalid", "true");
    error.hidden = false;
    error.textContent = "Enter a reference of at least 4 characters.";
    summary.hidden = false;
    summary.querySelector("ul").innerHTML = `<li><a href="#ref">${error.textContent}</a></li>`;
    summary.focus();
    result.hidden = true;
    return;
  }
  field.removeAttribute("aria-invalid");
  copy.textContent = `“${value}” does not match an order. This sample shop does not take payment or create shipments, so there is nothing to track.`;
  result.hidden = false;
  result.focus();
});
