import { Component, OnInit } from '@angular/core';
import {StorageKeys} from '../services/common/constants/storage-keys';
import {WebStorageService} from '../services/web-storage.service';
import {Router} from '@angular/router';
import {RouteConstants} from '../services/common/constants/route-constants';
import {StorageHelperService} from '../services/storage-helper-service';
import {Title} from '@angular/platform-browser';
import { TranslateService } from '../services/translate';
import { AppConstant } from '../services/common/constants/app-constant';


declare const appConfig: any;
@Component({
  selector: 'app-payment-done',
  templateUrl: './payment-done.component.html',
  styleUrls: ['./payment-done.component.css']
})
export class PaymentDoneComponent implements OnInit {
  agentInfo: any = {};

  constructor(private storageService: WebStorageService,
              private storageHelper: StorageHelperService,
              private router: Router,
              private titleService: Title,
              private _translate: TranslateService
              ) { }

  ngOnInit(): void {
    this._translate.use(localStorage.getItem('language'));
    this.titleService.setTitle(`${appConfig.appDisplayName}: Congratulations`);
    const loginInfo = this.storageService.get(StorageKeys.LOGIN_DATA);
    this.agentInfo = loginInfo.agentInfo;
    var profileText = this.storageService.get(StorageKeys.PROFILE_TEXT);
    if (profileText === AppConstant.PERSONAL_PROFILE_TEXT_MENU_ITEM) {
      var profile = this.storageService.get(AppConstant.TEAM_PROFILE);
      if(profile) {
        this.agentInfo.firstName = profile['teamName'];
        this.agentInfo.lastName = '';
      }
    }
  }

  onDone(): void {
    this.storageHelper.clearCampaignKeys();
    this.router.navigate([RouteConstants.CAMPAIGN_LIST]);
  }

}
