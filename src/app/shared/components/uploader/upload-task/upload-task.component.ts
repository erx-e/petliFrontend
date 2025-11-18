import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { updateImg } from "src/app/models/postpet.model";
import { S3StorageService } from "src/app/services/s3-storage.service";
import { environment } from "src/environments/environment";
import { v4 as uuidv4 } from "uuid";

@Component({
  selector: "app-upload-task",
  templateUrl: "./upload-task.component.html",
  styleUrls: ["./upload-task.component.scss"],
})
export class UploadTaskComponent implements OnInit, OnDestroy {
  constructor(private s3StorageService: S3StorageService) {}

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
      console.log(this.published);
      await this.deleteImg();
    }
  }

  ngOnInit(): void {
    if (this.updating) {
      if (this.file) {
        this.startUpload();
      }
      else{
        this.downloadUrl = this.imgUpdating.url;
        this.idImg = this.imgUpdating.idImage;
      }
    }
    else{
      if (this.file) {
        this.startUpload();
      }
    }
  }


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
  private bucketUrl: string = environment.BUCKET_URL;
  imgKey: string = "";

  async startUpload() {
    this.imgKey = `${uuidv4()}.${this.file.name.split(".").pop()}`;
    console.log("start");
    await this.s3StorageService
      .uploadImage(this.file, this.imgKey)
      .on("httpUploadProgress", (progress) => {
        this.percentage = Math.round((progress.loaded / progress.total) * 100);
      })
      .on("success", () => {
        this.percentage = null;
        this.downloadUrl = `${this.bucketUrl}/${this.imgKey}`;
        if (this.updating) {
          this.uploadedUpdate.emit({
            url: this.downloadUrl,
          });
        } else {
          this.uploaded.emit({ name: this.file.name, url: this.downloadUrl });
        }
      });
  }

  async deleteImg() {
    this.imgKey = this.downloadUrl.split("/").pop();
    this.isLoading = true;
    console.log(this.published)
    console.log(this.updating)
    if (!this.published) {
      if (this.updating) {
        if(this.file){
          await this.s3StorageService
          .deleteImg(this.imgKey)
          .then(() => {
            this.deleted.emit({ file: this.file, key: this.imgKey });

            console.log(`Imagen eliminada ${this.imgKey}`);
            this.downloadUrl = null;
            this.isLoading = false;
          })
          .catch((error) => {
            console.log(error);
          });
        }
        else{
          this.deletedUpdate.emit({
            idImage: this.idImg,
            url: null,
            file: this.file ? this.file : null,
          });
        }
      } else {
        await this.s3StorageService
          .deleteImg(this.imgKey)
          .then(() => {
            this.deleted.emit({ file: this.file, key: this.imgKey });

            console.log(`Imagen eliminada ${this.imgKey}`);
            this.downloadUrl = null;
            this.isLoading = false;
          })
          .catch((error) => {
            console.log(error);
          });
      }
    }
    this.isLoading = false;
  }

  onLoaded() {
    let imgDiv = document.getElementById(this.downloadUrl);
    imgDiv.style.display = "flex";
    this.isImgLoaded = true;
  }
}
