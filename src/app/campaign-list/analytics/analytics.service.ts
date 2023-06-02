import {Injectable} from '@angular/core';
import {Observable, throwError} from 'rxjs';
import {HttpClient, HttpContext} from '@angular/common/http';
import {catchError, map, mergeMap} from 'rxjs/operators';
import {ApiResponse} from '../../services/common/api-response';
import {NGXLogger} from 'ngx-logger';
import {AUTH_REQUIRED} from '../../services/token-interceptor/http-client-interceptor.service';
import {WebStorageService} from '../../services/web-storage.service';
import {StorageKeys} from '../../services/common/constants/storage-keys';

import {AppConstant} from '../../services/common/constants/app-constant';
declare const google: any;

export interface AnalyticsTab {
  name: string;
  label: string;
}

export enum ANALYTICS_TABS {
  DASHBOARD = 'dashboard',
  REACH = 'reach'
}

export interface DailyStats {
  clicks: number;
  ctr: number;
  date: string;
  daterange: string;
  impressions: number;
}

export interface DeviceStats {
  clicks: number;
  device: string;
  impressions: number;
}

export interface SummaryStats {
  clicks: number;
  device: string;
  impressions: number;
}

export interface LocationStats {
  clicks: number;
  lon: number;
  impressions: number;
  lat: number;
}

export interface StatsRecord {
  impressions: number;
  clicks: number;
  ctr: number;
}

export interface DeviceStatsRecord {
  android: StatsRecord;
  ios: StatsRecord;
  other: StatsRecord;
  desktop: StatsRecord;
}

export enum ALL_STATS_DEVICES {
  ANDROID = 'android',
  IOS = 'ios',
  OTHER = 'other',
  DESKTOP = 'desktop'
}

export enum BarChartType {
  IMPRESSION,
  CLICKS,
  CTR
}

export enum HeatMapType {
  IMPRESSIONS,
  CLICKS,
}

