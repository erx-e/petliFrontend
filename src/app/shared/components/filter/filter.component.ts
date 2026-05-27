import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { postpetView } from 'src/app/models/postpet.model';
import {
  breed,
  canton,
  provincia,
  sector,
} from '../../../models/category.model';
import { switchMap } from 'rxjs/operators';
import { CategoryService } from 'src/app/services/category.service';
import { PostpetService } from 'src/app/services/postpet.service';
import { Observable, Subscription } from 'rxjs';
import { MyValidators } from 'src/app/validators/validators';
import { NoScrollService } from '../../../services/no-scroll.service';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { LoadingService } from 'src/app/services/loading.service';

@Component({
    selector: 'app-filter',
    templateUrl: './filter.component.html',
    styleUrls: ['./filter.component.scss'],
    standalone: false
})
export class FilterComponent implements OnInit {
  constructor(
    private postpetService: PostpetService,
    private formBuilder: UntypedFormBuilder,
    private categoryService: CategoryService,
    private noScrollService: NoScrollService,
    private route: ActivatedRoute,
    private loadingService: LoadingService
  ) {
    this.buildForm();
  }

  @Input() stateId: string = '';
  @Input() userId: number = null;

  petSpecieId: number | null = null;
  petBreedId: number | null = null;
  petAge: number | null = null;
  provinciaId: number | null = null;
  cantonId: number | null = null;
  sectorId: number | null = null;
  date: string | null = null;
  order: number | null = null;

  breeds: breed[] = [];
  provincias: provincia[] = [];
  cantones: canton[] = [];
  sectores: sector[] = [];

  form: UntypedFormGroup;
  postspet: postpetView[] = null;
  limit: number = 12;
  offset: number = 0;
  filter: boolean = false;

  morePostspet: boolean = true;
  isLoadingMore: boolean = false;

  // Filtros avanzados (sector, fecha, orden) ocultos por defecto.
  showMoreFilters: boolean = false;
  toggleMoreFilters() {
    this.showMoreFilters = !this.showMoreFilters;
  }

  postspetLoading = [null, null, null, null, null, null, null, null];
  onInit = true;

  async ngOnInit(): Promise<void> {
    await this.getPostsByParams();

    this.getBreedsBySpecie();
    this.getProvincias();
    this.getCantonesByProv();
    this.getSectoresByCanton();
    this.toggleDisabledBreed();
    this.toggleDisabledCanton();
    this.toggleDisabledSector();
  }

  overflowHidden() {
    if (this.filter) {
      this.noScrollService.noScrollEmit(true);
    } else {
      this.noScrollService.noScrollEmit(false);
    }
  }

  async getPostsByParams() {
    await this.getParams();
  }

  async getParams() {
    this.route.queryParamMap.subscribe((params: ParamMap) => {
      this.petSpecieId = null;
      this.petBreedId = null;
      this.provinciaId = null;
      this.cantonId = null;
      this.sectorId = null;
      this.date = null;
      this.order = null;

      if (parseInt(params.get('especie'))) {
        this.petSpecieField.setValue(params.get('especie'));
        this.petSpecieId = parseInt(params.get('especie'));
      }
      if (parseInt(params.get('raza'))) {
        this.petBreedField.setValue(params.get('raza'));
        this.petBreedId = parseInt(params.get('raza'));
      }
      if (parseInt(params.get('provincia'))) {
        this.provinciaField.setValue(params.get('provincia'));
        this.provinciaId = parseInt(params.get('provincia'));
      }
      if (parseInt(params.get('canton'))) {
        this.cantonField.setValue(params.get('canton'));
        this.cantonId = parseInt(params.get('canton'));
      }
      if (parseInt(params.get('sector'))) {
        this.sectorField.setValue(params.get('sector'));
        this.sectorId = parseInt(params.get('sector'));
      }
      if (parseInt(params.get('fecha'))) {
        this.lastTimeSeenField.setValue(params.get('fecha'));
        this.date = params.get('fecha');
      }
      if (parseInt(params.get('orden'))) {
        this.orderField.setValue(params.get('orden'));
        this.order = parseInt(params.get('orden'));
      }
      this.limit = 12;
      this.offset = 0;
      this.form.markAllAsTouched();

      this.getPosts();
    });
  }

