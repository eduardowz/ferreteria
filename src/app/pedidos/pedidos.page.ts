import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonBackButton, IonButtons, IonInput, IonItem,
  IonList, IonLabel, IonButton, IonCardTitle, IonCardHeader, IonCard, IonCardContent,
  IonSelect, IonSelectOption, IonAvatar, IonNote, IonRadioGroup, IonRadio,
  IonBadge, // <-- AÑADE ESTA IMPORTACIÓN
  AlertController, ToastController
} from '@ionic/angular/standalone';

interface CompraRealizada {
  id: number;
  cliente: string;
  usuarioId: string;
  productos: ProductoCompra[];
  subtotal: number;
  descuento: number;
  total: number;
  metodoPago: string;
  fecha: string;
  estado: string;
  aplicaDescuento: boolean;
}

interface ProductoCompra {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotalProducto: number;
}

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: 'admin' | 'usuario';
}

@Component({
  selector: 'app-pedidos',
  templateUrl: './pedidos.page.html',
  styleUrls: ['./pedidos.page.scss'],
  standalone: true,
  imports: [
    // Todos los componentes Ionic que estás usando:
    IonBadge, IonRadio, IonRadioGroup, IonNote, IonAvatar, 
    IonCardContent, IonCard, IonCardHeader, IonCardTitle,
    CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar,
    IonBackButton, IonButtons, IonInput, IonItem, IonList, IonLabel,
    IonButton, IonSelect, IonSelectOption
  ]
})
export class PedidosPage implements OnInit, OnDestroy {
  // Datos del usuario actual
  usuarioActual: Usuario = { id: '', nombre: '', email: '', rol: 'usuario' };
  esAdmin = false;

  // Datos de pedidos/compras
  comprasRealizadas: CompraRealizada[] = [];
  comprasFiltradas: CompraRealizada[] = [];
  
  // Filtros para admin
  filtroEstado = '';
  filtroCliente = '';
  filtroMetodoPago = '';
  
  // Clientes únicos para filtro
  clientesUnicos: string[] = [];
  estadosDisponibles: string[] = ['Pendiente', 'Procesando', 'Enviado', 'Entregado', 'Cancelado'];
  metodosPago: string[] = ['efectivo', 'tarjeta'];

  constructor(
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.cargarUsuarioActual();
    this.verificarPermisos();
    
    if (this.esAdmin) {
      this.cargarComprasRealizadas();
      this.obtenerClientesUnicos();
      this.filtrarCompras();
    }
  }

  ngOnDestroy() {
    // Implementar limpieza si es necesario
  }

