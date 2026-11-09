import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { ReportService } from './report.service';
import { environment } from 'src/environments/environment';

describe('ReportService', () => {
  let service: ReportService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ReportService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('getByFilter manda solo los filtros con valor, por nombre', () => {
    service.getByFilter({ type: 'Perdida', status: null, petSpecieId: 1, cantonId: undefined }, 5, 0).subscribe();

    const req = http.expectOne((r) => r.url === `${environment.API_URL}/report/getByFilter`);
    expect(req.request.params.get('type')).toBe('Perdida');
    expect(req.request.params.get('petSpecieId')).toBe('1');
    expect(req.request.params.get('limit')).toBe('5');
    expect(req.request.params.has('status')).toBeFalse();   // null => no se manda (el backend asume Activo)
    expect(req.request.params.has('cantonId')).toBeFalse(); // undefined => no se manda
    req.flush([]);
  });

  it('getMapPoints manda el viewport completo y nunca order', () => {
    service.getMapPoints({ order: 1 }, { minLat: -3, maxLat: -1, minLng: -81, maxLng: -79 }).subscribe();

    const req = http.expectOne((r) => r.url === `${environment.API_URL}/report/getMapPoints`);
    expect(req.request.params.get('minLat')).toBe('-3');
    expect(req.request.params.get('maxLng')).toBe('-79');
    expect(req.request.params.has('order')).toBeFalse();
    req.flush([]);
  });

  it('resolve hace PUT a /report/resolve/{id}', () => {
    service.resolve(7).subscribe();

    const req = http.expectOne(`${environment.API_URL}/report/resolve/7`);
    expect(req.request.method).toBe('PUT');
    req.flush({ id: 7, type: 'Perdida', status: 'Resuelto', idPet: 1, resolvedAt: '2026-11-09' });
  });
});
