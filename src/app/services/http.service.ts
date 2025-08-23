import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  count?: number;
  total?: number;
  error?: string;
  // Propiedades adicionales para compatibilidad con tu código existente
  token?: string;
  usuario?: any;
}

@Injectable({
  providedIn: 'root'
})
export class HttpService {
  private apiUrl = 'http://localhost:3001/api'; // ✅ Coincide con tu servidor
  private timeoutDuration = 10000; // 10 segundos

  constructor(private http: HttpClient) {
    console.log('🌐 HttpService inicializado con URL:', this.apiUrl);
  }

  // ===== MÉTODOS PARA COMPROBAR CONEXIÓN =====

  comprobarConexion(): Observable<any> {
    console.log('🔗 Comprobando conexión con API...');
    
    return this.http.get<any>(`${this.apiUrl}/health`, {
      headers: this.getHeaders(false)
    }).pipe(
      timeout(5000),
      map(response => {
        console.log('✅ Conexión exitosa:', response);
        return {
          connected: true,
          database: response.database,
          message: response.message
        };
      }),
      catchError(error => {
        console.error('❌ Error en comprobarConexion:', error);
        return of({
          connected: false,
          database: 'Desconectada',
          message: 'Error de conexión'
        });
      })
    );
  }

  // ===== MÉTODOS PARA PRODUCTOS =====

