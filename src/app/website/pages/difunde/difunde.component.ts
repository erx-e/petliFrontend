import { Component, OnInit } from "@angular/core";
import { PetStatus } from "src/app/models/postpet.model";

@Component({
    selector: "app-encuentra",
    template: `<app-filter [status]="status"></app-filter>`,
    standalone: false
})
export class DifundeComponent implements OnInit {
  ngOnInit(): void {}
  status: PetStatus = "Buscado";
}
