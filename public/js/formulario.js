/**
 * Gestión del formulario de solicitud de inscripción (RF-17 a RF-24)
 * Validación en cliente, honeypot anti-spam y confirmación visual accesible.
 *
 * El envío se hace por POST a /api/contacto (functions/api/contacto.js), que valida
 * de nuevo en el servidor, guarda la solicitud en la base de datos y avisa al equipo.
 *
 * Para pruebas locales sin servidor puedes poner MODO_SIMULACION = true;
 * recuerda volver a false antes de desplegar en Cloudflare Pages.
 */

/* =========================================================
   CONFIGURACIÓN — Revisar antes de cada despliegue
   ========================================================= */

/** @type {boolean} Desactivado por defecto. Cambiar a true solo para pruebas locales. */
const MODO_SIMULACION = false;

/** Ruta del endpoint que recibe las solicitudes (mismo sitio, sin claves en el navegador). */
const ENDPOINT_CONTACTO = '/api/contacto';

/** Tiempo en milisegundos que permanece visible la notificación de éxito antes de ocultarse. */
const TIEMPO_OCULTAR_EXITO_MS = 5000;

/** Referencia al temporizador activo del banner de feedback. */
let temporizadorFeedback = null;

/* =========================================================
   REGLAS DE VALIDACIÓN ESTRICTAS
   Deben ser iguales a las de functions/api/contacto.js (la del servidor es la que cuenta).
   ========================================================= */

/** Nombre: letras (con tildes y ñ), espacios, apóstrofo, punto y guion. */
const REGEX_NOMBRE = /^\p{L}[\p{L}' .-]*$/u;

/** Celular colombiano: 10 dígitos y empieza por 3. Fijo: 10 dígitos con indicativo 60 + (1 a 8). Solo números. */
const REGEX_TELEFONO = /^(?:3\d{9}|60[1-8]\d{7})$/;

const MINIMO_LETRAS_MENSAJE = 5;

const MENSAJES_ERROR = {
  nombre: 'Escribe tu nombre usando solo letras, sin números ni símbolos. Ejemplo: María Fernanda Pérez.',
  contactoVacio: 'Escribe tu celular de 10 números o tu correo electrónico.',
  telefono: 'Escribe los 10 números de tu celular, sin espacios, guiones ni +57. Ejemplo: 3001234567.',
  correo: 'Escribe un correo válido, por ejemplo nombre@correo.com.',
  servicio: 'Selecciona un servicio de la lista.',
  mensaje: 'Cuéntanos con tus palabras qué necesitas (mínimo 10 caracteres, con letras).',
};

/** Validador de cada campo, según su id. Devuelve '' si es válido o el texto del error. */
const VALIDADORES = {
  'nombre-acudiente': validarNombre,
  'telefono-correo': validarContacto,
  'servicio-interes': validarServicio,
  mensaje: validarMensaje,
};

/* =========================================================
   INICIALIZACIÓN
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initFormularioInscripcion();
});

/**
 * Inicializa el formulario de solicitud de inscripción:
 * - Bloquea el envío si no se acepta el tratamiento de datos (RF-18)
 * - Valida con reglas estrictas (nombre solo letras, celular de 10 números o correo válido) y muestra el error junto a cada campo
 * - Envía la solicitud al endpoint /api/contacto vía fetch (RF-19)
 * - Muestra respuesta visual inmediata en pantalla (RF-24)
 */
function initFormularioInscripcion() {
  const form = document.getElementById('form-inscripcion');
  if (!form) return;

  const consentCheckbox = document.getElementById('consentimiento');
  const submitBtn = document.getElementById('btn-enviar');
  const feedbackEl = document.getElementById('form-feedback');

  /* Habilitar / deshabilitar botón de envío según casilla de consentimiento (RF-18) */
  if (consentCheckbox && submitBtn) {
    actualizarEstadoBoton(consentCheckbox, submitBtn);
    consentCheckbox.addEventListener('change', () => {
      actualizarEstadoBoton(consentCheckbox, submitBtn);
    });
  }

  activarCorreccionEnVivo(form);

  /* Envío del formulario */
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    if (!validarFormulario(form)) return;

    /* Capturar los datos ANTES de deshabilitar los campos:
       los campos disabled no se incluyen en FormData. */
    const datos = new FormData(form);

    mostrarEstadoEnvio(feedbackEl, 'enviando');
    deshabilitarFormulario(form, submitBtn, true);

    let enviadoConExito = false;

    if (MODO_SIMULACION) {
      await simularEnvio();
      mostrarEstadoEnvio(feedbackEl, 'exito');
      enviadoConExito = true;
    } else {
      enviadoConExito = await enviarSolicitud(datos, feedbackEl, consentCheckbox);
    }

    /* Primero rehabilitamos los campos y luego los limpiamos para asegurar que queden vacíos */
    deshabilitarFormulario(form, submitBtn, false);

    if (enviadoConExito) {
      limpiarFormularioCompleto(form, consentCheckbox, submitBtn);
    }
  });
}

