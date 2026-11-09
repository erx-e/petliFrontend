import { Component, OnInit } from '@angular/core';
import { ReportType } from "src/app/models/report.model";

@Component({
    selector: 'app-adopta',
    template: `<app-filter [type]="type"></app-filter>`,
    standalone: false
})
export class AdoptaComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }
  type: ReportType = "Adopcion";
}
