import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ToastController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { HttpService } from '../services/http.service';
import { NgZone } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

interface UserData {
  _id: string;
  id?: string;
  username: string;
  password?: string;
  rol: 'admin' | 'user';
  fechaCreacion?: string;
  nombre?: string;
  email?: string;
  telefono?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface RegistroData {
  nombre: string;
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  telefono?: string;
}

interface LoginResponse {
  success: boolean;
  message?: string;
  error?: string;
  token: string;
  usuario: UserData;
}

interface RegistroResponse {
  success: boolean;
  message?: string;
  error?: string;
  token: string;
  usuario: UserData;
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
  loginType: string = 'user'; // Por defecto 'user', cambiará a 'admin' según el usuario
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

  // Estados de carga
  isLoading: boolean = false;
  isRegistering: boolean = false;
  
  constructor(
    private router: Router,
    private toastController: ToastController,
    private httpService: HttpService,
    private ngZone: NgZone 
    
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


  
  // MÉTODO DE LOGIN PRINCIPAL - CORREGIDO PARA MONGODB
  async login(): Promise<void> {
    this.errorMessage = '';
    this.isLoading = true;
    
    if (!this.isFormValid()) {
      this.errorMessage = 'Por favor, completa todos los campos';
      await this.mostrarToast('Por favor, completa todos los campos', 'warning');
      this.isLoading = false;
      return;
    }

    try {
      // Preparar datos para enviar al backend
      const loginData = {
        username: this.username.trim(),
        password: this.password
        // Removemos loginType ya que el rol se determina desde la base de datos
      };

      console.log('🔐 Enviando datos de login:', { ...loginData, password: '***' });

      // Llamar al backend
      const response: any = await this.httpService.login(loginData).toPromise();

      if (response && response.success && response.token && response.usuario){
        // Login exitoso
        console.log('✅ Login exitoso:', { ...response, token: '***' });
        
        // Procesar respuesta del servidor MongoDB
        const userData: UserData = {
          _id: response.usuario._id,
          id: response.usuario._id, // Para compatibilidad
          username: response.usuario.username,
          nombre: response.usuario.nombre || response.usuario.username,
          email: response.usuario.email || '',
          telefono: response.usuario.telefono || '',
          rol: response.usuario.rol, // Este viene directamente de MongoDB
          fechaCreacion: response.usuario.createdAt || response.usuario.fechaCreacion || new Date().toISOString().split('T')[0]
        };

        // Determinar tipo de login basado en el rol del usuario
        this.loginType = userData.rol;

        // Guardar token y datos del usuario
        this.guardarDatosUsuario(userData, response.token);
        
        // Mostrar mensaje personalizado según el rol
        const mensajeBienvenida = userData.rol === 'admin' 
          ? `¡Bienvenido Admin ${userData.nombre}! 🔧`
          : `¡Bienvenido ${userData.nombre}! 🛍️`;
          
        await this.mostrarToast(mensajeBienvenida, 'success');
        
        // Log para verificar permisos
        console.log(`👤 Usuario logueado: ${userData.nombre} | Rol: ${userData.rol} | Admin: ${userData.rol === 'admin'}`);
        
        // Navegar a home
console.log('🚀 Navegando a /home con userData:', userData);

this.ngZone.run(() => {
  this.router.navigate(['/home']).then(success => {
    if (success) {
      console.log('✅ Navegación exitosa');
    } else {
      console.error('❌ Error en la navegación');
    }
  });
});
        
      } else {
        throw new Error('Respuesta inválida del servidor');
      }

    } catch (error: any) {
      console.error('❌ Error durante el login:', error);
      
      // Manejar diferentes tipos de errores
      if (error.status === 401 || error.status === 400) {
        this.errorMessage = 'Credenciales incorrectas';
        await this.mostrarToast('Usuario o contraseña incorrectos', 'danger');
      } else if (error.status === 404) {
        this.errorMessage = 'Usuario no encontrado';
        await this.mostrarToast('Usuario no encontrado', 'danger');
      } else if (error.status === 403) {
        this.errorMessage = 'Acceso denegado';
        await this.mostrarToast('Acceso denegado', 'danger');
      } else if (error.status === 0) {
        this.errorMessage = 'No se puede conectar con el servidor. Verifica que el backend esté ejecutándose.';
        await this.mostrarToast('Error de conexión con el servidor', 'danger');
      } else if (error.error && error.error.message) {
        this.errorMessage = error.error.message;
        await this.mostrarToast(error.error.message, 'danger');
      } else if (error.error && error.error.error) {
        this.errorMessage = error.error.error;
        await this.mostrarToast(error.error.error, 'danger');
      } else {
        this.errorMessage = 'Error interno del sistema. Intenta nuevamente.';
        await this.mostrarToast('Error interno del sistema', 'danger');
      }
    } finally {
      this.isLoading = false;
    }
  }

  // Guardar datos del usuario con token - MEJORADO PARA MONGODB
  private guardarDatosUsuario(userData: UserData, token: string): void {
    try {
      // Limpiar datos anteriores primero
      this.limpiarSesionAnterior();

      // Guardar token para las peticiones autenticadas
      localStorage.setItem('token', token);
      
      // Información completa del usuario (formato MongoDB)
      localStorage.setItem('userData', JSON.stringify(userData));
      
      // Información de sesión (compatibilidad con sistema actual)
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('rol', userData.rol);
      localStorage.setItem('userType', userData.rol);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('userName', userData.nombre || userData.username);
      localStorage.setItem('userEmail', userData.email || '');
      localStorage.setItem('userId', userData._id);
      
      // Marcar timestamp de la sesión
      localStorage.setItem('sessionTimestamp', Date.now().toString());
      
      console.log('💾 Datos de usuario guardados correctamente:');
      console.log('  - ID:', userData._id);
      console.log('  - Nombre:', userData.nombre);
      console.log('  - Username:', userData.username);
      console.log('  - Email:', userData.email);
      console.log('  - Rol:', userData.rol);
      console.log('  - Es Admin:', userData.rol === 'admin');
      console.log('  - Token guardado:', !!token);
      
    } catch (error) {
      console.error('❌ Error al guardar datos del usuario:', error);
    }
  }

  // Limpiar sesión anterior
  private limpiarSesionAnterior(): void {
    const itemsALimpiar = [
      'token', 'userData', 'isLoggedIn', 'rol', 'userType',
      'currentUser', 'userName', 'userEmail', 'userId', 'sessionTimestamp', 'carrito'
    ];

    itemsALimpiar.forEach(item => {
      localStorage.removeItem(item);
    });
  }

  // Toggle para mostrar/ocultar formulario de registro
  toggleRegistro(): void {
    this.showRegistro = !this.showRegistro;
    this.errorMessage = '';
    if (!this.showRegistro) {
      this.limpiarFormularioRegistro();
    }
  }

  // REGISTRAR NUEVO USUARIO - CORREGIDO PARA MONGODB
  async registrarUsuario(): Promise<void> {
    this.errorMessage = '';
    this.isRegistering = true;

    if (!this.isRegistroFormValid()) {
      this.errorMessage = 'Por favor, completa todos los campos correctamente';
      await this.mostrarToast('Por favor, completa todos los campos correctamente', 'warning');
      this.isRegistering = false;
      return;
    }

    if (this.registroData.password !== this.registroData.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      await this.mostrarToast('Las contraseñas no coinciden', 'warning');
      this.isRegistering = false;
      return;
    }

    if (this.registroData.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      await this.mostrarToast('La contraseña debe tener al menos 6 caracteres', 'warning');
      this.isRegistering = false;
      return;
    }

    try {
      // Preparar datos para el backend (MongoDB)
      const registroDataBackend = {
        username: this.registroData.username.trim(),
        email: this.registroData.email.trim().toLowerCase(),
        password: this.registroData.password,
        nombre: this.registroData.nombre.trim(),
        telefono: this.registroData.telefono?.trim() || '',
        rol: 'user' // Los usuarios registrados son 'user' por defecto
      };

      console.log('📝 Enviando datos de registro:', { ...registroDataBackend, password: '***' });

      // Llamar al backend para registrar
      const response = await this.httpService.registro(registroDataBackend).toPromise() as RegistroResponse;

      if (response && response.success && response.token && response.usuario) {
        console.log('✅ Registro exitoso:', { ...response, token: '***' });
        
        await this.mostrarToast(`¡Usuario ${response.usuario.username} registrado exitosamente! 🎉`, 'success');
        
        // Limpiar formulario y ocultar sección de registro
        this.limpiarFormularioRegistro();
        this.showRegistro = false;
        
        // Procesar datos del usuario recién registrado
        const userData: UserData = {
          _id: response.usuario._id,
          id: response.usuario._id,
          username: response.usuario.username,
          nombre: response.usuario.nombre,
          email: response.usuario.email,
          telefono: response.usuario.telefono || '',
          rol: response.usuario.rol || 'user',
          fechaCreacion: response.usuario.createdAt || new Date().toISOString().split('T')[0]
        };

        // Guardar datos del usuario registrado y hacer auto-login
        this.guardarDatosUsuario(userData, response.token);
        
        console.log(`👤 Usuario registrado y logueado: ${userData.nombre} | Rol: ${userData.rol}`);
        
        // Navegar a home
        await this.router.navigate(['/home']);
        
      } else {
        throw new Error(response?.message || 'Respuesta inválida del servidor');
      }

    } catch (error: any) {
      console.error('❌ Error durante el registro:', error);
      
      // Manejar diferentes tipos de errores
      if (error.status === 409 || error.status === 400) {
        const message = error.error?.message || error.error?.error || 'El usuario o email ya existe';
        this.errorMessage = message;
        await this.mostrarToast(message, 'danger');
      } else if (error.status === 422) {
        this.errorMessage = 'Datos inválidos. Verifica la información ingresada.';
        await this.mostrarToast('Datos inválidos', 'danger');
      } else if (error.status === 0) {
        this.errorMessage = 'No se puede conectar con el servidor';
        await this.mostrarToast('Error de conexión con el servidor', 'danger');
      } else {
        this.errorMessage = error.error?.message || 'Error al registrar usuario. Intenta nuevamente.';
        await this.mostrarToast('Error al registrar usuario', 'danger');
      }
    } finally {
      this.isRegistering = false;
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
      console.error('❌ Error al mostrar toast:', error);
    }
  }

  // MÉTODOS ESTÁTICOS ACTUALIZADOS PARA MONGODB

  // Método para limpiar sesión (útil para logout)
  static limpiarSesion(): void {
    try {
      const itemsALimpiar = [
        'token', 'userData', 'isLoggedIn', 'rol', 'userType',
        'currentUser', 'userName', 'userEmail', 'userId', 'sessionTimestamp', 'carrito'
      ];

      itemsALimpiar.forEach(item => {
        localStorage.removeItem(item);
      });

      console.log('🧹 Sesión limpiada correctamente');
    } catch (error) {
      console.error('❌ Error al limpiar sesión:', error);
    }
  }

  // Método para obtener datos del usuario actual
  static obtenerUsuarioActual(): UserData | null {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const user = JSON.parse(userData);
        console.log('👤 Usuario actual obtenido:', {
          id: user._id,
          nombre: user.nombre,
          rol: user.rol,
          esAdmin: user.rol === 'admin'
        });
        return user;
      }
      return null;
    } catch (error) {
      console.error('❌ Error al obtener usuario actual:', error);
      return null;
    }
  }

