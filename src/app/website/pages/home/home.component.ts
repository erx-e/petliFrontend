import { Component, OnInit } from "@angular/core";
import { postpetView } from "src/app/models/postpet.model";
import { PostpetService } from "src/app/services/postpet.service";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
})
export class HomeComponent implements OnInit {
  constructor(private postpetService: PostpetService) {}

  postspetEncuentra: postpetView[] = [null, null, null, null, null];
  postspetDifunde: postpetView[] = [null, null, null, null, null];
  postspetAdopta: postpetView[] = [null, null, null, null, null];
  postspetAyuda: postpetView[] = [null, null, null, null, null];

  ngOnInit(): void {
    this.postpetService
      .getByState("E", 5, 0)
      .subscribe((data) => (this.postspetEncuentra = data));
    this.postpetService
      .getByState("B", 5, 0)
      .subscribe((data) => (this.postspetDifunde = data));
    this.postpetService
      .getByState("H", 5, 0)
      .subscribe((data) => (this.postspetAyuda = data));
    this.postpetService
      .getByState("A", 5, 0)
      .subscribe((data) => (this.postspetAdopta = data));
  }
}
