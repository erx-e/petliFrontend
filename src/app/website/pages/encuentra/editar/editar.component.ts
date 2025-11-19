import { Component } from "@angular/core";

@Component({
    selector: "app-editarEncuentra",
    template: ` <app-editar [stateId]="stateId"></app-editar>`,
    standalone: false
})
export class EditarComponent {
  stateId = "E";
}
