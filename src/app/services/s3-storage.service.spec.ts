import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { S3StorageService } from './s3-storage.service';

describe('S3StorageService', () => {
  let service: S3StorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(S3StorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
