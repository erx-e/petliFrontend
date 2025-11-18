import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutComponent } from './layout/layout.component';
import { AccountComponent } from './pages/account/account.component';
import { MyPublicationsComponent } from './pages/my-publications/my-publications.component';
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
