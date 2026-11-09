import { Component, OnInit } from "@angular/core";
import { ReportType, reportView } from "src/app/models/report.model";
import { ReportService } from "src/app/services/report.service";

@Component({
    selector: "app-home",
    templateUrl: "./home.component.html",
    styleUrls: ["./home.component.scss"],
    standalone: false
})
export class HomeComponent implements OnInit {
  constructor(private reportService: ReportService) {}

  // null = esqueleto de carga en la tarjeta.
  postspetEncuentra: reportView[] = [null, null, null, null, null];
  postspetDifunde: reportView[] = [null, null, null, null, null];
  postspetAdopta: reportView[] = [null, null, null, null, null];
  postspetAyuda: reportView[] = [null, null, null, null, null];

  ngOnInit(): void {
    // getByFilter es el único listado (D5): una llamada por tipo, solo activos
    // (el backend asume status=Activo), los 5 más recientes.
    this.latest("Encontrada", (data) => (this.postspetEncuentra = data));
    this.latest("Perdida", (data) => (this.postspetDifunde = data));
    this.latest("Ayuda", (data) => (this.postspetAyuda = data));
    this.latest("Adopcion", (data) => (this.postspetAdopta = data));
  }

  private latest(type: ReportType, assign: (data: reportView[]) => void) {
    this.reportService.getByFilter({ type }, 5, 0).subscribe(assign);
  }
}
