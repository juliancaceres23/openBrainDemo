# Plataforma Web Informativa de Open Brain

Plataforma web institucional y de difusión de oferta académica desarrollada para **Open Brain — Club de Aprendizaje**, organización de Cúcuta (Norte de Santander, Colombia) que acompaña a niños, niñas y adolescentes con dificultades específicas de aprendizaje.

> **Alcance del sitio:** La plataforma **no matricula ni cobra en línea**. Centraliza la información institucional, presenta los servicios, expone los pasos del proceso y recibe solicitudes de inscripción mediante un formulario (que las registra en una base de datos y avisa al equipo) y un contacto directo a WhatsApp, donde el equipo docente coordina la valoración y confirma la disponibilidad de cupos.

---

## 1. Stack Tecnológico y Arquitectura

Sitio web estático con un **backend mínimo y sin servidores que administrar** (arquitectura cliente-servidor sobre Cloudflare):

* **Estructura:** HTML5 semántico (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`, `<details>`, `<summary>`).
* **Estilos:** CSS3 nativo mobile-first con variables `:root`, Flexbox, CSS Grid y metodología BEM.
* **Lógica en el navegador:** JavaScript puro (ES6+) modular (`js/menu.js`, `js/animaciones.js` y `js/formulario.js`).
* **Tipografía:** Google Fonts (**Nunito** — sans-serif redondeada y amigable).
* **Backend:** una [Cloudflare Pages Function](https://developers.cloudflare.com/pages/functions/) (`functions/api/contacto.js`) que responde en `POST /api/contacto`.
* **Base de datos:** [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite administrado). Esquema en `db/schema.sql`.
* **Aviso por correo:** [Resend](https://resend.com) (solo desde el servidor; opcional pero recomendado).
* **Hosting:** Cloudflare Pages.
* **Fuera de alcance estricto:** sin pasarelas de pago, sin login ni áreas privadas, sin panel de administración. El backend se limita a recibir y registrar las solicitudes del formulario.

```text
Navegador                 Cloudflare Pages                         Servicios
─────────                 ────────────────                         ─────────
contacto.html  ──POST──►  functions/api/contacto.js
js/formulario.js          1. Verifica origen y formato
(validación cliente)      2. Valida cada campo (servidor)
                          3. Descarta bots (campo trampa)
                          4. Limita envíos por conexión ──────────► D1: solicitudes
                          5. Guarda la solicitud (SQL parametrizado) ► (base de datos)
                          6. Avisa al equipo ─────────────────────► Resend → correo
               ◄─JSON───  7. Responde ok / error claro
```

**¿Por qué esta arquitectura?** Open Brain no tiene personal técnico ni presupuesto para servidores. Pages Functions + D1 no requieren mantenimiento, escalan solos, funcionan en el plan gratuito y mantienen un solo repositorio y un solo despliegue. A cambio del formulario anterior (solo correo), ahora cada solicitud queda **registrada con estado de seguimiento**, que era una de las causas del problema que atiende el proyecto (atención "sin un registro que permita dar seguimiento").

---

## 2. Estructura del Proyecto

```text
openBrain/                          # Repositorio (lo que se sube a GitHub)
├── public/                         # ← ÚNICO contenido estático que se publica
│   ├── index.html                  # Módulo 1: Inicio (bienvenida, presentación, sede, accesos directos)
│   ├── servicios.html              # Módulo 2: Servicios y horarios (catálogo, edades, modalidades, tarifas)
│   ├── equipo.html                 # Módulo 3: Equipo y testimonios (profesionales, testimonios y FAQ)
│   ├── contacto.html               # Módulo 4: Contacto e inscripción (formulario, mapa, pasos y datos)
│   ├── politica-datos.html         # Soporte legal (Ley 1581 de 2012 y Ley 1098 de 2006)
│   ├── robots.txt                  # Indicaciones de rastreo para buscadores (SEO; no es una medida de seguridad)
│   ├── sitemap.xml                 # Mapa del sitio con las URLs canónicas públicas
│   ├── _headers                    # Cabeceras de seguridad (CSP, nosniff, etc.) para Cloudflare Pages
│   ├── css/                        # estilos.css (importa variables, global y estilos por página)
│   ├── js/                         # menu.js, formulario.js, animaciones.js
│   ├── img/                        # Logotipos, ilustraciones y fotografías del sitio
│   └── assets/                     # Folleto PDF (RF-27)
├── functions/                      # ← Backend (Pages Functions). Cloudflare lo detecta solo
│   └── api/
│       └── contacto.js             # POST /api/contacto: valida, guarda en D1 y avisa por correo
├── db/
│   └── schema.sql                  # Tabla `solicitudes` de la base de datos D1
├── tests/
│   └── contacto.test.mjs           # Pruebas automáticas del endpoint (sin instalar nada)
├── wrangler.toml.example           # Plantilla SOLO para desarrollo local (el real está en .gitignore)
├── .github/workflows/              # Automatizaciones (análisis de calidad con Qodana)
├── .codacy/                        # Configuración de análisis estático
├── AGENTS.md                       # Reglas del proyecto para asistentes de IA (NO se publica)
├── .gitignore
└── README.md                       # Manual técnico y guía de mantenimiento (NO se publica)
```

> `functions/` debe estar en la **raíz del repositorio**, no dentro de `public/`. Solo `public/` se sirve como archivos estáticos; `functions/` se compila como código de servidor y nunca es visible para los visitantes.

---

## 3. Cómo Ejecutar el Proyecto en Local

### Solo el sitio (sin formulario)
Sirve para revisar diseño y contenido. **El formulario no enviará nada**, porque no existe `/api/contacto` en un servidor estático simple.

```bash
cd public
python3 -m http.server 8000     # luego abre http://localhost:8000
```
También sirve abrir `public/index.html` directamente o usar la extensión *Live Server* de VS Code. Para ver el mensaje de éxito sin backend, cambia temporalmente `MODO_SIMULACION` a `true` en `js/formulario.js` (y devuélvelo a `false` antes de publicar).

### Sitio completo con backend y base de datos local (Wrangler)
Requiere [Node.js](https://nodejs.org) 20 o superior. La base de datos local es una copia en `.wrangler/` (ignorada por Git); no toca la de producción.

```bash
cp wrangler.toml.example wrangler.toml          # plantilla local (no se sube a Git)
npx wrangler d1 execute open-brain-db --local --file=db/schema.sql   # crea la tabla local
npx wrangler pages dev public                   # abre http://localhost:8788
```

Para probar el aviso por correo en local, crea un archivo `.dev.vars` (ignorado por Git) con:
```ini
RESEND_API_KEY=re_tu_clave
NOTIFY_EMAIL=correo-con-el-que-creaste-la-cuenta-de-resend
```
Para ver lo guardado en la base local:
```bash
npx wrangler d1 execute open-brain-db --local --command "SELECT * FROM solicitudes ORDER BY id DESC"
```

### Pruebas automáticas
```bash
node --test
```
No instala nada ni necesita internet: ejecuta el endpoint real contra una base de datos simulada y comprueba validaciones, límite de envíos, protección contra inyección SQL, respaldo por correo y manejo de fallos.

---

## 4. Backend: Formulario y Base de Datos

El formulario de `contacto.html` envía un JSON a `POST /api/contacto`. El archivo [`functions/api/contacto.js`](functions/api/contacto.js) hace, en orden:

1. **Verifica la petición:** solo `POST`, solo JSON, tamaño máximo 8 KB y solo desde el propio sitio (cabecera `Origin`).
2. **Descarta bots:** si el campo trampa `botcheck` viene lleno, responde "ok" sin guardar nada.
3. **Valida en el servidor** cada campo (la validación del navegador es solo comodidad): nombre 2–120 caracteres, teléfono o correo válido, servicio dentro de la lista permitida, mensaje 10–1000 caracteres y consentimiento obligatorio.
4. **Limita los envíos:** máximo 5 solicitudes por hora por conexión (se compara una huella cifrada de la IP; la IP real nunca se guarda).
5. **Guarda la solicitud** en la tabla `solicitudes` con consultas parametrizadas (no es posible inyectar SQL), junto con la constancia del consentimiento y la versión de la política aceptada.
6. **Avisa al equipo** por correo con Resend, sin retrasar la respuesta al visitante.
7. **Depura** las solicitudes que superen el plazo de conservación.

**Respaldo:** la solicitud cuenta como recibida si queda guardada en D1 o, si D1 falla, si el aviso por correo sale. Solo si fallan ambas, el visitante ve un mensaje de error que lo invita a escribir por WhatsApp.

### 4.1 Puesta en marcha (una sola vez)

> Hazlo **antes** de subir el código nuevo. Los cambios del panel se aplican en el siguiente despliegue.

1. **Crear la base de datos.** En el panel de [Cloudflare](https://dash.cloudflare.com): *Storage & databases* → *D1 SQL database* → *Create database*. Nómbrala `open-brain-db`. (Los nombres del panel pueden variar con el tiempo.)
2. **Crear la tabla.** Abre la base de datos → pestaña *Console* → pega el contenido de [`db/schema.sql`](db/schema.sql) → *Execute*. Es seguro repetirlo.
3. **Conectarla al sitio.** *Workers & Pages* → tu proyecto de Pages → *Settings* → *Bindings* → *Add* → *D1 database*. **Variable name: `DB`** (exactamente así) y selecciona `open-brain-db`.
4. **Cuenta de Resend (aviso por correo).** Crea una cuenta en [resend.com](https://resend.com) **con el correo institucional que debe recibir los avisos** y genera una *API Key* con permiso de envío. En el plan gratuito, sin dominio propio verificado, Resend solo entrega al correo con el que se creó la cuenta.
5. **Variables.** En el proyecto de Pages → *Settings* → *Variables and Secrets* (entorno *Production*):

   | Nombre | Tipo | Valor |
   |---|---|---|
   | `RESEND_API_KEY` | Secreto | La clave `re_...` de Resend |
   | `NOTIFY_EMAIL` | Texto | El mismo correo con el que creaste la cuenta de Resend |
   | `IP_SALT` | Secreto | Una frase larga y aleatoria (sirve para cifrar la huella de la IP) |
   | `RETENCION_DIAS` | Texto (opcional) | Días de conservación; por defecto `365` |
   | `NOTIFY_FROM` | Texto (opcional) | Remitente; por defecto `Open Brain Web <onboarding@resend.dev>` |

6. **Desplegar.** Haz `git push` (o *Deployments → Retry deployment*) para que el binding y las variables entren en vigor.
7. **Probar.** Envía una solicitud desde `contacto.html`, comprueba que llegó el correo y consulta la base (sección 4.2).

### 4.2 Operación diaria: consultar y dar seguimiento

El equipo no necesita panel: usa la pestaña *Console* de la base de datos en el panel de Cloudflare.

```sql
-- Solicitudes pendientes de atender
SELECT id, creado_en, nombre_acudiente, contacto, servicio_interes, mensaje
FROM solicitudes WHERE estado = 'nueva' ORDER BY id DESC;

-- Dar seguimiento (estados: nueva, contactada, inscrita, descartada)
UPDATE solicitudes SET estado = 'contactada' WHERE id = 3;

-- Resumen por estado
SELECT estado, COUNT(*) AS total FROM solicitudes GROUP BY estado;

-- Supresión a petición del titular (derecho de la Ley 1581)
DELETE FROM solicitudes WHERE id = 3;
```
Las fechas están en UTC. Para respaldar los datos, la base se puede exportar como archivo SQL desde el panel o con `npx wrangler d1 export open-brain-db --remote --output=respaldo.sql`.

### 4.3 Límites del plan gratuito

Valores publicados por los proveedores al momento de escribir esto; verifícalos en su documentación si el volumen crece.

| Servicio | Límite gratuito | Uso esperado de Open Brain |
|---|---|---|
| Cloudflare D1 | 100.000 filas escritas/día, 5 millones leídas/día, 5 GB | Unas pocas solicitudes al día |
| Pages Functions | 100.000 invocaciones/día | Solo `/api/contacto` (los archivos estáticos no cuentan) |
| Resend | 100 correos/día y 3.000/mes | Un correo por solicitud |

> Desde el 1 de septiembre de 2026, Cloudflare hace fallar las consultas de D1 al superar los límites diarios del plan gratuito. Con este volumen no debería ocurrir; si pasara, el aviso por correo sigue funcionando como respaldo.

### 4.4 Seguridad del endpoint

* **Inyección SQL:** todas las consultas usan parámetros (`.bind()`); lo que escribe el usuario nunca se mezcla con el SQL. Hay una prueba automática que lo comprueba.
* **XSS:** el contenido del usuario no se vuelve a mostrar en ninguna página, y el correo se envía en texto plano.
* **Abuso:** campo trampa, límite por hora y tamaño máximo del cuerpo. Si hubiera spam serio, el siguiente paso es añadir [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/) (gratuito).
* **Secretos:** `RESEND_API_KEY` e `IP_SALT` viven solo en el panel de Cloudflare. Nunca en el repositorio ni en `public/`.
* **CSP:** `public/_headers` ya solo permite conexiones al propio sitio (`connect-src 'self'`).
* **Datos del menor:** el formulario no los pide ni el servidor los acepta.

### 4.5 Solución de problemas

| Síntoma | Causa probable |
|---|---|
| El formulario muestra el mensaje de error y el servidor responde `503` | Falta el binding `DB` o no se creó la tabla (pasos 2 y 3) y tampoco está configurado el correo. Revisa y vuelve a desplegar. |
| Se guardan solicitudes pero no llegan correos | `NOTIFY_EMAIL` no coincide con el correo de la cuenta de Resend, o `RESEND_API_KEY` es incorrecta. Revisa los registros en tiempo real de las Functions del proyecto en el panel de Cloudflare. |
| Error `400` con un mensaje bajo el formulario | Un campo no pasó la validación del servidor; el mensaje indica cuál. |
| Error `429` | Más de 5 solicitudes en una hora desde la misma conexión. Se libera solo. |
| Cambié los servicios y el formulario los rechaza | Actualiza también `SERVICIOS_VALIDOS` en `functions/api/contacto.js` (deben coincidir con las `<option>` de `contacto.html`) y las pruebas. |
| En local, el formulario da error | Estás sirviendo solo `public/`. Usa `npx wrangler pages dev public` (sección 3). |

---

## 5. Cómo Actualizar los Contenidos del Sitio

Todos los archivos del sitio están dentro de `public/`. El contenido va escrito directamente en el HTML (no hay panel): para cambiarlo, edita el archivo y haz *commit* y *push*; Cloudflare republica solo.

| Contenido | ¿Dónde está? |
|---|---|
| Teléfono, correo y número de WhatsApp | `index.html`, `contacto.html`, `politica-datos.html` y el pie de página y botón de WhatsApp de todas las páginas (URLs `https://wa.me/57...`, `tel:` y `mailto:`) |
| Tarifas, edades, modalidades y horarios de los servicios | `servicios.html` |
| Horarios de atención | `servicios.html` y `contacto.html` |
| Nombres y descripciones del equipo | `equipo.html` y fotos en `img/equipo-*.jpg` |
| Testimonios | `equipo.html`. Solo con autorización escrita del acudiente y **nunca** con nombres o datos de menores. |
| Fotografías de la sede y de los servicios | `img/sede-openbrain.jpeg`, `img/servicio-*`. Formato WebP o JPG optimizado (máx. 300 KB), con `width`, `height` y `alt`. **Sin menores de edad.** |
| Redes sociales | Pie de página de todas las páginas |
| Folleto PDF | `assets/folleto-open-brain.pdf` |
| Servicios del formulario | `<option>` en `contacto.html` **y** `SERVICIOS_VALIDOS` en `functions/api/contacto.js` |

---

## 6. Despliegue en Cloudflare Pages

> Solo `public/` se publica como sitio estático. `functions/` se compila como backend. `README.md`, `AGENTS.md`, `db/`, `tests/` y las configuraciones quedan en el repositorio pero **fuera** del sitio.

1. Sube este repositorio a **GitHub**.
2. En el panel de [Cloudflare](https://dash.cloudflare.com): **Workers & Pages** → **Create application** → **Pages** → **Connect to Git** (los nombres del panel pueden variar).
3. Selecciona el repositorio y, en *Build settings*:
   * **Framework preset:** `None`
   * **Build command:** *(vacío)*
   * **Build output directory:** `public`
4. **Save and Deploy.** Cloudflare detecta `functions/` en la raíz y publica el backend automáticamente.
5. Configura la base de datos y las variables (sección 4.1) y vuelve a desplegar.
6. **Dominio:** la URL de producción aparece en `canonical`, `og:url` y `og:image` de las páginas HTML, en `public/sitemap.xml` y en `public/robots.txt`. Si cambia, usa *Buscar y reemplazar en archivos* (`Ctrl+Shift+H`) con la URL anterior.

**Alternativa sin Git (Direct Upload):** no sirve para este proyecto, porque la subida directa de solo `public/` omite `functions/` y el formulario dejaría de funcionar. Usa la conexión con Git.

### Seguridad y qué se publica
* **Todo lo que está en `public/` es visible para cualquiera.** Nunca pongas allí claves ni datos personales.
* `robots.txt` solo orienta a los buscadores; **no oculta nada**.
* `public/_headers` aplica la política de seguridad de contenido (CSP) y otras cabeceras. Si añades un servicio externo en el navegador (analítica, otro mapa), permítelo en la CSP o el navegador lo bloqueará.
* Protege con verificación en dos pasos las cuentas de GitHub, Cloudflare y Resend: quien entre allí puede modificar el sitio y ver las solicitudes.
* `.gitignore` no afecta archivos que ya estén en Git: para dejar de rastrear algo, usa `git rm -r --cached <ruta>`.

---

## 7. Matriz de Cobertura de Requerimientos (RF-01 a RF-27)

Todos los 27 requerimientos funcionales están cubiertos y etiquetados en el código con comentarios `<!-- RF-xx -->`:

| ID | Módulo | Requerimiento | Archivos clave |
|---|---|---|---|
| **RF-01** | Transversal | Barra de navegación con logo y acceso a 4 módulos | Todas las páginas HTML, `css/estilos.css`, `js/menu.js` |
| **RF-02** | Transversal | Botón de WhatsApp accesible en todas las pantallas | Todas las páginas HTML, `css/estilos.css` |
| **RF-03** | Inicio | Bienvenida sobre dificultades de aprendizaje en Cúcuta | `index.html` (Hero section) |
| **RF-04** | Inicio | Presentación de Open Brain (quiénes son y qué hacen) | `index.html` (Sección Conócenos) |
| **RF-05** | Inicio | Espacio con imagen de la sede (sin menores) | `index.html`, `img/sede-openbrain.svg` |
| **RF-06** | Inicio | Botón "Ver servicios" hacia Servicios y horarios | `index.html` |
| **RF-07** | Inicio | Teléfono y correo visibles de la organización | `index.html` (hero contact line y bloque inferior) |
| **RF-08** | Inicio | Accesos directos a cada uno de los tres servicios | `index.html` (píldoras de colores y anclas) |
| **RF-09** | Servicios | Tres servicios (pedagógico, terapéutico, estimulación) con descripción | `servicios.html` |
| **RF-10** | Servicios | Edades y modalidades de cada servicio | `servicios.html` (chips de metadatos) |
| **RF-11** | Servicios | Horarios de atención organizados | `servicios.html` (sidebar card) |
| **RF-12** | Servicios | Tarifas de cada servicio con marcadores | `servicios.html` |
| **RF-13** | Servicios | Botón para solicitar información hacia Contacto | `servicios.html` |
| **RF-14** | Equipo | Presentación del equipo profesional (3 profesores) | `equipo.html` (avatares circulares del prototipo) |
| **RF-15** | Equipo | Testimonios de familias autorizados sin nombres de menores | `equipo.html` (tarjetas rosas con citas) |
| **RF-16** | Equipo | Preguntas frecuentes desplegables sin JavaScript | `equipo.html` (`<details>` y `<summary>` nativos) |
| **RF-17** | Contacto | Formulario con acudiente, contacto, servicio y mensaje | `contacto.html`, `functions/api/contacto.js` (validación en servidor) |
| **RF-18** | Contacto | Casilla obligatoria de tratamiento de datos con bloqueo de envío | `contacto.html`, `js/formulario.js`, `functions/api/contacto.js` (la constancia queda en la base de datos) |
| **RF-19** | Contacto | Envío asíncrono del formulario a medio de contacto | `js/formulario.js`, `functions/api/contacto.js`, `db/schema.sql` (D1 + aviso por correo con Resend) |
| **RF-20** | Contacto | Mapa con ubicación de la sede y enlace "Cómo llegar" | `contacto.html` (iframe en tarjeta turquesa) |
| **RF-21** | Contacto | Dirección, teléfono, correo y horarios visibles | `contacto.html` (bloque de contacto) |
| **RF-22** | Contacto | Pasos explicativos para solicitar la inscripción | `contacto.html` (4 tarjetas secuenciales) |
| **RF-23** | Contacto | Mensaje para consultar cupos en tiempo real por WhatsApp | `contacto.html` (bloque destacado) |
| **RF-24** | Contacto | Respuesta automática en pantalla al enviar formulario | `contacto.html`, `js/formulario.js` (`aria-live`; muestra los avisos del servidor) |
| **RF-25** | Transversal | Enlaces a redes sociales de Open Brain en pie de página | Todas las páginas HTML (footer) |
| **RF-26** | Transversal | Código QR físico que dirija al sitio web | **Descartado:** se quitó del sitio por no ser útil |
| **RF-27** | Transversal | Folleto digital descargable | `assets/folleto-open-brain.pdf`, todas las páginas HTML |

---

## 8. Accesibilidad y Marco Legal

* **WCAG 2.1 AA:** Contrastes de color certificados sobre la paleta del moodboard, navegación completa por teclado con `:focus-visible` destacado, atributos `aria-expanded`, `aria-live` y `aria-label`, áreas táctiles mínimas de 44 px (estándar a 48 px) y soporte para `prefers-reduced-motion`.
* **Protección de Menores (Ley 1581 de 2012 y Ley 1098 de 2006):** Ninguna imagen ni dato personal de menores es solicitado ni publicado en el sitio web. Todos los testimonios cuentan con autorización expresa de representantes legales y protegen la identidad infantil.
* **Tratamiento de datos del acudiente (Ley 1581 de 2012):** el formulario solo pide nombre, teléfono o correo, servicio de interés y mensaje. Cada solicitud guarda la constancia de la autorización (casilla marcada y versión de la política aceptada), se conserva como máximo el plazo configurado (365 días por defecto, ver `RETENCION_DIAS`) y se elimina automáticamente después. La dirección IP nunca se guarda: solo una huella cifrada irreversible para limitar abusos. Si cambias proveedores, plazos o datos recolectados, **actualiza `politica-datos.html`** y la constante `POLITICA_VERSION` de `functions/api/contacto.js`.
