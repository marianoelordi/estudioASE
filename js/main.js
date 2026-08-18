const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;
const Flip = window.Flip;
// Las animaciones del sitio permanecen activas independientemente de la
// preferencia de movimiento configurada en el sistema operativo.
const motionEnabled = Boolean(gsap);

const MOTION = Object.freeze({
  duration: Object.freeze({ fast: 0.28, normal: 0.42, slow: 0.65, hero: 0.75 }),
  distance: Object.freeze({ small: 8, normal: 20, section: 28 }),
  ease: Object.freeze({ out: "sine.out", strong: "sine.inOut", inOut: "sine.inOut" }),
  stagger: Object.freeze({ text: 0.055, cards: 0.075 }),
});

if (gsap) {
  document.documentElement.classList.add("has-gsap");
  if (motionEnabled) document.documentElement.classList.add("motion-enabled");
  if (ScrollTrigger && Flip) gsap.registerPlugin(ScrollTrigger, Flip);
  else if (ScrollTrigger) gsap.registerPlugin(ScrollTrigger);
}

const all = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

// Desplazamiento entre anclas con una duracion perceptiblemente suave y estable.
if (motionEnabled) {
  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href*="#"]');
    if (!link || link.target === "_blank") return;
    const url = new URL(link.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;

    event.preventDefault();
    const headerOffset = document.querySelector(".header")?.offsetHeight || 0;
    const targetY = Math.max(0, scrollY + target.getBoundingClientRect().top - headerOffset);
    const state = { y: scrollY };
    gsap.to(state, {
      y: targetY,
      duration: Math.min(0.95, Math.max(0.5, Math.abs(targetY - scrollY) / 1800)),
      ease: MOTION.ease.inOut,
      overwrite: true,
      onUpdate: () => window.scrollTo(0, state.y),
      onComplete: () => history.pushState(null, "", url.hash),
    });
  });
}

const setActiveNavigationLink = (label) => {
  all(".header__link").forEach((link) => {
    link.classList.toggle("is-active", link.textContent.trim().toLowerCase() === label);
  });
};

// Header y navegación
const header = document.querySelector(".header");
const menuButton = document.querySelector(".header__menu-button");
const navigation = document.querySelector(".header__navigation");
const navigationLinks = all(".header__link");

if (header) {
  const updateHeaderState = () => header.classList.toggle("is-scrolled", window.scrollY > 36);
  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });
}

const currentPage = window.location.pathname.split("/").pop() || "index.html";

if (currentPage === "servicios.html") {
  setActiveNavigationLink("servicios");
} else if (currentPage === "nosotros.html") {
  setActiveNavigationLink("nosotros");
} else if (currentPage === "contacto.html") {
  setActiveNavigationLink("contacto");
} else {
  setActiveNavigationLink("inicio");
}

if (menuButton && navigation) {
  const setMenuA11y = (open) => {
    menuButton.classList.toggle("is-open", open);
    navigation.classList.toggle("is-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuButton.setAttribute("aria-label", open ? "Cerrar menú de navegación" : "Abrir menú de navegación");
    document.body.classList.toggle("menu-open", open);
  };

  const openMenu = () => {
    if (menuButton.getAttribute("aria-expanded") === "true") return;
    setMenuA11y(true);
    if (motionEnabled && innerWidth <= 768) {
      gsap.killTweensOf(navigation);
      gsap.fromTo(navigation,
        { height: 0, autoAlpha: 0, y: -MOTION.distance.small },
        { height: "auto", autoAlpha: 1, y: 0, duration: MOTION.duration.normal, ease: MOTION.ease.out }
      );
    }
  };

  const closeMenu = () => {
    if (menuButton.getAttribute("aria-expanded") !== "true") return;
    if (motionEnabled && innerWidth <= 768) {
      gsap.killTweensOf(navigation);
      gsap.to(navigation, {
        height: 0,
        autoAlpha: 0,
        y: -MOTION.distance.small,
        duration: MOTION.duration.fast,
        ease: MOTION.ease.inOut,
        onComplete: () => setMenuA11y(false),
      });
    } else {
      setMenuA11y(false);
    }
  };

  menuButton.addEventListener("click", () => {
    if (menuButton.getAttribute("aria-expanded") === "true") closeMenu();
    else openMenu();
  });
  navigationLinks.forEach((link) => link.addEventListener("click", closeMenu));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
      closeMenu();
      menuButton.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (!navigation.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
  });
  window.addEventListener("resize", () => {
    if (innerWidth > 768) {
      setMenuA11y(false);
      if (gsap) gsap.set(navigation, { clearProps: "height,opacity,visibility,transform" });
    }
  });
}

