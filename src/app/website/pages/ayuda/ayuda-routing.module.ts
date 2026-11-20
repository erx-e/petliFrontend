import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AyudaComponent } from './ayuda.component';
import { EditarComponent } from './editar/editar.component';
import { PublicarComponent } from './publicar/publicar.component';

const routes: Routes = [
  {
    path: "",
    component: AyudaComponent,
  },
  {
    path: "publicar",
    component: PublicarComponent,
  },
  {
    path: "editar/:id",
    component: EditarComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AyudaRoutingModule { }
