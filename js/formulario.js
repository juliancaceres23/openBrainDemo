/**
 * Gestión del formulario de solicitud de inscripción (RF-17 a RF-24)
 * Integración con Web3Forms, validación en cliente, honeypot anti-spam
 * y confirmación visual accesible en pantalla.
 *
 * IMPORTANTE ANTES DE DESPLEGAR:
 * 1. Crea js/config.js a partir de js/config.example.js con tu clave real de https://web3forms.com
 * 2. Asegúrate de que MODO_SIMULACION esté en false (valor por defecto seguro).
 *
 * Para pruebas locales puedes poner MODO_SIMULACION = true;
 * Recuerda volver a false antes de desplegar en Cloudflare Pages.
 */
 
/* =========================================================
   CONFIGURACIÓN — Revisar antes de cada despliegue
   ========================================================= */
 
/** @type {boolean} Desactivado por defecto. Cambiar a true solo para pruebas locales. */
const MODO_SIMULACION = false;
 
/**
 * La clave de Web3Forms se lee de js/config.js (archivo local ignorado por Git).
 * Si no existe, el formulario muestra el mensaje de error en vez de enviar.
 * @type {string|undefined}
 */
const WEB3FORMS_ACCESS_KEY =
  typeof CONFIG !== 'undefined' ? CONFIG.WEB3FORMS_ACCESS_KEY : undefined;
 
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
 * - Envía el formulario a Web3Forms vía fetch (RF-19)
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
      await enviarConWeb3Forms(datos, form, feedbackEl, consentCheckbox, submitBtn);
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
 * Envía el formulario a Web3Forms mediante POST asíncrono.
 * @param {FormData} datos  - Datos del formulario, capturados antes de deshabilitar los campos
 * @param {HTMLFormElement} form
 * @param {HTMLElement} feedbackEl
 * @param {HTMLInputElement} consentCheckbox
 * @param {HTMLButtonElement} submitBtn
 */
async function enviarConWeb3Forms(datos, form, feedbackEl, consentCheckbox, submitBtn) {
  if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY.startsWith('[PENDIENTE')) {
    console.error('Falta js/config.js con WEB3FORMS_ACCESS_KEY (ver js/config.example.js).');
    mostrarEstadoEnvio(feedbackEl, 'error');
    return;
  }
 
  const nombre   = (datos.get('nombre_acudiente') || '').toString().trim();
  const servicio = (datos.get('servicio_interes') || '').toString();
  const contacto = (datos.get('telefono_o_correo') || '').toString().trim();
  const fecha    = new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });

  datos.set('access_key', WEB3FORMS_ACCESS_KEY);
  datos.set('subject', `Nueva solicitud: ${nombre} — ${servicio} (${fecha})`);
  datos.set('from_name', 'Open Brain · Sitio web');

  /* Si el acudiente escribió un correo, "Responder" en Gmail le contesta directo a él */
  if (/^\S+@\S+\.\S+$/.test(contacto)) {
    datos.set('replyto', contacto);
  }

datos.delete('consentimiento');
 
  try {
    const respuesta = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: datos,
    });
 
    const resultado = await respuesta.json();
 
    if (respuesta.ok && resultado.success) {
      mostrarEstadoEnvio(feedbackEl, 'exito');
      form.reset();
      actualizarEstadoBoton(consentCheckbox, submitBtn);
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
 */
function mostrarEstadoEnvio(el, estado) {
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
  el.textContent = texto;
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
 