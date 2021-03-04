import { TestBed } from '@angular/core/testing';

import { BaskervilleService } from './baskerville.service';

describe('BaskervilleService', () => {
  let service: BaskervilleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BaskervilleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

