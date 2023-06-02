import {Routes} from '@angular/router';
import {TargetingComponent} from './targeting/targeting.component';
import {MediaComponent} from './media/media.component';
import {PayAndPublishComponent} from './pay-and-publish/pay-and-publish.component';
import {RouteConstants} from '../services/common/constants/route-constants';
import {PaymentDoneComponent} from '../payment-done/payment-done.component';
import {SummaryComponent} from './summary/summary.component';
import {BannerComponent} from './banner/banner.component';

export const CREATE_AD_ROUTES: Routes = [
  {path: RouteConstants.ROOT, redirectTo: RouteConstants.TARGETING, pathMatch: 'full', data: {auth: true}},
  {path: RouteConstants.TARGETING, component: TargetingComponent, data: {auth: true}},
  {path: RouteConstants.MEDIA, component: MediaComponent, data: {auth: true}},
  {path: RouteConstants.BANNER, component: BannerComponent, data: {auth: true}},
  {path: RouteConstants.SUMMARY, component: SummaryComponent, data: {auth: true}},
  {path: RouteConstants.PAY_AND_PUBLISH, component: PayAndPublishComponent, data: {auth: true}},
  {path: RouteConstants.PAYMENT_DONE, component: PaymentDoneComponent, data: {auth: true}},
];
