import { mountShell } from "./shell.js?v=4";
import { bindForm } from "./forms.js";

await mountShell(document.body.dataset.page || "");
const form = document.querySelector("[data-contact]");
if (form) {
  bindForm(form, {
    successText: () => "This message stayed on this page. It was not sent, because no contact service is connected."
  });
}
