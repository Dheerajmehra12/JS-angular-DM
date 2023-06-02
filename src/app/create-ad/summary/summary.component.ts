import {Component, Inject, OnInit} from '@angular/core';
import {Plan, PlansMap} from '../../select-plan/plan.service';
import {CREATE_AD_STEPS, NavigationStep, StepNavService} from '../step-nav/step-nav.service';
import {WebStorageService} from '../../services/web-storage.service';
import {Title} from '@angular/platform-browser';
import {StorageKeys} from '../../services/common/constants/storage-keys';
import {Router} from '@angular/router';
import {CreateAdService, DistanceUnit} from '../create-ad.service';
import {NGXLogger} from 'ngx-logger';
import {ALERT_TIMEOUT} from '../../app.module';
import {CAMPAIGN_STATUS} from '../../shared/campaign-status.pipe';
import {RouteConstants} from '../../services/common/constants/route-constants';
import { TranslateService } from '../../services/translate';

declare const appConfig: any;

@Component({
  selector: 'app-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.css']
})
export class SummaryComponent implements OnInit {
  campaign: any;
  plansMap: PlansMap;
  nextButtonLabel = 'Publish';
  private campaignStatus = -1;
  private campaignId = -1;

  errors = {
    hasPublishError: false,
    publishAlertTimer: null,
    publish: ''
  };

  disableNext: boolean;

  constructor(
    private titleService: Title,
    private stepNavService: StepNavService,
    private storageService: WebStorageService,
    private createAdService: CreateAdService,
    private router: Router,
    private logger: NGXLogger,
    @Inject(ALERT_TIMEOUT) private alertTimeout: number,
    private _translate: TranslateService
  ) {}

  ngOnInit(): void {
    this._translate.use(localStorage.getItem('language'));
    this.titleService.setTitle(`${appConfig.appDisplayName}: Summary`);
    if (this.storageService.get(StorageKeys.CAMPAIGN_ID)) {
      this.campaignId = this.storageService.get<number>(StorageKeys.CAMPAIGN_ID);
    }
    if (this.campaignId === -1) {
      this.nextButtonLabel = 'Create';
    }
    if (this.storageService.get(StorageKeys.CAMPAIGN_STATUS)) {
      this.campaignStatus = this.storageService.get(StorageKeys.CAMPAIGN_STATUS);
    }
    if (this.storageService.get(StorageKeys.SELECTED_PLAN)) {
      const planObj: Plan = this.storageService.get(StorageKeys.SELECTED_PLAN);
      this.plansMap = {
        [planObj.id] : planObj
      };
    }
    this.createAdService.summaryData().subscribe((campaign) => this.campaign = campaign);
    this.stepNavService.initSteps(CREATE_AD_STEPS.SUMMARY, this.campaignStatus);
  }

  get distanceUnits() {
    return DistanceUnit;
  }

  stepChanged(step: NavigationStep) {
    if (this.stepNavService.isPreviousFromCurrent(step.id)) {
      this.handlePrevious(step);
    } else {
      this.handleNext(step);
    }
  }

  handleNext(step: NavigationStep) {
    this.logger.info('handleNext', step);
    this.logger.info('Publishing Record');
    if (this.campaignId === -1) {
      this.createAdService.createCampaign().subscribe((resp) => {
        this.logger.info('createCampaign resp: ', resp);
        this.campaignId = resp.id;
        this.campaignStatus = resp.status;
        this.storageService.set(StorageKeys.CAMPAIGN_ID, resp.id);
        this.storageService.set(StorageKeys.CAMPAIGN_STATUS, resp.status);
        this.logger.info('Forwarding to payment page');
        this.router.navigate(step.routeCommand);
      }, (error) => {
        this.handlePublishError(error);
      });
    } else {
      this.logger.info('update campaign api call');
      this.createAdService.updateCampaign(Number(this.campaignId).toString()).subscribe((resp) => {
        this.logger.info('updateCampaign resp: ', resp);
        if (this.campaignStatus === CAMPAIGN_STATUS.UNPAID) {
          this.logger.info('Forwarding to payment page');
          this.router.navigate(step.routeCommand);
        }else {
          this.logger.info('Forwarding to success page');
          this.router.navigate(['/', RouteConstants.PAYMENT_DONE]);
        }
      }, (error) => {
        this.handlePublishError(error);
      });
    }
  }

  handlePrevious(step: NavigationStep) {
    this.router.navigate(step.routeCommand);
  }

  closePublishError() {
    if (this.errors.publishAlertTimer) {
      clearTimeout(this.errors.publishAlertTimer);
    }
    this.errors.hasPublishError = false;
    this.errors.publish = '';
  }

  setPublishError(errorResponse) {
    this.errors.hasPublishError = true;
    this.errors.publish = (errorResponse && errorResponse.edesc) ? errorResponse.edesc :
      (errorResponse && errorResponse.message) ? errorResponse.message :
        (errorResponse) ? errorResponse : 'Unknown Error';
    this.errors.publishAlertTimer = setTimeout(() => {
      this.errors.hasPublishError = false;
      this.errors.publish = '';
    }, this.alertTimeout);
  }

  private handlePublishError(error) {
    this.logger.info(error);
    this.closePublishError();
    this.setPublishError(error);
  }
}
