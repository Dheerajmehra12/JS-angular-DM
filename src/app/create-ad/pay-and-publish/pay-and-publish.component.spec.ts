import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PayAndPublishComponent } from './pay-and-publish.component';

describe('PayAndPublishComponent', () => {
  let component: PayAndPublishComponent;
  let fixture: ComponentFixture<PayAndPublishComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PayAndPublishComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PayAndPublishComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
