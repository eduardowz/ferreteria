import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonList, IonButton,
  IonLabel, IonInput, IonBackButton, IonButtons, IonIcon, IonCardContent, IonCardHeader,
  IonCard, IonCardTitle, IonNote, IonAvatar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-clientes',
  templateUrl: './clientes.page.html',
  styleUrls: ['./clientes.page.scss'],
  standalone: true,
  imports: [IonAvatar, IonNote, 
    IonCardTitle, IonCard, IonCardHeader, IonCardContent, IonButtons,
    IonBackButton, IonLabel, IonButton, IonList, IonItem, IonContent, IonHeader,
    IonTitle, IonToolbar, IonInput, CommonModule, FormsModule
  ]
})
export class ClientesPage implements OnInit {
  nombre = '';
  telefono = '';
  correo = '';
  fecha = '';

  clientes: any[] = [];
  clienteEditandoIndex: number | null = null;
  mostrarFormulario = false;

  ngOnInit() {
    const data = localStorage.getItem('clientes');
    if (data) {
      this.clientes = JSON.parse(data);
    } else {
      this.clientes = [
        {
          nombre: 'Juan Pérez',
          telefono: '555-1234',
          correo: 'juan@mail.com',
          fecha: '2025-07-01'
        },
        {
          nombre: 'Maria López',
          telefono: '555-5678',
          correo: 'maria@mail.com',
          fecha: '2025-07-02'
        }
      ];
      this.guardarEnLocalStorage();
    }
  }

  agregar() {
    if (this.nombre && this.telefono && this.correo && this.fecha) {
      const cliente = {
        nombre: this.nombre,
        telefono: this.telefono,
        correo: this.correo,
        fecha: this.fecha
      };

      if (this.clienteEditandoIndex !== null) {
        // Editar cliente existente
        this.clientes[this.clienteEditandoIndex] = cliente;
        this.clienteEditandoIndex = null;
      } else {
        // Agregar nuevo cliente
        this.clientes.push(cliente);
      }

      this.guardarEnLocalStorage();
      this.resetearFormulario();
    } else {
      alert('Por favor completa todos los campos');
    }
  }

  editarCliente(index: number) {
    const c = this.clientes[index];
    this.nombre = c.nombre;
    this.telefono = c.telefono;
    this.correo = c.correo;
    this.fecha = c.fecha;
    this.clienteEditandoIndex = index;
  }

  resetearFormulario() {
    this.nombre = '';
    this.telefono = '';
    this.correo = '';
    this.fecha = '';
    this.clienteEditandoIndex = null;
  }
  eliminarCliente(index: number) {
  const confirmado = confirm(`¿Eliminar al cliente "${this.clientes[index].nombre}"?`);
  if (confirmado) {
    this.clientes.splice(index, 1);
    this.guardarEnLocalStorage();
    this.resetearFormulario();
  }
}


  guardarEnLocalStorage() {
    localStorage.setItem('clientes', JSON.stringify(this.clientes));
  }
}
