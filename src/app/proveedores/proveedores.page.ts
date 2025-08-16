import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonBackButton, IonButtons, IonInput, IonItem,
  IonList, IonLabel, IonButton, IonIcon, IonCardTitle, 
  IonCardHeader, IonCard, IonCardContent, IonAvatar, 
  IonNote, IonBadge
} from '@ionic/angular/standalone';

interface Proveedor {
  id: number;
  nombre: string;
  telefono: string;
  empresa: string;
  correo: string;
  fecha: string;
}

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

interface UserData {
  id?: number;
  username: string;
  nombre?: string;
  email?: string;
  role: 'admin' | 'user';
  rol?: 'admin' | 'usuario';
  empresa?: string;
  fechaCreacion?: string;
  telefono?: string;
}

@Component({
  selector: 'app-proveedores',
  templateUrl: './proveedores.page.html',
  styleUrls: ['./proveedores.page.scss'],
  standalone: true,
  imports: [IonNote, IonAvatar, 
    IonCardContent, IonCard, IonCardHeader, IonCardTitle,
    CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar,
    IonBackButton, IonButtons, IonInput, IonItem, IonList, IonLabel, IonButton,
    IonIcon, IonBadge
  ]
})
export class ProveedoresPage implements OnInit {
  // Variables originales para administradores
  proveedores: Proveedor[] = [];
  mostrarFormulario = false;
  comprasRealizadas: CompraRealizada[] = [];
  comprasFiltradas: CompraRealizada[] = [];
  nuevoProveedor: Proveedor = this.crearProveedorVacio();

  // Variables para usuarios
  isAdmin: boolean = false;
  userData: UserData | null = null;
  usuarioActual: string = '';
  misCompras: CompraRealizada[] = [];


  ngOnInit() {
    this.checkUserRole();
    this.cargarDatosUsuario();
    this.cargarProveedores();
    this.cargarComprasRealizadas();
    
    if (this.isAdmin) {
      // Funcionalidad original para admin
      this.filtrarCompras();
    } else {
      // Funcionalidad para usuarios
      this.filtrarMisPedidos();
    }
  }

