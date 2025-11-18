import { Component, OnInit } from "@angular/core";
import { UntypedFormBuilder, UntypedFormGroup, Validators } from "@angular/forms";
import { UpdateUserDTO } from "src/app/models/user.model";
import { AuthService } from "src/app/services/auth.service";
import { UserService } from "src/app/services/user.service";
import { MyValidators } from "src/app/validators/validators";

@Component({
  selector: "app-account",
  templateUrl: "./account.component.html",
  styleUrls: ["./account.component.scss"],
})
export class AccountComponent implements OnInit {
  constructor(
    private formBuilder: UntypedFormBuilder,
    private userService: UserService,
    private authService: AuthService
  ) {
    this.buildForm();
  }

  ngOnInit(): void {
    this.authService.user$.subscribe(
      (usr) => (this.userUpdate.idUser = usr.idUser)
    );
  }

  form: UntypedFormGroup;
  userUpdate: UpdateUserDTO = {
    idUser: null,
    password: null,
    oldPassword: null,
  };

  wrongPass: boolean = false;
  passChanged: boolean = false;

  isLoading: boolean = false;

  showOldPassword: boolean = false;
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  changeOldPasswordVisibility() {
    this.showOldPassword = !this.showOldPassword;
  }

  changePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  changeConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  buildForm() {
    this.form = this.formBuilder.group(
      {
        oldPassword: ["", Validators.required],
        password: [
          "",
          [
            Validators.required,
            Validators.minLength(6),
            Validators.pattern(
              /^((?=\S*?[A-Z])(?=\S*?[a-z])(?=\S*?[0-9]).{6,})\S$/
            ),
          ],
        ],
        confirmPassword: ["", Validators.required],
      },
      {
        validators: MyValidators.matchPassword,
      }
    );
  }

  changePassword() {
    if (this.form.valid) {
      this.isLoading = true;
      this.passChanged = false;
      this.userUpdate.oldPassword = this.oldPasswordField.value;
      this.userUpdate.password = this.passwordField.value;
      this.userService.update(this.userUpdate).subscribe(
        () => {
          this.form.reset();
          this.wrongPass = false;
          this.passChanged = true;
          this.isLoading = false;
          console.log("Contraseña cambiada");
        },
        (error: string) => {
          this.isLoading = false;
          if(error == "Incorrect password"){
            this.wrongPass = true;
          }
        }
      );
    } else {
      this.form.markAllAsTouched();
    }
  }

  deleteAccount() {
    this.userService.delete(this.userUpdate.idUser);
  }

  get oldPasswordField() {
    return this.form.get("oldPassword");
  }
  get oldPasswordFieldValid() {
    return this.oldPasswordField.touched && this.oldPasswordField.valid && !this.wrongPass;
  }

  get oldPasswordFieldInvalid() {
    return (this.oldPasswordField.touched && this.oldPasswordField.invalid) || this.wrongPass;
  }

  get passwordField() {
    return this.form.get("password");
  }
  get passwordFieldValid() {
    return this.passwordField.touched && this.passwordField.valid;
  }

  get passwordFieldInvalid() {
    return this.passwordField.touched && this.passwordField.invalid;
  }

  get confirmPasswordField() {
    return this.form.get("confirmPassword");
  }
  get confirmPasswordFieldValid() {
    return this.confirmPasswordField.touched && this.confirmPasswordField.valid;
  }

  get confirmPasswordFieldInvalid() {
    return (
      this.confirmPasswordField.touched && this.confirmPasswordField.invalid
    );
  }
}
