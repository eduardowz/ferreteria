import { Component } from '@angular/core';
import { RouterModule } from '@angular/router'; // <-- importar RouterModule
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, RouterModule]
})
export class HomePage {
navigateToClientes() {
throw new Error('Method not implemented.');
}
  constructor(private router: Router) {}

  logout() {
    localStorage.removeItem('isLoggedIn');
    this.router.navigate(['/login']);
  }
}