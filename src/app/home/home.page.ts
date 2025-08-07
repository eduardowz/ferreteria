import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface UserData {
  id?: number;
  username: string;
  nombre?: string;
  email?: string;
  role: 'admin' | 'user';
  rol?: 'admin' | 'usuario'; // Campo adicional para consistencia
  empresa?: string;
  fechaCreacion?: string;
  telefono?: string;
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, RouterModule, CommonModule]
})
export class HomePage implements OnInit {
  isAdmin: boolean = false;
  userData: UserData | null = null;
  userName: string = '';

  constructor(private router: Router) {}

  ngOnInit() {
    this.checkUserAuthentication();
    this.loadUserData();
    this.checkUserRole();
    console.log('Usuario es admin:', this.isAdmin);
    console.log('Datos del usuario:', this.userData);
  }

  // Verificar si el usuario está autenticado
  checkUserAuthentication() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
      console.log('Usuario no autenticado, redirigiendo al login');
      this.router.navigate(['/login']);
      return;
    }
  }

  checkUserRole() {
    try {
      // Reinicializar isAdmin
      this.isAdmin = false;

      // Primero intentar obtener desde userData completo
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const userData: UserData = JSON.parse(userDataStr);
        
        // Verificar tanto role como rol para máxima compatibilidad
        this.isAdmin = userData.role === 'admin' || userData.rol === 'admin';
        
        console.log('Datos del usuario desde localStorage:', userData);
        console.log('Role:', userData.role);
        console.log('Rol:', userData.rol);
        console.log('Es admin:', this.isAdmin);
        return;
      }

      // Fallback: verificar con campos individuales
      const role = localStorage.getItem('role');
      const userType = localStorage.getItem('userType');
      
      if (role) {
        this.isAdmin = role.toLowerCase() === 'admin';
        console.log('Rol desde role:', role, 'Es admin:', this.isAdmin);
      } else if (userType) {
        this.isAdmin = userType.toLowerCase() === 'admin';
        console.log('Rol desde userType:', userType, 'Es admin:', this.isAdmin);
      } else {
        // Si no hay rol definido, redirigir al login
        console.log('No se encontró información de rol, redirigiendo al login');
        this.router.navigate(['/login']);
        return;
      }
      
    } catch (error) {
      console.error('Error al verificar rol de usuario:', error);
      this.router.navigate(['/login']);
    }
  }

  loadUserData() {
    try {
      // Cargar datos completos del usuario
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        this.userData = JSON.parse(userDataStr);
        this.userName = this.userData?.nombre || this.userData?.username || '';
        console.log('Datos cargados desde userData:', this.userData);
      } else {
        // Fallback a datos individuales (compatibilidad con sistema anterior)
        this.userName = localStorage.getItem('userName') || 'Usuario';
        
        // Crear userData básico desde datos individuales si existen
        const email = localStorage.getItem('userEmail');
        const role = localStorage.getItem('role') || localStorage.getItem('userType');
        
        if (role) {
          this.userData = {
            username: this.userName,
            nombre: this.userName,
            email: email || '',
            role: role as 'admin' | 'user',
            rol: role === 'admin' ? 'admin' : 'usuario'
          };
        }
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
      this.userName = 'Usuario';
    }
  }

  // Método para cambiar rol temporalmente (solo para pruebas)
  toggleRole() {
    try {
      // Solo permitir cambio de rol si es el admin predeterminado
      if (this.userData && this.userData.email === 'admin@ferreteria.com') {
        const newRole = this.isAdmin ? 'user' : 'admin';
        const newRol = this.isAdmin ? 'usuario' : 'admin';
        
        // Actualizar userData
        if (this.userData) {
          this.userData.role = newRole;
          this.userData.rol = newRol;
          localStorage.setItem('userData', JSON.stringify(this.userData));
        }
        
        // Actualizar otros campos de sesión
        localStorage.setItem('role', newRole);
        localStorage.setItem('userType', newRole);
        
        // Actualizar la vista
        this.checkUserRole();
        this.loadUserData();
        
        console.log('Rol cambiado a:', newRole);
      } else {
        console.log('Cambio de rol no permitido para este usuario');
      }
    } catch (error) {
      console.error('Error al cambiar rol:', error);
    }
  }

  navigateToClientes() {
    if (this.isAdmin) {
      this.router.navigate(['/clientes']);
    }
  }

  logout() {
    try {
      // Limpiar todos los datos de sesión
      localStorage.removeItem('userData');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userType');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('role');
      localStorage.removeItem('rol'); // Nuevo campo
      localStorage.removeItem('currentUser');
      localStorage.removeItem('carrito');
      
      console.log('Sesión cerrada correctamente');
      this.router.navigate(['/login']);
      
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Navegar al login aunque haya error
      this.router.navigate(['/login']);
    }
  }

  // Verificar si el usuario actual está autenticado
  isAuthenticated(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true' && this.userData !== null;
  }

  // Obtener información del usuario para mostrar en la vista
  getUserDisplayInfo() {
    if (this.userData) {
      return {
        nombre: this.userData.nombre || this.userData.username,
        email: this.userData.email || '',
        rol: this.isAdmin ? 'Administrador' : 'Usuario',
        fechaCreacion: this.userData.fechaCreacion || 'No disponible'
      };
    }
    return null;
  }

  // Método para debugging - eliminar en producción
  debugUserData() {
    console.log('=== DEBUG USER DATA ===');
    console.log('isAdmin:', this.isAdmin);
    console.log('userData:', this.userData);
    console.log('userName:', this.userName);
    console.log('localStorage userData:', localStorage.getItem('userData'));
    console.log('localStorage role:', localStorage.getItem('role'));
    console.log('localStorage userType:', localStorage.getItem('userType'));
    console.log('localStorage isLoggedIn:', localStorage.getItem('isLoggedIn'));
    console.log('=======================');
  }
}