# Requerimientos funcionales (FP21)

Todos los requerimientos deben quedar implementados (avance esperado: 100 %).
Marca cada bloque del código con `<!-- RF-xx -->`.

| ID | Módulo | Requerimiento |
|---|---|---|
| RF-01 | Transversal | El sistema debe mostrar, en todas las pantallas, una barra de navegación con el logo de Open Brain y acceso a los cuatro módulos. |
| RF-02 | Transversal | El sistema debe mostrar, en todas las pantallas, un botón que abra una conversación de WhatsApp con la organización. |
| RF-03 | Inicio | El sistema debe mostrar un mensaje de bienvenida sobre el apoyo a las dificultades de aprendizaje en Cúcuta. |
| RF-04 | Inicio | El sistema debe mostrar una presentación de Open Brain (quiénes son y qué hacen). |
| RF-05 | Inicio | El sistema debe mostrar un espacio con la imagen de la sede. |
| RF-06 | Inicio | El sistema debe mostrar un botón "Ver servicios" que lleve al módulo de Servicios y horarios. |
| RF-07 | Inicio | El sistema debe mostrar el teléfono y el correo de la organización. |
| RF-08 | Inicio | El sistema debe mostrar accesos directos a cada uno de los tres servicios. |
| RF-09 | Servicios y horarios | El sistema debe mostrar los tres servicios (acompañamiento pedagógico, acompañamiento terapéutico y estimulación adecuada), cada uno con su descripción. |
| RF-10 | Servicios y horarios | El sistema debe mostrar las edades y las modalidades de cada servicio. |
| RF-11 | Servicios y horarios | El sistema debe mostrar los horarios de atención. |
| RF-12 | Servicios y horarios | El sistema debe mostrar la tarifa de cada servicio. |
| RF-13 | Servicios y horarios | El sistema debe mostrar un botón para solicitar información. |
| RF-14 | Equipo y testimonios | El sistema debe mostrar la presentación del equipo profesional. |
| RF-15 | Equipo y testimonios | El sistema debe mostrar testimonios de familias, únicamente los que cuenten con autorización de sus representantes legales. |
| RF-16 | Equipo y testimonios | El sistema debe mostrar preguntas frecuentes en secciones desplegables. |
| RF-17 | Contacto y solicitud de inscripción | El sistema debe ofrecer un formulario con los campos nombre del acudiente, teléfono o correo, servicio de interés y mensaje. |
| RF-18 | Contacto y solicitud de inscripción | El sistema debe incluir una casilla de aceptación del tratamiento de datos personales y no permitir el envío del formulario sin marcarla. |
| RF-19 | Contacto y solicitud de inscripción | El sistema debe enviar cada solicitud del formulario a un medio de contacto de la empresa. |
| RF-20 | Contacto y solicitud de inscripción | El sistema debe mostrar un mapa con la ubicación de la sede. |
| RF-21 | Contacto y solicitud de inscripción | El sistema debe mostrar la dirección de la sede, el teléfono, el correo y el horario de atención. |
| RF-22 | Contacto y solicitud de inscripción | El sistema debe mostrar los pasos para inscribirse. |
| RF-23 | Contacto y solicitud de inscripción | El sistema debe mostrar un mensaje que invite a consultar la disponibilidad de cupos por WhatsApp. |
| RF-24 | Contacto y solicitud de inscripción | El sistema debe mostrar una respuesta automática al enviar el formulario. |
| RF-25 | Transversal | El sistema debe mostrar enlaces a las redes sociales existentes de Open Brain. |
| RF-26 | Transversal | El sistema debe contar con un código QR que dirija al sitio, para usar en la sede. |
| RF-27 | Transversal | El sistema debe ofrecer un folleto digital descargable. |

## Decisiones de implementación (acordadas por el equipo)
- **RF-02:** enlace `https://wa.me/57XXXXXXXXXX` con el número `[PENDIENTE]`. Sin API de WhatsApp.
- **RF-04:** va en el módulo de Inicio.
- **RF-06 y RF-08:** los accesos directos de Inicio llevan a la descripción de cada servicio dentro de Servicios y horarios.
- **RF-13:** el botón "Solicitar información" lleva al módulo de Contacto.
- **RF-18:** el botón de enviar queda deshabilitado (o el envío se bloquea) hasta marcar la casilla; además hay un enlace a la política de tratamiento de datos.
- **RF-19:** el envío se hace con Web3Forms (`fetch`/POST) al correo de Open Brain `[PENDIENTE]`.
- **RF-20:** mapa insertado (iframe) con la dirección y enlace "Cómo llegar".
- **RF-24:** mensaje de confirmación en pantalla tras el envío (no correo automático).
- **RF-25:** enlaces con marcador `[PENDIENTE: URL]` hasta recibir las redes reales.
- **RF-26:** dejar una sección o archivo para el QR; se genera con la URL final al desplegar (documentarlo en el README).
- **RF-27:** enlace de descarga a `assets/folleto-open-brain.pdf` (marcador si aún no existe).

## No funcionales (no van en el FP21, pero se deben cumplir)
- **RNF-01:** el sitio se visualiza y funciona en celular y en escritorio con la disposición descrita en `01-contexto.md`.
- **RNF-02:** accesibilidad WCAG 2.1 AA (contraste, textos legibles, teclado).
- **RNF-03:** identidad visual según `04-identidad-visual.md`.
- **RNF-04:** cumplir la Ley 1581 de 2012; ninguna imagen ni dato de menores.
