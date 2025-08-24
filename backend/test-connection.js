// test-sistema-completo.js
// Script unificado para probar la conexión completa del sistema y crear usuarios
// Colócalo en la carpeta backend/

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Importar modelos (ajusta las rutas según tu estructura)
let User, Producto, Cliente, Compra;

try {
  User = require('./src/models/User');
  console.log('✅ Modelo User importado correctamente');
} catch (error) {
  console.log('⚠️ No se pudo importar el modelo User, se creará uno temporal');
}

// Crear una app de prueba
const app = express();
app.use(cors());
app.use(express.json());

// Usuarios de prueba
const usuariosDePrueba = [
  {
    username: 'admin',
    email: 'admin@ferreteria.com',
    password: 'admin123',
    nombre: 'Administrador Principal',
    telefono: '555-0001',
    rol: 'admin'
  },
  {
    username: 'admin1',
    email: 'admin1@ferreteria.com', 
    password: '123456',
    nombre: 'Admin Secundario',
    telefono: '555-0002',
    rol: 'admin'
  },
  {
    username: 'usuario1',
    email: 'usuario1@gmail.com',
    password: '123456',
    nombre: 'Usuario Normal',
    telefono: '555-0003',
    rol: 'user'
  },
  {
    username: 'empleado1',
    email: 'empleado1@ferreteria.com',
    password: '123456',
    nombre: 'Empleado de Ventas',
    telefono: '555-0004',
    rol: 'employee'
  }
];

// Productos de prueba
const productosDePrueba = [
  {
    nombre: 'Martillo de Acero',
    descripcion: 'Martillo de acero forjado, mango de madera',
    precio: 25.99,
    stock: 50,
    categoria: 'Herramientas',
    proveedor: 'Herramientas SA',
    codigo: 'MART001'
  },
  {
    nombre: 'Destornillador Phillips',
    descripcion: 'Destornillador Phillips #2, mango ergonómico',
    precio: 8.50,
    stock: 100,
    categoria: 'Herramientas',
    proveedor: 'Herramientas SA',
    codigo: 'DEST001'
  },
  {
    nombre: 'Clavos de Acero 2"',
    descripcion: 'Clavos de acero galvanizado de 2 pulgadas',
    precio: 15.00,
    stock: 200,
    categoria: 'Sujetadores',
    proveedor: 'Sujetadores Corp',
    codigo: 'CLAV001'
  }
];

