import {Inject, Injectable, InjectionToken} from '@angular/core';
import {
  HttpContextToken,
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import {BehaviorSubject, Observable, throwError} from 'rxjs';
import {catchError, filter, finalize, switchMap, take, timeout} from 'rxjs/operators';
import {SpinnerService} from '../../shared/spinner/spinner.service';
import {WebStorageService} from '../web-storage.service';
import {StorageKeys} from '../common/constants/storage-keys';
import {NGXLogger} from 'ngx-logger';
import {RefreshTokenService} from '../refresh-token/refresh-token.service';
import {ApiResponse} from '../common/api-response';
import {HeaderKeys} from '../common/constants/header-keys';

declare const appConfig: any;

export const DEFAULT_TIMEOUT = new InjectionToken<number>('defaultTimeout');
export const AUTH_REQUIRED = new HttpContextToken(() => true);
export const REQUIRES_ADMIN = new HttpContextToken(() => false);
export const SKIP_INTERCEPT = new HttpContextToken(() => false);
export const SKIP_SPINNER = new HttpContextToken(() => false);
export const DEFAULT_APP_NAME = appConfig.appName;


@Injectable({
  providedIn: 'root'
})
export class HttpClientInterceptorService implements HttpInterceptor {
  private pendingRequests = 0;
  private refreshTokenInProgress = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  constructor(private spinnerService: SpinnerService,
              private storageService: WebStorageService,
              private refreshTokenService: RefreshTokenService,
              private logger: NGXLogger,
              @Inject(DEFAULT_TIMEOUT) protected defaultTimeout: number, ) { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const timeoutValue = request.headers.get('timeout') || this.defaultTimeout;
    const timeoutValueNumeric = Number(timeoutValue);
    const skipSpinner = request.context.get(SKIP_SPINNER);
    const skipIntercept = request.context.get(SKIP_INTERCEPT);
    if (skipIntercept) {
      return next.handle(request);
    } else {
      this.pendingRequests++;
      if (!skipSpinner) {
        this.logger.debug('HTTP Interceptor Starting spinner');
        this.spinnerService.show();
      }
      return next.handle(this.addToken(request)).finally(() => {
        this.pendingRequests--;
        if (this.pendingRequests <= 0) {
          if (!skipSpinner) {
            this.logger.debug('HTTP Interceptor Closing spinner');
            this.spinnerService.close();
          }
        }}).pipe(timeout(timeoutValueNumeric),
        catchError((error: HttpErrorResponse) => {
          return this.handleErrors(error, request, next);
        }));
    }
  }

  getTokens(requiresAdmin: boolean = false): {token: string, refreshToken: string} {
    const loginData = (requiresAdmin) ? this.storageService.get(StorageKeys.LOGIN_DATA) : this.storageService.get(StorageKeys.LOGGED_AS);
    if (loginData && loginData.token && loginData.refreshToken) {
      return {token: loginData.token, refreshToken: loginData.refreshToken};
    } else {
      const token = this.storageService.get(StorageKeys.AUTH_TOKEN);
      const refreshToken = this.storageService.get(StorageKeys.REFRESH_TOKEN);
      if(token && refreshToken) {
        return {token : token, refreshToken: refreshToken};
      } else {
        return null;
      }
    }
    return null;
  }

  private getUserName() {
    const currUser = this.storageService.get(StorageKeys.LOGIN_DATA);
    return currUser && currUser.username || '';
  }

  private addToken(request: HttpRequest<any>): HttpRequest<any> {
    const authRequired = request.context.get(AUTH_REQUIRED);
    const requiresAdmin = request.context.get(REQUIRES_ADMIN);
    const tokens = this.getTokens(requiresAdmin);
    let appName = this.storageService.get(StorageKeys.APP_NAME);
    if (appName === null) {
      appName = DEFAULT_APP_NAME;
      this.storageService.set(StorageKeys.APP_NAME, appName);
    }
    const username = this.storageService.get(StorageKeys.USER_NAME) || this.getUserName();
    if (username !== '') {
      this.storageService.set(StorageKeys.USER_NAME, username);
    }
    if (authRequired && tokens !== null) {
      return request.clone({
        headers: request.headers.set('Authorization', `Bearer ${tokens.token}`)
          .set(HeaderKeys.APP_NAME, appName)
          .set(HeaderKeys.CK, this.storageService.getItem(StorageKeys.CK))
          .set(HeaderKeys.USER_NAME, username)
      });
    } else {
      return request.clone({
        headers: request.headers.set(HeaderKeys.APP_NAME, appName)
          .set(HeaderKeys.CK, this.storageService.getItem(StorageKeys.CK))
          .set(HeaderKeys.USER_NAME, username)
      });
    }
  }

  private handleErrors(error: HttpErrorResponse, request: HttpRequest<any>, next: HttpHandler) {
    if (error instanceof HttpErrorResponse) {
      const errorCode = (error as HttpErrorResponse).status;
      if (errorCode === 401) {
        return this.handle401Error(request, next);
      } else {
        return throwError(error);
      }
    } else {
      return throwError(error);
    }
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.refreshTokenInProgress) {
      this.refreshTokenInProgress = true;
      this.refreshTokenSubject.next(null);
      return this.getNewToken(request, next);
    } else {
      return this.refreshTokenSubject.pipe(
        filter(token => token != null),
        take(1),
        switchMap(token => {
          return next.handle(this.addToken(request));
        })
      );
    }
  }

  private getNewToken(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const requiresAdmin = request.context.get(REQUIRES_ADMIN);
    const rt = request.headers.get('rt');
    let tokens = {token:'', refreshToken:''};
    if(rt != '' && rt != null) {
      tokens = {token: "", refreshToken:rt};
    } else {
      tokens = this.getTokens(requiresAdmin);
    }

    return this.refreshTokenService.refreshTokenV1(tokens.refreshToken).pipe(
      switchMap((refreshTokenResp: ApiResponse<any>) => {
        if (refreshTokenResp.status === 0 && refreshTokenResp.response) {

          let loginDataKey: string = null;

          if (requiresAdmin) {
            loginDataKey = StorageKeys.LOGIN_DATA;
          } else {
            loginDataKey = StorageKeys.LOGGED_AS;
          }

          this.logger.info('Success Refresh Token', refreshTokenResp.response);

          this.storageService.set(StorageKeys.AUTH_TOKEN, refreshTokenResp.response.token);
          this.storageService.set(StorageKeys.REFRESH_TOKEN, refreshTokenResp.response.refreshToken);

          const loginData = this.storageService.get(loginDataKey);
          if(loginData != null) {
            loginData.token = refreshTokenResp.response.token;
            loginData.refreshToken = refreshTokenResp.response.refreshToken;
            this.storageService.set(loginDataKey, loginData);

            // logged-in user is admin but last api call do not require admin token and token expired
            if (!this.storageService.get(StorageKeys.IS_IMPERSONATED)) {
              const loginResponse = this.storageService.get(StorageKeys.LOGIN_DATA);
              const hasAdminRole = loginResponse.role && loginResponse.role.trim().toLowerCase() === 'admin';
              if (hasAdminRole && loginDataKey === StorageKeys.LOGGED_AS) {
                this.storageService.set(StorageKeys.LOGIN_DATA, loginData);
              }
            }
          }

          this.refreshTokenSubject.next(refreshTokenResp.response.token);
          return next.handle(this.addToken(request));
        } else {
          this.logger.info('Error Refresh Token', refreshTokenResp);
          return throwError(refreshTokenResp);
        }
      }),
      catchError ((error) => {
        return this.getNewTokenError(error);
      }),
      finalize(() => {
        this.refreshTokenInProgress = false;
      })
    );
  }

  private getNewTokenError(error: any): Observable<HttpEvent<any>> {
    this.logger.info('inside getNewTokenError after refreshToken error', error);
    this.logger.info('Refresh token request failed.  Redirecting user to login page');
    const redirect = document.createElement('a');
    redirect.setAttribute('id', 'redirect');
    redirect.setAttribute('href', '/');
    redirect.click();
    return throwError(error);
  }
}
