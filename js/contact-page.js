import { mountShell } from "./shell.js?v=5";
import { bindForm } from "./forms.js?v=5";

await mountShell(document.body.dataset.page || "");
const form = document.querySelector("[data-contact]");
if (form) {
  bindForm(form, {
    successText: () => "Saved. The message is stored on the shop server. It is not emailed.",
    submit: async (current) => {
      const data = Object.fromEntries(new FormData(current).entries());
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email.trim(),
          message: data.message.trim()
        })
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || "The message could not be saved.");
      return "Saved. The message is stored on the shop server. It is not emailed.";
    }
  });
}
