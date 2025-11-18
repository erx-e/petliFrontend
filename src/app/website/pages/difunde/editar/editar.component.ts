import { Component } from "@angular/core";

@Component({
  selector: "app-editarDifunde",
  template: `<app-editar [stateId]="stateId"></app-editar>`,
})
export class EditarComponent {
  stateId = "B";
}
