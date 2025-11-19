import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-adopta',
    template: `<app-filter [stateId]="stateId"></app-filter>`,
    standalone: false
})
export class AdoptaComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }
  stateId: string = "A"
}
