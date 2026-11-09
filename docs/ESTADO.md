# Tablero de Estado del Proyecto: Open Brain

> Este archivo registra el progreso de implementación, el estado de cada una de las 7 fases, la cobertura de los 27 requerimientos funcionales y los datos pendientes de confirmación.
> Última actualización: Planificación inicial aprobada.

---

## 1. Estado Global de las Fases

| Fase | Descripción | RF Cubiertos | Archivos Principales | Estado |
|---|---|---|---|---|
| **Fase 1** | Arquitectura Base, Sistema de Diseño y Transversal | RF-01, RF-02 | `css/estilos.css`, `js/menu.js`, `img/` | ✅ Completada |
| **Fase 2** | Módulo de Inicio | RF-03 a RF-08 | `index.html` | ✅ Completada |
| **Fase 3** | Módulo de Servicios y Horarios | RF-09 a RF-13 | `servicios.html` | ✅ Completada |
| **Fase 4** | Módulo de Equipo y Testimonios | RF-14 a RF-16 | `equipo.html` | ✅ Completada |
| **Fase 5** | Módulo de Contacto, Formulario y Legal | RF-17 a RF-24 | `contacto.html`, `politica-datos.html`, `js/formulario.js` | ✅ Completada |
| **Fase 6** | Canales Institucionales, Folleto y SEO | RF-25, RF-26, RF-27 | `assets/`, `robots.txt`, `sitemap.xml`, meta tags | ⏳ Pendiente |
| **Fase 7** | Auditoría WCAG 2.1 AA, Responsive y Documentación | Verificación total | `README.md` | ⏳ Pendiente |

*Convenciones de estado:*
- ⏳ Pendiente
- 🟡 En progreso
- ✅ Completada

---

## 2. Matriz de Requerimientos Funcionales (RF-01 a RF-27)

