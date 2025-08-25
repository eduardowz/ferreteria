// src/app/services/session.service.ts
import { Injectable } from '@angular/core';

export interface UserData {
  _id: string;
  username: string;
  nombre?: string;
  email?: string;
  telefono?: string;
  rol: 'admin' | 'user';
  fechaCreacion?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SessionService {

  constructor() { }

  // Guardar datos del usuario y token
  guardarSesion(userData: UserData, token: string): void {
    try {
      // Limpiar sesión previa
      this.limpiarSesion();

      localStorage.setItem('token', token);
      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('rol', userData.rol);
      localStorage.setItem('userName', userData.nombre || userData.username);
      localStorage.setItem('userId', userData._id);
      localStorage.setItem('sessionTimestamp', Date.now().toString());

      console.log('💾 Sesión guardada:', userData);
    } catch (error) {
      console.error('❌ Error guardando sesión:', error);
    }
  }

  // Obtener datos del usuario actual
  obtenerUsuario(): UserData | null {
    const data = localStorage.getItem('userData');
    return data ? JSON.parse(data) : null;
  }

  // Obtener token
  obtenerToken(): string | null {
    return localStorage.getItem('token');
  }

  // Verificar si hay sesión activa
  estaLogueado(): boolean {
    return localStorage.getItem('isLoggedIn') === 'true' && !!this.obtenerToken() && !!this.obtenerUsuario();
  }

  // Obtener rol
  obtenerRol(): 'admin' | 'user' | null {
    const usuario = this.obtenerUsuario();
    return usuario?.rol || null;
  }

  // Limpiar sesión
  limpiarSesion(): void {
    const items = [
      'token', 'userData', 'isLoggedIn', 'rol', 
      'userName', 'userId', 'sessionTimestamp', 'carrito'
    ];
    items.forEach(item => localStorage.removeItem(item));
    console.log('🧹 Sesión limpiada');
  }
}
