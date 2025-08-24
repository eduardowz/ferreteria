const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

console.log('🎮 Cargando controlador de autenticación...');

/**
 * Generar JWT Token
 */
const generarToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'clave_secreta_temporal_123',
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: 'ferreteria-app'
    }
  );
};

/**
 * Registro de nuevo usuario
 * POST /api/auth/registro
 */
const registro = async (req, res) => {
  try {
    console.log('📝 Iniciando proceso de registro...');
    console.log('📝 Datos recibidos:', { ...req.body, password: '***' });

    const { username, email, password, nombre, telefono, rol } = req.body;

    // Validaciones básicas
    if (!username || !email || !password || !nombre) {
      console.log('❌ Faltan campos requeridos');
      return res.status(400).json({
        success: false,
        error: 'Campos requeridos faltantes',
        message: 'Username, email, password y nombre son requeridos'
      });
    }

    // Verificar si el usuario ya existe
    console.log('🔍 Verificando si el usuario existe...');
    const usuarioExistente = await User.findOne({
      $or: [
        { username: username },
        { email: email.toLowerCase() }
      ]
    });

    if (usuarioExistente) {
      console.log('❌ Usuario ya existe:', usuarioExistente.username);
      return res.status(409).json({
        success: false,
        error: 'Usuario ya existe',
        message: usuarioExistente.username === username 
          ? 'El nombre de usuario ya está en uso'
          : 'El email ya está registrado'
      });
    }

    // Crear nuevo usuario
    console.log('👤 Creando nuevo usuario...');
    const nuevoUsuario = new User({
      username,
      email: email.toLowerCase(),
      password,
      nombre,
      telefono: telefono || '',
      rol: rol || 'user',
      activo: true,
      fechaRegistro: new Date()
    });

    // Guardar usuario (el middleware pre-save hasheará la contraseña)
    const usuarioGuardado = await nuevoUsuario.save();
    console.log('✅ Usuario creado exitosamente:', usuarioGuardado.username);

    // Generar token
    const token = generarToken(usuarioGuardado._id);

    // ✅ CORREGIDO: Respuesta en el formato que espera el frontend
    const usuarioRespuesta = {
      _id: usuarioGuardado._id,
      username: usuarioGuardado.username,
      email: usuarioGuardado.email,
      nombre: usuarioGuardado.nombre,
      telefono: usuarioGuardado.telefono,
      rol: usuarioGuardado.rol,
      createdAt: usuarioGuardado.createdAt,
      updatedAt: usuarioGuardado.updatedAt
    };

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token: token,
      usuario: usuarioRespuesta  // ✅ Cambiado de 'data.user' a 'usuario'
    });

  } catch (error) {
    console.error('❌ Error en registro:', error);

    // Manejar errores de validación de Mongoose
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Error de validación',
        message: 'Los datos proporcionados no son válidos',
        details: errors
      });
    }

    // Error de duplicado (por si acaso)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Usuario duplicado',
        message: 'Ya existe un usuario con ese username o email'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al registrar el usuario'
    });
  }
};

