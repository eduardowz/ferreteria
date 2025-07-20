import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonBackButton, IonButtons, IonInput, IonItem,
  IonList, IonLabel, IonButton, IonCardTitle, IonCardHeader, IonCard, IonCardContent,
  IonSelect, IonSelectOption, IonAvatar, IonNote, IonRadioGroup, IonRadio,
  AlertController, ToastController
} from '@ionic/angular/standalone';

interface Pedido {
  id: number;
  cliente: string;
  producto: string;
  cantidad: number;
  fecha: string;
  estado: string;
  usuarioId: string;
  total: number;
  metodoPago?: string;
  productos?: ItemCarrito[];
}

interface ItemCarrito {
  producto: string;
  cantidad: number;
  precio: number;
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
    IonRadio, IonRadioGroup, IonNote, IonAvatar, 
    IonCardContent, IonCard, IonCardHeader, IonCardTitle,
    CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar,
    IonBackButton, IonButtons, IonInput, IonItem, IonList, IonLabel,
    IonButton, IonSelect, IonSelectOption
  ]
})
export class PedidosPage implements OnInit {
  // Datos del usuario actual
  usuarioActual: Usuario = { id: '', nombre: '', email: '', rol: 'usuario' };
  esAdmin = false;

  // Datos generales
  pedidos: Pedido[] = [];
  pedidosFiltrados: Pedido[] = [];
  clientes: any[] = [];
  productos: any[] = [];
  clientesUnicos: string[] = [];

  // Filtros para admin
  filtroEstado = '';
  filtroCliente = '';

  // Carrito y compra para usuario
  carrito: ItemCarrito[] = [];
  metodoPago = '';
  mostrarFormulario = false;
  nuevoItem: ItemCarrito = { producto: '', cantidad: 1, precio: 0 };

  // Pedidos del usuario actual
  misPedidos: Pedido[] = [];

  constructor(
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController
  ) {}

  ngOnInit() {
    this.cargarUsuarioActual();
    this.cargarDatos();
    this.cargarCarrito();
    
    if (this.esAdmin) {
      this.obtenerClientesUnicos();
      this.filtrarPedidos();
    } else {
      this.cargarMisPedidos();
    }
  }

  cargarUsuarioActual() {
    const userData = localStorage.getItem('usuarioActual');
    if (userData) {
      this.usuarioActual = JSON.parse(userData);
      this.esAdmin = this.usuarioActual.rol === 'admin';
    } else {
      // Si no hay usuario logueado, redirigir al login
      this.router.navigate(['/login']);
    }
  }

  cargarDatos() {
    const pedidosData = localStorage.getItem('pedidos');
    if (pedidosData) this.pedidos = JSON.parse(pedidosData);

    const clientesData = localStorage.getItem('clientes');
    if (clientesData) this.clientes = JSON.parse(clientesData);

    const productosData = localStorage.getItem('productos');
    if (productosData) this.productos = JSON.parse(productosData);
  }

  cargarCarrito() {
    const carritoData = localStorage.getItem(`carrito_${this.usuarioActual.id}`);
    if (carritoData) this.carrito = JSON.parse(carritoData);
  }

  cargarMisPedidos() {
    this.misPedidos = this.pedidos.filter(p => p.usuarioId === this.usuarioActual.id);
  }

  obtenerClientesUnicos() {
    this.clientesUnicos = [...new Set(this.pedidos.map(p => p.cliente))];
  }

  filtrarPedidos() {
    this.pedidosFiltrados = this.pedidos.filter(pedido => {
      const cumpleEstado = !this.filtroEstado || pedido.estado === this.filtroEstado;
      const cumpleCliente = !this.filtroCliente || pedido.cliente === this.filtroCliente;
      return cumpleEstado && cumpleCliente;
    });
  }

  // NUEVAS FUNCIONES AGREGADAS
  actualizarPrecioProducto() {
    const producto = this.productos.find(p => p.nombre === this.nuevoItem.producto);
    if (producto) {
      this.nuevoItem.precio = producto.precio;
    }
  }

