# Reglas del proyecto: Plataforma web de Open Brain

> Cumple SIEMPRE estas reglas en todas las fases y conversaciones.

## Fuente de verdad
- Los requisitos están en `docs/02-requerimientos-funcionales.md` (RF-01 a RF-27). No agregues funciones que no estén ahí.
- Si un dato no está en los documentos, NO lo inventes: usa un marcador visible `[PENDIENTE: ...]` y avísame.
- La referencia visual está en `docs/prototipo/`. Respeta su estructura y no inventes pantallas nuevas.

## Stack (fijo)
- HTML5 semántico, CSS3 y JavaScript puro (ES6+). Sin frameworks, sin bundlers, sin TypeScript, sin librerías de JS ni de CSS.
- Dependencias externas permitidas: Google Fonts y un mapa insertado (iframe).
- Formulario: Web3Forms mediante `fetch`. Hosting: Cloudflare Pages (sitio estático).

## Fuera de alcance (nunca implementar)
Pagos en línea, diagnósticos médicos o pedagógicos, panel de administración, login o áreas privadas, módulo de notas o historiales, base de datos, backend propio, chatbot, app móvil, blog, traducción, transmisión en vivo, publicidad pagada, matrícula o confirmación de cupos en línea.

## Contenido y código
- Todo el contenido visible va en el HTML estático (los buscadores deben leerlo sin ejecutar JavaScript). JavaScript solo para interacción: menú móvil, validación y envío del formulario.
- El menú y el pie de página se escriben directamente en cada página (son 4 páginas); no se inyectan con JavaScript.
- Interfaz en español de Colombia. Identificadores de código en inglés. Comentarios en español.

## Calidad
- HTML semántico (header, nav, main, section, footer), un solo h1 por página, `lang="es"`, title y meta description únicos por página.
- Accesibilidad WCAG 2.1 AA: contraste, alt en imágenes, label en cada campo, foco visible, navegación por teclado, áreas táctiles de al menos 44 px.
- Mobile-first. Puntos de quiebre en 768 px y 1024 px. Sin scroll horizontal desde 320 px.
- CSS: variables en `:root` con la paleta del moodboard, un solo archivo, nomenclatura BEM, sin estilos en línea ni `!important`.
- JS: funciones pequeñas, sin variables globales innecesarias, sin código muerto, sin `console.log` en la entrega.
- Imágenes comprimidas, con width y height, y `loading="lazy"` salvo la primera.

## Seguridad y privacidad
- Nunca imágenes ni datos de menores (ni nombres de menores en testimonios). El formulario no pide datos del menor.
- Casilla de consentimiento (Ley 1581 de 2012) obligatoria antes de enviar, con enlace a la política de tratamiento de datos.
- Validación en cliente, campo honeypot anti-spam, enlaces externos con `rel="noopener noreferrer"`.
- No inventes llaves ni claves: usa marcadores `[PENDIENTE: ...]`.

## Trazabilidad
- Marca cada bloque con un comentario `<!-- RF-xx -->` que indique el requerimiento que cubre.

## Proceso
- Trabaja en modo plan. Antes de modificar archivos, muestra el plan y espera mi aprobación.
- Una fase a la vez. Al terminar, resume qué hiciste y qué RF quedaron cubiertos.
- Commits pequeños con mensajes `feat:`, `fix:`, `docs:`.