// Utilidades compartidas por acordeones
const centerExpandedCard = (element) => {
  const rect = element.getBoundingClientRect();
  const headerOffset = header?.offsetHeight || 0;
  const availableHeight = innerHeight - headerOffset;
  const targetY = rect.height > availableHeight - 40
    ? scrollY + rect.top - headerOffset - 20
    : scrollY + rect.top - headerOffset - (availableHeight - rect.height) / 2;
  if (motionEnabled) {
    const state = { y: scrollY };
    gsap.to(state, {
      y: targetY,
      duration: 0.62,
      ease: MOTION.ease.inOut,
      onUpdate: () => window.scrollTo(0, state.y),
    });
  } else window.scrollTo(0, targetY);
};

const runLayoutFlip = (cards, mutate) => new Promise((resolve) => {
  // El cambio de grilla es inmediato: evita que varias cards recorran la
  // pantalla al mismo tiempo cuando una de ellas se expande.
  if (gsap) gsap.killTweensOf(cards);
  mutate();
  resolve();
});

const createAccordion = ({ toggleSelector, cardSelector, expandedClass, label }) => {
  const toggles = all(toggleSelector);
  const cards = all(cardSelector);
  if (!toggles.length) return { open: () => Promise.resolve() };

  const getParts = (toggle) => ({
    toggle,
    card: toggle.closest(cardSelector),
    details: document.getElementById(toggle.getAttribute("aria-controls")),
  });

  const setLabel = (toggle, open) => {
    const text = toggle.querySelector("span:first-child");
    if (text && label) text.textContent = open ? label.close : label.open;
  };

  const close = (toggle, preserveCompactState = false) => new Promise((resolve) => {
    const { card, details } = getParts(toggle);
    if (!card || !details || toggle.getAttribute("aria-expanded") !== "true") return resolve();
    toggle.setAttribute("aria-expanded", "false");
    setLabel(toggle, false);

    const finish = () => {
      details.hidden = true;
      details.classList.remove("is-open");
      if (gsap) gsap.set(details, { clearProps: "height,opacity,visibility,transform" });
      runLayoutFlip(cards, () => {
        card.classList.remove(expandedClass);
        if (!preserveCompactState) card.parentElement?.classList.remove("has-expanded-card");
      }).then(() => {
        ScrollTrigger?.refresh();
        resolve();
      });
    };

    if (!motionEnabled) return finish();
    gsap.killTweensOf(details);
    gsap.to(details, {
      height: 0, autoAlpha: 0, y: -MOTION.distance.small,
      duration: 0.14, ease: MOTION.ease.out, onComplete: finish,
    });
  });

  const open = async (toggle, shouldScroll = true) => {
    const { card, details } = getParts(toggle);
    if (!card || !details || toggle.getAttribute("aria-expanded") === "true") return;
    await Promise.all(
      toggles
        .filter((other) => other !== toggle)
        .map((other) => close(other, true))
    );
    details.hidden = false;
    details.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    setLabel(toggle, true);
    await runLayoutFlip(cards, () => {
      card.parentElement?.classList.add("has-expanded-card");
      card.classList.add(expandedClass);
    });

    if (!motionEnabled) {
      details.style.height = "auto";
      details.style.opacity = "1";
      ScrollTrigger?.refresh();
      if (shouldScroll) centerExpandedCard(card);
      return;
    }

    gsap.killTweensOf(details);
    gsap.set(details, { height: 0, autoAlpha: 0, y: -MOTION.distance.small });
    gsap.to(details, {
      height: "auto", autoAlpha: 1, y: 0,
      duration: 0.18, ease: MOTION.ease.out,
      onComplete: () => {
        gsap.set(details, { height: "auto", clearProps: "transform" });
        ScrollTrigger?.refresh();
        if (shouldScroll) centerExpandedCard(card);
      },
    });
  };

  toggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      if (toggle.getAttribute("aria-expanded") === "true") close(toggle);
      else open(toggle);
    });
  });
  return { open, close, toggles };
};

