import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { HttpEventType, HttpStatusCode } from "@angular/common/http";
import { firstValueFrom } from "rxjs";
import { switchMap } from "rxjs/operators";
import { imgView } from "src/app/models/report.model";
import { S3StorageService } from "src/app/services/s3-storage.service";
import { TokenService } from "src/app/services/token.service";

/**
 * Una foto del uploader. Dos casos:
 * - `file`: foto nueva. Se sube al iniciar (URL firmada → PUT directo a S3) y,
 *   al terminar, emite `uploaded` con su `{ key, url }`. Hasta que el formulario
 *   se guarde, es una subida PENDIENTE: si el usuario la quita, o se va sin
 *   guardar, se descarta en el servidor.
 * - `existing`: foto ya guardada (modo editar). Solo se muestra; quitarla no
 *   llama al servidor: el backend la borra al guardar, porque ya no viene en la
 *   lista de fotos.
 */
@Component({
  selector: "app-upload-task",
  templateUrl: "./upload-task.component.html",
  styleUrls: ["./upload-task.component.scss"],
  standalone: false,
})
export class UploadTaskComponent implements OnInit, OnDestroy {
  constructor(
    private s3StorageService: S3StorageService,
    private tokenService: TokenService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  @Input() file: File | null = null;
  @Input() existing: imgView | null = null;
  /** true cuando el formulario se guardó: las subidas ya quedaron vinculadas y
   *  no hay que descartarlas al destruir el componente. */
  @Input() published = false;

  @Output() uploaded = new EventEmitter<imgView>();
  @Output() removed = new EventEmitter<void>();

  downloadUrl: string | null = null;

  // Empieza en null (no en 0) para que el @if del progress-container solo se
  // active cuando arranca una subida real: una foto existente no debe mostrar un
  // "Subiendo imagen" fantasma mientras su <img> carga.
  percentage: number | null = null;
  isImgLoaded = false;
  // True cuando el <img> dispara (error): URL inalcanzable. Se muestra un
  // placeholder y se mantiene el botón de quitar.
  imgFailed = false;
  isLoading = false;
  errorMessage: string | null = null;

  // Nombre que generó el backend para la foto nueva (su subida pendiente).
  private pendingKey: string | null = null;
  // URL pública: se asigna a downloadUrl solo cuando la subida termina.
  private publicUrl: string | null = null;

  ngOnInit(): void {
    if (this.file) {
      this.startUpload();
    } else if (this.existing) {
      this.downloadUrl = this.existing.url;
    }
  }

  @HostListener("window:beforeunload")
  async ngOnDestroy(): Promise<void> {
    // Una subida que no llegó a guardarse se descarta (best-effort: si falla, el
    // backend la purga sola a las 25 h).
    if (this.pendingKey && !this.published) {
      await this.discardPending();
    }
  }

  startUpload() {
    this.errorMessage = null;
    // Sin sesión, el backend rechazaría la firma con 401: avisamos sin intentar.
    if (!this.tokenService.getToken()) {
      this.percentage = null;
      this.errorMessage = "Inicia sesión para subir imágenes";
      return;
    }
    this.percentage = 0;
    // 1) El backend firma y genera el nombre; 2) subimos directo a S3.
    this.s3StorageService
      .getPresignedUploadUrl(this.file!.type)
      .pipe(
        switchMap((presigned) => {
          this.pendingKey = presigned.key;
          this.publicUrl = presigned.publicUrl;
          return this.s3StorageService.uploadToPresignedUrl(presigned.uploadUrl, this.file!);
        })
      )
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            this.percentage = Math.round((event.loaded / (event.total ?? event.loaded)) * 100);
          } else if (event.type === HttpEventType.Response) {
            // Subida completa. La barra queda al 100% hasta que la imagen cargue
            // (onLoaded), para no dejar un hueco en blanco entre las dos.
            this.percentage = 100;
            this.downloadUrl = this.publicUrl;
            this.uploaded.emit({ key: this.pendingKey!, url: this.publicUrl! });
          }
        },
        error: (error) => {
          console.error("Error al subir la imagen:", error);
          this.percentage = null;
          if (error?.status === HttpStatusCode.Unauthorized) {
            this.errorMessage = "Inicia sesión para subir imágenes";
          } else if (error?.status === HttpStatusCode.TooManyRequests) {
            this.errorMessage = "Subiste muchas fotos sin publicar. Publica o quita algunas e inténtalo de nuevo.";
          } else {
            this.errorMessage = "No se pudo subir la imagen, inténtalo de nuevo";
          }
        },
      });
  }

  // Botón "quitar". Una foto existente solo sale de la lista (el backend la
  // borra al guardar); una nueva ya subida se descarta en el servidor.
  async remove() {
    if (this.pendingKey) {
      this.isLoading = true;
      await this.discardPending();
      this.isLoading = false;
    }
    this.downloadUrl = null;
    this.removed.emit();
  }

  private async discardPending() {
    const key = this.pendingKey;
    this.pendingKey = null;
    try {
      await firstValueFrom(this.s3StorageService.deleteImage(key!));
    } catch (error) {
      // No bloquea: el backend purga las subidas abandonadas.
      console.error("No se pudo descartar la imagen:", error);
    }
  }

  onLoaded() {
    // Imágenes cacheadas pueden disparar (load) sincrónicamente al insertar el
    // <img>, en algunas implementaciones fuera de la zona de Angular: forzamos
    // que el flag y la CD ocurran en el mismo tick para que el cambio barra →
    // miniatura sea atómico.
    this.ngZone.run(() => {
      this.isImgLoaded = true;
      this.cdr.markForCheck();
    });
  }

  onImgError() {
    // Mismo motivo que en onLoaded.
    this.ngZone.run(() => {
      this.imgFailed = true;
      this.cdr.markForCheck();
    });
  }
}
