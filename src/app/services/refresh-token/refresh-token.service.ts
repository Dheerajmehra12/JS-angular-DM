import {Injectable} from '@angular/core';
import {RequestOptions, Headers, Http} from '@angular/http';
import {NGXLogger} from 'ngx-logger';
import {HttpClient, HttpContext,HttpHeaders} from '@angular/common/http';
import {AUTH_REQUIRED} from '../token-interceptor/http-client-interceptor.service';
import {ApiResponse} from '../common/api-response';

@Injectable()
export class RefreshTokenService {

  constructor(private http: Http,
              private httpClient: HttpClient,
              private logger: NGXLogger) {
  }

  refreshToken(token) {
const body = {refreshtoken: token };
const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
const options = { headers };
return this.httpClient.post('/api/proxy/ctv/refreshtoken/v1', body, options);
  }

  refreshTokenV1(token) {
    const body = {refreshtoken: token};
    return this.httpClient.post<ApiResponse<any>>('/api/proxy/ctv/refreshtoken/v1', body, {
      context: new HttpContext().set(AUTH_REQUIRED, false),
    });
  }
}