const professionalAccordion = createAccordion({
  toggleSelector: ".about-page .professional-card__toggle",
  cardSelector: ".professional-card",
  expandedClass: "is-expanded",
});

// En contextos resumidos, una card profesional navega al perfil completo.
all(".professional-card__toggle").forEach((toggle) => {
  if (document.body.classList.contains("about-page")) return;
  toggle.addEventListener("click", () => {
    const profile = toggle.getAttribute("aria-controls").replace("perfil-", "");
    location.href = `./nosotros.html?perfil=${profile}#equipo`;
  });
});

const serviceAccordion = createAccordion({
  toggleSelector: ".service-card__toggle",
  cardSelector: ".service-card",
  expandedClass: "is-expanded",
  label: { open: "Ver detalles", close: "Ocultar detalles" },
});

all(".services-page .service-card").forEach((card) => {
  const toggle = card.querySelector(".service-card__toggle");
  card.addEventListener("click", (event) => {
    if (!toggle || event.target.closest("a, button, .service-card__details")) return;
    toggle.click();
  });
});

const requestedProfile = new URLSearchParams(location.search).get("perfil");
if (requestedProfile && document.body.classList.contains("about-page")) {
  const toggle = document.querySelector(`[aria-controls="about-${CSS.escape(requestedProfile)}"]`);
  if (toggle) requestAnimationFrame(() => professionalAccordion.open(toggle, false));
}

if (document.body.classList.contains("services-page") && location.hash) {
  const card = document.getElementById(location.hash.slice(1));
  const toggle = card?.querySelector(".service-card__toggle");
  if (toggle) requestAnimationFrame(() => serviceAccordion.open(toggle, false));
}

const requestedService = new URLSearchParams(location.search).get("servicio");
const contactService = document.getElementById("contact-service");
if (requestedService && contactService && all("option", contactService).some(({ value }) => value === requestedService)) {
  contactService.value = requestedService;
}

// Diálogo compartido para el progreso y el resultado del envío.
const contactDialog = document.createElement("div");
contactDialog.className = "contact-dialog";
contactDialog.hidden = true;
contactDialog.innerHTML = `
  <div class="contact-dialog__backdrop"></div>
  <div class="contact-dialog__panel" role="dialog" aria-modal="true" aria-labelledby="contact-dialog-title" aria-describedby="contact-dialog-message">
    <div class="contact-dialog__indicator" aria-hidden="true">
      <span class="contact-dialog__spinner"></span>
      <svg class="contact-dialog__check" viewBox="0 0 24 24" focusable="false"><path d="m5 12 4 4L19 6"/></svg>
      <svg class="contact-dialog__error" viewBox="0 0 24 24" focusable="false"><path d="M7 7l10 10M17 7 7 17"/></svg>
    </div>
    <h2 id="contact-dialog-title"></h2>
    <p id="contact-dialog-message"></p>
    <button class="contact-dialog__close" type="button">Cerrar</button>
  </div>
`;
document.body.append(contactDialog);

const dialogTitle = contactDialog.querySelector("#contact-dialog-title");
const dialogMessage = contactDialog.querySelector("#contact-dialog-message");
const dialogClose = contactDialog.querySelector(".contact-dialog__close");

const showContactDialog = (state, title, message) => {
  contactDialog.className = `contact-dialog is-${state}`;
  contactDialog.hidden = false;
  dialogTitle.textContent = title;
  dialogMessage.textContent = message;
  dialogClose.hidden = state === "loading";
  document.body.classList.add("contact-dialog-open");
  if (state !== "loading") dialogClose.focus();
};

const closeContactDialog = () => {
  contactDialog.hidden = true;
  document.body.classList.remove("contact-dialog-open");
};

dialogClose.addEventListener("click", closeContactDialog);
contactDialog.querySelector(".contact-dialog__backdrop").addEventListener("click", () => {
  if (!contactDialog.classList.contains("is-loading")) closeContactDialog();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !contactDialog.hidden && !contactDialog.classList.contains("is-loading")) {
    closeContactDialog();
  }
});

const EMAILJS_CONFIG = Object.freeze({
  serviceId: "service_zah6jvu",
  templateId: "template_jaahq0d",
  publicKey: "Rua6aBh4ExLYNsfn2",
});

