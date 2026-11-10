import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { S3StorageService } from './s3-storage.service';
import { environment } from 'src/environments/environment';

describe('S3StorageService', () => {
  let service: S3StorageService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(S3StorageService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('la firma manda solo el tipo de imagen: el nombre lo genera el backend', () => {
    service.getPresignedUploadUrl('image/png').subscribe();

    const req = http.expectOne(`${environment.API_URL}/s3/presigned-upload`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ contentType: 'image/png' });
    req.flush({ uploadUrl: 'u', key: 'k', publicUrl: 'p' });
  });

  it('descartar una subida pendiente usa su key, escapada', () => {
    service.deleteImage('a b.png').subscribe();

    const req = http.expectOne(`${environment.API_URL}/s3/object/a%20b.png`);
    expect(req.request.method).toBe('DELETE');
    req.flush(true);
  });
});
