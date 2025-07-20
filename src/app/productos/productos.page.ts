import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  stock: number;
  categoria: string;
  fecha: string;
  proveedor: string;
  image?: string; // Agregar imagen opcional
}

interface ProductoCarrito {
  id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  total: number;
}

@Component({
  selector: 'app-productos',
  templateUrl: './productos.page.html',
  styleUrls: ['./productos.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class ProductosPage implements OnInit {
  productos: Producto[] = [];
  proveedores: any[] = [];
  carrito: ProductoCarrito[] = [];
  esAdmin: boolean = false;

  nuevoProducto: Producto = this.crearProductoVacio();

  mostrarFormulario = false;
  vistaActual: 'grid' | 'lista' = 'grid'; // Nueva propiedad para alternar vistas

  constructor(
    private toastController: ToastController,
    private router: Router
  ) {}

  ngOnInit() {
    // Verificar el rol del usuario
    this.verificarRolUsuario();
    
    // Cargar productos
    this.cargarProductos();
    
    // Cargar proveedores
    this.cargarProveedores();
    
    // Cargar carrito
    this.cargarCarrito();
  }

  // Método para regresar a la página de home
  regresarHome() {
    this.router.navigate(['/home']);
  }

  verificarRolUsuario() {
    // Obtener el rol del usuario desde localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      const user = JSON.parse(userData);
      this.esAdmin = user.rol === 'admin';
    } else {
      // Si no hay datos del usuario, asumir que es usuario regular
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

  cargarCarrito() {
    const carritoData = localStorage.getItem('carrito');
    if (carritoData) {
      this.carrito = JSON.parse(carritoData);
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

  // Método para USUARIO - Agregar al carrito
  agregarAlCarrito(producto: Producto) {
    if (this.esAdmin) {
      this.mostrarToast('Los administradores no pueden agregar productos al carrito', 'warning');
      return;
    }

    if (producto.stock === 0) {
      this.mostrarToast('Este producto no tiene stock disponible', 'danger');
      return;
    }

    // Verificar si el producto ya está en el carrito
    const productoExistente = this.carrito.find(item => item.id === producto.id);
    
    if (productoExistente) {
      // Si ya existe, aumentar la cantidad
      productoExistente.cantidad += 1;
      productoExistente.total = productoExistente.cantidad * productoExistente.precio;
    } else {
      // Si no existe, agregarlo al carrito
      const nuevoItem: ProductoCarrito = {
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        cantidad: 1,
        total: producto.precio
      };
      this.carrito.push(nuevoItem);
    }

    // Guardar carrito en localStorage
    this.guardarCarritoEnLocalStorage();
    
    this.mostrarToast(`${producto.nombre} agregado al carrito`, 'success');
  }

  resetearFormulario() {
    this.nuevoProducto = this.crearProductoVacio();
  }

  guardarEnLocalStorage() {
    localStorage.setItem('productos', JSON.stringify(this.productos));
  }

  guardarCarritoEnLocalStorage() {
    localStorage.setItem('carrito', JSON.stringify(this.carrito));
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