  obtenerStockMaximo(): number {
    const producto = this.productos.find(p => p.nombre === this.nuevoItem.producto);
    return producto ? producto.stock : 1;
  }

  async editarCantidad(index: number) {
    const item = this.carrito[index];
    const producto = this.productos.find(p => p.nombre === item.producto);
    
    const alert = await this.alertController.create({
      header: 'Editar Cantidad',
      message: `Stock disponible: ${producto?.stock || 0}`,
      inputs: [
        {
          name: 'cantidad',
          type: 'number',
          value: item.cantidad,
          min: 1,
          max: producto?.stock || 1
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Actualizar',
          handler: (data) => {
            if (data.cantidad > 0 && data.cantidad <= (producto?.stock || 0)) {
              item.cantidad = parseInt(data.cantidad);
              this.guardarCarrito();
              this.mostrarToast('Cantidad actualizada', 'success');
            } else {
              this.mostrarToast('Cantidad inválida', 'danger');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async verDetallesPedido(pedido: Pedido) {
    let mensaje = `Pedido #${pedido.id}\n\n`;
    
    if (pedido.productos && pedido.productos.length > 0) {
      mensaje += 'Productos:\n';
      pedido.productos.forEach(item => {
        mensaje += `• ${item.producto} x${item.cantidad} - $${item.precio * item.cantidad}\n`;
      });
    } else {
      mensaje += `Producto: ${pedido.producto}\n`;
    }
    
    mensaje += `\nTotal: $${pedido.total}`;
    mensaje += `\nMétodo de pago: ${pedido.metodoPago || 'No especificado'}`;
    mensaje += `\nEstado: ${pedido.estado}`;

    const alert = await this.alertController.create({
      header: 'Detalles del Pedido',
      message: mensaje,
      buttons: ['OK']
    });

    await alert.present();
  }

  // Métodos para el carrito (usuario)
  agregarAlCarrito() {
    const producto = this.productos.find(p => p.nombre === this.nuevoItem.producto);
    if (!producto) {
      this.mostrarToast('Producto no encontrado', 'danger');
      return;
    }

    if (this.nuevoItem.cantidad > producto.stock) {
      this.mostrarToast(`Stock insuficiente. Disponible: ${producto.stock}`, 'warning');
      return;
    }

    // Verificar si el producto ya está en el carrito
    const itemExistente = this.carrito.find(item => item.producto === this.nuevoItem.producto);
    if (itemExistente) {
      if (itemExistente.cantidad + this.nuevoItem.cantidad > producto.stock) {
        this.mostrarToast(`Stock insuficiente. Disponible: ${producto.stock}`, 'warning');
        return;
      }
      itemExistente.cantidad += this.nuevoItem.cantidad;
    } else {
      this.carrito.push({
        producto: this.nuevoItem.producto,
        cantidad: this.nuevoItem.cantidad,
        precio: producto.precio
      });
    }

    this.guardarCarrito();
    this.mostrarToast('Producto agregado al carrito', 'success');
    this.resetearFormulario();
  }

  eliminarDelCarrito(index: number) {
    this.carrito.splice(index, 1);
    this.guardarCarrito();
    this.mostrarToast('Producto eliminado del carrito', 'warning');
  }

  calcularTotal(): number {
    return this.carrito.reduce((total, item) => total + (item.cantidad * item.precio), 0);
  }

  async realizarPedido() {
    if (this.carrito.length === 0) {
      this.mostrarToast('El carrito está vacío', 'warning');
      return;
    }

    if (!this.metodoPago) {
      this.mostrarToast('Selecciona un método de pago', 'warning');
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar Pedido',
      message: `¿Confirmas el pedido por $${this.calcularTotal()}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          handler: () => {
            this.procesarPedido();
          }
        }
      ]
    });

    await alert.present();
  }

  procesarPedido() {
    // Verificar stock antes de procesar
    for (const item of this.carrito) {
      const producto = this.productos.find(p => p.nombre === item.producto);
      if (!producto || producto.stock < item.cantidad) {
        this.mostrarToast(`Stock insuficiente para ${item.producto}`, 'danger');
        return;
      }
    }

    // Crear el pedido
    const nuevoPedido: Pedido = {
      id: Date.now(),
      cliente: this.usuarioActual.nombre,
      producto: this.carrito.map(item => item.producto).join(', '),
      cantidad: this.carrito.reduce((total, item) => total + item.cantidad, 0),
      fecha: new Date().toISOString(),
      estado: 'Pendiente',
      usuarioId: this.usuarioActual.id,
      total: this.calcularTotal(),
      metodoPago: this.metodoPago,
      productos: [...this.carrito]
    };

    // Actualizar stock de productos
    this.carrito.forEach(item => {
      const producto = this.productos.find(p => p.nombre === item.producto);
      if (producto) {
        producto.stock -= item.cantidad;
      }
    });

    // Guardar pedido
    this.pedidos.push(nuevoPedido);
    localStorage.setItem('pedidos', JSON.stringify(this.pedidos));
    localStorage.setItem('productos', JSON.stringify(this.productos));

    // Limpiar carrito
    this.carrito = [];
    this.metodoPago = '';
    this.guardarCarrito();

    // Actualizar mis pedidos
    this.cargarMisPedidos();

    this.mostrarToast('Pedido realizado con éxito', 'success');
    this.mostrarFormulario = false;
  }

  // Métodos para admin
  async cambiarEstadoPedido(pedido: Pedido) {
    const alert = await this.alertController.create({
      header: 'Cambiar Estado',
      message: `Pedido #${pedido.id} - ${pedido.cliente}`,
      inputs: [
        {
          name: 'estado',
          type: 'radio',
          label: 'Pendiente',
          value: 'Pendiente',
          checked: pedido.estado === 'Pendiente'
        },
        {
          name: 'estado',
          type: 'radio',
          label: 'Enviado',
          value: 'Enviado',
          checked: pedido.estado === 'Enviado'
        },
        {
          name: 'estado',
          type: 'radio',
          label: 'Entregado',
          value: 'Entregado',
          checked: pedido.estado === 'Entregado'
        },
        {
          name: 'estado',
          type: 'radio',
          label: 'Cancelado',
          value: 'Cancelado',
          checked: pedido.estado === 'Cancelado'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Actualizar',
          handler: (data) => {
            if (data) {
              pedido.estado = data;
              this.guardarPedidos();
              this.mostrarToast('Estado actualizado', 'success');
            }
          }
        }
      ]
    });

    await alert.present();
  }

  async eliminarPedidoAdmin(pedidoId: number) {
    const alert = await this.alertController.create({
      header: 'Eliminar Pedido',
      message: '¿Estás seguro de que quieres eliminar este pedido?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: () => {
            this.pedidos = this.pedidos.filter(p => p.id !== pedidoId);
            this.guardarPedidos();
            this.filtrarPedidos();
            this.mostrarToast('Pedido eliminado', 'success');
          }
        }
      ]
    });

    await alert.present();
  }

  // Métodos auxiliares
  guardarCarrito() {
    localStorage.setItem(`carrito_${this.usuarioActual.id}`, JSON.stringify(this.carrito));
  }

  guardarPedidos() {
    localStorage.setItem('pedidos', JSON.stringify(this.pedidos));
  }

  resetearFormulario() {
    this.nuevoItem = { producto: '', cantidad: 1, precio: 0 };
    this.mostrarFormulario = false;
  }

  async mostrarToast(message: string, color: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    await toast.present();
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
            localStorage.removeItem('usuarioActual');
            this.router.navigate(['/login']);
          }
        }
      ]
    });

    await alert.present();
  }
}