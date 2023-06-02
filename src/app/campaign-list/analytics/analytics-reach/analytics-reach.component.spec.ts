import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalyticsReachComponent } from './analytics-reach.component';

describe('AnalyticsReachComponent', () => {
  let component: AnalyticsReachComponent;
  let fixture: ComponentFixture<AnalyticsReachComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnalyticsReachComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalyticsReachComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
