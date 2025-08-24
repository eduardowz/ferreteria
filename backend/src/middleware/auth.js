const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Ajusta la ruta según tu estructura

console.log('🔐 Cargando middleware de autenticación...');

/**
 * Middleware principal de autenticación
 * Requiere que el usuario esté autenticado
 */
const authMiddleware = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: 'Acceso denegado',
        message: 'No se proporcionó token de autenticación'
      });
    }

    // Verificar formato del token (Bearer token)
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Acceso denegado',
        message: 'Token de autenticación requerido'
      });
    }

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Opcional: Verificar que el usuario aún existe en la base de datos
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
        message: 'El usuario asociado al token no existe'
      });
    }

    // Verificar que el usuario esté activo
    if (!user.activo) {
      return res.status(401).json({
        success: false,
        error: 'Usuario inactivo',
        message: 'Su cuenta ha sido desactivada'
      });
    }

    // Agregar información del usuario al request
    req.user = {
      id: user._id,
      username: user.username,
      email: user.email,
      rol: user.rol,
      activo: user.activo
    };

    next();
  } catch (error) {
    console.error('❌ Error en authMiddleware:', error);
    
    // Manejar errores específicos de JWT
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
        message: 'El token de autenticación no es válido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado',
        message: 'Su sesión ha expirado, por favor inicie sesión nuevamente'
      });
    }
    
    // Error genérico
    return res.status(500).json({
      success: false,
      error: 'Error interno',
      message: 'Error al verificar la autenticación'
    });
  }
};

/**
 * Middleware de autenticación opcional
 * No requiere autenticación, pero si hay token válido, agrega info del usuario
 */
const authOptional = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return next(); // Continuar sin usuario
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.slice(7) 
      : authHeader;

    if (!token) {
      return next(); // Continuar sin usuario
    }

    // Intentar decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (user && user.activo) {
      req.user = {
        id: user._id,
        username: user.username,
        email: user.email,
        rol: user.rol,
        activo: user.activo
      };
    }

    next();
  } catch (error) {
    // En caso de error, simplemente continuar sin usuario
    console.log('ℹ️ Token opcional inválido, continuando sin autenticación');
    next();
  }
};

/**
 * Middleware que requiere rol de administrador
 * Debe usarse después de authMiddleware
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'No autenticado',
      message: 'Debe estar autenticado para acceder a esta ruta'
    });
  }

  if (req.user.rol !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Acceso prohibido',
      message: 'Se requieren permisos de administrador para esta acción'
    });
  }

  next();
};

/**
 * Middleware que requiere un rol específico
 * Debe usarse después de authMiddleware
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado',
        message: 'Debe estar autenticado para acceder a esta ruta'
      });
    }

    // Permitir admin para cualquier rol
    if (req.user.rol === 'admin') {
      return next();
    }

    // Verificar rol específico
    if (req.user.rol !== requiredRole) {
      return res.status(403).json({
        success: false,
        error: 'Acceso prohibido',
        message: `Se requiere rol de ${requiredRole} para esta acción`
      });
    }

    next();
  };
};

/**
 * Middleware que requiere múltiples roles permitidos
 * Debe usarse después de authMiddleware
 */
const requireRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado',
        message: 'Debe estar autenticado para acceder a esta ruta'
      });
    }

    // Admin siempre tiene acceso
    if (req.user.rol === 'admin') {
      return next();
    }

    // Verificar si el rol del usuario está en los roles permitidos
    if (!allowedRoles.includes(req.user.rol)) {
      return res.status(403).json({
        success: false,
        error: 'Acceso prohibido',
        message: `Se requiere uno de estos roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
};

/**
 * Middleware que verifica si el usuario puede acceder a su propio recurso o es admin
 * Útil para rutas como /usuarios/:id donde solo el propio usuario o admin pueden acceder
 */
const requireOwnershipOrAdmin = (userIdParam = 'id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'No autenticado',
        message: 'Debe estar autenticado para acceder a esta ruta'
      });
    }

    const targetUserId = req.params[userIdParam];
    const currentUserId = req.user.id.toString();

    // Admin puede acceder a cualquier recurso
    if (req.user.rol === 'admin') {
      return next();
    }

    // El usuario puede acceder solo a sus propios recursos
    if (targetUserId === currentUserId) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'Acceso prohibido',
      message: 'Solo puede acceder a sus propios recursos'
    });
  };
};

console.log('✅ Middleware de autenticación cargado exitosamente');

module.exports = {
  authMiddleware,
  authOptional,
  requireAdmin,
  requireRole,
  requireRoles,
  requireOwnershipOrAdmin
};