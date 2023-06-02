import {ChangeDetectorRef, Component, HostListener, OnInit} from '@angular/core';
import {SpinnerService} from './spinner.service';
import {NGXLogger} from 'ngx-logger';

@Component({
  selector: 'app-spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.css']
})
export class SpinnerComponent implements OnInit {
  show = false;
  constructor(
    private spinnerService: SpinnerService,
    private logger: NGXLogger,
    private changeDetectorRef: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.show = this.spinnerService.isVisible();
    this.logger.debug('spinnerService.ngOnInit()', this.show);
    this.spinnerService.onVisibilityChange().subscribe(visible => {
      this.show = visible;
      this.logger.debug('spinnerService.onVisibilityChange()', this.show);
      this.changeDetectorRef.detectChanges();
    });
  }
}
