import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProfileRoutingModule } from './profile-routing.module';
import { ProfileComponent } from './profile.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { ReactiveFormsModule } from '@angular/forms';
import { PublicProfileComponent } from './pages/public-profile/public-profile.component';
import { AccountComponent } from './pages/account/account.component';
import { MyPublicationsComponent } from './pages/my-publications/my-publications.component';
import { LayoutComponent } from './layout/layout.component';


@NgModule({
  declarations: [
    ProfileComponent,
    PublicProfileComponent,
    AccountComponent,
    MyPublicationsComponent,
    LayoutComponent,
  ],
  imports: [
    CommonModule,
    ProfileRoutingModule,
    SharedModule,
    ReactiveFormsModule
  ]
})
export class ProfileModule { }
