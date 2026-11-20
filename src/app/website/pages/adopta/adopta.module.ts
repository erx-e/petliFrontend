import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdoptaRoutingModule } from './adopta-routing.module';
import { AdoptaComponent } from './adopta.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { PublicarComponent } from './publicar/publicar.component';
import { EditarComponent } from './editar/editar.component';


@NgModule({
  declarations: [
    AdoptaComponent,
    PublicarComponent,
    EditarComponent
  ],
  imports: [
    CommonModule,
    AdoptaRoutingModule,
    SharedModule
  ]
})
export class AdoptaModule { }
