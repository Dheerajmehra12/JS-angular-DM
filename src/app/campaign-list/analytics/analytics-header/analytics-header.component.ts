import {Component, ElementRef, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {RouteConstants} from '../../../services/common/constants/route-constants';
import { WebStorageService } from 'src/app/services/web-storage.service';
import { StorageKeys } from 'src/app/services/common/constants/storage-keys';
import {AnalyticsTab} from '../analytics.service';
import {Router} from '@angular/router';
import { TranslateService } from '../../../services/translate';


@Component({
  selector: 'app-analytics-header',
  templateUrl: './analytics-header.component.html',
  styleUrls: ['./analytics-header.component.css']
})
export class AnalyticsHeaderComponent implements OnInit {
  @Input() tabs: Array<AnalyticsTab>;
  @Input() activeTab: string;
  @Input() pdfSupported = false;
  @Input() excelSupported = false;
  @Output() tabChange: EventEmitter<AnalyticsTab> = new EventEmitter<AnalyticsTab>();
  @Output() pdfExport: EventEmitter<{elem: ElementRef, tab: AnalyticsTab}> = new EventEmitter<{elem: ElementRef, tab: AnalyticsTab}>();
  @Output() excelExport: EventEmitter<{elem: ElementRef, tab: AnalyticsTab}> = new EventEmitter<{elem: ElementRef, tab: AnalyticsTab}>();

  private currentTab: AnalyticsTab;
  currentUrl: string;
    constructor(private  router: Router, public element: ElementRef,private _translate: TranslateService ,private storageService:WebStorageService) { }

  ngOnInit(): void {
    this._translate.use(localStorage.getItem('language'));
    if (this.activeTab && this.activeTab !== ''){
      const result = this.tabs.filter((tab) => tab.name === this.activeTab);
      if (result && result.length > 0) {
        this.currentTab = result[0];
      }
    }
    this.currentUrl = this.router.url;
  }

  get routeConstants(): typeof RouteConstants {
    return RouteConstants;
  }
  backbutton(){
    if(this.storageService.get(StorageKeys.DASHBOARD_ROUTE)===`/${RouteConstants.CAMPAIGN_LIST}/${RouteConstants.MY}/${RouteConstants.DASHBOARD}`){
      this.router.navigate([`/${RouteConstants.CAMPAIGN_LIST}/${RouteConstants.MY}/${RouteConstants.DASHBOARD}`])
      this.storageService.remove(StorageKeys.DASHBOARD_ROUTE);
    }
    else {
      this.router.navigate([`/${RouteConstants.CAMPAIGN_LIST}/${RouteConstants.CAMPAIGNS}`]);
    }
  }

  onTabClick(tab: AnalyticsTab) {
    this.activeTab = tab.name;
    this.currentTab = tab;
    this.tabChange.emit(tab);
  }

  exportPdf(event) {
    this.pdfExport.emit({elem: event, tab: this.currentTab});
  }

  exportExcel(event) {
    this.excelExport.emit({elem: event, tab: this.currentTab});
  }

  pdfTitle(evt) {
    if(evt == 'pdf') {
      return this._translate.translate('analytics.reportPdf');
    }else {
      return this._translate.translate('analytics.dwnExcel');
    }
  }
}