  async getPosts() {
    this.postpetService
      .GetByFilter(
        this.stateId,
        this.petSpecieId,
        this.petBreedId,
        this.provinciaId,
        this.cantonId,
        this.sectorId,
        this.userId,
        this.date,
        this.order,
        this.limit,
        this.offset
      )
      .subscribe((data) => {
        this.postspet = [];
        if (data) {
          this.postspet = data;
          if (data.length < 12 || data.length > 12) {
            this.morePostspet = false;
          } else {
            this.morePostspet = true;
          }
          this.filter = false;
          this.overflowHidden();
          this.offset += this.limit;
        }
      });
  }

  onLoadMore() {
    this.isLoadingMore = true;
    this.postpetService
      .GetByFilter(
        this.stateId,
        this.petSpecieId,
        this.petBreedId,
        this.provinciaId,
        this.cantonId,
        this.sectorId,
        this.userId,
        this.date,
        this.order,
        this.limit,
        this.offset
      )
      .subscribe((data) => {
        if (data) {
          this.isLoadingMore = false;
          this.postspet = this.postspet.concat(data);
          if (data.length < 12) {
            this.morePostspet = false;
          } else {
            this.morePostspet = true;
          }
          this.offset += this.limit;
        }
      });
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      idPetSpecie: [''],
      idPetBreed: [{ value: '', disabled: 'true'}],
      idProvincia: [''],
      idCanton: [{ value: '', disabled: 'true' }],
      idSector: [{ value: '', disabled: 'true' }],
      lastTimeSeen: ['', MyValidators.correctDate],
      order: ['0'],
    });
  }

  cleanForm() {
    this.petSpecieField.setValue('');
    this.petBreedField.setValue('');
    this.provinciaField.setValue('');
    this.cantonField.setValue('');
    this.sectorField.setValue('');
    this.lastTimeSeenField.setValue('');
    this.orderField.setValue('0');
  }

  toggleFilter() {
    this.filter = !this.filter;
    this.overflowHidden();
  }

  toggleDisabledBreed() {
    this.petSpecieField.valueChanges.subscribe(() => {
      if (this.petSpecieField.value) {
        this.petBreedField.enable();
      } else {
        this.petBreedField.setValue('');
        this.petBreedField.disable();
      }
      if (this.petBreedField.value) {
        this.petBreedField.setValue('');
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
      if (this.cantonField.value) {
        this.cantonField.setValue('');
      }
    });
  }

  toggleDisabledSector() {
    this.cantonField.valueChanges.subscribe(() => {
      if (this.cantonField.value) {
        this.sectorField.enable();
      } else {
        this.sectorField.setValue('');
        this.sectorField.disable();
      }
      if (this.sectorField.value) {
        this.sectorField.setValue('');
      }
    });
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

  get lastTimeSeenField() {
    return this.form.get('lastTimeSeen');
  }

  get lastTimeSeenFieldValid() {
    return this.lastTimeSeenField.touched && this.lastTimeSeenField.valid;
  }

  get lastTimeSeenFieldInvalid() {
    return this.lastTimeSeenField.touched && this.lastTimeSeenField.invalid;
  }

  get orderField() {
    return this.form.get('order');
  }

  private getBreedsBySpecie() {
    if(this.onInit) {
      if(this.petSpecieField.value) {
        this.onInit = false
        this.petBreedField.enable()
        this.categoryService.getBreedsBySpecie(this.petSpecieField.value).subscribe((breeds: breed[] | null) => (this.breeds = breeds));
      }
    }
    this.petSpecieField.valueChanges
      .pipe(
        switchMap((id) => {
          if (id) {
            return this.categoryService.getBreedsBySpecie(id);
          } else {
            return new Observable<null>();
          }
        })
      )
      .subscribe((breeds: breed[] | null) => (this.breeds = breeds));
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
          if (id) {
            return this.categoryService.getCantonesByProv(id);
          } else {
            return new Observable<null>();
          }
        })
      )
      .subscribe((cantones: canton[] | null) => (this.cantones = cantones));
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
}
