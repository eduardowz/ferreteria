import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

// ===================================
// INTERFACES Y TIPOS
// ===================================

export interface DatosFiscales {
  rfc: string;
  regimenFiscal: string;
  codigoPostal: string;
  usoCFDI: string;
}

export interface CondicionesComerciales {
  descuentoMaximo: number;
  creditoDisponible: number;
  limiteCredito: number;
  diasCredito: number;
  bloqueado: boolean;
}

export interface ClienteCompleto {
  id: string;
  nombre: string;
  razonSocial?: string;
  contacto: string;
  telefono: string;
  email: string;
  tipoCliente: 'persona_fisica' | 'persona_moral';
  estado: 'activo' | 'inactivo' | 'suspendido';
  fechaRegistro: string;
  fechaUltimaCompra?: string;
  vendedorAsignado?: string;
  datosFiscales: DatosFiscales;
  condicionesComerciales: CondicionesComerciales;
  notas?: string;
}

export interface ProductoPedido {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  cantidad: number;
  precio: number;
  descuento: number;
  total: number;
  impuestos: number;
}

export interface PedidoVenta {
  id: string;
  folioInterno: string;
  clienteId: string;
  cliente: string;
  vendedor: string;
  fechaVenta: string;
  fechaVencimiento?: string;
  estatus: 'pendiente' | 'confirmado' | 'pagado' | 'entregado' | 'cancelado' | 'facturado';
  metodoPago: 'PUE' | 'PPD';
  formaPago: 'efectivo' | 'transferencia' | 'cheque' | 'tarjeta_credito' | 'tarjeta_debito';
  productos: ProductoPedido[];
  subtotal: number;
  impuestos: number;
  total: number;
  observaciones?: string;
  condicionesEspeciales?: string;
}

export interface FacturaSAT {
  id: string;
  uuid: string;
  serie: string;
  folio: string;
  fecha: string;
  pedidoId: string;
  
  // Emisor
  emisorRFC: string;
  emisorNombre: string;
  
  // Receptor
  receptorRFC: string;
  receptorNombre: string;
  receptorUsoCFDI: string;
  
  // Datos fiscales
  metodoPago: string;
  formaPago: string;
  moneda: string;
  tipoCambio?: number;
  
  // Importes
  subtotal: number;
  descuento: number;
  impuestos: number;
  total: number;
  
  // Estado
  estatus: 'vigente' | 'cancelada' | 'pendiente';
  fechaCancelacion?: string;
  motivoCancelacion?: string;
  
  // Conceptos
  conceptos: ProductoPedido[];
  
  // Timbrado
  fechaTimbrado: string;
  selloCFD: string;
  selloSAT: string;
  certificadoSAT: string;
}

export interface EstadisticasCliente {
  totalCompras: number;
  montoTotal: number;
  promedioCompra: number;
  ultimaCompra?: string;
  pedidosPendientes: number;
  creditoUtilizado: number;
  diasPromedioPago: number;
}

export interface ResumenGeneral {
  totalClientes: number;
  clientesActivos: number;
  clientesInactivos: number;
  totalPedidos: number;
  pedidosPendientes: number;
  ventasHoy: number;
  ventasMes: number;
  facturasPendientes: number;
  creditoPorCobrar: number;
}

@Injectable({
  providedIn: 'root'
})
export class ClientesService {
  
  // ===================================
  // PROPIEDADES PRIVADAS
  // ===================================
  
  private clientesSubject = new BehaviorSubject<ClienteCompleto[]>([]);
  private pedidosSubject = new BehaviorSubject<PedidoVenta[]>([]);
  private facturasSubject = new BehaviorSubject<FacturaSAT[]>([]);
  
  // ===================================
  // OBSERVABLES PÚBLICOS
  // ===================================
  
  public clientes$ = this.clientesSubject.asObservable();
  public pedidos$ = this.pedidosSubject.asObservable();
  public facturas$ = this.facturasSubject.asObservable();
  
  // ===================================
  // KEYS PARA LOCALSTORAGE
  // ===================================
  
