import { Component, Input, OnInit } from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import {
  breed,
  canton,
  provincia,
  sector,
  specie,
} from 'src/app/models/category.model';
import {
  ageFromBirthDate,
  birthDateFromAge,
  petView,
  PetSex,
  ReportType,
  reportUpdateView,
  locationHint,
  requiresLastSeen,
  UpdateReportDTO,
  imgView,
} from 'src/app/models/report.model';
import { UserView } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { CategoryService } from 'src/app/services/category.service';
import { ReportService } from 'src/app/services/report.service';
import { switchMap } from 'rxjs/operators';
import { MyValidators } from 'src/app/validators/validators';
import { Location } from '@angular/common';
import { GeoPoint } from '../../../map/leaflet';

@Component({
    selector: 'app-editar',
    templateUrl: '../pet-form.component.html',
    styleUrls: ['../pet-form.component.scss'],
    standalone: false
})
export class EditarComponent implements OnInit {
  constructor(
    private formBuilder: UntypedFormBuilder,
    private categoryService: CategoryService,
    private reportService: ReportService,
    private router: ActivatedRoute,
    private location: Location,
    private authService: AuthService
  ) {
    this.buildForm();
  }

  async ngOnInit(): Promise<void> {
    this.authService.user$.subscribe((data) => (this.user = data));
    this.toggleDisabledBreed();
    this.toggleDisabledCanton();
    await this.getSpecies();
    this.getBreedsBySpecie();
    await this.getProvincias();
    await this.getCantonesByProv();
    this.getSectoresByCanton();
    this.router.paramMap
      .pipe(
        switchMap((params) => {
          this.postpetId = params.get('id');
          if (this.postpetId) {
            return this.reportService.getForUpdate(parseInt(this.postpetId));
          }
          return of(null);
        })
      )
      .subscribe((data) => {
        this.postpet = data;
        if (this.postpet) this.prefill(this.postpet);
      });
  }

  // Precarga el formulario con el reporte. El tipo manda el del reporte (el del
  // área es solo el valor inicial).
  private prefill(report: reportUpdateView) {
    this.type = report.type;
    this.applyTypeRules();

    this.petNameField.setValue(report.petName);
    // Los radios tienen value="1"/"2" (string): con el número no marcan nada.
    this.petSpecieField.setValue(String(report.idPetSpecie));
    this.petBreedField.setValue(report.idPetBreed ?? '');
    this.sexField.setValue(report.sex ?? 'Unknown');
    this.petAgeField.setValue(report.petAge);
    this.initialAge = ageFromBirthDate(report.birthDate);
    this.ageYearsField.setValue(this.initialAge?.years ?? null);
    this.ageMonthsField.setValue(this.initialAge?.months ?? null);

    // idProvincia es derivada del cantón (solo lectura): precarga la cascada.
    this.provinciaField.setValue(report.idProvincia);
    this.cantonField.setValue(report.idCanton);
    if (report.idSector) this.sectorField.setValue(report.idSector);
    if (report.reward) this.rewardField.setValue(report.reward);

    // match() devuelve null si solo hay espacios; ?? [] lo neutraliza.
    const numbers = report.contact?.match(/\S+/g) ?? [];
    if (numbers.length > 0) {
      for (let i = 1; i < numbers.length; i++) this.addContactField();
      this.contactField.patchValue(numbers);
    }
    this.descriptionField.setValue(report.description);
    this.lastTimeSeenField.setValue(report.lastTimeSeen);
    this.form.get('location').setValue(
      report.lat != null && report.lng != null ? { lat: report.lat, lng: report.lng } : null
    );

    // Fotos: las propias del reporte y, en una pérdida, las de la ficha. Sin
    // fotos propias, la pérdida arranca mostrando las de la ficha.
    this.ownInitial = report.reportImages ?? [];
    this.petInitial = report.petImages ?? [];
    this.ownKeys = this.ownInitial.map((img) => img.key);
    this.petKeys = this.petInitial.map((img) => img.key);
    this.photoMode = report.type === 'Perdida' && this.ownKeys.length === 0 ? 'pet' : 'own';
  }

