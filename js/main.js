const menuButton = document.querySelector(".header__menu-button");
const navigation = document.querySelector(".header__navigation");
const navigationLinks = document.querySelectorAll(".header__link");
const header = document.querySelector(".header");

if (header) {
  const updateHeaderState = () => {
    header.classList.toggle("is-scrolled", window.scrollY > 36);
  };

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });
}

const setActiveNavigationLink = (label) => {
  navigationLinks.forEach((link) => {
    link.classList.toggle(
      "is-active",
      link.textContent.trim().toLowerCase() === label
    );
  });
};

const currentPage = window.location.pathname.split("/").pop() || "index.html";

if (currentPage === "servicios.html") {
  setActiveNavigationLink("servicios");
} else if (currentPage === "nosotros.html") {
  const updateAboutNavigation = () => {
    const teamSection = document.getElementById("equipo");
    const teamIsVisible =
      teamSection &&
      teamSection.getBoundingClientRect().top <= window.innerHeight * 0.35;

    setActiveNavigationLink(teamIsVisible ? "equipo" : "nosotros");
  };

  updateAboutNavigation();
  window.addEventListener("scroll", updateAboutNavigation, { passive: true });
} else {
  const homeSections = [
    { element: document.getElementById("inicio"), label: "inicio" },
    { element: document.getElementById("nosotros"), label: "nosotros" },
    { element: document.getElementById("equipo"), label: "equipo" },
    { element: document.getElementById("contacto"), label: "contacto" },
  ].filter(({ element }) => element && !element.hidden);

  const updateHomeNavigation = () => {
    const activationLine = window.innerHeight * 0.35;
    let activeSection = homeSections[0];

    homeSections.forEach((section) => {
      if (section.element.getBoundingClientRect().top <= activationLine) {
        activeSection = section;
      }
    });

    if (activeSection) setActiveNavigationLink(activeSection.label);
  };

  updateHomeNavigation();
  window.addEventListener("scroll", updateHomeNavigation, { passive: true });
}

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

// Perfiles del equipo (acordeón)
const professionalToggles = document.querySelectorAll(
  ".professional-card__toggle"
);
const professionalCards = document.querySelectorAll(".professional-card");
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
);

const getProfessionalCardPositions = () =>
  new Map(
    Array.from(professionalCards, (card) => [
      card,
      card.getBoundingClientRect(),
    ])
  );

const animateProfessionalLayout = (previousPositions) => {
  if (prefersReducedMotion.matches) return;

  professionalCards.forEach((card) => {
    const previous = previousPositions.get(card);
    const current = card.getBoundingClientRect();

    if (!previous) return;

    const deltaX = previous.left - current.left;
    const deltaY = previous.top - current.top;
    const scaleX = previous.width / current.width;
    const scaleY = previous.height / current.height;

    if (
      Math.abs(deltaX) < 1 &&
      Math.abs(deltaY) < 1 &&
      Math.abs(scaleX - 1) < 0.01 &&
      Math.abs(scaleY - 1) < 0.01
    ) {
      return;
    }

    card.getAnimations().forEach((animation) => animation.cancel());
    card.animate(
      [
        {
          transform: `translate(${deltaX}px, ${deltaY}px) scale(${scaleX}, ${scaleY})`,
        },
        { transform: "translate(0, 0) scale(1, 1)" },
      ],
      {
        duration: 560,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      }
    );
  });
};

const closeProfessionalProfile = (profileToggle) => {
  const profileDetails = document.getElementById(
    profileToggle.getAttribute("aria-controls")
  );
  const profileCard = profileToggle.closest(".professional-card");

  if (!profileDetails || !profileCard) return;

  profileToggle.setAttribute("aria-expanded", "false");
  profileDetails.classList.remove("is-open");
  profileCard.classList.remove("is-expanded");
  profileDetails.hidden = true;
};

