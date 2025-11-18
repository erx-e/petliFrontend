import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { NotfoundComponent } from "../not-found/notfound.component";
import { LayoutComponent } from "./components/layout/layout.component";
import { HomeComponent } from "./pages/home/home.component";
import { LandpageComponent } from "./pages/landpage/landpage.component";
import { LoginComponent } from "./pages/login/login.component";
import { PetDetailComponent } from "./pages/pet-detail/pet-detail.component";
import { ProfileComponent } from "./pages/profile/profile.component";
import { RegisterComponent } from "./pages/register/register.component";

const routes: Routes = [
  {
    path: "",
    component: LayoutComponent,
    children: [
      {
        path: "",
        component: LandpageComponent,
        pathMatch: "full",
      },
      {
        path: "home",
        component: HomeComponent,
      },
      {
        path: "profile",
        loadChildren: () =>
          import("./pages/profile/profile.module").then((m) => m.ProfileModule),
      },
      {
        path: "encuentra",
        loadChildren: () =>
          import("./pages/encuentra/encuentra.module").then(
            (m) => m.EncuentraModule
          ),
      },
      {
        path: "difunde",
        loadChildren: () =>
          import("./pages/difunde/difunde.module").then((m) => m.DifundeModule),
      },
      {
        path: "adopta",
        loadChildren: () =>
          import("./pages/adopta/adopta.module").then((m) => m.AdoptaModule),
      },
      {
        path: "ayuda",
        loadChildren: () =>
          import("./pages/ayuda/ayuda.module").then((m) => m.AyudaModule),
      },
      {
        path: "pet/:id",
        component: PetDetailComponent,
      },
    ],
  },
  {
    path: "login",
    component: LoginComponent,
  },
  {
    path: "register",
    component: RegisterComponent,
  },
  {
    path: "**",
    component: NotfoundComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WebsiteRoutingModule {}
