import { TestBed } from '@angular/core/testing';

import { EditorFacadeService } from './editor-facade.service';

describe('EditorFacadeService', () => {
  let service: EditorFacadeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EditorFacadeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