  getProductos(): Observable<ApiResponse<any[]>> {
    console.log('📦 Obteniendo productos desde API...');
    
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/productos`, {
      headers: this.getHeaders(false) // Sin autenticación para lectura
    }).pipe(
      timeout(this.timeoutDuration),
      retry(1),
      map(response => {
        console.log('✅ Respuesta getProductos:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error en getProductos:', error);
        // Retornar respuesta por defecto en caso de error
        return of({
          success: false,
          message: 'Error al obtener productos',
          data: [],
          count: 0
        } as ApiResponse<any[]>);
      })
    );
  }

  createProducto(producto: any): Observable<ApiResponse<any>> {
    console.log('📤 Enviando producto:', producto);
    console.log('🔐 Verificando autenticación antes de enviar...');
    
    // Debug de autenticación
    const estadoAuth = this.verificarEstadoAuth();
    console.log('📋 Estado de autenticación:', estadoAuth);
    
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/productos`, producto, {
      headers: this.getHeaders(true) // Con autenticación para escritura
    }).pipe(
      timeout(this.timeoutDuration),
      map(response => {
        console.log('✅ Respuesta createProducto:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error en createProducto:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  updateProducto(id: string, producto: any): Observable<ApiResponse<any>> {
    console.log('📤 Actualizando producto:', id, producto);
    
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/productos/${id}`, producto, {
      headers: this.getHeaders(true) // Con autenticación para escritura
    }).pipe(
      timeout(this.timeoutDuration),
      map(response => {
        console.log('✅ Respuesta updateProducto:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error en updateProducto:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  deleteProducto(id: string): Observable<ApiResponse<any>> {
    console.log('🗑️ Eliminando producto:', id);
    
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/productos/${id}`, {
      headers: this.getHeaders(true) // Con autenticación para escritura
    }).pipe(
      timeout(this.timeoutDuration),
      map(response => {
        console.log('✅ Respuesta deleteProducto:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error en deleteProducto:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  buscarProductos(termino: string): Observable<ApiResponse<any[]>> {
    console.log('🔍 Buscando productos:', termino);
    
    const encodedTermino = encodeURIComponent(termino);
    
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/productos/buscar?q=${encodedTermino}`, {
      headers: this.getHeaders(false) // Sin autenticación para búsqueda
    }).pipe(
      timeout(this.timeoutDuration),
      retry(1),
      map(response => {
        console.log('✅ Respuesta buscarProductos:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error en buscarProductos:', error);
        return of({
          success: false,
          message: 'Error en la búsqueda',
          data: [],
          count: 0
        } as ApiResponse<any[]>);
      })
    );
  }

  obtenerProductosPorCategoria(categoria: string): Observable<ApiResponse<any[]>> {
    console.log('📂 Obteniendo productos por categoría:', categoria);
    
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/productos/categoria/${categoria}`, {
      headers: this.getHeaders(false) // Sin autenticación para lectura
    }).pipe(
      timeout(this.timeoutDuration),
      retry(1),
      map(response => {
        console.log('✅ Respuesta obtenerProductosPorCategoria:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error en obtenerProductosPorCategoria:', error);
        return of({
          success: false,
          message: 'Error al obtener productos por categoría',
          data: [],
          count: 0
        } as ApiResponse<any[]>);
      })
    );
  }

  // ===== MÉTODOS PARA CLIENTES =====

  getClientes(): Observable<ApiResponse<any[]>> {
    console.log('👥 Obteniendo clientes desde API...');
    
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/clientes`, {
      headers: this.getHeaders(false)
    }).pipe(
      timeout(this.timeoutDuration),
      retry(1),
      map(response => {
        console.log('✅ Respuesta getClientes:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error en getClientes:', error);
        return of({
          success: false,
          message: 'Error al obtener clientes',
          data: [],
          count: 0
        } as ApiResponse<any[]>);
      })
    );
  }

  createCliente(cliente: any): Observable<ApiResponse<any>> {
    console.log('📤 Enviando cliente:', cliente);
    
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/clientes`, cliente, {
      headers: this.getHeaders(true)
    }).pipe(
      timeout(this.timeoutDuration),
      map(response => {
        console.log('✅ Respuesta createCliente:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error en createCliente:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  updateCliente(id: string, cliente: any): Observable<ApiResponse<any>> {
    console.log('📤 Actualizando cliente:', id, cliente);
    
    return this.http.put<ApiResponse<any>>(`${this.apiUrl}/clientes/${id}`, cliente, {
      headers: this.getHeaders(true)
    }).pipe(
      timeout(this.timeoutDuration),
      map(response => {
        console.log('✅ Respuesta updateCliente:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error en updateCliente:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  deleteCliente(id: string): Observable<ApiResponse<any>> {
    console.log('🗑️ Eliminando cliente:', id);
    
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/clientes/${id}`, {
      headers: this.getHeaders(true)
    }).pipe(
      timeout(this.timeoutDuration),
      map(response => {
        console.log('✅ Respuesta deleteCliente:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error en deleteCliente:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  buscarClientes(termino: string): Observable<ApiResponse<any[]>> {
    console.log('🔍 Buscando clientes:', termino);
    
    const encodedTermino = encodeURIComponent(termino);
    
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/clientes?search=${encodedTermino}`, {
      headers: this.getHeaders(false)
    }).pipe(
      timeout(this.timeoutDuration),
      retry(1),
      map(response => {
        console.log('✅ Respuesta buscarClientes:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error en buscarClientes:', error);
        return of({
          success: false,
          message: 'Error en la búsqueda de clientes',
          data: [],
          count: 0
        } as ApiResponse<any[]>);
      })
    );
  }

  // ===== MÉTODOS PARA AUTENTICACIÓN =====

  registro(usuario: any): Observable<ApiResponse<any>> {
    console.log('📝 Registrando usuario...');
    
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/auth/registro`, usuario, {
      headers: this.getHeaders(false)
    }).pipe(
      timeout(this.timeoutDuration),
      map(response => {
        console.log('✅ Respuesta registro:', response);
        
        // Normalizar la respuesta para compatibilidad
        if (response.success && response.data) {
          // Si el token y usuario están en data, los copiamos al nivel superior para compatibilidad
          if (response.data.token) {
            response.token = response.data.token;
          }
          if (response.data.usuario) {
            response.usuario = response.data.usuario;
          }
          
          // Guardar datos de usuario si se registró con auto-login
          if (response.data.token) {
            this.saveUserData({
              token: response.data.token || response.token,
              usuario: response.data.usuario || response.usuario,
              ...response.data
            });
          }
        }
        
        return response;
      }),
      catchError(error => {
        console.error('❌ Error en registro:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  login(credentials: any): Observable<ApiResponse<any>> {
    console.log('🔐 Iniciando sesión...');
    
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/auth/login`, credentials, {
      headers: this.getHeaders(false)
    }).pipe(
      timeout(this.timeoutDuration),
      map(response => {
        console.log('✅ Respuesta completa del login:', response);
        
        // Normalizar la respuesta para compatibilidad
        if (response.success) {
          let tokenToSave = null;
          let usuarioToSave = null;
          
          // Verificar diferentes estructuras de respuesta
          if (response.data) {
            tokenToSave = response.data.token;
            usuarioToSave = response.data.usuario;
          } else {
            // Si el token está directamente en response
            tokenToSave = response.token;
            usuarioToSave = response.usuario;
          }
          
          console.log('🎫 Token extraído:', tokenToSave ? 'Sí' : 'No');
          console.log('👤 Usuario extraído:', usuarioToSave ? 'Sí' : 'No');
          
          if (tokenToSave) {
            // Crear objeto completo para guardar
            const userDataToSave = {
              token: tokenToSave,
              usuario: usuarioToSave,
              ...(usuarioToSave || {}),
              loginTime: new Date().toISOString()
            };
            
            this.saveUserData(userDataToSave);
            
            // Copiar datos al nivel superior para compatibilidad
            response.token = tokenToSave;
            response.usuario = usuarioToSave;
          } else {
            console.error('❌ No se pudo extraer el token de la respuesta del login');
          }
        }
        
        return response;
      }),
      catchError(error => {
        console.error('❌ Error en login:', error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  logout(): Observable<any> {
    console.log('🚪 Cerrando sesión...');
    
    // Limpiar datos locales
    this.clearUserData();
    
    // Opcional: Llamada al servidor para invalidar token
    return this.http.post<ApiResponse<any>>(`${this.apiUrl}/auth/logout`, {}, {
      headers: this.getHeaders(true)
    }).pipe(
      timeout(this.timeoutDuration),
      map(response => {
        console.log('✅ Logout exitoso:', response);
        return response;
      }),
      catchError(error => {
        console.error('❌ Error en logout (ignorado):', error);
        // Retornar éxito aún si hay error en el servidor
        return of({ success: true, message: 'Sesión cerrada localmente' });
      })
    );
  }

  // Verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    return token !== null && token !== 'undefined' && token !== 'null';
  }

  // Obtener datos del usuario actual
  getCurrentUser(): any {
    try {
      const userData = localStorage.getItem('userData');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('❌ Error al obtener datos del usuario:', error);
      return null;
    }
  }

  // NUEVO: Método para verificar el estado de autenticación completo
  verificarEstadoAuth(): { isAuthenticated: boolean, token: string | null, userData: any } {
    const token = this.getAuthToken();
    const userData = this.getCurrentUser();
    
    return {
      isAuthenticated: this.isAuthenticated(),
      token: token,
      userData: userData
    };
  }

  // ===== MÉTODOS DE UTILIDAD =====

  private getHeaders(requireAuth: boolean = false): HttpHeaders {
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });

    if (requireAuth) {
      const token = this.getAuthToken();
      console.log('🔍 Verificando token para autenticación:', token ? 'Token encontrado' : 'Token NO encontrado');
      
      if (token && token !== 'undefined' && token !== 'null') {
        headers = headers.set('Authorization', `Bearer ${token}`);
        console.log('🔐 Header Authorization agregado:', `Bearer ${token.substring(0, 20)}...`);
      } else {
        console.warn('⚠️ Se requiere autenticación pero no se encontró token válido');
        console.warn('📝 Datos en localStorage:', localStorage.getItem('userData'));
      }
    }

    return headers;
  }

  private getAuthToken(): string | null {
    try {
      const userData = localStorage.getItem('userData');
      console.log('📂 userData desde localStorage:', userData);
      
      if (userData && userData !== 'null' && userData !== 'undefined') {
        const user = JSON.parse(userData);
        console.log('👤 Usuario parseado:', user);
        console.log('🎫 Token en usuario:', user.token ? 'Sí existe' : 'No existe');
        
        return user.token || null;
      }
      
      console.warn('⚠️ No hay userData válido en localStorage');
      return null;
    } catch (error) {
      console.error('❌ Error al obtener token:', error);
      return null;
    }
  }

  private saveUserData(userData: any): void {
    try {
      const dataToSave = {
        ...userData,
        savedAt: new Date().toISOString()
      };
      
      localStorage.setItem('userData', JSON.stringify(dataToSave));
      console.log('💾 Datos de usuario guardados exitosamente:', dataToSave);
      
      // Verificación inmediata
      const verificacion = localStorage.getItem('userData');
      console.log('✅ Verificación de guardado:', verificacion ? 'Datos guardados correctamente' : 'ERROR: No se guardaron los datos');
      
    } catch (error) {
      console.error('❌ Error al guardar datos de usuario:', error);
    }
  }

  private clearUserData(): void {
    try {
      localStorage.removeItem('userData');
      console.log('🗑️ Datos de usuario eliminados');
    } catch (error) {
      console.error('❌ Error al eliminar datos de usuario:', error);
    }
  }

  private handleError(error: HttpErrorResponse): any {
    console.error('❌ Error HTTP completo:', error);
    
    let errorMessage = 'Error desconocido';
    let errorDetails = '';
    let statusCode = 0;

    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente o de red
      errorMessage = 'Error de conexión';
      errorDetails = error.error.message;
    } else {
      // Error del lado del servidor
      statusCode = error.status;
      
      switch (statusCode) {
        case 0:
          errorMessage = 'Sin conexión al servidor';
          errorDetails = 'Verifique su conexión a internet o que el servidor esté funcionando';
          break;
        case 400:
          errorMessage = 'Solicitud inválida';
          errorDetails = error.error?.message || 'Los datos enviados no son válidos';
          break;
        case 401:
          errorMessage = 'No autorizado';
          errorDetails = 'Token de acceso inválido o expirado';
          // Limpiar datos de usuario si el token no es válido
          this.clearUserData();
          break;
        case 403:
          errorMessage = 'Acceso prohibido';
          errorDetails = 'No tiene permisos para realizar esta acción';
          break;
        case 404:
          errorMessage = 'Recurso no encontrado';
          errorDetails = 'El elemento solicitado no existe';
          break;
        case 422:
          errorMessage = 'Error de validación';
          errorDetails = error.error?.message || 'Los datos no pasaron la validación';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          errorDetails = 'Error en el servidor, intente nuevamente más tarde';
          break;
        case 503:
          errorMessage = 'Servicio no disponible';
          errorDetails = 'El servidor está temporalmente fuera de servicio';
          break;
        default:
          errorMessage = `Error HTTP ${statusCode}`;
          errorDetails = error.error?.message || error.message || 'Error desconocido del servidor';
      }
    }

    const formattedError = {
      message: errorMessage,
      details: errorDetails,
      status: statusCode,
      timestamp: new Date().toISOString(),
      url: error.url || 'URL desconocida'
    };

    console.error('🔍 Error formateado:', formattedError);
    return formattedError;
  }

  // ===== MÉTODOS ADICIONALES ÚTILES =====

  // Verificar el estado de la API
  checkApiStatus(): Observable<any> {
    return this.comprobarConexion();
  }

  // Método genérico para GET
  get<T>(endpoint: string, requireAuth: boolean = false): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(`${this.apiUrl}/${endpoint}`, {
      headers: this.getHeaders(requireAuth)
    }).pipe(
      timeout(this.timeoutDuration),
      retry(1),
      catchError(error => {
        console.error(`❌ Error en GET /${endpoint}:`, error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // Método genérico para POST
  post<T>(endpoint: string, data: any, requireAuth: boolean = true): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(`${this.apiUrl}/${endpoint}`, data, {
      headers: this.getHeaders(requireAuth)
    }).pipe(
      timeout(this.timeoutDuration),
      catchError(error => {
        console.error(`❌ Error en POST /${endpoint}:`, error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // Método genérico para PUT
  put<T>(endpoint: string, data: any, requireAuth: boolean = true): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(`${this.apiUrl}/${endpoint}`, data, {
      headers: this.getHeaders(requireAuth)
    }).pipe(
      timeout(this.timeoutDuration),
      catchError(error => {
        console.error(`❌ Error en PUT /${endpoint}:`, error);
        return throwError(() => this.handleError(error));
      })
    );
  }

  // Método genérico para DELETE
  delete<T>(endpoint: string, requireAuth: boolean = true): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(`${this.apiUrl}/${endpoint}`, {
      headers: this.getHeaders(requireAuth)
    }).pipe(
      timeout(this.timeoutDuration),
      catchError(error => {
        console.error(`❌ Error en DELETE /${endpoint}:`, error);
        return throwError(() => this.handleError(error));
      })
    );
  }
}