import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonBackButton, IonButtons, IonInput, IonItem,
  IonList, IonLabel, IonButton, IonIcon, IonCardTitle, 
  IonCardHeader, IonCard, IonCardContent, IonAvatar, 
  IonNote, IonBadge, IonSelect, IonSelectOption, IonSegment, 
  IonSegmentButton
} from '@ionic/angular/standalone';

interface Proveedor {
  id: number;
  nombre: string;
  telefono: string;
  empresa: string;
  correo: string;
  fecha: string;
}

interface ItemCarrito {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  categoria: string;
}

interface Pedido {
  id: number;
  usuario: string;
  items: ItemCarrito[];
  total: number;
  fecha: string;
  estado: 'pendiente' | 'en_proceso' | 'completado' | 'cancelado';
  telefono?: string;
  direccion?: string;
}

@Component({
  selector: 'app-proveedores',
  templateUrl: './proveedores.page.html',
  styleUrls: ['./proveedores.page.scss'],
  standalone: true,
  imports: [
    IonNote, IonAvatar, IonCardContent, IonCard, IonCardHeader, 
    IonCardTitle, CommonModule, FormsModule, IonContent, IonHeader, 
    IonTitle, IonToolbar, IonBackButton, IonButtons, IonInput, 
    IonItem, IonList, IonLabel, IonButton, IonBadge, IonSelect, 
    IonSelectOption, IonSegment, IonSegmentButton
  ]
})
export class ProveedoresPage implements OnInit {
  // Variables originales de proveedores
  proveedores: Proveedor[] = [];
  mostrarFormulario = false;
  nuevoProveedor: Proveedor = this.crearProveedorVacio();

  // Variables para sistema de pedidos/carrito
  esAdmin = false;
  vistaActual: 'proveedores' | 'carrito' | 'pedidos' = 'proveedores';
  
  // Para el carrito del usuario
  carrito: ItemCarrito[] = [];
  mostrarFormularioItem = false;
  nuevoItem: ItemCarrito = this.crearItemVacio();
  
  // Para los pedidos del admin
  pedidos: Pedido[] = [];
  filtroEstado = 'todos';
  
  // Usuario actual
  usuarioActual = 'usuario@ejemplo.com';

  ngOnInit() {
    this.determinarRolUsuario();
    this.cargarDatos();
  }

  determinarRolUsuario() {
    // Determinar el rol del usuario
    const rol = localStorage.getItem('userRole');
    this.esAdmin = rol === 'admin';
    
    // Obtener usuario actual
    const usuario = localStorage.getItem('currentUser');
    if (usuario) {
      this.usuarioActual = usuario;
    }

    // Establecer vista inicial según el rol
    if (this.esAdmin) {
      this.vistaActual = 'proveedores';
    } else {
      this.vistaActual = 'carrito';
    }
  }

  cargarDatos() {
    // Cargar proveedores
    const dataProveedores = localStorage.getItem('proveedores');
    if (dataProveedores) {
      this.proveedores = JSON.parse(dataProveedores);
    }

    // Cargar carrito si es usuario
    if (!this.esAdmin) {
      const dataCarrito = localStorage.getItem(`carrito_${this.usuarioActual}`);
      if (dataCarrito) {
        this.carrito = JSON.parse(dataCarrito);
      }
    }

    // Cargar pedidos si es admin
    if (this.esAdmin) {
      const dataPedidos = localStorage.getItem('pedidos');
      if (dataPedidos) {
        this.pedidos = JSON.parse(dataPedidos);
      }
    }
  }

  cambiarVista(vista: 'proveedores' | 'carrito' | 'pedidos') {
    this.vistaActual = vista;
    this.cargarDatos();
  }

  // FUNCIONES ORIGINALES DE PROVEEDORES
  crearProveedorVacio(): Proveedor {
    return {
      id: 0,
      nombre: '',
      telefono: '',
      empresa: '',
      correo: '',
      fecha: ''
    };
  }

  guardarProveedor() {
    const p = this.nuevoProveedor;
    if (p.nombre && p.telefono && p.empresa && p.correo && p.fecha) {
      if (p.id === 0) {
        p.id = this.proveedores.length > 0 ? Math.max(...this.proveedores.map(x => x.id)) + 1 : 1;
        this.proveedores.push({ ...p });
      } else {
        const index = this.proveedores.findIndex(prov => prov.id === p.id);
        if (index > -1) {
          this.proveedores[index] = { ...p };
        }
      }

      this.guardarEnLocalStorage();
      this.resetearFormulario();
      this.mostrarFormulario = false;
    } else {
      alert('Por favor completa todos los campos.');
    }
  }

  editarProveedor(index: number) {
    this.nuevoProveedor = { ...this.proveedores[index] };
    this.mostrarFormulario = true;
  }

  eliminarProveedor(index: number) {
    const confirmado = confirm(`¿Eliminar al proveedor "${this.proveedores[index].nombre}"?`);
    if (confirmado) {
      this.proveedores.splice(index, 1);
      this.guardarEnLocalStorage();
      this.resetearFormulario();
      this.mostrarFormulario = false;
    }
  }

  resetearFormulario() {
    this.nuevoProveedor = this.crearProveedorVacio();
  }

  guardarEnLocalStorage() {
    localStorage.setItem('proveedores', JSON.stringify(this.proveedores));
  }

