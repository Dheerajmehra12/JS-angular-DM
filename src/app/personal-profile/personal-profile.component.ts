import { Component, OnInit,HostListener } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import {NGXLogger} from 'ngx-logger';
import { AppEventsService } from '../services/common/app-events.service';

@Component({
  selector: 'app-personal-profile',
  templateUrl: './personal-profile.component.html',
  styleUrls: ['./personal-profile.component.css']
})
export class PersonalProfileComponent implements OnInit {

  constructor(private logger: NGXLogger,private appEventsService:AppEventsService) { }

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
