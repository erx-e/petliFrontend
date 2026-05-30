import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { UserView } from "src/app/models/user.model";
import { AuthService } from "src/app/services/auth.service";

@Component({
    selector: "app-profile",
    templateUrl: "./profile.component.html",
    styleUrls: ["./profile.component.scss"],
    standalone: false
})
export class ProfileComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private authService: AuthService
  ) {}

  userId: number = null;
  user: UserView = null;
  // Arranca en true: sin esto, el primer render ocurría con user=null y
  // isLoading=false, mostrando "Usuario no encontrado" durante un instante
  // hasta que respondía getProfile. El "no encontrado" solo debe aparecer
  // cuando la carga termina sin usuario.
  isLoading: boolean = true;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get("id");
      this.userId = id ? parseInt(id) : NaN;

      if (!id || Number.isNaN(this.userId)) {
        this.user = null;
        this.isLoading = false;
        return;
      }

      this.isLoading = true;
      this.user = null;
      this.authService.getProfile(this.userId).subscribe({
        next: (data) => {
          this.user = data;
          this.isLoading = false;
        },
        error: () => {
          this.user = null;
          this.isLoading = false;
        },
      });
    });
  }

  // Inicial para el avatar (no hay imagen de perfil en el modelo).
  get initial(): string {
    return this.user?.name?.trim().charAt(0).toUpperCase() || "?";
  }

  // El campo cellNumber puede traer varios números separados por espacios:
  // los devolvemos por separado para mostrar uno por chip.
  get contactNumbers(): string[] {
    const raw = this.user?.cellNumber?.trim();
    return raw ? raw.split(/\s+/) : [];
  }
}
