import { Component } from "@angular/core";

@Component({
  selector: "app-publicar",
  template: `<app-publish [stateId]="stateId"></app-publish>`
})
export class PublicarComponent {
  stateId: string = "B"
}
