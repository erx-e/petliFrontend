import {
  Component,
  EventEmitter,
  HostListener,
  Input,
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
    private tokenService: TokenService
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
  @Output() uploaded = new EventEmitter<{ name: string; url: string }>();

  percentage: number = 0;
  isImgLoaded: boolean = false;
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
    this.s3StorageService
      .getPresignedUploadUrl(this.file.name, this.file.type)
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
            // Subida completada: ya es seguro mostrar la imagen.
            this.percentage = null;
            this.downloadUrl = this.publicUrl;
            if (this.updating) {
              this.uploadedUpdate.emit({ url: this.downloadUrl });
            } else {
              this.uploaded.emit({
                name: this.file.name,
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
            console.log(`Imagen eliminada ${this.imgKey}`);
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
          console.log(`Imagen eliminada ${this.imgKey}`);
          this.downloadUrl = null;
        } catch (error) {
          console.error("Error al eliminar la imagen:", error);
        }
      }
    }
    this.isLoading = false;
  }

  onLoaded() {
    let imgDiv = document.getElementById(this.downloadUrl);
    if (imgDiv) {
      imgDiv.style.display = "flex";
    }
    this.isImgLoaded = true;
  }
}
