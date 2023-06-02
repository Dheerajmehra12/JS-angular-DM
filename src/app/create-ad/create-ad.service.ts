import {EventEmitter, Injectable} from '@angular/core';
import {NGXLogger} from 'ngx-logger';
import {forkJoin, Observable, throwError} from 'rxjs';
import {catchError, map, mergeMap} from 'rxjs/operators';
import {HttpClient} from '@angular/common/http';
import {ApiResponse} from '../services/common/api-response';
import {WebStorageService} from '../services/web-storage.service';
import {StorageKeys} from '../services/common/constants/storage-keys';
import {Plan, PlanService, PlansMap} from '../select-plan/plan.service';
import {CampaignListService} from '../campaign-list/campaign-list.service';
import {StorageHelperService} from '../services/storage-helper-service';
import {AppConstant} from '../services/common/constants/app-constant';
import { UtilityService } from '../services/common/utility.service';
import {StepNavService} from './step-nav/step-nav.service';
import {CAMPAIGN_STATUS} from '../shared/campaign-status.pipe';
import * as moment from 'moment';
import {TemplateData} from '../template/template-component';

declare const appConfig: any;

export interface Address {
  streetName: string;
  cityName: string;
  state: string;
  zip: string;
  country: string;
  lat: number;
  lon: number;
}

export interface CustomAdInfo {
  [key: string]: any;
}

export enum DistanceUnit {
  MILES = 'mi',
  KILOMETERS = 'km',
}

export enum TargetingTypes {
  RADIUS = 'radius',
  CITY_STATE = 'city',
  ZIPCODE = 'zipcode',
  STATE = 'state',
  COUNTRY = 'country',
}

export interface RadiusTargetingLocation {
  mapData: { lat: number; lng: number; };
  addressData: { zipCode: string; city: string; state: string; address: string; };
}

export interface RadiusTargeting {
  isCsv: boolean;
  isValidCsv: boolean;
  csvInfo: {[key: string]: any};
  locationData: RadiusTargetingLocation;
  radius: number;
  radiusUnit: string;
}

export interface ZipcodeTargeting {
  isCsv: boolean;
  csvInfo: {[key: string]: any};
  locationData: {
    mapPoints: Array<any>;
    addressData: {
      zipcode: Array<any>;
    }
  };
}

export interface CountryTargeting {
  isCsv: boolean;
  csvInfo: {[key: string]: any};
  country: string;
}

export interface StateTargeting {
  isCsv: boolean;
  csvInfo: {[key: string]: any};
  locationData: {
    mapPoints: Array<any>;
    addressData: {
      state: Array<any>;
    }
  };
}

export interface CityTargeting {
  isCsv: boolean;
  csvInfo: {[key: string]: any};
  locationData: {
    mapPoints: Array<any>;
    addressData: {
      city: Array<any>;
    }
  };
}

export interface LocationData {
  targetingType: string;
  country: string;
  disableMap: boolean;
  radiusTargeting: RadiusTargeting;
  zipcodeTargeting: ZipcodeTargeting;
  countryTargeting: CountryTargeting;
  stateTargeting: StateTargeting;
  cityTargeting: CityTargeting;
}

export interface CreateAdRequest {
  planId: number;
  personid: string;
  campaignName: string;
  landingPage: string;
  videoUrl: string;
  bottomBannerUrl: string;
  customAdInfo: CustomAdInfo | string;
  radiusTargeting: boolean;
  locationTargeting: boolean;
  radiusFrom: number;
  radiusTo: number;
  distanceUnit: string;
  addresses: Array<Address>;
  overlayBanner: boolean;
  teamId: string;
}

export abstract class RadiusTargetingFactory {
  static newInstance(){
    const radiusTargeting = {} as RadiusTargeting;
    radiusTargeting.isCsv = false;
    radiusTargeting.isValidCsv = true;
    radiusTargeting.csvInfo = {};
    radiusTargeting.locationData = {
      mapData: {lat: 0, lng: 0},
      addressData: {
        zipCode: '',
        city: '',
        state: '',
        address: '',
      },
    };
    radiusTargeting.radius = 3.0;
    radiusTargeting.radiusUnit = DistanceUnit.MILES;
    return radiusTargeting;
  }
}

