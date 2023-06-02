import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtvLs0002M1xComponent } from './atv-ls0002-m1x.component';

describe('AtvLs0002M1xComponent', () => {
  let component: AtvLs0002M1xComponent;
  let fixture: ComponentFixture<AtvLs0002M1xComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AtvLs0002M1xComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AtvLs0002M1xComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
