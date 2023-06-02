import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {NGXLogger} from 'ngx-logger';
import {WebStorageService} from '../services/web-storage.service';
import {StorageKeys} from '../services/common/constants/storage-keys';
import {ApiResponse} from '../services/common/api-response';
import {catchError, map, mergeMap} from 'rxjs/operators';
import {Observable, throwError} from 'rxjs';
import {PlanService} from '../select-plan/plan.service';
import { AppConstant } from '../services/common/constants/app-constant';
import {CAMPAIGN_STATUS, transformCampaignStatus} from '../shared/campaign-status.pipe';

export interface CampaignListResponse {
  total: number;
  ads: Array<any>;
}

@Injectable({
  providedIn: 'root'
})
export class CampaignListService {
  private limitOptions = [10, 25, 50, 100, 500];

  constructor(private http: HttpClient,
              private storageService: WebStorageService,
              private planService: PlanService,
              private logger: NGXLogger,
  ) {
  }

  getLimitOptions() {
    return Observable.of(this.limitOptions);
  }

  getCampaignsCount() {
    let ob$CampaignCount: Observable<number> = null;
    if (this.storageService.get<number>(StorageKeys.CAMPAIGN_COUNT)) {
      ob$CampaignCount = Observable.of(this.storageService.get<number>(StorageKeys.CAMPAIGN_COUNT));
    } else{
      ob$CampaignCount = this.getCampaigns().pipe(map((resp) => resp.total));
    }
    return ob$CampaignCount;
  }

  getCampaigns(startIdx = 0, pageSize = 10,filterBy={},sortBy="") {
    const loginData = this.storageService.get(StorageKeys.LOGGED_AS);
    var personid = (loginData && loginData.agentInfo && loginData.agentInfo.personid) ? loginData.agentInfo.personid : null;
    var profileText = this.storageService.get(StorageKeys.PROFILE_TEXT);
    if (profileText === AppConstant.PERSONAL_PROFILE_TEXT_MENU_ITEM) {
      var teamProfile = this.storageService.get("team_profile");
      personid = teamProfile['teamId'];
    }
    if (personid !== null) {
      return this.http.get<ApiResponse<CampaignListResponse>>('/api/proxy/ctv/fetchcampaigns/v1', {
        params: {
          personid,
          startIdx,
          pageSize
        }
      }).pipe(mergeMap((resp) => {
        if (resp.status === 0 && resp.response) {
          const campaignCount = (resp.response.total || 0);
          this.storageService.set(StorageKeys.CAMPAIGN_COUNT, campaignCount);
          return Observable.of(resp.response).pipe(map((campListResp) => {
            if (campListResp && campListResp.ads && campListResp.ads.length > 0) {
              campListResp.ads.forEach(this.campaignMapper());
            }
            return campListResp;
          }));
        } else {
          return throwError(resp);
        }
      }), catchError((error) => {
        this.logger.error('Error fetch campaigns', error);
        return Observable.of({
          total: 0,
          ads: null,
        } as CampaignListResponse);
      }));
    } else{
      return  Observable.of({
        total: 0,
        ads: null,
      } as CampaignListResponse);
    }
  }

fetchTeamByContactId() {
    const loginData = this.storageService.get(StorageKeys.LOGGED_AS);
    const personid = (loginData && loginData.agentInfo && loginData.agentInfo.personid) ? loginData.agentInfo.personid : null;
    if (personid !== null) {
      return this.http.get<ApiResponse<any>>('/api/proxy/alm/team/profileby/'+personid).pipe(mergeMap((resp) => {
                  if (resp.status === 0 && resp.response) {
                        return Observable.of(resp.response).pipe(map((teamData) => {
                              return teamData;
                        }));
                  } else {
                        return throwError(resp);
                        return Observable.of({"team_members":[], "team_profile":{}}) as any;
                  }
              }), catchError((error) => {
                  this.logger.error('Error fetch campaigns', error);
                  return Observable.of({"team_members":[], "team_profile":{}}) as any;
              }));
    }

  }

