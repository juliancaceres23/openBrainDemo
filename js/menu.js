/**
 * Menú de navegación accesible para dispositivos móviles (RF-01)
 * Cumple WCAG 2.1 AA: soporte táctil, control ARIA y cierre por teclado (Escape)
 */

document.addEventListener('DOMContentLoaded', () => {
  initMobileNavigation();
});

/**
 * Inicializa el comportamiento interactivo del menú móvil
 */
function initMobileNavigation() {
  const navContainer = document.querySelector('.header__nav');
  const toggleBtn = document.querySelector('.nav__toggle');
  const navMenu = document.querySelector('.nav__menu');

  if (!navContainer || !toggleBtn || !navMenu) {
    return;
  }

  // Alternar apertura y cierre del menú
  toggleBtn.addEventListener('click', () => {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleMenu(!isExpanded, navContainer, toggleBtn);
  });

  // Cerrar menú al presionar la tecla Escape
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navContainer.classList.contains('nav--open')) {
      toggleMenu(false, navContainer, toggleBtn);
      toggleBtn.focus();
    }
  });

  // Cerrar menú al hacer clic fuera del contenedor de navegación
  document.addEventListener('click', (event) => {
    if (
      navContainer.classList.contains('nav--open') &&
      !navContainer.contains(event.target)
    ) {
      toggleMenu(false, navContainer, toggleBtn);
    }
  });

  // Cerrar menú al hacer clic en un enlace de navegación
  const navLinks = navMenu.querySelectorAll('.nav__link');
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (window.innerWidth < 768) {
        toggleMenu(false, navContainer, toggleBtn);
      }
    });
  });
}

/**
 * Aplica el estado visual y atributos ARIA de apertura/cierre
 * @param {boolean} open - Si el menú debe abrirse o cerrarse
 * @param {HTMLElement} container - Contenedor principal de navegación
 * @param {HTMLButtonElement} button - Botón de alternancia
 */
function toggleMenu(open, container, button) {
  if (open) {
    container.classList.add('nav--open');
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-label', 'Cerrar menú de navegación');
  } else {
    container.classList.remove('nav--open');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Abrir menú de navegación');
  }
}
