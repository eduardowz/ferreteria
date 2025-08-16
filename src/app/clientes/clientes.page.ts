import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, ToastController, AlertController, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.page.html',
  styleUrls: ['./clientes.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ClientesPage implements OnInit, OnDestroy {
  // Variables del componente
  clientes: Cliente[] = [];
  productos: any[] = [];
  pedidos: any[] = [];
  usuariosRegistrados: any[] = [];
  comprasRealizadas: any[] = [];
  
  // Variables para formularios
  clienteForm: Partial<Cliente> = this.inicializarClienteForm();
  
  // Variables de búsqueda y filtros
  terminoBusqueda = '';
  
  // Variables de UI
  mostrandoFormulario = false;
  modoEdicion = false;
  elementoSeleccionado: Cliente | null = null;

  // Servicios
  private clienteService = new ClienteService();
  private estadisticasService = new EstadisticasService();

  // Variables de estadísticas
  estadisticas = {
    clientesActivos: 0,
    pedidosDelMes: 0,
    ventasDelMes: 0,
    productosTotales: 0,
    usuariosRegistrados: 0
  };

  constructor(
    private toastController: ToastController,
    private alertController: AlertController,
    private modalController: ModalController,
    public router: Router  // Cambiado de private a public
  ) {}

  ngOnInit() {
    this.cargarDatosCompletos();
    this.calcularEstadisticas();
  }

  ngOnDestroy() {
    // Cleanup si es necesario
  }

  // ===== MÉTODOS DE CARGA DE DATOS =====

  cargarDatosCompletos(): void {
    this.cargarClientes();
    this.cargarProductos();
    this.cargarPedidos();
    this.cargarUsuariosRegistrados();
    this.cargarComprasRealizadas();
  }

  cargarClientes(): void {
    this.clientes = this.clienteService.obtenerClientes();
  }

  cargarProductos(): void {
    const productos = localStorage.getItem('productos');
    this.productos = productos ? JSON.parse(productos) : [];
  }

  cargarPedidos(): void {
    const pedidos = localStorage.getItem('pedidos');
    this.pedidos = pedidos ? JSON.parse(pedidos) : [];
  }

  cargarUsuariosRegistrados(): void {
    const usuarios = localStorage.getItem('registrousuario');
    this.usuariosRegistrados = usuarios ? JSON.parse(usuarios) : [];
  }

  cargarComprasRealizadas(): void {
    const compras = localStorage.getItem('compras_realizadas');
    this.comprasRealizadas = compras ? JSON.parse(compras) : [];
  }

  // ===== MÉTODOS PARA ESTADÍSTICAS =====

  calcularEstadisticas(): void {
    this.estadisticas = this.estadisticasService.calcularEstadisticas({
      clientes: this.clientes,
      productos: this.productos,
      pedidos: this.pedidos,
      usuarios: this.usuariosRegistrados,
      compras: this.comprasRealizadas
    });
  }

  // ===== MÉTODOS PARA CLIENTES =====

  mostrarFormularioCliente(cliente?: Cliente): void {
    this.modoEdicion = !!cliente;
    if (cliente) {
      this.clienteForm = { ...cliente };
      this.elementoSeleccionado = cliente;
    } else {
      this.clienteForm = this.inicializarClienteForm();
      this.elementoSeleccionado = null;
    }
    this.mostrandoFormulario = true;
  }

  async guardarCliente(): Promise<void> {
    try {
      if (this.modoEdicion && this.elementoSeleccionado) {
        this.clienteService.actualizarCliente(this.elementoSeleccionado.id, this.clienteForm);
        await this.mostrarToast('Cliente actualizado correctamente', 'success');
      } else {
        const nuevoCliente = this.clienteService.crearCliente(this.clienteForm as Omit<Cliente, 'id' | 'fechaRegistro'>);
        await this.mostrarToast('Cliente creado correctamente', 'success');
        
        // Sincronizar con usuarios registrados si existe
        this.sincronizarClienteConUsuario(nuevoCliente);
      }
      
      this.cargarClientes();
      this.calcularEstadisticas();
      this.ocultarFormulario();
    } catch (error) {
      await this.mostrarToast('Error al guardar cliente', 'danger');
    }
  }

  async eliminarCliente(cliente: Cliente): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirmar eliminación',
      message: `¿Estás seguro de que deseas eliminar al cliente ${cliente.datosGenerales.nombre}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: () => {
            this.clienteService.eliminarCliente(cliente.id);
            this.cargarClientes();
            this.calcularEstadisticas();
            this.mostrarToast('Cliente eliminado correctamente', 'success');
          }
        }
      ]
    });
    await alert.present();
  }

  buscarClientes(): void {
    if (this.terminoBusqueda.trim()) {
      this.clientes = this.clienteService.buscarClientes(this.terminoBusqueda);
    } else {
      this.cargarClientes();
    }
  }

  // ===== MÉTODOS DE SINCRONIZACIÓN =====

  sincronizarClienteConUsuario(cliente: Cliente): void {
    // Buscar si existe un usuario registrado con el mismo email
    const usuarioExistente = this.usuariosRegistrados.find(u => u.email === cliente.datosGenerales.correo);
    
    if (usuarioExistente) {
      // Actualizar el historial de compras del cliente con las compras del usuario
      const comprasUsuario = this.comprasRealizadas.filter(c => c.usuarioId === usuarioExistente.id);
      
      cliente.historialCompras = comprasUsuario.map(compra => ({
        id: compra.id.toString(),
        fecha: new Date(compra.fecha),
        total: compra.total,
        productos: compra.productos,
        estatus: compra.estado
      }));
      
      this.clienteService.actualizarCliente(cliente.id, cliente);
    }
  }

  async sincronizarTodosDatos(): Promise<void> {
    try {
      // Sincronizar clientes con usuarios registrados
      this.clientes.forEach(cliente => {
        this.sincronizarClienteConUsuario(cliente);
      });

      // Crear clientes automáticamente para usuarios que compraron pero no son clientes
      await this.crearClientesDesdeCompras();

      await this.mostrarToast('Datos sincronizados correctamente', 'success');
      this.cargarDatosCompletos();
      this.calcularEstadisticas();
    } catch (error) {
      await this.mostrarToast('Error al sincronizar datos', 'danger');
    }
  }

  async crearClientesDesdeCompras(): Promise<void> {
    const clientesExistentes = this.clientes.map(c => c.datosGenerales.correo);
    const comprasUnicas = new Map();

    // Agrupar compras por usuario
    this.comprasRealizadas.forEach(compra => {
      if (!comprasUnicas.has(compra.usuarioId)) {
        const usuario = this.usuariosRegistrados.find(u => u.id === compra.usuarioId);
        if (usuario && !clientesExistentes.includes(usuario.email)) {
          comprasUnicas.set(compra.usuarioId, usuario);
        }
      }
    });

    // Crear clientes automáticamente
    for (const [usuarioId, usuario] of comprasUnicas) {
      const nuevoCliente: Omit<Cliente, 'id' | 'fechaRegistro'> = {
        datosGenerales: {
          nombre: usuario.nombre || usuario.username,
          razonSocial: '',
          contacto: usuario.nombre || usuario.username,
          telefono: usuario.telefono || '',
          correo: usuario.email
        },
        datosFiscales: {
          rfc: '',
          regimenFiscal: 'Régimen Simplificado de Confianza',
          codigoPostal: '32000'
        },
        historialCompras: [],
        facturas: [],
        condicionesComerciales: {
          descuento: 0,
          credito: 0,
          limite: 10000
        },
        activo: true
      };

      const clienteCreado = this.clienteService.crearCliente(nuevoCliente);
      this.sincronizarClienteConUsuario(clienteCreado);
    }
  }

  // ===== MÉTODOS DE UTILIDAD =====

  private inicializarClienteForm(): Partial<Cliente> {
    return {
      datosGenerales: {
        nombre: '',
        razonSocial: '',
        contacto: '',
        telefono: '',
        correo: ''
      },
      datosFiscales: {
        rfc: '',
        regimenFiscal: '',
        codigoPostal: ''
      },
      historialCompras: [],
      facturas: [],
      condicionesComerciales: {
        descuento: 0,
        credito: 0,
        limite: 0
      },
      activo: true
    };
  }

  private async mostrarToast(mensaje: string, color: string = 'primary'): Promise<void> {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      color: color,
      position: 'top'
    });
    await toast.present();
  }

  ocultarFormulario(): void {
    this.mostrandoFormulario = false;
    this.modoEdicion = false;
    this.elementoSeleccionado = null;
  }

  formatearCurrency(valor: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(valor);
  }

  formatearFecha(fecha: Date): string {
    return new Date(fecha).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  }

  // ===== MÉTODOS DE NAVEGACIÓN =====

  irAProductos(): void {
    this.router.navigate(['/productos']);
  }

  irAPedidos(): void {
    this.router.navigate(['/pedidos']);
  }

  irAReportes(): void {
    this.router.navigate(['/reportes']);
  }
}

// ===== INTERFACES =====

export interface Cliente {
  id: string;
  datosGenerales: {
    nombre: string;
    razonSocial?: string;
    contacto: string;
    telefono: string;
    correo: string;
  };
  datosFiscales: {
    rfc: string;
    regimenFiscal: string;
    codigoPostal: string;
  };
  historialCompras: HistorialCompra[];
  facturas: Factura[];
  condicionesComerciales: {
    descuento: number;
    credito: number;
    limite: number;
  };
  fechaRegistro: Date;
  activo: boolean;
}

export interface HistorialCompra {
  id: string;
  fecha: Date;
  total: number;
  productos: any[];
  estatus: string;
}

export interface Factura {
  id: string;
  folio: string;
  serie: string;
  fecha: Date;
  clienteId: string;
  pedidoId: string;
  subtotal: number;
  impuestos: number;
  total: number;
  uuid?: string;
  estatus: 'vigente' | 'cancelada';
}

// ===== SERVICIOS =====

export class ClienteService {
  private clientes: Cliente[] = [];

  constructor() {
    this.cargarDatosDesdeLocalStorage();
  }

  private cargarDatosDesdeLocalStorage(): void {
    const data = localStorage.getItem('clientes');
    if (data) {
      this.clientes = JSON.parse(data);
    } else {
      this.cargarDatosEjemplo();
    }
  }

  private guardarEnLocalStorage(): void {
    localStorage.setItem('clientes', JSON.stringify(this.clientes));
  }

  crearCliente(cliente: Omit<Cliente, 'id' | 'fechaRegistro'>): Cliente {
    const nuevoCliente: Cliente = {
      ...cliente,
      id: this.generarId(),
      fechaRegistro: new Date(),
      activo: true
    };
    this.clientes.push(nuevoCliente);
    this.guardarEnLocalStorage();
    return nuevoCliente;
  }

  obtenerClientes(): Cliente[] {
    return this.clientes.filter(c => c.activo);
  }

  obtenerClientePorId(id: string): Cliente | undefined {
    return this.clientes.find(c => c.id === id);
  }

  actualizarCliente(id: string, datos: Partial<Cliente>): Cliente | null {
    const index = this.clientes.findIndex(c => c.id === id);
    if (index !== -1) {
      this.clientes[index] = { ...this.clientes[index], ...datos };
      this.guardarEnLocalStorage();
      return this.clientes[index];
    }
    return null;
  }

  eliminarCliente(id: string): boolean {
    const index = this.clientes.findIndex(c => c.id === id);
    if (index !== -1) {
      this.clientes[index].activo = false;
      this.guardarEnLocalStorage();
      return true;
    }
    return false;
  }

  buscarClientes(termino: string): Cliente[] {
    const terminoLower = termino.toLowerCase();
    return this.clientes.filter(c => 
      c.activo && (
        c.datosGenerales.nombre.toLowerCase().includes(terminoLower) ||
        c.datosGenerales.correo.toLowerCase().includes(terminoLower) ||
        c.datosFiscales.rfc.toLowerCase().includes(terminoLower)
      )
    );
  }

  private cargarDatosEjemplo(): void {
    // Cargar desde usuarios registrados si existen
    const usuariosRegistrados = JSON.parse(localStorage.getItem('registrousuario') || '[]');
    
    if (usuariosRegistrados.length > 0) {
      usuariosRegistrados.forEach((usuario: any) => {
        const clienteEjemplo: Cliente = {
          id: this.generarId(),
          datosGenerales: {
            nombre: usuario.nombre || usuario.username,
            razonSocial: '',
            contacto: usuario.nombre || usuario.username,
            telefono: usuario.telefono || '',
            correo: usuario.email
          },
          datosFiscales: {
            rfc: '',
            regimenFiscal: 'Régimen Simplificado de Confianza',
            codigoPostal: '32000'
          },
          historialCompras: [],
          facturas: [],
          condicionesComerciales: {
            descuento: 0,
            credito: 0,
            limite: 10000
          },
          fechaRegistro: new Date(),
          activo: true
        };
        this.clientes.push(clienteEjemplo);
      });
    } else {
      // Cliente de ejemplo por defecto
      const clienteEjemplo: Cliente = {
        id: '1',
        datosGenerales: {
          nombre: 'Cliente Ejemplo',
          razonSocial: 'Comercializadora JP S.A. de C.V.',
          contacto: 'Juan Pérez',
          telefono: '656-123-4567',
          correo: 'cliente@ejemplo.com'
        },
        datosFiscales: {
          rfc: 'PEPJ800101ABC',
          regimenFiscal: 'Régimen General de Ley Personas Morales',
          codigoPostal: '32000'
        },
        historialCompras: [],
        facturas: [],
        condicionesComerciales: {
          descuento: 5,
          credito: 30,
          limite: 50000
        },
        fechaRegistro: new Date(),
        activo: true
      };
      this.clientes.push(clienteEjemplo);
    }
    
    this.guardarEnLocalStorage();
  }

  private generarId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }
}

// ===== SERVICIO DE ESTADÍSTICAS =====

export class EstadisticasService {
  calcularEstadisticas(datos: {
    clientes: Cliente[],
    productos: any[],
    pedidos: any[],
    usuarios: any[],
    compras: any[]
  }) {
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    // Filtrar pedidos del mes
    const pedidosDelMes = datos.compras.filter(compra => 
      new Date(compra.fecha) >= inicioMes
    );
    
    // Calcular ventas del mes
    const ventasDelMes = pedidosDelMes.reduce((total, compra) => total + compra.total, 0);
    
    return {
      clientesActivos: datos.clientes.filter(c => c.activo).length,
      pedidosDelMes: pedidosDelMes.length,
      ventasDelMes: ventasDelMes,
      productosTotales: datos.productos.length,
      usuariosRegistrados: datos.usuarios.length
    };
  }
}