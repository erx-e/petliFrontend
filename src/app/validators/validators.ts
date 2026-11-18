import { AbstractControl } from '@angular/forms';

// Nombre de usuario: copia literal de UserRules.NamePattern del backend (F-1, D48). Sin
// cuantificadores anidados: coste lineal aunque Angular la evalúe con un nombre largo.
export const USER_NAME_PATTERN =
  /^[a-zA-ZáéíóúÁÉÍÓÚÑñüÜ](?:[a-zA-ZáéíóúÁÉÍÓÚÑñüÜ]|\s[a-zA-ZáéíóúÁÉÍÓÚÑñüÜ])+\s?$/;

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
