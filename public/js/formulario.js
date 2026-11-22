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

/* =========================================================
   INICIALIZACIÓN
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initFormularioInscripcion();
});
 
/**
 * Inicializa el formulario de solicitud de inscripción:
 * - Bloquea el envío si no se acepta el tratamiento de datos (RF-18)
 * - Valida campos obligatorios en cliente
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
 
  /* Envío del formulario */
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
 
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }
 
    /* Capturar los datos ANTES de deshabilitar los campos:
       los campos disabled no se incluyen en FormData. */
    const datos = new FormData(form);
 
    mostrarEstadoEnvio(feedbackEl, 'enviando');
    deshabilitarFormulario(form, submitBtn, true);
 
    if (MODO_SIMULACION) {
      await simularEnvio();
      mostrarEstadoEnvio(feedbackEl, 'exito');
      form.reset();
      actualizarEstadoBoton(consentCheckbox, submitBtn);
    } else {
      await enviarSolicitud(datos, form, feedbackEl, consentCheckbox, submitBtn);
    }
 
    deshabilitarFormulario(form, submitBtn, false);
  });
}
 
/**
 * Habilita o deshabilita el botón de envío según el estado del checkbox de consentimiento.
 * @param {HTMLInputElement} checkbox
 * @param {HTMLButtonElement} button
 */
function actualizarEstadoBoton(checkbox, button) {
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
 * @param {FormData} datos  - Datos del formulario, capturados antes de deshabilitar los campos
 * @param {HTMLFormElement} form
 * @param {HTMLElement} feedbackEl
 * @param {HTMLInputElement} consentCheckbox
 * @param {HTMLButtonElement} submitBtn
 */
async function enviarSolicitud(datos, form, feedbackEl, consentCheckbox, submitBtn) {
  const solicitud = {
    nombre_acudiente: (datos.get('nombre_acudiente') || '').toString().trim(),
    telefono_o_correo: (datos.get('telefono_o_correo') || '').toString().trim(),
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
      form.reset();
      actualizarEstadoBoton(consentCheckbox, submitBtn);
    } else if (respuesta.status === 400 || respuesta.status === 429) {
      /* El servidor explica qué corregir (o que espere un momento) */
      mostrarEstadoEnvio(feedbackEl, 'error', resultado.mensaje);
    } else {
      mostrarEstadoEnvio(feedbackEl, 'error');
    }
  } catch {
    mostrarEstadoEnvio(feedbackEl, 'error');
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
 * @param {HTMLElement} el  - Contenedor del feedback con aria-live
 * @param {'enviando'|'exito'|'error'} estado
 * @param {string} [textoServidor] - Mensaje del servidor para el estado 'error' (opcional)
 */
function mostrarEstadoEnvio(el, estado, textoServidor) {
  if (!el) return;
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
 