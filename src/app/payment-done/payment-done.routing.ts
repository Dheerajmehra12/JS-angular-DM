import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';

import {NGXLogger} from 'ngx-logger';
import {RouteConstants} from '../services/common/constants/route-constants';
import {PaymentDoneComponent} from './payment-done.component';

const paymentDoneRoutes: Routes = [
  {path: RouteConstants.ROOT, component: PaymentDoneComponent, data: {auth: true}}
];


@NgModule({
  imports: [CommonModule, RouterModule.forChild(paymentDoneRoutes)],
  exports: [RouterModule]
})

export class PaymentDoneRoutingModule {
  constructor(private logger: NGXLogger) {
    this.logger.info('PaymentDoneRoutingModule');
  }
}
