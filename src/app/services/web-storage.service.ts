import {Injectable} from '@angular/core';
import {LocalStorageService, SessionStorageService, SyncStorage} from 'ngx-webstorage';
import {StorageKeys} from './common/constants/storage-keys';
import {StorageType} from './common/constants/storage-type';
import {CookieService} from 'ngx-cookie-service';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root',
  useFactory: WebStorageService.createStorageService,
  deps: [LocalStorageService, SessionStorageService,  SessionStorageService, CookieService]
})
export class WebStorageService {

  private static storageService: WebStorageService = new WebStorageService();

  private localStorageService: LocalStorageService;
  private sessionStorageService: SessionStorageService;
  private defaultStorage: SyncStorage;
  private cookieService: CookieService;

  private constructor() {
  }

  /**
   * Factory method to create service object.
   */
  static createStorageService(localStorageService: LocalStorageService,
                              sessionStorageService: SessionStorageService,
                              defaultStorage: SyncStorage,
                              cookieService: CookieService,
  ): WebStorageService {
    WebStorageService.storageService.localStorageService = localStorageService;
    WebStorageService.storageService.sessionStorageService = sessionStorageService;
    WebStorageService.storageService.defaultStorage = defaultStorage;
    WebStorageService.storageService.cookieService = cookieService;
    return WebStorageService.storageService;
  }

  /**
   * Set data in cookie at path / with default expiry time 24 hour
   */
  setCookie<T>(key: string, value: T, expires: Date = moment().add(24, 'hour').toDate()) {
    if ( typeof value !== 'undefined') {
      if ( typeof value === 'object') {
        this.cookieService.set(key, JSON.stringify(value), expires, '/');
      } else if ( typeof value === 'string') {
        this.cookieService.set(key, value, expires, '/');
      }
    }
  }

  /**
   * get data from cookie
   */

  getCookie<T>(key: string) {
    if (this.cookieService.check(key)) {
      const valueStr = this.cookieService.get(key);
      let retVal = null;
      try {
        retVal = JSON.parse(valueStr);
      } catch (e) {
        retVal = valueStr;
      }
      return retVal;
    }
    return null;
  }

  /**
   * Remove cookie
   */
  removeCookie(key: string) {
    this.cookieService.delete(key);
  }

  /**
   * Remove all cookies
   */
  removeAllCookies() {
    this.cookieService.deleteAll();
  }

  /**
   * Set data in local storage by default using native implementation.
   * You can override the behaviour using storageType parameter and useNative flag
   */
  setItem<T>(key: string, value: T, storageType: StorageType = StorageType.LOCAL_STORAGE, useNative: boolean = true){
    if ( storageType === StorageType.LOCAL_STORAGE) {
      if (useNative) {
        if ( typeof value !== 'undefined') {
          if (typeof value === 'object') {
            localStorage.setItem(key, JSON.stringify(value));
          } else if ( typeof value === 'string') {
            localStorage.setItem(key, value);
          }
        }
      } else {
        this.localStorageService.store(key, value);
      }
    } else if ( storageType === StorageType.SESSION_STORAGE) {
      if (useNative) {
        if ( typeof value !== 'undefined') {
          if (typeof value === 'object') {
            sessionStorage.setItem(key, JSON.stringify(value));
          } else if ( typeof value === 'string') {
            sessionStorage.setItem(key, value);
          }
        }
      } else{
        this.sessionStorageService.store(key, value);
      }
    }
  }

  /**
   * get data from local storage by default using native implementation.
   * You can override the behaviour using storageType parameter and useNative flag
   */
  getItem<T>(key: string, storageType: StorageType = StorageType.LOCAL_STORAGE, useNative: boolean = true){
    let retVal: any = null;
    if ( storageType === StorageType.LOCAL_STORAGE) {
      if (useNative) {
        const value = localStorage.getItem(key);
        try {
          retVal = JSON.parse(value);
        } catch (e) {
          retVal = value;
        }
      } else {
        retVal = this.localStorageService.retrieve(key);
      }
    } else if ( storageType === StorageType.SESSION_STORAGE) {
      if (useNative) {
        const value = sessionStorage.getItem(key);
        try {
          retVal = JSON.parse(value);
        } catch (e) {
          retVal = value;
        }
      } else{
        retVal = this.sessionStorageService.retrieve(key);
      }
    }
    return retVal;
  }

  /**
   * remove data from local storage by default using native implementation.
   * You can override the behaviour using storageType parameter and useNative flag
   */
  removeItem(key: string, storageType: StorageType = StorageType.LOCAL_STORAGE, useNative: boolean = true) {
    if (storageType === StorageType.LOCAL_STORAGE) {
      if (useNative) {
        localStorage.removeItem(key);
      } else {
        this.localStorageService.clear(key);
      }
    } else if (storageType === StorageType.SESSION_STORAGE) {
      if (useNative) {
        sessionStorage.removeItem(key);
      } else {
        this.sessionStorageService.clear(key);
      }
    }
  }

  /**
   * add entry for supplied key and value
   */
  set<T>(key: string, value: T) {
    this.defaultStorage.store(key, value);
  }

  /**
   * get entry for supplied key
   */
  get<T>(key: string) {
    return this.defaultStorage.retrieve(key);
  }

  /**
   * Remove entry for supplied key
   */
  remove(key: string) {
    this.defaultStorage.clear(key);
  }

  /**
   * Remove all keys from {@link WebStorageService.defaultStorage} for all defined keys in {@link StorageKeys}
   */
  removeAll() {
    Object.values(StorageKeys).forEach(key => this.remove(key));
  }

  /**
   * Remove all keys from all storage for all defined keys in {@link StorageKeys}
   */
  clearAllStorage() {
    Object.values(StorageKeys).forEach(key => {
      this.sessionStorageService.clear(key);
      this.localStorageService.clear(key);
    });
  }

  /**
   * Clear all data using native localStorage and sessionStorage.
   */
  clear() {
    localStorage.clear();
    sessionStorage.clear();
  }
}
