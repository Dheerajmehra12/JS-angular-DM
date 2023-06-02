import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PersonalProfileComponent } from './personal-profile.component';
import { RouteConstants } from '../services/common/constants/route-constants';
import { NGXLogger } from 'ngx-logger';
import { CommonModule } from '@angular/common';

export const PERSONAL_PROFILE_ROUTES: Routes = [
  {path: RouteConstants.ROOT, redirectTo: RouteConstants.PROFILE,pathMatch: 'full', data: {auth: false}}
];

const campaignListRoutes: Routes = [
  {
    path: RouteConstants.ROOT,
    children: PERSONAL_PROFILE_ROUTES,
    component: PersonalProfileComponent,
    data: {auth: false}
  }
];
@NgModule({
  imports: [CommonModule,RouterModule.forChild(campaignListRoutes)],
  exports: [RouterModule]
})
export class PersonalProfileRoutingModule { 
  constructor(private logger: NGXLogger) {
    this.logger.debug('PersonalProfileRoutingModule');
  }
}
