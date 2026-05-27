import { Component } from '@angular/core';
import { CepConsultaComponent } from './components/cep-consulta/cep-consulta.component';

@Component({
  selector: 'app-root',
  imports: [CepConsultaComponent],
  template: '<app-cep-consulta />',
  styleUrl: './app.css',
})
export class App {}
