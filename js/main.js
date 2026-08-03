const menuButton = document.querySelector(".header__menu-button");
const navigation = document.querySelector(".header__navigation");
const navigationLinks = document.querySelectorAll(".header__link");

if (menuButton && navigation) {
  const openMenu = () => {
    menuButton.classList.add("is-open");
    navigation.classList.add("is-open");

    menuButton.setAttribute("aria-expanded", "true");
    menuButton.setAttribute(
      "aria-label",
      "Cerrar menú de navegación"
    );

    document.body.classList.add("menu-open");
  };

  const closeMenu = () => {
    menuButton.classList.remove("is-open");
    navigation.classList.remove("is-open");

    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute(
      "aria-label",
      "Abrir menú de navegación"
    );

    document.body.classList.remove("menu-open");
  };

  const toggleMenu = () => {
    const isOpen =
      menuButton.getAttribute("aria-expanded") === "true";

    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  menuButton.addEventListener("click", toggleMenu);

  navigationLinks.forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      menuButton.focus();
    }
  });

  document.addEventListener("click", (event) => {
    const clickedInsideMenu = navigation.contains(event.target);
    const clickedButton = menuButton.contains(event.target);

    if (!clickedInsideMenu && !clickedButton) {
      closeMenu();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
      closeMenu();
    }
  });
}