/**
 * Forms validate in the browser, then call the submit function when one is set.
 * That function posts to the shop server. Secrets stay on the server.
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
  if (field.type === "checkbox") {
    if (field.required && !field.checked) return "Tick the box to confirm you understand.";
    return "";
  }
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

function showFormError(form, message) {
  const summary = form.querySelector(".error-summary");
  const list = summary.querySelector("ul");
  list.replaceChildren();
  const item = document.createElement("li");
  item.textContent = message;
  list.append(item);
  summary.hidden = false;
  summary.focus();
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

export function bindForm(form, { successText, submit }) {
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

  form.addEventListener("submit", async (event) => {
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
    const button = form.querySelector('[type="submit"]');
    if (button) button.disabled = true;
    try {
      const text = submit ? await submit(form) : successText(form);
      showSuccess(form, text);
    } catch (error) {
      showFormError(form, error.message || "The shop could not save that.");
    } finally {
      if (button) button.disabled = false;
    }
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
