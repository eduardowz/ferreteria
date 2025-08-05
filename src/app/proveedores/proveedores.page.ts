import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent, IonHeader, IonTitle, IonToolbar,
  IonBackButton, IonButtons, IonInput, IonItem,
  IonList, IonLabel, IonButton, IonIcon, IonCardTitle, IonCardHeader, IonCard, IonCardContent, IonAvatar, IonNote } from '@ionic/angular/standalone';

interface Proveedor {
  id: number;
  nombre: string;
  telefono: string;
  empresa: string;
  correo: string;
  fecha: string;
}

@Component({
  selector: 'app-proveedores',
  templateUrl: './proveedores.page.html',
  styleUrls: ['./proveedores.page.scss'],
  standalone: true,
  imports: [IonNote, IonAvatar, 
    IonCardContent, IonCard, IonCardHeader, IonCardTitle,
    CommonModule, FormsModule, IonContent, IonHeader, IonTitle, IonToolbar,
    IonBackButton, IonButtons, IonInput, IonItem, IonList, IonLabel, IonButton,
  ]
})
export class ProveedoresPage implements OnInit {
  proveedores: Proveedor[] = [];
  mostrarFormulario = false;

  nuevoProveedor: Proveedor = this.crearProveedorVacio();

  ngOnInit() {
    const data = localStorage.getItem('proveedores');
    if (data) {
      this.proveedores = JSON.parse(data);
    }
  }

  crearProveedorVacio(): Proveedor {
    return {
      id: 0,
      nombre: '',
      telefono: '',
      empresa: '',
      correo: '',
      fecha: ''
    };
  }

  guardarProveedor() {
    const p = this.nuevoProveedor;
    if (p.nombre && p.telefono && p.empresa && p.correo && p.fecha) {
      if (p.id === 0) {
        // Nuevo proveedor
        p.id = this.proveedores.length > 0 ? Math.max(...this.proveedores.map(x => x.id)) + 1 : 1;
        this.proveedores.push({ ...p });
      } else {
        // Editar proveedor
        const index = this.proveedores.findIndex(prov => prov.id === p.id);
        if (index > -1) {
          this.proveedores[index] = { ...p };
        }
      }

      this.guardarEnLocalStorage();
      this.resetearFormulario();
      this.mostrarFormulario = false;
    } else {
      alert('Por favor completa todos los campos.');
    }
  }

  editarProveedor(index: number) {
    this.nuevoProveedor = { ...this.proveedores[index] };
    this.mostrarFormulario = true;
  }

  eliminarProveedor(index: number) {
    const confirmado = confirm(`¿Eliminar al proveedor "${this.proveedores[index].nombre}"?`);
    if (confirmado) {
      this.proveedores.splice(index, 1);
      this.guardarEnLocalStorage();
      this.resetearFormulario();
      this.mostrarFormulario = false;
    }
  }

  resetearFormulario() {
    this.nuevoProveedor = this.crearProveedorVacio();
  }

  guardarEnLocalStorage() {
    localStorage.setItem('proveedores', JSON.stringify(this.proveedores));
  }
}
