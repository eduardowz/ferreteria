import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';

interface UserData {
  id?: number;
  username: string;
  password?: string;
  role: 'admin' | 'user';
  rol: 'admin' | 'usuario'; // Agregamos también 'rol' para consistencia
  fechaCreacion?: string;
  nombre?: string;
  email?: string;
  telefono?: string;
}

interface RegistroData {
  nombre: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  telefono?: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, FormsModule, CommonModule]
})
export class LoginPage {
  username: string = '';
  password: string = '';
  errorMessage: string = '';
  loginType: string = 'admin'; // 'admin' o 'user'
  showPassword: boolean = false;
  
  // Variables para el registro
  showRegistro: boolean = false;
  showPasswordRegistro: boolean = false;
  registroData: RegistroData = {
    nombre: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    telefono: ''
  };
  
  constructor(
    private router: Router,
    private toastController: ToastController
  ) {}

  // Alternar visibilidad de contraseña
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Alternar visibilidad de contraseña en registro
  togglePasswordRegistroVisibility(): void {
    this.showPasswordRegistro = !this.showPasswordRegistro;
  }

  // Validar si el formulario es válido
  isFormValid(): boolean {
    return !!(this.username && this.password && 
              this.username.trim() !== '' && this.password.trim() !== '');
  }

  // Validar formulario de registro
  isRegistroFormValid(): boolean {
    return !!(
      this.registroData.nombre && this.registroData.nombre.trim() !== '' &&
      this.registroData.username && this.registroData.username.trim() !== '' &&
      this.registroData.email && this.registroData.email.trim() !== '' &&
      this.registroData.password && this.registroData.password.trim() !== '' &&
      this.registroData.confirmPassword && this.registroData.confirmPassword.trim() !== '' &&
      this.registroData.password === this.registroData.confirmPassword &&
      this.isValidEmail(this.registroData.email)
    );
  }

