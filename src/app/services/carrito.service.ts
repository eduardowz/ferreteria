import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ProductoCarrito {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  total: number;
}

export interface CalculoTotal {
  subtotal: number;
  descuento: number;
  total: number;
  aplicaDescuento: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class CarritoService {
  private carritoKey = 'carrito_global';
  private carritoSubject = new BehaviorSubject<ProductoCarrito[]>([]);
  
  // Observable para que las páginas puedan suscribirse a cambios
  carrito$ = this.carritoSubject.asObservable();

  // Configuración de descuentos
  private readonly DESCUENTO_PORCENTAJE = 0.10; // 10%
  private readonly MONTO_MINIMO_DESCUENTO = 500; // $500 MXN

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

  // Método simple para obtener solo el subtotal
  calcularTotal(): number {
    return this.obtenerCarrito().reduce((total, item) => total + item.total, 0);
  }

  // NUEVO: Método completo para calcular totales con descuentos
  calcularTotalConDescuento(metodoPago?: string): CalculoTotal {
    const subtotal = this.calcularTotal();
    const aplicaDescuento = subtotal >= this.MONTO_MINIMO_DESCUENTO;
    const descuento = aplicaDescuento ? subtotal * this.DESCUENTO_PORCENTAJE : 0;
    const total = subtotal - descuento;

    return {
      subtotal,
      descuento,
      total,
      aplicaDescuento
    };
  }

  // NUEVO: Verificar si aplica descuento
  aplicaDescuento(): boolean {
    return this.calcularTotal() >= this.MONTO_MINIMO_DESCUENTO;
  }

  // NUEVO: Obtener el monto mínimo para descuento
  obtenerMontoMinimoDescuento(): number {
    return this.MONTO_MINIMO_DESCUENTO;
  }

  // NUEVO: Obtener porcentaje de descuento
  obtenerPorcentajeDescuento(): number {
    return this.DESCUENTO_PORCENTAJE * 100; // Retorna como porcentaje (10)
  }

  obtenerCantidadTotal(): number {
    return this.obtenerCarrito().reduce((total, item) => total + item.cantidad, 0);
  }

  // NUEVO: Validar método de pago
  validarMetodoPago(metodoPago: string): boolean {
    const metodosValidos = ['efectivo', 'tarjeta'];
    return metodosValidos.includes(metodoPago.toLowerCase());
  }
}