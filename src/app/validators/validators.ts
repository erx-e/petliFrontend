import { AbstractControl } from '@angular/forms';

export class MyValidators {
  static matchPassword(control: AbstractControl) {
    if (
      control.get('password')?.valid &&
      control.get('confirmPassword')?.valid
    ) {
      const password = control.get('password')?.value;
      const confirmPassword = control.get('confirmPassword')?.value;

      if (password === confirmPassword) {
        return null;
      }
      return { match_password: true };
    }
    return null;
  }

  static correctDate(control: AbstractControl) {
    if (control.value) {
      const dateLost: Date = new Date(control.value);

      const dateNow = new Date();

      if (dateLost <= dateNow) {
        return null;
      }
      return { invalid_date: true };
    }
    return null;
  }
}