  // Método de login principal
  async login(): Promise<void> {
    this.errorMessage = '';
    
    if (!this.isFormValid()) {
      this.errorMessage = 'Por favor, completa todos los campos';
      await this.mostrarToast('Por favor, completa todos los campos', 'warning');
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
    if (this.username === 'admin' && this.password === 'admin123') {
      const adminData: UserData = {
        id: 1,
        username: 'admin',
        role: 'admin',
        rol: 'admin', // CONSISTENCIA: ambos campos con mismo valor
        nombre: 'Administrador',
        email: 'admin@ferreteria.com',
        fechaCreacion: new Date().toISOString().split('T')[0]
      };

      // Guardar información del usuario con estructura unificada
      this.guardarDatosUsuario(adminData);
      
      // Mostrar toast de bienvenida
      await this.mostrarToast('¡Bienvenido Administrador!', 'success');
      
      console.log('Navegando a /home como admin', adminData);
      
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
    const registrousuario = JSON.parse(localStorage.getItem('registrousuario') || '[]');
    const user = registrousuario.find((u: any) => u.username === this.username);

    if (user && user.password === this.password) {
      const userData: UserData = {
        id: user.id || Date.now(),
        username: user.username,
        role: 'user',
        rol: 'usuario', // CONSISTENCIA: rol como 'usuario' para users normales
        nombre: user.nombre || user.username,
        email: user.email,
        telefono: user.telefono || '',
        fechaCreacion: user.fechaCreacion || new Date().toISOString().split('T')[0]
      };

      // Guardar información del usuario con estructura unificada
      this.guardarDatosUsuario(userData);
      
      // Mostrar toast de bienvenida
      await this.mostrarToast(`¡Bienvenido ${userData.nombre}!`, 'success');
      
      console.log('Navegando a /home como usuario', userData);
      
      try {
        const success = await this.router.navigate(['/home']);
        console.log('Navegación exitosa:', success);
      } catch (error) {
        console.error('Error en navegación:', error);
        this.errorMessage = 'Error al navegar a la página principal';
        await this.mostrarToast('Error al navegar', 'danger');
      }
    } else {
      this.errorMessage = 'Credenciales incorrectas o usuario no registrado';
      await this.mostrarToast('Credenciales incorrectas', 'danger');
    }
  }

  // Guardar datos del usuario en localStorage con estructura unificada
  private guardarDatosUsuario(userData: UserData): void {
    try {
      // Información completa del usuario
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Información de sesión (compatibilidad con sistema actual)
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('role', userData.role);
      localStorage.setItem('rol', userData.rol); // NUEVO: también guardamos 'rol'
      localStorage.setItem('userType', userData.role); // Para compatibilidad con HomePage
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('userName', userData.nombre || userData.username);
      localStorage.setItem('userEmail', userData.email || '');
      
      console.log('Datos de usuario guardados:', userData);
      console.log('LocalStorage role:', userData.role);
      console.log('LocalStorage rol:', userData.rol);
    } catch (error) {
      console.error('Error al guardar datos del usuario:', error);
    }
  }

  // Toggle para mostrar/ocultar formulario de registro
  toggleRegistro(): void {
    this.showRegistro = !this.showRegistro;
    this.errorMessage = '';
    if (!this.showRegistro) {
      this.limpiarFormularioRegistro();
    }
  }

  // Registrar nuevo usuario - mejorado para integración
  async registrarUsuario(): Promise<void> {
    this.errorMessage = '';

    if (!this.isRegistroFormValid()) {
      this.errorMessage = 'Por favor, completa todos los campos correctamente';
      await this.mostrarToast('Por favor, completa todos los campos correctamente', 'warning');
      return;
    }

    if (this.registroData.password !== this.registroData.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      await this.mostrarToast('Las contraseñas no coinciden', 'warning');
      return;
    }

    if (this.registroData.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      await this.mostrarToast('La contraseña debe tener al menos 6 caracteres', 'warning');
      return;
    }

    try {
      // Verificar si el usuario ya existe
      if (this.verificarUsuarioExiste(this.registroData.username, this.registroData.email)) {
        this.errorMessage = 'El usuario o email ya existe';
        await this.mostrarToast('El usuario o email ya existe', 'danger');
        return;
      }

      // Crear nuevo usuario
      const nuevoUsuario = await this.crearNuevoUsuario();
      
      if (nuevoUsuario) {
        await this.mostrarToast(`¡Usuario ${nuevoUsuario.username} registrado exitosamente!`, 'success');
        
        // Limpiar formulario y ocultar sección de registro
        this.limpiarFormularioRegistro();
        this.showRegistro = false;
        
        // Auto-login del nuevo usuario
        this.username = nuevoUsuario.username;
        this.password = this.registroData.password;
        this.loginType = 'user'; // Asegurar que esté en modo usuario
        await this.loginAsUser();
      }
    } catch (error) {
      console.error('Error durante el registro:', error);
      this.errorMessage = 'Error al registrar usuario. Intenta nuevamente.';
      await this.mostrarToast('Error al registrar usuario', 'danger');
    }
  }

  // Cancelar registro
  cancelarRegistro(): void {
    this.limpiarFormularioRegistro();
    this.showRegistro = false;
    this.errorMessage = '';
  }

  // Limpiar formulario de registro
  private limpiarFormularioRegistro(): void {
    this.registroData = {
      nombre: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      telefono: ''
    };
    this.showPasswordRegistro = false;
  }

  // Verificar si el usuario ya existe
  private verificarUsuarioExiste(username: string, email: string): boolean {
    try {
      const usuariosRegistrados = JSON.parse(localStorage.getItem('registrousuario') || '[]');
      return usuariosRegistrados.some((user: any) => 
        user.username.toLowerCase() === username.toLowerCase() ||
        user.email.toLowerCase() === email.toLowerCase()
      );
    } catch (error) {
      console.error('Error al verificar usuario existente:', error);
      return false;
    }
  }

  // Crear nuevo usuario - mejorado con estructura consistente
  private async crearNuevoUsuario(): Promise<UserData> {
    try {
      const usuariosRegistrados = JSON.parse(localStorage.getItem('registrousuario') || '[]');
      
      const nuevoUsuario: UserData = {
        id: usuariosRegistrados.length + 1,
        username: this.registroData.username.trim(),
        password: this.registroData.password,
        nombre: this.registroData.nombre.trim(),
        email: this.registroData.email.trim().toLowerCase(),
        telefono: this.registroData.telefono?.trim() || '',
        role: 'user',
        rol: 'usuario', // CONSISTENCIA: usuarios normales como 'usuario'
        fechaCreacion: new Date().toISOString().split('T')[0]
      };

      usuariosRegistrados.push(nuevoUsuario);
      localStorage.setItem('registrousuario', JSON.stringify(usuariosRegistrados));
      
      console.log('Nuevo usuario creado:', nuevoUsuario);
      return nuevoUsuario;
    } catch (error) {
      console.error('Error al crear nuevo usuario:', error);
      throw error;
    }
  }

  // Validar formato de email
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
      localStorage.removeItem('role');
      localStorage.removeItem('rol');
      localStorage.removeItem('userType');
      localStorage.removeItem('currentUser');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('carrito');
      console.log('Sesión limpiada correctamente');
    } catch (error) {
      console.error('Error al limpiar sesión:', error);
    }
  }

  // Método para obtener datos del usuario actual
  static obtenerUsuarioActual(): UserData | null {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error al obtener usuario actual:', error);
      return null;
    }
  }

  // Método para verificar si el usuario está logueado
  static estaLogueado(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true';
  }

  // Método para obtener el rol del usuario actual - MEJORADO
  static obtenerRolUsuario(): 'admin' | 'user' | null {
    const role = localStorage.getItem('role');
    return role === 'admin' || role === 'user' ? role : null;
  }

  // NUEVO: Método para verificar si es admin
  static esAdmin(): boolean {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.role === 'admin' || user.rol === 'admin';
      } catch (error) {
        console.error('Error al verificar rol de admin:', error);
        return false;
      }
    }
    return false;
  }

  // NUEVO: Método para verificar si es usuario normal
  static esUsuario(): boolean {
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user.role === 'user' || user.rol === 'usuario';
      } catch (error) {
        console.error('Error al verificar rol de usuario:', error);
        return false;
      }
    }
    return false;
  }
}