| ID | Módulo | Requerimiento | Fase | Estado | Comentarios / Marcador |
|---|---|---|:---:|:---:|---|
| **RF-01** | Transversal | Barra de navegación con logo y 4 módulos | Fase 1 | ✅ Implementado base | Estructura en estilos y script menú móvil accesible |
| **RF-02** | Transversal | Botón de WhatsApp a conversación directa | Fase 1 | ✅ Implementado base | Componente accesible con `https://wa.me/57[PENDIENTE]` |
| **RF-03** | Inicio | Bienvenida sobre dificultades de aprendizaje en Cúcuta | Fase 2 | ✅ Completado | Hero con mensaje contextualizado y H1 accesible |
| **RF-04** | Inicio | Presentación de Open Brain (quiénes son y qué hacen) | Fase 2 | ✅ Completado | Sección institucional y pilares de atención |
| **RF-05** | Inicio | Espacio con imagen de la sede (sin menores) | Fase 2 | ✅ Completado | Card con ilustración de sede, width/height y marcador |
| **RF-06** | Inicio | Botón "Ver servicios" hacia Servicios y horarios | Fase 2 | ✅ Completado | Enlace principal destacado hacia `servicios.html` |
| **RF-07** | Inicio | Teléfono y correo visibles de la organización | Fase 2 | ✅ Completado | Canales visibles con marcadores `[PENDIENTE: ...]` |
| **RF-08** | Inicio | Accesos directos a los tres servicios | Fase 2 | ✅ Completado | Tarjetas interactivas con anclas a `servicios.html` |
| **RF-09** | Servicios | Tres servicios con descripción | Fase 3 | ✅ Completado | Pedagógico, terapéutico y estimulación con detalle |
| **RF-10** | Servicios | Edades y modalidades de cada servicio | Fase 3 | ✅ Completado | Badges accesibles y descriptivos por servicio |
| **RF-11** | Servicios | Horarios de atención | Fase 3 | ✅ Completado | Lista estructurada en barra lateral y móvil |
| **RF-12** | Servicios | Tarifas por servicio | Fase 3 | ✅ Completado | Detalle de inversión y marcador `[PENDIENTE: Tarifas]` |
| **RF-13** | Servicios | Botón para solicitar información | Fase 3 | ✅ Completado | Botón accesible en cada tarjeta hacia `contacto.html` |
| **RF-14** | Equipo | Presentación del equipo profesional (3 profesores) | Fase 4 | ✅ Completado | Avatares circulares del prototipo con perfiles y marcadores |
| **RF-15** | Equipo | Testimonios de familias autorizados sin nombres de menores | Fase 4 | ✅ Completado | Tarjetas rosas del prototipo, autorización Ley 1581 |
| **RF-16** | Equipo | Preguntas frecuentes desplegables | Fase 4 | ✅ Completado | Implementado con `<details>` y `<summary>` nativos sin JS |
| **RF-17** | Contacto | Formulario: nombre acudiente, teléfono/correo, servicio, mensaje | Fase 5 | ✅ Completado | Labels vinculados, campos obligatorios y semántica accesible |
| **RF-18** | Contacto | Casilla obligatoria de tratamiento de datos | Fase 5 | ✅ Completado | Bloquea envío; enlace a `politica-datos.html` |
| **RF-19** | Contacto | Envío de solicitud a medio de contacto | Fase 5 | ✅ Completado | Web3Forms vía `fetch`; `MODO_SIMULACION = false` |
| **RF-20** | Contacto | Mapa con la ubicación de la sede | Fase 5 | ✅ Completado | iframe accesible en tarjeta turquesa con enlace "Cómo llegar" |
| **RF-21** | Contacto | Dirección, teléfono, correo y horarios visibles | Fase 5 | ✅ Completado | Bloque de información de contacto completo |
| **RF-22** | Contacto | Pasos para inscribirse | Fase 5 | ✅ Completado | 4 pasos claros que explican que no hay matrícula en línea |
| **RF-23** | Contacto | Mensaje para consultar cupos por WhatsApp | Fase 5 | ✅ Completado | Bloque CTA destacado con enlace directo a WhatsApp |
| **RF-24** | Contacto | Respuesta automática en pantalla al enviar formulario | Fase 5 | ✅ Completado | Feedback accesible con `aria-live="polite"` |
| **RF-25** | Transversal | Enlaces a redes sociales existentes de Open Brain | Fase 6 | ⏳ Pendiente | `[PENDIENTE: URL]` |
| **RF-26** | Transversal | Código QR que dirija al sitio para usar en sede | Fase 6 | ⏳ Pendiente | Asset vectorial en `assets/` |
| **RF-27** | Transversal | Folleto digital descargable | Fase 6 | ⏳ Pendiente | Documento PDF en `assets/` |

---

## 3. Datos Pendientes de Entrega por Open Brain

| Dato | Marcador asignado | Ubicación afectada |
|---|---|---|
| Teléfono, correo y WhatsApp oficiales | `[PENDIENTE: Teléfono / Correo / WhatsApp]` | Header, Inicio, Contacto, Footer |
| Clave de acceso Web3Forms | `[PENDIENTE: WEB3FORMS_ACCESS_KEY]` | `js/formulario.js` |
| Tarifas exactas por servicio | `[PENDIENTE: Tarifas]` | `servicios.html` |
| Horarios oficiales definitivos | `[PENDIENTE: Horarios]` | `servicios.html`, `contacto.html` |
| Fotos reales de la sede sin menores | `[PENDIENTE: Foto de la sede sin menores]` | `index.html`, `img/` |
| Nombres y perfiles definitivos de los 3 profesores | `[PENDIENTE: Perfiles del equipo]` | `equipo.html` |
| Testimonios reales autorizados (sin nombres de menores) | `[PENDIENTE: Testimonios autorizados]` | `equipo.html` |
| Enlaces definitivos de redes sociales | `[PENDIENTE: URL redes sociales]` | Footer en todas las páginas |
| Folleto institucional final (PDF) | `[PENDIENTE: Folleto oficial]` | `assets/folleto-open-brain.pdf` |
| Logo y mascota en alta resolución | `[PENDIENTE: Logo oficial]` | `img/` |
