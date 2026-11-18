import { USER_NAME_PATTERN } from './validators';

// La expresión que se sustituyó (retroceso catastrófico, D48). Solo vive aquí, como oráculo.
const LEGACY_NAME_PATTERN = /^([Aa-zA-ZáéíóúÁÉÍÓÚÑñ]{2,}\s?){2,4}$/;

// Los mismos casos que UserValidatorTests del backend (sin los de 60 y 61 caracteres: la longitud
// la pone Validators.maxLength).
const LEGACY_NAMES = [
  'Cristian', 'Juan', 'Ana María', 'Jo Al', 'Juan Carlos Pérez Muñoz', 'Juan ', 'Ana\tMaría',
  'ÁLVARO', 'Ñandú Ñu',
];
const NAMES_IN_LANGUAGE = [
  'José Ortega y Gasset', 'Juan P', 'Ana', 'Li', 'María de los Ángeles Pérez', 'Argüello',
  'Pérez e Iglesias',
];
const NAMES_OUTSIDE_LANGUAGE = ['A', ' Juan', 'Juan  Pérez', 'Pérez-Ortega', "O'Brien", 'Juan2', ''];

function shortStrings(alphabet: string[], maxLength: number): string[] {
  let level = [''];
  const all = [''];
  for (let length = 1; length <= maxLength; length++) {
    level = level.flatMap((prefix) => alphabet.map((c) => prefix + c));
    all.push(...level);
  }
  return all;
}

describe('USER_NAME_PATTERN', () => {
  it('USER_NAME_PATTERN accepts every name the legacy pattern accepts', () => {
    const corpus = [...shortStrings(['a', ' ', '\n', '1'], 8), ...LEGACY_NAMES];
    const missing = corpus.filter((s) => LEGACY_NAME_PATTERN.test(s) && !USER_NAME_PATTERN.test(s));
    expect(missing).toEqual([]);
    LEGACY_NAMES.forEach((name) => expect(LEGACY_NAME_PATTERN.test(name)).withContext(name).toBeTrue());
  });

  it('USER_NAME_PATTERN accepts and rejects the same explicit names as the backend', () => {
    NAMES_IN_LANGUAGE.forEach((name) => expect(USER_NAME_PATTERN.test(name)).withContext(name).toBeTrue());
    NAMES_OUTSIDE_LANGUAGE.forEach((name) => expect(USER_NAME_PATTERN.test(name)).withContext(name).toBeFalse());
  });

  it('USER_NAME_PATTERN evaluates a 10000-character malicious name in under 100 ms', () => {
    const malicious = 'a'.repeat(9999) + '!';
    USER_NAME_PATTERN.test('Juan Pérez'); // calentamiento

    const start = performance.now();
    const matched = USER_NAME_PATTERN.test(malicious);
    const elapsed = performance.now() - start;

    expect(matched).toBeFalse();
    expect(elapsed).toBeLessThan(100);
  });
});
