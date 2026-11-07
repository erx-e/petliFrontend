import { Component } from "@angular/core";
import { PetStatus } from "src/app/models/postpet.model";

@Component({
    selector: "app-publicar",
    template: `<app-publish [status]="status"></app-publish>`,
    standalone: false
})
export class PublicarComponent {
  status: PetStatus = "Buscado";
}
