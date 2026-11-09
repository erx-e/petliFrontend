import { Component, ElementRef, HostListener, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import { switchMap } from "rxjs/operators";
import {
  ageLabel,
  imgView,
  PET_SEX_LABELS,
  REPORT_TYPE_AREA,
  REPORT_TYPE_LABELS,
  RESOLVED_LABELS,
  reportView,
  requiresLastSeen,
} from "src/app/models/report.model";
import { UserView } from "src/app/models/user.model";
import { ReportService } from "src/app/services/report.service";
import { AuthService } from "src/app/services/auth.service";
import { of } from "rxjs";
import format from "date-fns/format";
import es from "date-fns/locale/es";
import { LoadingService } from "src/app/services/loading.service";

@Component({
    selector: "app-pet-detail",
    templateUrl: "./pet-detail.component.html",
    styleUrls: ["./pet-detail.component.scss"],
    standalone: false
})
export class PetDetailComponent implements OnInit {
  constructor(
    private router: ActivatedRoute,
    private reportService: ReportService,
    private location: Location,
    private authService: AuthService,
    private loadingService: LoadingService
  ) {}

  // Detalle de un reporte (ruta reporte/:id, D17). Los nombres postpet* vienen de v1.
  postpetId: string | null = null;
  postpet: reportView | null = null;
  // Imágenes a mostrar en la galería, deduplicadas por URL. Publicaciones
  // antiguas (creadas antes del arreglo de nombres duplicados en S3) pueden
  // traer varias entradas con la MISMA url. Como el @for usa `track img.url`,
  // esas entradas se colapsaban en un solo slide, pero el `loop` del swiper se
  // activaba según urlImgs.length → Swiper quedaba con 1 slide real y loop
  // activo ("not enough slides for loop mode") y dejaba de funcionar.
  galleryImgs: imgView[] = [];
  user: UserView | null;
  lastTimeSeen: string = "";
  notFound: boolean = false;
  isLoading: boolean = true;
  contactNum: string[] = [];

  // Diálogo de confirmación de las acciones del dueño que no se deshacen:
  // eliminar y resolver ("¡Está en casa!"). Acción pendiente / en vuelo / error.
  confirmAction: "delete" | "resolve" | null = null;
  isWorking: boolean = false;
  actionError: string | null = null;
  resolvedAt: string = "";

  readonly requiresLastSeen = requiresLastSeen;

  // URLs cuyo <img> disparó (error): típicamente objetos de S3 que ya no existen
  // en el bucket o quedaron sin permisos de lectura pública (403). Sin esto, el
  // navegador muestra el icono de imagen rota dentro del slide del swiper.
  failedImgUrls = new Set<string>();

  ngOnInit(): void {
    this.authService.user$.subscribe((data) => (this.user = data));
    this.loadingService.isLoading$.subscribe((isL) => (this.isLoading = isL));
    this.router.paramMap
      .pipe(
        switchMap((params) => {
          this.postpetId = params.get("id");
          if (this.postpetId) {
            return this.reportService.getById(parseInt(this.postpetId));
          } else {
            this.notFound = true;
          }
          return of(null);
        })
      )
      .subscribe(
        (data) => {
          if (data) {
            this.postpet = data;
            this.galleryImgs = this.dedupeImgsByUrl(data.urlImgs);
            this.lastTimeSeen = this.formatDate(data.lastTimeSeen);
            this.resolvedAt = this.formatDate(data.resolvedAt);
            if(this.postpet.contact){
              this.contactNum = this.postpet.contact.trim().split(/\s+/)
            }
          }
        },
        () => {
          this.notFound = true;
        }
      );
  }

  // "Eliminar" y "Resolver" no actúan al clic: abren la confirmación, y la
  // acción real ocurre en confirm() para que el usuario pueda cancelar.
  askConfirm(action: "delete" | "resolve") {
    this.actionError = null;
    this.confirmAction = action;
  }

  cancelConfirm() {
    if (this.isWorking) return; // No permitir cerrar a mitad de la request.
    this.confirmAction = null;
    this.actionError = null;
  }

  confirm() {
    if (this.isWorking || !this.postpet || !this.confirmAction) return;
    this.isWorking = true;
    this.actionError = null;

    if (this.confirmAction === "delete") {
      this.reportService.delete(this.postpet.id).subscribe({
        next: () => {
          // Mantener isWorking=true: el modal sigue mostrando "Eliminando…"
          // hasta que el router nos saca de esta pantalla (evita un parpadeo).
          this.location.back();
        },
        error: (err) => {
          this.isWorking = false;
          this.actionError =
            typeof err === "string" ? err : "No pudimos eliminar la publicación.";
        },
      });
      return;
    }

    this.reportService.resolve(this.postpet.id).subscribe({
      next: (result) => {
        this.isWorking = false;
        this.confirmAction = null;
        this.postpet = { ...this.postpet, status: result.status, resolvedAt: result.resolvedAt };
        this.resolvedAt = this.formatDate(result.resolvedAt);
      },
      error: (err) => {
        this.isWorking = false;
        this.actionError =
          typeof err === "string" ? err : "No pudimos marcarla como resuelta.";
      },
    });
  }

  @HostListener("document:keydown.escape")
  onEscapeKey() {
    if (this.confirmAction) {
      this.cancelConfirm();
    }
  }

  // Setter de ViewChild: Angular lo invoca cuando el <swiper-container> entra
  // (o vuelve a entrar) al DOM, con sus <swiper-slide> ya proyectados. Recién
  // ahí inicializamos Swiper a mano, así nunca arranca con menos slides de los
  // reales. El elemento se recrea en cada carga (está bajo *ngIf="!isLoading"),
  // por lo que el setter dispara con la galleryImgs vigente en cada publicación.
  @ViewChild("swiperEl") set swiperEl(ref: ElementRef | undefined) {
    if (!ref) return;
    this.setupSwiper(ref.nativeElement);
  }

  private setupSwiper(el: any) {
    if (!el || el.swiper) return; // ya inicializado: evita doble init.
    Object.assign(el, {
      pagination: true,
      navigation: true,
      autoHeight: true,
      observer: true,
      observeParents: true,
      observeSlideChildren: true,
      // Solo con 2+ imágenes reales: con 1 sola, loop dispararía el warning
      // "not enough slides for loop mode" y rompería el carrusel.
      loop: this.galleryImgs.length > 1,
    });
    el.initialize();
  }

  // Quita imágenes con URL repetida o vacía conservando el orden. Mantiene la
  // galería y la condición de `loop` del swiper alineadas con los slides reales.
  private dedupeImgsByUrl(imgs: imgView[] | null | undefined): imgView[] {
    const seen = new Set<string>();
    return (imgs ?? []).filter((image) => {
      if (!image?.url || seen.has(image.url)) return false;
      seen.add(image.url);
      return true;
    });
  }

  onImgError(url: string) {
    this.failedImgUrls.add(url);
  }

  goToBack() {
    this.location.back();
  }

  private formatDate(value: string | null): string {
    return value
      ? format(new Date(value), "dd 'de' MMMM 'del' yyyy 'a las' HH:mm", { locale: es })
      : "";
  }

  get isResolved(): boolean {
    return this.postpet?.status === "Resuelto";
  }

  // Badge: el tipo, o cómo terminó si ya está resuelto. Mismos mapas que la
  // tarjeta (PostpetComponent), para que no diverjan.
  get stateLabel(): string {
    const report = this.postpet;
    if (!report) return "";
    return this.isResolved ? RESOLVED_LABELS[report.type] ?? "" : REPORT_TYPE_LABELS[report.type] ?? "";
  }

  get stateClass(): string {
    const report = this.postpet;
    if (!report) return "";
    return "stateBadge state--" + (this.isResolved ? "Resuelto" : report.type);
  }

  // Ruta de edición: cada tipo se edita en su área.
  get editLink(): string[] {
    return this.postpet ? ["/" + REPORT_TYPE_AREA[this.postpet.type] + "/editar", String(this.postpet.id)] : [];
  }

  // Texto del botón de resolver: el de la pérdida es el momento feliz.
  get resolveLabel(): string {
    return this.postpet?.type === "Perdida" ? "¡Está en casa!" : "Marcar como resuelto";
  }

  // Edad para el chip: la estimada (inline) o la derivada de la fecha de
  // nacimiento del pet (Perdida).
  get ageText(): string | null {
    return this.postpet?.petAge || ageLabel(this.postpet?.birthDate ?? null);
  }

  get sexText(): string | null {
    const sex = this.postpet?.sex;
    return sex && sex !== "Unknown" ? PET_SEX_LABELS[sex] : null;
  }
}
