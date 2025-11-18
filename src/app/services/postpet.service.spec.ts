import { TestBed } from '@angular/core/testing';

import { PostpetService } from './postpet.service';

describe('PostpetService', () => {
  let service: PostpetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PostpetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
