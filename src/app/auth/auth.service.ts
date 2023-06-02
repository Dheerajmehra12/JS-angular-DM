import {Observable, throwError, throwError as observableThrowError} from 'rxjs';
import {catchError, map, mergeMap, tap} from 'rxjs/operators';
import {EventEmitter, Injectable} from '@angular/core';
import {ApiResponse} from '../services/common/api-response';
import {NGXLogger} from 'ngx-logger';
import {WebStorageService} from '../services/web-storage.service';
import {StorageKeys} from '../services/common/constants/storage-keys';
import {HttpClient, HttpContext, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {
  AUTH_REQUIRED,
  SKIP_INTERCEPT
} from '../services/token-interceptor/http-client-interceptor.service';
import * as moment from 'moment';

declare const appConfig: any;

export interface LoginInfo {
  username: string;
  password: string;
  saveCredentials: boolean;
  errorMessage?: string;
}

export enum AGENT_INFO_FIELDS {
  PHOTO = 'agentPhoto',
  EMAIL = 'email',
  CELL = 'cell',
  FIRST_NAME = 'firstName',
  LAST_NAME = 'lastName',
  AGENT_ID = 'personid',
  OFFICE_ID = 'officeId',
  BRENUMBER = 'breNumber'
}

@Injectable()
export class AuthService {
  private static COOKIE_SAVED_CREDENTIALS = 'savedCredentials';

  loggedIn = false;
  checkLogin: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(
    private http: HttpClient,
    private logger: NGXLogger,
    private storageService: WebStorageService) {
    this.checkLogin.subscribe(loggedIn => {
      this.loggedIn = loggedIn;
      this.logger.debug('this.loggedIn = ', this.loggedIn);
    });
    const authToken = this.storageService.get(StorageKeys.AUTH_TOKEN);
    if (authToken !== null) {
      this.checkLogin.emit(true);
    }
  }

  ssoLogin(token, code, sourcePortal, refreshToken) {
    this.storageService.clearAllStorage();
    let headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    headers = headers.set("rt", refreshToken);
    return this.http.get<ApiResponse<any>>(`/api/proxy/ctv/fetchtokendata/v1/${code}`, {
      headers
    }).pipe(mergeMap((resp) => {
      if (resp.status === 0) {
        this.logger.info("Response for fetch token recieved ["+JSON.stringify(resp)+"]")
        this.setAuthData(resp, sourcePortal);
        return Observable.of(resp.status);
      }else{
        return throwError(new HttpErrorResponse({error: resp, headers, status: 401, statusText: 'UnAuthorized'}));
      }
    }));
  }

  getSsoToken(portalName: string, username: string, password: string) {
    let loginUrl = '/api/proxy';
    if (portalName === 'alm') {
      loginUrl = loginUrl + '/alm/login/v1';
    } else if (portalName === 'angular-dm') {
      loginUrl = loginUrl + '/ctv/login/v1';
    } else if (portalName === 'angular-dm') {
      loginUrl = loginUrl + '/magnet/login/v1';
    }

    return this.http.post<ApiResponse<any>>(loginUrl, {username, password}, {
      context: new HttpContext().set(SKIP_INTERCEPT, true)
    }).pipe(map((tokenResp) => {
      if (tokenResp.status === 0 && tokenResp.response) {
        return tokenResp.response;
      } else {
        throwError(tokenResp);
      }
    }));
  }

  private setAuthData(data,  sourcePortal) {
    this.storageService.clearAllStorage();
    const loginResponse: any = data.response.loginInfo;
    this.storageService.set(StorageKeys.SOURCE_PORTAL, sourcePortal);
    this.storageService.set(StorageKeys.LOGIN_DATA, loginResponse);
    this.storageService.set(StorageKeys.LOGGED_AS, loginResponse);
    this.storageService.set(StorageKeys.AUTH_TOKEN, loginResponse.token);
    this.storageService.set(StorageKeys.REFRESH_TOKEN, loginResponse.refreshToken);
    this.checkLogin.emit(true);
  }

  signIn(loginInfo: LoginInfo) {
    this.logger.info('signin service reached', loginInfo);
    const body = {username: loginInfo.username, password: loginInfo.password};
    return this.http.post<ApiResponse<any>>('/api/login', body, {
      context: new HttpContext().set(AUTH_REQUIRED, false),
    }).pipe(tap( (data) => {
        this.setAuthData(data, '');
      }),
      catchError((error: Response) => observableThrowError(error || 'Server error')), );
  }

  onLoginStatusChange() {
    return this.checkLogin;
  }

  verifyCaptcha(token) {
    return this.http.post<any>('/api/verifycaptcha', {response: token, secret: appConfig.gcaptchaSecretKey}, {
      context: new HttpContext().set(AUTH_REQUIRED, false),
    }).pipe(tap( resLog => this.logger.info(resLog)),
        catchError((error: Response) => observableThrowError(error || 'Server error')), );
  }

  encryptPassword(loginInfo: LoginInfo) {
    return this.http.post<any>('/api/encryptPassword', {
      username: loginInfo.username,
      password: loginInfo.password
    }, {
      context: new HttpContext().set(AUTH_REQUIRED, false),
    }).pipe(map(resp => resp.passwordHex));
  }

  decryptPassword(username, passwordHex) {
    return this.http.post<any>('/api/decryptPassword', {
      username,
      passwordHex
    }, {
      context: new HttpContext().set(AUTH_REQUIRED, false),
    }).pipe(map( resp => resp.password));
  }

  saveCredentials(username, passwordHex) {
    this.storageService.setCookie(AuthService.COOKIE_SAVED_CREDENTIALS, {username, passwordHex}, moment().add(100, 'year').toDate());
  }

  getSavedCredentials(): {username, passwordHex} {
    return this.storageService.getCookie(AuthService.COOKIE_SAVED_CREDENTIALS);
  }

  clearCredentials() {
    this.storageService.removeCookie(AuthService.COOKIE_SAVED_CREDENTIALS);
  }

  logout() {
    this.storageService.clearAllStorage();
    this.checkLogin.emit(false);
  }

  getAgentInfo(field: AGENT_INFO_FIELDS) {
    const loginData = this.storageService.get<any>(StorageKeys.LOGIN_DATA);
    const agentInfo = loginData.agentInfo;
    return agentInfo[field];
  }

  hasAdminRole() {
    const loginData = this.storageService.get<any>(StorageKeys.LOGIN_DATA);
    return loginData && loginData.role && loginData.role.trim().toLowerCase()==='admin';
  }

  isSuperAdmin() {
    const loginData = this.storageService.get<any>(StorageKeys.LOGIN_DATA);
    return loginData.superUser === true;
  }
}
