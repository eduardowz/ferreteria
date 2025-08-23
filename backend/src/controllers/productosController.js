const Producto = require('../models/Producto');

// Obtener todos los productos
exports.obtenerProductos = async (req, res) => {
  try {
    console.log('🔍 Obteniendo productos...');
    
    const { search, categoria, proveedor } = req.query;
    let filtros = { activo: true };

    // Agregar filtros de búsqueda
    if (search) {
      filtros.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { descripcion: { $regex: search, $options: 'i' } },
        { categoria: { $regex: search, $options: 'i' } },
        { proveedor: { $regex: search, $options: 'i' } }
      ];
    }

    if (categoria) {
      filtros.categoria = categoria;
    }

    if (proveedor) {
      filtros.proveedor = proveedor;
    }

    const productos = await Producto.find(filtros).sort({ createdAt: -1 });
    
    console.log(`✅ ${productos.length} productos encontrados`);
    
    res.json({
      success: true,
      message: 'Productos obtenidos exitosamente',
      data: productos,
      count: productos.length
    });

  } catch (error) {
    console.error('❌ Error obteniendo productos:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener los productos'
    });
  }
};

// Buscar productos (endpoint específico para compatibilidad)
exports.buscarProductos = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: 'Parámetro de búsqueda requerido',
        message: 'Debe proporcionar un término de búsqueda'
      });
    }

    console.log('🔍 Buscando productos con término:', q);

    const productos = await Producto.find({
      activo: true,
      $or: [
        { nombre: { $regex: q, $options: 'i' } },
        { descripcion: { $regex: q, $options: 'i' } },
        { categoria: { $regex: q, $options: 'i' } },
        { proveedor: { $regex: q, $options: 'i' } }
      ]
    }).sort({ createdAt: -1 });

    console.log(`✅ ${productos.length} productos encontrados para "${q}"`);

    res.json({
      success: true,
      message: `${productos.length} productos encontrados`,
      data: productos,
      count: productos.length
    });

  } catch (error) {
    console.error('❌ Error buscando productos:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      message: 'Error en la búsqueda de productos'
    });
  }
};

// Obtener productos por categoría
exports.obtenerProductosPorCategoria = async (req, res) => {
  try {
    const { categoria } = req.params;
    
    console.log('🔍 Obteniendo productos de categoría:', categoria);

    const productos = await Producto.find({
      activo: true,
      categoria: { $regex: categoria, $options: 'i' }
    }).sort({ createdAt: -1 });

    console.log(`✅ ${productos.length} productos encontrados en categoría "${categoria}"`);

    res.json({
      success: true,
      message: `Productos de categoría ${categoria}`,
      data: productos,
      count: productos.length
    });

  } catch (error) {
    console.error('❌ Error obteniendo productos por categoría:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      message: 'Error al obtener productos por categoría'
    });
  }
};

// Crear producto
exports.crearProducto = async (req, res) => {
  try {
    console.log('📤 Creando producto:', req.body);
    
    const { nombre, descripcion, precio, stock, categoria, proveedor, image } = req.body;

    // Validaciones
    if (!nombre || !descripcion || !precio || stock === undefined || !categoria || !proveedor) {
      return res.status(400).json({ 
        success: false,
        error: 'Campos requeridos faltantes',
        message: 'Nombre, descripción, precio, stock, categoría y proveedor son requeridos'
      });
    }

    // Validar tipos de datos
    if (isNaN(precio) || parseFloat(precio) < 0) {
      return res.status(400).json({
        success: false,
        error: 'Precio inválido',
        message: 'El precio debe ser un número mayor o igual a 0'
      });
    }

    if (isNaN(stock) || parseInt(stock) < 0) {
      return res.status(400).json({
        success: false,
        error: 'Stock inválido',
        message: 'El stock debe ser un número mayor o igual a 0'
      });
    }

    // Verificar si ya existe un producto con el mismo nombre
    const productoExistente = await Producto.findOne({ 
      nombre: { $regex: `^${nombre}$`, $options: 'i' },
      activo: true 
    });

    if (productoExistente) {
      return res.status(400).json({
        success: false,
        error: 'Producto duplicado',
        message: 'Ya existe un producto con ese nombre'
      });
    }

    const nuevoProducto = new Producto({
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio: parseFloat(precio),
      stock: parseInt(stock),
      categoria: categoria.trim(),
      proveedor: proveedor.trim(),
      image: image || ''
    });

    await nuevoProducto.save();

    console.log('✅ Producto creado exitosamente:', nuevoProducto._id);

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: nuevoProducto
    });

  } catch (error) {
    console.error('❌ Error creando producto:', error);
    
    // Error de validación de MongoDB
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Error de validación',
        message: errors.join(', ')
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      message: 'No se pudo crear el producto'
    });
  }
};

