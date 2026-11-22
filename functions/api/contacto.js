/**
 * Endpoint del formulario de contacto e inscripción (RF-17 a RF-19 y RF-24).
 *
 * Cloudflare Pages Function: responde en  POST /api/contacto
 *
 * Flujo:
 *   navegador → validación → límite de envíos → guarda en D1 → avisa por correo
 *
 * Variables y bindings (se configuran en el panel de Cloudflare, ver README):
 *   DB              (binding D1, obligatorio para guardar solicitudes)
 *   RESEND_API_KEY  (secreto, opcional: aviso por correo al equipo)
 *   NOTIFY_EMAIL    (opcional: correo que recibe el aviso; en el plan gratuito de
 *                    Resend debe ser el mismo correo con el que se creó la cuenta)
 *   NOTIFY_FROM     (opcional: remitente; por defecto onboarding@resend.dev)
 *   IP_SALT         (secreto, recomendado: sal para la huella de la IP)
 *   RETENCION_DIAS  (opcional: días que se conservan las solicitudes; por defecto 365)
 *
 * La solicitud se considera recibida si queda guardada en D1 o, si D1 no está
 * disponible, si se pudo enviar el aviso por correo. Si fallan ambas, responde 503.
 */

const SERVICIOS_VALIDOS = [
  'Acompañamiento pedagógico',
  'Acompañamiento terapéutico',
  'Estimulación adecuada',
  'No sé cuál necesito',
];

/** Versión de la política de datos que aceptó la persona (queda como constancia). */
const POLITICA_VERSION = '2026-11-22';

const MAX_BYTES_CUERPO = 8 * 1024;
const MAX_SOLICITUDES_POR_HORA = 5;
const RETENCION_DIAS_POR_DEFECTO = 365;

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* =========================================================
   PUNTO DE ENTRADA
   ========================================================= */
export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return responder(405, { ok: false, error: 'metodo_no_permitido' }, { Allow: 'POST' });
  }

  if (!origenPermitido(request)) {
    return responder(403, { ok: false, error: 'origen_no_permitido' });
  }

  const tipo = (request.headers.get('Content-Type') || '').toLowerCase();
  if (!tipo.includes('application/json')) {
    return responder(415, { ok: false, error: 'tipo_no_soportado' });
  }

  const lectura = await leerJson(request);
  if (!lectura.ok) {
    return responder(lectura.estado, { ok: false, error: lectura.error });
  }

  /* Campo trampa: un bot lo llena, una persona no. Se responde "ok" sin guardar nada. */
  if (typeof lectura.datos.botcheck === 'string' && lectura.datos.botcheck.trim() !== '') {
    return responder(200, { ok: true });
  }

  const validacion = validarSolicitud(lectura.datos);
  if (!validacion.ok) {
    return responder(400, { ok: false, error: 'datos_invalidos', campo: validacion.campo, mensaje: validacion.mensaje });
  }
  const solicitud = validacion.solicitud;

  const huella = await huellaDeIp(request.headers.get('CF-Connecting-IP'), env.IP_SALT);
  const ahora = fechaIso(Date.now());

  let guardada = false;

  if (env.DB) {
    try {
      if (huella) {
        const desde = fechaIso(Date.now() - 60 * 60 * 1000);
        const fila = await env.DB
          .prepare('SELECT COUNT(*) AS n FROM solicitudes WHERE ip_hash = ? AND creado_en > ?')
          .bind(huella, desde)
          .first();
        if ((fila && fila.n) >= MAX_SOLICITUDES_POR_HORA) {
          return responder(429, {
            ok: false,
            error: 'demasiadas_solicitudes',
            mensaje: 'Recibimos varias solicitudes seguidas desde tu conexión. Inténtalo más tarde o escríbenos por WhatsApp.',
          });
        }
      }

      await env.DB
        .prepare(
          'INSERT INTO solicitudes ' +
          '(creado_en, nombre_acudiente, contacto, servicio_interes, mensaje, consentimiento, politica_version, ip_hash) ' +
          'VALUES (?, ?, ?, ?, ?, 1, ?, ?)'
        )
        .bind(ahora, solicitud.nombre, solicitud.contacto, solicitud.servicio, solicitud.mensaje, POLITICA_VERSION, huella)
        .run();
      guardada = true;
    } catch (error) {
      console.error('D1: no se pudo guardar la solicitud', error);
    }
  }

  const avisoConfigurado = Boolean(env.RESEND_API_KEY && env.NOTIFY_EMAIL);

  if (guardada) {
    if (avisoConfigurado) {
      await enSegundoPlano(context, notificarPorCorreo(env, solicitud));
    }
    if (env.DB) {
      await enSegundoPlano(context, purgarAntiguas(env));
    }
    return responder(200, { ok: true });
  }

  /* Respaldo: si no se pudo guardar, al menos que el equipo reciba el aviso. */
  if (avisoConfigurado && (await notificarPorCorreo(env, solicitud))) {
    return responder(200, { ok: true });
  }

  return responder(503, {
    ok: false,
    error: 'servicio_no_disponible',
    mensaje: 'No pudimos registrar tu solicitud en este momento. Inténtalo de nuevo o escríbenos por WhatsApp.',
  });
}

