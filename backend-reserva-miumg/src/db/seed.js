const bcrypt = require('bcrypt');
const { query } = require('../config/db');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env.local') });

if (process.env.NODE_ENV === 'production') {
  console.error('ERROR: No ejecutes seed en produccion!');
  process.exit(1);
}

const USERS = [
  {
    email: 'admin@miumg.edu.gt',
    nombre_completo: 'Admin U-SALA',
    password: process.env.SEED_ADMIN_PASSWORD || 'Admin@123',
    role_id: 1,
  },
  {
    email: 'docente@miumg.edu.gt',
    nombre_completo: 'Carlos Mendez',
    password: process.env.SEED_DOCENTE_PASSWORD || 'Docente@123',
    role_id: 2,
  },
  {
    email: 'usuario@miumg.edu.gt',
    nombre_completo: 'Ana Lopez',
    password: process.env.SEED_USUARIO_PASSWORD || 'Usuario@123',
    role_id: 3,
  },
];

const seed = async () => {
  console.log('Sembrando datos de prueba...\n');

  try {
    const rolesRes = await query('SELECT COUNT(*) FROM roles');
    if (parseInt(rolesRes.rows[0].count) === 0) {
      await query("INSERT INTO roles (nombre) VALUES ('administrador'), ('docente'), ('usuario')");
      console.log('Roles creados.');
    } else {
      console.log('Roles ya existen.');
    }

    for (const u of USERS) {
      const existing = await query('SELECT id FROM usuarios WHERE email = $1', [u.email]);

      if (existing.rows.length > 0) {
        const password_hash = await bcrypt.hash(u.password, 10);
        await query(
          `UPDATE usuarios SET nombre_completo = $1, password_hash = $2, role_id = $3 WHERE email = $4`,
          [u.nombre_completo, password_hash, u.role_id, u.email]
        );
        console.log(`  ${u.email} actualizado (id=${existing.rows[0].id}).`);
      } else {
        const password_hash = await bcrypt.hash(u.password, 10);
        const res = await query(
          `INSERT INTO usuarios (email, nombre_completo, password_hash, role_id) VALUES ($1, $2, $3, $4) RETURNING id`,
          [u.email, u.nombre_completo, password_hash, u.role_id]
        );
        console.log(`  ${u.email} creado (id=${res.rows[0].id}).`);
      }
    }

    console.log('\nSeed completado con exito.\n');
    console.log('Credenciales de prueba:');
    console.log('-'.repeat(50));
    USERS.forEach((u) => {
      console.log(`  Email:    ${u.email}`);
      console.log(`  Password: ${u.password}`);
      console.log('-'.repeat(50));
    });

    process.exit(0);
  } catch (err) {
    console.error('Error en seed:', err.message);
    process.exit(1);
  }
};

seed();
