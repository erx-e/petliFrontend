import { ageFromBirthDate, birthDateFromAge, locationHint, requiresLastSeen } from './report.model';

describe('report.model', () => {
  it('requiresLastSeen: solo los avistamientos', () => {
    expect(requiresLastSeen('Perdida')).toBeTrue();
    expect(requiresLastSeen('Encontrada')).toBeTrue();
    expect(requiresLastSeen('Adopcion')).toBeFalse();
    expect(requiresLastSeen('Ayuda')).toBeFalse();
    expect(requiresLastSeen(null)).toBeFalse();
  });

  it('birthDateFromAge y ageFromBirthDate son inversas (a mes cumplido)', () => {
    const birthDate = birthDateFromAge(2, 3);
    expect(birthDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(ageFromBirthDate(birthDate)).toEqual({ years: 2, months: 3 });
  });

  it('sin edad no hay fecha', () => {
    expect(birthDateFromAge(null, null)).toBeNull();
    expect(birthDateFromAge(0, 0)).toBeNull();
    expect(ageFromBirthDate(null)).toBeNull();
  });

  it('locationHint: en adopción y ayuda advierte que el punto es público', () => {
    expect(locationHint('Perdida')).toContain('se perdió');
    expect(locationHint('Encontrada')).toContain('la viste');
    expect(locationHint('Adopcion')).toContain('a la vista de todos');
    expect(locationHint('Ayuda')).toContain('a la vista de todos');
  });
});
