import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ProductoCarrito {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  total: number;
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

  agregarProducto(producto: { id?: number, nombre: string, precio: number, cantidad: number }) {
    const carritoActual = this.obtenerCarrito();
    
    // Generar ID si no existe (para productos de pedidos)
    const id = producto.id || Date.now();
    
    // Verificar si el producto ya está en el carrito
    const productoExistente = carritoActual.find(item => 
      item.id === id || item.nombre === producto.nombre 
    );
    
    if (productoExistente) {
      // Si ya existe, aumentar la cantidad
      productoExistente.cantidad += producto.cantidad;
      productoExistente.total = productoExistente.cantidad * productoExistente.precio;
    } else {
      // Si no existe, agregarlo al carrito
      const nuevoItem: ProductoCarrito = {
        id: id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: producto.cantidad,
        total: producto.precio * producto.cantidad
      };
      carritoActual.push(nuevoItem);
    }
    
    this.guardarCarrito(carritoActual);
    return true;
  }

  eliminarProducto(id: number) {
    const carritoActual = this.obtenerCarrito();
    const carritoFiltrado = carritoActual.filter(item => item.id !== id);
    this.guardarCarrito(carritoFiltrado);
  }

  actualizarCantidad(id: number, cantidad: number) {
    const carritoActual = this.obtenerCarrito();
    const producto = carritoActual.find(item => item.id === id);
    
    if (producto) {
      if (cantidad <= 0) {
        this.eliminarProducto(id);
      } else {
        producto.cantidad = cantidad;
        producto.total = producto.cantidad * producto.precio;
        this.guardarCarrito(carritoActual);
      }
    }
  }

  vaciarCarrito() {
    this.guardarCarrito([]);
  }

  // NUEVOS MÉTODOS PARA CÁLCULOS CON DESCUENTO

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

  // NUEVOS MÉTODOS PARA VALIDACIÓN DE COMPRA

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
}