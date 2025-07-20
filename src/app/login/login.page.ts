import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ToastController } from '@ionic/angular';

interface UserData {
  id: number;
  nombre: string;
  email: string;
  rol: 'admin' | 'usuario';
  empresa?: string;
  fechaCreacion: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule]
})
export class LoginPage {
  email: string = '';
  password: string = '';
  errorMessage: string = '';
  loginType: string = 'admin'; // 'admin' o 'user'
  showPassword: boolean = false;
  
  // Usuarios predefinidos para la demo
  private usuariosPredefinidos: UserData[] = [
    {
      id: 1,
      nombre: 'Administrador Principal',
      email: 'admin@ferreteria.com',
      rol: 'admin',
      empresa: 'Ferretería X',
      fechaCreacion: '2025-01-01'
    },
    {
      id: 2,
      nombre: 'Usuario Demo',
      email: 'usuario@test.com',
      rol: 'usuario',
      fechaCreacion: '2025-01-15'
    }
  ];

  constructor(
    private router: Router,
    private toastController: ToastController
  ) {}

  // Alternar visibilidad de contraseña
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Validar si el formulario es válido
  isFormValid(): boolean {
    return !!(this.email && this.password && this.email.trim() !== '' && this.password.trim() !== '');
  }

  // Método de login principal
  async login(): Promise<void> {
    this.errorMessage = '';
    
    if (!this.isFormValid()) {
      this.errorMessage = 'Por favor, completa todos los campos';
      await this.mostrarToast('Por favor, completa todos los campos', 'warning');
      return;
    }

    // Validar formato de email
    if (!this.isValidEmail(this.email)) {
      this.errorMessage = 'Por favor, ingresa un email válido';
      await this.mostrarToast('Por favor, ingresa un email válido', 'warning');
      return;
    }

    try {
      if (this.loginType === 'admin') {
        await this.loginAsAdmin();
      } else {
        await this.loginAsUser();
      }
    } catch (error) {
      console.error('Error durante el login:', error);
      this.errorMessage = 'Error interno del sistema. Intenta nuevamente.';
      await this.mostrarToast('Error interno del sistema', 'danger');
    }
  }

  // Login como administrador
  private async loginAsAdmin(): Promise<void> {
    // Credenciales de administrador
    if (this.email === 'admin@ferreteria.com' && this.password === 'admin123') {
      
      const adminData: UserData | undefined = this.usuariosPredefinidos.find(
        user => user.email === this.email && user.rol === 'admin'
      );

      if (!adminData) {
        this.errorMessage = 'Error: Datos de administrador no encontrados';
        await this.mostrarToast('Error interno del sistema', 'danger');
        return;
      }

      // Guardar información del usuario en localStorage
      this.guardarDatosUsuario(adminData);
      
      // Mostrar toast de bienvenida
      await this.mostrarToast(`¡Bienvenido ${adminData.nombre}!`, 'success');
      
      console.log('Navegando a /home como admin');
      
      try {
        const success = await this.router.navigate(['/home']);
        console.log('Navegación exitosa:', success);
      } catch (error) {
        console.error('Error en navegación:', error);
        this.errorMessage = 'Error al navegar a la página principal';
        await this.mostrarToast('Error al navegar', 'danger');
      }
    } else {
      this.errorMessage = 'Credenciales de administrador incorrectas';
      await this.mostrarToast('Credenciales incorrectas', 'danger');
    }
  }

