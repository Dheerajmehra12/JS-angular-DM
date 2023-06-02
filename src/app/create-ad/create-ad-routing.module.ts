import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {CreateAdComponent} from './create-ad.component';
import {CREATE_AD_ROUTES} from './create-ad.routes';
import {NGXLogger} from 'ngx-logger';
import {RouteConstants} from '../services/common/constants/route-constants';

const createAdRoutes: Routes = [
  {
    path: RouteConstants.ROOT, component: CreateAdComponent,
    children: CREATE_AD_ROUTES,
    data: {auth: true}
  }];

@NgModule({
  imports: [CommonModule, RouterModule.forChild(createAdRoutes)],
  exports: [RouterModule],
})

export class CreateAdRoutingModule {
  constructor(private logger: NGXLogger) {
    this.logger.debug('CreateAdRoutingModule');
  }
}
