import { Component, OnInit } from '@angular/core';
import { PetStatus } from "src/app/models/postpet.model";

@Component({
    selector: 'app-publicar',
    template: `<app-publish [status]="status"></app-publish>`,
    standalone: false
})
export class PublicarComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
  status: PetStatus = "EnAdopcion";
}
