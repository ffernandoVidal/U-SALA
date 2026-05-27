const bcrypt = require('bcrypt');
const { query } = require('../config/db');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env.local') });

/**
 * Script para recrear usuarios con contraseñas que cumplan validación fuerte
 * Ejecutar: node src/db/recreate-users.js
 */

const recreateUsers = async () => {
  console.log(' Recreando usuarios de prueba...\n');

  // Contraseñas que cumplen validación: 8+ chars, mayúscula, número, símbolo
  const users = [
    {
      email: 'admin@miumg.edu.gt',
      nombre_completo: 'Admin U-SALA',
      password: 'Admin@123',
      role_id: 1,
    },
    {
      email: 'docente@miumg.edu.gt',
      nombre_completo: 'Carlos Méndez',
      password: 'Docente@123',
      role_id: 2,
    },
    {
      email: 'usuario@miumg.edu.gt',
      nombre_completo: 'Ana López',
      password: 'Usuario@123',
      role_id: 3,
    },
  ];

  try {
    // Eliminar usuarios existentes (opcional, descomentar si quieres recrear)
    console.log('Eliminando usuarios antiguos...');
    await query('DELETE FROM usuarios WHERE email = ANY($1)', 
      [users.map(u => u.email)]);

    // Recrear usuarios
    for (const u of users) {
      const password_hash = await bcrypt.hash(u.password, 10);
      const res = await query(
        `INSERT INTO usuarios (email, nombre_completo, password_hash, role_id)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [u.email, u.nombre_completo, password_hash, u.role_id]
      );

      console.log(`✓ ${u.email} creado (id=${res.rows[0].id})`);
    }

    console.log('\n Usuarios recreados exitosamente.\n');
    console.log('Credenciales de prueba:');
    console.log('─'.repeat(50));
    users.forEach(u => {
      console.log(`  Email: ${u.email}`);
      console.log(`  Password: ${u.password}`);
      console.log('─'.repeat(50));
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
};

recreateUsers();
