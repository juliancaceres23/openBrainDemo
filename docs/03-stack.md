# Stack tecnológico

> Es una decisión del equipo (el documento del proyecto no define tecnologías). Todo es gratuito.
> Verificar los límites de los planes gratuitos al momento de publicar y anotar la fecha en el manual técnico.

| Parte | Tecnología | Para qué |
|---|---|---|
| Estructura | HTML5 | 4 páginas (más una página de apoyo con la política de datos) |
| Estilos y responsivo | CSS3 (variables, Flexbox/Grid, media queries) | Diseño mobile-first con la paleta del moodboard |
| Lógica | JavaScript puro (ES6+) | Menú móvil, validación y envío del formulario, mensaje de confirmación |
| Preguntas frecuentes | Etiqueta HTML `<details>` | Desplegables sin JavaScript |
| Tipografía | Google Fonts (sans-serif redondeada) | Títulos amigables; texto simple y grande |
| Formulario | Web3Forms | Recibe el formulario y lo reenvía al correo de Open Brain |
| WhatsApp | Enlace `wa.me` | Botón en todas las pantallas, sin API |
| Mapa | Mapa insertado (iframe) de Google Maps u OpenStreetMap | Módulo de Contacto |
| Publicación | Cloudflare Pages | Alojar el sitio estático |
| Versiones | Git + GitHub | Control de cambios |
| Desarrollo | Antigravity | Desarrollo asistido |
| Diseño | Figma | Prototipo (ya existe) |
| Pruebas | Lighthouse, DevTools (modo dispositivo), WAVE, Google Forms | Accesibilidad, responsivo y cuestionario de usabilidad |

## Arquitectura (cliente-servidor)
Familia (navegador en celular o PC) → Cloudflare Pages entrega el sitio estático → el formulario se envía por POST a Web3Forms → llega al correo de Open Brain. El botón de WhatsApp abre la conversación con `wa.me`.

## Estructura de carpetas
```
openBrain/
├── index.html
├── servicios.html
├── equipo.html
├── contacto.html
├── politica-datos.html      (página de apoyo, no es un módulo)
├── css/estilos.css
├── js/menu.js
├── js/formulario.js
├── img/
├── assets/                  (folleto PDF, código QR)
├── docs/
└── README.md
```

## No usar
Frameworks, librerías de JS o CSS, base de datos, backend propio, login, panel de administración, pagos.

## Limitaciones conocidas
- Sin correo automático de respuesta: se usa un mensaje de confirmación en pantalla.
- Sin dominio propio: la dirección será del tipo `nombre.pages.dev`.
- Web3Forms (plan gratuito): límite mensual de envíos; la llave de acceso es un `[PENDIENTE]` que el equipo debe crear.
