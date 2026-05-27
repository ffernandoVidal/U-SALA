const bcrypt = require('bcrypt');
const { query } = require('../config/db');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env.local') });

// IMPORTANTE: Este script de seed SOLO se debe ejecutar en desarrollo
if (process.env.NODE_ENV === 'production') {
  console.error('❌ ERROR: No ejecutes seed en producción!');
  process.exit(1);
}

const seed = async () => {
  console.log('Sembrando datos de prueba...\n');

  const users = [
    {
      email: 'admin@miumg.edu.gt',
      nombre_completo: 'Admin U-SALA',
      password: process.env.SEED_ADMIN_PASSWORD || 'admin123temporal',
      role_id: 1,
    },
    {
      email: 'docente@miumg.edu.gt',
      nombre_completo: 'Carlos Méndez',
      password: process.env.SEED_DOCENTE_PASSWORD || 'docente123temporal',
      role_id: 2,
    },
    {
      email: 'usuario@miumg.edu.gt',
      nombre_completo: 'Ana López',
      password: process.env.SEED_USUARIO_PASSWORD || 'usuario123temporal',
      role_id: 3,
    },
  ];

  try {
    const rolesRes = await query('SELECT COUNT(*) FROM roles');
    if (parseInt(rolesRes.rows[0].count) === 0) {
      await query(`INSERT INTO roles (nombre) VALUES ('administrador'), ('docente'), ('usuario')`);
      console.log('Roles creados.');
    } else {
      console.log('Roles ya existen.');
    }

    for (const u of users) {
      const existing = await query('SELECT id FROM usuarios WHERE email = $1', [u.email]);
      if (existing.rows.length > 0) {
        console.log(`  ${u.email} ya existe (id=${existing.rows[0].id}).`);
        continue;
      }

      const password_hash = await bcrypt.hash(u.password, 10);
      const res = await query(
        `INSERT INTO usuarios (email, nombre_completo, password_hash, role_id)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [u.email, u.nombre_completo, password_hash, u.role_id]
      );

      console.log(`  ${u.email} creado (id=${res.rows[0].id}).`);
    }

    console.log('\n✓ Seed completado con éxito.');
    console.log('\nCredenciales de prueba (desde .env.local):');
    console.log('  admin@miumg.edu.gt →', users[0].password);
    console.log('  docente@miumg.edu.gt →', users[1].password);
    console.log('  usuario@miumg.edu.gt →', users[2].password);
    console.log('\n⚠️  CAMBIAR ESTAS CONTRASEÑAS EN PRODUCCIÓN');
    process.exit(0);
  } catch (err) {
    console.error('Error en seed:', err.message);
    process.exit(1);
  }
};

seed();
