import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonInput, IonItem, IonLabel, IonImg } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

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

  constructor(private fb: FormBuilder, private router: Router) {

    this.registerForm = this.fb.group({
       username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  ngOnInit() {}

  onRegister() {
    if (this.registerForm.valid) {
      const newUser = {
        username: this.registerForm.value.username,
        email: this.registerForm.value.email,
        password: this.registerForm.value.password,
        role: 'user'
      };
           
      const registrousuario = JSON.parse(localStorage.getItem('registrousuario') || '[]');


      const userExists = registrousuario.some((user: any) => user.username === newUser.username || user.email === newUser.email);
      
      if (userExists) {
        alert('El usuario o correo electrónico ya está registrado');
        return;
      }
      
      // Agregar nuevo usuario
      registrousuario.push(newUser);
      localStorage.setItem('registrousuario', JSON.stringify(registrousuario));
      
      alert('Registro exitoso! Ahora puedes iniciar sesión');
      this.router.navigate(['/login']);
    } else {
      alert('Por favor, complete todos los campos correctamente');
    }
  }

  irLogin() {
    this.router.navigate(['/login']);
  }
}