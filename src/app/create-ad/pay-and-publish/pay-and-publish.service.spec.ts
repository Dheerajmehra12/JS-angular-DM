import { TestBed } from '@angular/core/testing';

import { PayAndPublishService } from './pay-and-publish.service';

describe('PayAndPublishService', () => {
  let service: PayAndPublishService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PayAndPublishService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
