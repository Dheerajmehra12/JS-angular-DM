import {
  AfterViewInit,
  Component,
  ElementRef, EventEmitter,
  HostListener, Input,
  OnInit,
  Output,
  QueryList,
  ViewChildren
} from '@angular/core';
import {StepNavService} from './step-nav.service';
import {NGXLogger} from 'ngx-logger';
import {WebStorageService} from '../../services/web-storage.service';
import {tap} from 'rxjs/operators';
import { TranslateService } from '../../services/translate';


@Component({
  selector: 'app-step-nav',
  templateUrl: './step-nav.component.html'
})
export class StepNavComponent implements OnInit, AfterViewInit {
  steps: Array<any>;
  @ViewChildren('adcreateStep') adcreateStep: QueryList<ElementRef>;
  @Output() stepChange: EventEmitter<any> = new EventEmitter<any>();
  private onSmallScreen = false;

  constructor(
    private stepNavService: StepNavService,
    private storageService: WebStorageService,
    private logger: NGXLogger,
    private _translate: TranslateService
  ) { }

  ngOnInit(): void {
    this._translate.use(localStorage.getItem('language'));
    this.stepNavService.getSteps().subscribe((steps) => this.steps = steps);
  }

  ngAfterViewInit(): void {
    this.onNavChange(this.stepNavService.currStep());
  }

  stepChanged(step) {
    this.stepChange.emit(step);
  }

  prevStep() {
    this.stepChange.emit(this.stepNavService.prevStep());
  }

  nextStep() {
    this.stepChange.emit(this.stepNavService.nextStep());
  }

  private onNavChange(currStep) {
    this.logger.debug(`onNavChange(${JSON.stringify(currStep)})`);
    this.onSmallScreen = window.matchMedia('(max-width: 576px)').matches;
    this.logger.debug(`this.onSmallScreen = ${this.onSmallScreen}`);
    if (this.adcreateStep) {
      if (this.onSmallScreen) {
        const value = (currStep.number - 1) * (-100);
        this.adcreateStep.forEach(item => {
          item.nativeElement.style.transform = 'translateX(' + value + '%)';
          item.nativeElement.style.transition = 'transform .5s ease, opacity .25s ease-out';
        });
      } else {
        this.adcreateStep.forEach(item => {
          item.nativeElement.style.transform = 'none';
          item.nativeElement.style.transition = 'none';
        });
      }
    }
  }

  @HostListener('window:resize', [])
  private bindToWindowResize() {
    this.onNavChange(this.stepNavService.currStep());
  }
}