  private readonly CLIENTES_KEY = 'clientes_completos';
  private readonly PEDIDOS_KEY = 'pedidos_ventas';
  private readonly FACTURAS_KEY = 'facturas_sat';
  private readonly CONTADOR_PEDIDOS_KEY = 'contador_pedidos';
  private readonly CONTADOR_FACTURAS_KEY = 'contador_facturas';

  constructor() {
    this.inicializarDatos();
  }

  // ===================================
  // INICIALIZACIÓN DE DATOS
  // ===================================

  private inicializarDatos(): void {
    try {
      // Cargar datos existentes o crear datos de prueba
      const clientesGuardados = localStorage.getItem(this.CLIENTES_KEY);
      const pedidosGuardados = localStorage.getItem(this.PEDIDOS_KEY);
      const facturasGuardadas = localStorage.getItem(this.FACTURAS_KEY);

      if (clientesGuardados) {
        const clientes = JSON.parse(clientesGuardados);
        this.clientesSubject.next(clientes);
      } else {
        this.crearDatosPrueba();
      }

      if (pedidosGuardados) {
        const pedidos = JSON.parse(pedidosGuardados);
        this.pedidosSubject.next(pedidos);
      }

      if (facturasGuardadas) {
        const facturas = JSON.parse(facturasGuardadas);
        this.facturasSubject.next(facturas);
      }
    } catch (error) {
      console.error('Error al inicializar datos:', error);
      this.crearDatosPrueba();
    }
  }

  private crearDatosPrueba(): void {
    const clientesPrueba: ClienteCompleto[] = [
      {
        id: '1',
        nombre: 'Juan Pérez García',
        contacto: 'Juan Pérez',
        telefono: '6561234567',
        email: 'juan.perez@email.com',
        tipoCliente: 'persona_fisica',
        estado: 'activo',
        fechaRegistro: new Date().toISOString(),
        vendedorAsignado: 'Eduardo Martínez',
        datosFiscales: {
          rfc: 'PEGJ850415HDF',
          regimenFiscal: '605',
          codigoPostal: '32000',
          usoCFDI: 'G03'
        },
        condicionesComerciales: {
          descuentoMaximo: 5,
          creditoDisponible: 15000,
          limiteCredito: 15000,
          diasCredito: 30,
          bloqueado: false
        },
        notas: 'Cliente frecuente de herramientas eléctricas'
      },
      {
        id: '2',
        nombre: 'Constructora ABC S.A. de C.V.',
        razonSocial: 'Constructora ABC S.A. de C.V.',
        contacto: 'María González',
        telefono: '6567891234',
        email: 'compras@constructoraabc.com',
        tipoCliente: 'persona_moral',
        estado: 'activo',
        fechaRegistro: new Date(Date.now() - 86400000 * 30).toISOString(),
        vendedorAsignado: 'Carlos Rodríguez',
        datosFiscales: {
          rfc: 'CAB070815ABC',
          regimenFiscal: '601',
          codigoPostal: '32100',
          usoCFDI: 'G03'
        },
        condicionesComerciales: {
          descuentoMaximo: 15,
          creditoDisponible: 45000,
          limiteCredito: 50000,
          diasCredito: 60,
          bloqueado: false
        },
        notas: 'Cliente corporativo - solicitar OC para compras mayores a $10,000'
      },
      {
        id: '3',
        nombre: 'Ana Sofía Martínez',
        contacto: 'Ana Martínez',
        telefono: '6565555678',
        email: 'ana.martinez@email.com',
        tipoCliente: 'persona_fisica',
        estado: 'activo',
        fechaRegistro: new Date(Date.now() - 86400000 * 15).toISOString(),
        datosFiscales: {
          rfc: 'MASA900320MDF',
          regimenFiscal: '605',
          codigoPostal: '32200',
          usoCFDI: 'G01'
        },
        condicionesComerciales: {
          descuentoMaximo: 3,
          creditoDisponible: 8000,
          limiteCredito: 8000,
          diasCredito: 15,
          bloqueado: false
        },
        notas: 'Cliente nuevo - verificar referencias crediticias'
      }
    ];

    this.clientesSubject.next(clientesPrueba);
    this.guardarClientes();
    this.crearPedidosPrueba();
  }

