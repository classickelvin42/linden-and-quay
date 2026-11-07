import { loadListings } from "./data.js";
import { bindForm } from "./forms.js";
import { mountSliders } from "./slider.js";
import {
  escapeHtml,
  formatDate,
  formatMoney,
  formatPrice,
  listingCard,
  sliderMarkup,
  statusLabel,
  typeLabel
} from "./util.js";

const root = document.querySelector("#property-root");
const back = document.querySelector("#back-link");
const savedSearch = sessionStorage.getItem("lq-search");

if (savedSearch && savedSearch.includes("listings.html")) {
  const saved = new URL(savedSearch, location.origin);
  const savedPage = Number(saved.searchParams.get("page"));
  if (!Number.isInteger(savedPage) || savedPage < 1) saved.searchParams.delete("page");
  back.setAttribute("href", `${saved.pathname.replace(/^\//, "")}${saved.search}`);
}

/**
 * MAP INTEGRATION
 * renderLocation() links to an OpenStreetMap search for the neighbourhood.
 * It does not drop a pin. To show a real plot, store verified coordinates
 * in data/properties.json and initialise a map library inside renderLocation().
 * Do not invent coordinates for these sample homes.
 */

function similarTo(listings, current) {
  return listings
    .filter((property) => property.id !== current.id)
    .map((property) => ({
      property,
      score: (property.area === current.area ? 4 : 0)
        + (property.market === current.market ? 2 : 0)
        + (property.propertyType === current.propertyType ? 1 : 0)
    }))
    .sort((a, b) => b.score - a.score || b.property.added.localeCompare(a.property.added))
    .slice(0, 3)
    .map((item) => item.property);
}

function placeName(property) {
  return property.area === "Long Ashton" ? "Long Ashton, North Somerset" : `${property.area}, Bristol`;
}

