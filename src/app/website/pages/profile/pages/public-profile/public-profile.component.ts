import { Component, OnInit } from "@angular/core";
import {
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from "@angular/forms";
import { UserView, UpdateUserDTO } from "src/app/models/user.model";
import { AuthService } from "src/app/services/auth.service";
import { UserService } from "src/app/services/user.service";

@Component({
  selector: "app-public-profile",
  templateUrl: "./public-profile.component.html",
  styleUrls: ["./public-profile.component.scss"],
})
export class PublicProfileComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private formBuilder: UntypedFormBuilder
  ) {
    this.buildForm();
  }
  user: UserView = null;
  userUpdate: UpdateUserDTO = {
    idUser: null,
    name: null,
    email: null,
    cellNumber: null,
  };

  form: UntypedFormGroup;
  disableForm: boolean = true;
  emailAlreadyRegistered: boolean = false;

  cellNumbers: string[] = [];
  maxFourCellNumbers: boolean = false;

  ngOnInit(): void {
    this.authService.user$.subscribe((usr) => {
      this.user = usr;
      this.patchForm(usr);
    });
  }

  editInfo() {
    if (this.form.valid) {
      this.userUpdate = this.form.value;
      this.userUpdate.idUser = this.user.idUser;
      this.userUpdate.cellNumber =
        this.cellNumbers != this.cellNumberField.value
          ? this.cellNumberField.value.join(" ")
          : null;
      this.userService.update(this.userUpdate).subscribe((newUser) => {
        this.user = newUser;
        console.log(newUser);
        this.patchForm(newUser);
        this.toggleForm();
      });
    } else {
      this.form.markAllAsTouched();
    }
  }

  patchForm(usr: UserView) {
    this.form.reset();

    this.form.patchValue({ name: usr.name, email: usr.email });
    if (usr.cellNumber) {
      this.cellNumbers = usr.cellNumber.match(/\S+/g);
      console.log(this.cellNumbers.length);
      if (this.cellNumberField.length > 1) {
        while (this.cellNumberField.length > 1) {
          this.cellNumberField.removeAt(0);
        }
        this.cellNumberField.setValue([
          new UntypedFormControl({ value: "", disabled: true }, [
            Validators.required,
            Validators.minLength(10),
            Validators.maxLength(10),
            Validators.pattern(/^[0-9]*$/),
          ]),
        ]);
      }
      for (let i = 1; i < this.cellNumbers.length; i++) {
        this.addContactField();
        console.log(i);
      }
      this.cellNumberField.patchValue(this.cellNumbers);
    }
  }

  toggleForm() {
    this.disableForm = !this.disableForm;
    let inputContact = document.getElementById("contact") as HTMLElement;
    if (this.disableForm) {
      inputContact.style.width = "100%";
      this.form.disable();
    } else {
      this.form.enable();
      inputContact.style.width = "87.65%";
    }
  }

  private buildForm() {
    this.form = this.formBuilder.group({
      name: [
        { value: "", disabled: true },
        [
          Validators.required,
          Validators.pattern(/^([Aa-zA-ZáéíóúÁÉÍÓÚÑñ]{2,}\s?){2,4}$/),
        ],
      ],
      email: [
        { value: "", disabled: true },
        [Validators.required, Validators.email],
      ],
      cellNumber: this.formBuilder.array([
        new UntypedFormControl({ value: "", disabled: true }, [
          Validators.required,
          Validators.minLength(10),
          Validators.maxLength(10),
          Validators.pattern(/^[0-9]*$/),
        ]),
      ]),
    });
  }

  addContactField() {
    if (this.cellNumberField.length < 4) {
      this.maxFourCellNumbers = false;
      this.cellNumberField.push(this.CreateContactField());
    } else {
      this.maxFourCellNumbers = true;
    }
  }

  private CreateContactField() {
    return new UntypedFormControl(
      { value: "", disabled: this.disableForm ? true : false },
      [
        Validators.minLength(10),
        Validators.maxLength(10),
        Validators.pattern(/^[0-9]*$/),
      ]
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

  get cellNumberField() {
    return this.form.get("cellNumber") as UntypedFormArray;
  }
}
