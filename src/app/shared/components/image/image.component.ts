import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";

@Component({
    selector: "app-image",
    templateUrl: "./image.component.html",
    styleUrls: ["./image.component.scss"],
    standalone: false
})
export class ImageComponent implements OnInit {
  constructor() {}

  img: string = "";

  @Input("img")
  set changeImg(newImg: string) {
    this.img = newImg;
  }

  @Output() imgLoaded = new EventEmitter<HTMLImageElement>();

  reload(){
    this.img = this.img
  }

  @Input() alt: string = "";

  ngOnInit(): void {}

  onLoaded(event: Event){
    this.imgLoaded.emit(event.target as HTMLImageElement);
  }
}