  // Login como usuario
  private async loginAsUser(): Promise<void> {
    // Credenciales de usuario de prueba
    if (this.email === 'usuario@test.com' && this.password === 'user123') {
      
      const userData: UserData | undefined = this.usuariosPredefinidos.find(
        user => user.email === this.email && user.rol === 'usuario'
      );

      if (!userData) {
        this.errorMessage = 'Error: Datos de usuario no encontrados';
        await this.mostrarToast('Error interno del sistema', 'danger');
        return;
      }

      // Guardar información del usuario en localStorage
      this.guardarDatosUsuario(userData);
      
      // Mostrar toast de bienvenida
      await this.mostrarToast(`¡Bienvenido ${userData.nombre}!`, 'success');
      
      console.log('Navegando a /home como usuario');
      
      try {
        const success = await this.router.navigate(['/home']);
        console.log('Navegación exitosa:', success);
      } catch (error) {
        console.error('Error en navegación:', error);
        this.errorMessage = 'Error al navegar a la página principal';
        await this.mostrarToast('Error al navegar', 'danger');
      }
    } else {
      // Verificar si existe el usuario registrado
      const usuarioRegistrado = this.verificarUsuarioRegistrado(this.email, this.password);
      
      if (usuarioRegistrado) {
        this.guardarDatosUsuario(usuarioRegistrado);
        await this.mostrarToast(`¡Bienvenido ${usuarioRegistrado.nombre}!`, 'success');
        
        try {
          await this.router.navigate(['/home']);
        } catch (error) {
          console.error('Error en navegación:', error);
          this.errorMessage = 'Error al navegar a la página principal';
          await this.mostrarToast('Error al navegar', 'danger');
        }
      } else {
        this.errorMessage = 'Email o contraseña incorrectos';
        await this.mostrarToast('Credenciales incorrectas', 'danger');
      }
    }
  }

  // Guardar datos del usuario en localStorage
  private guardarDatosUsuario(userData: UserData): void {
    try {
      // Información completa del usuario
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Información de sesión (para compatibilidad)
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('userType', userData.rol);
      localStorage.setItem('userEmail', userData.email);
      localStorage.setItem('userName', userData.nombre);
      
      console.log('Datos de usuario guardados:', userData);
    } catch (error) {
      console.error('Error al guardar datos del usuario:', error);
    }
  }

  // Verificar si existe un usuario registrado
  private verificarUsuarioRegistrado(email: string, password: string): UserData | null {
    try {
      const usuariosRegistrados = localStorage.getItem('usuariosRegistrados');
      
      if (usuariosRegistrados) {
        const usuarios: UserData[] = JSON.parse(usuariosRegistrados);
        return usuarios.find(user => 
          user.email === email && 
          user.rol === 'usuario'
        ) || null;
      }
    } catch (error) {
      console.error('Error al verificar usuario registrado:', error);
    }
    
    return null;
  }

  // Validar formato de email
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Método para "olvidé mi contraseña"
  async forgotPassword(): Promise<void> {
    await this.mostrarToast('Función de recuperación de contraseña en desarrollo', 'primary');
    console.log('Redirigir a recuperación de contraseña');
    // TODO: Implementar navegación a página de recuperación
    // this.router.navigate(['/forgot-password']);
  }

  // Método para crear nueva cuenta
  async createAccount(): Promise<void> {
    await this.mostrarToast('Función de registro en desarrollo', 'primary');
    console.log('Redirigir a creación de cuenta');
    // TODO: Implementar navegación a página de registro
    // this.router.navigate(['/register']);
  }

  // Método para registrar nuevo usuario (para uso futuro)
  registrarNuevoUsuario(userData: Omit<UserData, 'id' | 'fechaCreacion'>): UserData {
    try {
      const usuariosRegistrados = localStorage.getItem('usuariosRegistrados');
      let usuarios: UserData[] = [];
      
      if (usuariosRegistrados) {
        usuarios = JSON.parse(usuariosRegistrados);
      }
      
      const nuevoUsuario: UserData = {
        ...userData,
        id: usuarios.length + 1,
        fechaCreacion: new Date().toISOString().split('T')[0]
      };
      
      usuarios.push(nuevoUsuario);
      localStorage.setItem('usuariosRegistrados', JSON.stringify(usuarios));
      
      console.log('Nuevo usuario registrado:', nuevoUsuario);
      return nuevoUsuario;
    } catch (error) {
      console.error('Error al registrar nuevo usuario:', error);
      throw error;
    }
  }

  // Método para mostrar toast
  private async mostrarToast(mensaje: string, color: string): Promise<void> {
    try {
      const toast = await this.toastController.create({
        message: mensaje,
        duration: 3000,
        color: color,
        position: 'top',
        buttons: [
          {
            text: 'Cerrar',
            role: 'cancel'
          }
        ]
      });
      await toast.present();
    } catch (error) {
      console.error('Error al mostrar toast:', error);
    }
  }

  // Método para limpiar sesión (útil para logout)
  static limpiarSesion(): void {
    try {
      localStorage.removeItem('userData');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('userType');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('carrito');
      console.log('Sesión limpiada correctamente');
    } catch (error) {
      console.error('Error al limpiar sesión:', error);
    }
  }
}