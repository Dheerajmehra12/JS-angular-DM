import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalyticsDashboardAllComponent } from './analytics-dashboard-all.component';

describe('AnalyticsDashboardAllComponent', () => {
  let component: AnalyticsDashboardAllComponent;
  let fixture: ComponentFixture<AnalyticsDashboardAllComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnalyticsDashboardAllComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalyticsDashboardAllComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
