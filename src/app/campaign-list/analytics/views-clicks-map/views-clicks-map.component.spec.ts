import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewsClicksMapComponent } from './views-clicks-map.component';

describe('ViewsClicksMapComponent', () => {
  let component: ViewsClicksMapComponent;
  let fixture: ComponentFixture<ViewsClicksMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ViewsClicksMapComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewsClicksMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
