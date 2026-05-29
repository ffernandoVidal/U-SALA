-- Migración: Mejora de tabla reservas para flujo completo

-- 1. Ampliar CHECK de estado a los 5 estados del sistema
ALTER TABLE reservas DROP CONSTRAINT IF EXISTS reservas_estado_check;
ALTER TABLE reservas ADD CONSTRAINT reservas_estado_check
  CHECK (estado IN ('pendiente', 'aprobada', 'rechazada', 'cancelada', 'finalizada'));

-- 2. Actualizar registros existentes: 'confirmada' -> 'aprobada'
UPDATE reservas SET estado = 'aprobada' WHERE estado = 'confirmada';

-- 3. Asegurar columnas base y de auditoría
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS motivo TEXT;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS rechazo_motivo TEXT;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS cancelacion_motivo TEXT;
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS aprobado_por INTEGER REFERENCES usuarios(id);
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS rechazado_por INTEGER REFERENCES usuarios(id);
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS cancelado_por INTEGER REFERENCES usuarios(id);
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS created_by INTEGER REFERENCES usuarios(id);
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES usuarios(id);
ALTER TABLE reservas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- 4. Eliminar constraint UNIQUE que impide el solapamiento (se valida por lógica, no por BD)
ALTER TABLE reservas DROP CONSTRAINT IF EXISTS no_overlap;

-- 5. Agregar índice para búsquedas de disponibilidad por recurso + tiempo
CREATE INDEX IF NOT EXISTS idx_reservas_disponibilidad
  ON reservas(recurso_id, inicio, fin)
  WHERE estado IN ('pendiente', 'aprobada');

-- 6. Agregar índice para solapamiento
DROP INDEX IF EXISTS idx_reservas_inicio_fin;
CREATE INDEX IF NOT EXISTS idx_reservas_tiempo ON reservas(inicio, fin);
