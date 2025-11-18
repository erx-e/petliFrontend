import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { NoScrollService } from './services/no-scroll.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  title = "Pet's Lighthouse";

  constructor(
    private authService: AuthService,
    @Inject(DOCUMENT) private document: Document,
    private noScrollService: NoScrollService
  ) {}
  ngOnInit(): void {
    this.authService.getCurrentUser();
    this.noScrollService.noScroll$.subscribe((rta: Boolean | null) => {
      const body = this.document.body;
      if (rta) {
        body.classList.add('noScroll');
        return;
      }
      body.classList.remove('noScroll');
      return;
    });
  }
}
