import { TestBed } from '@angular/core/testing';

import { WebcontainersService } from './webcontainers.service';

describe('WebcontainersService', () => {
  let service: WebcontainersService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WebcontainersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
