const root = document.querySelector("#credits");

fetch("data/image-credits.json")
  .then((response) => {
    if (!response.ok) throw new Error("Credits could not be loaded.");
    return response.json();
  })
  .then((credits) => {
    root.innerHTML = `<ul class="credit-list">${credits.map((item) => {
      const preview = item.file.replace("images/modern/", "images/card/m");
      return `<li>
        <img src="${escapeAttr(preview)}" alt="" width="280" height="180">
        <div>
          <p><strong>${escapeText(item.description)}</strong></p>
          <p>Stand-in photograph from Unsplash. It does not show a listed home. Licence: <a href="https://unsplash.com/license">Unsplash Licence</a>.</p>
          <p><a href="${escapeAttr(item.source)}">Image file</a>. Resized for this demo.</p>
        </div>
      </li>`;
    }).join("")}</ul>
    <p>These photographs are contemporary interiors and houses used only as sample pictures. They are not photographs of Bristol streets, and they are not the fictional listings.</p>`;
  })
  .catch(() => {
    root.innerHTML = "<p>Image credits could not be loaded. The source file is data/image-credits.json.</p>";
  });

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

function escapeAttr(value) {
  return escapeText(value);
}