export function getDeviceStatsLabel(device: string) {
  if (device === ALL_STATS_DEVICES.ANDROID) {
    return 'ANDROID';
  }else if (device === ALL_STATS_DEVICES.IOS) {
    return 'IOS';
  }else if (device === ALL_STATS_DEVICES.DESKTOP) {
    return 'DESKTOP';
  }else if (device === ALL_STATS_DEVICES.OTHER) {
    return  'OTHER DEVICE';
  }
  return device;
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {

  constructor(private http: HttpClient, private logger: NGXLogger, private storageService: WebStorageService, ) { }
  getAnalyticsTabs(): Observable<Array<AnalyticsTab>> {
    const tabs: Array<AnalyticsTab> = [{name: 'dashboard', label: 'Dashboard'}, {name: 'reach', label: 'Reach'}];
    return Observable.of(tabs);
  }

  getSampleLocationStats() {
    return this.http.get<ApiResponse<Array<LocationStats>>>('/samples/sample-location-stats.json', {
      context: new HttpContext().set(AUTH_REQUIRED, false)
    }).pipe(map((apiResp) => (apiResp.response && apiResp.response.length) ? apiResp.response : [] as Array<LocationStats>),
      catchError((error) => {
        this.logger.error('getSampleLocationStats Error', error);
        return Observable.of([] as Array<LocationStats>);
      }));
  }

  getLocationStats(campaignId: string) {
    return this.http.get<ApiResponse<Array<LocationStats>>>(`/api/proxy/ctv/locationstats/v1/${campaignId}`)
      .pipe(map((apiResp) => (apiResp.response && apiResp.response.length) ?
        apiResp.response : [] as Array<LocationStats>),
      catchError((error) => {
        this.logger.error('getLocationStats Error', error);
        return Observable.of([] as Array<LocationStats>);
      }));
  }

  getSampleDailyStats() {
    return this.http.get<ApiResponse<Array<DailyStats>>>('/samples/sample-daily-stats.json', {
      context: new HttpContext().set(AUTH_REQUIRED, false)
    }).pipe(map((apiResp) => (apiResp.response && apiResp.response.length) ? apiResp.response : [] as Array<DailyStats>),
      catchError((error) => {
      this.logger.error('getSampleDailyStats Error', error);
      return Observable.of([] as Array<DailyStats>);
    }));
  }

  getDailyStats(campaignId: string) {
    return this.http.get<ApiResponse<Array<DailyStats>>>(`/api/proxy/ctv/dailystats/v1/${campaignId}`)
      .pipe(map((apiResp) => (apiResp.response && apiResp.response.length) ?
        apiResp.response : [] as Array<DailyStats>),
      catchError((error) => {
        this.logger.error('getDailyStats Error', error);
        return Observable.of([] as Array<DailyStats>);
      }));
  }

  getSampleDeviceStats() {
    return this.http.get<ApiResponse<Array<DeviceStats>>>('/samples/sample-device-stats.json', {
      context: new HttpContext().set(AUTH_REQUIRED, false)
    }).pipe(map((apiResp) => (apiResp.response && apiResp.response.length) ? apiResp.response : [] as Array<DeviceStats>),
      catchError((error) => {
        this.logger.error('getSampleDeviceStats Error', error);
        return Observable.of([] as Array<DeviceStats>);
      }));
  }

  getDeviceStats(campaignId: string) {
    return this.http.get<ApiResponse<Array<DeviceStats>>>(`/api/proxy/ctv/devicestats/v1/${campaignId}`)
      .pipe(map((apiResp) => (apiResp.response && apiResp.response.length) ?
        apiResp.response : [] as Array<DeviceStats>),
      catchError((error) => {
        this.logger.error('getDeviceStats Error', error);
        return Observable.of([] as Array<DeviceStats>);
      }));
  }
  
  getSummaryStats(campaignId: string) {
    const loginData = this.storageService.get(StorageKeys.LOGGED_AS);
    var personid = (loginData && loginData.agentInfo && loginData.agentInfo.personid) ? loginData.agentInfo.personid : null;

    var profileText = this.storageService.get(StorageKeys.PROFILE_TEXT);
    if (profileText === AppConstant.PERSONAL_PROFILE_TEXT_MENU_ITEM) {
      var teamProfile = this.storageService.get(AppConstant.TEAM_PROFILE);
      if(teamProfile) {
        personid = teamProfile['teamId'];
      }
    }
    return this.http.get<ApiResponse<Array<SummaryStats>>>('/api/proxy/ctv/summarystats/v1?personid='+personid)
      .pipe(map((apiResp) => (apiResp.response && apiResp.response.length) ?
        apiResp.response : [] as Array<SummaryStats>),
      catchError((error) => {
        this.logger.error('getSummaryStats  API Error', error);
        return Observable.of([] as Array<SummaryStats>);
      }));
  }

  exportAnalyticsPdf(campaignId: string, activeTab = ANALYTICS_TABS.DASHBOARD, useSample = false) {
    const loginData = this.storageService.get(StorageKeys.LOGGED_AS);
    const token = (loginData && loginData.token) ? loginData.token : '';
    const refreshToken = (loginData && loginData.refreshToken) ? loginData.refreshToken : '';
    const xpressdocCode = (loginData && loginData.logininfo && loginData.logininfo.code) ? loginData.logininfo.code : '';
    return this.http.get<{ ecode: number; edesc: string; url: string; s3Url: string; }>('/api/exportAnalyticsPDF', {
      params: {
        campaignId,
        activeTab,
        useSample,
        token: encodeURIComponent(token),
        refreshToken: encodeURIComponent(refreshToken),
        xpressdocCode,
      }
    }).pipe(mergeMap((resp) => {
      if (resp.ecode === 0){
        return Observable.of(resp.url);
      } else {
        return throwError(resp);
      }
    }));
  }

  exportDashboardXLS(campaignId: string, useSample = false) {
    return this.http.get<{ ecode: number; edesc: string; url: string; s3Url: string; }>('/api/exportDashboardXLS', {
      params: {
        campaignId,
        useSample,
      }
    }).pipe(mergeMap((resp) => {
      if (resp.ecode === 0){
        return Observable.of(resp.url);
      } else {
        return throwError(resp);
      }
    }));
  }

  initGoogleMap(mapContainer) {
    return  new google.maps.Map(mapContainer, {
      center: {lat: 39, lng: -95},
      zoom: 8
    });
  }

  covertToHeatMapData(stats: Array<LocationStats>) {
    const impressionPoints = [];
    const impressionBounds = new google.maps.LatLngBounds();
    const clicksPoints = [];
    const clicksBounds = new google.maps.LatLngBounds();
    if (stats && stats.length > 0) {
      stats.forEach((record) => {
        const lat = parseFloat(String(record.lat));
        const lng = parseFloat(String(record.lon));
        if (!isNaN(lat) && lat !== 0 && !isNaN(lng) && lng !== 0) {
          const location = new google.maps.LatLng(lat, lng);
          impressionPoints.push(location);
          impressionBounds.extend(location);
          if (record.clicks > 0) {
            clicksPoints.push(location);
            clicksBounds.extend(location);
          }
        }
      });
    }
    return {
      impressionPoints,
      impressionBounds,
      clicksPoints,
      clicksBounds
    };
  }

  getReachMapLayer(stats: Array<LocationStats>) {
    if (stats && stats.length > 0) {
      const impressionBounds = new google.maps.LatLngBounds();
      const impressionReachData = new google.maps.Data();
      impressionReachData.setStyle((feature) => {
        const clicks = feature.getProperty('clicks');
        const impressions = feature.getProperty('impressions');
        const impressionsRatio = 20 - clicks / impressions * 20;
        return ({
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: (impressionsRatio > 2) ? impressionsRatio : 2,
            fillColor: '#f00',
            fillOpacity: 0.25,
            strokeWeight: 0
          }
        });
      });
      const clicksReachData = new google.maps.Data();
      clicksReachData.setStyle( (feature) => {
        const clicks = feature.getProperty('clicks');
        const impressions = feature.getProperty('impressions');
        const clickRatio = clicks / impressions * 20;

        return ({
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: ( clickRatio > 2 ) ? clickRatio : 2,
            fillColor: '#0f0',
            fillOpacity: 0.45,
            strokeWeight: 0
          }
        });
      });
      stats.forEach( (record) => {
        const feature = {
          properties: {
            impressions: record.impressions,
            clicks: record.clicks,
          },
          geometry: {
            lat: parseFloat(String(record.lat)),
            lng: parseFloat(String(record.lon))
          }
        };
        impressionReachData.add(feature);
        if ( record.clicks > 0) {
          clicksReachData.add(feature);
        }
        impressionBounds.extend(new google.maps.LatLng(parseFloat(String(record.lat)), parseFloat(String(record.lon))));
      });
      return  {
        impressionBounds,
        impressionReachData,
        clicksReachData
      };
    }
    return null;
  }

  getImpressionHeatMapLayer(heatMapData) {
    if (heatMapData && heatMapData.impressionPoints && heatMapData.impressionPoints.length > 0) {
      const heat = new google.maps.visualization.HeatmapLayer({
        data: heatMapData.impressionPoints
      });
      heat.set('gradient', this.heatMapGradient());
      return heat;
    }
    return null;
  }

  getClicksHeatMapLayer(heatMapData) {
    if (heatMapData && heatMapData.clicksPoints && heatMapData.clicksPoints.length > 0) {
      const heat = new google.maps.visualization.HeatmapLayer({
        data: heatMapData.clicksPoints
      });
      heat.set('gradient', this.heatMapGradient());
      return heat;
    }
    return null;
  }

  heatMapGradient() {
    return [
      'rgba(0, 255, 255, 0)',
      'rgba(0, 255, 255, 1)',
      'rgba(0, 191, 255, 1)',
      'rgba(0, 127, 255, 1)',
      'rgba(0, 63, 255, 1)',
      'rgba(0, 0, 255, 1)',
      'rgba(0, 0, 223, 1)',
      'rgba(0, 0, 191, 1)',
      'rgba(0, 0, 159, 1)',
      'rgba(0, 0, 127, 1)',
      'rgba(63, 0, 91, 1)',
      'rgba(127, 0, 63, 1)',
      'rgba(191, 0, 31, 1)',
      'rgba(255, 0, 0, 1)'
    ];
  }

  get dailyStatsAggregator() {
    return (accVal: StatsRecord, currVal: DailyStats) => {
      const newStats = {} as StatsRecord;
      newStats.impressions = (accVal.impressions || 0) + currVal.impressions;
      newStats.clicks = (accVal.clicks || 0) + currVal.clicks;
      return newStats;
    };
  }

  get ctrCalculator() {
    return (impressions, clicks) => {
      const impr = impressions || 0;
      const clk = clicks || 0;
      return (impr > 0 && clk > 0) ? clk / impr * 100 : 0;
    };
  }

  get deviceStatsAggregator() {
    return (accVal: DeviceStatsRecord, value: DeviceStats) => {
      const currVal = this.mapToDeviceStatsRecord(value);
      if (Object.entries(accVal).length === 0){
        return currVal;
      } else {
        Object.entries(currVal).forEach(([key, val]) => {
          if (val.impressions > 0 || val.clicks > 0 || val.ctr > 0) {
            accVal[key] = val;
          }
        });
        return accVal;
      }
    };
  }

  private mapToDeviceStatsRecord(deviceStats: DeviceStats) {
    const accVal = {} as DeviceStatsRecord;

    const device = (deviceStats.device && deviceStats.device.trim().toLowerCase()) || '';
    const impressions = deviceStats.impressions || 0;
    const clicks = deviceStats.clicks || 0;
    const ctr = this.ctrCalculator(impressions, clicks);

    Object.values(ALL_STATS_DEVICES).forEach((dev) => {
      const stats = {} as StatsRecord;
      if (dev === device) {
        stats.impressions = impressions;
        stats.clicks = clicks;
        stats.ctr = ctr;
      } else {
        stats.impressions = 0;
        stats.clicks = 0;
        stats.ctr = 0;
      }
      accVal[dev] = stats;
    });

    return accVal;
  }
}
