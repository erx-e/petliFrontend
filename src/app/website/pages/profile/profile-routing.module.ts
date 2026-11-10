import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { AccountComponent } from './pages/account/account.component';
import { MyPublicationsComponent } from './pages/my-publications/my-publications.component';
import { MyPetsComponent } from './pages/my-pets/my-pets.component';
import { PetFormComponent } from './pages/pet-form/pet-form.component';
import { PublicProfileComponent } from './pages/public-profile/public-profile.component';
import { ProfileComponent } from './profile.component';

const routes: Routes = [
  {
    path: "",
    component: LayoutComponent,
    children:[
      {
        path: "",
        redirectTo: "public",
        pathMatch: "full"
      },
      {
        path: "public",
        component: PublicProfileComponent
      },
      {
        path: "account",
        component: AccountComponent
      },
      {
        path: "publications",
        component: MyPublicationsComponent
      },
      // Mis mascotas (privado, ADR-16): lista, registrar y editar la ficha.
      {
        path: "pets",
        component: MyPetsComponent
      },
      {
        path: "pets/new",
        component: PetFormComponent
      },
      {
        path: "pets/edit/:id",
        component: PetFormComponent
      },
    ]
  },
  {
    path: ":id",
    component: ProfileComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfileRoutingModule { }
