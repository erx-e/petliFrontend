import { Component, OnInit } from "@angular/core";
import { ageLabel, PET_SEX_LABELS, petView } from "src/app/models/report.model";
import { PetService } from "src/app/services/pet.service";

/** Perfil → "Mis mascotas": las fichas del usuario. Privado (ADR-16): una
 *  mascota sin reporte solo la ve su dueño. */
@Component({
  selector: "app-my-pets",
  templateUrl: "./my-pets.component.html",
  styleUrls: ["./my-pets.component.scss"],
  standalone: false,
})
export class MyPetsComponent implements OnInit {
  constructor(private petService: PetService) {}

  pets: petView[] = [];
  loading = true;
  error = false;

  readonly sexLabels = PET_SEX_LABELS;
  readonly ageLabel = ageLabel;

  ngOnInit(): void {
    this.petService.getMine().subscribe({
      next: (pets) => {
        this.pets = pets ?? [];
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }
}
