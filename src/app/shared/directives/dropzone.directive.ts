import { Directive, EventEmitter, HostListener, Output } from '@angular/core';

@Directive({
    selector: '[dropzone]',
    standalone: false
})
export class DropzoneDirective {

  constructor() { }


  @Output() dropped =  new EventEmitter<FileList>();
  @Output() hovered =  new EventEmitter<boolean>();

  @HostListener('drop', ['$event'])
  onDrop($event) {
    console.log($event, "drop")
    $event.preventDefault();
    this.dropped.emit($event.dataTransfer.files);
    this.hovered.emit(false);
  }

  @HostListener('dragover', ['$event'])
  onDragOver($event) {
    console.log($event, "dragover")
    $event.preventDefault();
    this.hovered.emit(true);
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave($event) {
    console.log($event, "dragleave")
    $event.preventDefault();
    this.hovered.emit(false);
  }

}
