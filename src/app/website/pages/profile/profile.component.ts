import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { Subscription } from "rxjs";
import { postpetView } from "src/app/models/postpet.model";
import { UserView } from "src/app/models/user.model";
import { AuthService } from "src/app/services/auth.service";
import { LoadingService } from "src/app/services/loading.service";
import { PostpetService } from "src/app/services/postpet.service";

@Component({
    selector: "app-profile",
    templateUrl: "./profile.component.html",
    styleUrls: ["./profile.component.scss"],
    standalone: false
})
export class ProfileComponent implements OnInit {
  constructor(
    private router: ActivatedRoute,
    private authService: AuthService,
  ) {}

  userId: number = null;
  user: UserView = null;
  postspet: postpetView[] = [];
  isLoading: boolean = false;

  ngOnInit(): void {
    this.router.paramMap.subscribe((params) => {
      if (params.get("id")) {
        this.userId = parseInt(params.get("id"));
        if (!Number.isNaN(this.userId)) {
          this.authService
            .getProfile(this.userId)
            .subscribe((data) => (this.user = data));
        }
      }
    });
  }
}
