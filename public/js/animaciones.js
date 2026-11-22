/**
 * Animación de entrada para todas las páginas del sitio.
 *
 * - Inicio: cada sección con la clase "snap-section" aparece al entrar en pantalla.
 * - Resto de páginas: los bloques de cada sección (títulos, tarjetas, listas,
 *   formulario, etc.) aparecen con el mismo efecto, de forma escalonada.
 *
 * Al salir de pantalla se reinicia para repetir la animación al volver.
 */
(function () {
  var raiz = document.documentElement;
  if (!('IntersectionObserver' in window)) {
    return;
  }

  var esInicio = raiz.classList.contains('page-home');

  /* Se añade de inmediato para evitar un parpadeo al cargar */
  raiz.classList.add('anim-ready');

  /* Contenedores cuyos hijos se animan uno a uno (aparición escalonada) */
  var CONTENEDORES_LISTA = [
    '.section-heading-center',
    '.team-grid',
    '.testimonials-grid',
    '.faq-list',
    '.steps-list',
    '.services-layout',
    '.services-layout__cards',
    '.contact-layout',
    '.faq-cta__actions'
  ].join(',');

  function marcarElementos() {
    var objetivos = [];

    document.querySelectorAll('main section > .container').forEach(function (contenedor) {
      Array.prototype.forEach.call(contenedor.children, function (hijo) {
        if (hijo.matches(CONTENEDORES_LISTA)) {
          expandir(hijo, objetivos);
        } else {
          objetivos.push(hijo);
        }
      });
    });

    objetivos.forEach(function (el, i) {
      el.classList.add('anim-item');
      /* Retraso escalonado entre hermanos (máximo 5 pasos para no demorar de más) */
      var indice = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty('--anim-i', Math.min(indice, 5));
    });

    return objetivos;
  }

  /* Expande un contenedor de lista en sus hijos, y repite si algún hijo es también contenedor */
  function expandir(contenedor, destino) {
    Array.prototype.forEach.call(contenedor.children, function (hijo) {
      if (hijo.matches(CONTENEDORES_LISTA)) {
        expandir(hijo, destino);
      } else {
        destino.push(hijo);
      }
    });
  }

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
      /* Umbral 0 + margen inferior: también funciona con bloques más altos que la pantalla */
      esInicio
        ? { threshold: 0.15 }
        : { threshold: 0, rootMargin: '0px 0px -8% 0px' }
    );

    var elementos = esInicio
      ? document.querySelectorAll('.snap-section')
      : marcarElementos();

    Array.prototype.forEach.call(elementos, function (el) {
      observador.observe(el);
    });
  });
})();
