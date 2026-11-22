/**
 * Endpoint del formulario de contacto e inscripción (RF-17 a RF-19 y RF-24).
 *
 * Cloudflare Pages Function: responde en POST /api/contacto
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

/* Reglas estrictas de formato. Mantenerlas iguales a las de public/js/formulario.js */
const REGEX_NOMBRE = /^\p{L}[\p{L}' .-]*$/u;
/** Celular colombiano: 10 dígitos y empieza por 3. Fijo: 10 dígitos con indicativo 60 + (1 a 8). Solo números. */
const REGEX_TELEFONO = /^(?:3\d{9}|60[1-8]\d{7})$/;
const MINIMO_LETRAS_MENSAJE = 5;

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
  let solicitudId = null;

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

      const resultadoDb = await env.DB
        .prepare(
          'INSERT INTO solicitudes ' +
          '(creado_en, nombre_acudiente, contacto, servicio_interes, mensaje, consentimiento, politica_version, ip_hash) ' +
          'VALUES (?, ?, ?, ?, ?, 1, ?, ?)'
        )
        .bind(ahora, solicitud.nombre, solicitud.contacto, solicitud.servicio, solicitud.mensaje, POLITICA_VERSION, huella)
        .run();

      solicitudId = resultadoDb.meta?.last_row_id ?? null;
      guardada = true;
    } catch (error) {
      console.error('D1: no se pudo guardar la solicitud', error);
    }
  }

  const solicitudConId = {
    ...solicitud,
    id: solicitudId ?? Date.now(),
    fecha: ahora,
    sitioUrl: new URL(request.url).origin,
  };

  const avisoConfigurado = Boolean(env.RESEND_API_KEY && env.NOTIFY_EMAIL);

  if (guardada) {
    if (avisoConfigurado) {
      await enSegundoPlano(context, notificarPorCorreo(env, solicitudConId));
    }
    if (env.DB) {
      await enSegundoPlano(context, purgarAntiguas(env));
    }
    return responder(200, { ok: true });
  }

  /* Respaldo: si no se pudo guardar, al menos que el equipo reciba el aviso. */
  if (avisoConfigurado && (await notificarPorCorreo(env, solicitudConId))) {
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
  if (!esNombre(nombre)) {
    return rechazo('nombre_acudiente', 'Escribe tu nombre usando solo letras, sin números ni símbolos. Ejemplo: María Fernanda Pérez.');
  }

  const contacto = limpiarLinea(datos.telefono_o_correo);
  if (!(esCorreo(contacto) || REGEX_TELEFONO.test(contacto))) {
    return rechazo('telefono_o_correo', mensajeContactoInvalido(contacto));
  }

  const servicio = typeof datos.servicio_interes === 'string' ? datos.servicio_interes.trim() : '';
  if (!SERVICIOS_VALIDOS.includes(servicio)) {
    return rechazo('servicio_interes', 'Selecciona un servicio de la lista.');
  }

  const mensaje = limpiarTexto(datos.mensaje);
  if (mensaje.length < 10 || mensaje.length > 1000 || contarLetras(mensaje) < MINIMO_LETRAS_MENSAJE) {
    return rechazo('mensaje', 'Cuéntanos con tus palabras qué necesitas (entre 10 y 1000 caracteres, con letras).');
  }

  if (datos.consentimiento !== true) {
    return rechazo('consentimiento', 'Debes aceptar el tratamiento de datos personales para enviar la solicitud.');
  }

  return { ok: true, solicitud: { nombre, contacto, servicio, mensaje } };
}

function rechazo(campo, mensaje) {
  return { ok: false, campo, mensaje };
}

/** Nombre: solo letras (con tildes y ñ), espacios, apóstrofo, punto y guion; entre 2 y 120 caracteres. */
function esNombre(valor) {
  return valor.length >= 2 && valor.length <= 120 && REGEX_NOMBRE.test(valor) && contarLetras(valor) >= 2;
}

