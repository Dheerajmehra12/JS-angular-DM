import {ElementRef, Injectable} from '@angular/core';
import {Subject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppEventsService {
  private profileDropDownVisibilitySubject: Subject<{elem: ElementRef, visible: boolean}>
    = new Subject<{elem: ElementRef, visible: boolean}>();

  constructor() { }

  onProfileDropDownVisibilityChanged() {
    return this.profileDropDownVisibilitySubject.asObservable();
  }

  profileDropDownVisibilityChanged($event) {
    this.profileDropDownVisibilitySubject.next($event);
  }
}