/* =========================================================
   VALIDACIÓN (la del navegador es solo comodidad; esta es la que cuenta)
   ========================================================= */

/**
 * Valida y limpia los datos recibidos.
 * @param {Record<string, unknown>} datos
 * @returns {{ok: true, solicitud: {nombre: string, contacto: string, servicio: string, mensaje: string}} |
 *           {ok: false, campo: string, mensaje: string}}
 */
function validarSolicitud(datos) {
  const nombre = limpiarLinea(datos.nombre_acudiente);
  if (nombre.length < 2 || nombre.length > 120) {
    return rechazo('nombre_acudiente', 'Escribe el nombre del acudiente (entre 2 y 120 caracteres).');
  }

  const contacto = limpiarLinea(datos.telefono_o_correo);
  if (contacto.length < 6 || contacto.length > 120 || !(REGEX_CORREO.test(contacto) || esTelefono(contacto))) {
    return rechazo('telefono_o_correo', 'Escribe un teléfono o un correo electrónico válido.');
  }

  const servicio = typeof datos.servicio_interes === 'string' ? datos.servicio_interes.trim() : '';
  if (!SERVICIOS_VALIDOS.includes(servicio)) {
    return rechazo('servicio_interes', 'Selecciona un servicio de la lista.');
  }

  const mensaje = limpiarTexto(datos.mensaje);
  if (mensaje.length < 10 || mensaje.length > 1000) {
    return rechazo('mensaje', 'Cuéntanos brevemente qué necesitas (entre 10 y 1000 caracteres).');
  }

  if (datos.consentimiento !== true) {
    return rechazo('consentimiento', 'Debes aceptar el tratamiento de datos personales para enviar la solicitud.');
  }

  return { ok: true, solicitud: { nombre, contacto, servicio, mensaje } };
}

function rechazo(campo, mensaje) {
  return { ok: false, campo, mensaje };
}

