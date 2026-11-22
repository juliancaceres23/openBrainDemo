-- =========================================================
-- Esquema de la base de datos de Open Brain (Cloudflare D1, SQLite)
--
-- Cómo aplicarlo: panel de Cloudflare → Storage & databases → D1 →
-- open-brain-db → pestaña "Console" → pega este archivo y ejecútalo.
-- Es seguro ejecutarlo más de una vez (usa IF NOT EXISTS).
-- =========================================================

CREATE TABLE IF NOT EXISTS solicitudes (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Fecha y hora UTC en que llegó la solicitud (ej. 2026-11-22T15:04:05Z)
  creado_en         TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),

  -- Datos del acudiente (nunca se piden datos del menor)
  nombre_acudiente  TEXT    NOT NULL,
  contacto          TEXT    NOT NULL,   -- teléfono o correo
  servicio_interes  TEXT    NOT NULL,
  mensaje           TEXT    NOT NULL,

  -- Constancia de la autorización (Ley 1581 de 2012)
  consentimiento    INTEGER NOT NULL CHECK (consentimiento = 1),
  politica_version  TEXT    NOT NULL,   -- versión de la política que aceptó

  -- Seguimiento interno: lo actualiza el equipo desde la consola de D1
  estado            TEXT    NOT NULL DEFAULT 'nueva'
                            CHECK (estado IN ('nueva', 'contactada', 'inscrita', 'descartada')),

  -- Huella irreversible de la IP, solo para limitar envíos abusivos
  ip_hash           TEXT
);

CREATE INDEX IF NOT EXISTS idx_solicitudes_creado_en ON solicitudes (creado_en);
CREATE INDEX IF NOT EXISTS idx_solicitudes_ip_hash   ON solicitudes (ip_hash, creado_en);