/**
 * Login de usuario - ✅ COMPLETAMENTE CORREGIDO
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    console.log('🔐 Iniciando proceso de login...');
    console.log('📝 Datos recibidos:', { username: req.body.username, password: '***' });

    const { username, password } = req.body;

    // Validar campos requeridos
    if (!username || !password) {
      console.log('❌ Faltan credenciales');
      return res.status(400).json({
        success: false,
        error: 'Credenciales incompletas',
        message: 'Username y password son requeridos'
      });
    }

    // ✅ CORREGIDO: Búsqueda mejorada con múltiples estrategias
    console.log('🔍 Buscando usuario en la base de datos...');
    console.log('🔍 Username recibido:', `"${username.trim()}"`);
    
    const usuario = await User.findOne({
      $or: [
        { username: username.trim() }, // Búsqueda exacta primero
        { username: { $regex: new RegExp(`^${username.trim()}$`, 'i') } }, // Case-insensitive
        { email: username.trim().toLowerCase() }, // Email exacto
        { email: { $regex: new RegExp(`^${username.trim()}$`, 'i') } } // Email case-insensitive
      ],
      activo: true // Simplificado
    }).select('+password');

    console.log('👤 Usuario encontrado:', usuario ? 'SÍ' : 'NO');
    
    if (usuario) {
      console.log('✅ Datos del usuario encontrado:', {
        id: usuario._id,
        username: usuario.username,
        email: usuario.email,
        rol: usuario.rol,
        activo: usuario.activo,
        hasPassword: !!usuario.password
      });
    } else {
      // Debug: buscar todos los usuarios para ver qué hay
      console.log('❌ Usuario no encontrado. Haciendo búsqueda debug...');
      const todosLosUsuarios = await User.find({}, { username: 1, email: 1, activo: 1 }).limit(5);
      console.log('📊 Usuarios disponibles en la BD:', 
        todosLosUsuarios.map(u => ({ username: u.username, email: u.email, activo: u.activo }))
      );
      
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas',
        message: 'Usuario o contraseña incorrectos'
      });
    }

    // ✅ CORREGIDO: Verificación de contraseña mejorada
    console.log('🔍 Verificando contraseña...');
    let esPasswordValida = false;

    try {
      if (usuario.password.startsWith('$2b$') || usuario.password.startsWith('$2a$')) {
        // Contraseña hasheada - usar bcrypt
        esPasswordValida = await bcrypt.compare(password, usuario.password);
        console.log('🔒 Contraseña hasheada verificada:', esPasswordValida);
      } else {
        // Contraseña en texto plano (para desarrollo/testing)
        esPasswordValida = password === usuario.password;
        console.log('⚠️ Contraseña en texto plano verificada:', esPasswordValida, `(esperaba: "${usuario.password}", recibió: "${password}")`);
      }
    } catch (bcryptError) {
      console.error('❌ Error en bcrypt.compare:', bcryptError);
      esPasswordValida = false;
    }
    
    if (!esPasswordValida) {
      console.log('❌ Contraseña incorrecta para usuario:', usuario.username);
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas',
        message: 'Usuario o contraseña incorrectos'
      });
    }

    console.log('✅ Contraseña verificada correctamente');

    // Actualizar último login
    try {
      usuario.ultimoLogin = new Date();
      await usuario.save();
      console.log('📅 Último login actualizado');
    } catch (saveError) {
      console.warn('⚠️ No se pudo actualizar último login:', saveError.message);
      // No es crítico, continuamos
    }

    // Generar token
    const token = generarToken(usuario._id);
    console.log('🎫 Token generado exitosamente');

    // ✅ CORREGIDO: Respuesta en el formato que espera el frontend
    const usuarioRespuesta = {
      _id: usuario._id,
      username: usuario.username,
      email: usuario.email,
      nombre: usuario.nombre,
      telefono: usuario.telefono,
      rol: usuario.rol,  // ✅ Usando 'rol' en lugar de 'role'
      createdAt: usuario.createdAt,
      updatedAt: usuario.updatedAt
    };

    res.json({
      success: true,
      message: 'Login exitoso',
      token: token,
      usuario: usuarioRespuesta  // ✅ Cambiado de 'data.user' a 'usuario'
    });

    console.log('🎉 Login completado exitosamente para:', usuario.username);

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al procesar el login'
    });
  }
};

/**
 * Obtener perfil del usuario actual
 * GET /api/auth/perfil
 */
const perfil = async (req, res) => {
  try {
    console.log('👤 Obteniendo perfil de usuario:', req.user.id);

    const usuario = await User.findById(req.user.id);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
        message: 'El usuario no existe'
      });
    }

    res.json({
      success: true,
      message: 'Perfil obtenido exitosamente',
      usuario: usuario  // ✅ Consistente con otras respuestas
    });

  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al obtener el perfil'
    });
  }
};

/**
 * Validar token actual
 * GET /api/auth/validate
 */
const validarToken = async (req, res) => {
  try {
    console.log('🔍 Validando token para usuario:', req.user.id);

    const usuario = await User.findById(req.user.id);
    
    if (!usuario) {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
        message: 'El token es válido pero el usuario no existe'
      });
    }

    res.json({
      success: true,
      message: 'Token válido',
      usuario: usuario,  // ✅ Consistente
      valid: true
    });

  } catch (error) {
    console.error('❌ Error validando token:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al validar el token'
    });
  }
};

/**
 * Logout (principalmente para limpieza del cliente)
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    console.log('🚪 Cerrando sesión para usuario:', req.user.id);

    res.json({
      success: true,
      message: 'Logout exitoso'
    });

  } catch (error) {
    console.error('❌ Error en logout:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al cerrar sesión'
    });
  }
};

console.log('✅ Controlador de autenticación cargado exitosamente');

module.exports = {
  registro,
  login,
  perfil,
  validarToken,
  logout
};