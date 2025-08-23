// test-connection.js
// Archivo para probar la conexión completa del sistema
// Colócalo en la carpeta backend/

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Crear una app de prueba
const app = express();
app.use(cors());
app.use(express.json());

// Función para probar MongoDB
async function probarMongoDB() {
  console.log('\n🔍 PROBANDO CONEXIÓN A MONGODB...');
  
  try {
    await mongoose.connect('mongodb://localhost:27017/ferreteria_app', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Conexión a MongoDB: EXITOSA');
    
    // Verificar colecciones
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📂 Colecciones encontradas:');
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    return false;
  }
}

// Función para probar los modelos
async function probarModelos() {
  console.log('\n🔍 PROBANDO MODELOS...');
  
  try {
    // Modelo de Usuario de prueba
    const usuarioSchema = new mongoose.Schema({
      username: String,
      email: String,
      password: String,
      nombre: String,
      role: { type: String, default: 'user' }
    });
    
    const Usuario = mongoose.model('Usuario', usuarioSchema);
    console.log('✅ Modelo Usuario: OK');
    
    // Modelo de Producto de prueba
    const productoSchema = new mongoose.Schema({
      nombre: String,
      descripcion: String,
      precio: Number,
      stock: Number,
      categoria: String,
      proveedor: String,
      activo: { type: Boolean, default: true }
    });
    
    const Producto = mongoose.model('Producto', productoSchema);
    console.log('✅ Modelo Producto: OK');
    
    return { Usuario, Producto };
  } catch (error) {
    console.error('❌ Error creando modelos:', error.message);
    return null;
  }
}

// Función para insertar datos de prueba
async function insertarDatosPrueba(Usuario, Producto) {
  console.log('\n🔍 INSERTANDO DATOS DE PRUEBA...');
  
  try {
    // Limpiar colecciones primero
    await Usuario.deleteMany({});
    await Producto.deleteMany({});
    console.log('🧹 Colecciones limpiadas');
    
    // Insertar usuario de prueba
    const usuarioPrueba = new Usuario({
      username: 'test_user',
      email: 'test@test.com',
      password: 'password123',
      nombre: 'Usuario de Prueba'
    });
    await usuarioPrueba.save();
    console.log('✅ Usuario de prueba insertado');
    
    // Insertar producto de prueba
    const productoPrueba = new Producto({
      nombre: 'Martillo de Prueba',
      descripcion: 'Martillo para pruebas del sistema',
      precio: 25.99,
      stock: 10,
      categoria: 'Herramientas',
      proveedor: 'Proveedor Test'
    });
    await productoPrueba.save();
    console.log('✅ Producto de prueba insertado');
    
    return true;
  } catch (error) {
    console.error('❌ Error insertando datos:', error.message);
    return false;
  }
}

// Función para probar consultas
async function probarConsultas(Usuario, Producto) {
  console.log('\n🔍 PROBANDO CONSULTAS...');
  
  try {
    // Contar usuarios
    const totalUsuarios = await Usuario.countDocuments();
    console.log(`👥 Total usuarios: ${totalUsuarios}`);
    
    // Contar productos
    const totalProductos = await Producto.countDocuments();
    console.log(`📦 Total productos: ${totalProductos}`);
    
    // Buscar usuario
    const usuario = await Usuario.findOne({ username: 'test_user' });
    console.log('👤 Usuario encontrado:', usuario ? usuario.nombre : 'No encontrado');
    
    // Buscar producto
    const producto = await Producto.findOne({ nombre: 'Martillo de Prueba' });
    console.log('🔨 Producto encontrado:', producto ? producto.nombre : 'No encontrado');
    
    return true;
  } catch (error) {
    console.error('❌ Error en consultas:', error.message);
    return false;
  }
}

// Función para probar el servidor Express
function probarServidor() {
  console.log('\n🔍 PROBANDO SERVIDOR EXPRESS...');
  
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
      const Usuario = mongoose.model('Usuario');
      const Producto = mongoose.model('Producto');
      
      const stats = {
        usuarios: await Usuario.countDocuments(),
        productos: await Producto.countDocuments(),
        database: 'ferreteria_app',
        collections: ['usuarios', 'productos', 'clientes', 'compras']
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  const PORT = 3000;
  const server = app.listen(PORT, () => {
    console.log(`✅ Servidor Express corriendo en http://localhost:${PORT}`);
    console.log(`🔗 Prueba: http://localhost:${PORT}/api/health`);
    console.log(`📊 Estadísticas: http://localhost:${PORT}/api/stats`);
  });
  
  return server;
}

// Función principal
async function ejecutarPruebas() {
  console.log('🚀 INICIANDO PRUEBAS DEL SISTEMA');
  console.log('==================================');
  
  // 1. Probar MongoDB
  const mongoOK = await probarMongoDB();
  if (!mongoOK) {
    console.log('\n❌ PRUEBAS FALLIDAS - MongoDB no está funcionando');
    process.exit(1);
  }
  
  // 2. Probar modelos
  const modelos = await probarModelos();
  if (!modelos) {
    console.log('\n❌ PRUEBAS FALLIDAS - Error en los modelos');
    process.exit(1);
  }
  
  // 3. Insertar datos de prueba
  const datosOK = await insertarDatosPrueba(modelos.Usuario, modelos.Producto);
  if (!datosOK) {
    console.log('\n❌ PRUEBAS FALLIDAS - Error insertando datos');
    process.exit(1);
  }
  
  // 4. Probar consultas
  const consultasOK = await probarConsultas(modelos.Usuario, modelos.Producto);
  if (!consultasOK) {
    console.log('\n❌ PRUEBAS FALLIDAS - Error en las consultas');
    process.exit(1);
  }
  
  // 5. Iniciar servidor
  const server = probarServidor();
  
  console.log('\n✅ TODAS LAS PRUEBAS EXITOSAS');
  console.log('============================');
  console.log('🎉 Tu sistema está funcionando correctamente');
  console.log('\n📝 PRÓXIMOS PASOS:');
  console.log('1. Abre http://localhost:3000/api/health en tu navegador');
  console.log('2. Verifica que obtengas una respuesta JSON');
  console.log('3. Abre http://localhost:3000/api/stats para ver las estadísticas');
  console.log('4. Si todo funciona, presiona Ctrl+C y continuamos con la integración en Ionic');
  
  // Manejar cierre limpio
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 Cerrando servidor...');
    server.close();
    await mongoose.disconnect();
    console.log('✅ Desconectado de MongoDB');
    console.log('👋 ¡Hasta luego!');
    process.exit(0);
  });
}

// Ejecutar las pruebas
ejecutarPruebas().catch(error => {
  console.error('💥 ERROR GENERAL:', error);
  process.exit(1);
}); 
