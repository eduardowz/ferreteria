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
  cantidadTemporal?: number; // Nueva propiedad para cantidad temporal
}

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  role: 'admin' | 'user';
  rol: 'admin' | 'usuario';
}

interface DatosTarjeta {
  numero: string;
  titular: string;
  vencimiento: string;
  cvv: string;
  email: string;
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

  // Funcionalidades de búsqueda y pago
  terminoBusqueda: string = '';
  mostrarPago: boolean = false;
  metodoPagoSeleccionado: MetodoPago | null = null;
  
  // Información de descuento
  montoMinimoDescuento: number = 500;
  porcentajeDescuento: number = 10;

  // Nuevas propiedades para el pago mejorado
  dineroRecibido: number = 0;
  datosTarjeta: DatosTarjeta = {
    numero: '',
    titular: '',
    vencimiento: '',
    cvv: '',
    email: ''
  };

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

  // Cargar usuario actual con verificación mejorada
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
        
        // Verificación mejorada: Comprobar ambos campos de rol
        this.esAdmin = (user.role === 'admin') || (user.rol === 'admin');
        
        console.log('Verificando rol en productos:');
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
    
    // Inicializar cantidades temporales
    this.productos.forEach(producto => {
      if (!producto.cantidadTemporal) {
        producto.cantidadTemporal = 1;
      }
    });
    
