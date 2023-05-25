import { TestBed } from '@angular/core/testing';

import { JsonParseService } from './json-parse.service';

describe('JsonParseService', () => {
  let service: JsonParseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JsonParseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