export abstract class LocationDataFactory {
  static newInstance(){
    const locationData = {} as LocationData;
    locationData.targetingType = TargetingTypes.RADIUS;
    locationData.country = appConfig.homeCountry.toUpperCase();
    locationData.disableMap = false;
    return locationData;
  }
}

@Injectable({
    providedIn: 'root'
})
export class CreateAdService {
    private validated = false;
    constructor(private logger: NGXLogger,
                private http: HttpClient,
                private campaignListService: CampaignListService,
                private planService: PlanService,
                private storageService: WebStorageService,
                private storageHelperService: StorageHelperService,
                private stepNavService: StepNavService,
                public util: UtilityService ) { }
    private validationCheckEvent: EventEmitter<any> = new EventEmitter();
    setValidated(validated: boolean) {
        this.validated = validated;
        this.emitValidationEvent();
    }
    isValidated() {
      return this.validated;
    }
    private emitValidationEvent() {
        this.logger.debug('disabling next');
        this.validationCheckEvent.emit({disableNext: !this.validated });
    }
    onValidationCheckEvent() {
        return this.validationCheckEvent;
    }
    checkIfDomainExists(domain, checkDomain) {
        return this.http.get<ApiResponse<any>>('/api/proxy/bh/check/domain/v1' , {params: {
          d: domain,
            checkDomain,
          }})
          .pipe(catchError((error) => throwError(error || 'Server error')), );
    }

    private prepareAdRequest() {
      const campaignRequest = {} as CreateAdRequest;
      const templateId = this.storageService.get<string>(StorageKeys.TEMPLATE_ID) || '';
      const templateData = this.storageService.get<TemplateData>(StorageKeys.TEMPLATE_DATA) || {};
      const selectedPlan: Plan = this.storageService.get(StorageKeys.SELECTED_PLAN);
      campaignRequest.planId = selectedPlan.id;
      const loginData = this.storageService.get(StorageKeys.LOGGED_AS);
      campaignRequest.personid = loginData.agentInfo.personid;
      const campaignInfo = this.storageService.get(StorageKeys.CAMPAIGN_INFO);
      campaignRequest.campaignName = campaignInfo.campaignName;
      campaignRequest.landingPage = campaignInfo.landingPageUrl;
      campaignRequest.videoUrl = campaignInfo.videoUrl;
      campaignRequest.bottomBannerUrl = this.storageService.get(StorageKeys.FOOTER_BANNER);
      const locationData = this.storageService.get(StorageKeys.LOCATION_DATA);
      let overlaybanner = true;
      if (campaignInfo && campaignInfo.hasOwnProperty('overlaybanner')) {
        overlaybanner = campaignInfo.overlaybanner;
      }
      campaignRequest.customAdInfo = JSON.stringify({
        breNumber:campaignInfo.breNumber,
        targeting_type: locationData.targetingType,
        overlaybanner,
        templateId,
        templateData,
      });
      campaignRequest.overlayBanner = overlaybanner;
      campaignRequest.radiusTargeting = locationData.targetingType === 'radius';
      campaignRequest.locationTargeting = locationData.targetingType !== 'radius';
      campaignRequest.radiusFrom = 0;
      campaignRequest.radiusTo = locationData[locationData.targetingType + 'Targeting'].radius ? locationData[locationData.targetingType + 'Targeting'].radius : 15;
      campaignRequest.distanceUnit = DistanceUnit.MILES;
      const adLocations = locationData.adLocations;
      campaignRequest.addresses = new Array<Address>();
      adLocations.forEach((location) => {
        campaignRequest.addresses.push({
          streetName: location.streetName,
          cityName: location.cityName,
          state: location.state,
          zip: location.zip,
          country: location.country,
          lat: location.lat,
          lon: location.lon,
        } as Address);
      });

      const teamProfile = this.storageService.get(AppConstant.TEAM_PROFILE);
      if(teamProfile) {
        campaignRequest.teamId = teamProfile.teamId;
      }
      return campaignRequest;
    }

    createCampaign() {
      const campaignRequest: CreateAdRequest = this.prepareAdRequest();
      this.logger.info('createAdRequest', campaignRequest);
      return this.http.post<ApiResponse<any>>('/api/proxy/ctv/createcampaign/v1', campaignRequest)
        .pipe(
          mergeMap((resp) => {
            if (resp.status === 0 && resp.response) {
              return Observable.of(resp.response);
            }else {
              return throwError(resp);
            }
          })
        );
    }

