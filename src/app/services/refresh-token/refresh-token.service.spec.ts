import { TestBed, inject } from '@angular/core/testing';

import { RefreshTokenService } from './refresh-token.service';

describe('RefreshTokenService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RefreshTokenService]
    });
  });

  it('should ...', inject([RefreshTokenService], (service: RefreshTokenService) => {
    expect(service).toBeTruthy();
  }));
});
