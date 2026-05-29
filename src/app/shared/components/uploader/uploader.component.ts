import { AfterContentInit, AfterViewInit, Component, EventEmitter, Input, Output } from "@angular/core";
import { updateImg } from "src/app/models/postpet.model";

@Component({
    selector: "app-uploader",
    templateUrl: "./uploader.component.html",
    styleUrls: ["./uploader.component.scss"],
    standalone: false
})
export class UploaderComponent {
  isHovering: boolean;

  files: File[] = [];




  @Input() updating: boolean = false;
  @Input() imgsUrlUpdating: updateImg[] = [];
  @Input() imgsUrlUpdatingToShow: updateImg[] = [];

  // Map keyed por el File object (no por file.name). Antes era Map<string,
  // string> por nombre y si dos archivos llegaban con el mismo nombre
  // (móviles que nombran "IMG_0001.jpg" / "image.jpeg" / screenshots con
  // timestamp idéntico al segundo, o el mismo archivo subido dos veces) el
  // segundo set() sobrescribía al primero y solo se enviaba la última URL al
  // backend, aunque las 4 subieran bien a S3.
  imgUrls = new Map<File, string>();
  @Output() change = new EventEmitter<string[]>();
  @Output() changeUpdate = new EventEmitter<updateImg[]>();
  @Output() maxFourLimit = new EventEmitter<boolean>();
  @Input() published: boolean = false;

  toggleHover(event: boolean) {
    this.isHovering = event;
  }

  onDrop(files: FileList) {
    // Cuenta de fotos visibles: archivos nuevos (this.files) + imágenes
    // existentes que se siguen mostrando (imgsUrlUpdatingToShow).
    // NO usar imgsUrlUpdating porque ya incluye las URLs de los archivos
    // recién subidos que también viven en this.files → se contarían dos veces
    // y el "máximo 4" se dispara antes de tiempo (a las 3 reales).
    const currentVisible = this.files.length + this.imgsUrlUpdatingToShow.length;
    if (files.length + currentVisible <= 4) {
      for (let i = 0; i < files.length; i++) {
        this.files.push(files.item(i));
      }
      this.maxFourLimit.emit(false);
    } else {
      this.maxFourLimit.emit(true);
    }
    // Reseteamos el <input file>: sin esto, el evento change no vuelve a
    // dispararse al elegir el mismo archivo y solo se puede subir una imagen.
    const input = document.getElementById("inputElement") as HTMLInputElement | null;
    if (input) {
      input.value = "";
    }
  }

  onDelete(img: { file?: File; key?: string; idImage?: number; url?: string }) {
    if (img.file) {
      this.removeFile(img.file.name);
      this.files = this.files.filter((file) => {
        if (img.file != file) {
          return file;
        }
      });
      if (this.updating) {
        this.imgsUrlUpdating = this.imgsUrlUpdating.filter((imgg) => {
          if (imgg.url != img.url) return imgg;

        });
        this.changeUpdate.emit(this.imgsUrlUpdating);
      } else {
        this.imgUrls.delete(img.file);
        this.change.emit(Array.from(this.imgUrls.values()));
      }
    } else if (this.updating) {
      this.imgsUrlUpdating = this.imgsUrlUpdating.map((imgg) => {
        if (imgg.idImage == img.idImage) {
          return {idImage: img.idImage, url: null} as updateImg;
        }
        return imgg
      });

      this.imgsUrlUpdatingToShow = this.imgsUrlUpdatingToShow.filter((imgg) => imgg.idImage != img.idImage)

      this.changeUpdate.emit(this.imgsUrlUpdating);
    }
  }

  onUpload(img: { file?: File; url?: string }) {
    if (this.updating) {
      this.imgsUrlUpdating.push({ idImage: null, url: img.url });
      this.changeUpdate.emit(this.imgsUrlUpdating);
    }
    if (img.file) {
      this.imgUrls.set(img.file, img.url);
      this.change.emit(Array.from(this.imgUrls.values()));
    }
  }

  removeFile(imgName: string) {
    let dt = new DataTransfer();
    let inputFile = document.getElementById("inputElement") as HTMLInputElement;
    let { files } = inputFile;
    if (files.length == 1) {
      inputFile.value = "";
    } else {
      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        if (imgName !== `${file.name}`) dt.items.add(file);
      }
      inputFile.files = dt.files;
    }
  }
}
