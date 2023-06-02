import { Component, OnInit} from '@angular/core';
import {SpinnerService} from '../../shared/spinner/spinner.service';
import {NGXLogger} from 'ngx-logger';
import {WebStorageService} from '../../services/web-storage.service';
import {AuthService} from '../auth.service';
import {environment} from '../../../environments/environment';
import {Router} from '@angular/router';
declare const appConfig: any;
// declare const purechatApi: any;
@Component({
  selector: 'app-sso',
  templateUrl: './sso.component.html',
  styleUrls: ['./sso.component.css']
})
export class SsoComponent implements OnInit {
  private ssoData: any;
  statusText = 'Loading...';
  constructor(private spinnerService: SpinnerService,
              private storageService: WebStorageService,
              private authService: AuthService,
              private router: Router,
              private logger: NGXLogger, ) { }

  ngOnInit(): void {
    this.ssoData = this.storageService.get('ssoData');
    this.statusText = 'Authenticating...';
    if (this.ssoData !== null) {
      this.authService.ssoLogin(this.ssoData.token, this.ssoData.xpressdocCode, '', '')
        .finally(() => {
          this.spinnerService.close();
        }).subscribe((ssoResp) => {
        this.statusText = 'Authentication Successful..!!';
        this.logger.info('ssoResp = ', ssoResp);
        this.redirectToSuccessPage();
      }, (error) => {
        this.statusText = 'Authentication Failed..!!';
        this.statusText = 'Redirecting to Login Page...';
        this.logger.info('ssoAuthError = ', error);
        this.redirectToLogin();
      });
    } else{
      this.statusText = 'Unauthorized';
      this.statusText = 'Redirecting to Login Page...';
      this.redirectToLogin();
    }
  }

  private redirectToLogin() {
    const loginURL = new URL(appConfig.ssoBindingRedirect);
    if (window.location.origin === loginURL.origin) {
      this.router.navigate([loginURL.pathname]);
    }else {
      window.location.href = appConfig.ssoBindingRedirect;
    }
  }

  private redirectToSuccessPage() {
    let redirectURL = new URL(environment.appUrl);
    if (this.ssoData.redirectURL && this.ssoData.redirectURL !== '') {
      redirectURL = new URL(this.ssoData.redirectURL);
    }
    if (window.location.origin === redirectURL.origin) {
      const queryParams = {} as any;
      // redirectURL.searchParams.forEach((value, name) => {
      //   queryParams[name] = value;
      // });
      let hideChatBox = true;
      if (!redirectURL.searchParams.has('hideChatBox') || redirectURL.searchParams.get('hideChatBox') === 'false') {
        hideChatBox = false;
      }
      if (hideChatBox) {
        /*if (typeof purechatApi !== 'undefined'
          && purechatApi.hasOwnProperty('hideChatBox')
          && typeof  purechatApi.hideChatBox === 'function') {
          purechatApi.hideChatBox();
        }*/
      }
      this.router.navigate([redirectURL.pathname], {queryParams});
    }else {
      window.location.href = appConfig.ssoBindingRedirect;
    }
    this.storageService.remove('ssoData');
  }

}
