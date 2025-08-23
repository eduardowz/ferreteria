const express = require('express');
const router = express.Router();
const productosController = require('../controllers/productosController');
const { authMiddleware, requireAdmin, requireRole } = require('../middleware/auth');

// Rutas públicas (sin autenticación para lectura)
router.get('/', productosController.obtenerProductos);
router.get('/buscar', productosController.buscarProductos);
router.get('/categoria/:categoria', productosController.obtenerProductosPorCategoria);
router.get('/categorias', productosController.obtenerCategorias);
router.get('/proveedores', productosController.obtenerProveedores);

// Rutas protegidas (requieren autenticación para modificaciones)
router.post('/', authMiddleware, productosController.crearProducto);
router.put('/:id', authMiddleware, productosController.actualizarProducto);
router.delete('/:id', requireAdmin, productosController.eliminarProducto); // Solo admins pueden eliminar

module.exports = router;