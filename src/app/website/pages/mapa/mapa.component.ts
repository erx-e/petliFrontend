import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import type * as Leaflet from 'leaflet';
import { of, Subject, Subscription } from 'rxjs';
import { catchError, debounceTime, switchMap } from 'rxjs/operators';
import { specie } from 'src/app/models/category.model';
import {
  MapBounds,
  mapPointView,
  MAX_MAP_POINTS,
  REPORT_TYPE_LABELS,
  ReportType,
} from 'src/app/models/report.model';
import { CategoryService } from 'src/app/services/category.service';
import { ReportService } from 'src/app/services/report.service';
import {
  currentPosition,
  ECUADOR_MAINLAND,
  ECUADOR_MAX_BOUNDS,
  LeafletLib,
  loadLeaflet,
  pinIcon,
  roundCoord,
  TILE_ATTRIBUTION,
  TILE_URL,
} from 'src/app/shared/map/leaflet';

// Vista y filtros de la última visita, en memoria: al volver del detalle de un
// reporte, el mapa sigue donde estaba (no sobrevive a recargar la página).
let lastView: { center: Leaflet.LatLngExpression; zoom: number } | null = null;
let lastType: ReportType | null = null;
let lastSpecie: number | null = null;

const NEAR_ME_ZOOM = 14;

/**
 * /mapa: reportes activos con ubicación (PL-X4). Pide los pines del área
 * visible a GET /report/getMapPoints cada vez que el mapa se detiene, con los
 * filtros de tipo y especie; el backend devuelve como mucho MAX_MAP_POINTS.
 */
