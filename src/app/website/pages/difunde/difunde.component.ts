import { Component, OnInit } from "@angular/core";

@Component({
    selector: "app-encuentra",
    template: `<app-filter [stateId]="stateId"></app-filter>`,
    standalone: false
})
export class DifundeComponent implements OnInit {
  ngOnInit(): void {}
  stateId = "B"
}
