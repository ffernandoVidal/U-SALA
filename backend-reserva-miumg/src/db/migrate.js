const { query } = require('../config/db');

const migrate = async () => {
  console.log('Ejecutando migraciones...\n');

  try {
    await query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`);
    console.log('  updated_at añadido a usuarios');

    await query(`ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS picture VARCHAR(500)`);
    console.log('  picture añadido a usuarios');

    await query(`ALTER TABLE recursos ADD COLUMN IF NOT EXISTS codigo VARCHAR(50) UNIQUE`);
    console.log('  codigo añadido a recursos');

    await query(`ALTER TABLE recursos ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) NOT NULL DEFAULT 'SALON'`);
    console.log('  tipo añadido a recursos');

    await query(`ALTER TABLE recursos ADD COLUMN IF NOT EXISTS estado VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE'`);
    console.log('  estado añadido a recursos');

    await query(`ALTER TABLE recursos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`);
    console.log('  updated_at añadido a recursos');

    await query(`UPDATE recursos SET codigo = 'REC-' || id WHERE codigo IS NULL`);
    console.log('  codigo generado para recursos existentes');

    await query(`ALTER TABLE recursos ALTER COLUMN codigo SET NOT NULL`);
    console.log('  codigo ahora es NOT NULL');

    await query(`CREATE INDEX IF NOT EXISTS idx_recursos_codigo ON recursos(codigo)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_recursos_tipo ON recursos(tipo)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_recursos_estado ON recursos(estado)`);
    console.log('  indices creados');

    console.log('\n Migraciones completadas exitosamente.');
    process.exit(0);
  } catch (err) {
    console.error('Error en migracion:', err.message);
    process.exit(1);
  }
};

migrate();