  // Método para verificar el rol del usuario
  checkUserRole() {
    try {
      this.isAdmin = false;
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const userData: UserData = JSON.parse(userDataStr);
        this.isAdmin = userData.role === 'admin' || userData.rol === 'admin';
        return;
      }

      const role = localStorage.getItem('role');
      const userType = localStorage.getItem('userType');
      
      if (role) {
        this.isAdmin = role.toLowerCase() === 'admin';
      } else if (userType) {
        this.isAdmin = userType.toLowerCase() === 'admin';
      }
    } catch (error) {
      console.error('Error al verificar rol de usuario:', error);
    }
  }

  // Cargar datos del usuario actual
  cargarDatosUsuario() {
    try {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        this.userData = JSON.parse(userDataStr);
        this.usuarioActual = this.userData?.email || '';
      } else {
        this.usuarioActual = localStorage.getItem('userEmail') || '';
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
    }
  }

  // Cargar proveedores desde localStorage
  cargarProveedores() {
    const data = localStorage.getItem('proveedores');
    if (data) {
      try {
        this.proveedores = JSON.parse(data);
      } catch (error) {
        console.error('Error al cargar proveedores:', error);
        this.proveedores = [];
      }
    } else {
      // Si no hay proveedores, crear algunos de ejemplo
      this.crearProveedoresEjemplo();
    }
  }

  // Crear proveedores de ejemplo
  crearProveedoresEjemplo() {
    this.proveedores = [
      {
        id: 1,
        nombre: 'Carlos Mendoza',
        empresa: 'Herramientas del Norte S.A.',
        telefono: '(555) 234-5678',
        correo: 'ventas@herramientasnorte.com',
        fecha: '2023-01-15'
      },
      {
        id: 2,
        nombre: 'Ana Patricia López',
        empresa: 'Materiales de Construcción López',
        telefono: '(555) 345-6789',
        correo: 'contacto@materialeslopez.mx',
        fecha: '2022-08-22'
      },
      {
        id: 3,
        nombre: 'Roberto Silva',
        empresa: 'Tornillería Especializada RSP',
        telefono: '(555) 456-7890',
        correo: 'pedidos@tornilleriarp.com',
        fecha: '2023-03-10'
      },
      {
        id: 4,
        nombre: 'María Elena Ruiz',
        empresa: 'Pinturas y Acabados Profesionales',
        telefono: '(555) 567-8901',
        correo: 'info@pinturaspro.mx',
        fecha: '2022-11-05'
      },
      {
        id: 5,
        nombre: 'José Luis García',
        empresa: 'Electricidad Industrial GJL',
        telefono: '(555) 678-9012',
        correo: 'contacto@electricidadgjl.com',
        fecha: '2023-05-18'
      }
    ];
  }

  cargarComprasRealizadas() {
    const comprasData = localStorage.getItem('compras_realizadas');
    if (comprasData) {
      try {
        this.comprasRealizadas = JSON.parse(comprasData);
      } catch {
        this.comprasRealizadas = [];
      }
    } else {
      this.comprasRealizadas = [];
    }
  }

  // Método original para administradores
  filtrarCompras() {
    this.comprasFiltradas = this.comprasRealizadas;
  }

  // Filtrar pedidos del usuario actual
  filtrarMisPedidos() {
    if (!this.usuarioActual) {
      this.misCompras = [];
      return;
    }

    this.misCompras = this.comprasRealizadas.filter(compra => {
      return compra.usuarioId === this.usuarioActual || 
             compra.cliente === this.usuarioActual ||
             compra.cliente === this.userData?.nombre ||
             compra.cliente === this.userData?.username;
    });

    this.misCompras.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
  }

  // =============== MÉTODOS ORIGINALES PARA ADMIN ===============
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

  // Métodos de estadísticas para admin
  obtenerComprasPorEstado(estado: string): number {
    return this.comprasFiltradas.filter(compra => compra.estado === estado).length;
  }

  calcularTotalDescuentosAplicados(): number {
    return this.comprasFiltradas
      .filter(compra => compra.aplicaDescuento)
      .reduce((total, compra) => total + compra.descuento, 0);
  }

  // =============== MÉTODOS PARA USUARIOS ===============
  // Estadísticas del usuario
  obtenerMisPedidosPorEstado(estado: string): number {
    return this.misCompras.filter(compra => compra.estado === estado).length;
  }

  calcularMisTotalDescuentos(): number {
    return this.misCompras
      .filter(compra => compra.aplicaDescuento)
      .reduce((total, compra) => total + compra.descuento, 0);
  }

  calcularTotalGastado(): number {
    return this.misCompras.reduce((total, compra) => total + compra.total, 0);
  }

  // Calcular descuento del próximo envío basado en número de pedidos
  calcularDescuentoProximoEnvio(): number {
    const pedidosRealizados = this.misCompras.length;
    
    // Lógica de descuentos progresivos
    if (pedidosRealizados >= 10) {
      return 20; // 20% de descuento después de 10 pedidos
    } else if (pedidosRealizados >= 7) {
      return 15; // 15% de descuento después de 7 pedidos
    } else if (pedidosRealizados >= 5) {
      return 10; // 10% de descuento después de 5 pedidos
    } else if (pedidosRealizados >= 3) {
      return 5; // 5% de descuento después de 3 pedidos
    }
    
    return 0; // Sin descuento
  }

  // Obtener número de pedidos necesarios para el siguiente nivel de descuento
  obtenerPedidosParaDescuento(): number {
    const pedidosRealizados = this.misCompras.length;
    
    if (pedidosRealizados < 3) return 3;
    if (pedidosRealizados < 5) return 5;
    if (pedidosRealizados < 7) return 7;
    if (pedidosRealizados < 10) return 10;
    
    return 10; // Máximo nivel alcanzado
  }

  // Obtener pedidos recientes (últimos 3)
  obtenerPedidosRecientes(): CompraRealizada[] {
    return this.misCompras.slice(0, 3);
  }



  // Obtener el color del badge según el estado
  obtenerColorEstado(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'pendiente':
        return 'warning';
      case 'enviado':
        return 'primary';
      case 'entregado':
        return 'success';
      case 'cancelado':
        return 'danger';
      default:
        return 'medium';
    }
  }

  // Obtener emoji según el estado
  obtenerEmojiEstado(estado: string): string {
    switch (estado.toLowerCase()) {
      case 'pendiente':
        return '⏳';
      case 'enviado':
        return '🚚';
      case 'entregado':
        return '✅';
      case 'cancelado':
        return '❌';
      default:
        return '📦';
    }
  }

  // Formatear fecha para mostrar
  formatearFecha(fecha: string): string {
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fecha;
    }
  }

  // Formatear fecha específica para proveedores (más simple)
  formatearFechaProveedor(fecha: string): string {
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return fecha;
    }
  }

  // Obtener resumen de productos
  obtenerResumenProductos(productos: ProductoCompra[]): string {
    if (productos.length === 0) return 'Sin productos';
    if (productos.length === 1) return productos[0].nombre;
    return `${productos[0].nombre} y ${productos.length - 1} más`;
  }

  // Refrescar todos los datos
  refrescarDatos() {
    this.cargarComprasRealizadas();
    if (this.isAdmin) {
      this.filtrarCompras();
    } else {
      this.filtrarMisPedidos();
    }
    console.log('Datos actualizados');
  }

  // Refrescar solo proveedores
  refrescarProveedores() {
    this.cargarProveedores();
    console.log('Proveedores refrescados:', this.proveedores.length);
  }

  // Método para obtener años de experiencia de un proveedor
  obtenerAñosExperiencia(fechaInicio: string): number {
    try {
      const fechaIni = new Date(fechaInicio);
      const fechaActual = new Date();
      const diferencia = fechaActual.getTime() - fechaIni.getTime();
      const años = Math.floor(diferencia / (1000 * 60 * 60 * 24 * 365));
      return Math.max(años, 0);
    } catch {
      return 0;
    }
  }

  // Verificar si un proveedor es premium (más de 1 año)
  esProveedorPremium(fechaInicio: string): boolean {
    return this.obtenerAñosExperiencia(fechaInicio) >= 1;
  }

  // Obtener mensaje motivacional basado en el progreso
  obtenerMensajeProgreso(): string {
    const pedidosRealizados = this.misCompras.length;
    const siguienteNivel = this.obtenerPedidosParaDescuento();
    const faltantes = siguienteNivel - pedidosRealizados;

    if (faltantes <= 0) {
      return '¡Felicitaciones! Has alcanzado el máximo nivel de descuentos.';
    }

    if (faltantes === 1) {
      return `¡Solo te falta 1 pedido más para desbloquear el siguiente descuento!`;
    }

    return `Te faltan ${faltantes} pedidos para tu próximo descuento especial.`;
  }

  // Verificar si el usuario tiene descuento disponible
  tieneDescuentoDisponible(): boolean {
    return this.calcularDescuentoProximoEnvio() > 0;
  }

  // Obtener porcentaje de progreso hacia el siguiente descuento
  obtenerPorcentajeProgreso(): number {
    const pedidosRealizados = this.misCompras.length;
    const siguienteNivel = this.obtenerPedidosParaDescuento();
    
    if (pedidosRealizados >= siguienteNivel) {
      return 100;
    }
    
    return Math.round((pedidosRealizados / siguienteNivel) * 100);
  }
}