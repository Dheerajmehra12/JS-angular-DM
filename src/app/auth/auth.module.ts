import {NgModule} from '@angular/core';
import {AuthComponent} from './auth.component';
import {RouterModule} from '@angular/router';
import {FooterComponent} from '../footer/footer.component';
import {AuthService} from './auth.service';
import {HttpClientModule} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import {NGXLogger} from 'ngx-logger';
import {SearchComponent} from '../search/search.component';
import {HeaderComponent} from '../header/header.component';
import {DailogModule} from '../shared/dialog/dialog.module'
@NgModule({
  declarations: [
    AuthComponent,
    FooterComponent,
    SearchComponent,
    HeaderComponent,
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
    FooterComponent,
    SearchComponent,
    HeaderComponent,
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
