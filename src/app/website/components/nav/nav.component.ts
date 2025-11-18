import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { UserView } from "src/app/models/user.model";
import { AuthService } from "src/app/services/auth.service";
import { NoScrollService } from "../../../services/no-scroll.service"



@Component({
  selector: "app-nav",
  templateUrl: "./nav.component.html",
  styleUrls: ["./nav.component.scss"],
})
export class NavComponent implements OnInit {
  user: UserView | null = null;
  toggle: boolean | null = null;
  constructor(
    private authService: AuthService,
    private router: Router,
    private noScrollService: NoScrollService
  ) {}

  ngOnInit(): void {
    this.authService.user$.subscribe((data) => (this.user = data));
  }


  toggleMenu() {
    if (this.toggle != null) {
      this.toggle = !this.toggle;
      this.overflowHiddenBody();
      return;
    }
    this.toggle = true;
    this.overflowHiddenBody()
  }

  overflowHiddenBody() {
    if (this.toggle) {
      this.noScrollService.noScrollEmit(true)
      return;
    }
    this.noScrollService.noScrollEmit(false)
  }


  logout() {
    this.authService.logout();
    this.router.navigate(["/"]);
  }
}
