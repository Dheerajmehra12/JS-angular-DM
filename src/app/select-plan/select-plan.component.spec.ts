import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { SelectPlanComponent } from './select-plan.component';

describe('SelectPlanComponent', () => {
  let component: SelectPlanComponent;
  let fixture: ComponentFixture<SelectPlanComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectPlanComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectPlanComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
