import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from "@angular/core";
import { imgView } from "src/app/models/report.model";

/** Una foto de la lista: guardada (`existing`), o nueva (`file`) que obtiene
 *  `key`/`url` cuando su subida termina. */
interface UploadItem {
  id: number;
  file?: File;
  key?: string;
  url?: string;
  existing: boolean;
}

let nextInputId = 0;
let nextItemId = 0;

/**
 * Lista de fotos de un formulario, en un solo modo (crear y editar son lo mismo).
 * Entra la lista inicial `{ key, url }` (vacía al crear) y sale, en cada cambio,
 * la lista COMPLETA de nombres en orden: la que se manda al backend como
 * `imageKeys` / `petImageKeys`. La primera es la principal.
 *
 * Cada foto la dibuja un <app-upload-task>, que sube las nuevas y descarta en el
 * servidor las que se quitan antes de guardar. Una foto guardada que se quita
 * solo sale de la lista: el backend la borra al guardar.
 */
@Component({
  selector: "app-uploader",
  templateUrl: "./uploader.component.html",
  styleUrls: ["./uploader.component.scss"],
  standalone: false,
})
export class UploaderComponent {
  /** true cuando el formulario se guardó (las subidas ya están vinculadas). */
  @Input() published = false;
  /** Máximo de fotos visibles a la vez. */
  @Input() max = 4;

  /** Fotos ya guardadas. Puede llegar tarde (la precarga de editar es
   *  asíncrona): reemplaza las existentes y conserva las nuevas. */
  @Input() set initial(images: imgView[] | null) {
    const existing = (images ?? []).map((img) => ({ id: nextItemId++, key: img.key, url: img.url, existing: true }));
    this.items = [...existing, ...this.items.filter((item) => !item.existing)];
  }

  @Output() keysChange = new EventEmitter<string[]>();
  @Output() limitReached = new EventEmitter<boolean>();

  @ViewChild("fileInput") fileInput?: ElementRef<HTMLInputElement>;

  /** id único: puede haber dos uploaders en la misma página. */
  readonly inputId = `uploader-${nextInputId++}`;
  items: UploadItem[] = [];
  isHovering = false;

  toggleHover(event: boolean) {
    this.isHovering = event;
  }

  onDrop(files: FileList) {
    if (files.length + this.items.length > this.max) {
      this.limitReached.emit(true);
    } else {
      for (let i = 0; i < files.length; i++) {
        this.items.push({ id: nextItemId++, file: files.item(i)!, existing: false });
      }
      this.limitReached.emit(false);
    }
    // Sin resetear el <input file>, elegir el mismo archivo otra vez no dispara
    // (change).
    if (this.fileInput) this.fileInput.nativeElement.value = "";
  }

  onUploaded(item: UploadItem, img: imgView) {
    item.key = img.key;
    item.url = img.url;
    this.emitKeys();
  }

  onRemoved(item: UploadItem) {
    this.items = this.items.filter((i) => i !== item);
    this.limitReached.emit(false);
    this.emitKeys();
  }

  // Solo cuentan las fotos con nombre: las guardadas y las nuevas ya subidas.
  private emitKeys() {
    this.keysChange.emit(this.items.filter((i) => i.key).map((i) => i.key!));
  }
}
