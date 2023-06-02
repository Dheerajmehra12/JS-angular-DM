import {Inject, NgModule} from '@angular/core';
import {NavigationEnd, NavigationStart, Router, RouterModule, Routes} from '@angular/router';
import {AuthComponent} from './auth/auth.component';
import {AUTH_ROUTES} from './auth/auth.routing';
import {NotfoundComponent} from './notfound/notfound.component';
import {RouteConstants} from './services/common/constants/route-constants';
import {AuthGuard} from './auth/auth.guard';
import {NGXLogger} from 'ngx-logger';
import {DOCUMENT} from '@angular/common';

declare const appConfig: any;

const appRoutes: Routes = [
  {
    path: RouteConstants.SELECT_PLAN,
    loadChildren: () => import('./select-plan/select-plan.module').then(m => m.SelectPlanModule),
    data: {auth: false},
    // canActivate: [AuthGuard]
  },
  {
    path: RouteConstants.PROFILE,
    loadChildren: () => import('./personal-profile/personal-profile.module').then(m => m.PersonalProfileModule),
    data: {auth: false},
    // canActivate: [AuthGuard]
  },
  {
    path: RouteConstants.CREATE_AD,
    loadChildren: () => import('./create-ad/create-ad.module').then(m => m.CreateAdModule),
    canActivate: [AuthGuard],
    data: {auth: true}
  },
  {
    path: RouteConstants.PAYMENT_DONE,
    loadChildren: () => import('./payment-done/payment-done.module').then(m => m.PaymentDoneModule),
    data: {auth: true},
    canActivate: [AuthGuard]
  },
  {
    path: RouteConstants.CAMPAIGN_LIST,
    loadChildren: () => import('./campaign-list/campaign-list.module').then(m => m.CampaignListModule),
    data: {auth: true},
    canActivate: [AuthGuard]
  },
  {
    path: RouteConstants.CREATIVES,
    loadChildren: () => import('./template/template.module').then(m => m.TemplateModule),
    data: {auth: false}
  },
  {path: RouteConstants.AUTH, component: AuthComponent, children: AUTH_ROUTES, data: {auth: false}},
  {path: RouteConstants.ROOT, redirectTo: `/${RouteConstants.PROFILE}`, pathMatch: 'full', data: {auth: false}},
  {path: RouteConstants.NOT_FOUND, component: NotfoundComponent, data: {auth: false}},
  {path: RouteConstants.ANY, redirectTo: `/${RouteConstants.NOT_FOUND}`, data: {auth: false}}
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes, { relativeLinkResolution: 'legacy' })],
  exports: [RouterModule]
})


export class AppRoutingModule {
  private previousUrl: string;
  private currentUrl: string;
  constructor(private router: Router, private logger: NGXLogger, @Inject(DOCUMENT) private document: Document ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.currentUrl = event.url;
        if ((appConfig.environment === 'production'
        || appConfig.environment === 'staging')
        && location.protocol !== 'https:') {
          this.logger.info('Redirecting to https:');
          this.document.body.innerHTML = `<h3>Redirecting to https</h3>`;
          location.href = 'https:' + window.location.href.substring(window.location.protocol.length);
        }
      }
      else if (event instanceof NavigationEnd) {
        this.logger.debug('previousUrl = ', this.previousUrl);
        this.logger.debug('currentUrl = ', this.currentUrl);
        this.previousUrl = event.url;
      }
    });
  }
}
