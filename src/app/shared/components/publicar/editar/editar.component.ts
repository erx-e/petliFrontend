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
import { UpdatePostpetDTO, updateImg } from 'src/app/models/postpet.model';
import { UserView } from 'src/app/models/user.model';
import { AuthService } from 'src/app/services/auth.service';
import { CategoryService } from 'src/app/services/category.service';
import { PostpetService } from 'src/app/services/postpet.service';
import { environment } from 'src/environments/environment';
import { switchMap } from 'rxjs/operators';
import { MyValidators } from 'src/app/validators/validators';
import { Location } from '@angular/common';

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
    private postpetService: PostpetService,
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
            return this.postpetService.getByIdUpdate(parseInt(this.postpetId));
          }
          return of(null);
        })
      )
      .subscribe((data) => {
        this.postpet = data;
        if (this.postpet) {
          this.petNameField.setValue(this.postpet.petName);
          this.petSpecieField.setValue(this.postpet.idPetSpecie);
          let petSpecie1 = document.getElementById(
            'especie1'
          ) as HTMLInputElement;
          let petSpecie2 = document.getElementById(
            'especie2'
          ) as HTMLInputElement;
          if (petSpecie1.value) {
            petSpecie1.click();
          } else {
            petSpecie2.click();
          }
          this.petBreedField.setValue(this.postpet.idPetBreed);
          this.provinciaField.setValue(this.postpet.idProvincia);
          this.cantonField.setValue(this.postpet.idCanton);
          if (this.postpet.reward) {
            this.rewardField.setValue(this.postpet.reward);
          }
          if (this.postpet.idSector) {
            this.sectorField.setValue(this.postpet.idSector);
          }
          this.petAgeField.setValue(this.postpet.petAge);
          this.petSpecialConditionField.setValue(
            this.postpet.petSpecialCondition
          );
          if (this.postpet.contact) {
            // match() devuelve null si solo hay espacios; ?? [] lo neutraliza
            // antes de leer .length.
            const numbers = this.postpet.contact.match(/\S+/g) ?? [];
            if (numbers.length > 0) {
              this.contactNumbers = numbers;
              for (let i = 1; i < numbers.length; i++) {
                this.addContactField();
              }
              this.contactField.patchValue(numbers);
            }
          }
          this.descriptionField.setValue(this.postpet.description);
          this.lastTimeSeenField.setValue(this.postpet.lastTimeSeen);
          // CRÍTICO: clonar dos arrays independientes. imgUrls es lo que el
          // uploader muta al subir/eliminar (se envía al backend al guardar);
          // imgUrlsOrigin solo se usa para el @for "imagenes ya subidas" del
          // template. Si comparten referencia, cada push del uploader mete la
          // foto recién subida también en imgUrlsOrigin → el segundo @for la
          // pinta otra vez y la imagen se ve duplicada en la UI.
          this.imgUrls = this.postpet.urlImgs.map((img) => ({ ...img }));
          this.imgUrlsOrigin = this.postpet.urlImgs.map((img) => ({ ...img }));

          this.urlImgsField.clearValidators();
          this.urlImgsField.updateValueAndValidity();
        }
      });
    if (this.stateId == 'E' || this.stateId == 'A') {
      this.petNameField.clearValidators();
      this.petNameField.updateValueAndValidity();
    }
    if (this.stateId == 'A' || this.stateId == 'H') {
      this.lastTimeSeenField.clearValidators();
      this.lastTimeSeenField.updateValueAndValidity();
    }
  }

  form: UntypedFormGroup;
  @Input() stateId: string = '';

  // API unificada con la plantilla compartida pet-form (modo editar).
  submitLabel = 'Editar publicación';
  updating = true;

  published: boolean = false;
  isLoading: boolean = false;
  // Mensaje de error del submit (HTTP o sincrónico). Se muestra encima del
  // botón para que el usuario sepa qué pasó cuando la edición falla.
  submitError: string | null = null;

  urlBucket = environment.BUCKET_URL;
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

  imgUrls: updateImg[] = [];
  imgUrlsOrigin: updateImg[] = [];

  disableSubmit: boolean = false;
  maxFourFiles: boolean = false;

  postpetId: string | null;
  postpet!: UpdatePostpetDTO | null;
  updatePost: UpdatePostpetDTO = {
    idPostPet: null,
    idUser: null,
    petName: null,
    idCanton: null,
    idPetBreed: null,
    petAge: null,
    petSpecialCondition: null,
    contact: null,
    idPetSpecie: null,
    idProvincia: null,
    idSector: null,
    idState: null,
    description: null,
    reward: null,
    lastTimeSeen: null,
    urlImgs: null,
  };
  publishingPost: boolean = false;
  contactNumbers: string[] = [];

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
      idPetBreed: [{ value: '', disabled: true }, Validators.required],
      petAge: [null],
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
      description: ['', Validators.required],
      lastTimeSeen: [null, [Validators.required, MyValidators.correctDate]],
      urlImgs: [''],
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
    if (this.form.valid && this.imgUrls.length > 0) {
      this.isLoading = true;
      try {
      this.updatePost.idPostPet = this.postpet.idPostPet;
      this.updatePost.petName =
        this.postpet.petName != this.petNameField.value
          ? this.petNameField.value
          : null;
      this.updatePost.idPetSpecie =
        this.postpet.idPetSpecie != this.petSpecieField.value
          ? this.petSpecieField.value
          : null;
      this.updatePost.idPetBreed =
        this.postpet.idPetBreed != this.petBreedField.value
          ? this.petBreedField.value
          : null;
      this.updatePost.petAge =
        this.postpet.petAge != this.petAgeField.value
          ? this.petAgeField.value
          : null;
      this.updatePost.petSpecialCondition =
        this.postpet.petSpecialCondition != this.petSpecialConditionField.value
          ? this.petSpecialConditionField.value
          : null;

      this.updatePost.idProvincia =
        this.postpet.idProvincia != this.provinciaField.value
          ? this.provinciaField.value
          : null;
      this.updatePost.idCanton =
        this.postpet.idCanton != this.cantonField.value
          ? this.cantonField.value
          : null;
      this.updatePost.idSector =
        this.postpet.idSector != this.sectorField.value
          ? this.sectorField.value
          : null;
      this.updatePost.description =
        this.postpet.description != this.descriptionField.value
          ? this.descriptionField.value
          : null;
      this.updatePost.contact =
        this.contactNumbers != this.contactField.value
          ? this.contactField.value.join(' ')
          : null;
      this.updatePost.reward =
        this.postpet.reward != this.rewardField.value
          ? this.rewardField.value
          : null;
      this.updatePost.lastTimeSeen =
        this.postpet.lastTimeSeen != this.lastTimeSeenField.value
          ? this.lastTimeSeenField.value
          : this.lastTimeSeenField.value;

      if (!this.updatePost.idSector) {
        this.updatePost.idSector = null;
      }

      if (!this.updatePost.reward) {
        this.updatePost.reward = null;
      }

      this.updatePost.urlImgs = this.imgUrls;
      this.updatePost.idUser = this.user.idUser;
      this.updatePost.idState = this.stateId;
      this.published = true;
      this.postpetService.update(this.updatePost).subscribe({
        next: () => {
          this.isLoading = false;
          this.location.back();
        },
        error: (err) => {
          // El servicio convierte 400 → "Post Id incorrecto" y otros → "Error
          // del servidor". Sin este handler, isLoading se quedaba en true y el
          // botón giraba para siempre (típico al editar con imágenes huérfanas
          // que el backend rechaza al recibir url:null).
          this.isLoading = false;
          this.published = false;
          this.submitError =
            typeof err === 'string'
              ? err
              : 'No pudimos guardar los cambios. Inténtalo de nuevo en un momento.';
          console.error('Error al actualizar la publicación:', err);
        },
      });
      } catch (err) {
        // Error sincrónico armando el payload (p.ej. postpet/user nulos).
        this.isLoading = false;
        this.published = false;
        this.submitError = 'No pudimos preparar los cambios. Recarga la página e inténtalo de nuevo.';
        console.error('Error preparando la actualización:', err);
      }
    }
    this.form.markAllAsTouched();
  }

  // Firma ampliada por la plantilla compartida; en modo editar siempre llega updateImg[].
  onUrlsChange(event: string[] | updateImg[]) {
    this.imgUrls = event as updateImg[];
  }

  onLimit(event: boolean) {
    this.maxFourFiles = event;
  }

  // Alias para la plantilla compartida: el uploader en modo editar lee
  // imgsUrlUpdating / imgsUrlUpdatingToShow.
  get imgsUrlUpdating() {
    return this.imgUrls;
  }

  get imgsUrlUpdatingToShow() {
    return this.imgUrlsOrigin;
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
        switchMap((id) => {
          return this.categoryService.getBreedsBySpecie(id);
        })
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

  get urlImgsField() {
    return this.form.get('urlImgs');
  }

  get urlImgsFieldValid() {
    return (
      this.urlImgsField.touched &&
      this.urlImgsField.valid &&
      this.maxFourFiles == false
    );
  }

  get urlImgsFieldInvalid() {
    return (
      this.urlImgsField.touched &&
      (this.imgUrls.length == 0 || this.maxFourFiles)
    );
  }

  get petAgeField() {
    return this.form.get('petAge');
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
