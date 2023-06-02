import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import { Observable } from 'rxjs';
import {AuthService} from './auth.service';
import {WebStorageService} from '../services/web-storage.service';
import {StorageKeys} from '../services/common/constants/storage-keys';
import {NGXLogger} from 'ngx-logger';
import {RouteConstants} from '../services/common/constants/route-constants';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private storageService: WebStorageService,
              private authService: AuthService,
              private logger: NGXLogger,
              private router: Router, ) {
  }
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    let authorized = true;
    if (route.data.hasOwnProperty('auth') && route.data.auth) {
      if (this.authService.loggedIn) {
        this.logger.debug('this.authService.loggedIn = ', this.authService.loggedIn);
        const loginData = this.storageService.get(StorageKeys.LOGIN_DATA);
        authorized = (loginData !== null);
      } else {
        authorized = false;
      }
    }
    this.logger.debug('Authorized =', authorized);
    if (!authorized) {
      this.logger.error('unauthorized = ', !authorized);
      // this.router.navigate([`/${RouteConstants.AUTH}/${RouteConstants.LOGIN}`]);
      this.router.navigate([`/${RouteConstants.PROFILE}`]);
    }
    return authorized;
  }
}
