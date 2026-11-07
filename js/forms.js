/**
 * FORM INTEGRATION
 * submitDemo() does not send personal data anywhere. To deliver enquiries:
 * 1. Replace submitDemo() with a POST to your own endpoint or a form service.
 * 2. Keep validateForm() so errors still appear before the request.
 * 3. Surface server failures in showError() rather than the demo success panel.
 * 4. Update privacy.html to name the provider, what is stored, and how long.
 * Do not put secret keys in this file. Call a server route that holds them.
 */

function digits(value) {
  return value.replace(/\D/g, "");
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function messageFor(field) {
  const value = field.value.trim();
  const label = field.dataset.label || "This field";
  if (field.type === "email") {
    if (!value) return `Enter your email address.`;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter an email address like name@example.com.";
    return "";
  }
  if (field.type === "tel") {
    if (!value) return "";
    if (digits(value).length < 8) return "Enter a phone number with at least 8 digits, or leave it blank.";
    return "";
  }
  if (field.type === "date") {
    if (!value) return "";
    const chosen = new Date(`${value}T00:00:00`);
    if (Number.isNaN(chosen.getTime()) || chosen < startOfToday()) return "Choose today or a later date.";
    return "";
  }
  if (field.tagName === "SELECT") {
    if (field.required && !value) return `Choose ${label.charAt(0).toLowerCase()}${label.slice(1)}.`;
    return "";
  }
  if (field.required && value.length < 2 && field.type !== "textarea") {
    return `Enter your ${label.toLowerCase()}.`;
  }
  if (field.minLength && value.length < field.minLength) {
    return `Enter a message of at least ${field.minLength} characters.`;
  }
  if (field.required && !value) return `${label} is required.`;
  return "";
}

function fields(form) {
  return [...form.querySelectorAll("input, select, textarea")].filter((field) => {
    return field.name && field.type !== "hidden" && !field.closest(".hp");
  });
}

function showSuccess(form, text) {
  const panel = form.parentElement.querySelector(".form-success");
  const copy = panel.querySelector(".success-copy");
  copy.textContent = text;
  form.hidden = true;
  panel.hidden = false;
  panel.focus();
}

function clearErrors(form) {
  const summary = form.querySelector(".error-summary");
  summary.hidden = true;
  summary.querySelector("ul").innerHTML = "";
  fields(form).forEach((field) => {
    field.removeAttribute("aria-invalid");
    const error = document.getElementById(`${field.id}-error`);
    if (error) {
      error.hidden = true;
      error.textContent = "";
    }
  });
}

export function bindForm(form, { successText }) {
  const summary = form.querySelector(".error-summary");
  const dateField = form.querySelector('input[type="date"]');
  if (dateField) {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    dateField.min = `${today.getFullYear()}-${month}-${day}`;
  }

  form.addEventListener("input", (event) => {
    const field = event.target;
    if (!(field instanceof HTMLElement) || !field.id) return;
    const error = document.getElementById(`${field.id}-error`);
    if (!error || error.hidden) return;
    const problem = messageFor(field);
    if (!problem) {
      field.removeAttribute("aria-invalid");
      error.hidden = true;
      error.textContent = "";
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearErrors(form);
    const honeypot = form.querySelector(".hp input");
    if (honeypot && honeypot.value.trim()) {
      showSuccess(form, successText(form));
      return;
    }
    const problems = [];
    fields(form).forEach((field) => {
      const problem = messageFor(field);
      if (!problem) return;
      field.setAttribute("aria-invalid", "true");
      const error = document.getElementById(`${field.id}-error`);
      if (error) {
        error.hidden = false;
        error.textContent = problem;
      }
      problems.push({ id: field.id, problem });
    });
    if (problems.length) {
      summary.hidden = false;
      summary.querySelector("ul").innerHTML = problems.map((item) => {
        return `<li><a href="#${item.id}">${item.problem}</a></li>`;
      }).join("");
      summary.focus();
      return;
    }
    showSuccess(form, successText(form));
  });

  const reset = form.parentElement.querySelector(".reset-form");
  if (reset) {
    reset.addEventListener("click", () => {
      const panel = form.parentElement.querySelector(".form-success");
      panel.hidden = true;
      form.hidden = false;
      const first = fields(form)[0];
      if (first) first.focus();
    });
  }
}