  get linkedToPet(): boolean {
    return this.type === 'Perdida';
  }

  get petNameForPhotos(): string | null {
    return this.postpet?.petName ?? null;
  }

  get petPhotos(): imgView[] {
    return this.petInitial;
  }

  // El formulario exige al menos una foto VISIBLE en el reporte.
  get photosMissing(): boolean {
    if (this.linkedToPet && this.photoMode === 'pet') return this.petKeys.length === 0;
    return this.ownKeys.length === 0;
  }

  setPhotoMode(mode: 'pet' | 'own') {
    this.photoMode = mode;
  }

  onOwnKeys(keys: string[]) {
    this.ownKeys = keys;
  }

  onPetKeys(keys: string[]) {
    this.petKeys = keys;
  }

  private applyTypeRules() {
    this.petNameField.setValidators(this.type === 'Perdida' ? this.nameValidators : this.nameValidators.slice(1));
    this.petNameField.updateValueAndValidity();
    if (requiresLastSeen(this.type)) {
      this.lastTimeSeenField.setValidators([Validators.required, MyValidators.correctDate]);
    } else {
      this.lastTimeSeenField.clearValidators();
    }
    this.lastTimeSeenField.updateValueAndValidity();
  }

  get showName(): boolean {
    return this.type === 'Perdida' || this.type === 'Ayuda';
  }

  form: UntypedFormGroup;
  @Input() type: ReportType | null = null;

  // Regla compartida con el backend (RequiresLastSeen), para la plantilla.
  readonly requiresLastSeen = requiresLastSeen;
  readonly locationHint = locationHint;

  // El selector de mascota es solo de la creación: al editar no se cambia.
  readonly myPets: petView[] = [];
  readonly selectedPetId: number | null = null;
  readonly usesExistingPet = false;
  readonly selectedPet: petView | null = null;
  selectPet(_: number | null) {}

  // Edad precargada: si el usuario no la toca, se reenvía la fecha original (la
  // conversión edad -> fecha pierde el día).
  private initialAge: { years: number; months: number } | null = null;

  private readonly nameValidators = [
    Validators.required,
    Validators.minLength(2),
    Validators.maxLength(12),
    Validators.pattern(/^[Aa-zA-ZáéíóúÁÉÍÓÚÑñ ]*$/),
  ];

  // API unificada con la plantilla compartida pet-form (modo editar).
  submitLabel = 'Editar publicación';

  // --- Fotos (por nombre de archivo, ver uploader) ---
  // Inline: un solo uploader, las fotos propias (ownKeys). Pérdida: elige entre
  // las fotos de la ficha de su mascota ('pet', editables aquí también: F9) y
  // fotos propias del reporte ('own'). Las dos listas viajan completas.
  photoMode: 'pet' | 'own' = 'own';
  ownKeys: string[] = [];
  petKeys: string[] = [];
  ownInitial: imgView[] = [];
  petInitial: imgView[] = [];
  readonly petPhotosEditable = true;
  submitted = false;

  published: boolean = false;
  isLoading: boolean = false;
  // Mensaje de error del submit (HTTP o sincrónico). Se muestra encima del
  // botón para que el usuario sepa qué pasó cuando la edición falla.
  submitError: string | null = null;

  species: specie[] = [];
  specieId: number;
  breeds: breed[] = [];
  provincias: provincia[] = [];
  provinciaId: number;
  cantones: canton[] = [];
  cantonId: number;
  sectores: sector[] = [];
  dateInvalid: boolean = false;
  user: UserView;

  disableSubmit: boolean = false;
  maxFourFiles: boolean = false;

  postpetId: string | null;
  postpet!: reportUpdateView | null;
  publishingPost: boolean = false;

