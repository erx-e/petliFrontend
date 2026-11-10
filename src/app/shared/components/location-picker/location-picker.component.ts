import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  forwardRef,
  NgZone,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import type * as Leaflet from 'leaflet';
import {
  currentPosition,
  ECUADOR_MAINLAND,
  ECUADOR_MAX_BOUNDS,
  GeoPoint,
  LeafletLib,
  loadLeaflet,
  pinIcon,
  roundCoord,
  TILE_ATTRIBUTION,
  TILE_URL,
} from '../../map/leaflet';

const PICKED_ZOOM = 16;

/**
 * Control de formulario para marcar un punto en el mapa (opcional).
 * Valor: GeoPoint | null. Se usa con formControlName="location".
 *
 * El punto se marca tocando el mapa, arrastrando el pin o con "Usar mi
 * ubicación". Leaflet corre fuera de la zona de Angular (cada movimiento del
 * ratón dispararía detección de cambios); solo se vuelve a la zona al cambiar
 * el valor.
 */
@Component({
  selector: 'app-location-picker',
  templateUrl: './location-picker.component.html',
  styleUrls: ['./location-picker.component.scss'],
  standalone: false,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LocationPickerComponent),
      multi: true,
    },
  ],
})
export class LocationPickerComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {
  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  value: GeoPoint | null = null;
  disabled = false;
  locating = false;
  geoError: string | null = null;
  mapFailed = false;

  private L: LeafletLib | null = null;
  private map: Leaflet.Map | null = null;
  private marker: Leaflet.Marker | null = null;
  private destroyed = false;

  private onChange: (v: GeoPoint | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private zone: NgZone, private cdr: ChangeDetectorRef) {}

  async ngAfterViewInit() {
    try {
      this.L = await loadLeaflet();
    } catch {
      this.mapFailed = true;
      this.cdr.markForCheck();
      return;
    }
    if (this.destroyed) return;

    this.zone.runOutsideAngular(() => {
      const L = this.L!;
      this.map = L.map(this.mapEl.nativeElement, {
        maxBounds: ECUADOR_MAX_BOUNDS,
        minZoom: 5,
        // Dentro de un formulario, la rueda debe desplazar la página, no hacer
        // zoom. Quedan los botones +/- y el gesto de pellizco.
        scrollWheelZoom: false,
      });
      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(this.map);
      this.map.on('click', (e: Leaflet.LeafletMouseEvent) => {
        if (this.disabled) return;
        this.zone.run(() => this.pick(e.latlng.lat, e.latlng.lng, false));
      });
    });
    this.render(true);
  }

  ngOnDestroy() {
    this.destroyed = true;
    this.map?.remove();
    this.map = null;
  }

  // --- ControlValueAccessor ---

  writeValue(v: GeoPoint | null): void {
    this.value = v && v.lat != null && v.lng != null ? { lat: Number(v.lat), lng: Number(v.lng) } : null;
    this.render(true);
  }

  registerOnChange(fn: (v: GeoPoint | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.disabled = disabled;
    if (this.marker) {
      disabled ? this.marker.dragging?.disable() : this.marker.dragging?.enable();
    }
  }

  // --- Acciones ---

  async useMyLocation() {
    this.geoError = null;
    this.locating = true;
    try {
      const p = await currentPosition();
      this.pick(p.lat, p.lng, true);
    } catch (msg) {
      this.geoError = typeof msg === 'string' ? msg : 'No pudimos obtener tu ubicación.';
    } finally {
      this.locating = false;
      this.cdr.markForCheck();
    }
  }

  clear() {
    this.value = null;
    this.geoError = null;
    this.render(false);
    this.onChange(null);
    this.onTouched();
  }

  private pick(lat: number, lng: number, recenter: boolean) {
    this.value = { lat: roundCoord(lat), lng: roundCoord(lng) };
    this.geoError = null;
    this.render(recenter);
    this.onChange(this.value);
    this.onTouched();
  }

  // Sincroniza el pin con el valor. recenter: mueve la vista al punto (o a
  // Ecuador si no hay punto); sin él, la vista se queda donde la dejó el usuario.
  private render(recenter: boolean) {
    const L = this.L;
    const map = this.map;
    if (!L || !map) return; // el mapa aún no cargó: ngAfterViewInit llama a render

    this.zone.runOutsideAngular(() => {
      if (this.value) {
        const at: Leaflet.LatLngExpression = [this.value.lat, this.value.lng];
        if (this.marker) {
          this.marker.setLatLng(at);
        } else {
          this.marker = L.marker(at, {
            icon: pinIcon(L, 'pick'),
            draggable: !this.disabled,
            keyboard: false,
          }).addTo(map);
          this.marker.on('dragend', () => {
            const ll = this.marker!.getLatLng();
            this.zone.run(() => this.pick(ll.lat, ll.lng, false));
          });
        }
        if (recenter) map.setView(at, Math.max(map.getZoom() ?? 0, PICKED_ZOOM));
      } else {
        this.marker?.remove();
        this.marker = null;
        if (recenter) map.fitBounds(ECUADOR_MAINLAND);
      }
    });
  }
}
