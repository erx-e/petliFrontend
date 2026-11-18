import { Component, Input, OnInit } from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import {
  birthDateFromAge,
  CreateReportDTO,
  imgView,
  locationHint,
  petView,
  PetSex,
  ReportType,
  requiresLastSeen,
} from 'src/app/models/report.model';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { CategoryService } from 'src/app/services/category.service';
import {
  breed,
  canton,
  provincia,
  sector,
  specie,
} from '../../../models/category.model';
import { switchMap } from 'rxjs/operators';
import { ReportService } from 'src/app/services/report.service';
import { PetService } from 'src/app/services/pet.service';
import { AuthService } from 'src/app/services/auth.service';
import { UserView } from 'src/app/models/user.model';
import { MyValidators } from 'src/app/validators/validators';
import { Observable, of } from 'rxjs';
import { GeoPoint } from '../../map/leaflet';

@Component({
    selector: 'app-publish',
    templateUrl: './pet-form.component.html',
    styleUrls: ['./pet-form.component.scss'],
    standalone: false
})
export class PublishComponent implements OnInit {
  constructor(
    private formBuilder: UntypedFormBuilder,
    private categoryService: CategoryService,
    private reportService: ReportService,
    private petService: PetService,
    private location: Location,
    private authService: AuthService,
    private route: ActivatedRoute
  ) {
    this.buildForm();
  }

  @Input() type: ReportType | null = null;

  // Regla compartida con el backend (RequiresLastSeen), para la plantilla.
  readonly requiresLastSeen = requiresLastSeen;
  readonly locationHint = locationHint;

  // Pérdida: mascotas del usuario que pueden reportarse (las que no están ya
  // perdidas). selectedPetId null = mascota nueva (se crea su ficha).
  myPets: petView[] = [];
  selectedPetId: number | null = null;

  // API unificada con la plantilla compartida pet-form (modo crear).
  submitLabel = 'Publicar mascota';

  // --- Fotos (por nombre de archivo, ver uploader) ---
  // Con una mascota existente, el reporte muestra las fotos de su ficha
  // ('pet') u otras propias ('own'). Al crear, la ficha no se edita desde aquí:
  // solo se ve. En los demás casos hay un solo uploader (ownKeys): fotos del
  // reporte, o de la ficha de la mascota nueva en una pérdida.
  photoMode: 'pet' | 'own' = 'pet';
  ownKeys: string[] = [];
  readonly ownInitial: imgView[] = [];
  readonly petInitial: imgView[] = [];
  readonly petPhotosEditable = false;
  submitted = false;

  published: boolean = false;
  isLoading: boolean = false;
  // Mensaje de error del submit. Se muestra encima del botón cuando la
  // creación falla, para no dejar al usuario con un spinner colgado.
  submitError: string | null = null;

  form: UntypedFormGroup;
  species: specie[] = [];
  specieId: number;
  breeds: breed[] = [];
  provincias: provincia[] = [];
  provinciaId: number;
  cantones: canton[] = [];
  cantonId: number;
  sectores: sector[] = [];
  dateInvalid: boolean = false;
  user: UserView = null;

  disableSubmit: boolean = false;
  maxFourFiles: boolean = false;

  maxFourContactNumbers: boolean = false;

  ngOnInit(): void {
    this.authService.user$.subscribe((data) => {
      this.user = data;
      if (data && this.type === 'Perdida') this.loadMyPets();
    });
    this.toggleDisabledBreed();
    this.toggleDisabledCanton();
    this.getSpecies();
    this.getBreedsBySpecie();
    this.getProvincias();
    this.getCantonesByProv();
    this.getSectoresByCanton();
    this.applyTypeRules();
  }

  // El nombre: obligatorio en una pérdida (el carné lo exige), opcional en
  // ayuda, oculto en encontrada/adopción. La fecha: solo en avistamientos.
  private applyTypeRules() {
    if (this.type !== 'Perdida') {
      this.petNameField.removeValidators(Validators.required);
      this.petNameField.updateValueAndValidity();
    }
    if (!requiresLastSeen(this.type)) {
      this.lastTimeSeenField.clearValidators();
      this.lastTimeSeenField.updateValueAndValidity();
    }
  }

