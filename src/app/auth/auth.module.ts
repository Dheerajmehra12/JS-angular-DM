import {NgModule} from '@angular/core';
import {LoginComponent} from './login/login.component';
import {AuthComponent} from './auth.component';
import {RouterModule} from '@angular/router';
import {FooterComponent} from '../footer/footer.component';
import {AuthService} from './auth.service';
import {HttpClientModule} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {NGXLogger} from 'ngx-logger';
import { SsoComponent } from './sso/sso.component';
import {SearchComponent} from '../search/search.component';
import {AnalyticsDashboardAllComponent} from '../campaign-list/analytics/analytics-dashboard-all/analytics-dashboard-all.component';
import {TranslatePipe} from '../services/translate';
import {HeaderComponent} from '../header/header.component';
import {DailogModule} from '../shared/dialog/dialog.module'
@NgModule({
  declarations: [
    AuthComponent,
    LoginComponent,
    FooterComponent,
    SsoComponent,
    SearchComponent,
    HeaderComponent,
    AnalyticsDashboardAllComponent,
    TranslatePipe
  ],
    imports: [
        RouterModule,
        HttpClientModule,
        FormsModule,
        CommonModule,
        DailogModule
    ],
  exports: [
    AuthComponent,
    LoginComponent,
    FooterComponent,
    SearchComponent,
    HeaderComponent,
    AnalyticsDashboardAllComponent,
    TranslatePipe
  ],
  entryComponents: [],
  providers: [
    AuthService,
  ],
})
export class AuthModule {
  constructor(private logger: NGXLogger) {
    this.logger.debug('auth module loaded');
  }
}
