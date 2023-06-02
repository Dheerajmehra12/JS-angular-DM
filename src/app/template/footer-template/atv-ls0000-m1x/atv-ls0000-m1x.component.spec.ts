import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtvLs0000M1xComponent } from './atv-ls0000-m1x.component';

describe('AtvLs0000M1xComponent', () => {
  let component: AtvLs0000M1xComponent;
  let fixture: ComponentFixture<AtvLs0000M1xComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AtvLs0000M1xComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AtvLs0000M1xComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
