# Prompt inicial (pegar en un chat nuevo, con el proyecto openBrain seleccionado)

Antes de enviar: escribir `/` y elegir `plan` para que el agente genere un plan antes de actuar.

```
Antes de empezar, lee y cumple siempre @docs/00-reglas.md
Luego lee: @docs/01-contexto.md @docs/02-requerimientos-funcionales.md @docs/03-stack.md @docs/04-identidad-visual.md @docs/05-legal.md @docs/06-contenido.md
Referencia visual: la carpeta docs/prototipo/ (pantallas de celular, de escritorio y moodboard). El PDF de docs/referencia/ es solo para consulta.

Eres un desarrollador front-end senior. Vas a construir la plataforma web informativa de Open Brain, una organización de Cúcuta que atiende a niños, niñas y adolescentes con dificultades de aprendizaje.

OBJETIVO
Un sitio de cuatro módulos: Inicio, Servicios y horarios, Equipo y testimonios, y Contacto y solicitud de inscripción. La plataforma NO matricula: recibe solicitudes de inscripción y explica los pasos; la confirmación de cupos se hace por WhatsApp o contacto directo.

REQUISITOS
Implementa los 27 requerimientos (RF-01 a RF-27) de docs/02-requerimientos-funcionales.md, siguiendo las decisiones de implementación de ese archivo. Todos deben quedar cubiertos.

CONTENIDO
Si falta un dato (tarifas, horarios, equipo, testimonios, teléfono, correo, WhatsApp, redes), usa un marcador visible [PENDIENTE: ...]. No inventes datos. Los textos del prototipo son un punto de partida.

ESTRUCTURA
index.html, servicios.html, equipo.html, contacto.html, politica-datos.html (página de apoyo, no es un módulo), css/estilos.css, js/menu.js, js/formulario.js, img/, assets/, README.md.

PROCESO
1. NO escribas código todavía. Entrégame un plan de implementación con: fases, archivos por fase, qué RF cubre cada fase, supuestos y dudas.
2. Espera mi aprobación.
3. Implementa una fase a la vez, con un resumen al terminar cada una.

DEFINICIÓN DE TERMINADO
- Los 27 RF cubiertos y marcados en el código con <!-- RF-xx -->.
- Revisado en 375 px y en 1280 px, sin scroll horizontal.
- Lighthouse de accesibilidad y SEO con buen puntaje, sin errores de consola.
- README con cómo ejecutar, estructura y cómo actualizar el contenido.
```

# Prompts por fase (un chat nuevo por fase)

Al inicio de cada uno: `Lee y cumple siempre @docs/00-reglas.md y revisa @docs/02-requerimientos-funcionales.md`

1. **Esqueleto y sistema de diseño:** crea la estructura de carpetas, `.gitignore`, `README.md`, y en `css/estilos.css` las variables (paleta de @docs/04-identidad-visual.md), reseteo, tipografía, botones, tarjetas, barra de navegación, pie de página y botón flotante de WhatsApp. Cubre RF-01 y RF-02. Primero muestra el plan.
2. **Inicio:** construye `index.html` según el prototipo. Cubre RF-03 a RF-08. Primero muestra el plan.
3. **Servicios y horarios:** construye `servicios.html`. Cubre RF-09 a RF-13. Primero muestra el plan.
4. **Equipo y testimonios:** construye `equipo.html` con preguntas frecuentes en `<details>`. Cubre RF-14 a RF-16. Primero muestra el plan.
5. **Contacto y solicitud de inscripción:** construye `contacto.html` y `js/formulario.js` (validación, casilla obligatoria, honeypot, envío con fetch a Web3Forms con marcador para la llave, mensaje de confirmación en pantalla, mapa insertado). Cubre RF-17 a RF-24. Primero muestra el plan.
6. **Transversales y extras:** enlaces a redes (RF-25), sección o archivo del código QR (RF-26), enlace de descarga del folleto (RF-27), `politica-datos.html`, etiquetas SEO, `robots.txt` y `sitemap.xml`.
7. **Control de calidad:** revisa en 375 px y 1280 px, accesibilidad, contraste, enlaces rotos, consola y trazabilidad de los 27 RF. Entrega una tabla RF → archivo → estado.
