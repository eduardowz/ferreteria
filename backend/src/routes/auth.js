const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// ✅ CAMBIO PRINCIPAL: Import corregido para que funcione
const { 
  authMiddleware, 
  authOptional, 
  requireAdmin,
  requireRole 
} = require('../middleware/auth'); // Cambió de 'authMiddleware' a 'auth'

console.log('📚 Cargando rutas de autenticación...');

// ============================================
// RUTAS PÚBLICAS (sin autenticación requerida)
// ============================================

/**
 * POST /api/auth/registro
 * Registrar nuevo usuario
 */
router.post('/registro', authController.registro);

/**
 * POST /api/auth/login  
 * Iniciar sesión
 */
router.post('/login', authController.login);

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

/**
 * GET /api/auth/perfil
 * Obtener perfil del usuario actual
 */
router.get('/perfil', authMiddleware, authController.perfil);

/**
 * GET /api/auth/validate
 * Validar si el token actual es válido
 */
router.get('/validate', authMiddleware, authController.validarToken);

/**
 * POST /api/auth/logout
 * Cerrar sesión (principalmente para limpieza del cliente)
 */
router.post('/logout', authMiddleware, authController.logout);

// ============================================
// RUTAS ADICIONALES RECOMENDADAS
// ============================================

/**
 * PUT /api/auth/perfil
 * Actualizar perfil del usuario actual
 * (Necesitarías agregar este método al controller)
 */
router.put('/perfil', authMiddleware, (req, res) => {
  res.status(501).json({
    success: false,
    error: 'No implementado',
    message: 'Funcionalidad de actualización de perfil pendiente de implementar'
  });
});

/**
 * POST /api/auth/cambiar-password
 * Cambiar contraseña del usuario actual
 * (Necesitarías agregar este método al controller)
 */
router.post('/cambiar-password', authMiddleware, (req, res) => {
  res.status(501).json({
    success: false,
    error: 'No implementado', 
    message: 'Funcionalidad de cambio de contraseña pendiente de implementar'
  });
});

/**
 * POST /api/auth/refresh-token
 * Renovar token de acceso
 * (Opcional - para implementar refresh tokens)
 */
router.post('/refresh-token', (req, res) => {
  res.status(501).json({
    success: false,
    error: 'No implementado',
    message: 'Funcionalidad de refresh token pendiente de implementar'
  });
});

// ============================================
// RUTAS ADMINISTRATIVAS
// ============================================

/**
 * GET /api/auth/usuarios
 * Listar todos los usuarios (solo admin)
 */
router.get('/usuarios', authMiddleware, requireAdmin, (req, res) => {
  res.status(501).json({
    success: false,
    error: 'No implementado',
    message: 'Lista de usuarios pendiente de implementar'
  });
});

/**
 * PUT /api/auth/usuarios/:id/role
 * Cambiar rol de usuario (solo admin)
 */
router.put('/usuarios/:id/role', authMiddleware, requireAdmin, (req, res) => {
  res.status(501).json({
    success: false,
    error: 'No implementado',
    message: 'Cambio de rol de usuario pendiente de implementar'
  });
});

/**
 * DELETE /api/auth/usuarios/:id
 * Desactivar/eliminar usuario (solo admin)
 */
router.delete('/usuarios/:id', authMiddleware, requireAdmin, (req, res) => {
  res.status(501).json({
    success: false,
    error: 'No implementado',
    message: 'Eliminación de usuario pendiente de implementar'
  });
});

// ============================================
// MIDDLEWARE DE MANEJO DE ERRORES
// ============================================

// Manejo de rutas no encontradas para /auth/*
router.use('*', (req, res) => {
  console.log('❌ Ruta de auth no encontrada:', req.originalUrl);
  res.status(404).json({
    success: false,
    error: 'Ruta no encontrada',
    message: `La ruta ${req.originalUrl} no existe en el módulo de autenticación`,
    availableRoutes: [
      'POST /api/auth/registro',
      'POST /api/auth/login',
      'GET /api/auth/perfil',
      'GET /api/auth/validate',
      'POST /api/auth/logout'
    ]
  });
});

// Manejo de errores específicos de autenticación
router.use((error, req, res, next) => {
  console.error('❌ Error en rutas de auth:', error);
  
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
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    message: 'Error en el módulo de autenticación'
  });
});

console.log('✅ Rutas de autenticación cargadas exitosamente');

module.exports = router;