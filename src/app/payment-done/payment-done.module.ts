import { NgModule } from '@angular/core';
import {CommonModule} from '@angular/common';
import {AuthModule} from '../auth/auth.module';
import {NGXLogger} from 'ngx-logger';
import {PaymentDoneRoutingModule} from './payment-done.routing';
import {PaymentDoneComponent} from './payment-done.component';

@NgModule({
  imports: [
    CommonModule,
    AuthModule,
    PaymentDoneRoutingModule
  ],
  declarations: [
    PaymentDoneComponent
  ]
})
export class PaymentDoneModule {
  constructor(private logger: NGXLogger) {
    this.logger.info('payment done module');
  }
}
