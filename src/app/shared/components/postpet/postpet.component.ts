import { Component, OnInit, Input } from "@angular/core";
import {
  REPORT_TYPE_LABELS,
  RESOLVED_LABELS,
  reportView,
  requiresLastSeen,
} from "src/app/models/report.model";
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

  // Tarjeta de un reporte (el nombre del componente viene de v1).
  @Input() postpet: reportView | null;
  @Input() home: boolean = false;
  lastTimeSeen: string = null;

  // Marca cuando el <img> de la card falla (típicamente 403 de S3 por objeto
  // borrado del bucket). Una card solo muestra una imagen, así que basta un
  // booleano; no necesitamos un Set como en el detalle.
  imgFailed = false;

  readonly requiresLastSeen = requiresLastSeen;

  ngOnInit(): void {
    if (this.postpet?.lastTimeSeen) {
      this.lastTimeSeen = formatDistance(
        new Date(this.postpet.lastTimeSeen),
        new Date(),
        { addSuffix: true, locale: es }
      );
    }
  }

  onImgError() {
    this.imgFailed = true;
  }

  // Etiqueta del badge: el tipo, o cómo terminó si ya está resuelto. El backend
  // manda los enums por nombre; el texto lo pone la UI.
  get stateLabel(): string {
    const report = this.postpet;
    if (!report) return "";
    return report.status === "Resuelto"
      ? RESOLVED_LABELS[report.type] ?? ""
      : REPORT_TYPE_LABELS[report.type] ?? "";
  }

  // Clase del badge: state--<ReportType>, o state--Resuelto.
  get stateClass(): string {
    const report = this.postpet;
    if (!report) return "";
    return "stateBadge state--" + (report.status === "Resuelto" ? "Resuelto" : report.type);
  }
}
