const bcrypt = require('bcrypt');
const { query } = require('../config/db');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const seed = async () => {
  console.log('Sembrando datos de prueba...\n');

  const users = [
    {
      email: 'admin@miumg.edu.gt',
      nombre_completo: 'Admin U-SALA',
      password: 'admin123',
      role_id: 1,
    },
    {
      email: 'docente@miumg.edu.gt',
      nombre_completo: 'Carlos Méndez',
      password: 'docente123',
      role_id: 2,
    },
    {
      email: 'usuario@miumg.edu.gt',
      nombre_completo: 'Ana López',
      password: 'usuario123',
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

    console.log('\nSeed completado con éxito.');
    console.log('\nCredenciales de prueba:');
    console.log('  admin@miumg.edu.gt / admin123   → administrador');
    console.log('  docente@miumg.edu.gt / docente123 → docente');
    console.log('  usuario@miumg.edu.gt / usuario123  → usuario');
    process.exit(0);
  } catch (err) {
    console.error('Error en seed:', err.message);
    process.exit(1);
  }
};

seed();
