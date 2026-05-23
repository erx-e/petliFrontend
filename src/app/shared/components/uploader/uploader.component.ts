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

  imgUrls = new Map<string, string>();
  @Output() change = new EventEmitter<string[]>();
  @Output() changeUpdate = new EventEmitter<updateImg[]>();
  @Output() maxSixLimit = new EventEmitter<boolean>();
  @Input() published: boolean = false;

  toggleHover(event: boolean) {
    this.isHovering = event;
  }

  onDrop(files: FileList) {
    if (files.length + this.imgsUrlUpdating.length <= 6) {
      for (let i = 0; i < files.length; i++) {
        if (this.files.length + this.imgsUrlUpdating.length <= 6) {
          this.files.push(files.item(i));
          this.maxSixLimit.emit(false);
        } else {
          this.maxSixLimit.emit(true);
        }
      }
    } else {
      this.maxSixLimit.emit(true);
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
        this.imgUrls.delete(img.file.name);
        this.change.emit(Array.from(this.imgUrls.values()));
      }
    } else if (this.updating) {
      this.imgsUrlUpdating = this.imgsUrlUpdating.map((imgg) => {
        if (imgg.idImage == img.idImage) {
          console.log(imgg.idImage, img.idImage)
          return {idImage: img.idImage, url: null} as updateImg;
        }
        return imgg
      });

      this.imgsUrlUpdatingToShow = this.imgsUrlUpdatingToShow.filter((imgg) => imgg.idImage != img.idImage)
      console.log(this.imgsUrlUpdatingToShow)

      this.changeUpdate.emit(this.imgsUrlUpdating);
    }
  }

  onUpload(img: { name?: string; url?: string }) {
    if (this.updating) {
      this.imgsUrlUpdating.push({ idImage: null, url: img.url });
      this.changeUpdate.emit(this.imgsUrlUpdating);
    }
    this.imgUrls.set(img.name, img.url);
    this.change.emit(Array.from(this.imgUrls.values()));
  }

  removeFile(imgName: string) {
    let dt = new DataTransfer();
    let inputFile = document.getElementById("inputElement") as HTMLInputElement;
    console.log(inputFile);
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
    console.log(inputFile.files);
  }
}