    updateCampaign(campaignId: string){
      const campaignRequest: CreateAdRequest = this.prepareAdRequest();
      this.logger.info('updateAdRequest', campaignRequest);
      return this.http.put<ApiResponse<any>>(`/api/proxy/ctv/updatecampaign/v1/${campaignId}`, campaignRequest)
        .pipe(
          mergeMap((resp) => {
            if (resp.status === 0 && resp.response) {
              return Observable.of(resp.response);
            }else {
              return throwError(resp);
            }
          })
        );
    }

    cancelCampaign(campaignId: string){
      this.logger.info('cancelCampaign', campaignId);
      return this.http.delete<ApiResponse<any>>(`/api/proxy/ctv/cancelcampaign/v1/${campaignId}`)
        .pipe(
          mergeMap((resp) => {
            if (resp.status === 0) {
              return Observable.of(true);
            }else {
              return throwError(resp);
            }
          })
        );
    }

    summaryData() {
      const campaign = {} as any;
      campaign.overlaybanner = true;
      if (this.storageService.get(StorageKeys.CAMPAIGN_ID)) {
        campaign.id = this.storageService.get<number>(StorageKeys.CAMPAIGN_ID);
      } else {
        campaign.id = -1;
      }
      if (this.storageService.get(StorageKeys.CAMPAIGN_STATUS)) {
        campaign.status = this.storageService.get<number>(StorageKeys.CAMPAIGN_STATUS);
      } else {
        campaign.status = CAMPAIGN_STATUS.NEW;
      }
      if (this.storageService.get(StorageKeys.SELECTED_PLAN)) {
        const planObj: Plan = this.storageService.get(StorageKeys.SELECTED_PLAN);
        campaign.planId = planObj.id;
        campaign.charge = planObj.budget;
      }
      if (this.storageService.get(StorageKeys.CAMPAIGN_INFO)) {
        const campaignInfo = this.storageService.get(StorageKeys.CAMPAIGN_INFO);
        campaign.campaignName = campaignInfo.campaignName;
        campaign.landingPage = campaignInfo.landingPageUrl;
        campaign.videoUrl = campaignInfo.videoUrl;
        campaign.mediaTitle = campaignInfo.mediaTitle;
        campaign.overlaybanner = campaignInfo.overlaybanner;
        campaign.breNumber = campaignInfo.breNumber?campaignInfo.breNumber:false;
      }
      if (this.storageService.get(StorageKeys.FOOTER_BANNER)) {
        campaign.bottomBannerUrl = this.storageService.get(StorageKeys.FOOTER_BANNER);
      }
      campaign.startDate = moment().format('YYYY-MM-DD');
      campaign.endDate = '-';
      if (this.storageService.get(StorageKeys.LOCATION_DATA)) {
        const locationData = this.storageService.get(StorageKeys.LOCATION_DATA);
        campaign.targetingType = locationData.targetingType;
        campaign.addresses = locationData.adLocations;
        const targetingKey = campaign.targetingType + 'Targeting';
        if (locationData[targetingKey]) {
          campaign[targetingKey] = locationData[targetingKey];
          if (campaign.targetingType === TargetingTypes.RADIUS) {
            campaign.radiusTo = campaign[targetingKey].radius;
          }
        }
      }
      let ob$Campaign: Observable<any> = null;
      if (campaign.id !== -1){
        ob$Campaign = this.campaignListService.getCampaignDetails(campaign.id).pipe(map((campaignResp) => {
          campaign.startDate = campaignResp.startDate;
          campaign.endDate = campaignResp.endDate;
          return campaign;
        }));
      }else {
        ob$Campaign = Observable.of(campaign);
      }
      return ob$Campaign;
    }