  get showName(): boolean {
    return this.type === 'Perdida' || this.type === 'Ayuda';
  }

  get usesExistingPet(): boolean {
    return this.selectedPetId !== null;
  }

  get selectedPet(): petView | null {
    return this.myPets.find((p) => p.id === this.selectedPetId) ?? null;
  }

  get linkedToPet(): boolean {
    return this.usesExistingPet;
  }

  get petNameForPhotos(): string | null {
    return this.selectedPet?.petName ?? null;
  }

  get petPhotos(): imgView[] {
    return this.selectedPet?.urlImgs ?? [];
  }

  // El formulario exige al menos una foto VISIBLE en el reporte.
  get photosMissing(): boolean {
    if (this.usesExistingPet && this.photoMode === 'pet') return this.petPhotos.length === 0;
    return this.ownKeys.length === 0;
  }

  setPhotoMode(mode: 'pet' | 'own') {
    this.photoMode = mode;
  }

  onOwnKeys(keys: string[]) {
    this.ownKeys = keys;
  }

  // Al crear, la ficha de una mascota existente no se edita.
  onPetKeys(_: string[]) {}

  private loadMyPets() {
    this.petService.getMine().subscribe({
      next: (pets) => {
        this.myPets = (pets ?? []).filter((p) => !p.isLost);
        // "Reportar como perdida" desde Mis mascotas llega con ?pet=ID: la
        // mascota viene ya elegida (si es del usuario y no está perdida).
        const preselected = Number(this.route.snapshot.queryParamMap.get('pet'));
        if (preselected && this.myPets.some((p) => p.id === preselected)) this.selectPet(preselected);
      },
      error: () => (this.myPets = []), // sin la lista, se publica como mascota nueva
    });
  }