  private crearPedidosPrueba(): void {
    const pedidosPrueba: PedidoVenta[] = [
      {
        id: '1',
        folioInterno: 'PV-001',
        clienteId: '1',
        cliente: 'Juan Pérez García',
        vendedor: 'Eduardo Martínez',
        fechaVenta: new Date().toISOString(),
        estatus: 'confirmado',
        metodoPago: 'PUE',
        formaPago: 'efectivo',
        productos: [
          {
            id: '1',
            codigo: 'TALADRO-001',
            nombre: 'Taladro Percutor 13mm',
            descripcion: 'Taladro percutor profesional 13mm 800W',
            cantidad: 1,
            precio: 1250.00,
            descuento: 0,
            total: 1250.00,
            impuestos: 200.00
          }
        ],
        subtotal: 1250.00,
        impuestos: 200.00,
        total: 1450.00,
        observaciones: 'Entrega en sucursal'
      },
      {
        id: '2',
        folioInterno: 'PV-002',
        clienteId: '2',
        cliente: 'Constructora ABC S.A. de C.V.',
        vendedor: 'Carlos Rodríguez',
        fechaVenta: new Date(Date.now() - 86400000 * 2).toISOString(),
        fechaVencimiento: new Date(Date.now() + 86400000 * 28).toISOString(),
        estatus: 'pagado',
        metodoPago: 'PPD',
        formaPago: 'transferencia',
        productos: [
          {
            id: '2',
            codigo: 'CEMENTO-001',
            nombre: 'Cemento Portland Tipo I',
            descripcion: 'Saco de cemento 50kg',
            cantidad: 50,
            precio: 180.00,
            descuento: 1350.00,
            total: 7650.00,
            impuestos: 1224.00
          }
        ],
        subtotal: 9000.00,
        impuestos: 1224.00,
        total: 8874.00,
        observaciones: 'Aplicar descuento corporativo 15%',
        condicionesEspeciales: 'Entrega en obra - Colonia Centro'
      }
    ];

    this.pedidosSubject.next(pedidosPrueba);
    this.guardarPedidos();
  }

  // ===================================
  // MÉTODOS DE GESTIÓN DE CLIENTES
  // ===================================

  obtenerClientes(): ClienteCompleto[] {
    return this.clientesSubject.value;
  }

  obtenerClientePorId(id: string): ClienteCompleto | null {
    const clientes = this.clientesSubject.value;
    return clientes.find(cliente => cliente.id === id) || null;
  }

  async crearCliente(datosCliente: Partial<ClienteCompleto>): Promise<ClienteCompleto> {
    try {
      const nuevoId = this.generarId();
      const fechaActual = new Date().toISOString();
      
      const clienteCompleto: ClienteCompleto = {
        id: nuevoId,
        nombre: datosCliente.nombre || '',
        razonSocial: datosCliente.razonSocial,
        contacto: datosCliente.contacto || '',
        telefono: datosCliente.telefono || '',
        email: datosCliente.email || '',
        tipoCliente: datosCliente.tipoCliente || 'persona_fisica',
        estado: 'activo',
        fechaRegistro: fechaActual,
        vendedorAsignado: datosCliente.vendedorAsignado,
        datosFiscales: datosCliente.datosFiscales || {
          rfc: '',
          regimenFiscal: '605',
          codigoPostal: '',
          usoCFDI: 'G03'
        },
        condicionesComerciales: datosCliente.condicionesComerciales || {
          descuentoMaximo: 5,
          creditoDisponible: 5000,
          limiteCredito: 5000,
          diasCredito: 30,
          bloqueado: false
        },
        notas: datosCliente.notas
      };

      const clientes = [...this.clientesSubject.value, clienteCompleto];
      this.clientesSubject.next(clientes);
      await this.guardarClientes();

      return clienteCompleto;
    } catch (error) {
      console.error('Error al crear cliente:', error);
      throw new Error('No se pudo crear el cliente');
    }
  }

