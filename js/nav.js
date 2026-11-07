import { focusable, trapTab } from "./a11y.js";

const header = document.querySelector(".site-header");
const toggle = document.querySelector(".nav-toggle");
const panel = document.querySelector("#site-nav");
const desktop = window.matchMedia("(min-width: 960px)");

if (header && toggle && panel) {
  const page = document.body.dataset.page;
  const current = panel.querySelector(`[data-nav="${page}"]`);
  if (current) current.setAttribute("aria-current", "page");

  let open = false;

  function setOpen(next) {
    open = next;
    const modal = !desktop.matches && open;
    toggle.setAttribute("aria-expanded", String(modal));
    toggle.textContent = modal ? "Close" : "Menu";
    panel.classList.toggle("is-open", modal);
    document.body.classList.toggle("scroll-lock", modal);
    if (modal) {
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "true");
      panel.setAttribute("aria-label", "Primary");
      const first = focusable(panel)[0];
      if (first) first.focus();
    } else {
      panel.removeAttribute("role");
      panel.removeAttribute("aria-modal");
      panel.removeAttribute("aria-label");
    }
  }

  toggle.addEventListener("click", () => {
    const willOpen = !(open && !desktop.matches);
    setOpen(!desktop.matches && willOpen ? true : false);
    if (!open) toggle.focus();
  });

  document.addEventListener("keydown", (event) => {
    if (!open || desktop.matches) return;
    if (event.key === "Escape") {
      setOpen(false);
      toggle.focus();
    } else {
      trapTab(event, () => [toggle, ...focusable(panel)]);
    }
  });

  panel.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });

  desktop.addEventListener("change", () => setOpen(false));
}
