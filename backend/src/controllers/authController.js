 const Usuario = require('../models/Usuario');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'tu-secret-super-seguro';

// Generar token JWT
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '24h' });
};

// Registro
exports.registro = async (req, res) => {
  try {
    const { username, email, password, nombre, telefono } = req.body;

    if (!username || !email || !password || !nombre) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    // Verificar si existe
    const usuarioExistente = await Usuario.findOne({
      $or: [{ email }, { username }]
    });

    if (usuarioExistente) {
      return res.status(409).json({ error: 'El usuario o email ya existe' });
    }

    // Crear usuario
    const nuevoUsuario = new Usuario({
      username,
      email,
      password,
      nombre,
      telefono: telefono || ''
    });

    await nuevoUsuario.save();
    const token = generateToken(nuevoUsuario._id);

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      usuario: nuevoUsuario.toJSON()
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { username, password, loginType } = req.body;

    // Login de admin
    if (loginType === 'admin') {
      if (username === 'admin' && password === 'admin123') {
        const adminData = {
          _id: 'admin-id',
          username: 'admin',
          nombre: 'Administrador',
          email: 'admin@ferreteria.com',
          role: 'admin'
        };

        const token = generateToken('admin-id');
        return res.json({
          message: 'Login exitoso',
          token,
          usuario: adminData
        });
      }
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Login normal
    const usuario = await Usuario.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!usuario || !(await usuario.comparePassword(password))) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const token = generateToken(usuario._id);

    res.json({
      message: 'Login exitoso',
      token,
      usuario: usuario.toJSON()
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};
