import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {StorageHelperService} from '../../services/storage-helper-service';
import {Title} from '@angular/platform-browser';
import {NGXLogger} from 'ngx-logger';
import {Router} from '@angular/router';
import { StorageKeys } from 'src/app/services/common/constants/storage-keys';
import {RouteConstants} from '../../services/common/constants/route-constants';
import {PlanService, PlansMap} from '../../select-plan/plan.service';
import {WebStorageService} from '../../services/web-storage.service';
import {CampaignListResponse, CampaignListService} from '../campaign-list.service';
import {forkJoin} from 'rxjs';
import {CreateAdService} from '../../create-ad/create-ad.service';
import {CAMPAIGN_STATUS} from '../../shared/campaign-status.pipe';
import {DialogComponent, DialogData, DialogEvent, DialogEventType} from '../../shared/dialog/dialog.component';
import {PaginationService} from '../../services/pagination.service';
import {ALERT_TIMEOUT} from '../../app.module';
import { TranslateService } from '../../services/translate';

declare const appConfig: any;
@Component({
  selector: 'app-campaigns',
  templateUrl: './campaigns.component.html',
  styleUrls: ['./campaigns.component.css']
})
export class CampaignsComponent implements OnInit {
  private maxPage = 5;
  limitOptions: number[];
  limit = 10;
  start = 0;
  totalPages = 0;
  currentPage = 1;
  pages = new Array<number>();

  campaignsResp: CampaignListResponse;
  plansMap: PlansMap;
  currentUrl: string;
  appDisplayName: string;

  @ViewChild('cancelDialog') cancelDialog: DialogComponent;
  cancelDialogData: DialogData;

  constructor(private storageHelperService: StorageHelperService,
              private titleService: Title,
              private logger: NGXLogger,
              private router: Router,
              private planService: PlanService,
              private storageService: WebStorageService,
              private campaignListService: CampaignListService,
              private createAdService: CreateAdService,
              private paginationService: PaginationService,
              private _translate: TranslateService,
              @Inject(ALERT_TIMEOUT) private alertTimeout: number,
              ) { }

  ngOnInit(): void {
    this._translate.use(localStorage.getItem('language'));
    this.storageService.get(StorageKeys.DASHBOARD_ROUTE)?this.storageService.remove(StorageKeys.DASHBOARD_ROUTE):'';
    this.appDisplayName = appConfig.appDisplayName;
    this.titleService.setTitle(`${appConfig.appDisplayName}: Campaigns`);
    const ob$limitOptions = this.campaignListService.getLimitOptions();
    const ob$campaigns = this.campaignListService.getCampaigns(this.start, this.limit);
    const ob$plansMap = this.planService.getPlansMap();
    forkJoin([ob$limitOptions, ob$plansMap, ob$campaigns])
      .subscribe(([limitOptions, plansMap, campaignsResp]) => {
      this.limitOptions = limitOptions;
      this.plansMap = plansMap;
      this.handleCampaignData(campaignsResp);
    });
    this.currentUrl = this.router.url;
  }

  private handleCampaignData(campaignResp) {
    this.campaignsResp = campaignResp;
    const pager = this.paginationService.getPaginationData(this.campaignsResp.total, this.currentPage, this.limit, this.maxPage);
    this.start = pager.start;
    this.currentPage = pager.currentPage;
    this.totalPages = pager.totalPages;
    this.pages = pager.pages;
  }

  private resetPagination() {
    this.start = 0;
    this.currentPage = 1;
    this.totalPages = 0;
    this.pages = new Array<number>();
  }

  changeLimit() {
    this.resetPagination();
    this.fetchCampaigns();
  }

  previousPage(){
    if (this.currentPage !== 1) {
      this.navigatePage(this.currentPage - 1);
    }
  }

  navigatePage(page){
    if (this.currentPage !== page && page <= this.totalPages) {
      this.currentPage = page;
      this.start = this.limit * (page - 1);
      this.fetchCampaigns();
    }
  }

  nextPage(){
    if (this.currentPage !== this.totalPages){
      this.navigatePage(this.currentPage + 1);
    }
  }

  fetchCampaigns(){
    this.campaignListService.getCampaigns(this.start, this.limit)
      .subscribe((campaignsResp) => this.handleCampaignData(campaignsResp));
  }

  newCampaign(){
    this.storageHelperService.clearCampaignKeys();
    this.router.navigate(['/', RouteConstants.SELECT_PLAN]);
  }