// Actualizar producto
exports.actualizarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('📝 Actualizando producto:', id, req.body);

    // Validar ID
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido',
        message: 'El ID del producto no es válido'
      });
    }

    const updateData = { ...req.body };

    // Validar datos si se proporcionan
    if (updateData.precio !== undefined) {
      if (isNaN(updateData.precio) || parseFloat(updateData.precio) < 0) {
        return res.status(400).json({
          success: false,
          error: 'Precio inválido',
          message: 'El precio debe ser un número mayor o igual a 0'
        });
      }
      updateData.precio = parseFloat(updateData.precio);
    }

    if (updateData.stock !== undefined) {
      if (isNaN(updateData.stock) || parseInt(updateData.stock) < 0) {
        return res.status(400).json({
          success: false,
          error: 'Stock inválido',
          message: 'El stock debe ser un número mayor o igual a 0'
        });
      }
      updateData.stock = parseInt(updateData.stock);
    }

    // Limpiar strings si se proporcionan
    if (updateData.nombre) updateData.nombre = updateData.nombre.trim();
    if (updateData.descripcion) updateData.descripcion = updateData.descripcion.trim();
    if (updateData.categoria) updateData.categoria = updateData.categoria.trim();
    if (updateData.proveedor) updateData.proveedor = updateData.proveedor.trim();

    // Verificar duplicados por nombre si se actualiza el nombre
    if (updateData.nombre) {
      const productoExistente = await Producto.findOne({ 
        nombre: { $regex: `^${updateData.nombre}$`, $options: 'i' },
        activo: true,
        _id: { $ne: id }
      });

      if (productoExistente) {
        return res.status(400).json({
          success: false,
          error: 'Producto duplicado',
          message: 'Ya existe otro producto con ese nombre'
        });
      }
    }

    const producto = await Producto.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!producto) {
      return res.status(404).json({ 
        success: false,
        error: 'Producto no encontrado',
        message: 'El producto especificado no existe'
      });
    }

    console.log('✅ Producto actualizado exitosamente:', producto._id);

    res.json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: producto
    });

  } catch (error) {
    console.error('❌ Error actualizando producto:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: 'Error de validación',
        message: errors.join(', ')
      });
    }

    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      message: 'No se pudo actualizar el producto'
    });
  }
};

// Eliminar producto (soft delete)
exports.eliminarProducto = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🗑️ Eliminando producto:', id);

    // Validar ID
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: 'ID inválido',
        message: 'El ID del producto no es válido'
      });
    }

    const producto = await Producto.findByIdAndUpdate(
      id,
      { activo: false },
      { new: true }
    );

    if (!producto) {
      return res.status(404).json({ 
        success: false,
        error: 'Producto no encontrado',
        message: 'El producto especificado no existe'
      });
    }

    console.log('✅ Producto eliminado exitosamente:', producto._id);

    res.json({ 
      success: true,
      message: 'Producto eliminado exitosamente',
      data: producto
    });

  } catch (error) {
    console.error('❌ Error eliminando producto:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      message: 'No se pudo eliminar el producto'
    });
  }
};

// Obtener categorías disponibles
exports.obtenerCategorias = async (req, res) => {
  try {
    console.log('📂 Obteniendo categorías...');
    
    const categorias = await Producto.distinct('categoria', { activo: true });
    
    console.log(`✅ ${categorias.length} categorías encontradas`);
    
    res.json({
      success: true,
      message: 'Categorías obtenidas exitosamente',
      data: categorias,
      count: categorias.length
    });

  } catch (error) {
    console.error('❌ Error obteniendo categorías:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener las categorías'
    });
  }
};

// Obtener proveedores disponibles
exports.obtenerProveedores = async (req, res) => {
  try {
    console.log('🏢 Obteniendo proveedores...');
    
    const proveedores = await Producto.distinct('proveedor', { activo: true });
    
    console.log(`✅ ${proveedores.length} proveedores encontrados`);
    
    res.json({
      success: true,
      message: 'Proveedores obtenidos exitosamente',
      data: proveedores,
      count: proveedores.length
    });

  } catch (error) {
    console.error('❌ Error obteniendo proveedores:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener los proveedores'
    });
  }
};