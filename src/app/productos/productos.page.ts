import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

// Importar el servicio de carrito compartido
import { CarritoService, ProductoCarrito, MetodoPago } from '../services/carrito.service';

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

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  role: 'admin' | 'user';
  rol: 'admin' | 'usuario';
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
  productosFiltrados: Producto[] = [];
  proveedores: any[] = [];
  carrito: ProductoCarrito[] = [];
  carritoSubscription?: Subscription;
  
  // Datos del usuario actual
  usuarioActual: Usuario = { 
    id: '', 
    nombre: '', 
    email: '', 
    role: 'user' as const, 
    rol: 'usuario' as const 
  };
  esAdmin: boolean = false;
  
  // Funcionalidades existentes
  mostrarCarrito: boolean = false;
  mostrarFormulario: boolean = false;
  vistaActual: 'grid' | 'lista' = 'grid';
  nuevoProducto: Producto = this.crearProductoVacio();

  // NUEVAS FUNCIONALIDADES
  // Buscador
  terminoBusqueda: string = '';
  
  // Sistema de pago
  mostrarPago: boolean = false;
  metodoPagoSeleccionado: MetodoPago | null = null;
  
  // Información de descuento
  montoMinimoDescuento: number = 500;
  porcentajeDescuento: number = 10;

  constructor(
    private toastController: ToastController,
    private router: Router,
    private carritoService: CarritoService
  ) {
    // Obtener configuración de descuentos del servicio
    this.montoMinimoDescuento = this.carritoService.obtenerMontoMinimoDescuento();
    this.porcentajeDescuento = this.carritoService.obtenerPorcentajeDescuento();
  }

  ngOnInit() {
    this.cargarUsuarioActual();
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
    if (this.carritoSubscription) {
      this.carritoSubscription.unsubscribe();
    }
  }

  // NUEVO: Cargar usuario actual con verificación mejorada
  cargarUsuarioActual() {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.usuarioActual = {
          id: user.id || '',
          nombre: user.nombre || '',
          email: user.email || '',
          role: user.role || 'user',
          rol: user.rol || 'usuario'
        };
        
        console.log('Usuario cargado en productos:', this.usuarioActual);
        console.log('Role:', user.role);
        console.log('Rol:', user.rol);
        
      } catch (error) {
        console.error('Error al parsear datos del usuario:', error);
        this.crearUsuarioInvitadoSiNoExiste();
      }
    } else {
      this.crearUsuarioInvitadoSiNoExiste();
    }
  }

  crearUsuarioInvitadoSiNoExiste() {
    const userData = localStorage.getItem('userData');
    if (!userData) {
      const usuarioInvitado: Usuario = {
        email: 'invitado@tienda.com',
        role: 'user' as const,
        rol: 'usuario' as const,
        nombre: 'Usuario Invitado',
        id: 'guest-' + Date.now()
      };
      localStorage.setItem('userData', JSON.stringify(usuarioInvitado));
      this.usuarioActual = usuarioInvitado;
      console.log('Usuario invitado creado:', usuarioInvitado);
    }
  }

  verificarRolUsuario() {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        
        // VERIFICACIÓN MEJORADA: Comprobar ambos campos de rol
        this.esAdmin = (user.role === 'admin') || (user.rol === 'admin');
        
        console.log('Verificando rol en productos:');
        console.log('User object:', user);
        console.log('user.role:', user.role);
        console.log('user.rol:', user.rol);
        console.log('Es admin?:', this.esAdmin);
        
      } catch (error) {
        console.error('Error al verificar rol:', error);
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
    
    // Inicializar productos filtrados
    this.productosFiltrados = [...this.productos];
  }

  cargarProveedores() {
    const provData = localStorage.getItem('proveedores');
    if (provData) {
      this.proveedores = JSON.parse(provData);
    }
  }

  // NUEVOS MÉTODOS PARA EL BUSCADOR
  buscarProductos() {
    if (!this.terminoBusqueda.trim()) {
      this.productosFiltrados = [...this.productos];
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase().trim();
    this.productosFiltrados = this.productos.filter(producto =>
      producto.nombre.toLowerCase().includes(termino) ||
      producto.descripcion.toLowerCase().includes(termino) ||
      producto.categoria.toLowerCase().includes(termino) ||
      producto.proveedor.toLowerCase().includes(termino)
    );

    if (this.productosFiltrados.length === 0) {
      this.mostrarToast(`No se encontraron productos con "${this.terminoBusqueda}"`, 'warning');
    }
  }

  limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.productosFiltrados = [...this.productos];
    this.mostrarToast('Búsqueda limpiada', 'medium');
  }

  // NUEVOS MÉTODOS PARA EL SISTEMA DE PAGO
  mostrarOpcionesPago() {
    if (this.carrito.length === 0) {
      this.mostrarToast('El carrito está vacío', 'warning');
      return;
    }
    this.mostrarPago = true;
  }

  cerrarPago() {
    this.mostrarPago = false;
    this.metodoPagoSeleccionado = null;
  }

  seleccionarMetodoPago(metodo: MetodoPago) {
    this.metodoPagoSeleccionado = metodo;
  }

  // MÉTODO CORREGIDO: confirmarCompra con guardado para panel de admin
  async confirmarCompra() {
    if (!this.metodoPagoSeleccionado) {
      this.mostrarToast('Por favor selecciona un método de pago', 'warning');
      return;
    }

    const resultado = this.carritoService.procesarCompra(this.metodoPagoSeleccionado);
    
    if (!resultado.exito) {
      this.mostrarToast(resultado.mensaje, 'danger');
      return;
    }

    // Reducir el stock de los productos
    this.carrito.forEach(item => {
      const producto = this.productos.find(p => p.id === item.id);
      if (producto) {
        producto.stock -= item.cantidad;
      }
    });
    
    this.guardarEnLocalStorage();
    
    // Actualizar productos filtrados si hay búsqueda activa
    this.buscarProductos();
    
    // NUEVO: Guardar la compra para el panel de administración
    this.guardarCompraRealizada(resultado.resumen!);
    
    // Vaciar carrito
    this.carritoService.vaciarCarrito();
    
    // Cerrar interfaces
    this.cerrarPago();
    this.mostrarCarrito = false;
    
    // Mostrar mensaje de éxito con detalles
    const resumen = resultado.resumen!;
    let mensaje = `¡Compra exitosa!`;
    
    if (resumen.aplicaDescuento) {
      mensaje += ` Se aplicó descuento del ${this.porcentajeDescuento}% (Ahorraste $${resumen.descuento.toFixed(2)})`;
    }
    
    mensaje += ` Total pagado: $${resumen.total.toFixed(2)} - Método: ${resumen.metodoPago === 'tarjeta' ? 'Tarjeta' : 'Efectivo'}`;
    
    this.mostrarToast(mensaje, 'success');
  }

  // NUEVO: Método para guardar compra en el panel de administración
  private guardarCompraRealizada(resumen: any) {
    // Usar datos del usuario actual cargado
    let nombreCliente = this.usuarioActual.nombre || 'Usuario Invitado';
    let usuarioId = this.usuarioActual.id || 'guest-user';

    // Crear el objeto de compra para el panel de admin
    const compraRealizada = {
      id: Date.now(),
      cliente: nombreCliente,
      usuarioId: usuarioId,
      productos: this.carrito.map(item => ({
        id: item.id,
        nombre: item.nombre,
        precio: item.precio,
        cantidad: item.cantidad,
        subtotalProducto: item.total
      })),
      subtotal: resumen.subtotal,
      descuento: resumen.descuento,
      total: resumen.total,
      metodoPago: resumen.metodoPago,
      fecha: new Date().toISOString(),
      estado: 'Pendiente',
      aplicaDescuento: resumen.aplicaDescuento
    };

    // Obtener compras existentes
    const comprasExistentes = localStorage.getItem('compras_realizadas');
    let compras = [];
    
    if (comprasExistentes) {
      try {
        compras = JSON.parse(comprasExistentes);
      } catch (error) {
        console.error('Error al parsear compras existentes:', error);
        compras = [];
      }
    }
    
    // Agregar la nueva compra
    compras.push(compraRealizada);
    
    // Guardar en localStorage
    localStorage.setItem('compras_realizadas', JSON.stringify(compras));
    
    console.log('Compra guardada para panel de administración:', compraRealizada);
  }

  // MÉTODOS ACTUALIZADOS PARA USAR EL SERVICIO
  calcularSubtotal(): number {
    return this.carritoService.calcularSubtotal();
  }

  calcularDescuento(): number {
    return this.carritoService.calcularDescuento();
  }

  calcularTotalCarrito(): number {
    return this.carritoService.calcularTotal();
  }

  aplicaDescuento(): boolean {
    return this.carritoService.aplicaDescuento();
  }

  obtenerCantidadTotal(): number {
    return this.carritoService.obtenerCantidadTotal();
  }

  // MÉTODOS EXISTENTES (con verificaciones de permisos mejoradas)
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

  cambiarVista(vista: 'grid' | 'lista') {
    this.vistaActual = vista;
  }

  guardarProducto() {
    console.log('Intentando guardar producto. Es admin?:', this.esAdmin);
    
    if (!this.esAdmin) {
      this.mostrarToast('No tienes permisos para realizar esta acción', 'danger');
      console.log('Permisos denegados para guardar producto');
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
        p.id = this.productos.length > 0 ? Math.max(...this.productos.map(x => x.id)) + 1 : 1;
        this.productos.push({ ...p });
        this.mostrarToast('Producto agregado exitosamente', 'success');
      } else {
        const index = this.productos.findIndex(prod => prod.id === p.id);
        if (index > -1) {
          this.productos[index] = { ...p };
          this.mostrarToast('Producto actualizado exitosamente', 'success');
        }
      }

      this.guardarEnLocalStorage();
      this.buscarProductos(); // Actualizar productos filtrados
      this.mostrarFormulario = false;
      this.resetearFormulario();
    } else {
      this.mostrarToast('Por favor completa todos los campos incluyendo el proveedor', 'warning');
    }
  }

  editarProducto(index: number) {
    console.log('Intentando editar producto. Es admin?:', this.esAdmin);
    
    if (!this.esAdmin) {
      this.mostrarToast('No tienes permisos para realizar esta acción', 'danger');
      console.log('Permisos denegados para editar producto');
      return;
    }

    // Buscar el producto en la lista filtrada
    const producto = this.productosFiltrados[index];
    this.nuevoProducto = { ...producto };
    this.mostrarFormulario = true;
  }

  eliminarProducto(index: number) {
    console.log('Intentando eliminar producto. Es admin?:', this.esAdmin);
    
    if (!this.esAdmin) {
      this.mostrarToast('No tienes permisos para realizar esta acción', 'danger');
      console.log('Permisos denegados para eliminar producto');
      return;
    }

    const producto = this.productosFiltrados[index];
    const confirmado = confirm(`¿Eliminar el producto "${producto.nombre}"?`);
    
    if (confirmado) {
      // Encontrar el índice en la lista original
      const indiceOriginal = this.productos.findIndex(p => p.id === producto.id);
      if (indiceOriginal > -1) {
        this.productos.splice(indiceOriginal, 1);
        this.guardarEnLocalStorage();
        this.buscarProductos(); // Actualizar productos filtrados
        this.resetearFormulario();
        this.mostrarFormulario = false;
        this.mostrarToast('Producto eliminado exitosamente', 'success');
      }
    }
  }

  agregarAlCarrito(producto: Producto) {
    console.log('Intentando agregar al carrito. Es admin?:', this.esAdmin);
    
    if (this.esAdmin) {
      this.mostrarToast('Los administradores no pueden agregar productos al carrito', 'warning');
      console.log('Admin intentó agregar producto al carrito');
      return;
    }

    if (producto.stock === 0) {
      this.mostrarToast('Este producto no tiene stock disponible', 'danger');
      return;
    }

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

  aumentarCantidad(productoId: number) {
    if (this.esAdmin) {
      this.mostrarToast('Los administradores no pueden modificar el carrito', 'warning');
      return;
    }

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
    if (this.esAdmin) {
      this.mostrarToast('Los administradores no pueden modificar el carrito', 'warning');
      return;
    }

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
    if (this.esAdmin) {
      this.mostrarToast('Los administradores no pueden modificar el carrito', 'warning');
      return;
    }

    const item = this.carrito.find(c => c.id === productoId);
    if (item) {
      this.carritoService.eliminarProducto(productoId);
      this.mostrarToast(`${item.nombre} eliminado del carrito`, 'warning');
    }
  }

  vaciarCarrito() {
    if (this.esAdmin) {
      this.mostrarToast('Los administradores no pueden modificar el carrito', 'warning');
      return;
    }

    const confirmado = confirm('¿Estás seguro de que quieres vaciar el carrito?');
    if (confirmado) {
      this.carritoService.vaciarCarrito();
      this.mostrarToast('Carrito vaciado', 'warning');
    }
  }

  // MÉTODO ACTUALIZADO (reemplaza procederCompra)
  procederCompra() {
    if (this.esAdmin) {
      this.mostrarToast('Los administradores no pueden realizar compras', 'warning');
      return;
    }
    this.mostrarOpcionesPago();
  }

  sincronizarConPedidos() {
    this.mostrarToast('Carrito sincronizado con página de pedidos', 'info');
  }

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