  cargarUsuarioActual() {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        this.usuarioActual = JSON.parse(userData);
        this.esAdmin = this.usuarioActual.rol === 'admin';
      } catch (error) {
        console.error('Error al parsear datos del usuario:', error);
        this.redirigirALogin();
      }
    } else {
      this.redirigirALogin();
    }
  }

  verificarPermisos() {
    if (!this.esAdmin) {
      this.mostrarToast('Acceso denegado. Solo administradores pueden ver esta página.', 'danger');
      this.router.navigate(['/home']);
    }
  }

  cargarComprasRealizadas() {
    const comprasData = localStorage.getItem('compras_realizadas');
    if (comprasData) {
      try {
        this.comprasRealizadas = JSON.parse(comprasData);
        console.log('Compras cargadas:', this.comprasRealizadas);
      } catch (error) {
        console.error('Error al cargar compras realizadas:', error);
        this.comprasRealizadas = [];
      }
    } else {
      this.comprasRealizadas = [];
    }
  }

  obtenerClientesUnicos() {
    this.clientesUnicos = [...new Set(this.comprasRealizadas.map(c => c.cliente))];
  }

  filtrarCompras() {
    this.comprasFiltradas = this.comprasRealizadas.filter(compra => {
      const cumpleEstado = !this.filtroEstado || compra.estado === this.filtroEstado;
      const cumpleCliente = !this.filtroCliente || compra.cliente === this.filtroCliente;
      const cumpleMetodoPago = !this.filtroMetodoPago || compra.metodoPago === this.filtroMetodoPago;
      
      return cumpleEstado && cumpleCliente && cumpleMetodoPago;
    });
  }

  async verDetallesCompra(compra: CompraRealizada) {
    let mensaje = `Compra #${compra.id}\n\n`;
    mensaje += `Cliente: ${compra.cliente}\n`;
    mensaje += `Usuario ID: ${compra.usuarioId}\n\n`;
    
    mensaje += 'Productos:\n';
    compra.productos.forEach(producto => {
      mensaje += `• ${producto.nombre} x${producto.cantidad} - $${producto.precio} c/u = $${producto.subtotalProducto}\n`;
    });
    
    mensaje += `\nSubtotal: $${compra.subtotal.toFixed(2)}`;
    
    if (compra.aplicaDescuento && compra.descuento > 0) {
      mensaje += `\nDescuento aplicado: -$${compra.descuento.toFixed(2)}`;
    }
    
    mensaje += `\nTotal pagado: $${compra.total.toFixed(2)}`;
    mensaje += `\nMétodo de pago: ${compra.metodoPago === 'tarjeta' ? 'Tarjeta' : 'Efectivo'}`;
    mensaje += `\nFecha: ${new Date(compra.fecha).toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`;
    mensaje += `\nEstado: ${compra.estado}`;

    const alert = await this.alertController.create({
      header: 'Detalles de la Compra',
      message: mensaje,
      buttons: ['OK']
    });

    await alert.present();
  }

  async cambiarEstadoCompra(compra: CompraRealizada) {
    const alert = await this.alertController.create({
      header: 'Cambiar Estado',
      message: `Compra #${compra.id} - ${compra.cliente}`,
      inputs: this.estadosDisponibles.map(estado => ({
        name: 'estado',
        type: 'radio',
        label: estado,
        value: estado,
        checked: compra.estado === estado
      })),
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Actualizar',
          handler: (data) => {
            if (data) {
              compra.estado = data;
              this.guardarCompras();
              this.filtrarCompras();
              this.mostrarToast('Estado actualizado correctamente', 'success');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async eliminarCompra(compraId: number) {
    const alert = await this.alertController.create({
      header: 'Eliminar Compra',
      message: '¿Estás seguro de que quieres eliminar esta compra? Esta acción no se puede deshacer.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: () => {
            this.comprasRealizadas = this.comprasRealizadas.filter(c => c.id !== compraId);
            this.guardarCompras();
            this.filtrarCompras();
            this.obtenerClientesUnicos();
            this.mostrarToast('Compra eliminada correctamente', 'success');
          }
        }
      ]
    });

    await alert.present();
  }

  calcularTotalVentas(): number {
    return this.comprasFiltradas.reduce((total, compra) => total + compra.total, 0);
  }

  calcularTotalDescuentosAplicados(): number {
    return this.comprasFiltradas
      .filter(compra => compra.aplicaDescuento)
      .reduce((total, compra) => total + compra.descuento, 0);
  }

  obtenerComprasPorEstado(estado: string): number {
    return this.comprasFiltradas.filter(compra => compra.estado === estado).length;
  }

  limpiarFiltros() {
    this.filtroEstado = '';
    this.filtroCliente = '';
    this.filtroMetodoPago = '';
    this.filtrarCompras();
    this.mostrarToast('Filtros limpiados', 'medium');
  }

  exportarDatos() {
    // Crear un resumen de las compras para exportar
    const resumen = {
      fechaExportacion: new Date().toISOString(),
      totalCompras: this.comprasFiltradas.length,
      ventasTotales: this.calcularTotalVentas(),
      descuentosAplicados: this.calcularTotalDescuentosAplicados(),
      compras: this.comprasFiltradas
    };

    const dataStr = JSON.stringify(resumen, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);

    const exportFileDefaultName = `compras_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    this.mostrarToast('Datos exportados correctamente', 'success');
  }

  private guardarCompras() {
    localStorage.setItem('compras_realizadas', JSON.stringify(this.comprasRealizadas));
  }

  private redirigirALogin() {
    this.mostrarToast('Sesión no válida. Redirigiendo al login...', 'warning');
    this.router.navigate(['/login']);
  }

  async cerrarSesion() {
    const alert = await this.alertController.create({
      header: 'Cerrar Sesión',
      message: '¿Estás seguro de que quieres cerrar sesión?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Cerrar Sesión',
          handler: () => {
            localStorage.removeItem('userData');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userType');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userName');
            this.router.navigate(['/login']);
          }
        }
      ]
    });

    await alert.present();
  }

  irAProductos() {
    this.router.navigate(['/productos']);
  }

  irAHome() {
    this.router.navigate(['/home']);
  }

  private async mostrarToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}