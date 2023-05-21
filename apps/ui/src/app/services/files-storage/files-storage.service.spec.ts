import { TestBed } from '@angular/core/testing';

import { FilesStorageService } from './files-storage.service';

describe('FilesStorageService', () => {
  let service: FilesStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FilesStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
