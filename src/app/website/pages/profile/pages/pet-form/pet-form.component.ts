import { Component, OnInit } from "@angular/core";
import { UntypedFormBuilder, UntypedFormGroup, Validators } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import {
  ageFromBirthDate,
  birthDateFromAge,
  imgView,
  PetCardDTO,
  PetSex,
  petView,
} from "src/app/models/report.model";
import { PetService } from "src/app/services/pet.service";

/**
 * Registrar una mascota sin reportarla (`profile/pets/new`) o editar su ficha
 * (`profile/pets/edit/:id`). Un solo componente: la ruta decide el modo.
 * La ficha es privada (ADR-16). Al editar, la mascota se busca en GET /pet/mine
 * (no hay endpoint por id: la lista ya trae todo lo del dueño).
 */
@Component({
  selector: "app-pet-form",
  templateUrl: "./pet-form.component.html",
  styleUrls: ["./pet-form.component.scss"],
  standalone: false,
})
export class PetFormComponent implements OnInit {
  constructor(
    private fb: UntypedFormBuilder,
    private petService: PetService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      petName: [null, [Validators.required, Validators.minLength(2), Validators.maxLength(12),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚÑñ ]*$/)]],
      idPetSpecie: ["", Validators.required],
      idPetBreed: [{ value: "", disabled: true }],
      sex: ["Unknown" as PetSex],
      ageYears: [null, [Validators.min(0), Validators.max(30)]],
      ageMonths: [null, [Validators.min(0), Validators.max(11)]],
      petSpecialCondition: [null, Validators.maxLength(200)],
      idProvincia: ["", Validators.required],
      idCanton: [{ value: "", disabled: true }, Validators.required],
      idSector: [""],
    });
  }

  form: UntypedFormGroup;
  petId: number | null = null;
  pet: petView | null = null;
  notFound = false;

  // Fotos de la ficha: lista completa de nombres; la primera es la principal.
  initialImages: imgView[] = [];
  imageKeys: string[] = [];
  maxFourFiles = false;

  submitted = false;
  isLoading = false;
  published = false;
  submitError: string | null = null;

  // Edad precargada: si no se toca, se reenvía la fecha original (la
  // conversión edad -> fecha pierde el día).
  private initialAge: { years: number; months: number } | null = null;

  get editing(): boolean {
    return this.petId !== null;
  }

  get photosMissing(): boolean {
    return this.imageKeys.length === 0;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get("id");
    if (!id) return;
    this.petId = Number(id);
    this.petService.getMine().subscribe({
      next: (pets) => {
        this.pet = (pets ?? []).find((p) => p.id === this.petId) ?? null;
        if (this.pet) this.prefill(this.pet);
        else this.notFound = true;
      },
      error: () => (this.notFound = true),
    });
  }

  private prefill(pet: petView) {
    this.initialAge = ageFromBirthDate(pet.birthDate);
    this.form.patchValue({
      petName: pet.petName,
      // Los radios de especie tienen value string.
      idPetSpecie: String(pet.idPetSpecie),
      idPetBreed: pet.idPetBreed ?? "",
      sex: pet.sex,
      ageYears: this.initialAge?.years ?? null,
      ageMonths: this.initialAge?.months ?? null,
      petSpecialCondition: pet.petSpecialCondition,
      idProvincia: pet.idProvincia,
      idCanton: pet.idCanton,
      idSector: pet.idSector ?? "",
    });
    this.initialImages = pet.urlImgs;
    this.imageKeys = pet.urlImgs.map((img) => img.key);
  }

  onKeys(keys: string[]) {
    this.imageKeys = keys;
  }

  onLimit(reached: boolean) {
    this.maxFourFiles = reached;
  }

  submit() {
    this.submitError = null;
    this.submitted = true;
    this.form.markAllAsTouched();
    if (this.form.invalid || this.photosMissing) return;

    this.isLoading = true;
    // Antes de navegar: las subidas ya quedan vinculadas, no hay que descartarlas.
    this.published = true;
    const request = this.editing ? this.petService.update(this.buildDto()) : this.petService.create(this.buildDto());
    request.subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(["/profile/pets"]);
      },
      error: (err) => {
        this.isLoading = false;
        this.published = false;
        this.submitError = typeof err === "string" ? err : "No pudimos guardar la mascota. Inténtalo de nuevo.";
      },
    });
  }

  // PUT /pet/update reemplaza la ficha: se manda completa.
  private buildDto(): PetCardDTO {
    const v = this.form.getRawValue();
    const ageUnchanged =
      this.editing &&
      (this.initialAge?.years ?? null) === (v.ageYears ?? null) &&
      (this.initialAge?.months ?? null) === (v.ageMonths ?? null);
    return {
      ...(this.editing ? { idPet: this.petId! } : {}),
      petName: v.petName,
      idPetSpecie: Number(v.idPetSpecie),
      idPetBreed: v.idPetBreed ? Number(v.idPetBreed) : null,
      sex: v.sex ?? "Unknown",
      birthDate: ageUnchanged ? this.pet!.birthDate : birthDateFromAge(v.ageYears, v.ageMonths),
      petSpecialCondition: v.petSpecialCondition || null,
      idCanton: Number(v.idCanton),
      idSector: v.idSector ? Number(v.idSector) : null,
      imageKeys: this.imageKeys,
    };
  }
}
