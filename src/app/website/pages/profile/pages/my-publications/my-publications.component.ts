import { Component, OnInit } from "@angular/core";
import { UserView } from "src/app/models/user.model";
import { AuthService } from "src/app/services/auth.service";

@Component({
    selector: "app-my-publications",
    templateUrl: "./my-publications.component.html",
    standalone: false
})
export class MyPublicationsComponent implements OnInit {
  constructor(private authService: AuthService) {}

  user: UserView = null;

  ngOnInit(): void {
    this.authService.user$.subscribe((usr) => {
      this.user = usr;
    });
  }
}
