import {Injectable} from '@angular/core';
import {HttpClient, HttpContext} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, tap} from 'rxjs/operators';
import {NGXLogger} from 'ngx-logger';
import {AUTH_REQUIRED} from './token-interceptor/http-client-interceptor.service';

@Injectable({
  providedIn: 'root'
})
export class ThemingService {

  constructor(
    private http: HttpClient,
    private logger: NGXLogger,
  ) {
  }

  getTheme(): Observable<any> {
    return this.http.get('/api/theme', {
      context: new HttpContext().set(AUTH_REQUIRED, false)
    }).pipe(tap(r => this.logger.debug('fetched theme data')),
      catchError(this.handleError<any>('getTheme', {})));
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      this.logger.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }
}