    editCampaign(campaignId: string, campaignObj?: any, plansMapObj?: PlansMap) {
      const ob$campaignDetails: Observable<any> = (campaignObj) ? Observable.of(campaignObj) :
        this.campaignListService.getCampaignDetails(campaignId);
      const ob$plansMap: Observable<PlansMap> = (plansMapObj) ? Observable.of(plansMapObj) : this.planService.getPlansMap();
      return forkJoin([ob$plansMap, ob$campaignDetails]).pipe(mergeMap(([plansMap, campaign]) => {
        if (plansMap && campaign) {
          this.storageHelperService.clearCampaignKeys();
          this.storageService.set(StorageKeys.CAMPAIGN_EDIT, true);
          this.storageService.set(StorageKeys.SELECTED_PLAN, plansMap[campaign.planId]);
          this.storageService.set(StorageKeys.CAMPAIGN_ID, campaignId);
          this.storageService.set(StorageKeys.CAMPAIGN_STATUS, campaign.status);
          this.setLocationData(campaign);
          if (campaign.bottomBannerUrl) {
            this.storageService.set(StorageKeys.FOOTER_BANNER, campaign.bottomBannerUrl);
          }
          const campaignInfo = {} as any;
          if (!this.util.isVoid(campaign.customAdInfo)) {
            const customAdInfo = JSON.parse(campaign.customAdInfo);
            const templateId = customAdInfo.templateId || '';
            const templateData = (customAdInfo.templateData || {}) as TemplateData;
            this.storageService.set(StorageKeys.TEMPLATE_ID, templateId);
            this.storageService.set(StorageKeys.TEMPLATE_DATA, templateData);
            campaignInfo.breNumber = customAdInfo.breNumber ? customAdInfo.breNumber : false;
          }
          if (campaign.videoUrl) {
            campaignInfo.videoUrl = campaign.videoUrl;
          }
          if (campaign.campaignName) {
            campaignInfo.campaignName = campaign.campaignName;
          }
          if (campaign.landingPage) {
            campaignInfo.landingPageUrl = campaign.landingPage;
          }
          campaignInfo.overlaybanner = campaign.overlayBanner;
          this.storageService.set(StorageKeys.CAMPAIGN_INFO, campaignInfo);
          return Observable.of(true);
        } else{
          return throwError(new Error('Unable to edit campaign'));
        }
      }), catchError((error) => {
        this.logger.info('Error editing campaign: ', error);
        return Observable.of(false as boolean);
      }));
    }
    getCountryName(code) {
      const countryOptions = AppConstant.SUPPORTED_COUNTRY;
      let country = '';
      for (let i = 0; i < countryOptions.length; i++) {
        if (code === countryOptions[i].code.toLowerCase()) {
          country = countryOptions[i].name;
        }
      }
      return country;
    }
    setLocationData(campaignData){
        let targeting = {} as any;
        const retailersLocLength = 0;
        let fTargetingType = '';
        let targetingType = '';
        if (!this.util.isVoid(campaignData.customAdInfo)) {
          const customAdInfo = JSON.parse(campaignData.customAdInfo);
          targetingType = customAdInfo.targeting_type;
        }
        const adLocations = campaignData.addresses || [];
        const adtargeting = campaignData.addresses || {};
        const country = (!this.util.isVoid(adtargeting[0].country)) ? this.getCountryName(adtargeting[0].country) : 'United States';
        const tempLocations =  this.util.getFormattedAdLocations(adLocations, country);
        let isCsv = false;
        const csvInfo = {};
        if (targetingType === TargetingTypes.RADIUS && tempLocations.length === 1) {
          isCsv = false;
        }
        if (!this.util.isVoid(adLocations)) {
          if (targetingType === TargetingTypes.ZIPCODE) {
            fTargetingType = TargetingTypes.ZIPCODE;
            const zip = [];
            for (let i = 0; i < adLocations.length - retailersLocLength; i++) {
              zip[i] = { display: adLocations[i].zip, value: adLocations[i].zip,
                data: { latitude: adLocations[i].lat, longitude: adLocations[i].lon } };
            }
            targeting = {
              zipcodeTargeting: {
                isCsv,
                csvInfo,
                locationData: {
                  mapPoints: [],
                  addressData: {
                    zipcode: zip
                  }
                }
              },
              targetingType: fTargetingType,
              country,
              adLocations: tempLocations
            };
          } else if (targetingType === TargetingTypes.STATE) {
            fTargetingType = TargetingTypes.STATE;
            const states = [];
            for (let i = 0; i < adLocations.length - retailersLocLength; i++) {
              states[i] = {
                display: adLocations[i].state ? this.util.getStateCodeAbbrivation(country, adLocations[i].state).fullForm : '',
                value: adLocations[i].state ? (this.util.getStateCodeAbbrivation(country, adLocations[i].state).code ?
                  this.util.getStateCodeAbbrivation(country, adLocations[i].state).code.toLowerCase() : adLocations[i].state) :
                  adLocations[i].state, data: { latitude: adLocations[i].lat, longitude: adLocations[i].lon } };
            }
            targeting = {
              stateTargeting: {
                isCsv,
                csvInfo,
                locationData: {
                  mapPoints: [],
                  addressData: {
                    state: states
                  }
                }
              },
              targetingType: fTargetingType,
              country,
              adLocations: tempLocations
            };
          } else if (targetingType === TargetingTypes.CITY_STATE) {
            fTargetingType = TargetingTypes.CITY_STATE;
            const city = [];
            for (let i = 0; i < adLocations.length - retailersLocLength; i++) {
              city[i] = {
                display: adLocations[i].cityName + ',' + adLocations[i].state,
                value: adLocations[i].cityName + ',' +
                  adLocations[i].state, data: { latitude: adLocations[i].lat, longitude: adLocations[i].lon }
              };
            }
            targeting = {
              cityTargeting: {
                isCsv,
                csvInfo,
                locationData: {
                  mapPoints: [],
                  addressData: {
                    city
                  }
                }
              },
              targetingType: fTargetingType,
              country,
              adLocations: tempLocations
            };
          } else if (targetingType === TargetingTypes.COUNTRY) {
            fTargetingType = TargetingTypes.COUNTRY;
            targeting = {
              countryTargeting: {
                isCsv: false,
                csvInfo,
                country
              },
              targetingType: fTargetingType,
              country,
              adLocations: tempLocations
            };

          } else {
            fTargetingType = TargetingTypes.RADIUS;
            if (adLocations.length === 1) {
              targeting = {
                radiusTargeting: {
                  isCsv: false,
                  csvInfo: {},
                  locationData: {
                    mapData: { lat: adLocations[0].lat, lng: adLocations[0].lon },
                    addressData: {
                      zipCode: adLocations[0].zip, city: adLocations[0].cityName, state: (adLocations[0].state) ?
                        this.util.getStateCodeAbbrivation(country, adLocations[0].state).fullForm : '',
                      address: adLocations[0].streetName
                    }
                  },
                  radius: campaignData.radiusTo
                },
                targetingType: fTargetingType,
                country,
                adLocations: tempLocations
              };
            } else {
              targeting = {
                radiusTargeting: {
                  isCsv: true,
                  csvInfo: {
                    // tslint:disable-next-line:max-line-length
                    // "file": "A,9725 LAUREL CANYON BLVD,PACOIMA,CA,91331,US,555-333-2222,abc9725@mail.com\nB,2120 W MAIN ST,ALHAMBRA,CA,91801,US,555-333-2222,abc2120@mail.com\nC,499 W ORANGE SHOW RD,SAN BERNARDINO,CA,92408,US,555-333-2222,abc499@mail.com\nD,5600 WHITTIER BLVD,LOS ANGELES,CA,90022,US,555-333-2222,abc5600@mail.com\nE,5700 FIRESTONE BLVD,SOUTH GATE,CA,90280,US,555-333-2222,abc5700@mail.com\nF,12100 HARBOR BLVD,GARDEN GROVE,CA,92840,US,555-333-2222,abc12100@mail.com\nG,13831 BROOKHURST ST,GARDEN GROVE,CA,92843,US,555-333-2222,abc13831@mail.com\nH,2270 N BELLFLOWER BLVD,LONG BEACH,CA,90815,US,555-333-2222,abc2270@mail.com\nI,10820 JEFFERSON BLVD,CULVER CITY,CA,90232,US,555-333-2222,abc10820@mail.com",
                    name: 'geoAdSample.csv',
                    data: []
                  },
                  // "csvInfo": {},
                  locationData: {
                    mapData: { lat: '', lng: '' },
                    addressData: {
                      zipCode: '', city: '', state: '', address: ''
                    },
                    radius: campaignData.radiusTo
                  },
                  radius: campaignData.radiusTo
                },
                targetingType: TargetingTypes.RADIUS,
                country,
                adLocations: tempLocations
              };
            }
          }
        }
        targeting.isValid = true;
        this.logger.info('targeting--', targeting);
        this.storageService.set(StorageKeys.LOCATION_DATA, targeting);
    }
}
