import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { WebsiteRoutingModule } from './website-routing.module';
import { LayoutComponent } from './components/layout/layout.component';
import { NavComponent } from './components/nav/nav.component';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { PetDetailComponent } from './pages/pet-detail/pet-detail.component';
import { LandpageComponent } from './pages/landpage/landpage.component';
import { SharedModule } from '../shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { EncuentraModule } from './pages/encuentra/encuentra.module'
import { QuicklinkModule } from 'ngx-quicklink'
import { DifundeModule } from './pages/difunde/difunde.module'
@NgModule({
  declarations: [
    LayoutComponent,
    NavComponent,
    HomeComponent,
    LoginComponent,
    RegisterComponent,
    PetDetailComponent,
    LandpageComponent,
  ],
  imports: [
    CommonModule,
    WebsiteRoutingModule,
    SharedModule,
    ReactiveFormsModule,
    EncuentraModule,
    DifundeModule,
  ],
  exports: [
    LayoutComponent
  ]
})
export class WebsiteModule { }
