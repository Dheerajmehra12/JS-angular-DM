import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SelectPlanComponent} from './select-plan.component';
import {NGXLogger} from 'ngx-logger';
import {RouteConstants} from '../services/common/constants/route-constants';

const selectPlanRoutes: Routes = [
  {path: RouteConstants.ROOT, component: SelectPlanComponent, data: {auth: true}}
];


@NgModule({
  imports: [CommonModule, RouterModule.forChild(selectPlanRoutes)],
  exports: [RouterModule]
})

export class SelectPlanRoutingModule {
  constructor(private logger: NGXLogger) {
    this.logger.debug('SelectPlanRoutingModule');
  }
}
