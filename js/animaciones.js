/**
 * Animación de entrada para las pantallas del Inicio.
 * Cada sección con la clase "snap-section" aparece con una animación breve
 * cada vez que entra en pantalla.
 */
(function () {
  var raiz = document.documentElement;
  if (!raiz.classList.contains('page-home') || !('IntersectionObserver' in window)) {
    return;
  }

  /* Se añade de inmediato para evitar un parpadeo al cargar */
  raiz.classList.add('anim-ready');

  document.addEventListener('DOMContentLoaded', function () {
    var observador = new IntersectionObserver(
      function (entradas) {
        entradas.forEach(function (entrada) {
          if (entrada.isIntersecting) {
            entrada.target.classList.add('is-visible');
          } else {
            /* Al salir de pantalla se reinicia para repetir la animación al volver */
            entrada.target.classList.remove('is-visible');
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('.snap-section').forEach(function (seccion) {
      observador.observe(seccion);
    });
  });
})();