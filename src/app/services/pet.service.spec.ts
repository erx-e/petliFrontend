import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { PetService } from './pet.service';
import { PetCardDTO } from '../models/report.model';
import { environment } from 'src/environments/environment';

describe('PetService', () => {
  let service: PetService;
  let http: HttpTestingController;

  const card: PetCardDTO = {
    petName: 'Luna',
    idPetSpecie: 2,
    idPetBreed: null,
    sex: 'Female',
    birthDate: null,
    petSpecialCondition: null,
    idCanton: 1,
    idSector: null,
    imageKeys: ['0123456789abcdef0123456789abcdef.jpg'],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PetService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('registrar una mascota es POST /pet/create con la ficha y los nombres de sus fotos', () => {
    service.create(card).subscribe();

    const req = http.expectOne(`${environment.API_URL}/pet/create`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.imageKeys).toEqual(card.imageKeys);
    req.flush({});
  });

  it('editar es PUT /pet/update con idPet', () => {
    service.update({ ...card, idPet: 5 }).subscribe();

    const req = http.expectOne(`${environment.API_URL}/pet/update`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body.idPet).toBe(5);
    req.flush({});
  });

  it('un 403 se traduce a un mensaje para la UI', () => {
    let message: unknown;
    service.update({ ...card, idPet: 5 }).subscribe({ error: (e) => (message = e) });

    http.expectOne(`${environment.API_URL}/pet/update`).flush({}, { status: 403, statusText: 'Forbidden' });
    expect(message).toBe('Esta mascota no es tuya');
  });
});