function render(property, listings) {
  document.querySelector(".enquire-bar")?.removeAttribute("hidden");
  root.removeAttribute("aria-busy");
  const mapQuery = encodeURIComponent(`${placeName(property)}, UK`);
  const facts = [
    ["Price", formatPrice(property)],
    ["Status", statusLabel(property.status)],
    ["Location", placeName(property)],
    ["Postcode district", `${property.postcodeDistrict} (sample area only)`],
    ["Bedrooms", String(property.beds)],
    ["Bathrooms", String(property.baths)],
    ["Reception rooms", String(property.receptions)],
    ["Type", typeLabel(property.propertyType)],
    ["Tenure", property.tenure],
    ["Interior size", `${property.interiorSqm} m² (sample figure)`],
    ["Garden", property.garden ? "Included in this sample" : "Not in this sample"],
    ["Parking", property.parking ? "Included in this sample" : "Not in this sample"],
    ["Council tax", "Not included in this sample"],
    ["Energy rating", "Not included in this sample"],
    ["Added to this sample", formatDate(property.added)]
  ];
  const statusNote = property.status === "under-offer"
    ? "This sample is marked under offer. A viewing may not be possible on a real instruction in this state."
    : property.status === "let-agreed"
      ? "This sample is marked let agreed. It is still listed so the status is visible."
      : "";

  root.innerHTML = `
    <p class="eyebrow">Sample listing · ${escapeHtml(property.id)}</p>
    <div id="gallery">
      ${sliderMarkup(property.images, { label: `${property.title} photos`, thumbs: true, interval: 4800 })}
    </div>
    <div class="property-layout">
      <div class="property-copy">
        <h1 id="property-title">${escapeHtml(property.title)}</h1>
        <p class="lede">${escapeHtml(property.summary)}</p>
        <p class="price-row"><span class="card-price">${escapeHtml(formatPrice(property))}</span>
          <span class="status status-${escapeHtml(property.status)}">${escapeHtml(statusLabel(property.status))}</span></p>
        <p class="fine">Sample price in pounds sterling. ${property.market === "let" ? "Shown per calendar month. Bills are not specified." : "This is not a formal asking price."}</p>
        <h2>Key facts</h2>
        <dl class="facts">
          ${facts.map(([term, detail]) => `<div><dt>${escapeHtml(term)}</dt><dd>${escapeHtml(detail)}</dd></div>`).join("")}
        </dl>
        <h2>About this sample home</h2>
        ${property.description.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
        <h2>Features in this sample</h2>
        <ul class="feature-list">${property.features.map((feature) => `<li>${escapeHtml(feature)}</li>`).join("")}</ul>
        <h2>Location</h2>
        <p>${escapeHtml(property.locationNote)}</p>
        <p>No map pin is shown, because this is not a real property. <a href="https://www.openstreetmap.org/search?query=${mapQuery}">Look up ${escapeHtml(placeName(property))} on OpenStreetMap</a>.</p>
        <p class="fine">A map with a property pin can be added in js/property.js once a listing has a real coordinate. Do not invent one for this sample.</p>
      </div>
      <div class="enquiry" id="enquire">
        <h2>Book a viewing</h2>
        <p>About <strong>${escapeHtml(property.title)}</strong>, ${escapeHtml(placeName(property))}.</p>
        ${statusNote ? `<p class="notice">${escapeHtml(statusNote)}</p>` : ""}
        <div class="form-shell">
          <form id="enquiry-form" novalidate>
            <div class="error-summary" tabindex="-1" hidden>
              <p>Check the following:</p>
              <ul></ul>
            </div>
            <div class="field">
              <label for="enquiry-name">Full name</label>
              <input id="enquiry-name" name="name" type="text" autocomplete="name" required data-label="name">
              <p id="enquiry-name-error" class="field-error" hidden></p>
            </div>
            <div class="field">
              <label for="enquiry-email">Email</label>
              <input id="enquiry-email" name="email" type="email" autocomplete="email" inputmode="email" required data-label="email">
              <p id="enquiry-email-error" class="field-error" hidden></p>
            </div>
            <div class="field">
              <label for="enquiry-phone">Phone <span class="optional">(optional)</span></label>
              <input id="enquiry-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" data-label="phone">
              <p id="enquiry-phone-error" class="field-error" hidden></p>
            </div>
            <div class="field">
              <label for="enquiry-date">Preferred date <span class="optional">(optional)</span></label>
              <input id="enquiry-date" name="date" type="date" data-label="date">
              <p id="enquiry-date-error" class="field-error" hidden></p>
            </div>
            <div class="field">
              <label for="enquiry-message">Message</label>
              <textarea id="enquiry-message" name="message" rows="5" required minlength="10" data-label="message">I would like to arrange a viewing of this sample listing.</textarea>
              <p id="enquiry-message-error" class="field-error" hidden></p>
            </div>
            <div class="hp" aria-hidden="true">
              <label for="enquiry-company">Company website</label>
              <input id="enquiry-company" name="company_website" type="text" tabindex="-1" autocomplete="off">
            </div>
            <input type="hidden" name="property_id" value="${escapeHtml(property.id)}">
            <button type="submit" class="button button-primary">Send viewing request</button>
            <p class="form-note">This form does not email the agency. A real form service should be connected in js/forms.js. Read the <a href="privacy.html">privacy note</a>.</p>
          </form>
          <div class="form-success" tabindex="-1" hidden>
            <p class="success-kicker">Request not sent</p>
            <p class="success-copy"></p>
            <button type="button" class="button button-secondary reset-form">Edit the request</button>
          </div>
        </div>
      </div>
    </div>
    <section class="similar" aria-labelledby="similar-title">
      <h2 id="similar-title">Other sample homes</h2>
      <div class="results-grid">${similarTo(listings, property).map((item) => listingCard(item)).join("")}</div>
    </section>`;

  document.title = `${property.title} · Linden & Quay`;
  const description = document.querySelector('meta[name="description"]');
  if (description) description.setAttribute("content", property.summary);
  mountSliders(root);
  bindForm(document.querySelector("#enquiry-form"), {
    successText(form) {
      const name = form.elements.name.value.trim();
      return `Thanks, ${name}. This demonstration did not send your viewing request for ${property.title}. Nothing was stored.`;
    }
  });
}

function showMissing() {
  document.querySelector(".enquire-bar")?.setAttribute("hidden", "");
  root.removeAttribute("aria-busy");
  root.innerHTML = `<div class="empty-state">
    <h1>That sample listing is not in the catalogue</h1>
    <p>The link may be out of date. Browse the sample homes instead.</p>
    <p><a class="button button-primary" href="listings.html">Back to sample homes</a></p>
  </div>`;
  document.title = "Listing not found · Linden & Quay";
}

const id = new URLSearchParams(location.search).get("id");

loadListings()
  .then((listings) => {
    const property = listings.find((item) => item.id === id);
    if (!property) {
      showMissing();
      return;
    }
    render(property, listings);
  })
  .catch(() => {
    document.querySelector(".enquire-bar")?.setAttribute("hidden", "");
    root.removeAttribute("aria-busy");
    root.innerHTML = `<div class="empty-state">
      <h1>The sample listing could not be loaded</h1>
      <p>Check that data/properties.json is available, then reload this page.</p>
      <button type="button" class="button button-secondary" id="reload-property">Reload</button>
    </div>`;
    document.querySelector("#reload-property").addEventListener("click", () => location.reload());
  });
