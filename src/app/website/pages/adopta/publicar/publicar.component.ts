import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-publicar',
  template: `<app-publish [stateId]="stateId"></app-publish>`,
})
export class PublicarComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
  stateId: string = 'A';
}