/** Teléfono: dígitos con +, espacios, guiones o paréntesis; entre 7 y 15 dígitos. */
function esTelefono(valor) {
  if (!/^[+(\d][\d\s().-]*$/.test(valor)) return false;
  const digitos = valor.replace(/\D/g, '').length;
  return digitos >= 7 && digitos <= 15;
}

/** Texto de una sola línea: sin caracteres de control y con espacios normalizados. */
function limpiarLinea(valor) {
  if (typeof valor !== 'string') return '';
  return valor.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Texto de varias líneas: conserva los saltos de línea, quita los demás caracteres de control. */
function limpiarTexto(valor) {
  if (typeof valor !== 'string') return '';
  return valor
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/* =========================================================
   LECTURA DE LA PETICIÓN
   ========================================================= */

/** Solo se aceptan peticiones que vienen del propio sitio (o sin cabecera Origin, como curl). */
function origenPermitido(request) {
  const origen = request.headers.get('Origin');
  if (!origen) return true;
  try {
    return new URL(origen).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

async function leerJson(request) {
  const declarado = Number.parseInt(request.headers.get('Content-Length') || '0', 10);
  if (declarado > MAX_BYTES_CUERPO) {
    return { ok: false, estado: 413, error: 'cuerpo_muy_grande' };
  }

  const texto = await request.text();
  if (texto.length > MAX_BYTES_CUERPO) {
    return { ok: false, estado: 413, error: 'cuerpo_muy_grande' };
  }

  try {
    const datos = JSON.parse(texto);
    if (datos === null || typeof datos !== 'object' || Array.isArray(datos)) {
      return { ok: false, estado: 400, error: 'json_invalido' };
    }
    return { ok: true, datos };
  } catch {
    return { ok: false, estado: 400, error: 'json_invalido' };
  }
}

/* =========================================================
   PRIVACIDAD, LIMPIEZA Y AVISO POR CORREO
   ========================================================= */

/**
 * Huella irreversible de la IP (SHA-256 con sal). Sirve solo para limitar envíos
 * abusivos; la IP real nunca se guarda. Devuelve null si no hay IP disponible.
 */
async function huellaDeIp(ip, sal) {
  if (!ip) return null;
  const bytes = new TextEncoder().encode(`${sal || 'open-brain'}:${ip}`);
  const resumen = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(resumen), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Elimina las solicitudes más antiguas que el plazo de conservación (Ley 1581, finalidad y temporalidad). */
async function purgarAntiguas(env) {
  try {
    const configurado = Number.parseInt(env.RETENCION_DIAS, 10);
    const dias = configurado > 0 ? configurado : RETENCION_DIAS_POR_DEFECTO;
    const limite = fechaIso(Date.now() - dias * 24 * 60 * 60 * 1000);
    await env.DB.prepare('DELETE FROM solicitudes WHERE creado_en < ?').bind(limite).run();
  } catch (error) {
    console.error('D1: no se pudo depurar solicitudes antiguas', error);
  }
}

/**
 * Avisa al equipo por correo con Resend. Nunca lanza error: devuelve true si se envió.
 * El texto va en texto plano (sin HTML) para que nada de lo escrito por el usuario se interprete.
 */
async function notificarPorCorreo(env, solicitud) {
  try {
    const cuerpo = {
      from: env.NOTIFY_FROM || 'Open Brain Web <onboarding@resend.dev>',
      to: [env.NOTIFY_EMAIL],
      subject: `Nueva solicitud: ${solicitud.nombre} — ${solicitud.servicio}`,
      text: [
        'Llegó una nueva solicitud desde el sitio web de Open Brain.',
        '',
        `Acudiente: ${solicitud.nombre}`,
        `Contacto: ${solicitud.contacto}`,
        `Servicio de interés: ${solicitud.servicio}`,
        '',
        'Mensaje:',
        solicitud.mensaje,
      ].join('\n'),
    };
    /* Si dejó un correo, "Responder" contesta directo a la familia. */
    if (REGEX_CORREO.test(solicitud.contacto)) {
      cuerpo.reply_to = solicitud.contacto;
    }

    const respuesta = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cuerpo),
    });

    if (!respuesta.ok) {
      console.error('Resend: respuesta', respuesta.status);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Resend: no se pudo enviar el aviso', error);
    return false;
  }
}

/* =========================================================
   UTILIDADES
   ========================================================= */

/** Ejecuta la tarea sin retrasar la respuesta (si el entorno lo permite). */
async function enSegundoPlano(context, tarea) {
  if (typeof context.waitUntil === 'function') {
    context.waitUntil(tarea);
  } else {
    await tarea;
  }
}

/** Fecha en formato ISO sin milisegundos, ordenable como texto (ej. 2026-11-22T15:04:05Z). */
function fechaIso(milisegundos) {
  return new Date(milisegundos).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

function responder(estado, cuerpo, cabeceras = {}) {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...cabeceras,
    },
  });
}
