 const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  datosGenerales: {
    nombre: {
      type: String,
      required: true,
      trim: true
    },
    razonSocial: {
      type: String,
      trim: true
    },
    contacto: {
      type: String,
      required: true,
      trim: true
    },
    telefono: {
      type: String,
      required: true,
      trim: true
    },
    correo: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    }
  },
  
  datosFiscales: {
    rfc: {
      type: String,
      trim: true,
      uppercase: true
    },
    regimenFiscal: {
      type: String,
      trim: true
    },
    codigoPostal: {
      type: String,
      required: true,
      trim: true
    }
  },
  
  historialCompras: [{
    id: String,
    fecha: Date,
    total: Number,
    productos: Array,
    estatus: String
  }],
  
  facturas: [{
    id: String,
    folio: String,
    serie: String,
    fecha: Date,
    clienteId: String,
    pedidoId: String,
    subtotal: Number,
    impuestos: Number,
    total: Number,
    uuid: String,
    estatus: String
  }],
  
  condicionesComerciales: {
    descuento: {
      type: Number,
      default: 0
    },
    credito: {
      type: Number,
      default: 0
    },
    limite: {
      type: Number,
      default: 0
    }
  },
  
  fechaRegistro: {
    type: Date,
    default: Date.now
  },
  
  fechaActualizacion: {
    type: Date,
    default: Date.now
  },
  
  fechaEliminacion: {
    type: Date
  },
  
  activo: {
    type: Boolean,
    default: true
  }
});

module.exports = mongoose.model('Cliente', clienteSchema);
