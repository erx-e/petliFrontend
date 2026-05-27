import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { register as registerSwiperElements } from 'swiper/element/bundle';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

// Registra los custom elements de Swiper (<swiper-container>/<swiper-slide>)
// una sola vez para toda la app.
registerSwiperElements();

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
