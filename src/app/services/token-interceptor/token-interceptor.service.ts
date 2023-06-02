import {Inject, Injectable, InjectionToken} from '@angular/core';
import {
  ConnectionBackend,
  Headers,
  Http as _http,
  Request,
  RequestOptions,
  RequestOptionsArgs,
  Response, XHRBackend,
} from '@angular/http';
import {Observable} from 'rxjs/Observable';
import {RefreshTokenService} from '../refresh-token/refresh-token.service';
import {Router} from '@angular/router';
import {SpinnerService} from '../../shared/spinner/spinner.service';
import {NGXLogger} from 'ngx-logger';
import 'rxjs/add/operator/finally';
import 'rxjs/add/operator/timeout';
import 'rxjs/add/operator/catch';
import 'rxjs/add/observable/throw';
import 'rxjs/add/observable/of';
import {throwError} from 'rxjs';
import {catchError, mergeMap, tap} from 'rxjs/operators';
import {WebStorageService} from '../web-storage.service';
import {StorageKeys} from '../common/constants/storage-keys';
import {HeaderKeys} from '../common/constants/header-keys';

declare const appConfig: any;

export const REQ_TIMEOUT = new InjectionToken<number>('reqTimeout');

export const HTTP_REQ_TIMEOUT = 60000;

export function httpFactory(backend: XHRBackend, defaultOptions: RequestOptions,
                            refresh: RefreshTokenService, router: Router, spinnerService: SpinnerService,
                            logger: NGXLogger, storageService: WebStorageService) {
  return new TokenInterceptorService(backend, defaultOptions, refresh, router,
    spinnerService, logger, storageService, HTTP_REQ_TIMEOUT);
}

@Injectable()
export class TokenInterceptorService extends _http {

  constructor(
    private backend: ConnectionBackend,
    private defaultOptions: RequestOptions,
    private refresh: RefreshTokenService,
    private router: Router,
    private spinnerService: SpinnerService,
    private logger: NGXLogger,
    private storageService: WebStorageService,
    @Inject(REQ_TIMEOUT) private reqTimeout: number, ) {
    super(backend, defaultOptions);
  }

  private originalRequest: Request | string;
  private originalOptions: RequestOptionsArgs;
  private pendingRequests = 0;
  private inflightAuthRequest: Observable<Response> = null;

  private static toStrUrl(url: string | Request) {
    let reqUrl: string = null;
    if (typeof url === 'string') {
      reqUrl = url;
    } else if (typeof url === 'object') {
      reqUrl = url.url;
    }
    return reqUrl;
  }

  setUrl(req: string | Request) {
    this.originalRequest = req;
  }

  getRequestUrl() {
    return this.originalRequest;
  }

  setOption(options?: RequestOptionsArgs) {
    this.originalOptions = options;
  }

  getOption() {
    return this.originalOptions;
  }

