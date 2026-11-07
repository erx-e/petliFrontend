import { CommonModule } from "@angular/common";
import { Component, Input, OnInit, Output, EventEmitter } from "@angular/core";
import { postpetView } from "src/app/models/postpet.model";
import { PostpetComponent } from "../postpet/postpet.component";
import { SharedModule } from "../../shared.module";

@Component({
    selector: "app-postspet",
    templateUrl: "./postspet.component.html",
    styleUrls: ["./postspet.component.scss"],
    standalone: false,
})
export class PostspetComponent implements OnInit {
  constructor() {}

  @Output() loadMore = new EventEmitter();

  @Input() postspet: postpetView[] = [];
  @Input() isLoadingMore: boolean;
  // Antes era un setter que hacia document.getElementById("load-button") para
  // ocultar/mostrar el boton. Dos problemas: el id no es unico (filter renderiza
  // dos <app-postspet>, movil y escritorio) asi que siempre tocaba el primero, y
  // Angular asigna los inputs ANTES de crear la vista del componente, por lo que
  // en el primer set el elemento aun no existe y .style reventaba. Ahora es un
  // binding normal que la plantilla consulta con @if.
  @Input() morePostspet: boolean = true;
  @Input() profilePosts: boolean = false;

  ngOnInit(): void {}

  onLoadMore() {
    this.loadMore.emit("");
  }
}
