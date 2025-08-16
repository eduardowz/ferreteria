import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonInput, IonItem, IonLabel, IonImg } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';

interface UserRegistro {
  id: string;
  username: string;
  email: string;
  password: string;
  nombre: string;
  telefono?: string;
  role: 'admin' | 'user';
  rol: 'admin' | 'usuario';
  fechaCreacion: string;
}

@Component({
  selector: 'app-registro',
  templateUrl: './registro.page.html',
  styleUrls: ['./registro.page.scss'],
  standalone: true,
  imports: [IonImg, 
    IonContent, IonHeader, IonTitle, IonToolbar,
    IonButton, IonInput, IonItem, IonLabel,
    CommonModule, FormsModule, ReactiveFormsModule, 
  ]
})
export class RegistroPage implements OnInit {

  registerForm: FormGroup;
  showPassword: boolean = false;

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private toastController: ToastController
  ) {
    this.registerForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: ['', [Validators.pattern(/^[0-9]{10}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validator: this.passwordMatchValidator });
  }

  ngOnInit() {}

  // Validador personalizado para confirmar contraseñas
  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  // Alternar visibilidad de contraseña
  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  // Método principal de registro mejorado y conectado
  async onRegister() {
    if (!this.registerForm.valid) {
      await this.mostrarToast('Por favor, completa todos los campos correctamente', 'warning');
      this.marcarErrores();
      return;
    }

    try {
      const formData = this.registerForm.value;
      
      // Verificar si el usuario ya existe
      if (this.verificarUsuarioExiste(formData.username, formData.email)) {
        await this.mostrarToast('El usuario o correo electrónico ya está registrado', 'danger');
        return;
      }

      // Crear nuevo usuario con estructura consistente
      const nuevoUsuario = this.crearNuevoUsuario(formData);
      
      // Guardar usuario
      if (this.guardarUsuario(nuevoUsuario)) {
        await this.mostrarToast(`¡Usuario ${nuevoUsuario.username} registrado exitosamente!`, 'success');
        
        // Auto-login opcional (comentado por seguridad)
        // await this.autoLogin(nuevoUsuario);
        
        // Redirigir al login
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      } else {
        await this.mostrarToast('Error al registrar usuario. Intenta nuevamente.', 'danger');
      }
    } catch (error) {
      console.error('Error durante el registro:', error);
      await this.mostrarToast('Error interno del sistema', 'danger');
    }
  }

  // Verificar si usuario ya existe
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

  // Crear objeto de usuario con estructura consistente
  private crearNuevoUsuario(formData: any): UserRegistro {
    const usuariosExistentes = JSON.parse(localStorage.getItem('registrousuario') || '[]');
    
    return {
      id: (usuariosExistentes.length + 1).toString(),
      username: formData.username.trim(),
      password: formData.password,
      nombre: formData.nombre.trim(),
      email: formData.email.trim().toLowerCase(),
      telefono: formData.telefono?.trim() || '',
      role: 'user',
      rol: 'usuario', // Consistencia para el sistema de clientes
      fechaCreacion: new Date().toISOString().split('T')[0]
    };
  }

  // Guardar usuario en localStorage
  private guardarUsuario(usuario: UserRegistro): boolean {
    try {
      const usuariosRegistrados = JSON.parse(localStorage.getItem('registrousuario') || '[]');
      usuariosRegistrados.push(usuario);
      localStorage.setItem('registrousuario', JSON.stringify(usuariosRegistrados));
      
      console.log('Usuario registrado:', usuario);
      return true;
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      return false;
    }
  }

  // Auto-login después del registro (opcional)
  private async autoLogin(usuario: UserRegistro) {
    try {
      const userData = {
        id: usuario.id,
        username: usuario.username,
        role: usuario.role,
        rol: usuario.rol,
        nombre: usuario.nombre,
        email: usuario.email,
        telefono: usuario.telefono,
        fechaCreacion: usuario.fechaCreacion
      };

      // Guardar datos de sesión
      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('role', userData.role);
      localStorage.setItem('rol', userData.rol);
      localStorage.setItem('userType', userData.role);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('userName', userData.nombre);
      localStorage.setItem('userEmail', userData.email);

      await this.mostrarToast(`¡Bienvenido ${userData.nombre}!`, 'success');
      
      // Redirigir a home
      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 1000);

    } catch (error) {
      console.error('Error en auto-login:', error);
      // Si falla el auto-login, redirigir al login normal
      this.router.navigate(['/login']);
    }
  }

  // Marcar errores en el formulario
  private marcarErrores() {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      if (control && control.invalid) {
        control.markAsTouched();
      }
    });
  }

  // Obtener mensaje de error para un campo
  getErrorMessage(field: string): string {
    const control = this.registerForm.get(field);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) {
        return `${this.getFieldName(field)} es requerido`;
      }
      if (control.errors['email']) {
        return 'Email no válido';
      }
      if (control.errors['minlength']) {
        return `${this.getFieldName(field)} debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`;
      }
      if (control.errors['pattern']) {
        return 'Teléfono debe tener 10 dígitos';
      }
      if (field === 'confirmPassword' && this.registerForm.errors?.['passwordMismatch']) {
        return 'Las contraseñas no coinciden';
      }
    }
    return '';
  }

  // Obtener nombre amigable del campo
  private getFieldName(field: string): string {
    const fieldNames: { [key: string]: string } = {
      nombre: 'Nombre',
      username: 'Usuario',
      email: 'Email',
      telefono: 'Teléfono',
      password: 'Contraseña',
      confirmPassword: 'Confirmar Contraseña'
    };
    return fieldNames[field] || field;
  }

  // Verificar si un campo tiene errores
  hasError(field: string): boolean {
    const control = this.registerForm.get(field);
    return !!(control && control.invalid && control.touched);
  }

  // Navegar al login
  irLogin() {
    this.router.navigate(['/login']);
  }

  // Limpiar formulario
  limpiarFormulario() {
    this.registerForm.reset();
    this.showPassword = false;
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

  // MÉTODOS UTILITARIOS PARA CONECTAR CON EL SISTEMA

  // Obtener todos los usuarios registrados (para uso en clientes)
  static obtenerUsuariosRegistrados(): UserRegistro[] {
    try {
      return JSON.parse(localStorage.getItem('registrousuario') || '[]');
    } catch (error) {
      console.error('Error al obtener usuarios registrados:', error);
      return [];
    }
  }

  // Sincronizar con sistema de clientes
  static sincronizarConSistemaClientes(): void {
    try {
      const usuarios = RegistroPage.obtenerUsuariosRegistrados();
      
      // Actualizar datos para el sistema de clientes si es necesario
      console.log(`${usuarios.length} usuarios sincronizados con sistema de clientes`);
      
      // Disparar evento personalizado para notificar actualización
      window.dispatchEvent(new CustomEvent('usuariosActualizados', {
        detail: { usuarios }
      }));
    } catch (error) {
      console.error('Error al sincronizar con sistema de clientes:', error);
    }
  }

  // Método para validar datos antes de migrar a sistema de clientes
  static validarIntegridadDatos(): boolean {
    try {
      const usuarios = RegistroPage.obtenerUsuariosRegistrados();
      
      // Verificar que todos los usuarios tengan los campos necesarios
      for (const usuario of usuarios) {
        if (!usuario.id || !usuario.username || !usuario.email || 
            !usuario.role || !usuario.rol || !usuario.fechaCreacion) {
          console.warn('Usuario con datos incompletos:', usuario);
          return false;
        }
      }
      
      console.log('Integridad de datos verificada correctamente');
      return true;
    } catch (error) {
      console.error('Error al validar integridad de datos:', error);
      return false;
    }
  }
}