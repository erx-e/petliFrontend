import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { UntypedFormGroup } from "@angular/forms";
import { of, Subscription } from "rxjs";
import { distinctUntilChanged, startWith, switchMap } from "rxjs/operators";
import { breed, specie } from "src/app/models/category.model";
import { CategoryService } from "src/app/services/category.service";

/**
 * Datos del animal de una ficha: nombre, especie, raza (opcional), sexo y edad
 * aproximada (años + meses; quien la usa la convierte a fecha con
 * birthDateFromAge). Trabaja sobre el FormGroup del padre, que debe tener los
 * controles petName, idPetSpecie, idPetBreed, sex, ageYears y ageMonths.
 *
 * Hoy la usa el formulario de mascota. Los formularios de reporte todavía
 * tienen su propia copia (PLAN_FOTOS F19: migrarlos es otro cambio).
 */
@Component({
  selector: "app-animal-fields",
  templateUrl: "./animal-fields.component.html",
  styleUrls: ["./pet-fields.scss"],
  standalone: false,
})
export class AnimalFieldsComponent implements OnInit, OnDestroy {
  @Input({ required: true }) group!: UntypedFormGroup;
  /** Prefijo de los id de los controles (únicos en la página). */
  @Input() idPrefix = "animal";

  species: specie[] = [];
  breeds: breed[] = [];
  private subs = new Subscription();

  constructor(private categories: CategoryService) {}

  ngOnInit(): void {
    this.categories.getSpecies().subscribe((s) => (this.species = s ?? []));

    const specieCtrl = this.group.get("idPetSpecie")!;
    const breedCtrl = this.group.get("idPetBreed")!;
    // Las razas dependen de la especie; sin especie, la raza se deshabilita.
    this.subs.add(
      specieCtrl.valueChanges
        .pipe(
          startWith(specieCtrl.value),
          distinctUntilChanged(),
          switchMap((id) => (id ? this.categories.getBreedsBySpecie(Number(id)) : of([] as breed[])))
        )
        .subscribe((b) => {
          this.breeds = b ?? [];
          if (specieCtrl.value) breedCtrl.enable({ emitEvent: false });
          else breedCtrl.disable({ emitEvent: false });
        })
    );
  }

  // Cambiar la especie a mano invalida la raza elegida (era de otra especie).
  onSpecieChange() {
    this.group.get("idPetBreed")!.setValue("");
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  invalid(name: string): boolean {
    const c = this.group.get(name)!;
    return c.touched && c.invalid;
  }
}