/**
 * Limpia todos los campos, errores visuales y desmarca la casilla tras un envío exitoso.
 * @param {HTMLFormElement} form
 * @param {HTMLInputElement|null} consentCheckbox
 * @param {HTMLButtonElement|null} submitBtn
 */
function limpiarFormularioCompleto(form, consentCheckbox, submitBtn) {
  form.reset();

  Object.keys(VALIDADORES).forEach((id) => {
    const campo = form.querySelector(`#${id}`);
    if (campo) {
      campo.value = '';
      campo.removeAttribute('aria-invalid');
    }
    const errorEl = document.getElementById(`${id}-error`);
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.hidden = true;
    }
  });

  if (consentCheckbox) {
    consentCheckbox.checked = false;
  }
  if (consentCheckbox && submitBtn) {
    actualizarEstadoBoton(consentCheckbox, submitBtn);
  }
}

/**
 * Mientras la persona corrige un campo que ya tenía error, lo vuelve a validar en cada cambio
 * para quitar el aviso en cuanto queda bien. No valida al salir del campo a propósito: un aviso
 * que aparece de golpe empuja los campos de abajo y en el celular puede hacer fallar el toque
 * (por ejemplo, el de la casilla de consentimiento).
 * @param {HTMLFormElement} form
 */
function activarCorreccionEnVivo(form) {
  Object.keys(VALIDADORES).forEach((id) => {
    const campo = form.querySelector(`#${id}`);
    if (!campo) return;
    const evento = campo.tagName === 'SELECT' ? 'change' : 'input';
    campo.addEventListener(evento, () => {
      if (campo.getAttribute('aria-invalid') === 'true') validarCampo(campo);
    });
  });
}

/**
 * Valida todos los campos, muestra el error de cada uno y lleva el foco al primero inválido.
 * @param {HTMLFormElement} form
 * @returns {boolean} true si todo está correcto
 */
function validarFormulario(form) {
  const invalidos = Object.keys(VALIDADORES)
    .map((id) => form.querySelector(`#${id}`))
    .filter((campo) => campo && !validarCampo(campo));

  if (invalidos.length > 0) {
    invalidos[0].focus();
    return false;
  }
  return true;
}

/**
 * Valida un campo y muestra u oculta su mensaje de error (accesible con aria-invalid).
 * @param {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement} campo
 * @returns {boolean} true si el campo es válido
 */
function validarCampo(campo) {
  const mensaje = VALIDADORES[campo.id](campo.value);
  const errorEl = document.getElementById(`${campo.id}-error`);

  if (mensaje) {
    campo.setAttribute('aria-invalid', 'true');
  } else {
    campo.removeAttribute('aria-invalid');
  }
  if (errorEl) {
    errorEl.textContent = mensaje;
    errorEl.hidden = !mensaje;
  }
  return !mensaje;
}

/** Texto de una sola línea con espacios normalizados. */
function normalizarLinea(valor) {
  return valor.replace(/\s+/g, ' ').trim();
}

function contarLetras(valor) {
  return (valor.match(/\p{L}/gu) || []).length;
}

