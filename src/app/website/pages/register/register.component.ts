import { Component, OnInit } from "@angular/core";
import { CreateUserDTO } from "src/app/models/user.model";
import { UserService } from "src/app/services/user.service";
import { Validators, FormGroup, FormBuilder } from "@angular/forms";
import { MyValidators } from "src/app/validators/validators";
import { ActivatedRoute, Router } from "@angular/router";
import { userErrors } from "src/app/models/errorsModelBinding";

@Component({
  selector: "app-register",
  templateUrl: "./register.component.html",
  styleUrls: ["./register.component.scss"],
})
export class RegisterComponent implements OnInit {

  constructor(
    private userService: UserService,
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
  ) {
    this.buildForm();
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((param) =>{
      if( param.get("user_email")){
        this.emailField.setValue(param.get("user_email"))
      }
    })
  }
  form: FormGroup;

  showPassword: boolean = false;
  showConfirmPassword: boolean = false;
  isLoading: boolean = false;
  user: CreateUserDTO;
  emailAlreadyRegistered: boolean = false;


  changePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  changeConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }


  createUser() {
    if (this.form.valid) {
      this.isLoading = true;
      this.user = this.form.value;
      this.userService.create(this.user).subscribe(
        () => {
          this.isLoading = false;
          this.router.navigate(["home"]);
        },
        (error: userErrors) => {
          console.log(error);
          this.isLoading = false;
          if(error.email){
            this.emailAlreadyRegistered = true;
          }
        }
      );
    }
    this.form.markAllAsTouched();
  }

  private buildForm() {
    this.form = this.formBuilder.group(
      {
        name: [
          "",
          [
            Validators.required,
            Validators.pattern(/^([Aa-zA-ZáéíóúÁÉÍÓÚÑñ]{2,}\s?){2,4}$/),
          ],
        ],
        email: ["", [Validators.required, Validators.email]],
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

  get nameField() {
    return this.form.get("name");
  }

  get nameFieldValid() {
    return this.nameField.touched && this.nameField.valid;
  }

  get nameFieldInvalid() {
    return this.nameField.touched && this.nameField.invalid;
  }

  get emailField() {
    return this.form.get("email");
  }

  get emailFieldValid() {
    return this.emailField.touched && this.emailField.valid;
  }

  get emailFieldInvalid() {
    return this.emailField.touched && this.emailField.invalid;
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
