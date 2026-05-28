-- Migración: añadir columnas faltantes a tablas existentes

-- Para usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS picture VARCHAR(500);

-- Para recursos (schema nuevo con codigo, tipo, estado)
ALTER TABLE recursos ADD COLUMN IF NOT EXISTS codigo VARCHAR(50) UNIQUE;
ALTER TABLE recursos ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) NOT NULL DEFAULT 'SALON';
ALTER TABLE recursos ADD COLUMN IF NOT EXISTS estado VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE';
ALTER TABLE recursos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Asignar codigo auto-generado a recursos existentes que no tengan
UPDATE recursos SET codigo = 'REC-' || id WHERE codigo IS NULL;

-- Hacer codigo NOT NULL después de asignar valores
ALTER TABLE recursos ALTER COLUMN codigo SET NOT NULL;

-- Indices faltantes
CREATE INDEX IF NOT EXISTS idx_recursos_codigo ON recursos(codigo);
CREATE INDEX IF NOT EXISTS idx_recursos_tipo ON recursos(tipo);
CREATE INDEX IF NOT EXISTS idx_recursos_estado ON recursos(estado);