  // Método para obtener el token
  static obtenerToken(): string | null {
    const token = localStorage.getItem('token');
    console.log('🔑 Token obtenido:', token ? 'Disponible' : 'No disponible');
    return token;
  }

  // Método para verificar si el usuario está logueado
  static estaLogueado(): boolean {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const hasToken = !!localStorage.getItem('token');
    const hasUserData = !!localStorage.getItem('userData');
    
    const result = isLoggedIn && hasToken && hasUserData;
    console.log('🔍 Verificación de sesión:', {
      isLoggedIn,
      hasToken,
      hasUserData,
      result
    });
    
    return result;
  }

  // Método para obtener el rol del usuario actual
  static obtenerRolUsuario(): 'admin' | 'user' | null {
    try {
      const userData = this.obtenerUsuarioActual();
      if (userData && userData.rol) {
        console.log('👤 Rol obtenido:', userData.rol);
        return userData.rol;
      }
      
      // Fallback al rol en localStorage directo
      const rol = localStorage.getItem('rol');
      return rol === 'admin' || rol === 'user' ? rol as 'admin' | 'user' : null;
    } catch (error) {
      console.error('❌ Error obteniendo rol:', error);
      return null;
    }
  }

  // Método para verificar si es admin - CORREGIDO
  static esAdmin(): boolean {
    try {
      const userData = this.obtenerUsuarioActual();
      if (userData) {
        const isAdmin = userData.rol === 'admin';
        console.log('🔧 Verificación Admin:', {
          usuario: userData.nombre,
          rol: userData.rol,
          esAdmin: isAdmin
        });
        return isAdmin;
      }

      // Fallback
      const rol = localStorage.getItem('rol');
      const isAdmin = rol === 'admin';
      console.log('🔧 Verificación Admin (fallback):', { rol, isAdmin });
      return isAdmin;
    } catch (error) {
      console.error('❌ Error verificando rol de admin:', error);
      return false;
    }
  }

