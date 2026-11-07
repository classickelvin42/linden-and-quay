const gbp = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  maximumFractionDigits: 0
});

const longDate = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric"
});

export const SALE_PRICES = [200000, 300000, 400000, 500000, 650000, 800000, 1000000, 1250000, 1500000];
export const LET_PRICES = [900, 1100, 1300, 1500, 1750, 2000, 2500];
export const PAGE_SIZE = 6;

const STATUS_LABELS = {
  "for-sale": "For sale",
  "under-offer": "Under offer",
  "to-let": "To let",
  "let-agreed": "Let agreed"
};

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

export function formatMoney(amount) {
  return gbp.format(amount);
}

export function formatPrice(property) {
  const amount = formatMoney(property.price);
  return property.market === "let" ? `${amount} pcm` : amount;
}

export function formatDate(iso) {
  return longDate.format(new Date(`${iso}T00:00:00`));
}

export function statusLabel(status) {
  return STATUS_LABELS[status] || "Sample";
}

export function typeLabel(type) {
  if (type === "maisonette") return "Maisonette";
  if (type === "flat") return "Flat";
  if (type === "house") return "House";
  return type;
}

export function cardSrc(src) {
  if (src.includes("/modern/")) return src.replace("images/modern/", "images/card/m");
  return src.replace("images/place/", "images/card/").replace("images/full/", "images/card/");
}

export function photoKind(src) {
  if (src.includes("/modern/")) return "Modern stand-in";
  return src.includes("/place/") ? "Area stand-in" : "Interior stand-in";
}

export function sliderMarkup(images, { label, interval = 5000, thumbs = false, compact = false, overlayHref = "" } = {}) {
  const slides = images.map((image, imageIndex) => {
    const small = cardSrc(image.src);
    const loading = imageIndex === 0 ? "fetchpriority=\"high\"" : "loading=\"lazy\"";
    return `<img src="${escapeHtml(small)}" srcset="${escapeHtml(small)} 960w, ${escapeHtml(image.src)} 1600w" sizes="(min-width: 1000px) 46vw, 100vw" alt="${escapeHtml(image.alt)}" data-caption="${escapeHtml(image.alt)}" width="1600" height="1067" ${loading} decoding="async">`;
  }).join("");
  const thumbRow = thumbs
    ? `<div class="thumbs">${images.map((image, imageIndex) => {
      const selected = imageIndex === 0;
      return `<button type="button" class="thumb${selected ? " is-selected" : ""}" data-slider-go="${imageIndex}" aria-label="Show photo ${imageIndex + 1} of ${images.length}"${selected ? " aria-current=\"true\"" : ""}>
        <img src="${escapeHtml(cardSrc(image.src))}" alt="" width="160" height="106">
      </button>`;
    }).join("")}</div>`
    : "";
  const meta = compact
    ? ""
    : `<p class="slider-count" data-slider-count>Photo 1 of ${images.length}</p>
       <p class="slider-caption" data-slider-caption></p>`;
  return `<div class="slider${compact ? " slider-compact" : ""}" data-slider data-interval="${interval}" aria-roledescription="carousel" aria-label="${escapeHtml(label)}">
    <div class="slider-viewport">
      <div class="slider-track">${slides}</div>
      ${overlayHref ? `<a class="card-photo-link" href="${escapeHtml(overlayHref)}" tabindex="-1" aria-hidden="true"></a>` : ""}
      <div class="slider-ui">
        <button type="button" class="slider-btn" data-slider-prev aria-label="Previous photo"><span aria-hidden="true">‹</span></button>
        <button type="button" class="slider-btn slider-pause" data-slider-pause aria-pressed="false">Pause</button>
        <button type="button" class="slider-btn" data-slider-next aria-label="Next photo"><span aria-hidden="true">›</span></button>
      </div>
    </div>
    <p class="visually-hidden" aria-live="polite" data-slider-live></p>
    ${meta}
    ${thumbRow}
  </div>`;
}

export function listingCard(property, headingLevel = "h3") {
  const href = `property.html?id=${encodeURIComponent(property.id)}`;
  const title = escapeHtml(property.title);
  return `<article class="card">
    <div class="card-media">
      ${sliderMarkup(property.images, { label: `${property.title} photos`, interval: 5200, compact: true, overlayHref: href })}
      <p class="sample-flag">Sample</p>
    </div>
    <a class="card-link" href="${href}">
      <div class="card-body">
        <p class="card-kicker">Modern stand-in</p>
        <p class="card-price">${escapeHtml(formatPrice(property))}</p>
        <${headingLevel} class="card-title">${title}</${headingLevel}>
        <p class="card-loc">${escapeHtml(property.area)}, ${property.area === "Long Ashton" ? "North Somerset" : "Bristol"}</p>
        <p class="card-facts"><span>${property.beds} bed</span><span>${property.baths} bath</span><span>${escapeHtml(typeLabel(property.propertyType))}</span></p>
        <p class="status status-${escapeHtml(property.status)}">${escapeHtml(statusLabel(property.status))}</p>
      </div>
    </a>
  </article>`;
}

export function fillPriceSelects(minSelect, maxSelect, market) {
  const steps = market === "let" ? LET_PRICES : market === "sale" ? SALE_PRICES : [];
  const previousMin = minSelect.value;
  const previousMax = maxSelect.value;
  const options = (placeholder) => {
    const head = `<option value="">${placeholder}</option>`;
    const rest = steps.map((amount) => `<option value="${amount}">${formatMoney(amount)}</option>`).join("");
    return head + rest;
  };
  minSelect.innerHTML = options("No minimum");
  maxSelect.innerHTML = options("No maximum");
  const enabled = steps.length > 0;
  minSelect.disabled = !enabled;
  maxSelect.disabled = !enabled;
  if ([...minSelect.options].some((option) => option.value === previousMin)) minSelect.value = previousMin;
  if ([...maxSelect.options].some((option) => option.value === previousMax)) maxSelect.value = previousMax;
}

export function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
