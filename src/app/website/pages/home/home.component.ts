import { Component, OnInit } from "@angular/core";
import { postpetView } from "src/app/models/postpet.model";
import { PostpetService } from "src/app/services/postpet.service";

@Component({
    selector: "app-home",
    templateUrl: "./home.component.html",
    styleUrls: ["./home.component.scss"],
    standalone: false
})
export class HomeComponent implements OnInit {
  constructor(private postpetService: PostpetService) {}

  postspetEncuentra: postpetView[] = [null, null, null, null, null];
  postspetDifunde: postpetView[] = [null, null, null, null, null];
  postspetAdopta: postpetView[] = [null, null, null, null, null];
  postspetAyuda: postpetView[] = [null, null, null, null, null];

  ngOnInit(): void {
    // Nombres del enum PetStatus, no los codigos "E"/"B"/"H"/"A": el backend
    // bindea PetStatus y una letra no resuelve a ningun valor, asi que estas
    // cuatro llamadas fallaban y las secciones de la home quedaban vacias.
    this.postpetService
      .getByState("Encontrado", 5, 0)
      .subscribe((data) => (this.postspetEncuentra = data));
    this.postpetService
      .getByState("Buscado", 5, 0)
      .subscribe((data) => (this.postspetDifunde = data));
    this.postpetService
      .getByState("NecesitadoDeAyuda", 5, 0)
      .subscribe((data) => (this.postspetAyuda = data));
    this.postpetService
      .getByState("EnAdopcion", 5, 0)
      .subscribe((data) => (this.postspetAdopta = data));
  }
}