    // Inicializar productos filtrados
    this.productosFiltrados = [...this.productos];
  }

  cargarProveedores() {
    const provData = localStorage.getItem('proveedores');
    if (provData) {
      this.proveedores = JSON.parse(provData);
    }
  }

  // MÉTODOS PARA CANTIDAD TEMPORAL (con validaciones mejoradas)
  aumentarCantidadTemporal(index: number) {
    if (!this.productosFiltrados || index < 0 || index >= this.productosFiltrados.length) {
      return;
    }
    
    const producto = this.productosFiltrados[index];
    if (!producto) {
      return;
    }
    
    if (!producto.cantidadTemporal) {
      producto.cantidadTemporal = 1;
    }
    if (producto.cantidadTemporal < producto.stock) {
      producto.cantidadTemporal++;
    }
  }

  disminuirCantidadTemporal(index: number) {
    if (!this.productosFiltrados || index < 0 || index >= this.productosFiltrados.length) {
      return;
    }
    
    const producto = this.productosFiltrados[index];
    if (!producto) {
      return;
    }
    
    if (!producto.cantidadTemporal) {
      producto.cantidadTemporal = 1;
    }
    if (producto.cantidadTemporal > 1) {
      producto.cantidadTemporal--;
    }
  }

  // MÉTODOS PARA EL BUSCADOR
  buscarProductos() {
    if (!this.terminoBusqueda.trim()) {
      this.productosFiltrados = [...this.productos];
      // Reinicializar cantidades temporales
      this.productosFiltrados.forEach(producto => {
        if (!producto.cantidadTemporal) {
          producto.cantidadTemporal = 1;
        }
      });
      return;
    }

    const termino = this.terminoBusqueda.toLowerCase().trim();
    this.productosFiltrados = this.productos.filter(producto =>
      producto.nombre.toLowerCase().includes(termino) ||
      producto.descripcion.toLowerCase().includes(termino) ||
      producto.categoria.toLowerCase().includes(termino) ||
      producto.proveedor.toLowerCase().includes(termino)
    );

    // Reinicializar cantidades temporales en productos filtrados
    this.productosFiltrados.forEach(producto => {
      if (!producto.cantidadTemporal) {
        producto.cantidadTemporal = 1;
      }
    });

    if (this.productosFiltrados.length === 0) {
      this.mostrarToast(`No se encontraron productos con "${this.terminoBusqueda}"`, 'warning');
    } else {
      this.mostrarToast(`${this.productosFiltrados.length} productos encontrados`, 'success');
    }
  }

  limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.productosFiltrados = [...this.productos];
    this.mostrarToast('Búsqueda limpiada', 'medium');
  }

  // MÉTODO MEJORADO PARA AGREGAR AL CARRITO CON CANTIDAD (con validaciones)
  agregarAlCarritoConCantidad(producto: Producto, index: number) {
    if (!producto) {
      this.mostrarToast('Error: Producto no encontrado', 'danger');
      return;
    }

    if (this.esAdmin) {
      this.mostrarToast('Los administradores no pueden agregar productos al carrito', 'warning');
      return;
    }

    if (producto.stock === 0) {
      this.mostrarToast('Este producto no tiene stock disponible', 'danger');
      return;
    }

    const cantidadSeleccionada = producto.cantidadTemporal || 1;
    
    // Verificar si ya existe en el carrito
    const itemExistente = this.carrito.find(item => item.id === producto.id);
    const cantidadActualEnCarrito = itemExistente ? itemExistente.cantidad : 0;
    
    if (cantidadActualEnCarrito + cantidadSeleccionada > producto.stock) {
      this.mostrarToast(`No hay suficiente stock. Stock disponible: ${producto.stock - cantidadActualEnCarrito}`, 'warning');
      return;
    }

    // Agregar al carrito con la cantidad seleccionada
    for (let i = 0; i < cantidadSeleccionada; i++) {
      const success = this.carritoService.agregarProducto({
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: 1
      });
      
      if (!success) {
        this.mostrarToast('Error al agregar producto al carrito', 'danger');
        return;
      }
    }

    // Resetear cantidad temporal
    producto.cantidadTemporal = 1;
    
    this.mostrarToast(`${cantidadSeleccionada} x ${producto.nombre} agregado(s) al carrito`, 'success');
  }

  // MÉTODO ORIGINAL PARA AGREGAR AL CARRITO (una unidad)
  agregarAlCarrito(producto: Producto) {
    if (this.esAdmin) {
      this.mostrarToast('Los administradores no pueden agregar productos al carrito', 'warning');
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

  // MÉTODOS PARA FORMATEAR DATOS DE TARJETA
  formatearNumeroTarjeta(event: any) {
    let valor = event.target.value.replace(/\s/g, '');
    let valorFormateado = valor.match(/.{1,4}/g)?.join(' ') || valor;
    
    if (valorFormateado.length > 19) {
      valorFormateado = valorFormateado.substring(0, 19);
    }
    
    this.datosTarjeta.numero = valorFormateado;
    event.target.value = valorFormateado;
  }

  formatearVencimiento(event: any) {
    let valor = event.target.value.replace(/\D/g, '');
    
    if (valor.length >= 2) {
      valor = valor.substring(0, 2) + '/' + valor.substring(2, 4);
    }
    
    this.datosTarjeta.vencimiento = valor;
    event.target.value = valor;
  }

  // MÉTODO PARA DETECTAR TIPO DE TARJETA
  detectarTipoTarjeta(): string {
    const numero = this.datosTarjeta.numero.replace(/\s/g, '');
    
    if (numero.startsWith('4')) {
      return 'Visa';
    } else if (numero.startsWith('5') || numero.startsWith('2')) {
      return 'Mastercard';
    } else if (numero.startsWith('34') || numero.startsWith('37')) {
      return 'American Express';
    }
    
    return 'Desconocida';
  }

  // MÉTODOS PARA EL SISTEMA DE PAGO
  mostrarOpcionesPago() {
    if (this.carrito.length === 0) {
      this.mostrarToast('El carrito está vacío', 'warning');
      return;
    }
    this.mostrarPago = true;
  }

  seleccionarMetodoPago(metodo: MetodoPago) {
    this.metodoPagoSeleccionado = metodo;
  }

  // MÉTODO PARA VALIDAR SI SE PUEDE CONFIRMAR LA COMPRA
  puedeConfirmarCompra(): boolean {
    if (!this.metodoPagoSeleccionado) return false;
    
    if (this.metodoPagoSeleccionado === 'efectivo') {
      return this.dineroRecibido >= this.calcularTotalCarrito();
    }
    
    if (this.metodoPagoSeleccionado === 'tarjeta') {
      return this.datosTarjeta.numero.length >= 13 && 
             this.datosTarjeta.titular.length >= 3 && 
             this.datosTarjeta.vencimiento.length === 5 && 
             this.datosTarjeta.cvv.length >= 3;
    }
    
    return false;
  }

  // MÉTODO CONFIRMAR COMPRA MEJORADO
  async confirmarCompra() {
    if (!this.puedeConfirmarCompra() || !this.metodoPagoSeleccionado) {
      if (this.metodoPagoSeleccionado === 'efectivo') {
        this.mostrarToast('El dinero recibido es insuficiente', 'warning');
      } else if (this.metodoPagoSeleccionado === 'tarjeta') {
        this.mostrarToast('Por favor completa todos los datos de la tarjeta', 'warning');
      } else {
        this.mostrarToast('Por favor selecciona un método de pago', 'warning');
      }
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
    this.buscarProductos();
    
    // Guardar la compra para el panel de administración con información adicional
    this.guardarCompraRealizadaMejorada(resultado.resumen!);
    
    // Vaciar carrito
    this.carritoService.vaciarCarrito();
    
    // Cerrar interfaces
    this.cerrarPago();
    this.mostrarCarrito = false;
    
    // Resetear datos de pago
    this.resetearDatosPago();
    
    // Mostrar mensaje de éxito personalizado
    this.mostrarMensajeExitoCompra(resultado.resumen!);
  }

  // MÉTODO PARA MOSTRAR MENSAJE DE ÉXITO PERSONALIZADO
  private mostrarMensajeExitoCompra(resumen: any) {
    let mensaje = `¡Compra exitosa! ✅`;
    
    if (this.metodoPagoSeleccionado === 'efectivo') {
      const cambio = this.dineroRecibido - resumen.total;
      if (cambio > 0) {
        mensaje += ` Cambio a devolver: $${cambio.toFixed(2)}`;
      }
    } else if (this.metodoPagoSeleccionado === 'tarjeta') {
      const tipoTarjeta = this.detectarTipoTarjeta();
      const ultimosDigitos = this.datosTarjeta.numero.replace(/\s/g, '').slice(-4);
      mensaje += ` Pagado con tarjeta ${tipoTarjeta} terminada en ${ultimosDigitos}`;
    }
    
    if (resumen.aplicaDescuento) {
      mensaje += ` | Descuento aplicado: $${resumen.descuento.toFixed(2)} (${this.porcentajeDescuento}%)`;
    }
    
    mensaje += ` | Total: $${resumen.total.toFixed(2)}`;
    
    this.mostrarToast(mensaje, 'success');
  }

  // MÉTODO MEJORADO PARA GUARDAR COMPRA
  private guardarCompraRealizadaMejorada(resumen: any) {
    let nombreCliente = this.usuarioActual.nombre || 'Usuario Invitado';
    let usuarioId = this.usuarioActual.id || 'guest-user';

    // Información adicional según método de pago
    let infoPago: any = {
      metodo: resumen.metodoPago
    };

    if (resumen.metodoPago === 'efectivo') {
      infoPago.dineroRecibido = this.dineroRecibido;
      infoPago.cambio = this.dineroRecibido - resumen.total;
    } else if (resumen.metodoPago === 'tarjeta') {
      infoPago.tipoTarjeta = this.detectarTipoTarjeta();
      infoPago.ultimosDigitos = this.datosTarjeta.numero.replace(/\s/g, '').slice(-4);
      infoPago.titular = this.datosTarjeta.titular;
      infoPago.email = this.datosTarjeta.email;
    }

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
      infoPago: infoPago,
      fecha: new Date().toISOString(),
      fechaFormateada: new Date().toLocaleString('es-MX'),
      estado: 'Completada',
      aplicaDescuento: resumen.aplicaDescuento,
      porcentajeDescuento: this.porcentajeDescuento
    };

    // Guardar en localStorage
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
    
    compras.push(compraRealizada);
    localStorage.setItem('compras_realizadas', JSON.stringify(compras));
    
    console.log('Compra guardada con información completa:', compraRealizada);
  }

  // MÉTODO PARA RESETEAR DATOS DE PAGO
  private resetearDatosPago() {
    this.dineroRecibido = 0;
    this.datosTarjeta = {
      numero: '',
      titular: '',
      vencimiento: '',
      cvv: '',
      email: ''
    };
    this.metodoPagoSeleccionado = null;
  }

  // MÉTODO MEJORADO PARA CERRAR PAGO
  cerrarPago() {
    this.mostrarPago = false;
    this.resetearDatosPago();
  }

  // MÉTODOS PARA USAR EL SERVICIO DE CARRITO
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

  // MÉTODOS PARA GESTIÓN DEL CARRITO
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

  // MÉTODOS PARA GESTIÓN DE PRODUCTOS (ADMIN)
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
      image: '',
      cantidadTemporal: 1
    };
  }

  cambiarVista(vista: 'grid' | 'lista') {
    this.vistaActual = vista;
  }

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
        p.id = this.productos.length > 0 ? Math.max(...this.productos.map(x => x.id)) + 1 : 1;
        p.cantidadTemporal = 1;
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
      this.buscarProductos();
      this.mostrarFormulario = false;
      this.resetearFormulario();
    } else {
      this.mostrarToast('Por favor completa todos los campos incluyendo el proveedor', 'warning');
    }
  }

  editarProducto(index: number) {
    if (!this.esAdmin) {
      this.mostrarToast('No tienes permisos para realizar esta acción', 'danger');
      return;
    }

    // Validar que el índice sea válido y el producto exista
    if (!this.productosFiltrados || index < 0 || index >= this.productosFiltrados.length) {
      this.mostrarToast('Error: Producto no encontrado', 'danger');
      return;
    }

    const producto = this.productosFiltrados[index];
    if (!producto) {
      this.mostrarToast('Error: Producto no encontrado', 'danger');
      return;
    }

    this.nuevoProducto = { ...producto };
    this.mostrarFormulario = true;
  }

  eliminarProducto(index: number) {
    if (!this.esAdmin) {
      this.mostrarToast('No tienes permisos para realizar esta acción', 'danger');
      return;
    }

    // Validar que el índice sea válido y el producto exista
    if (!this.productosFiltrados || index < 0 || index >= this.productosFiltrados.length) {
      this.mostrarToast('Error: Producto no encontrado', 'danger');
      return;
    }

    const producto = this.productosFiltrados[index];
    if (!producto) {
      this.mostrarToast('Error: Producto no encontrado', 'danger');
      return;
    }

    const confirmado = confirm(`¿Eliminar el producto "${producto.nombre}"?`);
    
    if (confirmado) {
      const indiceOriginal = this.productos.findIndex(p => p.id === producto.id);
      if (indiceOriginal > -1) {
        this.productos.splice(indiceOriginal, 1);
        this.guardarEnLocalStorage();
        this.buscarProductos();
        this.resetearFormulario();
        this.mostrarFormulario = false;
        this.mostrarToast('Producto eliminado exitosamente', 'success');
      }
    }
  }

  // MÉTODOS DE NAVEGACIÓN Y UTILIDADES
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

  // Método para tracking de productos en *ngFor
  trackByProducto(index: number, producto: Producto): number {
    return producto ? producto.id : index;
  }
}