import { TestBed } from '@angular/core/testing';

import { EditorViewService } from './editor-view.service';

describe('EditorViewService', () => {
  let service: EditorViewService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EditorViewService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