/** Correo: parte local con letras, números y . _ % + -; dominio con etiquetas válidas y extensión de letras. */
function esCorreo(valor) {
  if (valor.length > 120 || (valor.match(/@/g) || []).length !== 1) return false;
  const [local, dominio] = valor.split('@');
  if (!/^[A-Za-z0-9._%+-]+$/.test(local) || /^\.|\.$|\.\./.test(local)) return false;
  const etiquetas = dominio.split('.');
  return (
    etiquetas.length >= 2 &&
    etiquetas.every((e) => /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(e)) &&
    /^[A-Za-z]{2,}$/.test(etiquetas[etiquetas.length - 1])
  );
}

/** Mensaje de error según lo que la persona parece estar escribiendo (correo o teléfono). */
function mensajeContactoInvalido(valor) {
  if (/[@A-Za-z]/.test(valor)) {
    return 'Escribe un correo válido, por ejemplo nombre@correo.com.';
  }
  return 'Escribe los 10 números de tu celular, sin espacios, guiones ni +57. Ejemplo: 3001234567.';
}

function contarLetras(valor) {
  return (valor.match(/\p{L}/gu) || []).length;
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

/** Escapa caracteres especiales para evitar inyección HTML/XSS en el correo. */
function escapeHtml(valor) {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Colores oficiales de las insignias de servicio de Open Brain. */
function estiloServicio(servicio) {
  switch (servicio) {
    case 'Acompañamiento pedagógico':
      return { fondo: '#F7B2CD', texto: '#28397A', borde: '#28397A' };
    case 'Acompañamiento terapéutico':
      return { fondo: '#5BC2CB', texto: '#1B2A59', borde: '#28397A' };
    case 'Estimulación adecuada':
      return { fondo: '#E36B6E', texto: '#FFFFFF', borde: '#28397A' };
    default:
      return { fondo: '#E8EDF8', texto: '#28397A', borde: '#28397A' };
  }
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
 * Incluye asunto único por solicitud e identidad visual oficial de Open Brain.
 */
async function notificarPorCorreo(env, solicitud) {
  try {
    const badge = estiloServicio(solicitud.servicio);
    const esEmail = esCorreo(solicitud.contacto);
    const enlaceContacto = esEmail
      ? `mailto:${encodeURIComponent(solicitud.contacto)}`
      : `https://wa.me/57${encodeURIComponent(solicitud.contacto)}`;
    const textoBoton = esEmail ? 'Responder al correo' : 'Escribir por WhatsApp';

    const cuerpo = {
      from: env.NOTIFY_FROM || 'Open Brain Web <onboarding@resend.dev>',
      to: [env.NOTIFY_EMAIL],
      subject: `Nueva solicitud #${solicitud.id}: ${solicitud.nombre} — ${solicitud.servicio}`,
      text: [
        'Open Brain — Club de Aprendizaje en Cúcuta',
        `Nueva solicitud recibida (#${solicitud.id})`,
        '',
        `Acudiente: ${solicitud.nombre}`,
        `Contacto: ${solicitud.contacto}`,
        `Servicio de interés: ${solicitud.servicio}`,
        '',
        'Mensaje:',
        solicitud.mensaje,
        '',
        `Autorización Ley 1581 de 2012 aceptada el ${solicitud.fecha}.`,
      ].join('\n'),
      html: `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #F4F6FB; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #28397A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F4F6FB; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #FFFFFF; border-radius: 18px; overflow: hidden; border: 2px solid #28397A; box-shadow: 0 8px 24px rgba(40, 57, 122, 0.08);">
          
          <!-- Encabezado con el azul marino y marca Open Brain -->
          <tr>
            <td style="background-color: #28397A; padding: 24px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="width: 44px; height: 44px; border-radius: 50%; background-color: #4ABBC5; border: 2px solid #FFFFFF; text-align: center; vertical-align: middle; font-size: 22px; line-height: 44px;">
                          🧠
                        </td>
                        <td style="padding-left: 12px; vertical-align: middle;">
                          <div style="font-size: 22px; font-weight: 800; line-height: 1.05; letter-spacing: -0.3px;">
                            <span style="color: #FFFFFF;">Open</span><span style="color: #E36B6E;">Brain</span><span style="color: #E36B6E; font-size: 14px;"> ♥</span>
                          </div>
                          <div style="font-size: 12px; font-weight: 700; color: #5BC2CB; margin-top: 2px;">
                            Club de Aprendizaje
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; background-color: rgba(255,255,255,0.14); color: #FFFFFF; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 700;">
                      Solicitud #${escapeHtml(solicitud.id)}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Franja decorativa tricolor (turquesa, rosa, coral) -->
          <tr>
            <td style="height: 5px; background: linear-gradient(90deg, #4ABBC5 0%, #F7B2CD 50%, #E36B6E 100%); font-size: 0; line-height: 0;">&nbsp;</td>
          </tr>

          <!-- Título principal -->
          <tr>
            <td style="padding: 28px 28px 12px;">
              <p style="margin: 0; font-size: 11px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: #4ABBC5;">
                CLUB DE APRENDIZAJE EN CÚCUTA
              </p>
              <h1 style="margin: 6px 0 0; font-size: 22px; font-weight: 800; color: #28397A; line-height: 1.25;">
                Nueva solicitud de <span style="color: #E36B6E;">inscripción y contacto</span>
              </h1>
            </td>
          </tr>

          <!-- Tabla de datos del acudiente -->
          <tr>
            <td style="padding: 12px 28px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; border-radius: 12px; border: 1px solid #E2E8F0; padding: 6px 16px;">
                <tr>
                  <td style="padding: 12px 0; width: 135px; font-size: 13px; font-weight: 700; color: #5A6B9C; border-bottom: 1px solid #E2E8F0;">
                    Acudiente:
                  </td>
                  <td style="padding: 12px 0; font-size: 15px; font-weight: 700; color: #28397A; border-bottom: 1px solid #E2E8F0;">
                    ${escapeHtml(solicitud.nombre)}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; font-size: 13px; font-weight: 700; color: #5A6B9C; border-bottom: 1px solid #E2E8F0;">
                    Contacto:
                  </td>
                  <td style="padding: 12px 0; font-size: 15px; font-weight: 600; color: #28397A; border-bottom: 1px solid #E2E8F0;">
                    <a href="${escapeHtml(enlaceContacto)}" style="color: #28397A; text-decoration: underline;">${escapeHtml(solicitud.contacto)}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 12px 0; font-size: 13px; font-weight: 700; color: #5A6B9C;">
                    Servicio:
                  </td>
                  <td style="padding: 12px 0;">
                    <span style="display: inline-block; background-color: ${badge.fondo}; color: ${badge.texto}; border: 1.5px solid ${badge.borde}; padding: 5px 14px; border-radius: 999px; font-size: 12px; font-weight: 800;">
                      ${escapeHtml(solicitud.servicio)}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Mensaje del acudiente -->
          <tr>
            <td style="padding: 8px 28px 20px;">
              <p style="margin: 0 0 8px; font-size: 13px; font-weight: 700; color: #28397A;">
                Mensaje de la familia:
              </p>
              <div style="background-color: #FFF8F9; border-left: 4px solid #E36B6E; border-radius: 8px; padding: 14px 16px; font-size: 14px; line-height: 1.55; color: #2C365E; white-space: pre-wrap;">${escapeHtml(solicitud.mensaje)}</div>
            </td>
          </tr>

          <!-- Botón de acción directa -->
          <tr>
            <td align="center" style="padding: 4px 28px 28px;">
              <a href="${escapeHtml(enlaceContacto)}" style="display: inline-block; background-color: #28397A; color: #FFFFFF; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 26px; border-radius: 999px; border: 2px solid #28397A;">
                ${escapeHtml(textoBoton)}
              </a>
            </td>
          </tr>

          <!-- Pie institucional -->
          <tr>
            <td style="background-color: #F4F6FB; padding: 16px 28px; border-top: 1px solid #E2E8F0; font-size: 11px; line-height: 1.5; color: #5A6B9C; text-align: center;">
              Autorización de tratamiento de datos personales (Ley 1581 de 2012) aceptada el <strong>${escapeHtml(solicitud.fecha)}</strong>.<br>
              Open Brain — Club de Aprendizaje • Cúcuta, Colombia
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `.trim(),
    };

    /* Si dejó un correo, "Responder" contesta directo a la familia. */
    if (esCorreo(solicitud.contacto)) {
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