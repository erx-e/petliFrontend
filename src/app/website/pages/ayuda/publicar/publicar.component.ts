import { Component, OnInit } from "@angular/core";

@Component({
    selector: "app-publicar",
    template: `<app-publish [stateId]="stateId"></app-publish>`,
    standalone: false
})
export class PublicarComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}

  stateId: string = "H";
}
