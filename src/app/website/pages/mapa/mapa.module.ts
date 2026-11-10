import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MapaRoutingModule } from './mapa-routing.module';
import { MapaComponent } from './mapa.component';

// Módulo lazy: la página del mapa (y Leaflet, que se carga aparte) solo se
// descargan al entrar a /mapa.
@NgModule({
  declarations: [MapaComponent],
  imports: [CommonModule, MapaRoutingModule],
})
export class MapaModule {}
