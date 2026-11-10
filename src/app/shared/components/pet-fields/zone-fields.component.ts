import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { UntypedFormGroup } from "@angular/forms";
import { of, Subscription } from "rxjs";
import { distinctUntilChanged, startWith, switchMap } from "rxjs/operators";
import { canton, provincia, sector } from "src/app/models/category.model";
import { CategoryService } from "src/app/services/category.service";

/**
 * La cascada provincia → cantón → sector. La provincia es solo de la UI: el
 * backend guarda el cantón (y el sector) y deriva la provincia. Trabaja sobre el
 * FormGroup del padre, con los controles idProvincia, idCanton e idSector.
 *
 * Precargar (editar) es poner los tres valores con setValue: las listas se
 * cargan solas. Cambiar la provincia o el cantón A MANO limpia lo que depende
 * de él.
 */
@Component({
  selector: "app-zone-fields",
  templateUrl: "./zone-fields.component.html",
  styleUrls: ["./pet-fields.scss"],
  standalone: false,
})
export class ZoneFieldsComponent implements OnInit, OnDestroy {
  @Input({ required: true }) group!: UntypedFormGroup;
  @Input() idPrefix = "zone";

  provincias: provincia[] = [];
  cantones: canton[] = [];
  sectores: sector[] = [];
  private subs = new Subscription();

  constructor(private categories: CategoryService) {}

  ngOnInit(): void {
    this.categories.getProvincias().subscribe((p) => (this.provincias = p ?? []));

    const prov = this.group.get("idProvincia")!;
    const canton = this.group.get("idCanton")!;
    this.subs.add(
      prov.valueChanges
        .pipe(
          startWith(prov.value),
          distinctUntilChanged(),
          switchMap((id) => (id ? this.categories.getCantonesByProv(Number(id)) : of([] as canton[])))
        )
        .subscribe((c) => {
          this.cantones = c ?? [];
          if (prov.value) canton.enable({ emitEvent: false });
          else canton.disable({ emitEvent: false });
        })
    );
    this.subs.add(
      canton.valueChanges
        .pipe(
          startWith(canton.value),
          distinctUntilChanged(),
          switchMap((id) => (id ? this.categories.getSectoresByCanton(Number(id)) : of([] as sector[])))
        )
        .subscribe((s) => (this.sectores = s ?? []))
    );
  }

  onProvinciaChange() {
    this.group.get("idCanton")!.setValue("");
    this.group.get("idSector")!.setValue("");
  }

  onCantonChange() {
    this.group.get("idSector")!.setValue("");
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  invalid(name: string): boolean {
    const c = this.group.get(name)!;
    return c.touched && c.invalid;
  }
}
