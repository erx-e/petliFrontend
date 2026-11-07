import { Component, OnInit } from '@angular/core';
import { PetStatus } from "src/app/models/postpet.model";

@Component({
    selector: 'app-adopta',
    template: `<app-filter [status]="status"></app-filter>`,
    standalone: false
})
export class AdoptaComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }
  status: PetStatus = "EnAdopcion";
}