  // Método para verificar si es usuario normal - CORREGIDO
  static esUsuario(): boolean {
    try {
      const userData = this.obtenerUsuarioActual();
      if (userData) {
        const isUser = userData.rol === 'user';
        console.log('👤 Verificación Usuario:', {
          usuario: userData.nombre,
          rol: userData.rol,
          esUsuario: isUser
        });
        return isUser;
      }

      // Fallback
      const rol = localStorage.getItem('rol');
      const isUser = rol === 'user';
      console.log('👤 Verificación Usuario (fallback):', { rol, isUser });
      return isUser;
    } catch (error) {
      console.error('❌ Error verificando rol de usuario:', error);
      return false;
    }
  }

  // Método adicional para debugging
  static debug(): void {
    console.log('🐛 DEBUG - Estado de la sesión:');
    console.log('  - Token:', this.obtenerToken() ? 'Disponible' : 'No disponible');
    console.log('  - Usuario actual:', this.obtenerUsuarioActual());
    console.log('  - Está logueado:', this.estaLogueado());
    console.log('  - Es admin:', this.esAdmin());
    console.log('  - Es usuario:', this.esUsuario());
    console.log('  - Rol:', this.obtenerRolUsuario());
  }

  // Método para validar token (útil para guards)
  static async validarToken(httpService: HttpService): Promise<boolean> {
    try {
      const token = this.obtenerToken();
      if (!token) {
        console.log('🔑 No hay token disponible');
        return false;
      }

      // Aquí podrías hacer una llamada al backend para validar el token
      // const response = await httpService.validateToken().toPromise();
      // return response.valid;

      // Por ahora, verificamos que exista el token y los datos del usuario
      const userData = this.obtenerUsuarioActual();
      const isValid = !!userData && !!userData._id;
      
      console.log('🔍 Validación de token:', {
        hasToken: !!token,
        hasUserData: !!userData,
        isValid
      });

      return isValid;
    } catch (error) {
      console.error('❌ Error validando token:', error);
      return false;
    }
  }
}