import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {RouteConstants} from '../services/common/constants/route-constants';
import {CampaignListComponent} from './campaign-list.component';
import {NGXLogger} from 'ngx-logger';
import {CampaignsComponent} from './campaigns/campaigns.component';
import {CampaignDetailsComponent} from './campaign-details/campaign-details.component';
import {AnalyticsComponent} from './analytics/analytics.component';
import {AnalyticsDashboardAllComponent} from './analytics/analytics-dashboard-all/analytics-dashboard-all.component';

export const CAMPAIGN_LIST_ROUTES: Routes = [
  {path: RouteConstants.ROOT, redirectTo: RouteConstants.CAMPAIGNS,pathMatch: 'full', data: {auth: true}},
  {path: RouteConstants.CAMPAIGNS, component: CampaignsComponent, data: {auth: true}},
  {path: `${RouteConstants.MY}/${RouteConstants.DASHBOARD}`, pathMatch: 'full',component: AnalyticsDashboardAllComponent, data: {auth: true}},
  {path: `${RouteConstants.CAMPAIGNS}/:campaignId`, component: CampaignDetailsComponent, data: {auth: true}},
  {path: `${RouteConstants.CAMPAIGNS}/:campaignId/${RouteConstants.ANALYTICS}`, component: AnalyticsComponent, data: {auth: true}},
];

const campaignListRoutes: Routes = [
  {
    path: RouteConstants.ROOT,
    children: CAMPAIGN_LIST_ROUTES,
    component: CampaignListComponent,
    data: {auth: true}
  }
];


@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    RouterModule.forChild(campaignListRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class CampaignListRoutingModule {
  constructor(private logger: NGXLogger) {
    this.logger.debug('CampaignListRoutingModule');
  }
}