// Envío en segundo plano mediante una plantilla personalizable de EmailJS.
all(".contact-form").forEach((form) => {
  const submitButton = form.querySelector('.contact-form__submit[type="submit"]');
  const status = form.querySelector(".contact-form__status");
  if (!submitButton || !status) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (form.elements.namedItem("_honey")?.value) return;

    const originalLabel = submitButton.textContent.trim();
    submitButton.disabled = true;
    submitButton.textContent = "Enviando…";
    status.textContent = "";
    status.className = "contact-form__status";
    showContactDialog("loading", "Enviando consulta", "Estamos enviando tus datos de forma segura.");

    try {
      const fieldValue = (name) => form.elements.namedItem(name)?.value.trim() || "";
      const serviceSelect = form.elements.namedItem("servicio");
      const serviceName = serviceSelect.options[serviceSelect.selectedIndex].text;
      const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: EMAILJS_CONFIG.serviceId,
          template_id: EMAILJS_CONFIG.templateId,
          user_id: EMAILJS_CONFIG.publicKey,
          template_params: {
            servicio: serviceName,
            asunto: fieldValue("asunto"),
            descripcion: fieldValue("mensaje"),
            nombre: fieldValue("nombre"),
            telefono: fieldValue("telefono"),
            email: fieldValue("email"),
            reply_to: fieldValue("email"),
            to_email: "estudiojuridicoazconasanchez@gmail.com",
          },
        }),
      });

      if (!response.ok) {
        throw new Error("No se pudo enviar la consulta");
      }

      form.reset();
      status.textContent = "Consulta enviada. Gracias por comunicarte.";
      status.classList.add("is-success");
      showContactDialog("success", "¡Consulta enviada!", "Recibimos tu mensaje correctamente. Nos comunicaremos con vos a la brevedad.");
    } catch (error) {
      status.textContent = "No pudimos enviar la consulta. Intentá nuevamente en unos minutos.";
      status.classList.add("is-error");
      showContactDialog("error", "No pudimos enviarla", "Revisá tu conexión e intentá nuevamente en unos minutos.");
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = originalLabel;
    }
  });
});

// Reveals individuales: cada bloque espera a entrar realmente al viewport.
const revealEach = (selector, from, to) => {
  if (!motionEnabled || !ScrollTrigger) return;
  all(selector).filter((item) => !item.closest("[hidden]")).forEach((item) => {
    gsap.set(item, from);
    gsap.to(item, {
      ...to,
      scrollTrigger: { trigger: item, start: "top 88%", once: true },
      clearProps: "transform,opacity,visibility,filter",
    });
  });
};

const revealCardBatches = (selector) => {
  if (!motionEnabled || !ScrollTrigger) return;
  const cards = all(selector).filter((item) => !item.closest("[hidden]"));
  if (!cards.length) return;
  gsap.set(cards, { autoAlpha: 0 });
  ScrollTrigger.batch(cards, {
    start: "top 88%",
    once: true,
    interval: 0.08,
    batchMax: 6,
    onEnter: (batch) => gsap.to(batch, {
      autoAlpha: 1,
      duration: 0.2,
      stagger: 0.02,
      ease: MOTION.ease.strong,
      overwrite: "auto",
      clearProps: "transform,opacity,visibility",
    }),
  });
};

if (motionEnabled && ScrollTrigger) {
  const heroItems = all(".hero__eyebrow, .hero__title, .hero__description, .hero__actions");
  if (heroItems.length) gsap.from(heroItems, {
    autoAlpha: 0, y: 24, duration: MOTION.duration.hero,
    stagger: MOTION.stagger.text, ease: MOTION.ease.strong,
    clearProps: "transform,opacity,visibility",
  });

  revealEach(
    ".about__title, .faq__title, .team__title, .section-heading__title, .services-faq h2, .testimonials__title, .contact__title, .about-showcase__heading h2, .about-history h2, .about-page__hero h1",
    { autoAlpha: 0, y: 40, filter: "blur(2px)" },
    { autoAlpha: 1, y: 0, filter: "blur(0px)", duration: 0.7, ease: MOTION.ease.strong }
  );
  revealEach(
    ".about__story-content > *, .section-heading__eyebrow, .section-heading__description, .team__description, .faq__button, .team-cta__content, .testimonials__eyebrow, .testimonials__description, .contact__content > :not(.contact__title), .about-showcase__heading > p, .about-showcase__heading > span, .about-history__content p",
    { autoAlpha: 0, y: 24 },
    { autoAlpha: 1, y: 0, duration: 0.58, ease: MOTION.ease.out }
  );
  revealEach(
    ".about__story-visual, .team-cta__visual, .about-showcase__approach, .about-history__content img",
    { autoAlpha: 0, y: 25, scale: 1.04 },
    { autoAlpha: 1, y: 0, scale: 1, duration: 0.78, ease: MOTION.ease.strong }
  );
  revealEach(
    ".testimonials__carousel, .contact-form, .services-faq__list, .about-showcase__stats",
    { autoAlpha: 0, y: 28 },
    { autoAlpha: 1, y: 0, duration: 0.65, ease: MOTION.ease.strong }
  );
  revealCardBatches(".principle-card, .service-card, .professional-card, .about-showcase__steps > li, .about-showcase__stats > div");
}

