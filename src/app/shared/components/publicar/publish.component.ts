import { Component, Input, OnInit } from '@angular/core';
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { createImgDTO, CreatePostpetDTO } from 'src/app/models/postpet.model';
import { Location } from '@angular/common';
import { CategoryService } from 'src/app/services/category.service';
import {
  breed,
  canton,
  provincia,
  sector,
  specie,
} from '../../../models/category.model';
import { switchMap } from 'rxjs/operators';
import { PostpetService } from 'src/app/services/postpet.service';
import { environment } from 'src/environments/environment';
import { AuthService } from 'src/app/services/auth.service';
import { UserView } from 'src/app/models/user.model';
import { MyValidators } from 'src/app/validators/validators';
import { Observable, of } from 'rxjs';

@Component({
    selector: 'app-publish',
    templateUrl: './publish.component.html',
    styleUrls: ['./publish.component.scss'],
    standalone: false
})
export class PublishComponent implements OnInit {
  constructor(
    private formBuilder: UntypedFormBuilder,
    private categoryService: CategoryService,
    private postpetService: PostpetService,
    private location: Location,
    private authService: AuthService
  ) {
    this.buildForm();
  }

  @Input() stateId: string = '';

  published: boolean = false;
  isLoading: boolean = false;

  urlBucket = `${environment.BUCKET_URL}`;
  form: UntypedFormGroup;
  createdPost: CreatePostpetDTO = {
    contact: null,
    petAge: null,
    idCanton: null,
    idPetBreed: null,
    idPetSpecie: null,
    idProvincia: null,
    idSector: null,
    idState: null,
    idUser: null,
    lastTimeSeen: null,
    petName: null,
    petSpecialCondition: null,
    description: null,
    reward: null,
    urlImgs: null,
    linkMapSeen: null,
  };
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

  imgUrls: string[] = [];

  disableSubmit: boolean = false;
  maxSixFiles: boolean = false;

  maxFourContactNumbers: boolean = false;

  ngOnInit(): void {
    this.authService.user$.subscribe((data) => (this.user = data));
    this.toggleDisabledBreed();
    this.toggleDisabledCanton();
    this.getSpecies();
    this.getBreedsBySpecie();
    this.getProvincias();
    this.getCantonesByProv();
    this.getSectoresByCanton();
    if (this.stateId == 'E' || this.stateId == 'A') {
      this.petNameField.clearValidators();
      this.petNameField.updateValueAndValidity();
    }
    if (this.stateId == 'A' || this.stateId == 'H') {
      this.lastTimeSeenField.clearValidators();
      this.lastTimeSeenField.updateValueAndValidity();
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

  addContactField() {
    if (this.contactField.length < 4) {
      this.maxFourContactNumbers = false;
      this.contactField.push(this.CreateContactField());
    } else {
      this.maxFourContactNumbers = true;
    }
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

  crearPost() {
    if (this.user && this.form.valid && this.imgUrls.length > 0) {
      this.isLoading = true;
      this.createdPost = this.form.value;

      if (!this.sectorField.value) {
        this.createdPost.idSector = null;
      }
      if (!this.rewardField.value) {
        this.createdPost.reward = null;
      }

      this.createdPost.urlImgs = this.imgUrls.map((url) => {
        return { url: url } as createImgDTO;
      });
      this.createdPost.contact = this.contactField.value.join(' ');
      this.createdPost.idUser = this.user.idUser;

      this.createdPost.idState = this.stateId;
      this.published = true;
      this.postpetService.create(this.createdPost).subscribe(() => {
        this.isLoading = false;
        this.location.back();
      });
    } else {
      this.published = false;
    }
    this.form.markAllAsTouched();
  }

  onUrlsChange(event: string[]) {
    this.imgUrls = event;
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
        switchMap((id) => {
          return this.categoryService.getBreedsBySpecie(id);
        })
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
          console.log(id);
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
        console.log(sectores);
        this.sectores = sectores;
      });
  }

  onLimit(event: boolean) {
    this.maxSixFiles = event;
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
      this.maxSixFiles == false
    );
  }

  get urlImgsFieldInvalid() {
    return (
      this.urlImgsField.touched &&
      (this.imgUrls.length == 0 || this.maxSixFiles)
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

  // get contactFieldValid() {
  //   return this.contactField.touched && this.contactField.valid;
  // }

  // get contactFieldInvalid() {
  //   return this.contactField.touched && this.contactField.invalid;
  // }
}
