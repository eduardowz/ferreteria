 const express = require('express');
const router = express.Router();
const Cliente = require('../models/Cliente');

// GET - Obtener todos los clientes
router.get('/', async (req, res) => {
  try {
    const clientes = await Cliente.find({ activo: { $ne: false } });
    res.json({ 
      success: true,
      data: clientes,
      total: clientes.length 
    });
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST - Crear nuevo cliente
router.post('/', async (req, res) => {
  try {
    const nuevoCliente = new Cliente({
      ...req.body,
      fechaRegistro: new Date()
    });
    
    await nuevoCliente.save();
    
    res.status(201).json({
      success: true,
      data: nuevoCliente,
      message: 'Cliente creado exitosamente'
    });
  } catch (error) {
    console.error('Error creando cliente:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT - Actualizar cliente
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const clienteActualizado = await Cliente.findByIdAndUpdate(
      id,
      { ...req.body, fechaActualizacion: new Date() },
      { new: true }
    );
    
    if (!clienteActualizado) {
      return res.status(404).json({ 
        success: false,
        error: 'Cliente no encontrado' 
      });
    }
    
    res.json({
      success: true,
      data: clienteActualizado,
      message: 'Cliente actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando cliente:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// DELETE - Eliminar cliente
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const cliente = await Cliente.findByIdAndUpdate(
      id,
      { activo: false, fechaEliminacion: new Date() },
      { new: true }
    );
    
    if (!cliente) {
      return res.status(404).json({ 
        success: false,
        error: 'Cliente no encontrado' 
      });
    }
    
    res.json({
      success: true,
      message: 'Cliente eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando cliente:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET - Buscar clientes
router.get('/buscar', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ 
        success: false,
        error: 'Parámetro de búsqueda requerido' 
      });
    }
    
    const regex = new RegExp(q, 'i');
    
    const clientes = await Cliente.find({
      activo: { $ne: false },
      $or: [
        { 'datosGenerales.nombre': regex },
        { 'datosGenerales.correo': regex },
        { 'datosFiscales.rfc': regex }
      ]
    });
    
    res.json({ 
      success: true,
      data: clientes,
      total: clientes.length
    });
  } catch (error) {
    console.error('Error buscando clientes:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
