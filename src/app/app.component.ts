import {Component, Inject, OnInit} from '@angular/core';
import {Title} from '@angular/platform-browser';
import {NGXLogger} from 'ngx-logger';
declare const appConfig: any;
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  title = appConfig.appDisplayName;

  ngOnInit() {
    this.titleService.setTitle(this.title);
    this.logger.info('ngOnInit(AppComponent) -> title = ', this.title);
  }

  constructor(
    @Inject(Title) private titleService: Title,
    @Inject(NGXLogger) private logger: NGXLogger,
  ) {}
}
