import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CreateAdFooterComponent } from './create-ad-footer.component';

describe('CreateAdFooterComponent', () => {
  let component: CreateAdFooterComponent;
  let fixture: ComponentFixture<CreateAdFooterComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateAdFooterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateAdFooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
