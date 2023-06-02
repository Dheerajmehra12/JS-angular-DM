import { TestBed } from '@angular/core/testing';

import { PersonalProfileService } from './personal-profile.service';

describe('PersonalProfileService', () => {
  let service: PersonalProfileService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PersonalProfileService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
