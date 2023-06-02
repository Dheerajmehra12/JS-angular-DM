import {Component, Input, OnInit} from '@angular/core';
import {AnalyticsTab} from '../analytics.service';
import { TranslateService } from '../../../services/translate';

@Component({
  selector: 'app-analytics-printonly-header',
  templateUrl: './analytics-printonly-header.component.html',
  styleUrls: ['./analytics-printonly-header.component.css']
})
export class AnalyticsPrintonlyHeaderComponent implements OnInit {
  @Input() tab: AnalyticsTab;
  @Input() active: boolean;

    constructor(private _translate: TranslateService) { }

  ngOnInit(): void {
    this._translate.use(localStorage.getItem('language'));
  }

}