  editCampaignDetails(campaignId) {
    this.logger.info(`editCampaignDetails(${campaignId})`);
    this.createAdService.editCampaign(campaignId, null, this.plansMap).subscribe((success) => {
      if (success) {
        this.router.navigate([RouteConstants.CREATE_AD]);
      } else{
        this.logger.error('Error opening campaign for edit');
      }
    });
  }

  viewCampaignDetails(campaignId) {
    this.storageHelperService.clearCampaignKeys();
    this.logger.info(`viewCampaignDetails(${campaignId})`);
    this.router.navigate([RouteConstants.CAMPAIGN_LIST, RouteConstants.CAMPAIGNS, campaignId]);
  }

  viewCampaignReport(campaignId) {
    this.storageHelperService.clearCampaignKeys();
    this.logger.info(`viewCampaignReport(${campaignId})`);
    this.router.navigate([RouteConstants.CAMPAIGN_LIST, RouteConstants.CAMPAIGNS, campaignId, RouteConstants.ANALYTICS]);
  }

  changeStatus(campaign, $index: number) {
    this.closeCancelAlerts();
    this.logger.info('changeStatus(campaignId = ', campaign.id,
      ', campaignName = ', campaign.campaignName, ', campaignStatus = ',
      campaign.status, ', actionStatus = ', campaign.campaignStatus, ', $index = ', $index, ')');
    if (campaign.status === campaign.campaignStatus) {
      return;
    }else if (campaign.campaignStatus === CAMPAIGN_STATUS.CANCELLED) {
      this.cancelDialogData = {
        title: `Cancel campaign <strong class="text-cms-primary">'${campaign.campaignName}'</strong>?`,
        options: {
          submitButton: true,
          cancelButton: true,
          submitButtonLabel: 'Yes',
          cancelButtonLabel: 'No',
        },
        campaign,
        recordIndex: $index,
      };
      this.cancelDialog.show();
    } else if (campaign.campaignStatus === CAMPAIGN_STATUS.ACTIVE) {
      this.createAdService.editCampaign(campaign.id, campaign, this.plansMap).subscribe((success) => {
        if (success) {
          this.router.navigate(['/', RouteConstants.CREATE_AD, RouteConstants.PAY_AND_PUBLISH]);
        } else{
          this.logger.error('Error opening campaign for modification');
        }
      });
    }
  }

  cancelDialogEvent($event: DialogEvent) {
    this.logger.info(`DialogEvent(${$event.dialogId}) = `, $event.eventType);
    if ($event.eventType !== DialogEventType.SUBMIT) {
      this.campaignsResp.ads[this.cancelDialogData.recordIndex].campaignStatus = this.cancelDialogData.campaign.status;
    } else {
      this.createAdService.cancelCampaign(this.cancelDialogData.campaign.id).subscribe((cancelResp) => {
        this.logger.info('cancelResp', cancelResp);
        this.cancelDialogData.cancelSuccess = true;
        this.cancelDialog.hide();
        this.cancelDialogData.cancelTimer = setTimeout(() => this.cancelDialogData.cancelSuccess = null, this.alertTimeout);
        this.fetchCampaigns();
      }, (error) => {
        this.cancelDialogData.cancelSuccess = false;
        this.cancelDialog.hide();
        this.campaignsResp.ads[this.cancelDialogData.recordIndex].campaignStatus = this.cancelDialogData.campaign.status;
        this.cancelDialogData.cancelTimer = setTimeout(() => this.cancelDialogData.cancelSuccess = null, this.alertTimeout);
      });
    }
  }

  closeCancelAlerts() {
    if (this.cancelDialogData && this.cancelDialogData.cancelTimer) {
      clearTimeout(this.cancelDialogData.cancelTimer);
    }
  }

  editDisabled(campaignStatus: number) {
    let disabled: boolean;
    switch (campaignStatus) {
      case CAMPAIGN_STATUS.FINISHED:
      case CAMPAIGN_STATUS.CANCELLED:
      case CAMPAIGN_STATUS.PROCESSING:
        disabled = true;
        break;
      default:
        disabled = false;
        break;
    }
    return disabled;
  }

  reportDisabled(campaignStatus: number) {
    let disabled: boolean;
    switch (campaignStatus) {
      case CAMPAIGN_STATUS.UNPAID:
        disabled = true;
        break;
      default:
        disabled = false;
        break;
    }
    return disabled;
  }

}
