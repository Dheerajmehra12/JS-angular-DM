import {StorageKeys} from './common/constants/storage-keys';
import {WebStorageService} from './web-storage.service';
import {Injectable} from '@angular/core';
import {NGXLogger} from 'ngx-logger';

@Injectable({
  providedIn: 'root',
  useFactory: StorageHelperService.getInstance,
  deps: [WebStorageService, NGXLogger]
})
export class StorageHelperService {
  private constructor() {
  }

  static self: StorageHelperService = new StorageHelperService();
  private storageService: WebStorageService = null;
  private logger: NGXLogger;

  private readonly CAMPAIGN_KEYS = [
    StorageKeys.FOOTER_BANNER,
    StorageKeys.SELECTED_PLAN,
    StorageKeys.LOCATION_DATA,
    StorageKeys.CAMPAIGN_INFO,
    StorageKeys.CAMPAIGN_ID,
    StorageKeys.CAMPAIGN_STATUS,
    StorageKeys.CAMPAIGN_EDIT,
    StorageKeys.TEMPLATE_ID,
    StorageKeys.TEMPLATE_DATA
  ];

  static getInstance(storageService: WebStorageService, logger: NGXLogger): StorageHelperService {
    StorageHelperService.self.storageService = storageService;
    StorageHelperService.self.logger = logger;
    return StorageHelperService.self;
  }

  clearCampaignKeys() {
    this.CAMPAIGN_KEYS.forEach((key) => this.storageService.remove(key));
  }
}
