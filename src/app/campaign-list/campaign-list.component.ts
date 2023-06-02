import {Component, HostListener, OnInit} from '@angular/core';
import {NGXLogger} from 'ngx-logger';
import {CampaignListService} from './campaign-list.service';
import {AppEventsService} from '../services/common/app-events.service';

@Component({
  selector: 'app-campaign-list',
  templateUrl: './campaign-list.component.html',
  styleUrls: ['./campaign-list.component.css']
})
export class CampaignListComponent implements OnInit {

  constructor(private logger: NGXLogger, private appEventsService: AppEventsService ) { }

  ngOnInit(): void {
  }

  @HostListener('window:popstate', ['$event'])
  onPopState(event) {
    this.logger.info('Back button pressed', event);
    window.history.forward();
  }

  profileDropDownVisibilityChanged(event) {
    this.appEventsService.profileDropDownVisibilityChanged(event);
  }

}
