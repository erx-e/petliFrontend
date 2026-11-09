import { Component } from "@angular/core";
import { ReportType } from "src/app/models/report.model";

@Component({
    selector: "app-editarDifunde",
    template: `<app-editar [type]="type"></app-editar>`,
    standalone: false
})
export class EditarComponent {
  type: ReportType = "Perdida";
}
