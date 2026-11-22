/**
 * Pruebas del endpoint /api/contacto.
 * Se ejecutan sin instalar nada, desde la raíz del repositorio:   node --test
 *
 * Usan una base de datos D1 simulada y un fetch simulado, así que no
 * necesitan internet ni una cuenta de Cloudflare.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

/* Se importa el archivo real de la función (sin copiarlo) mediante una URL de datos. */
const codigo = await readFile(new URL('../functions/api/contacto.js', import.meta.url), 'utf8');
const { onRequest } = await import('data:text/javascript;base64,' + Buffer.from(codigo).toString('base64'));

/* ---------- Utilidades de prueba ---------- */

const SOLICITUD_VALIDA = {
  nombre_acudiente: 'María Pérez',
  telefono_o_correo: 'maria@correo.com',
  servicio_interes: 'Estimulación adecuada',
  mensaje: 'Quisiera información sobre horarios para mi hijo.',
  consentimiento: true,
  botcheck: '',
};

function crearBD({ conteo = 0, fallaInsert = false } = {}) {
  const llamadas = [];
  return {
    llamadas,
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async first() {
              llamadas.push({ sql, args });
              return { n: conteo };
            },
            async run() {
              llamadas.push({ sql, args });
              if (fallaInsert && sql.startsWith('INSERT')) throw new Error('D1 caída');
              return { meta: { last_row_id: 1 } };
            },
          };
        },
      };
    },
  };
}

function peticion(cuerpo, { metodo = 'POST', cabeceras = {} } = {}) {
  const base = {
    'Content-Type': 'application/json',
    Origin: 'https://openbraindemo.pages.dev',
    'CF-Connecting-IP': '203.0.113.7',
  };
  return new Request('https://openbraindemo.pages.dev/api/contacto', {
    method: metodo,
    headers: { ...base, ...cabeceras },
    body: metodo === 'GET' ? undefined : typeof cuerpo === 'string' ? cuerpo : JSON.stringify(cuerpo),
  });
}

async function ejecutar(request, env = {}) {
  const respuesta = await onRequest({ request, env });
  return { estado: respuesta.status, json: await respuesta.json(), respuesta };
}

/** Sustituye fetch durante una prueba y lo restaura al terminar. */
async function conFetchSimulado(manejador, prueba) {
  const original = globalThis.fetch;
  const llamadas = [];
  globalThis.fetch = async (url, init) => {
    llamadas.push({ url, init });
    return manejador(url, init);
  };
  try {
    await prueba(llamadas);
  } finally {
    globalThis.fetch = original;
  }
}

/* ---------- Pruebas ---------- */

test('rechaza métodos distintos de POST', async () => {
  const r = await ejecutar(peticion(null, { metodo: 'GET' }));
  assert.equal(r.estado, 405);
  assert.equal(r.respuesta.headers.get('Allow'), 'POST');
});

test('rechaza peticiones que no son JSON', async () => {
  const r = await ejecutar(peticion('nombre=Ana', { cabeceras: { 'Content-Type': 'text/plain' } }));
  assert.equal(r.estado, 415);
});

test('rechaza peticiones que vienen de otro sitio (Origin distinto)', async () => {
  const r = await ejecutar(peticion(SOLICITUD_VALIDA, { cabeceras: { Origin: 'https://sitio-malicioso.com' } }), { DB: crearBD() });
  assert.equal(r.estado, 403);
});

test('rechaza JSON mal formado', async () => {
  const r = await ejecutar(peticion('{no es json'), { DB: crearBD() });
  assert.equal(r.estado, 400);
  assert.equal(r.json.error, 'json_invalido');
});

test('rechaza cuerpos demasiado grandes', async () => {
  const grande = { ...SOLICITUD_VALIDA, mensaje: 'x'.repeat(20000) };
  const r = await ejecutar(peticion(grande), { DB: crearBD() });
  assert.equal(r.estado, 413);
});

