import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ProductoCarrito {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  total: number;
  imagen?: string; // URL o base64 de la imagen
  descripcion?: string; // Descripción opcional del producto
}

export interface ResumenCompra {
  subtotal: number;
  descuento: number;
  total: number;
  aplicaDescuento: boolean;
}

export type MetodoPago = 'efectivo' | 'tarjeta';

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private carritoKey = 'carrito_global';
  private carritoSubject = new BehaviorSubject<ProductoCarrito[]>([]);
  
  // Observable para que las páginas puedan suscribirse a cambios
  carrito$ = this.carritoSubject.asObservable();
  
  // Configuración de descuentos
  private readonly MONTO_MINIMO_DESCUENTO = 500;
  private readonly PORCENTAJE_DESCUENTO = 0.10; // 10%

  constructor() {
    this.cargarCarrito();
  }

  private cargarCarrito() {
    const carritoData = localStorage.getItem(this.carritoKey);
    if (carritoData) {
      try {
        const carrito = JSON.parse(carritoData);
        this.carritoSubject.next(carrito);
      } catch (error) {
        console.error('Error al cargar carrito:', error);
        this.carritoSubject.next([]);
      }
    }
  }

  private guardarCarrito(carrito: ProductoCarrito[]) {
    localStorage.setItem(this.carritoKey, JSON.stringify(carrito));
    this.carritoSubject.next(carrito);
  }

  obtenerCarrito(): ProductoCarrito[] {
    return this.carritoSubject.value;
  }

  // Método auxiliar para convertir string a number de forma segura
  private convertirANumero(valor: string | number | undefined): number {
    if (valor === undefined || valor === null || valor === '') {
      return Date.now(); // Generar ID único si no existe
    }
    
    if (typeof valor === 'number') {
      return valor;
    }
    
    if (typeof valor === 'string') {
      const numero = parseInt(valor, 10);
      return isNaN(numero) ? Date.now() : numero;
    }
    
    return Date.now(); // Fallback
  }

  // ✅ MÉTODO CORREGIDO - Acepta tanto string como number para el ID
  agregarProducto(producto: { 
    id?: string | number, 
    nombre: string, 
    precio: number | string, 
    cantidad: number | string,
    imagen?: string,
    descripcion?: string 
  }) {
    const carritoActual = this.obtenerCarrito();
    
    // Convertir y validar los valores
    const precio = typeof producto.precio === 'string' ? 
      parseFloat(producto.precio) : producto.precio;
    
    const cantidad = typeof producto.cantidad === 'string' ? 
      parseInt(producto.cantidad, 10) : producto.cantidad;
    
    // Validar que precio y cantidad sean números válidos
    if (isNaN(precio) || isNaN(cantidad) || precio <= 0 || cantidad <= 0) {
      console.error('Precio o cantidad inválidos');
      return false;
    }

    // Convertir ID a número
    const id = this.convertirANumero(producto.id);
    
    // Verificar si el producto ya está en el carrito
    const productoExistente = carritoActual.find(item => 
      item.id === id || (item.nombre === producto.nombre && item.precio === precio)
    );
    
    if (productoExistente) {
      // Si ya existe, aumentar la cantidad
      productoExistente.cantidad += cantidad;
      productoExistente.total = productoExistente.cantidad * productoExistente.precio;
      
      // Actualizar imagen si se proporciona una nueva
      if (producto.imagen) {
        productoExistente.imagen = producto.imagen;
      }
      
      // Actualizar descripción si se proporciona una nueva
      if (producto.descripcion) {
        productoExistente.descripcion = producto.descripcion;
      }
    } else {
      // Si no existe, agregarlo al carrito
      const nuevoItem: ProductoCarrito = {
        id: id,
        nombre: producto.nombre,
        precio: precio,
        cantidad: cantidad,
        total: precio * cantidad,
        imagen: producto.imagen,
        descripcion: producto.descripcion
      };
      carritoActual.push(nuevoItem);
    }
    
    this.guardarCarrito(carritoActual);
    return true;
  }

  eliminarProducto(id: number | string) {
    const idNumerico = this.convertirANumero(id);
    const carritoActual = this.obtenerCarrito();
    const carritoFiltrado = carritoActual.filter(item => item.id !== idNumerico);
    this.guardarCarrito(carritoFiltrado);
  }

  actualizarCantidad(id: number | string, cantidad: number | string) {
    const idNumerico = this.convertirANumero(id);
    const cantidadNumerica = typeof cantidad === 'string' ? 
      parseInt(cantidad, 10) : cantidad;

    if (isNaN(cantidadNumerica)) {
      console.error('Cantidad inválida para actualizar');
      return;
    }

    const carritoActual = this.obtenerCarrito();
    const producto = carritoActual.find(item => item.id === idNumerico);
    
    if (producto) {
      if (cantidadNumerica <= 0) {
        this.eliminarProducto(idNumerico);
      } else {
        producto.cantidad = cantidadNumerica;
        producto.total = producto.cantidad * producto.precio;
        this.guardarCarrito(carritoActual);
      }
    }
  }

  // Método para actualizar imagen de un producto específico
  actualizarImagen(id: number | string, imagen: string) {
    const idNumerico = this.convertirANumero(id);
    const carritoActual = this.obtenerCarrito();
    const producto = carritoActual.find(item => item.id === idNumerico);
    
    if (producto) {
      producto.imagen = imagen;
      this.guardarCarrito(carritoActual);
      return true;
    }
    
    return false;
  }

  // Método para actualizar descripción de un producto específico
  actualizarDescripcion(id: number | string, descripcion: string) {
    const idNumerico = this.convertirANumero(id);
    const carritoActual = this.obtenerCarrito();
    const producto = carritoActual.find(item => item.id === idNumerico);
    
    if (producto) {
      producto.descripcion = descripcion;
      this.guardarCarrito(carritoActual);
      return true;
    }
    
    return false;
  }

  vaciarCarrito() {
    this.guardarCarrito([]);
  }

  // MÉTODOS PARA CÁLCULOS CON DESCUENTO

  calcularSubtotal(): number {
    return this.obtenerCarrito().reduce((total, item) => total + item.total, 0);
  }

  aplicaDescuento(): boolean {
    return this.calcularSubtotal() >= this.MONTO_MINIMO_DESCUENTO;
  }

  calcularDescuento(): number {
    if (this.aplicaDescuento()) {
      return this.calcularSubtotal() * this.PORCENTAJE_DESCUENTO;
    }
    return 0;
  }

  calcularTotal(): number {
    const subtotal = this.calcularSubtotal();
    const descuento = this.calcularDescuento();
    return subtotal - descuento;
  }

  obtenerResumenCompra(): ResumenCompra {
    const subtotal = this.calcularSubtotal();
    const descuento = this.calcularDescuento();
    const aplicaDescuento = this.aplicaDescuento();
    
    return {
      subtotal,
      descuento,
      total: subtotal - descuento,
      aplicaDescuento
    };
  }

  obtenerCantidadTotal(): number {
    return this.obtenerCarrito().reduce((total, item) => total + item.cantidad, 0);
  }

  // MÉTODOS PARA VALIDACIÓN DE COMPRA

  validarCompra(metodoPago: MetodoPago): { valida: boolean, mensaje: string } {
    const carrito = this.obtenerCarrito();
    
    if (carrito.length === 0) {
      return { valida: false, mensaje: 'El carrito está vacío' };
    }

    if (!metodoPago) {
      return { valida: false, mensaje: 'Debe seleccionar un método de pago' };
    }

    return { valida: true, mensaje: 'Compra válida' };
  }

  procesarCompra(metodoPago: MetodoPago): { 
    exito: boolean, 
    mensaje: string, 
    resumen?: ResumenCompra & { metodoPago: MetodoPago } 
  } {
    const validacion = this.validarCompra(metodoPago);
    
    if (!validacion.valida) {
      return { exito: false, mensaje: validacion.mensaje };
    }

    const resumen = this.obtenerResumenCompra();
    
    // Aquí podrías agregar lógica adicional según el método de pago
    // Por ejemplo, validaciones específicas para tarjeta, etc.
    
    return {
      exito: true,
      mensaje: 'Compra procesada exitosamente',
      resumen: {
        ...resumen,
        metodoPago
      }
    };
  }

  // MÉTODOS DE UTILIDAD

  obtenerMontoMinimoDescuento(): number {
    return this.MONTO_MINIMO_DESCUENTO;
  }

  obtenerPorcentajeDescuento(): number {
    return this.PORCENTAJE_DESCUENTO * 100; // Retorna como porcentaje
  }

  formatearPrecio(precio: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(precio);
  }

  // MÉTODOS ESPECÍFICOS PARA MANEJO DE IMÁGENES

  validarUrlImagen(url: string): boolean {
    if (!url) return false;
    
    // Validar URLs básicas
    const urlRegex = /^(https?:\/\/)|(data:image\/)/;
    return urlRegex.test(url);
  }

  // Método para obtener productos con imágenes
  obtenerProductosConImagenes(): ProductoCarrito[] {
    return this.obtenerCarrito().filter(producto => producto.imagen);
  }

  // Método para obtener productos sin imágenes
  obtenerProductosSinImagenes(): ProductoCarrito[] {
    return this.obtenerCarrito().filter(producto => !producto.imagen);
  }
}