import { Component } from "@angular/core";
import { PetStatus } from "src/app/models/postpet.model";

@Component({
    selector: "app-editarAyuda",
    template: ` <app-editar [status]="status"></app-editar>`,
    standalone: false
})
export class EditarComponent {
  status: PetStatus = "NecesitadoDeAyuda";
}
