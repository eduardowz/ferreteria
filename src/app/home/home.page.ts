import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

interface UserData {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'usuario';
  empresa?: string;
  fechaCreacion: string;
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
    this.checkUserRole();
    this.loadUserData();
    console.log('Usuario es admin:', this.isAdmin);
    console.log('Datos del usuario:', this.userData);
  }

  checkUserRole() {
    try {
      // Primero intentar obtener desde userData completo
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const userData: UserData = JSON.parse(userDataStr);
        this.isAdmin = userData.rol === 'admin';
        console.log('Rol desde userData:', userData.rol);
        return;
      }

      // Si no existe userData, intentar con userType (tu sistema actual)
      const userType = localStorage.getItem('userType');
      if (userType) {
        this.isAdmin = userType.toLowerCase() === 'admin';
        console.log('Rol desde userType:', userType);
        return;
      }

      // Fallback: verificar userRole (compatibilidad)
      const userRole = localStorage.getItem('userRole');
      if (userRole) {
        this.isAdmin = userRole.toLowerCase() === 'admin';
        console.log('Rol desde userRole:', userRole);
        return;
      }

      // Si no hay ningún rol definido, asumir usuario normal
      console.log('No se encontró rol, asumiendo usuario normal');
      this.isAdmin = false;
      
    } catch (error) {
      console.error('Error al verificar rol de usuario:', error);
      this.isAdmin = false;
    }
  }

  loadUserData() {
    try {
      // Cargar datos completos del usuario
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        this.userData = JSON.parse(userDataStr);
        this.userName = this.userData?.nombre || '';
      } else {
        // Fallback a datos individuales
        this.userName = localStorage.getItem('userName') || 'Usuario';
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
      this.userName = 'Usuario';
    }
  }

  // Método para cambiar rol temporalmente (solo para pruebas - eliminar en producción)
  toggleRole() {
    try {
      const currentUserType = localStorage.getItem('userType');
      const newUserType = currentUserType === 'admin' ? 'usuario' : 'admin';
      
      // Actualizar userType
      localStorage.setItem('userType', newUserType);
      
      // Actualizar userData si existe
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const userData: UserData = JSON.parse(userDataStr);
        userData.rol = newUserType as 'admin' | 'usuario';
        localStorage.setItem('userData', JSON.stringify(userData));
      }
      
      // Actualizar la vista
      this.checkUserRole();
      this.loadUserData();
      
      console.log('Rol cambiado a:', newUserType);
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
      // Usar el método estático de limpieza de sesión de LoginPage
      // o limpiar manualmente todos los datos
      localStorage.removeItem('userData');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userType');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('userRole'); // Compatibilidad
      localStorage.removeItem('carrito');
      
      console.log('Sesión cerrada correctamente');
      this.router.navigate(['/login']);
      
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      // Navegar al login aunque haya error
      this.router.navigate(['/login']);
    }
  }
}