export interface Environment {
  production: boolean;
  apiUrl: string;
}

export const environment: Environment = {
  production: true,
  apiUrl: 'http://192.168.100.139:3001/api'  // IP del equipo local
  // o si subes a nube:
  // apiUrl: 'https://miapp-backend.com/api'
};
