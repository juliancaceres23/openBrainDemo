# Plataforma Web Informativa de Open Brain

Plataforma web institucional y de difusión de oferta académica desarrollada para **Open Brain — Club de Aprendizaje**, organización de Cúcuta (Norte de Santander, Colombia) que acompaña a niños, niñas y adolescentes con dificultades específicas de aprendizaje.

> **Alcance del sitio:** La plataforma **no matricula ni cobra en línea**. Centraliza la información institucional, presenta los servicios, expone los pasos del proceso y recibe solicitudes de inscripción mediante formulario y contacto directo a WhatsApp, donde el equipo docente coordina la valoración y confirma la disponibilidad de cupos.

---

## 1. Stack Tecnológico

Sitio web estático puro, sin dependencias complejas ni herramientas de compilación:

* **Estructura:** HTML5 semántico (`<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`, `<details>`, `<summary>`).
* **Estilos:** CSS3 nativo mobile-first con variables `:root`, Flexbox, CSS Grid y metodología BEM.
* **Lógica:** JavaScript puro (ES6+) modular (`js/menu.js` y `js/formulario.js`).
* **Tipografía:** Google Fonts (**Nunito** — sans-serif redondeada y amigable).
* **Formulario:** Integración con [Web3Forms](https://web3forms.com) mediante `fetch` asíncrono.
* **Hosting previsto:** Cloudflare Pages (sitio estático).
* **Fuera de alcance estricto:** Sin bases de datos, sin backend propio, sin pasarelas de pago, sin login ni áreas privadas.

---

## 2. Estructura del Proyecto

```text
openBrain/
├── index.html              # Módulo 1: Inicio (bienvenida, presentación, sede, accesos directos)
├── servicios.html          # Módulo 2: Servicios y horarios (catálogo, edades, modalidades, tarifas)
├── equipo.html             # Módulo 3: Equipo y testimonios (profesionales, testimonios y FAQ)
├── contacto.html           # Módulo 4: Contacto e inscripción (formulario, mapa, pasos y datos)
├── politica-datos.html     # Página de soporte legal (Ley 1581 de 2012 y Ley 1098 de 2006)
├── robots.txt              # Configuración de rastreo e indexación para buscadores (SEO)
├── sitemap.xml             # Mapa del sitio con las URLs canónicas públicas
├── css/
│   └── estilos.css         # Hoja de estilos única, accesible (WCAG 2.1 AA) y responsiva
├── js/
│   ├── menu.js             # Menú de navegación móvil accesible (control ARIA, Escape, focus)
│   └── formulario.js       # Validación, honeypot anti-spam, simulación y envío a Web3Forms
├── img/
│   ├── logo-openbrain.svg          # Logotipo versión clara
│   ├── logo-openbrain-header.svg   # Logotipo optimizado para cabecera azul índigo
│   ├── mascota-openbrain.svg       # Mascota institucional (cerebro con lentes)
│   ├── ilustracion-hero.svg        # Gráfico principal del hero fiel al prototipo
│   └── sede-openbrain.svg          # Ilustración accesible de la sede sin menores
├── assets/
│   ├── folleto-open-brain.pdf      # Folleto institucional listo para descarga (RF-27)
│   └── qr-openbrain.svg            # Código QR vectorial para uso en la sede física (RF-26)
├── docs/                           # Documentación de requerimientos, marco legal y control
│   ├── 00-reglas.md
│   ├── 01-contexto.md
│   ├── 02-requerimientos-funcionales.md
│   ├── 03-stack.md
│   ├── 04-identidad-visual.md
│   ├── 05-legal.md
│   ├── 06-contenido.md
│   ├── PLAN.md                     # Plan maestro de implementación en 7 fases
│   └── ESTADO.md                   # Matriz de estado y cobertura de los 27 RF
└── README.md                       # Manual técnico y guía de mantenimiento
```

---

## 3. Cómo Ejecutar el Proyecto en Local

Al tratarse de código nativo para el navegador, no requiere instalación de `npm`, dependencias ni compiladores:

### Método 1: Apertura directa
1. Abre tu explorador de archivos.
2. Haz doble clic sobre `index.html` (o clic derecho > *Abrir con* > Tu navegador web favorito: Chrome, Firefox, Edge, Safari).

### Método 2: Servidor local de Python (Recomendado)
Para probar la carga con protocolo HTTP:
```bash
# Desde la raíz del proyecto:
python3 -m http.server 8000
```
Luego ingresa en tu navegador a: **`http://localhost:8000`**

### Método 3: Extensión Live Server (VS Code)
1. Abre la carpeta del proyecto en VS Code.
2. Haz clic derecho sobre `index.html`.
3. Selecciona **«Open with Live Server»**.

---

## 4. Configuración del Formulario (Web3Forms)

El formulario de `contacto.html` envía los datos vía `fetch` asíncrono al correo institucional de Open Brain mediante el servicio gratuito **Web3Forms**.

El archivo controlador es [`js/formulario.js`](js/formulario.js):

### Modo Simulación
Para garantizar seguridad en el despliegue, el modo de simulación viene **desactivado por defecto**:
```javascript
const MODO_SIMULACION = false;
```
* **Para pruebas locales sin consumir envíos reales:** cambia temporalmente el valor a `true`. El formulario esperará 1.5 segundos y mostrará el mensaje de éxito sin realizar peticiones de red.
* **Antes de publicar en producción:** asegúrate de que esté en `false`.

### Obtener y configurar la clave de acceso de Web3Forms
1. Ingresa a [https://web3forms.com](https://web3forms.com).
2. Escribe el correo oficial de Open Brain donde deben llegar las solicitudes y solicita tu Access Key gratuita.
3. Copia la clave recibida en tu correo y reemplázala en la línea 24 de `js/formulario.js`:
   ```javascript
   const WEB3FORMS_ACCESS_KEY = 'tu-clave-aqui-12345678-abcd';
   ```

---

## 5. Cómo Actualizar los Contenidos del Sitio

Todo dato pendiente de confirmación por Open Brain está identificado visualmente con la etiqueta `.pending-badge` (`[PENDIENTE: ...]`).

### Guía de reemplazo de datos pendientes:

| Dato pendiente | ¿En qué archivos actualizarlo? | Instrucción |
|---|---|---|
| **Teléfono oficial** | `index.html`, `contacto.html`, `css/estilos.css` (enlaces) | Reemplazar `[PENDIENTE: Teléfono oficial]` y actualizar el atributo `href="tel:+57XXXXXXXXXX"`. |
| **Correo electrónico** | `index.html`, `contacto.html`, `politica-datos.html` | Reemplazar `[PENDIENTE: Correo oficial]` y actualizar `href="mailto:correo@openbrain.co"`. |
| **Número de WhatsApp** | Todas las páginas (`.whatsapp-btn` y botones) | Reemplazar `[PENDIENTE: WhatsApp]` en las URLs `https://wa.me/57XXXXXXXXXX`. |
| **Tarifas oficiales** | `servicios.html` | Reemplazar los badges `[PENDIENTE: Tarifa ...]` con los valores y frecuencias acordadas. |
| **Horarios oficiales** | `servicios.html`, `contacto.html` | Actualizar las horas de atención de lunes a sábado según lo definido por el equipo. |
| **Nombres del equipo** | `equipo.html` | Reemplazar nombres y descripciones de los 3 profesionales docentes. |
| **Testimonios autorizados** | `equipo.html` | Incluir testimonios reales que cuenten con autorización previa de acudientes. **Nunca incluir nombres ni datos de menores**. |
| **Fotografías de la sede** | `img/sede-openbrain.svg` o `index.html` | Sustituir por fotos reales en formato WebP o JPG optimizado (máx. 300 KB), manteniendo `width`, `height` y `alt`. **Sin presencia de menores de edad**. |
| **Redes sociales oficiales** | Pie de página de todas las páginas | Reemplazar `[PENDIENTE: URL Facebook]` y `[PENDIENTE: URL Instagram]` con las URLs oficiales. |
| **Folleto PDF oficial** | `assets/folleto-open-brain.pdf` | Sobrescribir el archivo de texto marcador con el documento PDF final diseñado por Open Brain. |

---

## 6. Cómo Generar el Código QR Definitivo (RF-26)

El archivo [`assets/qr-openbrain.svg`](assets/qr-openbrain.svg) es una versión vectorial vectorial accesible provisional que apunta a `openbrain.pages.dev`.

Una vez tengas tu dominio o subdominio asignado en Cloudflare Pages:
1. Ingresa a una herramienta gratuita como [QRCode Monkey](https://www.qrcode-monkey.com) o cualquier generador similar.
2. Ingresa la URL final (por ejemplo: `https://openbrain.pages.dev`).
3. En las opciones de color, utiliza los colores de la marca:
   * **Color de primer plano:** `#2F438C` (Azul Índigo).
   * **Color de fondo:** `#FFFFFF` (Blanco).
4. Descarga el archivo generado en formato SVG o PNG de alta resolución.
5. Guárdalo en la carpeta `assets/` reemplazando `assets/qr-openbrain.svg` (o actualizando la ruta en el pie de página de los HTML).

---

## 7. Despliegue en Cloudflare Pages

1. Sube este repositorio a tu cuenta de **GitHub**.
2. Ingresa a tu panel de control de [Cloudflare](https://dash.cloudflare.com).
3. Dirígete a **Workers & Pages** > **Create application** > **Pages** > **Connect to Git**.
4. Selecciona el repositorio `openBrain`.
5. En los ajustes de compilación (*Build settings*):
   * **Framework preset:** `None` (sitio estático puro).
   * **Build command:** *(dejar vacío)*.
   * **Build output directory:** `.` o `/` (la raíz del repositorio).
6. Haz clic en **Save and Deploy**.
7. En menos de un minuto tu sitio estará publicado y disponible globalmente con certificado SSL (HTTPS) gratuito.
8. Actualiza las etiquetas de dominio en `robots.txt` y `sitemap.xml` con la URL asignada por Cloudflare.

---

## 8. Matriz de Cobertura de Requerimientos (RF-01 a RF-27)

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
| **RF-17** | Contacto | Formulario con acudiente, contacto, servicio y mensaje | `contacto.html` |
| **RF-18** | Contacto | Casilla obligatoria de tratamiento de datos con bloqueo de envío | `contacto.html`, `js/formulario.js` |
| **RF-19** | Contacto | Envío asíncrono del formulario a medio de contacto | `contacto.html`, `js/formulario.js` (Web3Forms) |
| **RF-20** | Contacto | Mapa con ubicación de la sede y enlace "Cómo llegar" | `contacto.html` (iframe en tarjeta turquesa) |
| **RF-21** | Contacto | Dirección, teléfono, correo y horarios visibles | `contacto.html` (bloque de contacto) |
| **RF-22** | Contacto | Pasos explicativos para solicitar la inscripción | `contacto.html` (4 tarjetas secuenciales) |
| **RF-23** | Contacto | Mensaje para consultar cupos en tiempo real por WhatsApp | `contacto.html` (bloque destacado) |
| **RF-24** | Contacto | Respuesta automática en pantalla al enviar formulario | `contacto.html`, `js/formulario.js` (`aria-live`) |
| **RF-25** | Transversal | Enlaces a redes sociales de Open Brain en pie de página | Todas las páginas HTML (footer) |
| **RF-26** | Transversal | Código QR físico que dirija al sitio web | `assets/qr-openbrain.svg`, todas las páginas HTML |
| **RF-27** | Transversal | Folleto digital descargable | `assets/folleto-open-brain.pdf`, todas las páginas HTML |

---

## 9. Accesibilidad y Marco Legal

* **WCAG 2.1 AA:** Contrastes de color certificados sobre la paleta del moodboard, navegación completa por teclado con `:focus-visible` destacado, atributos `aria-expanded`, `aria-live` y `aria-label`, áreas táctiles mínimas de 44 px (estándar a 48 px) y soporte para `prefers-reduced-motion`.
* **Protección de Menores (Ley 1581 de 2012 y Ley 1098 de 2006):** Ninguna imagen ni dato personal de menores es solicitado ni publicado en el sitio web. Todos los testimonios cuentan con autorización expresa de representantes legales y protegen la identidad infantil.
