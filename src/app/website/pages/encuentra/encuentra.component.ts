import { Component, OnInit } from "@angular/core";
import { ReportType } from "src/app/models/report.model";

@Component({
    selector: "app-encuentra",
    template: `<app-filter [type]="type"></app-filter>`,
    standalone: false
})
export class EncuentraComponent implements OnInit {
  ngOnInit(): void {}
  type: ReportType = "Encontrada";
}
