import { Component, OnInit, Input } from "@angular/core";
import { postpetView } from "src/app/models/postpet.model";
import { formatDistance, subDays } from "date-fns";
import es from "date-fns/locale/es";
import { RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";
import { SpinnerComponent } from "../spinner/spinner.component";
import { SharedModule } from "../../shared.module";

@Component({
    selector: "app-postpet",
    templateUrl: "./postpet.component.html",
    styleUrls: ["./postpet.component.scss"],
    standalone: false,
})
export class PostpetComponent implements OnInit {
  constructor() {}

  @Input() postpet: postpetView | null;
  @Input() home: boolean = false;
  lastTimeSeen: string = null;

  ngOnInit(): void {
    if (this.postpet) {
      this.lastTimeSeen = formatDistance(
        new Date(this.postpet.lastTimeSeen),
        new Date(),
        { addSuffix: true, locale: es }
      );
    }
  }

  // Etiqueta del estado del post, para el badge de la tarjeta.
  get stateLabel(): string {
    switch (this.postpet?.petStateId) {
      case "B":
        return "Perdido";
      case "E":
        return "Encontrado";
      case "A":
        return "En adopción";
      case "H":
        return "Necesita ayuda";
      default:
        return "";
    }
  }
}