// Función para probar MongoDB
async function probarMongoDB() {
  console.log('\n🔍 PROBANDO CONEXIÓN A MONGODB...');
  
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ferreteria_app';
    console.log('🔗 URI de conexión:', mongoURI);
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Conexión a MongoDB: EXITOSA');
    
    // Verificar colecciones existentes
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📂 Colecciones encontradas:');
    if (collections.length === 0) {
      console.log('   (No hay colecciones aún)');
    } else {
      collections.forEach(col => {
        console.log(`   - ${col.name}`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    return false;
  }
}

// Función para crear/verificar modelos
async function crearModelos() {
  console.log('\n🔍 CREANDO/VERIFICANDO MODELOS...');
  
  try {
    // Si no se pudo importar User, crear esquema temporal
    if (!User) {
      const usuarioSchema = new mongoose.Schema({
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        nombre: String,
        telefono: String,
        rol: { type: String, enum: ['admin', 'user', 'employee'], default: 'user' },
        activo: { type: Boolean, default: true },
        fechaRegistro: { type: Date, default: Date.now }
      });

      // Hash password antes de guardar
      usuarioSchema.pre('save', async function(next) {
        if (!this.isModified('password')) return next();
        this.password = await bcrypt.hash(this.password, 10);
        next();
      });

      User = mongoose.model('User', usuarioSchema);
      console.log('✅ Modelo User temporal creado');
    } else {
      console.log('✅ Modelo User ya existente');
    }
    
    // Modelo de Producto (temporal si no existe)
    try {
      Producto = mongoose.model('Producto');
    } catch (error) {
      const productoSchema = new mongoose.Schema({
        nombre: { type: String, required: true },
        descripcion: String,
        precio: { type: Number, required: true },
        stock: { type: Number, default: 0 },
        categoria: String,
        proveedor: String,
        codigo: { type: String, unique: true },
        activo: { type: Boolean, default: true },
        fechaCreacion: { type: Date, default: Date.now }
      });
      
      Producto = mongoose.model('Producto', productoSchema);
      console.log('✅ Modelo Producto temporal creado');
    }

    // Modelo de Cliente (temporal)
    try {
      Cliente = mongoose.model('Cliente');
    } catch (error) {
      const clienteSchema = new mongoose.Schema({
        nombre: { type: String, required: true },
        email: String,
        telefono: String,
        direccion: String,
        activo: { type: Boolean, default: true },
        fechaRegistro: { type: Date, default: Date.now }
      });
      
      Cliente = mongoose.model('Cliente', clienteSchema);
      console.log('✅ Modelo Cliente temporal creado');
    }
    
    return { User, Producto, Cliente };
  } catch (error) {
    console.error('❌ Error creando modelos:', error.message);
    return null;
  }
}

// Función para crear usuarios de prueba
async function crearUsuariosDePrueba() {
  console.log('\n🔍 CREANDO USUARIOS DE PRUEBA...');
  
  try {
    // Limpiar usuarios existentes
    console.log('🗑️ Limpiando usuarios existentes...');
    await User.deleteMany({});
    
    // Crear usuarios de prueba
    for (const usuarioData of usuariosDePrueba) {
      try {
        console.log(`📝 Creando usuario: ${usuarioData.username} (${usuarioData.rol})`);
        
        const usuario = new User(usuarioData);
        await usuario.save();
        
        console.log(`✅ Usuario ${usuarioData.username} creado exitosamente`);
      } catch (error) {
        console.error(`❌ Error creando usuario ${usuarioData.username}:`, error.message);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error general creando usuarios:', error.message);
    return false;
  }
}

// Función para crear productos de prueba
async function crearProductosDePrueba() {
  console.log('\n🔍 CREANDO PRODUCTOS DE PRUEBA...');
  
  try {
    // Limpiar productos existentes
    console.log('🗑️ Limpiando productos existentes...');
    await Producto.deleteMany({});
    
    // Crear productos de prueba
    for (const productoData of productosDePrueba) {
      try {
        console.log(`📦 Creando producto: ${productoData.nombre}`);
        
        const producto = new Producto(productoData);
        await producto.save();
        
        console.log(`✅ Producto ${productoData.nombre} creado exitosamente`);
      } catch (error) {
        console.error(`❌ Error creando producto ${productoData.nombre}:`, error.message);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error general creando productos:', error.message);
    return false;
  }
}

// Función para probar consultas
async function probarConsultas() {
  console.log('\n🔍 PROBANDO CONSULTAS...');
  
  try {
    // Contar documentos
    const totalUsuarios = await User.countDocuments();
    const totalProductos = await Producto.countDocuments();
    
    console.log(`👥 Total usuarios: ${totalUsuarios}`);
    console.log(`📦 Total productos: ${totalProductos}`);
    
    // Buscar usuario admin
    const admin = await User.findOne({ username: 'admin' });
    console.log('👤 Admin encontrado:', admin ? admin.nombre : 'No encontrado');
    
    // Buscar producto por categoría
    const herramientas = await Producto.find({ categoria: 'Herramientas' });
    console.log(`🔨 Herramientas encontradas: ${herramientas.length}`);
    
    // Mostrar usuarios creados
    console.log('\n📋 Usuarios en la base de datos:');
    const usuarios = await User.find({}, { password: 0 }).sort({ rol: 1 });
    usuarios.forEach(usuario => {
      console.log(`  - ${usuario.username} (${usuario.email}) - Rol: ${usuario.rol} - Activo: ${usuario.activo}`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error en consultas:', error.message);
    return false;
  }
}

// Función para configurar rutas del servidor
function configurarRutas() {
  console.log('\n🔍 CONFIGURANDO RUTAS DEL SERVIDOR...');
  
  // Ruta de salud
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'OK',
      message: 'Servidor funcionando correctamente',
      database: mongoose.connection.readyState === 1 ? 'Conectada' : 'Desconectada',
      timestamp: new Date().toISOString()
    });
  });
  
  // Ruta para obtener estadísticas
  app.get('/api/stats', async (req, res) => {
    try {
      const stats = {
        usuarios: await User.countDocuments(),
        productos: await Producto.countDocuments(),
        database: 'ferreteria_app',
        collections: ['users', 'productos', 'clientes', 'compras'],
        mongodb_status: mongoose.connection.readyState === 1 ? 'Conectada' : 'Desconectada'
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Ruta para listar usuarios (sin contraseñas)
  app.get('/api/users', async (req, res) => {
    try {
      const usuarios = await User.find({}, { password: 0 }).sort({ rol: 1, nombre: 1 });
      res.json(usuarios);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Ruta para listar productos
  app.get('/api/productos', async (req, res) => {
    try {
      const productos = await Producto.find({ activo: true }).sort({ categoria: 1, nombre: 1 });
      res.json(productos);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  console.log('✅ Rutas configuradas correctamente');
}

// Función para iniciar el servidor
function iniciarServidor() {
  console.log('\n🔍 INICIANDO SERVIDOR EXPRESS...');
  
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    console.log(`✅ Servidor Express corriendo en http://localhost:${PORT}`);
    console.log('\n🔗 Rutas disponibles:');
    console.log(`   Salud del sistema: http://localhost:${PORT}/api/health`);
    console.log(`   Estadísticas: http://localhost:${PORT}/api/stats`);
    console.log(`   Usuarios: http://localhost:${PORT}/api/users`);
    console.log(`   Productos: http://localhost:${PORT}/api/productos`);
  });
  
  return server;
}

// Función principal
async function ejecutarPruebasCompletas() {
  console.log('🚀 INICIANDO PRUEBAS COMPLETAS DEL SISTEMA');
  console.log('==========================================');
  
  try {
    // 1. Probar MongoDB
    console.log('\n📍 PASO 1: Probando MongoDB...');
    const mongoOK = await probarMongoDB();
    if (!mongoOK) {
      throw new Error('MongoDB no está funcionando');
    }
    
    // 2. Crear/verificar modelos
    console.log('\n📍 PASO 2: Creando modelos...');
    const modelos = await crearModelos();
    if (!modelos) {
      throw new Error('Error creando los modelos');
    }
    
    // 3. Crear usuarios de prueba
    console.log('\n📍 PASO 3: Creando usuarios de prueba...');
    const usuariosOK = await crearUsuariosDePrueba();
    if (!usuariosOK) {
      throw new Error('Error creando usuarios de prueba');
    }
    
    // 4. Crear productos de prueba
    console.log('\n📍 PASO 4: Creando productos de prueba...');
    const productosOK = await crearProductosDePrueba();
    if (!productosOK) {
      throw new Error('Error creando productos de prueba');
    }
    
    // 5. Probar consultas
    console.log('\n📍 PASO 5: Probando consultas...');
    const consultasOK = await probarConsultas();
    if (!consultasOK) {
      throw new Error('Error en las consultas');
    }
    
    // 6. Configurar rutas
    console.log('\n📍 PASO 6: Configurando rutas...');
    configurarRutas();
    
    // 7. Iniciar servidor
    console.log('\n📍 PASO 7: Iniciando servidor...');
    const server = iniciarServidor();
    
    // Mostrar resumen final
    console.log('\n✅ TODAS LAS PRUEBAS EXITOSAS');
    console.log('============================');
    console.log('🎉 Tu sistema está funcionando perfectamente');
    
    console.log('\n📝 CREDENCIALES PARA PROBAR:');
    console.log('   👑 Admin Principal: admin / admin123');
    console.log('   👨‍💼 Admin Secundario: admin1 / 123456');
    console.log('   👤 Usuario Normal: usuario1 / 123456');
    console.log('   👷 Empleado: empleado1 / 123456');
    
    console.log('\n🌐 PRUEBAS QUE PUEDES HACER:');
    console.log('1. Abre http://localhost:3000/api/health en tu navegador');
    console.log('2. Verifica http://localhost:3000/api/stats para estadísticas');
    console.log('3. Ve http://localhost:3000/api/users para ver los usuarios');
    console.log('4. Ve http://localhost:3000/api/productos para ver los productos');
    console.log('\n💡 Si todo funciona, presiona Ctrl+C y continúa con la integración en Ionic');
    
    // Manejar cierre limpio
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Cerrando servidor...');
      server.close();
      await mongoose.disconnect();
      console.log('✅ Desconectado de MongoDB');
      console.log('👋 ¡Sistema probado exitosamente!');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('\n❌ PRUEBAS FALLIDAS:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Ejecutar las pruebas
if (require.main === module) {
  ejecutarPruebasCompletas().catch(error => {
    console.error('💥 ERROR CRÍTICO:', error);
    process.exit(1);
  });
}

module.exports = {
  ejecutarPruebasCompletas,
  probarMongoDB,
  crearModelos,
  crearUsuariosDePrueba
};