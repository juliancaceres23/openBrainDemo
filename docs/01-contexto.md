# Contexto del proyecto

Fuente: documento del proyecto "Desarrollo de una Plataforma Web para la Difusión de la Oferta Académica de Open Brain" (UFPS, Ingeniería de Sistemas, Seminario Integrador 2, periodo 2026-2).

## La organización
Open Brain es una organización de carácter pluralista en Cúcuta que promueve la inclusión y mejora el entendimiento de las dificultades específicas de aprendizaje de niños, niñas y adolescentes. También ofrece orientación y capacitación informal a familias y profesionales de la educación.
- Dirección: CL 2N N.º 14E-102, barrio Villa Prado, Cúcuta, Norte de Santander, Colombia.
- Equipo: tres profesores, uno de ellos representante legal, que también asumen las tareas administrativas.
- Servicios: acompañamiento pedagógico, acompañamiento terapéutico y estimulación adecuada.

## Problema
Falta de centralización y visibilidad digital de la oferta académica de Open Brain, lo que limita el acceso oportuno de las familias a la información y a los canales de inscripción. Hoy la promoción y las solicitudes de inscripción dependen de llamadas, mensajería instantánea, redes sociales informales y contacto manual. No tienen sitio web ni aparecen en buscadores ni en mapas.

**Pregunta problema:** ¿Cómo lograr la centralización y visibilidad de la oferta académica de la empresa Open Brain, garantizando el acceso desde cualquier dispositivo y facilitando la atención al usuario y la recepción de solicitudes de inscripción?

## Solución
Plataforma web con arquitectura cliente-servidor y diseño responsivo que centraliza en un único punto de acceso la oferta académica y los canales de contacto para recibir solicitudes de inscripción. Está organizada en cuatro módulos, que corresponden a las cuatro pantallas del prototipo (celular y escritorio):
1. **Inicio:** bienvenida, imagen de la sede (sin menores), dos acciones (ver servicios / escribir por WhatsApp), teléfono y correo visibles, accesos directos a los tres servicios.
2. **Servicios y horarios:** los tres servicios con descripción, edades y modalidades; horarios y tarifas por servicio; botón para solicitar información.
3. **Equipo y testimonios:** presentación del equipo profesional, testimonios (solo con autorización de los representantes legales, Ley 1581 de 2012) y preguntas frecuentes desplegables.
4. **Contacto y solicitud de inscripción:** formulario (nombre del acudiente, teléfono o correo, servicio de interés y mensaje), casilla de aceptación del tratamiento de datos, mapa con la dirección, teléfono, correo y horario, pasos para inscribirse y mensaje que invita a consultar cupos por WhatsApp.

Todos los módulos comparten la misma barra de navegación con el logo de Open Brain y un botón de WhatsApp presente en cada pantalla.

**Disposición según dispositivo:** en computador, los tres servicios aparecen lado a lado, horarios y tarifas en una columna lateral, y el formulario junto al mapa y los datos de contacto. En celular, todo en una sola columna y los botones a lo ancho de la pantalla.

**La plataforma NO matricula:** solo recibe solicitudes de inscripción y explica los pasos. No confirma cupos ni cobra; esos pasos siguen por contacto directo con el equipo de Open Brain. No se solicitan datos personales de los menores.

## Hallazgos de la fase de empatía (para decisiones de diseño)
- Las familias buscan desde el celular, comparan opciones en Google y esperan respuesta rápida.
- Llegan con incertidumbre y ansiedad; los testimonios, la presentación del equipo y la respuesta rápida les dan confianza.
- Quieren consultar la oferta a cualquier hora, sin esperar el horario de atención telefónica.
- Mucha gente que no está familiarizada con la tecnología debe poder usar el sitio (accesibilidad web básica).

## Objetivos
- **General:** desarrollar una plataforma web para la centralización y visibilidad de la oferta académica de Open Brain.
- **Específicos:** (1) analizar los requerimientos funcionales de la oferta de servicios; (2) diseñar una plataforma responsiva con accesibilidad fluida desde cualquier dispositivo; (3) integrar canales de contacto directo que faciliten la atención y la recepción de solicitudes de inscripción.

## Beneficiarios
- Directos: familias interesadas en los servicios; equipo docente de Open Brain (menor carga operativa).
- Indirectos: niños, niñas y adolescentes atendidos (no usan la plataforma).

## Alcance
Incluye: catálogo de servicios, teléfono, correo, pasos de inscripción, horarios, tarifas y preguntas frecuentes; información institucional (presentación, ubicación, equipo, testimonios); canales de contacto directo (formulario o enlace a mensajería); diseño responsivo (móvil y escritorio).

## Fuera de alcance
Pasarelas de pago; diagnósticos médicos o pedagógicos en línea; panel de administración (el contenido lo actualiza un responsable técnico mediante solicitud); módulo de notas, seguimiento académico o historiales clínicos; autenticación o áreas privadas; matrícula y confirmación de cupos en línea (la plataforma solo recibe solicitudes de inscripción).

## Ideas descartadas (NO implementar)
Campaña de publicidad pagada, transmisión en vivo, traducción del sitio, chatbot con IA, app móvil nativa y blog de sensibilización.