professionalToggles.forEach((toggle) => {
  const details = document.getElementById(
    toggle.getAttribute("aria-controls")
  );

  const card = toggle.closest(".professional-card");

  if (!details || !card) return;

  toggle.addEventListener("click", () => {
    if (!document.body.classList.contains("about-page")) {
      const profile = toggle
        .getAttribute("aria-controls")
        .replace("perfil-", "");

      window.location.href = `./nosotros.html?perfil=${profile}#equipo`;
      return;
    }

    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    const previousPositions = getProfessionalCardPositions();

    if (isOpen) {
      closeProfessionalProfile(toggle);
      animateProfessionalLayout(previousPositions);
    } else {
      professionalToggles.forEach((otherToggle) => {
        if (
          otherToggle !== toggle &&
          otherToggle.getAttribute("aria-expanded") === "true"
        ) {
          closeProfessionalProfile(otherToggle);
        }
      });

      details.hidden = false;
      card.classList.add("is-expanded");
      // Forzar reflow para que la transición se aplique
      details.offsetHeight;
      toggle.setAttribute("aria-expanded", "true");
      details.classList.add("is-open");
      animateProfessionalLayout(previousPositions);

      window.setTimeout(() => {
        if (toggle.getAttribute("aria-expanded") === "true") {
          card.scrollIntoView({
            behavior: prefersReducedMotion.matches ? "auto" : "smooth",
            block: "center",
          });
        }
      }, 580);
    }
  });
});

if (document.body.classList.contains("about-page")) {
  const requestedProfile = new URLSearchParams(window.location.search).get(
    "perfil"
  );
  const requestedToggle = requestedProfile
    ? document.querySelector(
        `.professional-card__toggle[aria-controls="about-${requestedProfile}"]`
      )
    : null;

  if (requestedToggle) {
    window.setTimeout(() => requestedToggle.click(), 100);
  }
}

// Carrusel de testimonios
const testimonialsViewport = document.querySelector(
  ".testimonials__viewport"
);
const testimonialsTrack = document.querySelector(".testimonials__track");
const testimonialSlides = document.querySelectorAll(".testimonial");
const testimonialDots = document.querySelectorAll(".testimonials__dot");
const testimonialPrevious = document.querySelector(
  ".testimonials__arrow--previous"
);
const testimonialNext = document.querySelector(".testimonials__arrow--next");

if (
  testimonialsViewport &&
  testimonialsTrack &&
  testimonialSlides.length &&
  testimonialPrevious &&
  testimonialNext
) {
  let currentTestimonial = 0;
  let touchStartX = 0;

  const showTestimonial = (index) => {
    currentTestimonial =
      (index + testimonialSlides.length) % testimonialSlides.length;
    testimonialsTrack.style.transform = `translateX(-${
      currentTestimonial * 100
    }%)`;

    testimonialSlides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === currentTestimonial;
      slide.classList.toggle("is-active", isActive);
      slide.setAttribute("aria-hidden", String(!isActive));
    });

    testimonialDots.forEach((dot, dotIndex) => {
      const isActive = dotIndex === currentTestimonial;
      dot.classList.toggle("is-active", isActive);

      if (isActive) {
        dot.setAttribute("aria-current", "true");
      } else {
        dot.removeAttribute("aria-current");
      }
    });
  };

  testimonialPrevious.addEventListener("click", () => {
    showTestimonial(currentTestimonial - 1);
  });

  testimonialNext.addEventListener("click", () => {
    showTestimonial(currentTestimonial + 1);
  });

  testimonialDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      showTestimonial(Number(dot.dataset.testimonialIndex));
    });
  });

  testimonialsViewport.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      showTestimonial(currentTestimonial - 1);
    }

    if (event.key === "ArrowRight") {
      showTestimonial(currentTestimonial + 1);
    }
  });

  testimonialsViewport.addEventListener(
    "touchstart",
    (event) => {
      touchStartX = event.changedTouches[0].clientX;
    },
    { passive: true }
  );

  testimonialsViewport.addEventListener(
    "touchend",
    (event) => {
      const distance = event.changedTouches[0].clientX - touchStartX;

      if (Math.abs(distance) < 45) return;
      showTestimonial(
        distance > 0 ? currentTestimonial - 1 : currentTestimonial + 1
      );
    },
    { passive: true }
  );

  showTestimonial(0);
}
