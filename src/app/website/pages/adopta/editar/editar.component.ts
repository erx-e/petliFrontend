import { Component } from "@angular/core";

@Component({
  selector: "app-editarAdopta",
  template: ` <app-editar [stateId]="stateId"></app-editar>`,
})
export class EditarComponent {
  stateId = "A";
}
