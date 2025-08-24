import { Component, OnInit, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastController, LoadingController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

// Importar servicios
import { HttpService, ApiResponse } from '../services/http.service';
import { CarritoService, ProductoCarrito, MetodoPago } from '../services/carrito.service';

// Interfaces
export interface Producto {
  _id?: string;
  id?: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: string;
  proveedor: string;
  image?: string;
  cantidadTemporal?: number;
  activo?: boolean;
  fecha?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  role: 'admin' | 'user';
  rol: 'admin' | 'usuario';
  token?: string;
}

interface DatosTarjeta {
  numero: string;
  titular: string;
  vencimiento: string;
  cvv: string;
  email: string;
}

interface SesionUsuario {
  usuario: Usuario;
  timestamp: number;
  esValida: boolean;
}

@Component({
  selector: 'app-productos',
  templateUrl: './productos.page.html',
  styleUrls: ['./productos.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ProductosPage implements OnInit, OnDestroy {
  // Arrays principales
  productos: Producto[] = [];
  productosFiltrados: Producto[] = [];
  categorias: string[] = [];
  proveedores: string[] = [];
  carrito: ProductoCarrito[] = [];
  
  // Estados de conexión y sesión EN MEMORIA
  private sesionActual: SesionUsuario | null = null;
  conectadoAPI: boolean = false;
  cargandoProductos: boolean = false;
  tokenValido: boolean = false;
  
  // Usuario actual
  usuarioActual: Usuario = { 
    id: '', 
    nombre: '', 
    email: '', 
    role: 'user', 
    rol: 'usuario' 
  };
  esAdmin: boolean = false;
  
  // UI States
  mostrarCarrito: boolean = false;
  mostrarFormulario: boolean = false;
  vistaActual: 'grid' | 'lista' = 'grid';
  nuevoProducto: Producto = this.crearProductoVacio();
  terminoBusqueda: string = '';
  mostrarPago: boolean = false;
  metodoPagoSeleccionado: MetodoPago | null = null;
  
  // Configuración de descuentos
  montoMinimoDescuento: number = 500;
  porcentajeDescuento: number = 10;
  
  // Datos de pago
  dineroRecibido: number = 0;
  datosTarjeta: DatosTarjeta = {
    numero: '',
    titular: '',
    vencimiento: '',
    cvv: '',
    email: ''
  };

  // Cache en memoria para productos
  private productosCache: {
    data: Producto[];
    timestamp: number;
    isValid: boolean;
  } = {
    data: [],
    timestamp: 0,
    isValid: false
  };

  // Subscripciones
  carritoSubscription?: Subscription;
  productosSubscription?: Subscription;

  constructor(
    private toastController: ToastController,
    private loadingController: LoadingController,
    private router: Router,
    private carritoService: CarritoService,
    private httpService: HttpService
  ) {
    // Obtener configuración de descuentos
    this.montoMinimoDescuento = this.carritoService.obtenerMontoMinimoDescuento();
    this.porcentajeDescuento = this.carritoService.obtenerPorcentajeDescuento();
  }

  async ngOnInit() {
    await this.inicializarAplicacionSinStorage();
  }

  // ===== INICIALIZACIÓN SIN LOCALSTORAGE =====
  
  private async inicializarAplicacionSinStorage() {
    try {
      console.log('🚀 Inicializando aplicación (sin localStorage)...');
      await this.mostrarLoading('Inicializando aplicación...');
      
      // 1. Verificar si hay sesión activa en memoria
      this.verificarSesionEnMemoria();
      
      // 2. Si no hay sesión, solicitar credenciales o crear usuario temporal
      if (!this.sesionActual || !this.sesionActual.esValida) {
        await this.manejarSesionInvalida();
      }
      
      // 3. Cargar productos desde API o crear datos temporales
      await this.cargarProductosSinStorage();
      
      // 4. Configurar carrito en memoria
      this.inicializarCarritoEnMemoria();
      
      console.log('✅ Aplicación inicializada correctamente');
      this.mostrarToast('Aplicación cargada exitosamente', 'success');
      
    } catch (error) {
      console.error('❌ Error en inicialización:', error);
      await this.recuperacionDeEmergencia();
    } finally {
      await this.ocultarLoading();
    }
  }

  private verificarSesionEnMemoria() {
    if (this.sesionActual) {
      const ahora = Date.now();
      const tiempoTranscurrido = ahora - this.sesionActual.timestamp;
      const DURACION_SESION = 60 * 60 * 1000; // 1 hora en milisegundos
      
      if (tiempoTranscurrido < DURACION_SESION) {
        this.usuarioActual = this.sesionActual.usuario;
        this.esAdmin = (this.usuarioActual.role === 'admin') || (this.usuarioActual.rol === 'admin');
        this.tokenValido = !!this.usuarioActual.token;
        console.log('✅ Sesión en memoria válida:', this.usuarioActual);
        return;
      }
    }
    
    // Sesión expirada o inexistente
    this.sesionActual = null;
    this.tokenValido = false;
  }

  private async manejarSesionInvalida() {
    console.log('⚠️ No hay sesión válida, verificando credenciales...');
    
    // Intentar obtener credenciales de la URL o parámetros de navegación
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const userInfo = urlParams.get('user');
    
    if (token && userInfo) {
      try {
        const userData = JSON.parse(decodeURIComponent(userInfo));
        await this.crearSesionEnMemoria(userData, token);
        return;
      } catch (error) {
        console.error('❌ Error parseando datos de usuario desde URL:', error);
      }
    }
    
    // Si llegamos aquí, crear usuario temporal para pruebas
    await this.crearUsuarioTemporal();
  }

  private async crearSesionEnMemoria(userData: any, token?: string) {
    try {
      const usuario: Usuario = {
        id: userData.id || `temp-${Date.now()}`,
        nombre: userData.nombre || userData.name || 'Usuario',
        email: userData.email || `temp@ejemplo.com`,
        role: userData.role || 'user',
        rol: userData.rol || userData.role || 'usuario',
        token: token || userData.token
      };
      
      this.sesionActual = {
        usuario: usuario,
        timestamp: Date.now(),
        esValida: true
      };
      
      this.usuarioActual = usuario;
      this.esAdmin = (usuario.role === 'admin') || (usuario.rol === 'admin');
      this.tokenValido = !!usuario.token;
      
      console.log('✅ Sesión creada en memoria:', usuario);
      
      // Verificar conectividad con la API si tenemos token
      if (usuario.token) {
        await this.verificarConectividadAPI();
      }
      
    } catch (error) {
      console.error('❌ Error creando sesión:', error);
      await this.crearUsuarioTemporal();
    }
  }

  private async crearUsuarioTemporal() {
    const usuarioTemporal: Usuario = {
      id: `temp-${Date.now()}`,
      nombre: 'Usuario Temporal',
      email: 'temporal@ejemplo.com',
      role: 'user',
      rol: 'usuario'
    };
    
    this.sesionActual = {
      usuario: usuarioTemporal,
      timestamp: Date.now(),
      esValida: true
    };
    
    this.usuarioActual = usuarioTemporal;
    this.esAdmin = false;
    this.tokenValido = false;
    this.conectadoAPI = false;
    
    console.log('👤 Usuario temporal creado:', usuarioTemporal);
    this.mostrarToast('Sesión temporal iniciada', 'medium');
  }

  private async verificarConectividadAPI(): Promise<void> {
    try {
      console.log('🔐 Verificando conectividad con API...');
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout API')), 10000);
      });

      const apiPromise = this.httpService.checkApiStatus().toPromise();
      const response = await Promise.race([apiPromise, timeoutPromise]) as any;
      
      if (response && response.connected) {
        this.conectadoAPI = true;
        this.tokenValido = true;
        console.log('✅ API conectada exitosamente');
      } else {
        throw new Error('API no disponible');
      }
      
    } catch (error: any) {
      console.error('❌ Error verificando API:', error);
      this.conectadoAPI = false;
      
      if (error.status === 401 || error.status === 403) {
        this.tokenValido = false;
        this.mostrarToast('Token expirado, funcionalidad limitada', 'warning');
      } else {
        this.mostrarToast('API no disponible, modo offline', 'warning');
      }
    }
  }

  // ===== CARGA DE PRODUCTOS SIN STORAGE =====
  
  private async cargarProductosSinStorage(): Promise<void> {
    this.cargandoProductos = true;
    
    try {
      // Verificar cache en memoria primero
      if (this.esCacheValido()) {
        this.productos = [...this.productosCache.data];
        this.aplicarFiltrosBusqueda();
        await this.cargarCategoriasYProveedores();
        console.log(`📦 ${this.productos.length} productos cargados desde cache en memoria`);
        this.mostrarToast('Productos cargados desde cache', 'success');
        return;
      }
      
      // Intentar cargar desde API
      if (this.conectadoAPI && this.tokenValido) {
        await this.cargarDesdeAPI();
      } else {
        // Crear productos temporales para demostración
        await this.crearProductosTemporales();
      }
      
    } catch (error) {
      console.error('❌ Error cargando productos:', error);
      await this.crearProductosTemporales();
    } finally {
      this.cargandoProductos = false;
    }
  }

  private esCacheValido(): boolean {
    if (!this.productosCache.isValid || this.productosCache.data.length === 0) {
      return false;
    }
    
    const tiempoTranscurrido = Date.now() - this.productosCache.timestamp;
    const CACHE_DURACION = 10 * 60 * 1000; // 10 minutos
    
    return tiempoTranscurrido < CACHE_DURACION;
  }

  private async cargarDesdeAPI(): Promise<void> {
    try {
      console.log('📦 Cargando productos desde API...');
      
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout cargando productos')), 15000);
      });

      const apiPromise = this.httpService.getProductos().toPromise();
      const response = await Promise.race([apiPromise, timeoutPromise]) as any;
      
      if (response && response.success && Array.isArray(response.data)) {
        this.productos = response.data;
        
        // Actualizar cache en memoria
        this.actualizarCache(this.productos);
        
        this.aplicarFiltrosBusqueda();
        await this.cargarCategoriasYProveedores();
        
        console.log(`✅ ${this.productos.length} productos cargados desde API`);
        this.mostrarToast(`${this.productos.length} productos cargados`, 'success');
        
      } else {
        throw new Error('Respuesta API inválida');
      }
      
    } catch (error: any) {
      console.error('❌ Error cargando desde API:', error);
      
      if (error.status === 401 || error.status === 403) {
        this.tokenValido = false;
        this.conectadoAPI = false;
        this.mostrarToast('Sesión expirada', 'warning');
      }
      
      throw error;
    }
  }

  private async crearProductosTemporales(): Promise<void> {
    console.log('📦 Creando productos temporales...');
    
    this.productos = [
      {
        id: 1,
        _id: 'temp_1',
        nombre: 'Coca Cola 355ml',
        descripcion: 'Refresco de cola en lata de 355ml',
        precio: 15.50,
        stock: 100,
        categoria: 'Bebidas',
        proveedor: 'Coca Cola Company',
        image: 'assets/productos/coca-cola.jpg',
        cantidadTemporal: 1,
        activo: true,
        fecha: new Date().toISOString().split('T')[0]
      },
      {
        id: 2,
        _id: 'temp_2',
        nombre: 'Pepsi 355ml',
        descripcion: 'Refresco de cola en lata de 355ml',
        precio: 15.00,
        stock: 80,
        categoria: 'Bebidas',
        proveedor: 'PepsiCo',
        image: 'assets/productos/pepsi.jpg',
        cantidadTemporal: 1,
        activo: true,
        fecha: new Date().toISOString().split('T')[0]
      },
      {
        id: 3,
        _id: 'temp_3',
        nombre: 'Sprite 355ml',
        descripcion: 'Refresco de lima-limón en lata',
        precio: 14.50,
        stock: 60,
        categoria: 'Bebidas',
        proveedor: 'Coca Cola Company',
        image: 'assets/productos/sprite.jpg',
        cantidadTemporal: 1,
        activo: true,
        fecha: new Date().toISOString().split('T')[0]
      },
      {
        id: 4,
        _id: 'temp_4',
        nombre: 'Agua Embotellada 500ml',
        descripcion: 'Agua purificada en botella de 500ml',
        precio: 8.00,
        stock: 200,
        categoria: 'Bebidas',
        proveedor: 'Bonafont',
        image: 'assets/productos/agua.jpg',
        cantidadTemporal: 1,
        activo: true,
        fecha: new Date().toISOString().split('T')[0]
      },
      {
        id: 5,
        _id: 'temp_5',
        nombre: 'Jugo de Naranja 1L',
        descripcion: 'Jugo natural de naranja 1 litro',
        precio: 25.00,
        stock: 40,
        categoria: 'Bebidas',
        proveedor: 'Del Valle',
        image: 'assets/productos/jugo-naranja.jpg',
        cantidadTemporal: 1,
        activo: true,
        fecha: new Date().toISOString().split('T')[0]
      }
    ];
    
    // Actualizar cache
    this.actualizarCache(this.productos);
    
    this.aplicarFiltrosBusqueda();
    await this.cargarCategoriasYProveedores();
    
    console.log(`📦 ${this.productos.length} productos temporales creados`);
    this.mostrarToast('Productos temporales cargados', 'medium');
  }

  private actualizarCache(productos: Producto[]) {
    this.productosCache = {
      data: [...productos],
      timestamp: Date.now(),
      isValid: true
    };
  }

  private invalidarCache() {
    this.productosCache.isValid = false;
  }

  // ===== CARRITO EN MEMORIA =====
  
  private inicializarCarritoEnMemoria() {
    this.carritoSubscription = this.carritoService.carrito$.subscribe(
      (productos: ProductoCarrito[]) => {
        this.carrito = productos;
      }
    );
    
    console.log('🛒 Carrito inicializado en memoria');
  }

  // ===== MÉTODOS DE DIAGNÓSTICO =====
  
  verificarEstadoSesion() {
    const estado = {
      usuario: !!this.usuarioActual.id,
      usuarioValido: this.usuarioActual.id !== '' && this.usuarioActual.id.indexOf('temp-') === -1,
      esAdmin: this.esAdmin,
      token: !!this.usuarioActual.token,
      apiConectada: this.conectadoAPI,
      tokenValido: this.tokenValido,
      productosEnMemoria: this.productos.length,
      cacheValido: this.esCacheValido(),
      carritoItems: this.carrito.length,
      sesionEnMemoria: !!this.sesionActual
    };
    
    console.log('=== DIAGNÓSTICO DEL SISTEMA ===');
    console.table(estado);
    
    let mensaje = '🔍 Estado: ';
    if (estado.apiConectada && estado.tokenValido) {
      mensaje += '✅ Conectado a API';
    } else if (estado.usuarioValido) {
      mensaje += '🟡 Usuario válido, API offline';
    } else {
      mensaje += '🔴 Modo temporal/offline';
    }
    
    this.mostrarToast(mensaje, estado.apiConectada ? 'success' : 'warning');
    
    return estado;
  }

  obtenerEstadoConexion(): string {
    if (this.conectadoAPI && this.tokenValido) {
      return '🟢 Conectado a la API';
    } else if (this.usuarioActual.token && !this.conectadoAPI) {
      return '🟡 Token válido, API desconectada';
    } else {
      return '🔴 Sin conexión a la API';
    }
  }

  obtenerColorEstadoConexion(): string {
    if (this.conectadoAPI && this.tokenValido) {
      return 'success';
    } else if (this.usuarioActual.token && !this.conectadoAPI) {
      return 'warning';
    } else {
      return 'danger';
    }
  }

  // ===== MÉTODOS EXISTENTES MANTENIDOS =====
  
  private async cargarCategoriasYProveedores() {
    this.categorias = [...new Set(this.productos.map(p => p.categoria))];
    this.proveedores = [...new Set(this.productos.map(p => p.proveedor))];
    
    console.log(`📂 ${this.categorias.length} categorías encontradas`);
    console.log(`🏢 ${this.proveedores.length} proveedores encontrados`);
  }

  private inicializarCantidadesTemporales() {
    this.productosFiltrados.forEach(producto => {
      if (!producto.cantidadTemporal) {
        producto.cantidadTemporal = 1;
      }
    });
  }

  limpiarBusqueda() {
    this.terminoBusqueda = '';
    this.aplicarFiltrosBusqueda();
    this.mostrarToast('Búsqueda limpiada', 'medium');
  }

  private aplicarFiltrosBusqueda() {
    if (!this.terminoBusqueda.trim()) {
      this.productosFiltrados = [...this.productos];
    } else {
      this.buscarEnMemoria();
      return;
    }

    this.inicializarCantidadesTemporales();
  }

  private finalizarGuardado() {
    this.mostrarFormulario = false;
    this.resetearFormulario();
    this.aplicarFiltrosBusqueda();
    this.cargarCategoriasYProveedores();
  }

  private finalizarEliminacion() {
    this.resetearFormulario();
    this.mostrarFormulario = false;
    this.aplicarFiltrosBusqueda();
    this.cargarCategoriasYProveedores();
  }

  crearProductoVacio(): Producto {
    return {
      id: 0,
      nombre: '',
      descripcion: '',
      precio: 0,
      stock: 0,
      categoria: '',
      proveedor: '',
      image: '',
      cantidadTemporal: 1,
      activo: true,
      fecha: new Date().toISOString().split('T')[0]
    };
  }

  editarProducto(index: number) {
    if (!this.esAdmin) {
      this.mostrarToast('No tienes permisos para realizar esta acción', 'danger');
      return;
    }

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

  resetearFormulario() {
    this.nuevoProducto = this.crearProductoVacio();
  }

  // ===== MÉTODOS PARA CANTIDAD TEMPORAL =====
  
  aumentarCantidadTemporal(index: number) {
    if (!this.productosFiltrados || index < 0 || index >= this.productosFiltrados.length) {
      return;
    }
    
    const producto = this.productosFiltrados[index];
    if (!producto) return;
    
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
    if (!producto) return;
    
    if (!producto.cantidadTemporal) {
      producto.cantidadTemporal = 1;
    }
    if (producto.cantidadTemporal > 1) {
      producto.cantidadTemporal--;
    }
  }

  // ===== MÉTODOS PARA CARRITO =====
  
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
    
    const productId = producto._id || producto.id || 0;
    const itemExistente = this.carrito.find(item => item.id === this.convertirId(productId));
    const cantidadActualEnCarrito = itemExistente ? itemExistente.cantidad : 0;
    
    if (cantidadActualEnCarrito + cantidadSeleccionada > producto.stock) {
      this.mostrarToast(`No hay suficiente stock. Stock disponible: ${producto.stock - cantidadActualEnCarrito}`, 'warning');
      return;
    }

    const productoCarrito: ProductoCarrito = {
      id: this.convertirId(productId),
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: cantidadSeleccionada,
      total: producto.precio * cantidadSeleccionada
    };

    const success = this.carritoService.agregarProducto(productoCarrito);
    
    if (success) {
      producto.cantidadTemporal = 1;
      this.mostrarToast(`${cantidadSeleccionada} x ${producto.nombre} agregado(s) al carrito`, 'success');
    } else {
      this.mostrarToast('Error al agregar producto al carrito', 'danger');
    }
  }

  agregarAlCarrito(producto: Producto) {
    if (this.esAdmin) {
      this.mostrarToast('Los administradores no pueden agregar productos al carrito', 'warning');
      return;
    }

    if (producto.stock === 0) {
      this.mostrarToast('Este producto no tiene stock disponible', 'danger');
      return;
    }

    const productId = producto._id || producto.id || 0;
    const productoCarrito: ProductoCarrito = {
      id: this.convertirId(productId),
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1,
      total: producto.precio
    };

    const success = this.carritoService.agregarProducto(productoCarrito);

    if (success) {
      this.mostrarToast(`${producto.nombre} agregado al carrito`, 'success');
    } else {
      this.mostrarToast('Error al agregar producto al carrito', 'danger');
    }
  }

  private convertirId(id: string | number): number {
    if (typeof id === 'number') {
      return id;
    }
    
    let hash = 0;
    if (id.length === 0) return hash;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  // ===== MÉTODOS DE CARRITO =====

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

  aumentarCantidad(productoId: number) {
    if (this.esAdmin) {
      this.mostrarToast('Los administradores no pueden modificar el carrito', 'warning');
      return;
    }

    const item = this.carrito.find(c => c.id === productoId);
    if (item) {
      const producto = this.productos.find(p => 
        this.convertirId(p._id || p.id || 0) === productoId
      );
      
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

  // ===== MÉTODOS DE PAGO =====

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

    // Actualizar stock en memoria
    await this.actualizarStockEnMemoria();
    
    // Guardar compra en memoria
    this.guardarCompraEnMemoria(resultado.resumen!);
    
    // Limpiar carrito
    this.carritoService.vaciarCarrito();
    
    // Cerrar interfaces
    this.cerrarPago();
    this.mostrarCarrito = false;
    
    // Resetear datos de pago
    this.resetearDatosPago();
    
    // Mostrar mensaje de éxito
    this.mostrarMensajeExitoCompra(resultado.resumen!);
  }

  private async actualizarStockEnMemoria() {
    for (const item of this.carrito) {
      const productoEncontrado = this.productos.find(p => 
        this.convertirId(p._id || p.id || 0) === item.id
      );
      
      if (productoEncontrado) {
        productoEncontrado.stock -= item.cantidad;
        console.log(`📦 Stock actualizado para ${productoEncontrado.nombre}: ${productoEncontrado.stock}`);
      }
    }
    
    // Invalidar cache para forzar actualización
    this.invalidarCache();
    this.aplicarFiltrosBusqueda();
    
    // Intentar sincronizar con API si está disponible
    if (this.conectadoAPI && this.tokenValido) {
      try {
        await this.sincronizarStockConAPI();
      } catch (error) {
        console.error('⚠️ No se pudo sincronizar stock con API:', error);
        this.mostrarToast('Stock actualizado localmente', 'warning');
      }
    }
  }

  private async sincronizarStockConAPI() {
    for (const item of this.carrito) {
      const productoEncontrado = this.productos.find(p => 
        this.convertirId(p._id || p.id || 0) === item.id
      );
      
      if (productoEncontrado && productoEncontrado._id) {
        try {
          const updateData = { stock: productoEncontrado.stock };
          await this.httpService.updateProducto(productoEncontrado._id, updateData).toPromise();
        } catch (error) {
          console.error(`Error actualizando stock de ${productoEncontrado.nombre}:`, error);
        }
      }
    }
  }

  private mostrarMensajeExitoCompra(resumen: any) {
    let mensaje = `¡Compra exitosa! ✅`;
    
    if (this.metodoPagoSeleccionado === 'efectivo') {
      const cambio = this.dineroRecibido - resumen.total;
      if (cambio > 0) {
        mensaje += ` Cambio: ${cambio.toFixed(2)}`;
      }
    } else if (this.metodoPagoSeleccionado === 'tarjeta') {
      const tipoTarjeta = this.detectarTipoTarjeta();
      const ultimosDigitos = this.datosTarjeta.numero.replace(/\s/g, '').slice(-4);
      mensaje += ` Pagado con ${tipoTarjeta} ***${ultimosDigitos}`;
    }
    
    if (resumen.aplicaDescuento) {
      mensaje += ` | Descuento: ${resumen.descuento.toFixed(2)}`;
    }
    
    mensaje += ` | Total: ${resumen.total.toFixed(2)}`;
    
    this.mostrarToast(mensaje, 'success');
  }

  private guardarCompraEnMemoria(resumen: any) {
    // En una aplicación real, esto se enviaría a un servicio de compras
    // Por ahora solo lo registramos en memoria para demostración
    const compra = {
      id: Date.now(),
      cliente: this.usuarioActual.nombre,
      productos: this.carrito,
      resumen: resumen,
      fecha: new Date().toISOString(),
      sincronizada: this.conectadoAPI && this.tokenValido
    };
    
    console.log('💳 Compra registrada en memoria:', compra);
    
    // Aquí podrías almacenar en un servicio de compras o enviar a una API
    // this.comprasService.registrarCompra(compra);
  }

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

  cerrarPago() {
    this.mostrarPago = false;
    this.resetearDatosPago();
  }

  // ===== MÉTODOS DE NAVEGACIÓN =====
  
  cambiarVista(vista: 'grid' | 'lista') {
    this.vistaActual = vista;
  }

  procederCompra() {
    if (this.esAdmin) {
      this.mostrarToast('Los administradores no pueden realizar compras', 'warning');
      return;
    }
    this.mostrarOpcionesPago();
  }

  irAPedidos() {
    this.router.navigate(['/pedidos']);
  }

  // ===== MÉTODOS DE ADMINISTRACIÓN SIN STORAGE =====
  
  async guardarProducto() {
    if (!this.esAdmin) {
      this.mostrarToast('No tienes permisos para realizar esta acción', 'danger');
      return;
    }

    const p = this.nuevoProducto;
    if (!this.validarProducto(p)) {
      this.mostrarToast('Por favor completa todos los campos correctamente', 'warning');
      return;
    }

    try {
      await this.mostrarLoading('Guardando producto...');
      
      if (this.conectadoAPI && this.tokenValido) {
        // Guardar en API
        await this.guardarEnAPI(p);
      } else {
        // Guardar solo en memoria
        await this.guardarEnMemoria(p);
      }
      
      this.finalizarGuardado();
      
    } catch (error: any) {
      console.error('❌ Error guardando producto:', error);
      this.mostrarToast('Error al guardar el producto', 'danger');
    } finally {
      await this.ocultarLoading();
    }
  }

  private validarProducto(p: Producto): boolean {
    return !!(p.nombre && p.descripcion && p.precio > 0 && p.stock >= 0 && p.categoria && p.proveedor);
  }

  private async guardarEnAPI(p: Producto): Promise<void> {
    const esEdicion = !!(p._id || p.id);
    
    if (esEdicion) {
      const id = p._id || p.id!.toString();
      const response = await this.httpService.updateProducto(id, p).toPromise();
      
      if (response && response.success) {
        this.actualizarProductoEnMemoria(response.data!);
        this.mostrarToast('Producto actualizado exitosamente', 'success');
      } else {
        throw new Error(response?.message || 'Error actualizando producto');
      }
    } else {
      const response = await this.httpService.createProducto(p).toPromise();
      
      if (response && response.success) {
        this.productos.push(response.data!);
        this.invalidarCache();
        this.mostrarToast('Producto creado exitosamente', 'success');
      } else {
        throw new Error(response?.message || 'Error creando producto');
      }
    }
  }

  private async guardarEnMemoria(p: Producto): Promise<void> {
    const esEdicion = !!(p._id || p.id);
    
    if (esEdicion) {
      const index = this.productos.findIndex(prod => 
        (prod._id && prod._id === p._id) || (prod.id && prod.id === p.id)
      );
      
      if (index >= 0) {
        this.productos[index] = { ...p };
        this.invalidarCache();
        this.mostrarToast('Producto actualizado en memoria', 'success');
      }
    } else {
      const nuevoId = Math.max(...this.productos.map(pr => pr.id || 0)) + 1;
      const nuevoProducto: Producto = {
        ...p,
        id: nuevoId,
        _id: `temp_${nuevoId}`,
        fecha: new Date().toISOString().split('T')[0]
      };
      
      this.productos.push(nuevoProducto);
      this.invalidarCache();
      this.mostrarToast('Producto creado en memoria', 'success');
    }
  }

  private actualizarProductoEnMemoria(productoActualizado: Producto) {
    const index = this.productos.findIndex(p => 
      (p._id && p._id === productoActualizado._id) || 
      (p.id && p.id === productoActualizado.id)
    );
    
    if (index >= 0) {
      this.productos[index] = productoActualizado;
      this.invalidarCache();
    }
  }

  async eliminarProducto(index: number) {
    if (!this.esAdmin) {
      this.mostrarToast('No tienes permisos para realizar esta acción', 'danger');
      return;
    }

    if (!this.productosFiltrados || index < 0 || index >= this.productosFiltrados.length) {
      this.mostrarToast('Error: Producto no encontrado', 'danger');
      return;
    }

    const producto = this.productosFiltrados[index];
    if (!producto) return;

    const confirmado = confirm(`¿Eliminar el producto "${producto.nombre}"?`);
    if (!confirmado) return;

    try {
      await this.mostrarLoading('Eliminando producto...');
      
      if (this.conectadoAPI && this.tokenValido && producto._id) {
        // Eliminar de API
        const response = await this.httpService.deleteProducto(producto._id).toPromise();
        
        if (response && response.success) {
          this.eliminarProductoDeMemoria(producto);
          this.mostrarToast('Producto eliminado de la base de datos', 'success');
        } else {
          throw new Error('Error eliminando de la API');
        }
      } else {
        // Eliminar solo de memoria
        this.eliminarProductoDeMemoria(producto);
        this.mostrarToast('Producto eliminado de la memoria', 'warning');
      }
      
      this.finalizarEliminacion();
      
    } catch (error: any) {
      console.error('❌ Error eliminando producto:', error);
      this.mostrarToast('Error al eliminar el producto', 'danger');
    } finally {
      await this.ocultarLoading();
    }
  }

  private eliminarProductoDeMemoria(producto: Producto) {
    const indiceEnProductos = this.productos.findIndex(p => 
      (p.id && p.id === producto.id) || 
      (p._id && p._id === producto._id)
    );
    
    if (indiceEnProductos >= 0) {
      this.productos.splice(indiceEnProductos, 1);
      this.invalidarCache();
    }
  }

  // ===== MÉTODOS DE BÚSQUEDA =====
  
  async buscarProductos() {
    if (!this.terminoBusqueda.trim()) {
      this.aplicarFiltrosBusqueda();
      return;
    }

    try {
      if (this.conectadoAPI && this.tokenValido) {
        console.log('🔍 Buscando en API:', this.terminoBusqueda);
        
        const response = await this.httpService.buscarProductos(this.terminoBusqueda).toPromise();
        
        if (response && response.success) {
          this.productosFiltrados = response.data || [];
          this.inicializarCantidadesTemporales();
          
          const mensaje = this.productosFiltrados.length === 0 
            ? `No se encontraron productos con "${this.terminoBusqueda}"`
            : `${this.productosFiltrados.length} productos encontrados`;
            
          this.mostrarToast(mensaje, this.productosFiltrados.length > 0 ? 'success' : 'warning');
        } else {
          throw new Error('Error en la búsqueda');
        }
      } else {
        this.buscarEnMemoria();
      }
      
    } catch (error: any) {
      console.error('❌ Error buscando productos:', error);
      this.buscarEnMemoria();
      this.mostrarToast('Búsqueda local realizada', 'warning');
    }
  }

  private buscarEnMemoria() {
    const termino = this.terminoBusqueda.toLowerCase().trim();
    this.productosFiltrados = this.productos.filter(producto =>
      producto.nombre.toLowerCase().includes(termino) ||
      producto.descripcion.toLowerCase().includes(termino) ||
      producto.categoria.toLowerCase().includes(termino) ||
      producto.proveedor.toLowerCase().includes(termino)
    );
    
    this.inicializarCantidadesTemporales();
    
    const mensaje = this.productosFiltrados.length === 0 
      ? `No se encontraron productos con "${this.terminoBusqueda}"`
      : `${this.productosFiltrados.length} productos encontrados`;
      
    this.mostrarToast(mensaje, this.productosFiltrados.length > 0 ? 'success' : 'warning');
  }

  // ===== MÉTODOS DE SINCRONIZACIÓN =====
  
  async recargarProductos() {
    try {
      await this.mostrarLoading('Recargando productos...');
      
      // Invalidar cache
      this.invalidarCache();
      
      if (this.conectadoAPI && this.tokenValido) {
        await this.cargarDesdeAPI();
        this.mostrarToast('Productos recargados desde API', 'success');
      } else {
        await this.crearProductosTemporales();
        this.mostrarToast('Productos temporales recargados', 'success');
      }
    } catch (error: any) {
      console.error('❌ Error recargando productos:', error);
      this.mostrarToast('Error recargando productos', 'danger');
    } finally {
      await this.ocultarLoading();
    }
  }

  async sincronizarConAPI() {
    try {
      await this.mostrarLoading('Sincronizando con API...');
      
      await this.verificarConectividadAPI();
      
      if (this.conectadoAPI && this.tokenValido) {
        this.invalidarCache();
        await this.cargarDesdeAPI();
        this.mostrarToast('Sincronización exitosa', 'success');
      } else {
        throw new Error('No se pudo conectar con la API');
      }
    } catch (error: any) {
      console.error('Error sincronizando:', error);
      this.mostrarToast('Error en la sincronización', 'danger');
    } finally {
      await this.ocultarLoading();
    }
  }

  async intentarReconectar() {
    try {
      this.mostrarToast('Intentando reconectar...', 'medium');
      await this.mostrarLoading('Reconectando...');
      
      if (this.usuarioActual.token) {
        await this.verificarConectividadAPI();
        
        if (this.conectadoAPI && this.tokenValido) {
          this.invalidarCache();
          await this.cargarDesdeAPI();
          this.mostrarToast('Reconexión exitosa', 'success');
        } else {
          this.mostrarToast('No se pudo reconectar', 'warning');
        }
      } else {
        this.mostrarToast('No hay credenciales válidas', 'warning');
      }
      
    } catch (error) {
      console.error('❌ Error en reconexión:', error);
      this.mostrarToast('Error en la reconexión', 'danger');
    } finally {
      await this.ocultarLoading();
    }
  }

  // ===== RECUPERACIÓN DE EMERGENCIA =====
  
  private async recuperacionDeEmergencia() {
    console.log('🔧 Ejecutando recuperación de emergencia...');
    
    // Resetear estados
    this.conectadoAPI = false;
    this.tokenValido = false;
    this.cargandoProductos = false;
    
    // Crear usuario temporal si es necesario
    if (!this.usuarioActual.id) {
      await this.crearUsuarioTemporal();
    }
    
    // Cargar productos temporales
    if (this.productos.length === 0) {
      await this.crearProductosTemporales();
    }
    
    this.mostrarToast('Aplicación iniciada en modo de emergencia', 'warning');
  }

  // ===== MÉTODOS DE GESTIÓN DE SESIÓN =====
  
  async cerrarSesion() {
    try {
      await this.mostrarLoading('Cerrando sesión...');
      
      // Limpiar sesión en memoria
      this.sesionActual = null;
      
      // Limpiar datos de usuario
      this.usuarioActual = { id: '', nombre: '', email: '', role: 'user', rol: 'usuario' };
      this.esAdmin = false;
      this.tokenValido = false;
      this.conectadoAPI = false;
      
      // Vaciar carrito
      this.carritoService.vaciarCarrito();
      
      // Limpiar cache
      this.invalidarCache();
      
      this.mostrarToast('Sesión cerrada correctamente', 'success');
      
      // Redirigir al login
      await this.router.navigate(['/login']);
      
    } catch (error) {
      console.error('❌ Error cerrando sesión:', error);
      this.mostrarToast('Error al cerrar sesión', 'danger');
    } finally {
      await this.ocultarLoading();
    }
  }

  async iniciarSesionTemporal() {
    await this.crearUsuarioTemporal();
    this.mostrarToast('Sesión temporal iniciada', 'medium');
  }

  obtenerInfoUsuario(): string {
    if (this.usuarioActual.id.startsWith('temp-')) {
      return `👤 ${this.usuarioActual.nombre} (Temporal)`;
    }
    return `👤 ${this.usuarioActual.nombre} ${this.esAdmin ? '(Admin)' : '(Usuario)'}`;
  }

  // ===== MÉTODOS DE UI =====
  
  private async mostrarLoading(mensaje: string) {
    const loading = await this.loadingController.create({
      message: mensaje,
      spinner: 'dots'
    });
    await loading.present();
  }

  private async ocultarLoading() {
    try {
      await this.loadingController.dismiss();
    } catch (error) {
      // Ignorar error si no hay loading activo
    }
  }

  async mostrarToast(mensaje: string, color: string) {
    const toast = await this.toastController.create({
      message: mensaje,
      duration: 3000,
      color: color,
      position: 'top',
      buttons: [
        {
          text: '✕',
          role: 'cancel'
        }
      ]
    });
    toast.present();
  }

  // ===== MÉTODO PARA TRACKING =====
  
  trackByProducto(index: number, producto: Producto): string | number {
    return producto._id || producto.id || index;
  }

  // ===== CLEANUP =====
  
  ngOnDestroy() {
    if (this.carritoSubscription) {
      this.carritoSubscription.unsubscribe();
    }
    if (this.productosSubscription) {
      this.productosSubscription.unsubscribe();
    }
    
    // Limpiar datos sensibles de memoria al destruir el componente
    this.resetearDatosPago();
    this.sesionActual = null;
  }

  // ===== MÉTODOS ADICIONALES DE UTILIDAD =====

  obtenerImagenProducto(producto: Producto): string {
    if (producto.image && !producto.image.startsWith('assets/')) {
      return producto.image;
    }
    // Imagen por defecto si no hay imagen específica
    return 'assets/productos/default-product.jpg';
  }

  esProductoSinStock(producto: Producto): boolean {
    return producto.stock <= 0;
  }

  esProductoStockBajo(producto: Producto): boolean {
    return producto.stock > 0 && producto.stock <= 10;
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2
    }).format(precio);
  }

  exportarDatos() {
    if (!this.esAdmin) {
      this.mostrarToast('No tienes permisos para realizar esta acción', 'danger');
      return;
    }

    const datosExportacion = {
      timestamp: new Date().toISOString(),
      usuario: this.usuarioActual.nombre,
      productos: this.productos,
      estadoCache: {
        valido: this.esCacheValido(),
        timestamp: this.productosCache.timestamp,
        cantidad: this.productosCache.data.length
      },
      configuracion: {
        conectadoAPI: this.conectadoAPI,
        tokenValido: this.tokenValido,
        montoMinimoDescuento: this.montoMinimoDescuento,
        porcentajeDescuento: this.porcentajeDescuento
      }
    };

    // Crear y descargar archivo JSON
    const dataStr = JSON.stringify(datosExportacion, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `productos_export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    this.mostrarToast('Datos exportados correctamente', 'success');
    console.log('📋 Datos exportados:', datosExportacion);
  }

  limpiarDatosTemporales() {
    if (!this.esAdmin) {
      this.mostrarToast('No tienes permisos para realizar esta acción', 'danger');
      return;
    }

    const confirmado = confirm('¿Estás seguro de que quieres limpiar todos los datos temporales? Esta acción no se puede deshacer.');
    if (!confirmado) return;

    // Limpiar productos temporales
    this.productos = this.productos.filter(p => !p._id?.startsWith('temp_'));
    
    // Limpiar cache
    this.invalidarCache();
    
    // Vaciar carrito
    this.carritoService.vaciarCarrito();
    
    // Actualizar vista
    this.aplicarFiltrosBusqueda();
    this.cargarCategoriasYProveedores();

    this.mostrarToast('Datos temporales limpiados', 'success');
    console.log('🧹 Datos temporales limpiados');
  }

  // ===== MÉTODOS DE ESTADÍSTICAS RÁPIDAS =====

  obtenerEstadisticasRapidas() {
    const stats = {
      totalProductos: this.productos.length,
      productosConStock: this.productos.filter(p => p.stock > 0).length,
      productosSinStock: this.productos.filter(p => p.stock === 0).length,
      productosStockBajo: this.productos.filter(p => p.stock > 0 && p.stock <= 10).length,
      valorInventario: this.productos.reduce((total, p) => total + (p.precio * p.stock), 0),
      productosEnCarrito: this.carrito.length,
      totalCarrito: this.calcularTotalCarrito()
    };

    console.log('📊 Estadísticas del sistema:', stats);
    return stats;
  }

  mostrarEstadisticas() {
    const stats = this.obtenerEstadisticasRapidas();
    const mensaje = `📊 Productos: ${stats.totalProductos} | Con stock: ${stats.productosConStock} | Sin stock: ${stats.productosSinStock} | Stock bajo: ${stats.productosStockBajo}`;
    this.mostrarToast(mensaje, 'medium');
  }
}