  async actualizarCliente(id: string, datosActualizados: Partial<ClienteCompleto>): Promise<boolean> {
    try {
      const clientes = this.clientesSubject.value;
      const indice = clientes.findIndex(cliente => cliente.id === id);

      if (indice !== -1) {
        clientes[indice] = { ...clientes[indice], ...datosActualizados };
        this.clientesSubject.next([...clientes]);
        await this.guardarClientes();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error al actualizar cliente:', error);
      return false;
    }
  }

  async eliminarCliente(id: string): Promise<boolean> {
    try {
      const clientes = this.clientesSubject.value.filter(cliente => cliente.id !== id);
      
      if (clientes.length < this.clientesSubject.value.length) {
        this.clientesSubject.next(clientes);
        await this.guardarClientes();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error al eliminar cliente:', error);
      return false;
    }
  }

  buscarClientes(termino: string): ClienteCompleto[] {
    if (!termino || termino.trim() === '') {
      return this.clientesSubject.value;
    }

    const terminoLower = termino.toLowerCase().trim();
    return this.clientesSubject.value.filter(cliente =>
      cliente.nombre.toLowerCase().includes(terminoLower) ||
      cliente.contacto.toLowerCase().includes(terminoLower) ||
      cliente.email.toLowerCase().includes(terminoLower) ||
      cliente.datosFiscales.rfc.toLowerCase().includes(terminoLower) ||
      (cliente.telefono && cliente.telefono.includes(terminoLower))
    );
  }

  // ===================================
  // MÉTODOS DE GESTIÓN DE PEDIDOS
  // ===================================

  obtenerPedidos(): PedidoVenta[] {
    return this.pedidosSubject.value;
  }

  obtenerPedidosPorCliente(clienteId: string): PedidoVenta[] {
    return this.pedidosSubject.value.filter(pedido => pedido.clienteId === clienteId);
  }

  obtenerPedidoPorId(id: string): PedidoVenta | null {
    return this.pedidosSubject.value.find(pedido => pedido.id === id) || null;
  }

  async crearPedido(datosPedido: Partial<PedidoVenta>): Promise<PedidoVenta> {
    try {
      const nuevoId = this.generarId();
      const folioInterno = this.generarFolioPedido();
      const fechaActual = new Date().toISOString();

      // Calcular totales si no están proporcionados
      const productos = datosPedido.productos || [];
      const subtotal = productos.reduce((sum, p) => sum + (p.precio * p.cantidad - p.descuento), 0);
      const impuestos = productos.reduce((sum, p) => sum + p.impuestos, 0);
      const total = subtotal + impuestos;

      const pedidoCompleto: PedidoVenta = {
        id: nuevoId,
        folioInterno: folioInterno,
        clienteId: datosPedido.clienteId || '',
        cliente: datosPedido.cliente || '',
        vendedor: datosPedido.vendedor || 'Sistema',
        fechaVenta: fechaActual,
        fechaVencimiento: datosPedido.fechaVencimiento,
        estatus: 'pendiente',
        metodoPago: datosPedido.metodoPago || 'PUE',
        formaPago: datosPedido.formaPago || 'efectivo',
        productos: productos,
        subtotal: datosPedido.subtotal || subtotal,
        impuestos: datosPedido.impuestos || impuestos,
        total: datosPedido.total || total,
        observaciones: datosPedido.observaciones,
        condicionesEspeciales: datosPedido.condicionesEspeciales
      };

      const pedidos = [...this.pedidosSubject.value, pedidoCompleto];
      this.pedidosSubject.next(pedidos);
      await this.guardarPedidos();

      return pedidoCompleto;
    } catch (error) {
      console.error('Error al crear pedido:', error);
      throw new Error('No se pudo crear el pedido');
    }
  }

  async actualizarPedido(id: string, datosActualizados: Partial<PedidoVenta>): Promise<boolean> {
    try {
      const pedidos = this.pedidosSubject.value;
      const indice = pedidos.findIndex(pedido => pedido.id === id);

      if (indice !== -1) {
        pedidos[indice] = { ...pedidos[indice], ...datosActualizados };
        this.pedidosSubject.next([...pedidos]);
        await this.guardarPedidos();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error al actualizar pedido:', error);
      return false;
    }
  }

  async actualizarEstatusPedido(id: string, nuevoEstatus: PedidoVenta['estatus']): Promise<boolean> {
    return await this.actualizarPedido(id, { estatus: nuevoEstatus });
  }

  // ===================================
  // MÉTODOS DE GESTIÓN DE FACTURACIÓN
  // ===================================

  obtenerFacturas(): FacturaSAT[] {
    return this.facturasSubject.value;
  }

  obtenerFacturasPorCliente(clienteId: string): FacturaSAT[] {
    const pedidosCliente = this.obtenerPedidosPorCliente(clienteId);
    const pedidosIds = pedidosCliente.map(p => p.id);
    return this.facturasSubject.value.filter(f => pedidosIds.includes(f.pedidoId));
  }

  obtenerFacturaPorId(id: string): FacturaSAT | null {
    return this.facturasSubject.value.find(factura => factura.id === id) || null;
  }

  obtenerFacturaPorUUID(uuid: string): FacturaSAT | null {
    return this.facturasSubject.value.find(factura => factura.uuid === uuid) || null;
  }

  async crearFacturaDesdeePedido(pedidoId: string): Promise<FacturaSAT | null> {
    try {
      const pedido = this.obtenerPedidoPorId(pedidoId);
      const cliente = pedido ? this.obtenerClientePorId(pedido.clienteId) : null;

      if (!pedido || !cliente) {
        throw new Error('Pedido o cliente no encontrado');
      }

      const nuevoId = this.generarId();
      const uuid = this.generarUUID();
      const { serie, folio } = this.generarSerieYFolio();
      const fechaActual = new Date().toISOString();

      const factura: FacturaSAT = {
        id: nuevoId,
        uuid: uuid,
        serie: serie,
        folio: folio,
        fecha: fechaActual,
        pedidoId: pedidoId,

        // Datos del emisor
        emisorRFC: 'FER123456789',
        emisorNombre: 'Ferretería Rodriguez y Asociados S.A. de C.V.',

        // Datos del receptor
        receptorRFC: cliente.datosFiscales.rfc,
        receptorNombre: cliente.razonSocial || cliente.nombre,
        receptorUsoCFDI: cliente.datosFiscales.usoCFDI,

        // Datos fiscales
        metodoPago: pedido.metodoPago,
        formaPago: pedido.formaPago,
        moneda: 'MXN',

        // Importes
        subtotal: pedido.subtotal,
        descuento: 0,
        impuestos: pedido.impuestos,
        total: pedido.total,

        // Estado
        estatus: 'vigente',

        // Conceptos
        conceptos: pedido.productos,

        // Datos de timbrado
        fechaTimbrado: fechaActual,
        selloCFD: this.generarSello(),
        selloSAT: this.generarSello(),
        certificadoSAT: this.generarCertificado()
      };

      const facturas = [...this.facturasSubject.value, factura];
      this.facturasSubject.next(facturas);
      await this.guardarFacturas();

      // Actualizar estatus del pedido
      await this.actualizarEstatusPedido(pedidoId, 'facturado');

      return factura;
    } catch (error) {
      console.error('Error al crear factura:', error);
      return null;
    }
  }

  async cancelarFactura(uuid: string, motivo: string): Promise<boolean> {
    try {
      const facturas = this.facturasSubject.value;
      const indice = facturas.findIndex(factura => factura.uuid === uuid);

      if (indice !== -1) {
        facturas[indice] = {
          ...facturas[indice],
          estatus: 'cancelada',
          fechaCancelacion: new Date().toISOString(),
          motivoCancelacion: motivo
        };
        
        this.facturasSubject.next([...facturas]);
        await this.guardarFacturas();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error al cancelar factura:', error);
      return false;
    }
  }

  // ===================================
  // MÉTODOS DE ESTADÍSTICAS
  // ===================================

  obtenerEstadisticasCliente(clienteId: string): EstadisticasCliente {
    const pedidosCliente = this.pedidosSubject.value.filter(p => p.clienteId === clienteId);
    const cliente = this.obtenerClientePorId(clienteId);

    const pedidosCompletados = pedidosCliente.filter(p => 
      p.estatus === 'pagado' || p.estatus === 'entregado' || p.estatus === 'facturado'
    );

    const totalCompras = pedidosCompletados.length;
    const montoTotal = pedidosCompletados.reduce((total, pedido) => total + pedido.total, 0);

    const ultimaCompraData = pedidosCompletados
      .sort((a, b) => new Date(b.fechaVenta).getTime() - new Date(a.fechaVenta).getTime())[0];

    const pedidosPendientes = pedidosCliente.filter(p => 
      p.estatus === 'pendiente' || p.estatus === 'confirmado'
    ).length;

    const creditoUtilizado = cliente ? 
      cliente.condicionesComerciales.limiteCredito - cliente.condicionesComerciales.creditoDisponible : 0;

    return {
      totalCompras,
      montoTotal,
      promedioCompra: totalCompras > 0 ? montoTotal / totalCompras : 0,
      ultimaCompra: ultimaCompraData?.fechaVenta,
      pedidosPendientes,
      creditoUtilizado,
      diasPromedioPago: 30
    };
  }

  obtenerResumenGeneral(): ResumenGeneral {
    const clientes = this.clientesSubject.value;
    const pedidos = this.pedidosSubject.value;
    const facturas = this.facturasSubject.value;

    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

    const ventasHoy = pedidos
      .filter(p => {
        const fechaPedido = new Date(p.fechaVenta);
        return fechaPedido >= inicioHoy && (p.estatus === 'pagado' || p.estatus === 'entregado' || p.estatus === 'facturado');
      })
      .reduce((total, pedido) => total + pedido.total, 0);

    const ventasMes = pedidos
      .filter(p => {
        const fechaPedido = new Date(p.fechaVenta);
        return fechaPedido >= inicioMes && (p.estatus === 'pagado' || p.estatus === 'entregado' || p.estatus === 'facturado');
      })
      .reduce((total, pedido) => total + pedido.total, 0);

    const creditoPorCobrar = pedidos
      .filter(p => p.estatus === 'confirmado' && p.metodoPago === 'PPD')
      .reduce((total, pedido) => total + pedido.total, 0);

    return {
      totalClientes: clientes.length,
      clientesActivos: clientes.filter(c => c.estado === 'activo').length,
      clientesInactivos: clientes.filter(c => c.estado === 'inactivo').length,
      totalPedidos: pedidos.length,
      pedidosPendientes: pedidos.filter(p => p.estatus === 'pendiente').length,
      ventasHoy,
      ventasMes,
      facturasPendientes: facturas.filter(f => f.estatus === 'pendiente').length,
      creditoPorCobrar
    };
  }

  // ===================================
  // MÉTODOS DE VALIDACIÓN
  // ===================================

  validarRFC(rfc: string): boolean {
    if (!rfc || rfc.length < 10 || rfc.length > 13) {
      return false;
    }

    // Remover espacios y convertir a mayúsculas
    rfc = rfc.trim().toUpperCase();

    // Patrones para validación
    const patronPersonaFisica = /^[A-Z&Ñ]{4}[0-9]{6}[A-Z0-9]{3}$/;
    const patronPersonaMoral = /^[A-Z&Ñ]{3}[0-9]{6}[A-Z0-9]{3}$/;

    return patronPersonaFisica.test(rfc) || patronPersonaMoral.test(rfc);
  }

  validarEmail(email: string): boolean {
    if (!email) return false;
    const patron = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return patron.test(email.trim());
  }

  validarTelefono(telefono: string): boolean {
    if (!telefono) return false;
    // Permitir números de 10 dígitos con o sin espacios, guiones o paréntesis
    const telefonoLimpio = telefono.replace(/[\s\-\(\)]/g, '');
    const patron = /^[0-9]{10}$/;
    return patron.test(telefonoLimpio);
  }

  // ===================================
  // MÉTODOS PRIVADOS DE UTILIDAD
  // ===================================

  private generarId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private generarFolioPedido(): string {
    try {
      let contador = parseInt(localStorage.getItem(this.CONTADOR_PEDIDOS_KEY) || '0');
      contador++;
      localStorage.setItem(this.CONTADOR_PEDIDOS_KEY, contador.toString());
      return `PV-${contador.toString().padStart(6, '0')}`;
    } catch (error) {
      console.error('Error al generar folio de pedido:', error);
      return `PV-${Date.now().toString().substr(-6)}`;
    }
  }

  private generarSerieYFolio(): { serie: string; folio: string } {
    try {
      let contador = parseInt(localStorage.getItem(this.CONTADOR_FACTURAS_KEY) || '0');
      contador++;
      localStorage.setItem(this.CONTADOR_FACTURAS_KEY, contador.toString());
      
      return {
        serie: 'A',
        folio: contador.toString().padStart(8, '0')
      };
    } catch (error) {
      console.error('Error al generar serie y folio:', error);
      return {
        serie: 'A',
        folio: Date.now().toString().substr(-8)
      };
    }
  }

  private generarUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private generarSello(): string {
    const caracteres = '0123456789ABCDEF';
    let sello = '';
    for (let i = 0; i < 64; i++) {
      sello += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    return sello;
  }

  private generarCertificado(): string {
    return '30001000000400002495';
  }

  // ===================================
  // MÉTODOS DE PERSISTENCIA
  // ===================================

  private async guardarClientes(): Promise<void> {
    try {
      localStorage.setItem(this.CLIENTES_KEY, JSON.stringify(this.clientesSubject.value));
    } catch (error) {
      console.error('Error al guardar clientes:', error);
      throw new Error('No se pudieron guardar los datos de clientes');
    }
  }

  private async guardarPedidos(): Promise<void> {
    try {
      localStorage.setItem(this.PEDIDOS_KEY, JSON.stringify(this.pedidosSubject.value));
    } catch (error) {
      console.error('Error al guardar pedidos:', error);
      throw new Error('No se pudieron guardar los datos de pedidos');
    }
  }

  private async guardarFacturas(): Promise<void> {
    try {
      localStorage.setItem(this.FACTURAS_KEY, JSON.stringify(this.facturasSubject.value));
    } catch (error) {
      console.error('Error al guardar facturas:', error);
      throw new Error('No se pudieron guardar los datos de facturas');
    }
  }

  // ===================================
  // MÉTODOS PÚBLICOS ADICIONALES
  // ===================================

  async limpiarDatos(): Promise<void> {
    try {
      this.clientesSubject.next([]);
      this.pedidosSubject.next([]);
      this.facturasSubject.next([]);
      
      localStorage.removeItem(this.CLIENTES_KEY);
      localStorage.removeItem(this.PEDIDOS_KEY);
      localStorage.removeItem(this.FACTURAS_KEY);
      localStorage.removeItem(this.CONTADOR_PEDIDOS_KEY);
      localStorage.removeItem(this.CONTADOR_FACTURAS_KEY);
    } catch (error) {
      console.error('Error al limpiar datos:', error);
      throw new Error('No se pudieron limpiar los datos');
    }
  }

  exportarDatos(): any {
    return {
      clientes: this.clientesSubject.value,
      pedidos: this.pedidosSubject.value,
      facturas: this.facturasSubject.value,
      fechaExportacion: new Date().toISOString(),
      version: '1.0'
    };
  }

  async importarDatos(datos: any): Promise<boolean> {
    try {
      if (!datos || typeof datos !== 'object') {
        throw new Error('Datos de importación inválidos');
      }

      if (datos.clientes && Array.isArray(datos.clientes)) {
        this.clientesSubject.next(datos.clientes);
        await this.guardarClientes();
      }
      
      if (datos.pedidos && Array.isArray(datos.pedidos)) {
        this.pedidosSubject.next(datos.pedidos);
        await this.guardarPedidos();
      }
      
      if (datos.facturas && Array.isArray(datos.facturas)) {
        this.facturasSubject.next(datos.facturas);
        await this.guardarFacturas();
      }
      
      return true;
    } catch (error) {
      console.error('Error al importar datos:', error);
      return false;
    }
  }

  // ===================================
  // MÉTODOS DE UTILIDADES ADICIONALES
  // ===================================

  obtenerClientesConPedidosPendientes(): ClienteCompleto[] {
    const pedidosPendientes = this.pedidosSubject.value.filter(p => p.estatus === 'pendiente');
    const clientesConPendientes = new Set(pedidosPendientes.map(p => p.clienteId));
    
    return this.clientesSubject.value.filter(cliente => clientesConPendientes.has(cliente.id));
  }

  obtenerTopClientes(limite: number = 10): { cliente: ClienteCompleto; estadisticas: EstadisticasCliente }[] {
    return this.clientesSubject.value
      .map(cliente => ({
        cliente,
        estadisticas: this.obtenerEstadisticasCliente(cliente.id)
      }))
      .sort((a, b) => b.estadisticas.montoTotal - a.estadisticas.montoTotal)
      .slice(0, limite);
  }

  obtenerVentasPorPeriodo(fechaInicio: Date, fechaFin: Date): PedidoVenta[] {
    return this.pedidosSubject.value.filter(pedido => {
      const fechaPedido = new Date(pedido.fechaVenta);
      return fechaPedido >= fechaInicio && 
             fechaPedido <= fechaFin && 
             (pedido.estatus === 'pagado' || pedido.estatus === 'entregado' || pedido.estatus === 'facturado');
    });
  }

  calcularComisionesPorVendedor(periodo?: { inicio: Date; fin: Date }): { [vendedor: string]: number } {
    let pedidosFiltrados = this.pedidosSubject.value.filter(p => 
      p.estatus === 'pagado' || p.estatus === 'entregado' || p.estatus === 'facturado'
    );

    if (periodo) {
      pedidosFiltrados = pedidosFiltrados.filter(pedido => {
        const fechaPedido = new Date(pedido.fechaVenta);
        return fechaPedido >= periodo.inicio && fechaPedido <= periodo.fin;
      });
    }

    const comisiones: { [vendedor: string]: number } = {};
    
    pedidosFiltrados.forEach(pedido => {
      const vendedor = pedido.vendedor || 'Sin asignar';
      const comision = pedido.total * 0.03; // 3% de comisión ejemplo
      
      comisiones[vendedor] = (comisiones[vendedor] || 0) + comision;
    });

    return comisiones;
  }

  // ===================================
  // MÉTODOS PARA REPORTES
  // ===================================

  generarReporteVentas(fechaInicio: Date, fechaFin: Date): any {
    const ventasPeriodo = this.obtenerVentasPorPeriodo(fechaInicio, fechaFin);
    
    const totalVentas = ventasPeriodo.length;
    const montoTotal = ventasPeriodo.reduce((total, pedido) => total + pedido.total, 0);
    const promedioVenta = totalVentas > 0 ? montoTotal / totalVentas : 0;

    // Ventas por vendedor
    const ventasPorVendedor: { [vendedor: string]: { cantidad: number; monto: number } } = {};
    ventasPeriodo.forEach(pedido => {
      const vendedor = pedido.vendedor || 'Sin asignar';
      if (!ventasPorVendedor[vendedor]) {
        ventasPorVendedor[vendedor] = { cantidad: 0, monto: 0 };
      }
      ventasPorVendedor[vendedor].cantidad++;
      ventasPorVendedor[vendedor].monto += pedido.total;
    });

    // Productos más vendidos
    const productosVendidos: { [productoId: string]: { nombre: string; cantidad: number; monto: number } } = {};
    ventasPeriodo.forEach(pedido => {
      pedido.productos.forEach(producto => {
        if (!productosVendidos[producto.id]) {
          productosVendidos[producto.id] = {
            nombre: producto.nombre,
            cantidad: 0,
            monto: 0
          };
        }
        productosVendidos[producto.id].cantidad += producto.cantidad;
        productosVendidos[producto.id].monto += producto.total;
      });
    });

    return {
      periodo: {
        inicio: fechaInicio.toISOString(),
        fin: fechaFin.toISOString()
      },
      resumen: {
        totalVentas,
        montoTotal,
        promedioVenta
      },
      ventasPorVendedor,
      productosVendidos: Object.values(productosVendidos)
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 10),
      fechaGeneracion: new Date().toISOString()
    };
  }

  // ===================================
  // MÉTODOS DE BACKUP Y RESTAURACIÓN
  // ===================================

  async crearBackup(): Promise<string> {
    try {
      const backup = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        data: this.exportarDatos()
      };
      
      return JSON.stringify(backup, null, 2);
    } catch (error) {
      console.error('Error al crear backup:', error);
      throw new Error('No se pudo crear el backup');
    }
  }

  async restaurarBackup(backupString: string): Promise<boolean> {
    try {
      const backup = JSON.parse(backupString);
      
      if (!backup.data || !backup.timestamp) {
        throw new Error('Formato de backup inválido');
      }
      
      return await this.importarDatos(backup.data);
    } catch (error) {
      console.error('Error al restaurar backup:', error);
      return false;
    }
  }
}