function validarNombre(valor) {
  const nombre = normalizarLinea(valor);
  const valido = nombre.length >= 2 && nombre.length <= 120 && REGEX_NOMBRE.test(nombre) && contarLetras(nombre) >= 2;
  return valido ? '' : MENSAJES_ERROR.nombre;
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

/** El contacto puede ser un celular/fijo de 10 números o un correo. El error depende de lo que parece escribir. */
function validarContacto(valor) {
  const contacto = normalizarLinea(valor);
  if (contacto === '') return MENSAJES_ERROR.contactoVacio;
  if (esCorreo(contacto) || REGEX_TELEFONO.test(contacto)) return '';
  return /[@A-Za-z]/.test(contacto) ? MENSAJES_ERROR.correo : MENSAJES_ERROR.telefono;
}

function validarServicio(valor) {
  return valor ? '' : MENSAJES_ERROR.servicio;
}

function validarMensaje(valor) {
  const mensaje = valor.trim();
  const valido = mensaje.length >= 10 && mensaje.length <= 1000 && contarLetras(mensaje) >= MINIMO_LETRAS_MENSAJE;
  return valido ? '' : MENSAJES_ERROR.mensaje;
}

/**
 * Habilita o deshabilita el botón de envío según el estado del checkbox de consentimiento.
 * @param {HTMLInputElement} checkbox
 * @param {HTMLButtonElement} button
 */
function actualizarEstadoBoton(checkbox, button) {
  if (!checkbox || !button) return;
  if (checkbox.checked) {
    button.removeAttribute('disabled');
    button.setAttribute('aria-disabled', 'false');
  } else {
    button.setAttribute('disabled', '');
    button.setAttribute('aria-disabled', 'true');
  }
}

/**
 * Envía la solicitud al endpoint del sitio mediante POST asíncrono (JSON).
 * @param {FormData} datos - Datos del formulario, capturados antes de deshabilitar los campos
 * @param {HTMLElement} feedbackEl
 * @param {HTMLInputElement} consentCheckbox
 * @returns {Promise<boolean>} true si el servidor confirmó la recepción
 */
async function enviarSolicitud(datos, feedbackEl, consentCheckbox) {
  const solicitud = {
    nombre_acudiente: normalizarLinea((datos.get('nombre_acudiente') || '').toString()),
    telefono_o_correo: normalizarLinea((datos.get('telefono_o_correo') || '').toString()),
    servicio_interes: (datos.get('servicio_interes') || '').toString(),
    mensaje: (datos.get('mensaje') || '').toString().trim(),
    consentimiento: Boolean(consentCheckbox && consentCheckbox.checked),
    botcheck: (datos.get('botcheck') || '').toString(),
  };

  try {
    const respuesta = await fetch(ENDPOINT_CONTACTO, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(solicitud),
    });

    const resultado = await respuesta.json().catch(() => ({}));

    if (respuesta.ok && resultado.ok) {
      mostrarEstadoEnvio(feedbackEl, 'exito');
      return true;
    } else if (respuesta.status === 400 || respuesta.status === 429) {
      /* El servidor explica qué corregir (o que espere un momento) */
      mostrarEstadoEnvio(feedbackEl, 'error', resultado.mensaje);
      return false;
    } else {
      mostrarEstadoEnvio(feedbackEl, 'error');
      return false;
    }
  } catch {
    mostrarEstadoEnvio(feedbackEl, 'error');
    return false;
  }
}

/**
 * Simula un envío con retardo de 1.5 s para pruebas locales (MODO_SIMULACION = true).
 */
function simularEnvio() {
  return new Promise((resolve) => setTimeout(resolve, 1500));
}

/**
 * Muestra el estado del formulario al usuario de forma accesible (RF-24).
 * Si el estado es 'exito', se oculta automáticamente tras 5 segundos.
 * @param {HTMLElement} el - Contenedor del feedback con aria-live
 * @param {'enviando'|'exito'|'error'} estado
 * @param {string} [textoServidor] - Mensaje del servidor para el estado 'error' (opcional)
 */
function mostrarEstadoEnvio(el, estado, textoServidor) {
  if (!el) return;

  if (temporizadorFeedback) {
    clearTimeout(temporizadorFeedback);
    temporizadorFeedback = null;
  }

  el.className = 'form-feedback';
  el.removeAttribute('hidden');

  const mensajes = {
    enviando: {
      clase: 'form-feedback--sending',
      texto: 'Enviando tu solicitud, un momento por favor…',
    },
    exito: {
      clase: 'form-feedback--success',
      texto: '¡Gracias! Hemos recibido tu solicitud. El equipo de Open Brain se pondrá en contacto contigo pronto.',
    },
    error: {
      clase: 'form-feedback--error',
      texto: 'Hubo un inconveniente al enviar tu solicitud. Por favor inténtalo de nuevo o escríbenos directamente por WhatsApp.',
    },
  };

  const { clase, texto } = mensajes[estado];
  el.classList.add(clase);
  el.textContent = estado === 'error' && textoServidor ? textoServidor : texto;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  if (estado === 'exito') {
    temporizadorFeedback = setTimeout(() => {
      el.setAttribute('hidden', '');
      el.textContent = '';
      el.className = 'form-feedback';
      temporizadorFeedback = null;
    }, TIEMPO_OCULTAR_EXITO_MS);
  }
}

/**
 * Habilita o deshabilita todos los campos y el botón de envío durante el procesamiento.
 * @param {HTMLFormElement} form
 * @param {HTMLButtonElement} button
 * @param {boolean} deshabilitar
 */
function deshabilitarFormulario(form, button, deshabilitar) {
  const campos = form.querySelectorAll('input, select, textarea, button');
  campos.forEach((campo) => {
    if (deshabilitar) {
      campo.setAttribute('disabled', '');
    } else {
      campo.removeAttribute('disabled');
    }
  });
  if (!deshabilitar && button) {
    const checkbox = form.querySelector('#consentimiento');
    actualizarEstadoBoton(checkbox, button);
  }
}