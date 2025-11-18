import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-ayuda',
  template: `<app-filter [stateId]="stateId"></app-filter>`,
})
export class AyudaComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  stateId: string = "H"

}
