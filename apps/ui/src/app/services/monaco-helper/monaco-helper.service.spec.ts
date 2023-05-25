import { TestBed } from '@angular/core/testing';

import { MonacoHelperService } from './monaco-helper.service';

describe('MonacoHelperService', () => {
  let service: MonacoHelperService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MonacoHelperService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
