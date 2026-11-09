import { Component, OnInit } from '@angular/core';
import { ReportType } from "src/app/models/report.model";

@Component({
    selector: 'app-ayuda',
    template: `<app-filter [type]="type"></app-filter>`,
    standalone: false
})
export class AyudaComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

  type: ReportType = "Ayuda";
}
