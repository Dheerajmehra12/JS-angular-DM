import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RounderBarChartComponent } from './rounder-bar-chart.component';

describe('RounderBarChartComponent', () => {
  let component: RounderBarChartComponent;
  let fixture: ComponentFixture<RounderBarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RounderBarChartComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RounderBarChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
