import { TestBed } from '@angular/core/testing';

import { NoScrollService } from './no-scroll.service';

describe('NoScrollService', () => {
  let service: NoScrollService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NoScrollService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
