import { Component, OnInit } from '@angular/core';
import { PetStatus } from "src/app/models/postpet.model";

@Component({
    selector: 'app-ayuda',
    template: `<app-filter [status]="status"></app-filter>`,
    standalone: false
})
export class AyudaComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  status: PetStatus = "NecesitadoDeAyuda";
}
