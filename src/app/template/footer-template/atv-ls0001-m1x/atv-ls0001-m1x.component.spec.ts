import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtvLs0001M1xComponent } from './atv-ls0001-m1x.component';

describe('AtvLs0001M1xComponent', () => {
  let component: AtvLs0001M1xComponent;
  let fixture: ComponentFixture<AtvLs0001M1xComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AtvLs0001M1xComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AtvLs0001M1xComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
