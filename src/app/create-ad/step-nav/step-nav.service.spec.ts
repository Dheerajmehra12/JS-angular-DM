import { TestBed } from '@angular/core/testing';

import { StepNavService } from './step-nav.service';

describe('StepNavService', () => {
  let service: StepNavService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StepNavService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