  /**
   * Request interceptor.
   * @param url Url to be called
   * @param options Request options
   * @returns Observable<Response>
   */
  request(url: string | Request, options?: RequestOptionsArgs): Observable<Response> {
    this.setUrl(url);
    this.setOption(options);
    this.logger.debug('Token Interceptor Starting spinner');
    this.spinnerService.show();
    const token = this.storageService.get(StorageKeys.AUTH_TOKEN);
    const refreshTokenUrlPattern = 'refreshtoken';
    const defaultAppName = appConfig.appName; // default app
    if (typeof url === 'string') {
      if (!options) {
        options = {headers: new Headers()};
      }
      if (this.storageService.get(StorageKeys.APP_NAME) != null) {
        options.headers.set(HeaderKeys.APP_NAME, this.storageService.get(StorageKeys.APP_NAME));
      } else {
        options.headers.set(HeaderKeys.APP_NAME, defaultAppName);
        this.storageService.set(StorageKeys.APP_NAME, defaultAppName);
      }

      if (token && !url.includes(refreshTokenUrlPattern)) {
        options.headers.set(HeaderKeys.AUTHORIZATION, `Bearer ${token}`);
      } else {
        this.logger.info('Could not set token to header');
      }
      options.headers.set(HeaderKeys.CK, this.storageService.getItem(StorageKeys.CK));
      options.headers.set(HeaderKeys.USER_NAME, this.storageService.get(StorageKeys.USER_NAME));
    } else {
      if (token && !url.url.includes(refreshTokenUrlPattern)) {
        url.headers.set(HeaderKeys.AUTHORIZATION, `Bearer ${token}`);
      } else {
        this.logger.info('Could not set token to header');
      }
      if (this.storageService.get(StorageKeys.APP_NAME) != null) {
        url.headers.set(HeaderKeys.APP_NAME, this.storageService.get(StorageKeys.APP_NAME));
      } else {
        url.headers.set(HeaderKeys.APP_NAME, defaultAppName);
        this.storageService.set(StorageKeys.APP_NAME, defaultAppName);
      }
      url.headers.set(HeaderKeys.CK, this.storageService.getItem(StorageKeys.CK));
      url.headers.set(HeaderKeys.USER_NAME, this.storageService.get(StorageKeys.USER_NAME));
    }

    return this.intercept(super.request(url, options));
  }

  private intercept(observable: Observable<Response>): Observable<Response> {
    this.pendingRequests++;
    return observable.finally(() => {
      this.pendingRequests--;
      if (this.pendingRequests <= 0) {
        this.logger.debug('Token Interceptor Closing spinner');
        this.spinnerService.close();
      }
    }).timeout(this.reqTimeout).catch((error) => this.handleRequestError(error));
  }

  private handleRequestError(error: Response) {
    const url = this.getRequestUrl();
    const options = this.getOption();
    if (error.status === 401) {
      if (this.inflightAuthRequest === null) {
        const token = this.storageService.get(StorageKeys.REFRESH_TOKEN);
        this.inflightAuthRequest = this.refresh.refreshToken(token);
      }
      return this.inflightAuthRequest.pipe(mergeMap((refreshTokenResp) => {
        this.inflightAuthRequest = null;
        if (refreshTokenResp.json().status === 0 && refreshTokenResp.json().response) {
          this.logger.info('Success Refresh Token', refreshTokenResp.json());
          this.storageService.set(StorageKeys.AUTH_TOKEN, refreshTokenResp.json().response.token);
          this.storageService.set(StorageKeys.REFRESH_TOKEN, refreshTokenResp.json().response.refreshToken);
          const loginData = this.storageService.get(StorageKeys.LOGIN_DATA);
          loginData.token = refreshTokenResp.json().response.token;
          loginData.refreshToken = refreshTokenResp.json().response.refreshToken;
          this.storageService.set(StorageKeys.LOGIN_DATA, loginData);
          this.storageService.set(StorageKeys.LOGGED_AS, loginData);
          const reqUrl = TokenInterceptorService.toStrUrl(url);
          return this.request(url, options).pipe(tap(() => this.logger.info('Retrying last request ', reqUrl)));
        } else {
          this.logger.info('Error Refresh Token', refreshTokenResp.json());
          return throwError(refreshTokenResp);
        }
      }), catchError((tokenErr) => {
        const reqUrl = TokenInterceptorService.toStrUrl(url);
        this.logger.info('catchError token',
          ((typeof tokenErr.json === 'function') ? tokenErr.json() : tokenErr), 'current reqUrl:', reqUrl);
        this.logger.info('Original request error', error);
        this.logger.info('Refresh token request failed.  Redirecting user to login page');
        const redirect = document.createElement('a');
        redirect.setAttribute('id', 'redirect');
        redirect.setAttribute('href', '/');
        redirect.click();
        return throwError(error);
      }));
    } else {
      const reqUrl = TokenInterceptorService.toStrUrl(url);
      this.logger.info('handleRequestError ', ((typeof error.json === 'function') ? error.json() : error), 'current reqUrl:', reqUrl);
      return throwError(error);
    }
  }
}
