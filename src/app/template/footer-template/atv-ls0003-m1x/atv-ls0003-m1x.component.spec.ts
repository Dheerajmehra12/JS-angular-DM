import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AtvLs0003M1xComponent } from './atv-ls0003-m1x.component';

describe('AtvLs0003M1xComponent', () => {
  let component: AtvLs0003M1xComponent;
  let fixture: ComponentFixture<AtvLs0003M1xComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AtvLs0003M1xComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AtvLs0003M1xComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
