import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EncuentraRoutingModule } from './encuentra-routing.module';
import { EncuentraComponent } from './encuentra.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { PublicarComponent } from './publicar/publicar.component';
import { ReactiveFormsModule } from '@angular/forms';
import { EditarComponent } from './editar/editar.component';



@NgModule({
  declarations: [
    EncuentraComponent,
    PublicarComponent,
    EditarComponent
  ],
  imports: [
    CommonModule,
    EncuentraRoutingModule,
    ReactiveFormsModule,
    SharedModule,
  ]
})
export class EncuentraModule { }