  maxFourContactNumbers: boolean = false;

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
      petSpecialCondition: [null],
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
      description: ['', Validators.required],
      lastTimeSeen: [null, [Validators.required, MyValidators.correctDate]],
    });
  }

  goBack() {
    this.location.back();
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

  submit() {
    this.submitError = null;
    this.submitted = true;
    if (this.postpet && this.form.valid && !this.photosMissing) {
      this.isLoading = true;
      this.published = true;
      this.reportService.update(this.buildDto(this.postpet)).subscribe({
        next: () => {
          this.isLoading = false;
          this.location.back();
        },
        error: (err) => {
          // Sin este handler, isLoading se quedaba en true y el botón giraba
          // para siempre.
          this.isLoading = false;
          this.published = false;
          this.submitError =
            typeof err === 'string'
              ? err
              : 'No pudimos guardar los cambios. Inténtalo de nuevo en un momento.';
          console.error('Error al actualizar la publicación:', err);
        },
      });
    }
    this.form.markAllAsTouched();
  }

  // El update REEMPLAZA (D4): un campo ausente quedaría vacío. Por eso se manda
  // el formulario completo, y los campos sin control en la UI (señas
  // particulares, y el nombre/edad cuando el tipo los oculta)
  // viajan tal como llegaron en el prefill.
  private buildDto(report: reportUpdateView): UpdateReportDTO {
    const v = this.form.getRawValue();
    const type = report.type;
    const lost = type === 'Perdida';

    const ageUnchanged =
      (this.initialAge?.years ?? null) === (v.ageYears ?? null) &&
      (this.initialAge?.months ?? null) === (v.ageMonths ?? null);

    // Fotos como listas completas. En una pérdida con las fotos de la ficha, se
    // manda la ficha y se vacían las propias (si había, se borran al guardar);
    // con fotos propias, la ficha no se toca (petImageKeys ausente).
    const photos: Pick<UpdateReportDTO, 'imageKeys' | 'petImageKeys'> =
      lost && this.photoMode === 'pet'
        ? { petImageKeys: this.petKeys, imageKeys: [] }
        : { imageKeys: this.ownKeys };

    return {
      idReport: report.idReport,
      petName: this.showName ? v.petName || null : report.petName,
      idPetSpecie: Number(v.idPetSpecie),
      idPetBreed: v.idPetBreed ? Number(v.idPetBreed) : null,
      sex: v.sex ?? 'Unknown',
      petAge: lost ? null : type === 'Encontrada' ? report.petAge : v.petAge || null,
      birthDate: !lost ? null : ageUnchanged ? report.birthDate : birthDateFromAge(v.ageYears, v.ageMonths),
      petSpecialCondition: report.petSpecialCondition,
      description: v.description,
      contact: (this.contactField.value as string[]).filter((n) => n).join(' '),
      reward: lost && v.reward ? Number(v.reward) : null,
      lastTimeSeen: requiresLastSeen(type) ? v.lastTimeSeen : null,
      idCanton: Number(v.idCanton),
      idSector: v.idSector ? Number(v.idSector) : null,
      // Quitar el punto en el mapa lo borra: lat y lng viajan juntos o ninguno.
      lat: v.location?.lat ?? null,
      lng: v.location?.lng ?? null,
      ...photos,
    };
  }

  onLimit(event: boolean) {
    this.maxFourFiles = event;
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

  private async getSpecies() {
    this.categoryService.getSpecies().subscribe((species: specie[]) => {
      this.species = species;
    });
  }

  private getBreedsBySpecie() {
    this.petSpecieField.valueChanges
      .pipe(
        switchMap((id) => (id ? this.categoryService.getBreedsBySpecie(id) : of([] as breed[])))
      )
      .subscribe((breeds: breed[]) => (this.breeds = breeds));
  }

  private async getProvincias() {
     this.categoryService
      .getProvincias()
      .subscribe((provincias: provincia[]) => {
        this.provincias = provincias;
      });
  }

  private async getCantonesByProv() {
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
            return of(null);
          }
        })
      )
      .subscribe((sectores: sector[] | null) => {
        if (sectores) {
          this.sectores = sectores;
        }
      });
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

  get petSpecialConditionField() {
    return this.form.get('petSpecialCondition');
  }

  get contactField() {
    return this.form.get('contact') as UntypedFormArray;
  }
}