test('guarda una solicitud válida con consultas parametrizadas', async () => {
  const bd = crearBD();
  const r = await ejecutar(peticion(SOLICITUD_VALIDA), { DB: bd });
  assert.equal(r.estado, 200);
  assert.equal(r.json.ok, true);

  const insert = bd.llamadas.find((c) => c.sql.startsWith('INSERT'));
  assert.ok(insert, 'debe hacer un INSERT');
  assert.ok(!insert.sql.includes('María'), 'los datos van como parámetros, no dentro del SQL');
  assert.equal(insert.args[1], 'María Pérez');
  assert.equal(insert.args[2], 'maria@correo.com');
  assert.equal(insert.args[3], 'Estimulación adecuada');
  assert.match(insert.args[0], /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
  assert.match(insert.args[6], /^[0-9a-f]{64}$/, 'guarda la huella de la IP, no la IP');
  assert.ok(!JSON.stringify(insert.args).includes('203.0.113.7'), 'la IP real nunca se guarda');
});

test('un intento de inyección SQL se guarda como texto inofensivo', async () => {
  const bd = crearBD();
  const ataque = { ...SOLICITUD_VALIDA, nombre_acudiente: "Robert'); DROP TABLE solicitudes;--" };
  const r = await ejecutar(peticion(ataque), { DB: bd });
  assert.equal(r.estado, 200);
  const insert = bd.llamadas.find((c) => c.sql.startsWith('INSERT'));
  assert.ok(!insert.sql.includes('DROP'), 'el SQL no contiene lo que escribió el usuario');
  assert.equal(insert.args[1], "Robert'); DROP TABLE solicitudes;--");
});

test('el campo trampa (honeypot) responde ok pero no guarda nada', async () => {
  const bd = crearBD();
  const r = await ejecutar(peticion({ ...SOLICITUD_VALIDA, botcheck: 'soy un bot' }), { DB: bd });
  assert.equal(r.estado, 200);
  assert.equal(bd.llamadas.length, 0);
});

test('exige el consentimiento de tratamiento de datos', async () => {
  const bd = crearBD();
  const r = await ejecutar(peticion({ ...SOLICITUD_VALIDA, consentimiento: false }), { DB: bd });
  assert.equal(r.estado, 400);
  assert.equal(r.json.campo, 'consentimiento');
  assert.equal(bd.llamadas.length, 0);
});

test('valida cada campo del formulario', async () => {
  const casos = [
    [{ nombre_acudiente: 'A' }, 'nombre_acudiente'],
    [{ telefono_o_correo: 'abc' }, 'telefono_o_correo'],
    [{ telefono_o_correo: '12345' }, 'telefono_o_correo'],
    [{ servicio_interes: 'Servicio inventado' }, 'servicio_interes'],
    [{ mensaje: 'corto' }, 'mensaje'],
    [{ mensaje: 'x'.repeat(1001) }, 'mensaje'],
    [{ nombre_acudiente: 123 }, 'nombre_acudiente'],
  ];
  for (const [cambio, campo] of casos) {
    const r = await ejecutar(peticion({ ...SOLICITUD_VALIDA, ...cambio }), { DB: crearBD() });
    assert.equal(r.estado, 400, `debe rechazar ${campo}`);
    assert.equal(r.json.campo, campo);
  }
});

test('acepta teléfonos con formato colombiano', async () => {
  for (const telefono of ['3227606978', '+57 322 760 6978', '(607) 574-8805']) {
    const r = await ejecutar(peticion({ ...SOLICITUD_VALIDA, telefono_o_correo: telefono }), { DB: crearBD() });
    assert.equal(r.estado, 200, telefono);
  }
});

test('limita las solicitudes repetidas desde la misma conexión', async () => {
  const bd = crearBD({ conteo: 5 });
  const r = await ejecutar(peticion(SOLICITUD_VALIDA), { DB: bd });
  assert.equal(r.estado, 429);
  assert.ok(!bd.llamadas.some((c) => c.sql.startsWith('INSERT')), 'no debe insertar');
});

test('depura solicitudes más antiguas que el plazo de conservación', async () => {
  const bd = crearBD();
  await ejecutar(peticion(SOLICITUD_VALIDA), { DB: bd, RETENCION_DIAS: '30' });
  const borrado = bd.llamadas.find((c) => c.sql.startsWith('DELETE'));
  assert.ok(borrado, 'debe ejecutar el DELETE de depuración');
  const dias = (Date.now() - new Date(borrado.args[0]).getTime()) / 86400000;
  assert.ok(Math.abs(dias - 30) < 0.01, `plazo de 30 días, obtuvo ${dias}`);
});

test('con D1 disponible, envía además el aviso por correo', async () => {
  await conFetchSimulado(async () => new Response('{}', { status: 200 }), async (llamadas) => {
    const env = { DB: crearBD(), RESEND_API_KEY: 're_clave', NOTIFY_EMAIL: 'equipo@correo.com' };
    const r = await ejecutar(peticion(SOLICITUD_VALIDA), env);
    assert.equal(r.estado, 200);
    assert.equal(llamadas.length, 1);
    assert.equal(llamadas[0].url, 'https://api.resend.com/emails');
    const cuerpo = JSON.parse(llamadas[0].init.body);
    assert.deepEqual(cuerpo.to, ['equipo@correo.com']);
    assert.equal(cuerpo.reply_to, 'maria@correo.com');
    assert.equal(llamadas[0].init.headers.Authorization, 'Bearer re_clave');
  });
});

test('si el contacto es un teléfono, el aviso no lleva reply_to', async () => {
  await conFetchSimulado(async () => new Response('{}', { status: 200 }), async (llamadas) => {
    const env = { DB: crearBD(), RESEND_API_KEY: 're_clave', NOTIFY_EMAIL: 'equipo@correo.com' };
    await ejecutar(peticion({ ...SOLICITUD_VALIDA, telefono_o_correo: '3227606978' }), env);
    assert.equal(JSON.parse(llamadas[0].init.body).reply_to, undefined);
  });
});

test('si falla el aviso por correo pero se guardó, la solicitud sigue siendo exitosa', async () => {
  await conFetchSimulado(async () => new Response('error', { status: 500 }), async () => {
    const env = { DB: crearBD(), RESEND_API_KEY: 're_clave', NOTIFY_EMAIL: 'equipo@correo.com' };
    const r = await ejecutar(peticion(SOLICITUD_VALIDA), env);
    assert.equal(r.estado, 200);
  });
});

test('si D1 falla pero el correo sale, la solicitud se recibe igual', async () => {
  await conFetchSimulado(async () => new Response('{}', { status: 200 }), async (llamadas) => {
    const env = { DB: crearBD({ fallaInsert: true }), RESEND_API_KEY: 're_clave', NOTIFY_EMAIL: 'equipo@correo.com' };
    const r = await ejecutar(peticion(SOLICITUD_VALIDA), env);
    assert.equal(r.estado, 200);
    assert.equal(llamadas.length, 1);
  });
});

test('si D1 no está configurado y no hay correo, responde 503', async () => {
  const r = await ejecutar(peticion(SOLICITUD_VALIDA), {});
  assert.equal(r.estado, 503);
  assert.equal(r.json.ok, false);
});

test('si fallan D1 y el correo, responde 503', async () => {
  await conFetchSimulado(async () => new Response('error', { status: 500 }), async () => {
    const env = { DB: crearBD({ fallaInsert: true }), RESEND_API_KEY: 're_clave', NOTIFY_EMAIL: 'equipo@correo.com' };
    const r = await ejecutar(peticion(SOLICITUD_VALIDA), env);
    assert.equal(r.estado, 503);
  });
});

test('las respuestas nunca se guardan en caché', async () => {
  const r = await ejecutar(peticion(SOLICITUD_VALIDA), { DB: crearBD() });
  assert.equal(r.respuesta.headers.get('Cache-Control'), 'no-store');
});
