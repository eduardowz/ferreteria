const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

console.log('👤 Cargando modelo de Usuario...');

// Esquema del Usuario (corregido para funcionar con el middleware)
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'El nombre de usuario es requerido'],
    unique: true,
    trim: true,
    minlength: [3, 'El nombre de usuario debe tener al menos 3 caracteres'],
    maxlength: [30, 'El nombre de usuario no puede tener más de 30 caracteres'],
    match: [/^[a-zA-Z0-9_]+$/, 'El nombre de usuario solo puede contener letras, números y guiones bajos']
  },
  
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'El formato del email no es válido']
  },
  
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'La contraseña debe tener al menos 6 caracteres'],
    // No incluir en las consultas por defecto
    select: false
  },
  
  nombre: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
    maxlength: [50, 'El nombre no puede tener más de 50 caracteres']
  },
  
  telefono: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: function(v) {
        // Si está vacío, es válido. Si no, debe ser un formato válido
        return v === '' || /^[\d\s\-\+\(\)]{7,15}$/.test(v);
      },
      message: 'El formato del teléfono no es válido'
    }
  },
  
  // ✅ CAMBIO: 'role' -> 'rol' para que coincida con el middleware
  rol: {
    type: String,
    enum: {
      values: ['user', 'admin', 'employee'],
      message: 'El rol debe ser: user, admin o employee'
    },
    default: 'user'
  },
  
  activo: {
    type: Boolean,
    default: true
  },
  
  fechaRegistro: {
    type: Date,
    default: Date.now
  },
  
  ultimoLogin: {
    type: Date,
    default: null
  },
  
  // Campos adicionales para una ferretería
  direccion: {
    calle: { type: String, default: '' },
    ciudad: { type: String, default: '' },
    codigoPostal: { type: String, default: '' },
    estado: { type: String, default: '' }
  },
  
  // Configuraciones del usuario
  configuraciones: {
    notificaciones: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    },
    idioma: { type: String, default: 'es' },
    tema: { type: String, enum: ['claro', 'oscuro'], default: 'claro' }
  }
  
}, {
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
  toJSON: { 
    transform: function(doc, ret) {
      // Remover campos sensibles en las respuestas JSON
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// ✅ SOLUCIÓN a los warnings: Solo usar unique: true, no índices adicionales
// Los índices únicos ya crean índices automáticamente

// Middleware pre-save para hashear la contraseña
userSchema.pre('save', async function(next) {
  // Solo hashear si la contraseña ha sido modificada (o es nueva)
  if (!this.isModified('password')) return next();
  
  try {
    console.log('🔒 Hasheando contraseña para usuario:', this.username);
    
    // Generar salt y hashear la contraseña
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    console.log('✅ Contraseña hasheada exitosamente');
    next();
  } catch (error) {
    console.error('❌ Error hasheando contraseña:', error);
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    if (!this.password) {
      // Si por alguna razón no tenemos la contraseña, buscarla explícitamente
      const userWithPassword = await this.constructor.findById(this._id).select('+password');
      if (!userWithPassword || !userWithPassword.password) {
        console.error('❌ No se encontró contraseña para el usuario:', this._id);
        return false;
      }
      return await bcrypt.compare(candidatePassword, userWithPassword.password);
    }
    
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('❌ Error comparando contraseñas:', error);
    return false;
  }
};

// Método para actualizar último login
userSchema.methods.actualizarUltimoLogin = function() {
  this.ultimoLogin = new Date();
  return this.save();
};

// Método estático para buscar por username o email
userSchema.statics.findByCredentials = async function(identifier, password) {
  try {
    // Buscar por username o email, incluyendo la contraseña
    const user = await this.findOne({
      $or: [
        { username: identifier },
        { email: identifier.toLowerCase() }
      ],
      activo: true
    }).select('+password');
    
    if (!user) {
      return null;
    }
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return null;
    }
    
    return user;
  } catch (error) {
    console.error('❌ Error en findByCredentials:', error);
    return null;
  }
};

// Método estático para verificar si un email/username está disponible
userSchema.statics.isAvailable = async function(email, username, excludeId = null) {
  const query = {
    $or: [
      { email: email.toLowerCase() },
      { username: username }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  const existingUser = await this.findOne(query);
  return !existingUser;
};

// Método para obtener estadísticas básicas del usuario (para admin)
userSchema.methods.getStats = function() {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    rol: this.rol, // ✅ Cambiado de 'role' a 'rol'
    activo: this.activo,
    fechaRegistro: this.fechaRegistro,
    ultimoLogin: this.ultimoLogin,
    tieneConfiguraciones: !!this.configuraciones
  };
};

// Middleware pre-remove para limpieza (si se implementa soft delete)
userSchema.pre('remove', function(next) {
  console.log('🗑️ Eliminando usuario:', this.username);
  // Aquí podrías agregar lógica para limpiar datos relacionados
  next();
});

// ✅ CAMBIO: Crear el modelo como 'User' para que coincida con el middleware
const User = mongoose.model('User', userSchema);

console.log('✅ Modelo User cargado exitosamente');

module.exports = User;