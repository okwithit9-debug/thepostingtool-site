(function () {
  var btn = document.querySelector(".nav-toggle");
  var links = document.querySelector(".nav-links");
  if (!btn || !links) return;

  function setOpen(open) {
    links.classList.toggle("open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("nav-open", open);
  }
  function close() { setOpen(false); }

  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    setOpen(!links.classList.contains("open"));
  });
  links.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", close);
  });
  document.addEventListener("click", function (e) {
    if (!links.classList.contains("open")) return;
    if (links.contains(e.target) || btn.contains(e.target)) return;
    close();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") close();
  });
})();
