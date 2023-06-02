import { NgModule } from '@angular/core';
import {CommonModule} from '@angular/common';
import {DialogComponent} from './dialog.component';
import {NGXLogger} from 'ngx-logger';

@NgModule({
  imports: [
    CommonModule,
  ],
  declarations: [
    DialogComponent
  ],
  exports:[
    DialogComponent
  ]
})
export class DailogModule {
  constructor(private logger: NGXLogger) {
    this.logger.debug('DialogComponent plan module');
  }
}