// Profundidad sutil en fondos con gradientes oscuros
if (motionEnabled && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
  const gradientAreas = [
    { host: ".hero", layer: ".hero__overlay" },
    { host: ".services", layer: ".services" },
    { host: ".faq", layer: ".faq" },
    { host: ".contact", layer: ".contact" },
    { host: ".about-page__hero", layer: ".about-page__hero" },
  ];

  gradientAreas.forEach(({ host: hostSelector, layer: layerSelector }) => {
    const host = document.querySelector(hostSelector);
    const layer = document.querySelector(layerSelector);
    if (!host || !layer || host.hidden) return;
    layer.classList.add("motion-gradient");

    host.addEventListener("pointermove", (event) => {
      const rect = host.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 8;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 8;
      gsap.to(layer, {
        "--gradient-x": `${50 + x}%`,
        "--gradient-y": `${50 + y}%`,
        duration: 0.55,
        ease: MOTION.ease.out,
        overwrite: "auto",
      });
    });

    host.addEventListener("pointerleave", () => {
      gsap.to(layer, {
        "--gradient-x": "50%",
        "--gradient-y": "50%",
        duration: 0.72,
        ease: MOTION.ease.inOut,
        overwrite: "auto",
      });
    });
  });
}

// Carrusel de testimonios
const testimonialsViewport = document.querySelector(".testimonials__viewport");
const testimonialsTrack = document.querySelector(".testimonials__track");
const testimonialSlides = all(".testimonial");
const testimonialDots = all(".testimonials__dot");
const testimonialPrevious = document.querySelector(".testimonials__arrow--previous");
const testimonialNext = document.querySelector(".testimonials__arrow--next");

if (testimonialsViewport && testimonialsTrack && testimonialSlides.length && testimonialPrevious && testimonialNext) {
  let current = 0;
  let touchStartX = 0;

  const show = (index) => {
    current = (index + testimonialSlides.length) % testimonialSlides.length;
    const xPercent = -current * 100;
    if (motionEnabled) gsap.to(testimonialsTrack, { xPercent, duration: MOTION.duration.slow, ease: MOTION.ease.inOut, overwrite: true });
    else testimonialsTrack.style.transform = `translateX(${xPercent}%)`;

    testimonialSlides.forEach((slide, slideIndex) => {
      const active = slideIndex === current;
      slide.classList.toggle("is-active", active);
      slide.setAttribute("aria-hidden", String(!active));
    });
    testimonialDots.forEach((dot, dotIndex) => {
      const active = dotIndex === current;
      dot.classList.toggle("is-active", active);
      if (active) dot.setAttribute("aria-current", "true");
      else dot.removeAttribute("aria-current");
    });
  };

  testimonialPrevious.addEventListener("click", () => show(current - 1));
  testimonialNext.addEventListener("click", () => show(current + 1));
  testimonialDots.forEach((dot) => dot.addEventListener("click", () => show(Number(dot.dataset.testimonialIndex))));
  testimonialsViewport.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") show(current - 1);
    if (event.key === "ArrowRight") show(current + 1);
  });
  testimonialsViewport.addEventListener("touchstart", (event) => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
  testimonialsViewport.addEventListener("touchend", (event) => {
    const distance = event.changedTouches[0].clientX - touchStartX;
    if (Math.abs(distance) >= 45) show(distance > 0 ? current - 1 : current + 1);
  }, { passive: true });
  show(0);
}
