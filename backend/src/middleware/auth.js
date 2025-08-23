const jwt = require('jsonwebtoken');

// Configuración de JWT
const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_secreta_muy_segura_aqui';

/**
 * Middleware de autenticación principal - Token requerido
 */
const authMiddleware = (req, res, next) => {
  try {
    console.log('🔐 Verificando autenticación...');
    
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('❌ No se encontró header de autorización');
      return res.status(401).json({
        success: false,
        error: 'Token de acceso requerido',
        message: 'Debe proporcionar un token de autenticación',
        code: 'NO_TOKEN'
      });
    }

    // Verificar formato "Bearer TOKEN"
    const parts = authHeader.split(' ');
    let token;
    
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    } else if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else {
      token = authHeader;
    }

    if (!token || token === 'undefined' || token === 'null') {
      console.log('❌ Token vacío o inválido');
      return res.status(401).json({
        success: false,
        error: 'Token inválido',
        message: 'El token proporcionado no es válido',
        code: 'INVALID_TOKEN'
      });
    }

    console.log('🔍 Verificando token...');

    // Verificar y decodificar el token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('✅ Token válido para usuario:', decoded.id || decoded.userId);

    // Agregar información del usuario a la request (compatibilidad con ambos formatos)
    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role || decoded.rol || 'user',
      nombre: decoded.nombre || decoded.name
    };

    console.log('🔐 Usuario autenticado:', {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    });

    // Continuar al siguiente middleware o controlador
    next();

  } catch (error) {
    console.error('❌ Error en verificación de token:', error.message);
    
    // Manejar diferentes tipos de errores JWT
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'Token malformado',
        message: 'El formato del token no es válido',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expirado',
        message: 'Su sesión ha expirado, por favor inicie sesión nuevamente',
        code: 'EXPIRED_TOKEN',
        expiredAt: error.expiredAt
      });
    }
    
    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        success: false,
        error: 'Token no activo',
        message: 'El token aún no es válido',
        code: 'TOKEN_NOT_ACTIVE'
      });
    }

    // Error genérico
    return res.status(401).json({
      success: false,
      error: 'Error de autenticación',
      message: 'No se pudo verificar la autenticación',
      code: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware de autenticación opcional - Token no requerido
 * Si se proporciona token, lo verifica. Si no, continúa como invitado
 */
const authOptional = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || authHeader === 'undefined') {
      console.log('🚶 Acceso como invitado - sin token');
      req.user = null;
      return next();
    }

    // Verificar formato
    const parts = authHeader.split(' ');
    let token;
    
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    } else if (authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else {
      token = authHeader;
    }
    
    if (!token || token === 'undefined' || token === 'null') {
      req.user = null;
      return next();
    }
    
    // Verificar token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = {
      id: decoded.id || decoded.userId,
      email: decoded.email,
      role: decoded.role || decoded.rol || 'user',
      nombre: decoded.nombre || decoded.name
    };
    
    console.log('🔐 Usuario autenticado (opcional):', {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    });
    
    next();
    
  } catch (error) {
    // En auth opcional, si hay error, continuar como invitado
    console.log('⚠️ Token inválido, continuando como invitado:', error.message);
    req.user = null;
    next();
  }
};

/**
 * Middleware para verificar roles específicos
 * @param {string|Array} roles - Rol o array de roles permitidos
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Autenticación requerida',
        message: 'Debe iniciar sesión para acceder a este recurso'
      });
    }
    
    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Permisos insuficientes',
        message: 'No tiene los permisos necesarios para acceder a este recurso',
        requiredRoles: allowedRoles,
        userRole: userRole
      });
    }
    
    console.log('✅ Usuario con rol válido:', {
      email: req.user.email,
      role: userRole,
      requiredRoles: allowedRoles
    });
    
    next();
  };
};

/**
 * Middleware para verificar rol de administrador
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Autenticación requerida',
      message: 'Debe iniciar sesión para acceder a este recurso'
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Acceso denegado',
      message: 'Se requieren privilegios de administrador',
      userRole: req.user.role
    });
  }

  console.log('✅ Usuario admin verificado:', req.user.email);
  next();
};

/**
 * Middleware para verificar que el usuario puede acceder a sus propios recursos
 * Los admins pueden acceder a cualquier recurso
 */
const requireOwnershipOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Autenticación requerida',
      message: 'Debe iniciar sesión para acceder a este recurso'
    });
  }

  // Admin puede acceder a todo
  if (req.user.role === 'admin') {
    console.log('✅ Acceso de admin a recurso:', req.user.email);
    return next();
  }

  // Obtener ID del recurso de diferentes fuentes posibles
  const resourceUserId = req.params.userId || 
                        req.params.id || 
                        req.body.userId || 
                        req.body.id ||
                        req.query.userId;
  
  // Usuario solo puede acceder a sus propios recursos
  if (req.user.id === resourceUserId || req.user.id === parseInt(resourceUserId)) {
    console.log('✅ Acceso a recurso propio:', {
      userId: req.user.id,
      resourceId: resourceUserId
    });
    return next();
  }

  console.log('❌ Intento de acceso no autorizado:', {
    userId: req.user.id,
    resourceId: resourceUserId,
    userRole: req.user.role
  });

  return res.status(403).json({
    success: false,
    error: 'Acceso denegado',
    message: 'Solo puede acceder a sus propios recursos'
  });
};

// Alias para compatibilidad hacia atrás
const optionalAuth = authOptional;

module.exports = {
  // Middlewares principales
  authMiddleware,
  authOptional,
  optionalAuth, // Alias para compatibilidad
  
  // Middlewares de autorización
  requireRole,
  requireAdmin,
  requireOwnershipOrAdmin
};