import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalyticsPrintonlyHeaderComponent } from './analytics-printonly-header.component';

describe('AnalyticsPrintonlyHeaderComponent', () => {
  let component: AnalyticsPrintonlyHeaderComponent;
  let fixture: ComponentFixture<AnalyticsPrintonlyHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AnalyticsPrintonlyHeaderComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalyticsPrintonlyHeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
