import { Component } from "@angular/core";
import { ReportType } from "src/app/models/report.model";

@Component({
    selector: "app-publicar",
    template: `<app-publish [type]="type"></app-publish>`,
    standalone: false
})
export class PublicarComponent {
  type: ReportType = "Perdida";
}
