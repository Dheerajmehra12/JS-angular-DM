import { NgModule } from '@angular/core';
import {CommonModule} from '@angular/common';
import {AuthModule} from '../auth/auth.module';

import {SelectPlanComponent} from './select-plan.component';
import {SelectPlanRoutingModule} from './select-plan.routing';
import {NGXLogger} from 'ngx-logger';

@NgModule({
  imports: [
    CommonModule,
    AuthModule,
    SelectPlanRoutingModule
  ],
  declarations: [
    SelectPlanComponent
  ]
})
export class SelectPlanModule {
  constructor(private logger: NGXLogger) {
    this.logger.debug('select plan module');
  }
}
