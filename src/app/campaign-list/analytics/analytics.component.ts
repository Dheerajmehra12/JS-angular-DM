import {Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, ParamMap,Router} from '@angular/router';
import { StorageKeys } from 'src/app/services/common/constants/storage-keys';
import { WebStorageService } from 'src/app/services/web-storage.service';
import {map} from 'rxjs/operators';
import {RouteConstants} from '../../services/common/constants/route-constants';
import {
  ANALYTICS_TABS,
  AnalyticsService,
  AnalyticsTab,
  DailyStats,
  DeviceStatsRecord,
  LocationStats,
  StatsRecord
} from './analytics.service';
import {NGXLogger} from 'ngx-logger';
import {combineLatest, forkJoin} from 'rxjs';
import {AnalyticsHeaderComponent} from './analytics-header/analytics-header.component';
import {AppEventsService} from '../../services/common/app-events.service';
import { TranslateService } from '../../services/translate';
declare const $: any;

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit {
  campaignId: string;
  viewSample = false;
  reportData = false;
  hideChatBox = false;
  activeTab = null;
  resultMessage: string;
  deviceStats: DeviceStatsRecord;
  dailyStats: Array<DailyStats>;
  locationStats: Array<LocationStats>;
  overallStats: StatsRecord;
  tabs: Array<AnalyticsTab> = null;
  pdfSupported = false;
  excelSupported = false;
  downloadUrl = null;
  @ViewChild('analyticsHeaderComponent') analyticsHeaderComponent: AnalyticsHeaderComponent;
  constructor(private route: ActivatedRoute,
              private analyticsService: AnalyticsService,
              private appEventsService: AppEventsService,
              private logger: NGXLogger,private _translate: TranslateService,private storageService : WebStorageService, private router :Router) { }

  ngOnInit(): void {
    this._translate.use(localStorage.getItem('language'));
    this.resultMessage = this._translate.translate('analytics.fetching');
    this.initAnalyticsComponent();
    // to fix hiding dropdown below reporting header
    this.appEventsService.onProfileDropDownVisibilityChanged()
      .subscribe((event) => {
      if (this.analyticsHeaderComponent) {
        const fixedHeader = $(this.analyticsHeaderComponent.element.nativeElement);
        if (event.visible) {
          fixedHeader.css('z-index', 100);
          fixedHeader.removeClass('sticky-top');
        }else {
          fixedHeader.css('z-index', 100);
          fixedHeader.addClass('sticky-top');
        }
      }
    });
  }

  private initAnalyticsComponent() {
    const ob$campaignId = this.route.paramMap.pipe(map((params: ParamMap) => params.get('campaignId')));
    const ob$queryParams = this.route.queryParamMap.pipe(map((params: ParamMap) => {
      return {
        activeTab: params.get('activeTab'),
        viewSample: (params.has('useSample') && params.get('useSample') === 'true'),
        hideChatBox: (params.has('hideChatBox') && params.get('hideChatBox') === 'true'),
      };
    }));
    const ob$campaignId$handle = ((campaignId: string) => this.campaignId = campaignId);
    const ob$paramsHandle = ((queryParams: any) => {
      this.activeTab = queryParams.activeTab;
      this.viewSample = queryParams.viewSample;
      this.hideChatBox = queryParams.hideChatBox;
    });
    ob$campaignId.subscribe(ob$campaignId$handle);
    ob$queryParams.subscribe(ob$paramsHandle);
    combineLatest([
      ob$campaignId,
      ob$queryParams,
      this.analyticsService.getAnalyticsTabs(),
    ]).subscribe(([campaignId, activeTab, tabs]) => {
      ob$campaignId$handle(campaignId);
      ob$paramsHandle(activeTab);
      this.tabs = tabs;
      this.logger.info('ngOnInit() => this.activeTab from query params', this.activeTab);
      if (this.activeTab === null) {
        this.activeTab = ANALYTICS_TABS.DASHBOARD;
      }
      if (this.viewSample) {
        this.loadSampleReport();
      } else {
        this.loadReport();
      }
    });
  }

  private loadSampleDashboardData() {
    if (!this.dailyStats || !this.deviceStats || !this.locationStats || !this.reportData) {
      forkJoin([
        this.analyticsService.getSampleDailyStats(),
        this.analyticsService.getSampleDeviceStats(),
        this.analyticsService.getSampleLocationStats()
      ]).subscribe(([dailyStats, deviceStats, locationStats]) => {
        this.dailyStats = dailyStats;
        const dailyStatsTotal: StatsRecord = this.dailyStats.reduce(this.analyticsService.dailyStatsAggregator, {} as StatsRecord);
        if (dailyStatsTotal ){
          const impressions = dailyStatsTotal.impressions || 0;
          const clicks = dailyStatsTotal.clicks || 0;
          dailyStatsTotal.ctr = this.analyticsService.ctrCalculator(impressions, clicks);
          this.overallStats = dailyStatsTotal;
        }
        this.deviceStats = (deviceStats && deviceStats.length > 0) ?
          deviceStats.reduce(this.analyticsService.deviceStatsAggregator, {} as DeviceStatsRecord) :
          {} as DeviceStatsRecord;
        this.locationStats = locationStats;
        this.reportData = (dailyStats && dailyStats.length > 0)
          || (deviceStats && deviceStats.length > 0)
          || (locationStats && locationStats.length > 0);
        if (this.reportData) {
          this.excelSupported = true;
          this.pdfSupported = true;
        } else {
          this.excelSupported = false;
          this.pdfSupported = false;
        }
      });
    } else {
      if (!this.reportData) {
        this.excelSupported = false;
        this.pdfSupported = false;
      } else{
        this.excelSupported = true;
        this.pdfSupported = true;
      }
    }
  }

  private loadSampleReachData() {
    if (!this.locationStats){
      forkJoin([
        this.analyticsService.getSampleLocationStats()
      ]).subscribe(([locationStats]) => {
        this.locationStats = locationStats;
        this.reportData = (locationStats && locationStats.length > 0);
        if (this.reportData) {
          this.excelSupported = false;
          this.pdfSupported = true;
        } else {
          this.excelSupported = false;
          this.pdfSupported = false;
        }
      });
    } else {
      if (this.reportData) {
        this.excelSupported = false;
        this.pdfSupported = true;
      } else {
        this.excelSupported = false;
        this.pdfSupported = false;
      }
    }
  }

  private loadDashboardData() {
    if (!this.dailyStats || !this.deviceStats || !this.locationStats || !this.reportData) {
      this.resultMessage = this._translate.translate('analytics.fetching');
      forkJoin([
        this.analyticsService.getDailyStats(this.campaignId),
        this.analyticsService.getDeviceStats(this.campaignId),
        this.analyticsService.getLocationStats(this.campaignId)
      ]).subscribe(([dailyStats, deviceStats, locationStats]) => {
        this.dailyStats = dailyStats;
        const dailyStatsTotal: StatsRecord = this.dailyStats.reduce(this.analyticsService.dailyStatsAggregator, {} as StatsRecord);
        if (dailyStatsTotal ){
          const impressions = dailyStatsTotal.impressions || 0;
          const clicks = dailyStatsTotal.clicks || 0;
          dailyStatsTotal.ctr = this.analyticsService.ctrCalculator(impressions, clicks);
          this.overallStats = dailyStatsTotal;
        }
        this.deviceStats = (deviceStats && deviceStats.length > 0) ?
          deviceStats.reduce(this.analyticsService.deviceStatsAggregator, {} as DeviceStatsRecord) :
          {} as DeviceStatsRecord;
        this.locationStats = locationStats;
        this.reportData = (dailyStats && dailyStats.length > 0)
          || (deviceStats && deviceStats.length > 0)
          || (locationStats && locationStats.length > 0);
        if (!this.reportData) {
          this.resultMessage = this._translate.translate('analytics.noReport');
          this.excelSupported = false;
          this.pdfSupported = false;
        } else {
          this.resultMessage = '';
          this.excelSupported = true;
          this.pdfSupported = true;
        }
      });
    }else {
      if (!this.reportData) {
        this.excelSupported = false;
        this.pdfSupported = false;
      } else{
        this.excelSupported = true;
        this.pdfSupported = true;
      }
    }
  }

  private loadReachData() {
    if (!this.locationStats){
      this.resultMessage = this._translate.translate('analytics.fetching');
      forkJoin([
        this.analyticsService.getLocationStats(this.campaignId)
      ]).subscribe(([locationStats]) => {
        this.locationStats = locationStats;
        this.reportData = (locationStats && locationStats.length > 0);
        if (!this.reportData) {
          this.resultMessage = this._translate.translate('analytics.noReport');
          this.excelSupported = false;
          this.pdfSupported = false;
        } else{
          this.resultMessage = '';
          this.excelSupported = false;
          this.pdfSupported = true;
        }
      });
    }else {
      if (!this.reportData) {
        this.excelSupported = false;
        this.pdfSupported = false;
      } else{
        this.excelSupported = false;
        this.pdfSupported = (this.locationStats && this.locationStats.length > 0);
      }
    }
  }

  private loadSampleReport() {
    this.logger.info('loadSampleReport() => this.activeTab = ', this.activeTab);
    if (this.activeTab === null) {
      this.activeTab = ANALYTICS_TABS.DASHBOARD;
    }
    if (this.activeTab) {
      if (this.activeTab.trim().toLowerCase() === ANALYTICS_TABS.DASHBOARD) {
        this.loadSampleDashboardData();
      }
      if (this.activeTab.trim().toLowerCase() === ANALYTICS_TABS.REACH) {
        this.loadSampleReachData();
      }
    }
  }

  private loadReport() {
    this.logger.info('loadReport() => this.activeTab = ', this.activeTab);
    if (this.activeTab === null) {
      this.activeTab = ANALYTICS_TABS.DASHBOARD;
    }
    if (this.activeTab) {
      if (this.activeTab.trim().toLowerCase() === ANALYTICS_TABS.DASHBOARD) {
        this.loadDashboardData();
      }
      if (this.activeTab.trim().toLowerCase() === ANALYTICS_TABS.REACH) {
        this.loadReachData();
      }
    }
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

  onTabChange(tab: AnalyticsTab) {
    this.logger.info('onTabChange = ', tab);
    this.activeTab = tab.name;
    if (this.viewSample) {
      this.loadSampleReport();
    }else {
      this.loadReport();
    }
  }

  get routeConstants(): typeof RouteConstants {
    return RouteConstants;
  }

  get analyticsTabs(): typeof ANALYTICS_TABS {
    return  ANALYTICS_TABS;
  }

  viewSampleReport() {
    this.viewSample = true;
    this.logger.info('viewSampleReport() => this.activeTab = ', this.activeTab);
    this.loadSampleReport();
  }

  closeSampleReport() {
    this.viewSample = false;
  }

  onPdfExport($event) {
    this.logger.info('onPdfExport', $event);
    this.analyticsService.exportAnalyticsPdf(this.campaignId, $event.tab.name, this.viewSample).subscribe((downloadUrl) => {
      this.downloadUrl = `${window.location.origin}/api/redirectService?redirectURL=${encodeURIComponent(downloadUrl)}`;
      document.getElementById('export-download').setAttribute('href', this.downloadUrl);
      this.logger.info('this.downloadUrl = ', this.downloadUrl);
      setTimeout(() => {
        document.getElementById('export-download').click();
      });
    });
  }

  onExcelExport($event) {
    this.logger.info('onExcelExport', $event);
    this.analyticsService.exportDashboardXLS(this.campaignId, this.viewSample).subscribe((downloadUrl) => {
      this.downloadUrl = `${window.location.origin}/api/redirectService?redirectURL=${encodeURIComponent(downloadUrl)}`;
      document.getElementById('export-download').setAttribute('href', this.downloadUrl);
      this.logger.info('this.downloadUrl = ', this.downloadUrl);
      setTimeout(() => {
        document.getElementById('export-download').click();
      });
    });
  }
}
