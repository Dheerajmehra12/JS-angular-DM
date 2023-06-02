import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AuthModule} from '../auth/auth.module';
import {CampaignListComponent} from './campaign-list.component';
import {CampaignListRoutingModule} from './campaign-list-routing.module';
import {NGXLogger} from 'ngx-logger';
import {CampaignsComponent} from './campaigns/campaigns.component';
import {CampaignDetailsComponent} from './campaign-details/campaign-details.component';
import {CreateAdSharedModule} from '../shared/create-ad-sharing.module';
import {AnalyticsComponent} from './analytics/analytics.component';
import {AnalyticsHeaderComponent} from './analytics/analytics-header/analytics-header.component';
import {AnalyticsPrintonlyHeaderComponent} from './analytics/analytics-printonly-header/analytics-printonly-header.component';
import {AnalyticsDashboardComponent} from './analytics/analytics-dashboard/analytics-dashboard.component';
import {AnalyticsReachComponent} from './analytics/analytics-reach/analytics-reach.component';
import {RounderBarChartComponent} from './analytics/rounder-bar-chart/rounder-bar-chart.component';
import {ViewsClicksMapComponent} from './analytics/views-clicks-map/views-clicks-map.component';
import {FormsModule} from '@angular/forms';



@NgModule({
  declarations: [
    CampaignListComponent,
    CampaignsComponent,
    CampaignDetailsComponent,
    AnalyticsComponent,
    AnalyticsHeaderComponent,
    AnalyticsPrintonlyHeaderComponent,
    AnalyticsDashboardComponent,
    AnalyticsReachComponent,
    RounderBarChartComponent,
    ViewsClicksMapComponent,
  ],
  imports: [
    CommonModule,
    AuthModule,
    CampaignListRoutingModule,
    CreateAdSharedModule,
    FormsModule
  ]
})
export class CampaignListModule {
  constructor(private logger: NGXLogger) {
    this.logger.debug('CampaignListModule');
  }
}
