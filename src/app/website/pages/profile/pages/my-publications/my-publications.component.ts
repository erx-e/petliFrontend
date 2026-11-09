import { Component, OnInit } from "@angular/core";
import { UserView } from "src/app/models/user.model";
import { AuthService } from "src/app/services/auth.service";

@Component({
    selector: "app-my-publications",
    templateUrl: "./my-publications.component.html",
    styles: [`
      .publicationPage__title {
        font-family: var(--font-heading);
        font-size: var(--text-lg);
        margin: var(--space-4) 0 var(--space-2);
      }
    `],
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
