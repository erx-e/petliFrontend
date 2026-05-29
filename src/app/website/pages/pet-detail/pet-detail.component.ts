import { Component, ElementRef, HostListener, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Location } from "@angular/common";
import { switchMap } from "rxjs/operators";
import { img, postpetView } from "src/app/models/postpet.model";
import { UserView } from "src/app/models/user.model";
import { PostpetService } from "src/app/services/postpet.service";
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
    private postpetService: PostpetService,
    private location: Location,
    private authService: AuthService,
    private loadingService: LoadingService
  ) {}

  postpetId: string | null = null;
  postpet: postpetView | null = null;
  // Imágenes a mostrar en la galería, deduplicadas por URL. Publicaciones
  // antiguas (creadas antes del arreglo de nombres duplicados en S3) pueden
  // traer varias entradas con la MISMA url. Como el @for usa `track img.url`,
  // esas entradas se colapsaban en un solo slide, pero el `loop` del swiper se
  // activaba según urlImgs.length → Swiper quedaba con 1 slide real y loop
  // activo ("not enough slides for loop mode") y dejaba de funcionar.
  galleryImgs: img[] = [];
  user: UserView | null;
  lastTimeSeen: string = "";
  notFound: boolean = false;
  isLoading: boolean = true;
  contactNum: string[] = [];

  // Estado del diálogo de confirmación de borrado: visible / en vuelo / error.
  // Antes el clic en "Eliminar" disparaba la request de inmediato, sin feedback
  // ni posibilidad de cancelar.
  showDeleteConfirm: boolean = false;
  isDeleting: boolean = false;
  deleteError: string | null = null;

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
            return this.postpetService.getById(parseInt(this.postpetId));
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
            this.lastTimeSeen = format(
              new Date(this.postpet.lastTimeSeen),
              "dd 'de' MMMM 'del' yyyy 'a las' HH:mm",
              { locale: es }
            );
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

  // El botón "Eliminar" ya no borra: abre la confirmación. La eliminación real
  // ocurre en confirmDelete() para que el usuario pueda revisar y cancelar.
  deletePost() {
    this.deleteError = null;
    this.showDeleteConfirm = true;
  }

  cancelDelete() {
    if (this.isDeleting) return; // No permitir cerrar a mitad de la request.
    this.showDeleteConfirm = false;
    this.deleteError = null;
  }

  confirmDelete() {
    if (this.isDeleting || !this.postpet) return;
    this.isDeleting = true;
    this.deleteError = null;
    this.postpetService.delete(parseInt(this.postpet.id)).subscribe({
      next: () => {
        // Mantener isDeleting=true: el modal sigue mostrando "Eliminando…" hasta
        // que el router nos saca de esta pantalla. Evita un parpadeo del estado
        // base entre la respuesta y la navegación.
        this.location.back();
      },
      error: () => {
        this.isDeleting = false;
        this.deleteError =
          "No pudimos eliminar la publicación. Inténtalo de nuevo en un momento.";
      },
    });
  }

  @HostListener("document:keydown.escape")
  onEscapeKey() {
    if (this.showDeleteConfirm) {
      this.cancelDelete();
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
  private dedupeImgsByUrl(imgs: img[] | null | undefined): img[] {
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

  // Etiqueta del estado para el badge del detalle.
  get stateLabel(): string {
    switch (this.postpet?.petStateId) {
      case "B":
        return "Perdido";
      case "E":
        return "Encontrado";
      case "A":
        return "En adopción";
      case "H":
        return "Necesita ayuda";
      default:
        return "";
    }
  }
}
