import {BrowserModule, Title} from '@angular/platform-browser';
import {ApplicationRef, ComponentFactoryResolver, DoBootstrap, InjectionToken, Injector, NgModule} from '@angular/core';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {AuthModule} from './auth/auth.module';
import {HTTP_INTERCEPTORS, HttpClientModule} from '@angular/common/http';
// import {HTTP_REQ_TIMEOUT, TokenInterceptorService, httpFactory} from './services/token-interceptor/token-interceptor.service';
import {RefreshTokenService} from './services/refresh-token/refresh-token.service';
// import {HttpModule, RequestOptions, XHRBackend} from '@angular/http';
import {Router} from '@angular/router';
import {FormsModule} from '@angular/forms';
// import {LocationService} from './create-ad/targeting/location/location.service';
// import {MediaService} from './create-ad/media/media.service';
import {NotfoundComponent} from './notfound/notfound.component';
import {SpinnerComponent} from './shared/spinner/spinner.component';
import {SpinnerService, spinnerFactory} from './shared/spinner/spinner.service';
import {
  DEFAULT_TIMEOUT,
  HttpClientInterceptorService
} from './services/token-interceptor/http-client-interceptor.service';
import {LoggerModule, NGXLogger} from 'ngx-logger';
import {environment} from '../environments/environment';
import {NgxWebstorageModule} from 'ngx-webstorage';
import {WebStorageService} from './services/web-storage.service';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {CurrencyPipe, Location} from '@angular/common';
import {NetworkInterceptor} from './services/token-interceptor/network-interceptor';
import {UtilityService} from './services/common/utility.service';
import {ThemingService} from './services/theming.service';
import {catchError, map, mergeMap} from 'rxjs/operators';
import {AuthService} from './auth/auth.service';
import {Observable} from 'rxjs';
import { AppConstant } from './services/common/constants/app-constant';
import {RouteConstants} from './services/common/constants/route-constants';
export const ALERT_TIMEOUT: InjectionToken<number> = new InjectionToken<number>('alertTimeout');
declare const appConfig: any;
const HTTP_REQ_TIMEOUT = 60000;

@NgModule({
  declarations: [
    AppComponent,
    NotfoundComponent,
    SpinnerComponent,
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    // HttpModule,
    AuthModule,
    FormsModule,
    LoggerModule.forRoot(environment.loggerConfig),
    NgxWebstorageModule.forRoot({
      prefix: 'ls', separator: '.', caseSensitive: true
    }),
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS, useClass: HttpClientInterceptorService, multi: true
    },
    {
      provide: HTTP_INTERCEPTORS, useClass: NetworkInterceptor, multi: true
    },
    {
      provide: DEFAULT_TIMEOUT, useValue: HTTP_REQ_TIMEOUT
    },
    {
      provide: ALERT_TIMEOUT, useValue: 5000
    },
    { provide: Window, useValue: window },
    {
      provide: SpinnerService,
      useFactory: spinnerFactory,
      deps: [ComponentFactoryResolver, ApplicationRef, Injector],
    },
    // {
    //   provide: TokenInterceptorService,
    //   useFactory: httpFactory,
    //   deps: [XHRBackend, RequestOptions, RefreshTokenService, Router, SpinnerService, NGXLogger, WebStorageService]
    // },
    RefreshTokenService,
    UtilityService,
    Title,
    Location,
    CurrencyPipe
  ],
})
export class AppModule implements DoBootstrap{
  loadStyle() {
    const head = document.querySelector('head');
    return this.themingService.getTheme().pipe(map(theme => {
      let styleName = '';
      if (theme && theme.themeName && theme.themeName !== 'default') {
        styleName = `${theme.themeName}-`;
        this.createStyle(head, styleName, 'client-theme-file-0',
          `css/${styleName}theme${(environment.production) ? '.min' : ''}.css`);
        this.createStyle(head, styleName, 'client-theme-file-1',
          `css/styles/${styleName}style${(environment.production) ? '.min' : ''}.css`);
      } else {
        this.createStyle(head, styleName, 'client-theme-file-0',
          `css/${styleName}theme${(environment.production) ? '.min' : ''}.css`);
        this.createStyle(head, styleName, 'client-theme-file-1',
          `css/styles/${styleName}style${(environment.production) ? '.min' : ''}.css`);
      }
      return true;
    }));
  }

  createStyle(head, styleName, styleId, fileName) {
    const themeLink = document.getElementById(
      styleId
    ) as HTMLLinkElement;
    if (themeLink) {
      themeLink.href = fileName;
    } else {
      const style = document.createElement('link');
      style.id = styleId;
      style.rel = 'stylesheet';
      style.href = fileName;
      head.appendChild(style);
    }
  }
  constructor(private themingService: ThemingService,
              private authService: AuthService,
              private logger: NGXLogger,
              private router: Router,
              ) {
  }
  ngDoBootstrap(appRef: ApplicationRef): void {
    this.logger.info('ngDoBootstrap()', window.location.href);
    const url = new URL(window.location.href);
    const ssoParams = {} as any;
    url.searchParams.forEach((value, key) => {
      ssoParams[key] = value;
    });

    let ob$Init: Observable<any> = null;
    if (ssoParams.e && ssoParams.l && ssoParams.c && ssoParams.t) {
      // ob$Init = this.authService.ssoLogin(ssoParams.t, ssoParams.c, ssoParams.sourcePortal, ssoParams.refreshToken).pipe(mergeMap((ssoResp) => {
      //   return this.loadStyle().pipe(map((loaded) => {
      //     return {styleLoaded: loaded, authResp: ssoResp, authSuccess: true, authError: null, isSSo: true};
      //   }));
      // }), catchError((errorSso) => {
      //   this.logger.error('errorSso', errorSso);
      //   return this.loadStyle().pipe(map((loaded) => {
      //     return {styleLoaded: loaded, authResp: null, authSuccess: false, authError: errorSso, isSSo: true};
      //   }));
      // }));
    } else {
      ob$Init =  this.loadStyle().pipe(map((loaded) => {
        return {styleLoaded: loaded, authResp: null, authSuccess: false, authError: null, isSSo: false};
      }));
    }
    ob$Init.subscribe((initResp) => {
      if (initResp) {
        this.logger.info('initResp = ', initResp);
        const homeUrl = new URL(environment.appUrl);
        this.logger.info(homeUrl.pathname);
        setTimeout(() => {
          if (initResp.isSSo && !initResp.authSuccess) {
            const loginURL = new URL(appConfig.ssoBindingRedirect);
            if (window.location.origin === loginURL.origin) {
              this.router.navigate([loginURL.pathname]);
            }else {
              window.location.href = appConfig.ssoBindingRedirect;
            }
          }else if (initResp.isSSo && initResp.authSuccess) {
            appRef.bootstrap(SpinnerComponent);
            appRef.bootstrap(AppComponent);
            const rd = ssoParams['rd'];
            const campaignId = ssoParams['cid'];
            if(rd === 'cl') {
              this.router.navigate(['/', RouteConstants.CAMPAIGN_LIST]);
            } else if (rd === 'al'){
              this.router.navigate([RouteConstants.CAMPAIGN_LIST, RouteConstants.CAMPAIGNS, campaignId, RouteConstants.ANALYTICS]);
            } else {
              this.router.navigate(['/', RouteConstants.SELECT_PLAN]);
            }

          }else {
            appRef.bootstrap(SpinnerComponent);
            appRef.bootstrap(AppComponent);
          }
        });
      }
    });
  }
}
