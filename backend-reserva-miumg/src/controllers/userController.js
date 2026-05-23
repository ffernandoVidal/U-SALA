const { findAllUsers, updateUser, findUserById } = require('../services/userService');

const getUsuarios = async (req, res, next) => {
  try {
    const usuarios = await findAllUsers();
    res.json(usuarios);
  } catch (error) {
    next(error);
  }
};

const updateUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre_completo, email, role_id } = req.body;

    const existing = await findUserById(id);
    if (!existing) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (role_id !== undefined && ![1, 2, 3].includes(Number(role_id))) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    const updated = await updateUser(id, { nombre_completo, email, role_id });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsuarios, updateUsuario };