  fetchCampaignsV2(startIdx = 0, pageSize = 10,sortBy="createdate",sortOrder='desc',filterBy={}) {
    const loginData = this.storageService.get(StorageKeys.LOGGED_AS);
    var personid = (loginData && loginData.agentInfo && loginData.agentInfo.personid) ? loginData.agentInfo.personid : null;

    var profileText = this.storageService.get(StorageKeys.PROFILE_TEXT);
    if (profileText === AppConstant.PERSONAL_PROFILE_TEXT_MENU_ITEM) {
      var teamProfile = this.storageService.get(AppConstant.TEAM_PROFILE);
      if(teamProfile) {
        personid = teamProfile['teamId'];
      }
    }

    if (personid !== null) {
      return this.http.post<ApiResponse<CampaignListResponse>>('/api/proxy/ctv/fetchcampaigns/v2',filterBy, {
        params: {
          pageSize,
          personid,
          sortBy,
          sortOrder,
          startIdx,
        }
      }).pipe(mergeMap((resp) => {
        if (resp.status === 0 && resp.response) {
          const campaignCount = (resp.response.total || 0);
          this.storageService.set(StorageKeys.CAMPAIGN_COUNT, campaignCount);
          return Observable.of(resp.response).pipe(map((campListResp) => {
            if (campListResp && campListResp.ads && campListResp.ads.length > 0) {
              campListResp.ads.forEach(this.campaignMapper());
            }
            return campListResp;
          }));
        } else {
          return throwError(resp);
        }
      }), catchError((error) => {
        this.logger.error('Error fetch campaigns', error);
        return Observable.of({
          total: 0,
          ads: null,
        } as CampaignListResponse);
      }));
    } else{
      return  Observable.of({
        total: 0,
        ads: null,
      } as CampaignListResponse);
    }
  }
  summarystats(summaryobj) {
    const loginData = this.storageService.get(StorageKeys.LOGGED_AS);
    var personid = (loginData && loginData.agentInfo && loginData.agentInfo.personid) ? loginData.agentInfo.personid : null;

    var profileText = this.storageService.get(StorageKeys.PROFILE_TEXT);
    if (profileText === AppConstant.PERSONAL_PROFILE_TEXT_MENU_ITEM) {
      var teamProfile = this.storageService.get(AppConstant.TEAM_PROFILE);
      if(teamProfile) {
        personid = teamProfile['teamId'];
      }
    }
    return this.http.post<ApiResponse<CampaignListResponse>>('/api/proxy/ctv/summarystats/v1?personid='+personid,summaryobj).pipe(mergeMap((resp) => {
      if (resp.status === 0 && resp.response) {
        return Observable.of(resp.response);
      } else {
        return throwError(resp);
      }
    }), catchError((error) => {
      this.logger.error('Error fetch summarystats', error);
      return Observable.of({} as any);
    }));
  }

  private campaignMapper() {
    return (campaign) => {
      campaign.campaignStatus = campaign.status;
      campaign.actions = this.getCampaignActions(campaign.status);
      campaign.campaignStatusLabel = transformCampaignStatus(campaign.status)
      if (campaign.status === 0 && campaign.cancelDate) {
        campaign.endDate = campaign.cancelDate;
        campaign.nextBillingDate = "-";
      } else if(campaign.status === 4) {
        campaign.endDate = campaign.endDate;//if finished use actual enddate
        campaign.nextBillingDate = "-";
      } else if(campaign.status == 2 || campaign.status == 5)//unpaid or processing
      {
        campaign.endDate = "-";
        campaign.nextBillingDate = "-";
      }
      else {
        campaign.nextBillingDate = campaign.endDate;
        campaign.endDate = '-';

      }
      if (campaign.customAdInfo) {
        const customAdInfo = JSON.parse(campaign.customAdInfo);
        campaign.targetingType = customAdInfo.targeting_type;
        campaign.overlaybanner = customAdInfo.overlaybanner;
      }
    };
  }

  getCampaignDetails(campaignId: string) {
    return this.http.get<ApiResponse<any>>(`/api/proxy/ctv/fetchcampaign/v1/${campaignId}`)
      .pipe(mergeMap((resp) => {
        if (resp.status === 0  && resp.response) {
          const mapper = this.campaignMapper();
          return Observable.of(resp.response).pipe(map((respObj) => {
            mapper(respObj);
            return respObj;
          }));
        }else {
          return throwError(resp);
        }
      }), catchError((error) => {
        this.logger.error('Error fetch campaign details for campaignId:', campaignId, error);
        return Observable.of({} as any);
      }));
  }

  getCampaignActions(campaignStatus: number) {
    let actions: Array<{ label: string; value: number; }>;
    switch (campaignStatus) {
      case CAMPAIGN_STATUS.UNPAID:
        actions = [
          {label: transformCampaignStatus(campaignStatus), value: campaignStatus},
          {label: 'Pay', value: CAMPAIGN_STATUS.ACTIVE},
          {label: 'Cancel', value: CAMPAIGN_STATUS.CANCELLED}
        ];
        break;
      case CAMPAIGN_STATUS.PREPAID:
        actions = [
          {label: transformCampaignStatus(campaignStatus), value: campaignStatus},
          {label: 'Extend', value: CAMPAIGN_STATUS.ACTIVE},
          {label: 'Cancel', value: CAMPAIGN_STATUS.CANCELLED}
        ];
        break;
      case CAMPAIGN_STATUS.PROCESSING:
      case CAMPAIGN_STATUS.PENDING:
      case CAMPAIGN_STATUS.ACTIVE:
        actions = [
          {label: transformCampaignStatus(campaignStatus), value: campaignStatus},
          {label: 'Cancel', value: CAMPAIGN_STATUS.CANCELLED}
        ];
        break;
      default:
        actions = [{label: transformCampaignStatus(campaignStatus), value: campaignStatus}];
        break;
    }
    return actions;
  }

}
