import {Component, OnInit, EventEmitter, Output, Input} from '@angular/core';
import { StepNavService } from '../../step-nav/step-nav.service';
import { NGXLogger } from 'ngx-logger';

@Component({
  selector: 'app-create-ad-footer',
  templateUrl: './create-ad-footer.component.html',
  styleUrls: ['./create-ad-footer.component.css']
})
export class CreateAdFooterComponent implements OnInit {
  @Output() footerNext: EventEmitter<any> = new EventEmitter<any>();
  @Output() footerPrevious: EventEmitter<any> = new EventEmitter<any>();
  @Input() disableNext = false;
  @Input() disablePrevious = false;
  @Input() hidePrevious = false;
  @Input() nextButtonLabel = 'Next';
  @Input() previousButtonLabel = 'Back';
  constructor(private stepNavService: StepNavService,
              public logger: NGXLogger) { }

  ngOnInit(): void {
  }

  gotoPreviousPage() {
    this.footerPrevious.emit(this.stepNavService.prevStep());
  }
  gotoNextPage() {
    this.footerNext.emit(this.stepNavService.nextStep());
  }
}