  // FUNCIONES PARA EL CARRITO (USUARIO)
  crearItemVacio(): ItemCarrito {
    return {
      id: 0,
      nombre: '',
      precio: 0,
      cantidad: 1,
      categoria: ''
    };
  }

  agregarAlCarrito() {
    const item = this.nuevoItem;
    if (item.nombre && item.precio > 0 && item.cantidad > 0) {
      const existente = this.carrito.find(i => i.nombre.toLowerCase() === item.nombre.toLowerCase());
      
      if (existente) {
        existente.cantidad += item.cantidad;
      } else {
        item.id = this.carrito.length > 0 ? Math.max(...this.carrito.map(x => x.id)) + 1 : 1;
        this.carrito.push({ ...item });
      }
      
      this.guardarCarrito();
      this.resetearFormularioItem();
      this.mostrarFormularioItem = false;
    } else {
      alert('Por favor completa todos los campos correctamente.');
    }
  }

  editarItemCarrito(index: number) {
    this.nuevoItem = { ...this.carrito[index] };
    this.mostrarFormularioItem = true;
  }

  eliminarDelCarrito(index: number) {
    const item = this.carrito[index];
    const confirmado = confirm(`¿Eliminar "${item.nombre}" del carrito?`);
    if (confirmado) {
      this.carrito.splice(index, 1);
      this.guardarCarrito();
    }
  }

  obtenerTotalCarrito(): number {
    return this.carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  }

  realizarPedido() {
    if (this.carrito.length === 0) {
      alert('El carrito está vacío');
      return;
    }

    const confirmado = confirm(`¿Confirmar pedido por $${this.obtenerTotalCarrito().toFixed(2)}?`);
    if (!confirmado) return;

    const nuevoPedido: Pedido = {
      id: this.generarIdPedido(),
      usuario: this.usuarioActual,
      items: [...this.carrito],
      total: this.obtenerTotalCarrito(),
      fecha: new Date().toISOString(),
      estado: 'pendiente'
    };

    this.agregarPedido(nuevoPedido);
    this.carrito = [];
    this.guardarCarrito();
    
    alert('¡Pedido realizado exitosamente!');
  }

  resetearFormularioItem() {
    this.nuevoItem = this.crearItemVacio();
  }

  guardarCarrito() {
    localStorage.setItem(`carrito_${this.usuarioActual}`, JSON.stringify(this.carrito));
  }

  // FUNCIONES PARA LOS PEDIDOS (ADMIN)
  getPedidosFiltrados(): Pedido[] {
    if (this.filtroEstado === 'todos') {
      return this.pedidos;
    }
    return this.pedidos.filter(p => p.estado === this.filtroEstado);
  }

  cambiarEstadoPedido(pedidoId: number, nuevoEstado: string) {
    const pedido = this.pedidos.find(p => p.id === pedidoId);
    if (pedido) {
      pedido.estado = nuevoEstado as any;
      this.guardarPedidos();
    }
  }

  eliminarPedido(index: number) {
    const pedido = this.getPedidosFiltrados()[index];
    const pedidoIndex = this.pedidos.findIndex(p => p.id === pedido.id);
    const confirmado = confirm(`¿Eliminar pedido #${pedido.id} de ${pedido.usuario}?`);
    if (confirmado) {
      this.pedidos.splice(pedidoIndex, 1);
      this.guardarPedidos();
    }
  }

  obtenerResumenPedidos() {
    const total = this.pedidos.length;
    const pendientes = this.pedidos.filter(p => p.estado === 'pendiente').length;
    const enProceso = this.pedidos.filter(p => p.estado === 'en_proceso').length;
    const completados = this.pedidos.filter(p => p.estado === 'completado').length;
    
    return { total, pendientes, enProceso, completados };
  }

  generarIdPedido(): number {
    const pedidosExistentes = JSON.parse(localStorage.getItem('pedidos') || '[]');
    return pedidosExistentes.length > 0 ? 
      Math.max(...pedidosExistentes.map((p: Pedido) => p.id)) + 1 : 1;
  }

  agregarPedido(pedido: Pedido) {
    const pedidos = JSON.parse(localStorage.getItem('pedidos') || '[]');
    pedidos.push(pedido);
    localStorage.setItem('pedidos', JSON.stringify(pedidos));
  }

  guardarPedidos() {
    localStorage.setItem('pedidos', JSON.stringify(this.pedidos));
  }

  getColorEstado(estado: string): string {
    switch (estado) {
      case 'pendiente': return 'warning';
      case 'en_proceso': return 'primary';
      case 'completado': return 'success';
      case 'cancelado': return 'danger';
      default: return 'medium';
    }
  }

  getEmojiEstado(estado: string): string {
    switch (estado) {
      case 'pendiente': return '⏳';
      case 'en_proceso': return '🔄';
      case 'completado': return '✅';
      case 'cancelado': return '❌';
      default: return '📦';
    }
  }

  getTituloVista(): string {
    switch (this.vistaActual) {
      case 'proveedores': return 'Gestión de Proveedores';
      case 'carrito': return 'Mi Carrito';
      case 'pedidos': return 'Gestión de Pedidos';
      default: return 'Gestión';
    }
  }

  getIconoVista(): string {
    switch (this.vistaActual) {
      case 'proveedores': return '🏢';
      case 'carrito': return '🛒';
      case 'pedidos': return '📋';
      default: return '📱';
    }
  }
}