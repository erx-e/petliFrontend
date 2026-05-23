import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostpetComponent } from './components/postpet/postpet.component';
import { FilterComponent } from './components/filter/filter.component';
import { PostspetComponent } from './components/postspet/postspet.component';
import { ImageComponent } from './components/image/image.component';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { NotfoundComponent } from '../not-found/notfound.component';
import { DropzoneDirective } from './directives/dropzone.directive';
import { PublishComponent } from './components/publicar/publish.component';
import { UploaderComponent } from './components/uploader/uploader.component';
import { UploadTaskComponent } from './components/uploader/upload-task/upload-task.component';
import { EditarComponent } from './components/publicar/editar/editar.component';



@NgModule({
  declarations: [
    PostpetComponent,
    PostspetComponent,
    ImageComponent,
    FilterComponent,
    SpinnerComponent,
    NotfoundComponent,
    DropzoneDirective,
    PublishComponent,
    UploaderComponent,
    UploadTaskComponent,
    EditarComponent
  ],
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
  ],
  exports: [
    PostpetComponent,
    PostspetComponent,
    ImageComponent,
    FilterComponent,
    SpinnerComponent,
    NotfoundComponent,
    DropzoneDirective,
    PublishComponent,
    EditarComponent
  ]
})
export class SharedModule { }
