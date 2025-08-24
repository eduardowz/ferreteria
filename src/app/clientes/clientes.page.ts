import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule, ToastController, AlertController, ModalController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpService } from '../services/http.service'; // Ajusta la ruta según tu estructura

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
  isLoading = false;

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
    private loadingController: LoadingController,
    private httpService: HttpService,
    public router: Router
  ) {}

  ngOnInit() {
    this.comprobarConexionBD();
    this.cargarDatosCompletos();
    this.calcularEstadisticas();
  }

  ngOnDestroy() {
    // Cleanup si es necesario
  }

  // ===== MÉTODOS DE CARGA DE DATOS - INTEGRADOS CON MONGODB =====

  cargarDatosCompletos(): void {
    this.cargarClientes();
    this.cargarProductos();
    this.cargarPedidos();
    this.cargarUsuariosRegistrados();
    this.cargarComprasRealizadas();
  }

  async cargarClientes(): Promise<void> {
    try {
      this.httpService.getClientes().subscribe({
        next: (response) => {
          console.log('Respuesta del servidor para clientes:', response);
          
          if (response && response.data && Array.isArray(response.data)) {
            this.clientes = response.data.filter((c: Cliente) => c.activo !== false);
            console.log('Clientes cargados desde MongoDB:', this.clientes);
          } else if (Array.isArray(response)) {
            this.clientes = response.filter((c: Cliente) => c.activo !== false);
            console.log('Clientes cargados desde MongoDB (array directo):', this.clientes);
          } else {
            console.warn('Respuesta inesperada, usando localStorage');
            this.cargarClientesDesdeLocalStorage();
          }
        },
        error: (error) => {
          console.error('Error al cargar desde MongoDB, usando localStorage:', error);
          this.cargarClientesDesdeLocalStorage();
        }
      });
    } catch (error: any) {
      console.error('Error al conectar con la base de datos:', error);
      this.cargarClientesDesdeLocalStorage();
    }
  }

  private cargarClientesDesdeLocalStorage(): void {
    const clientesLocal = localStorage.getItem('clientes');
    this.clientes = clientesLocal ? JSON.parse(clientesLocal) : [];
    console.log('Clientes cargados desde localStorage (fallback):', this.clientes);
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
    const hoy = new Date();
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    
    // Filtrar pedidos del mes
    const pedidosDelMes = this.comprasRealizadas.filter(compra => 
      new Date(compra.fecha) >= inicioMes
    );
    
    // Calcular ventas del mes
    const ventasDelMes = pedidosDelMes.reduce((total, compra) => total + compra.total, 0);
    
    this.estadisticas = {
      clientesActivos: this.clientes.filter(c => c.activo).length,
      pedidosDelMes: pedidosDelMes.length,
      ventasDelMes: ventasDelMes,
      productosTotales: this.productos.length,
      usuariosRegistrados: this.usuariosRegistrados.length
    };
  }

  // ===== MÉTODOS PARA CLIENTES - INTEGRADOS CON MONGODB =====

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
    this.isLoading = true;
    
    try {
      if (this.modoEdicion && this.elementoSeleccionado) {
        // Actualizar cliente existente
        const clienteId = this.elementoSeleccionado._id || this.elementoSeleccionado.id;
        
        // Verificar que el ID existe antes de llamar al servicio
        if (!clienteId) {
          await this.mostrarToast('Error: Cliente sin identificador válido', 'danger');
          this.isLoading = false;
          return;
        }
        
        this.httpService.updateCliente(clienteId, this.clienteForm).subscribe({
          next: async (response) => {
            console.log('Cliente actualizado:', response);
            await this.mostrarToast('Cliente actualizado correctamente', 'success');
            await this.cargarClientes();
            this.calcularEstadisticas();
            this.ocultarFormulario();
          },
          error: async (error) => {
            console.error('Error al actualizar en MongoDB:', error);
            await this.actualizarClienteLocalStorage();
          }
        });
      } else {
        // Crear nuevo cliente
        const nuevoCliente = {
          ...this.clienteForm,
          fechaRegistro: new Date(),
          activo: true
        };
        
        this.httpService.createCliente(nuevoCliente).subscribe({
          next: async (response) => {
            console.log('Cliente creado:', response);
            await this.mostrarToast('Cliente creado correctamente', 'success');
            await this.cargarClientes();
            this.calcularEstadisticas();
            this.ocultarFormulario();
            
            // Sincronizar con usuarios registrados si existe
            if (response.data || response) {
              this.sincronizarClienteConUsuario(response.data || response);
            }
          },
          error: async (error) => {
            console.error('Error al crear en MongoDB:', error);
            await this.crearClienteLocalStorage(nuevoCliente);
          }
        });
      }
    } catch (error: any) {
      console.error('Error al guardar cliente:', error);
      await this.mostrarToast('Error al guardar cliente', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  private async actualizarClienteLocalStorage(): Promise<void> {
    try {
      if (!this.elementoSeleccionado) {
        await this.mostrarToast('Error: No hay cliente seleccionado', 'danger');
        return;
      }

      const index = this.clientes.findIndex(c => 
        (c._id || c.id) === (this.elementoSeleccionado!._id || this.elementoSeleccionado!.id)
      );
      if (index !== -1) {
        this.clientes[index] = { ...this.clientes[index], ...this.clienteForm };
        localStorage.setItem('clientes', JSON.stringify(this.clientes));
        await this.mostrarToast('Cliente actualizado (localStorage)', 'warning');
        this.calcularEstadisticas();
        this.ocultarFormulario();
      }
    } catch (error) {
      console.error('Error al actualizar en localStorage:', error);
      await this.mostrarToast('Error al actualizar cliente', 'danger');
    }
  }

  private async crearClienteLocalStorage(nuevoCliente: any): Promise<void> {
    try {
      const clienteConId = {
        ...nuevoCliente,
        id: this.generarId()
      };
      
      this.clientes.push(clienteConId);
      localStorage.setItem('clientes', JSON.stringify(this.clientes));
      await this.mostrarToast('Cliente creado (localStorage)', 'warning');
      this.calcularEstadisticas();
      this.ocultarFormulario();
      this.sincronizarClienteConUsuario(clienteConId);
    } catch (error) {
      console.error('Error al crear en localStorage:', error);
      await this.mostrarToast('Error al crear cliente', 'danger');
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
          handler: async () => {
            this.isLoading = true;
            
            try {
              const clienteId = cliente._id || cliente.id;
              
              // Verificar que el ID existe antes de llamar al servicio
              if (!clienteId) {
                await this.mostrarToast('Error: Cliente sin identificador válido', 'danger');
                this.isLoading = false;
                return;
              }
              
              this.httpService.deleteCliente(clienteId).subscribe({
                next: async (response) => {
                  console.log('Cliente eliminado:', response);
                  await this.mostrarToast('Cliente eliminado correctamente', 'success');
                  await this.cargarClientes();
                  this.calcularEstadisticas();
                },
                error: async (error) => {
                  console.error('Error al eliminar en MongoDB:', error);
                  await this.eliminarClienteLocalStorage(cliente);
                }
              });
            } catch (error: any) {
              console.error('Error al eliminar cliente:', error);
              await this.eliminarClienteLocalStorage(cliente);
            } finally {
              this.isLoading = false;
            }
          }
        }
      ]
    });
    await alert.present();
  }

  private async eliminarClienteLocalStorage(cliente: Cliente): Promise<void> {
    try {
      const index = this.clientes.findIndex(c => (c._id || c.id) === (cliente._id || cliente.id));
      if (index !== -1) {
        this.clientes[index].activo = false;
        localStorage.setItem('clientes', JSON.stringify(this.clientes));
        await this.mostrarToast('Cliente eliminado (localStorage)', 'warning');
        await this.cargarClientes();
        this.calcularEstadisticas();
      }
    } catch (error) {
      console.error('Error al eliminar en localStorage:', error);
      await this.mostrarToast('Error al eliminar cliente', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async buscarClientes(): Promise<void> {
    if (this.terminoBusqueda.trim()) {
      this.isLoading = true;
      
      try {
        this.httpService.buscarClientes(this.terminoBusqueda).subscribe({
          next: (response) => {
            console.log('Resultados de búsqueda:', response);
            
            if (response && response.data && Array.isArray(response.data)) {
              this.clientes = response.data.filter((c: Cliente) => c.activo !== false);
            } else if (Array.isArray(response)) {
              this.clientes = response.filter((c: Cliente) => c.activo !== false);
            } else {
              this.buscarClientesLocal();
            }
          },
          error: (error) => {
            console.error('Error al buscar en MongoDB:', error);
            this.buscarClientesLocal();
          }
        });
      } catch (error: any) {
        console.error('Error al buscar clientes:', error);
        this.buscarClientesLocal();
      } finally {
        this.isLoading = false;
      }
    } else {
      await this.cargarClientes();
    }
  }

  private buscarClientesLocal(): void {
    try {
      const terminoLower = this.terminoBusqueda.toLowerCase();
      const clientesLocal = localStorage.getItem('clientes');
      const todosClientes = clientesLocal ? JSON.parse(clientesLocal) : [];
      
      this.clientes = todosClientes.filter((c: Cliente) => 
        c.activo !== false && (
          c.datosGenerales.nombre.toLowerCase().includes(terminoLower) ||
          c.datosGenerales.correo.toLowerCase().includes(terminoLower) ||
          (c.datosFiscales.rfc && c.datosFiscales.rfc.toLowerCase().includes(terminoLower))
        )
      );
      console.log('Búsqueda local completada:', this.clientes);
    } catch (error) {
      console.error('Error en búsqueda local:', error);
      this.clientes = [];
    }
  }

  // ===== MÉTODOS DE MIGRACIÓN Y SINCRONIZACIÓN =====

  async migrarDatosAMongoDB(): Promise<void> {
    this.isLoading = true;
    
    try {
      const clientesLocal = localStorage.getItem('clientes');
      if (!clientesLocal) {
        await this.mostrarToast('No hay datos locales para migrar', 'warning');
        return;
      }
      
      const clientes = JSON.parse(clientesLocal);
      let migrados = 0;
      let errores = 0;
      
      for (const cliente of clientes) {
        try {
          // Remover el ID local para que MongoDB genere uno nuevo
          const clienteSinId = { ...cliente };
          delete clienteSinId.id;
          
          await this.httpService.createCliente(clienteSinId).toPromise();
          migrados++;
        } catch (error) {
          console.error('Error al migrar cliente:', error);
          errores++;
        }
      }
      
      await this.mostrarToast(`Migración completada: ${migrados} exitosos, ${errores} errores`, 'success');
      await this.cargarClientes();
      
    } catch (error) {
      console.error('Error en migración:', error);
      await this.mostrarToast('Error al migrar datos', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async comprobarConexionBD(): Promise<void> {
    this.httpService.comprobarConexion().subscribe({
      next: (response) => {
        if (response.connected) {
          this.mostrarToast('Conexión exitosa con la base de datos', 'success');
        } else {
          this.mostrarToast('Base de datos no disponible - usando localStorage', 'warning');
        }
      },
      error: (error) => {
        console.error('Error de conexión:', error);
        this.mostrarToast('Error de conexión con la base de datos', 'danger');
      }
    });
  }

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
      
      // Intentar actualizar en MongoDB, sino en localStorage
      const clienteId = cliente._id || cliente.id;
      
      if (clienteId) {
        this.httpService.updateCliente(clienteId, cliente).subscribe({
          next: (response) => {
            console.log('Cliente sincronizado en MongoDB:', response);
          },
          error: (error) => {
            console.error('Error al sincronizar en MongoDB, usando localStorage:', error);
            const index = this.clientes.findIndex(c => (c._id || c.id) === clienteId);
            if (index !== -1) {
              this.clientes[index] = cliente;
              localStorage.setItem('clientes', JSON.stringify(this.clientes));
            }
          }
        });
      }
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

      // Intentar crear en MongoDB
      this.httpService.createCliente(nuevoCliente).subscribe({
        next: (response) => {
          console.log('Cliente creado automáticamente:', response);
          this.sincronizarClienteConUsuario(response.data || response);
        },
        error: (error) => {
          console.error('Error al crear cliente automáticamente en MongoDB:', error);
          // Fallback a localStorage
          const clienteConId = {
            ...nuevoCliente,
            id: this.generarId(),
            fechaRegistro: new Date()
          };
          this.clientes.push(clienteConId);
          localStorage.setItem('clientes', JSON.stringify(this.clientes));
          this.sincronizarClienteConUsuario(clienteConId);
        }
      });
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

  private generarId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
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
  id?: string;
  _id?: string; // Para MongoDB
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