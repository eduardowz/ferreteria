import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

// Importar el servicio de carrito compartido
import { CarritoService, ProductoCarrito } from '../services/carrito.service';

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: string;
  fecha: string;
  proveedor: string;
  image?: string;
}

@Component({
  selector: 'app-productos',
  templateUrl: './productos.page.html',
  styleUrls: ['./productos.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ProductosPage implements OnInit, OnDestroy {
  productos: Producto[] = [];
  proveedores: any[] = [];
  carrito: ProductoCarrito[] = [];
  carritoSubscription?: Subscription;
  
  esAdmin: boolean = false;
  mostrarCarrito: boolean = false;
  mostrarFormulario: boolean = false;
  vistaActual: 'grid' | 'lista' = 'grid';

  nuevoProducto: Producto = this.crearProductoVacio();

  constructor(
    private toastController: ToastController,
    private router: Router,
    private carritoService: CarritoService  // Inyectar el servicio compartido
  ) {}

  ngOnInit() {
    this.crearUsuarioInvitadoSiNoExiste();
    this.verificarRolUsuario();
    this.cargarProductos();
    this.cargarProveedores();
    
    // Suscribirse al carrito compartido
    this.carritoSubscription = this.carritoService.carrito$.subscribe(
      carrito => {
        this.carrito = carrito;
      }
    );
  }

  ngOnDestroy() {
    // Limpiar suscripción para evitar memory leaks
    if (this.carritoSubscription) {
      this.carritoSubscription.unsubscribe();
    }
  }

  crearUsuarioInvitadoSiNoExiste() {
    const userData = localStorage.getItem('userData');
    if (!userData) {
      const usuarioInvitado = {
        email: 'invitado@tienda.com',
        rol: 'usuario',
        nombre: 'Usuario Invitado',
        id: 'guest-' + Date.now()
      };
      localStorage.setItem('userData', JSON.stringify(usuarioInvitado));
    }
  }

  verificarRolUsuario() {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.esAdmin = user.rol === 'admin';
      } catch (error) {
        this.esAdmin = false;
      }
    } else {
      this.esAdmin = false;
    }
  }

  cargarProductos() {
    const data = localStorage.getItem('productos');
    if (data) {
      this.productos = JSON.parse(data);
    } else {
      this.productos = [
        {
          id: 1,
          nombre: 'Red Bull Energy Drink 250ml',
          descripcion: 'Bebida energética con taurina y cafeína',
          precio: 45,
          stock: 50,
          categoria: 'Bebidas Energéticas',
          fecha: '2025-07-01',
          proveedor: 'Red Bull Company',
          image: 'assets/images/redbull.jpg'
        },
        {
          id: 2,
          nombre: 'Monster Energy Original 473ml',
          descripcion: 'Bebida energética con sabor original',
          precio: 35,
          stock: 30,
          categoria: 'Bebidas Energéticas',
          fecha: '2025-07-01',
          proveedor: 'Monster Beverage',
          image: 'assets/images/Monster Energy.jpg'
        },
        {
          id: 3,
          nombre: 'Rockstar Energy Drink 500ml',
          descripcion: 'Bebida energética con vitaminas',
          precio: 45,
          stock: 25,
          categoria: 'Bebidas Energéticas',
          fecha: '2025-07-01',
          proveedor: 'Rockstar Inc',
          image: 'assets/images/Rockstar Energy.jpg'
        },
        {
          id: 4,
          nombre: 'Monster Ultra Zero 355ml',
          descripcion: 'Bebida energética sin azúcar',
          precio: 35,
          stock: 40,
          categoria: 'Bebidas Energéticas',
          fecha: '2025-07-01',
          proveedor: 'Monster Beverage',
          image: 'assets/images/Monster Ultra Zero.jpg'
        },
        {
          id: 5,
          nombre: 'Prime Energy Drink 355ml',
          descripcion: 'Bebida energética de nueva generación',
          precio: 20,
          stock: 60,
          categoria: 'Bebidas Energéticas',
          fecha: '2025-07-01',
          proveedor: 'Prime Hydration',
          image: 'assets/images/Prime Energy Drink.jpg'
        }
      ];
      this.guardarEnLocalStorage();
    }
  }

  cargarProveedores() {
    const provData = localStorage.getItem('proveedores');
    if (provData) {
      this.proveedores = JSON.parse(provData);
    }
  }

  crearProductoVacio(): Producto {
    return {
      id: 0,
      nombre: '',
      descripcion: '',
      precio: 0,
      stock: 0,
      categoria: '',
      fecha: '',
      proveedor: '',
      image: ''
    };
  }

  // Método para cambiar vista
  cambiarVista(vista: 'grid' | 'lista') {
    this.vistaActual = vista;
  }

  // Método para ADMIN - Guardar producto
  guardarProducto() {
    if (!this.esAdmin) {
      this.mostrarToast('No tienes permisos para realizar esta acción', 'danger');
      return;
    }

    const p = this.nuevoProducto;

    if (
      p.nombre &&
      p.descripcion &&
      p.precio > 0 &&
      p.stock >= 0 &&
      p.categoria &&
      p.fecha &&
      p.proveedor
    ) {
      if (p.id === 0) {
        // Nuevo producto
        p.id = this.productos.length > 0 ? Math.max(...this.productos.map(x => x.id)) + 1 : 1;
        this.productos.push({ ...p });
        this.mostrarToast('Producto agregado exitosamente', 'success');
      } else {
        // Edición de producto existente
        const index = this.productos.findIndex(prod => prod.id === p.id);
        if (index > -1) {
          this.productos[index] = { ...p };
          this.mostrarToast('Producto actualizado exitosamente', 'success');
        }
      }

      this.guardarEnLocalStorage();
      this.mostrarFormulario = false;
      this.resetearFormulario();
    } else {
      this.mostrarToast('Por favor completa todos los campos incluyendo el proveedor', 'warning');
    }
  }

  // Método para ADMIN - Editar producto
  editarProducto(index: number) {
    if (!this.esAdmin) {
      this.mostrarToast('No tienes permisos para realizar esta acción', 'danger');
      return;
    }

    this.nuevoProducto = { ...this.productos[index] };
    this.mostrarFormulario = true;
  }

  // Método para ADMIN - Eliminar producto
  eliminarProducto(index: number) {
    if (!this.esAdmin) {
      this.mostrarToast('No tienes permisos para realizar esta acción', 'danger');
      return;
    }

    const confirmado = confirm(`¿Eliminar el producto "${this.productos[index].nombre}"?`);
    if (confirmado) {
      this.productos.splice(index, 1);
      this.guardarEnLocalStorage();
      this.resetearFormulario();
      this.mostrarFormulario = false;
      this.mostrarToast('Producto eliminado exitosamente', 'success');
    }
  }

  // MÉTODO ACTUALIZADO: Agregar al carrito usando el servicio compartido
  agregarAlCarrito(producto: Producto) {
    if (this.esAdmin) {
      this.mostrarToast('Los administradores no pueden agregar productos al carrito', 'warning');
      return;
    }

    if (producto.stock === 0) {
      this.mostrarToast('Este producto no tiene stock disponible', 'danger');
      return;
    }

    // Usar el servicio compartido para agregar al carrito
    const success = this.carritoService.agregarProducto({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1
    });

    if (success) {
      this.mostrarToast(`${producto.nombre} agregado al carrito`, 'success');
    } else {
      this.mostrarToast('Error al agregar producto al carrito', 'danger');
    }
  }

  // MÉTODOS ACTUALIZADOS: Gestión del carrito usando el servicio compartido
  aumentarCantidad(productoId: number) {
    const item = this.carrito.find(c => c.id === productoId);
    if (item) {
      const producto = this.productos.find(p => p.id === productoId);
      if (producto && item.cantidad < producto.stock) {
        this.carritoService.actualizarCantidad(productoId, item.cantidad + 1);
        this.mostrarToast('Cantidad aumentada', 'success');
      } else {
        this.mostrarToast('Stock insuficiente', 'warning');
      }
    }
  }

  disminuirCantidad(productoId: number) {
    const item = this.carrito.find(c => c.id === productoId);
    if (item) {
      if (item.cantidad > 1) {
        this.carritoService.actualizarCantidad(productoId, item.cantidad - 1);
        this.mostrarToast('Cantidad disminuida', 'success');
      } else {
        this.eliminarDelCarrito(productoId);
      }
    }
  }

  eliminarDelCarrito(productoId: number) {
    const item = this.carrito.find(c => c.id === productoId);
    if (item) {
      this.carritoService.eliminarProducto(productoId);
      this.mostrarToast(`${item.nombre} eliminado del carrito`, 'warning');
    }
  }

  vaciarCarrito() {
    const confirmado = confirm('¿Estás seguro de que quieres vaciar el carrito?');
    if (confirmado) {
      this.carritoService.vaciarCarrito();
      this.mostrarToast('Carrito vaciado', 'warning');
    }
  }

  // MÉTODOS ACTUALIZADOS: Usar el servicio para cálculos
  calcularTotalCarrito(): number {
    return this.carritoService.calcularTotal();
  }

  obtenerCantidadTotal(): number {
    return this.carritoService.obtenerCantidadTotal();
  }

  procederCompra() {
    if (this.carrito.length === 0) {
      this.mostrarToast('El carrito está vacío', 'warning');
      return;
    }
    
    const total = this.calcularTotalCarrito();
    const confirmado = confirm(`¿Proceder con la compra por un total de ${total}?`);
    
    if (confirmado) {
      // Reducir el stock de los productos
      this.carrito.forEach(item => {
        const producto = this.productos.find(p => p.id === item.id);
        if (producto) {
          producto.stock -= item.cantidad;
        }
      });
      
      this.guardarEnLocalStorage();
      this.carritoService.vaciarCarrito();
      this.mostrarToast('¡Compra realizada exitosamente!', 'success');
    }
  }

  // NUEVO: Método para sincronizar con el carrito de pedidos
  sincronizarConPedidos() {
    // Este método podría usarse si necesitas hacer alguna sincronización especial
    // Por ahora, la sincronización es automática gracias al servicio compartido
    this.mostrarToast('Carrito sincronizado con página de pedidos', 'info');
  }

  // NUEVO: Método para ir a la página de pedidos
  irAPedidos() {
    this.router.navigate(['/pedidos']);
  }

  resetearFormulario() {
    this.nuevoProducto = this.crearProductoVacio();
  }

  guardarEnLocalStorage() {
    localStorage.setItem('productos', JSON.stringify(this.productos));
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 2000,
      color: color,
      position: 'top'
    });
    toast.present();
  }
}