import {Component, OnInit} from '@angular/core';
import {StepNavService} from '../step-nav/step-nav.service';
import {NGXLogger} from 'ngx-logger';
import {Router} from '@angular/router';
import {Title} from '@angular/platform-browser';
declare const appConfig: any;
@Component({
  selector: 'app-targeting',
  templateUrl: './targeting.component.html',
  styleUrls: ['./targeting.component.css']
})
export class TargetingComponent implements OnInit {
  constructor(
    private stepNavService: StepNavService,
    private logger: NGXLogger,
    private router: Router,
    private titleService: Title,
  ) {
    this.logger.info('inside targeting component');
   }

  ngOnInit(): void {
    this.titleService.setTitle(`${appConfig.appDisplayName}: Targeting`);
  }
}
