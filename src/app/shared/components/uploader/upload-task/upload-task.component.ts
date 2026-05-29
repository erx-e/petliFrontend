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
import { updateImg } from "src/app/models/postpet.model";
import { S3StorageService } from "src/app/services/s3-storage.service";
import { TokenService } from "src/app/services/token.service";

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

  @Input() imgUpdating: updateImg = null;
  @Input() updating: boolean = false;
  @Output() deletedUpdate = new EventEmitter<updateImg>();
  @Output() uploadedUpdate = new EventEmitter<updateImg>();
  idImg: number = null;

  @Input() file: File = null;
  downloadUrl: string = null;
  @Input() published: boolean = false;
  @Output() deleted = new EventEmitter<{ file: File; key: string }>();
  // Emite el File además de la URL: el padre lo usa como clave única en su
  // Map<File, string>. Antes emitía { name, url } y el padre keyeaba por
  // name → archivos con nombres iguales se sobreescribían y se perdían URLs.
  @Output() uploaded = new EventEmitter<{ file: File; url: string }>();

  // Empieza en null (no en 0) para que el @if del progress-container solo se
  // active cuando arranca una subida real. Si lo dejamos en 0, las imágenes
  // que solo se muestran (existentes en modo editar: file=null, imgUpdating
  // con URL) renderizarían un "Subiendo imagen" fantasma a 0% hasta que la
  // <img> dispara (load), lo que se veía como una segunda subida en paralelo
  // a la del archivo nuevo. startUpload() pone percentage = 0 al empezar.
  percentage: number | null = null;
  isImgLoaded: boolean = false;
  // True cuando el <img> dispara (error): URL inalcanzable (404/403 de S3 por
  // objeto huérfano). Mostramos un placeholder dentro del .img-container y
  // mantenemos visible el botón de borrar para limpiar la referencia.
  imgFailed: boolean = false;
  isLoading: boolean = false;
  imgKey: string = "";
  // Mensaje de error de la subida; se muestra en la tarjeta de la imagen.
  errorMessage: string = null;

  // URL pública que devuelve el backend; se asigna a downloadUrl solo cuando la
  // subida termina, para no intentar mostrar la imagen antes de tiempo.
  private publicUrl: string = null;

  ngOnInit(): void {
    if (this.updating) {
      if (this.file) {
        this.startUpload();
      } else {
        this.downloadUrl = this.imgUpdating.url;
        this.idImg = this.imgUpdating.idImage;
      }
    } else {
      if (this.file) {
        this.startUpload();
      }
    }
  }

  @HostListener("window:beforeunload")
  async ngOnDestroy(): Promise<void> {
    if (this.updating) {
      if (!this.idImg && !this.published) {
        await this.deleteImg();
        return;
      } else {
        return;
      }
    }

    if (this.downloadUrl && !this.published) {
      await this.deleteImg();
    }
  }

  // Genera un nombre de archivo único conservando la extensión original (para
  // que el backend infiera bien el Content-Type / extensión de la key). Usa
  // crypto.randomUUID() cuando está disponible (https/localhost) y, si no, un
  // fallback con timestamp + aleatorio. Evita colisiones de key en S3 entre
  // archivos que comparten nombre.
  private uniqueFileName(originalName: string): string {
    const dot = originalName.lastIndexOf(".");
    const ext = dot >= 0 ? originalName.slice(dot) : "";
    const unique =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `${unique}${ext}`;
  }

  startUpload() {
    this.errorMessage = null;
    // Sin sesión, el backend rechazaría la URL firmada con 401: no intentamos
    // subir y avisamos directamente que hay que iniciar sesión.
    if (!this.tokenService.getToken()) {
      this.percentage = null;
      this.errorMessage = "Inicia sesión para subir imágenes";
      return;
    }
    this.percentage = 0;
    // 1) Pedimos al backend la URL firmada; 2) subimos el archivo directo a S3.
    // Enviamos un nombre ÚNICO por archivo (no el original): el backend deriva
    // la key del objeto S3 a partir del fileName, así que dos archivos con el
    // mismo nombre (p. ej. varias "image.jpg" desde el móvil) generaban la misma
    // key, se sobreescribían en el bucket y devolvían la MISMA publicUrl. Como
    // el padre acumula las URLs, todas terminaban siendo idénticas y solo se
    // guardaba/mostraba una imagen. Un nombre único garantiza una key, un objeto
    // y una publicUrl distintos por archivo.
    this.s3StorageService
      .getPresignedUploadUrl(this.uniqueFileName(this.file.name), this.file.type)
      .pipe(
        switchMap((presigned) => {
          this.imgKey = presigned.key;
          this.publicUrl = presigned.publicUrl;
          return this.s3StorageService.uploadToPresignedUrl(
            presigned.uploadUrl,
            this.file
          );
        })
      )
      .subscribe({
        next: (event) => {
          if (event.type === HttpEventType.UploadProgress) {
            this.percentage = Math.round(
              (event.loaded / (event.total ?? event.loaded)) * 100
            );
          } else if (event.type === HttpEventType.Response) {
            // Subida completada. Dejamos la barra al 100% (no la ocultamos aún)
            // y asignamos la URL: el <img> empieza a cargar oculto. La barra se
            // ocultará en onLoaded(), cuando la imagen ya esté lista, evitando
            // el hueco en blanco entre la barra y la foto.
            this.percentage = 100;
            this.downloadUrl = this.publicUrl;
            if (this.updating) {
              this.uploadedUpdate.emit({ url: this.downloadUrl });
            } else {
              this.uploaded.emit({
                file: this.file,
                url: this.downloadUrl,
              });
            }
          }
        },
        error: (error) => {
          console.error("Error al subir la imagen:", error);
          this.percentage = null;
          if (error?.status === HttpStatusCode.Unauthorized) {
            this.errorMessage = "Inicia sesión para subir imágenes";
          } else {
            this.errorMessage = "No se pudo subir la imagen, inténtalo de nuevo";
          }
        },
      });
  }

  async deleteImg() {
    // Para imágenes recién subidas ya tenemos la key; para imágenes existentes
    // (modo edición) la derivamos del último segmento de la URL pública.
    if (!this.imgKey && this.downloadUrl) {
      this.imgKey = this.downloadUrl.split("/").pop();
    }
    this.isLoading = true;

    if (!this.published) {
      if (this.updating) {
        if (this.file) {
          try {
            await firstValueFrom(this.s3StorageService.deleteImage(this.imgKey));
            this.deleted.emit({ file: this.file, key: this.imgKey });
            this.downloadUrl = null;
          } catch (error) {
            console.error("Error al eliminar la imagen:", error);
          }
        } else {
          this.deletedUpdate.emit({
            idImage: this.idImg,
            url: null,
            file: this.file ? this.file : null,
          });
        }
      } else {
        try {
          await firstValueFrom(this.s3StorageService.deleteImage(this.imgKey));
          this.deleted.emit({ file: this.file, key: this.imgKey });
          this.downloadUrl = null;
        } catch (error) {
          console.error("Error al eliminar la imagen:", error);
        }
      }
    }
    this.isLoading = false;
  }

  onLoaded() {
    // Imágenes cacheadas pueden disparar (load) sincrónicamente al insertar el
    // <img>, en algunas implementaciones fuera de la zona de Angular: forzamos
    // que el flag y la CD ocurran en el mismo tick para que el swap progress
    // → thumbnail sea atómico y no se vea brevemente como "dos cuadros".
    this.ngZone.run(() => {
      this.isImgLoaded = true;
      this.cdr.markForCheck();
    });
  }

  onImgError() {
    // Mismo motivo que en onLoaded: (error) puede llegar fuera de la zona si
    // la URL falla de forma síncrona desde caché del navegador.
    this.ngZone.run(() => {
      this.imgFailed = true;
      this.cdr.markForCheck();
    });
  }
}
