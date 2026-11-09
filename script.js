"use strict";

const menuToggle = document.querySelector(".menu-toggle");
const primaryNavigation = document.querySelector("#primary-navigation");
const currentYear = document.querySelector("#current-year");

if (currentYear) {
  currentYear.textContent = String(new Date().getFullYear());
}

if (menuToggle instanceof HTMLButtonElement && primaryNavigation) {
  menuToggle.addEventListener("click", () => {
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", String(!isExpanded));
    primaryNavigation.classList.toggle("is-open", !isExpanded);
  });

  primaryNavigation.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) {
      menuToggle.setAttribute("aria-expanded", "false");
      primaryNavigation.classList.remove("is-open");
    }
  });
}