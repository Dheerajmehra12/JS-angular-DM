import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {fromEvent, Observable, throwError} from 'rxjs';
import {Injectable} from '@angular/core';
import {mapTo, retryWhen, switchMap} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class NetworkInterceptor implements HttpInterceptor{
  private networkChanged = fromEvent(window, 'online').pipe(mapTo(true));
  get isOnline() {
    return navigator.onLine;
  }
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      retryWhen(errors => {
        if (this.isOnline) {
          return errors.pipe(switchMap(err => throwError(err)));
        }
        return this.networkChanged;
      })
    );
  }
}
