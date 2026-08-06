"use strict";

(function () {
  var navToggle = document.querySelector(".nav-toggle");
  var globalNav = document.querySelector(".global-nav");

  if (!navToggle || !globalNav) {
    return;
  }

  navToggle.addEventListener("click", function () {
    var isOpen = globalNav.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
})();
