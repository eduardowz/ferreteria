const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();
const os = require('os');


const app = express();
const PORT = process.env.PORT || 3001;

// ===== CONFIGURACIÓN DE MIDDLEWARES =====
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(morgan('combined'));

app.use(cors({
  origin: [
    'http://localhost:8100',
    'http://localhost:4200',
    'http://localhost:3000',
    'http://localhost',
    'https://localhost',  //Pruebas en Android
    'ionic://localhost',
    'capacitor://localhost',
    'http://192.168.100.139:3001',
    'http://192.168.100.139:8100',
    'http://172.29.32.1:8100'
    
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para logging de requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// ===== CONEXIÓN A MONGODB =====
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ferreteria_app';
    
    console.log('🔄 Conectando a MongoDB...');
    console.log('📍 URI:', mongoURI);
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB conectado exitosamente');
    console.log('🏢 Base de datos:', mongoose.connection.name);
    
    // Eventos de conexión
    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB desconectado');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ Error de MongoDB:', err);
    });
    
    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconectado');
    });
    
  } catch (error) {
    console.error('❌ Error al conectar con MongoDB:', error.message);
    console.log('📦 La aplicación continuará, pero sin base de datos');
  }
};

// Conectar a la base de datos
connectDB();

// ===== RUTAS DE SALUD Y PRUEBA =====
app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const dbStatusText = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({ 
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatusText[dbStatus],
      connected: dbStatus === 1,
      name: mongoose.connection.name || 'No conectado'
    },
    server: {
      port: PORT,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    }
  });
});

app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'Conexión de prueba exitosa',
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path
  });
});

// ===== IMPORTAR Y USAR RUTAS =====
try {
  // Importar rutas
  const authRoutes = require('./src/routes/auth');
  const productosRoutes = require('./src/routes/productos');
  const clientesRoutes = require('./src/routes/clientes');

  // Usar rutas
  app.use('/api/auth', authRoutes);
  app.use('/api/productos', productosRoutes);
  app.use('/api/clientes', clientesRoutes);
  
  console.log('✅ Rutas cargadas exitosamente');
} catch (error) {
  console.error('❌ Error cargando rutas:', error.message);
  console.log('⚠️ Algunas rutas pueden no estar disponibles');
}

// ===== RUTA DE BIENVENIDA =====
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API de Ferretería - Tienda de Productos',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: {
        registro: 'POST /api/auth/registro',
        login: 'POST /api/auth/login'
      },
      productos: {
        listar: 'GET /api/productos',
        crear: 'POST /api/productos',
        actualizar: 'PUT /api/productos/:id',
        eliminar: 'DELETE /api/productos/:id',
        buscar: 'GET /api/productos?search=termino'
      },
      clientes: {
        listar: 'GET /api/clientes',
        crear: 'POST /api/clientes',
        obtener: 'GET /api/clientes/:id',
        actualizar: 'PUT /api/clientes/:id',
        eliminar: 'DELETE /api/clientes/:id',
        buscar: 'GET /api/clientes?search=termino'
      }
    },
    database: {
      connected: mongoose.connection.readyState === 1,
      name: mongoose.connection.name || 'No conectado'
    }
  });
});

// ===== MANEJO DE ERRORES 404 =====
app.use('*', (req, res) => {
  console.log(`❌ Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    success: false,
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: {
      health: '/api/health',
      test: '/api/test',
      auth: '/api/auth',
      productos: '/api/productos',
      clientes: '/api/clientes'
    }
  });
});

// ===== MANEJO DE ERRORES GLOBALES =====
app.use((error, req, res, next) => {
  console.error('❌ Error global capturado:', error);
  
  // Error de validación de MongoDB
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Error de validación',
      details: Object.values(error.errors).map(err => err.message)
    });
  }
  
  // Error de cast de MongoDB (ID inválido)
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: 'ID inválido',
      details: error.message
    });
  }
  
  // Error de duplicación de MongoDB
  if (error.code === 11000) {
    return res.status(400).json({
      success: false,
      error: 'Duplicado encontrado',
      details: 'Ya existe un registro con esos datos'
    });
  }
  
  // Error genérico
  res.status(error.status || 500).json({ 
    success: false,
    error: error.message || 'Error interno del servidor',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

 // Mostrar todas las IPs locales
  const interfaces = os.networkInterfaces();
  Object.keys(interfaces).forEach((iface) => {
    interfaces[iface].forEach((details) => {
      if (details.family === 'IPv4' && !details.internal) {
  console.log('🚀 ================================');
  console.log(`🚀 Servidor en Red Local ${PORT}`);
  console.log(`📡 URL en red local: http://${details.address}:${PORT}`);
  console.log('🚀 ================================');
      }
    });
  });

// ===== INICIAR SERVIDOR =====
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 ================================');
  console.log(`🚀 Servidor corriendo en puerto http://0.0.0.0: ${PORT}`);
  console.log('🚀 ================================');
  console.log(`📍 URL local: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🧪 Test: http://localhost:${PORT}/api/test`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`);
  console.log(`📦 Productos: http://localhost:${PORT}/api/productos`);
  console.log(`👥 Clientes: http://localhost:${PORT}/api/clientes`);
  console.log('🚀 ================================');
  
  // Log de rutas disponibles
  console.log(`📋 Rutas disponibles:`);
  console.log(`   GET    /api/health - Estado del servidor`);
  console.log(`   GET    /api/test - Prueba de conexión`);
  console.log(`   POST   /api/auth/registro - Registro de usuarios`);
  console.log(`   POST   /api/auth/login - Inicio de sesión`);
  console.log(`   GET    /api/productos - Listar productos`);
  console.log(`   POST   /api/productos - Crear producto`);
  console.log(`   PUT    /api/productos/:id - Actualizar producto`);
  console.log(`   DELETE /api/productos/:id - Eliminar producto`);
  console.log(`   GET    /api/productos?search= - Buscar productos`);
  console.log(`   GET    /api/clientes - Listar clientes`);
  console.log(`   POST   /api/clientes - Crear cliente`);
  console.log(`   GET    /api/clientes/:id - Obtener cliente`);
  console.log(`   PUT    /api/clientes/:id - Actualizar cliente`);
  console.log(`   DELETE /api/clientes/:id - Eliminar cliente`);
  console.log(`   GET    /api/clientes?search= - Buscar clientes`);
  console.log('🚀 ================================');
});

// ===== MANEJO DE CIERRE GRACEFUL =====
process.on('SIGINT', async () => {
  console.log('\n⚠️ Cerrando servidor gracefully...');
  
  // Cerrar servidor HTTP
  server.close(() => {
    console.log('✅ Servidor HTTP cerrado');
  });
  
  // Cerrar conexión MongoDB
  try {
    await mongoose.connection.close();
    console.log('✅ Conexión MongoDB cerrada');
  } catch (error) {
    console.error('❌ Error al cerrar MongoDB:', error);
  }
  
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⚠️ SIGTERM recibido, cerrando servidor...');
  
  server.close(() => {
    console.log('✅ Servidor cerrado por SIGTERM');
  });
  
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB desconectado por SIGTERM');
  } catch (error) {
    console.error('❌ Error al cerrar MongoDB por SIGTERM:', error);
  }
  
  process.exit(0);
});

// ===== MANEJO DE ERRORES NO CAPTURADOS =====
process.on('uncaughtException', (error) => {
  console.error('❌ Excepción no capturada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
  console.error('En la promesa:', promise);
});

module.exports = app;