  // Con una mascota existente, sus datos y fotos ya están en su ficha: los
  // controles del animal se deshabilitan (no cuentan para la validez) y el
  // backend los rechazaría si llegaran.
  selectPet(id: number | null) {
    this.selectedPetId = id;
    // Una ficha sin fotos no tiene qué mostrar: se ofrecen fotos propias.
    this.photoMode = id !== null && this.petPhotos.length === 0 ? 'own' : 'pet';
    const animal = [this.petNameField, this.petSpecieField, this.sexField, this.ageYearsField, this.ageMonthsField];
    if (id === null) {
      animal.forEach((c) => c.enable());
      if (this.petSpecieField.value) this.petBreedField.enable();
    } else {
      [...animal, this.petBreedField].forEach((c) => c.disable());
    }
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      petName: [
        null,
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(12),
          Validators.pattern(/^[Aa-zA-ZáéíóúÁÉÍÓÚÑñ ]*$/),
        ],
      ],
      idPetSpecie: ['', Validators.required],
      idPetBreed: [{ value: '', disabled: true }], // opcional
      sex: ['Unknown' as PetSex],
      petAge: [null, Validators.maxLength(20)],
      ageYears: [null, [Validators.min(0), Validators.max(30)]],
      ageMonths: [null, [Validators.min(0), Validators.max(11)]],
      contact: this.formBuilder.array([
        new UntypedFormControl('', [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(10),
          Validators.pattern(/^[0-9]*$/),
        ]),
      ]),
      reward: [null, [Validators.min(0), Validators.max(100000)]],
      idProvincia: ['', Validators.required],
      idCanton: [{ value: '', disabled: true }, Validators.required],
      idSector: [''],
      location: [null as GeoPoint | null], // opcional: el pin del mapa
      description: ['', [Validators.required, Validators.maxLength(1000)]],
      lastTimeSeen: [null, [Validators.required, MyValidators.correctDate]],
    });
  }

  addContactField() {
    if (this.contactField.length < 4) {
      this.maxFourContactNumbers = false;
      this.contactField.push(this.CreateContactField());
    } else {
      this.maxFourContactNumbers = true;
    }
  }

  removeContactField(index: number) {
    this.contactField.removeAt(index);
    this.maxFourContactNumbers = false;
  }

  private CreateContactField() {
    return new UntypedFormControl('', [
      Validators.minLength(10),
      Validators.maxLength(10),
      Validators.pattern(/^[0-9]*$/),
    ]);
  }

  goBack() {
    this.location.back();
  }

  submit() {
    this.submitError = null;
    this.submitted = true;
    if (this.user && this.form.valid && !this.photosMissing) {
      this.isLoading = true;
      this.published = true;
      this.reportService.create(this.buildDto()).subscribe({
        next: () => {
          this.isLoading = false;
          this.location.back();
        },
        error: (err) => {
          // Sin este handler, isLoading nunca volvía a false en fallos de
          // red/servidor y el botón giraba para siempre.
          this.isLoading = false;
          this.published = false;
          this.submitError =
            typeof err === 'string'
              ? err
              : 'No pudimos publicar. Inténtalo de nuevo en un momento.';
          console.error('Error al crear la publicación:', err);
        },
      });
    } else {
      this.published = false;
    }
    this.form.markAllAsTouched();
  }

  // Arma el body por tipo. El backend rechaza (400) lo que no corresponde a cada
  // flujo, así que solo se manda lo que aplica. La provincia es solo de la
  // cascada de la UI: no se envía (se deriva del cantón).
  private buildDto(): CreateReportDTO {
    const v = this.form.getRawValue();
    const type = this.type;
    const dto: CreateReportDTO = {
      type,
      description: v.description,
      contact: (this.contactField.value as string[]).filter((n) => n).join(' '),
      idCanton: Number(v.idCanton),
      idSector: v.idSector ? Number(v.idSector) : null,
      lastTimeSeen: requiresLastSeen(type) ? v.lastTimeSeen : null,
      reward: type === 'Perdida' && v.reward ? Number(v.reward) : null,
      // lat y lng van juntos o ninguno (el backend responde 400 si no).
      lat: v.location?.lat ?? null,
      lng: v.location?.lng ?? null,
    };

    if (this.usesExistingPet) {
      dto.idPet = this.selectedPetId;
      // Sin fotos propias, el reporte muestra las de la ficha.
      if (this.photoMode === 'own') dto.imageKeys = this.ownKeys;
      return dto;
    }

    dto.petName = this.showName && v.petName ? v.petName : null;
    dto.idPetSpecie = Number(v.idPetSpecie);
    dto.idPetBreed = v.idPetBreed ? Number(v.idPetBreed) : null;
    dto.sex = v.sex ?? 'Unknown';
    if (type === 'Perdida') {
      dto.birthDate = birthDateFromAge(v.ageYears, v.ageMonths);
    } else if (type !== 'Encontrada') {
      dto.petAge = v.petAge || null;
    }
    // Pérdida con mascota nueva: las fotos son de su ficha. El resto: del reporte.
    if (type === 'Perdida') dto.petImageKeys = this.ownKeys;
    else dto.imageKeys = this.ownKeys;
    return dto;
  }

  toggleDisabledBreed() {
    this.petSpecieField.valueChanges.subscribe(() => {
      if (this.petSpecieField.hasError('required')) {
        this.disableBreedField();
      } else {
        this.enableBreedField();
      }
    });
  }

  toggleDisabledCanton() {
    this.provinciaField.valueChanges.subscribe(() => {
      if (this.provinciaField.value) {
        this.cantonField.enable();
      } else {
        this.cantonField.setValue('');
        this.cantonField.disable();
      }
    });
  }

  enableBreedField() {
    this.petBreedField.enable();
  }

  disableBreedField() {
    this.petBreedField.disable();
  }

  private getSpecies() {
    this.categoryService.getSpecies().subscribe((species: specie[]) => {
      this.species = species;
    });
  }

  private getBreedsBySpecie() {
    this.petSpecieField.valueChanges
      .pipe(
        // Sin especie (vacía o deshabilitada) no hay razas que pedir.
        switchMap((id) => (id ? this.categoryService.getBreedsBySpecie(id) : of([] as breed[])))
      )
      .subscribe((breeds: breed[]) => (this.breeds = breeds));
  }

  private getProvincias() {
    this.categoryService
      .getProvincias()
      .subscribe((provincias: provincia[]) => {
        this.provincias = provincias;
      });
  }

  private getCantonesByProv() {
    this.provinciaField.valueChanges
      .pipe(
        switchMap((id) => {
          return this.categoryService.getCantonesByProv(id);
        })
      )
      .subscribe((cantones: canton[]) => (this.cantones = cantones));
  }

  private getSectoresByCanton() {
    this.cantonField.valueChanges
      .pipe(
        switchMap((id) => {
          if (id) {
            return this.categoryService.getSectoresByCanton(id);
          } else {
            return new Observable<null>();
          }
        })
      )
      .subscribe((sectores: sector[] | null) => {
        this.sectores = sectores;
      });
  }

  onLimit(event: boolean) {
    this.maxFourFiles = event;
  }

  get petNameField() {
    return this.form.get('petName');
  }

  get petNameFieldValid() {
    return this.petNameField.touched && this.petNameField.valid;
  }

  get petNameFieldInvalid() {
    return this.petNameField.touched && this.petNameField.invalid;
  }

  get petSpecieField() {
    return this.form.get('idPetSpecie');
  }

  get petSpecieFieldValid() {
    return this.petSpecieField.touched && this.petSpecieField.valid;
  }

  get petSpecieFieldInvalid() {
    return this.petSpecieField.touched && this.petSpecieField.invalid;
  }

  get petBreedField() {
    return this.form.get('idPetBreed');
  }

  get petBreedFieldValid() {
    return this.petBreedField.touched && this.petBreedField.valid;
  }

  get petBreedFieldInvalid() {
    return this.petBreedField.touched && this.petBreedField.invalid;
  }

  get provinciaField() {
    return this.form.get('idProvincia');
  }

  get provinciaFieldValid() {
    return this.provinciaField.touched && this.provinciaField.valid;
  }

  get provinciaFieldInvalid() {
    return this.provinciaField.touched && this.provinciaField.invalid;
  }

  get cantonField() {
    return this.form.get('idCanton');
  }

  get cantonFieldValid() {
    return this.cantonField.touched && this.cantonField.valid;
  }

  get cantonFieldInvalid() {
    return this.cantonField.touched && this.cantonField.invalid;
  }

  get sectorField() {
    return this.form.get('idSector');
  }

  get descriptionField() {
    return this.form.get('description');
  }

  get descriptionFieldValid() {
    return this.descriptionField.touched && this.descriptionField.valid;
  }

  get descriptionFieldInvalid() {
    return this.descriptionField.touched && this.descriptionField.invalid;
  }

  get rewardField() {
    return this.form.get('reward');
  }

  get rewardFieldValid() {
    return this.rewardField.touched && this.rewardField.valid;
  }

  get rewardFieldInvalid() {
    return this.rewardField.touched && this.rewardField.invalid;
  }

  get lastTimeSeenField() {
    return this.form.get('lastTimeSeen');
  }

  get lastTimeSeenFieldValid() {
    return this.lastTimeSeenField.touched && this.lastTimeSeenField.valid;
  }

  get lastTimeSeenFieldInvalid() {
    return this.lastTimeSeenField.touched && this.lastTimeSeenField.invalid;
  }

  get petAgeField() {
    return this.form.get('petAge');
  }

  get sexField() {
    return this.form.get('sex');
  }

  get ageYearsField() {
    return this.form.get('ageYears');
  }

  get ageMonthsField() {
    return this.form.get('ageMonths');
  }

  get petAgeFieldValid() {
    return this.petAgeField.touched && this.petAgeField.valid;
  }

  get petAgeFieldInvalid() {
    return this.petAgeField.touched && this.petAgeField.invalid;
  }

  get contactField() {
    return this.form.get('contact') as UntypedFormArray;
  }

  // get contactFieldValid() {
  //   return this.contactField.touched && this.contactField.valid;
  // }

  // get contactFieldInvalid() {
  //   return this.contactField.touched && this.contactField.invalid;
  // }
}
