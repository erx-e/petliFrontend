import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-encuentra",
  template: `<app-filter [stateId]="stateId"></app-filter>`,
})
export class DifundeComponent implements OnInit {
  ngOnInit(): void {}
  stateId = "B"
}