@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.scss'],
  standalone: false,
})
export class MapaComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapEl', { static: true }) mapEl!: ElementRef<HTMLDivElement>;

  readonly types: ReportType[] = ['Perdida', 'Encontrada', 'Adopcion', 'Ayuda'];
  readonly labels = REPORT_TYPE_LABELS;

  type: ReportType | null = lastType;
  specieId: number | null = lastSpecie;
  species: specie[] = [];

  points: mapPointView[] = [];
  loaded = false;
  loading = false;
  loadError = false;
  mapFailed = false;
  locating = false;
  geoError: string | null = null;

  private L: LeafletLib | null = null;
  private map: Leaflet.Map | null = null;
  private layer: Leaflet.LayerGroup | null = null;
  private reload$ = new Subject<void>();
  private sub: Subscription | null = null;
  private destroyed = false;

  constructor(
    private reportService: ReportService,
    private categoryService: CategoryService,
    private router: Router,
    private zone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.categoryService.getSpecies().subscribe({
      next: (s) => (this.species = s ?? []),
      error: () => (this.species = []), // sin especies, solo se filtra por tipo
    });

    // switchMap descarta la respuesta de un área que el usuario ya dejó atrás.
    this.sub = this.reload$
      .pipe(
        debounceTime(250),
        switchMap(() => {
          const bounds = this.bounds();
          if (!bounds) return of(null);
          this.loading = true;
          return this.reportService
            .getMapPoints({ type: this.type, petSpecieId: this.specieId }, bounds)
            .pipe(catchError(() => of(undefined)));
        })
      )
      .subscribe((points) => {
        this.loading = false;
        if (points === undefined) {
          this.loadError = true;
        } else if (points) {
          this.loadError = false;
          this.loaded = true;
          this.points = points;
          this.renderPins();
        }
        this.cdr.markForCheck();
      });
  }

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
      this.map = L.map(this.mapEl.nativeElement, { maxBounds: ECUADOR_MAX_BOUNDS, minZoom: 5 });
      L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(this.map);
      this.layer = L.layerGroup().addTo(this.map);
      this.map.on('moveend', () => {
        lastView = { center: this.map!.getCenter(), zoom: this.map!.getZoom() };
        this.zone.run(() => this.reload$.next());
      });
      // setView/fitBounds disparan moveend, que hace la primera carga.
      if (lastView) this.map.setView(lastView.center, lastView.zoom);
      else this.map.fitBounds(ECUADOR_MAINLAND);
    });
  }

  ngOnDestroy() {
    this.destroyed = true;
    this.sub?.unsubscribe();
    this.map?.remove();
    this.map = null;
  }

  setType(type: ReportType | null) {
    this.type = lastType = type;
    this.reload$.next();
  }

  setSpecie(value: string) {
    this.specieId = lastSpecie = value ? Number(value) : null;
    this.reload$.next();
  }

  async locateMe() {
    this.geoError = null;
    this.locating = true;
    try {
      const p = await currentPosition();
      this.map?.setView([p.lat, p.lng], NEAR_ME_ZOOM);
    } catch (msg) {
      this.geoError = typeof msg === 'string' ? msg : 'No pudimos obtener tu ubicación.';
    } finally {
      this.locating = false;
      this.cdr.markForCheck();
    }
  }

  get capped(): boolean {
    return this.points.length >= MAX_MAP_POINTS;
  }

  get status(): string {
    if (this.mapFailed) return 'No pudimos cargar el mapa. Revisa tu conexión y vuelve a intentarlo.';
    if (this.geoError) return this.geoError;
    if (this.loadError) return 'No pudimos cargar los reportes. Mueve el mapa para reintentar.';
    if (!this.loaded) return 'Cargando reportes…';
    if (this.points.length === 0) return 'No hay reportes con ubicación en esta zona.';
    if (this.capped) return `Mostramos los ${MAX_MAP_POINTS} más recientes: acerca el mapa para ver los demás.`;
    return this.points.length === 1 ? '1 reporte en esta zona.' : `${this.points.length} reportes en esta zona.`;
  }

  // Área visible, recortada a rangos válidos (el validador del backend responde
  // 400 fuera de ±90/±180).
  private bounds(): MapBounds | null {
    if (!this.map) return null;
    const b = this.map.getBounds();
    const clamp = (n: number, max: number) => roundCoord(Math.min(max, Math.max(-max, n)));
    return {
      minLat: clamp(b.getSouth(), 90),
      maxLat: clamp(b.getNorth(), 90),
      minLng: clamp(b.getWest(), 180),
      maxLng: clamp(b.getEast(), 180),
    };
  }

  private renderPins() {
    const L = this.L;
    const layer = this.layer;
    if (!L || !layer) return;
    this.zone.runOutsideAngular(() => {
      layer.clearLayers();
      for (const p of this.points) {
        L.marker([p.lat, p.lng], {
          icon: pinIcon(L, p.type),
          title: p.petName ? `${this.labels[p.type]}: ${p.petName}` : this.labels[p.type],
          alt: this.labels[p.type],
        })
          .bindPopup(() => this.popup(p))
          .addTo(layer);
      }
    });
  }

  // El popup se arma con nodos del DOM y textContent, nunca con HTML
  // concatenado: el nombre de la mascota lo escribe quien publica.
  private popup(p: mapPointView): HTMLElement {
    const box = document.createElement('div');
    box.className = 'map-popup';

    if (p.thumbnail && /^https:\/\//.test(p.thumbnail)) {
      const img = document.createElement('img');
      img.className = 'map-popup__img';
      img.src = p.thumbnail;
      img.alt = '';
      img.loading = 'lazy';
      box.appendChild(img);
    }

    const text = document.createElement('div');
    const type = document.createElement('p');
    type.className = 'map-popup__type';
    type.textContent = this.labels[p.type];
    const name = document.createElement('p');
    name.className = 'map-popup__name';
    name.textContent = p.petName || 'Sin nombre';
    const link = document.createElement('a');
    link.className = 'map-popup__link';
    link.href = `/reporte/${p.id}`;
    link.textContent = 'Ver reporte';
    // Navegación del router (sin recargar la app); el href queda para abrir en
    // otra pestaña.
    link.addEventListener('click', (e) => {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      this.zone.run(() => this.router.navigate(['/reporte', p.id]));
    });
    text.append(type, name, link);
    box.appendChild(text);
    return box;
  }
}
