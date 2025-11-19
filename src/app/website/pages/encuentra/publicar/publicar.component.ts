import { Component } from "@angular/core";


@Component({
    selector: "app-publicar",
    template: `<app-publish [stateId]="stateId"></app-publish>`,
    standalone: false
})
export class PublicarComponent {
  stateId: string = "E"
}
