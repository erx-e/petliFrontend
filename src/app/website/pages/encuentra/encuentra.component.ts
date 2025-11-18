import { Component, OnInit } from "@angular/core";

@Component({
  selector: "app-encuentra",
  template: `<app-filter [stateId]="stateId"></app-filter>`,
})
export class EncuentraComponent implements OnInit {
  ngOnInit(): void {}
  stateId = "E";
}
