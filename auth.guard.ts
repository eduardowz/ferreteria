import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SessionService } from '../app/services/session.service';
import { Capacitor } from '@capacitor/core';
import { SecureStoragePlugin } from 'capacitor-secure-storage-plugin';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {

  constructor(
    private router: Router,
    private sessionService: SessionService
  ) {}

  async canActivate(): Promise<boolean> {
    let isLoggedIn = false;

    if (Capacitor.isNativePlatform()) {
      // 📱 Android/iOS: verificar token en SecureStorage
      try {
        const tokenRes = await SecureStoragePlugin.get({ key: 'token' });
        isLoggedIn = !!tokenRes.value;
      } catch {
        isLoggedIn = false;
      }
    } else {
      // 💻 Web: usar SessionService
      isLoggedIn = this.sessionService.estaLogueado();
    }

    if (!isLoggedIn) {
      // Redirigir al login si no hay sesión
      this.router.navigate(['/login']);
      return false;
    }

    return true;
  }
}