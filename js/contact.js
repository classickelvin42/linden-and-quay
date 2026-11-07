import { bindForm } from "./forms.js";

const form = document.querySelector("#contact-form form");
const topic = document.querySelector("#topic");
const params = new URLSearchParams(location.search);
const requested = params.get("topic");
const allowed = new Set(["viewing", "valuation", "buying", "letting", "landlord", "other"]);

if (requested && allowed.has(requested)) {
  topic.value = requested;
}

bindForm(form, {
  successText(current) {
    const name = current.elements.name.value.trim();
    return `Thanks, ${name}. This demonstration did not send your message. Nothing was stored. Call 0117 496 0148 if you want to test the contact route by phone.`;
  }
});
