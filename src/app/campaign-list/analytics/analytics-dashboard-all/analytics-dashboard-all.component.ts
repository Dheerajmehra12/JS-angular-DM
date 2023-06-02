import {Component, Inject, OnInit, ViewChild} from '@angular/core';
import {StorageHelperService} from '../../../services/storage-helper-service';
import {Title} from '@angular/platform-browser';
import {NGXLogger} from 'ngx-logger';
import {Router} from '@angular/router';
import {RouteConstants} from '../../../services/common/constants/route-constants';
import {PlanService, PlansMap} from '../../../select-plan/plan.service';
import {WebStorageService} from '../../../services/web-storage.service';
import {CampaignListResponse, CampaignListService} from '../../campaign-list.service';
import {forkJoin} from 'rxjs';
import {CreateAdService} from '../../../create-ad/create-ad.service';
import {CAMPAIGN_STATUS} from '../../../shared/campaign-status.pipe';
import {DialogComponent, DialogData, DialogEvent, DialogEventType} from '../../../shared/dialog/dialog.component';
import {PaginationService} from '../../../services/pagination.service';
import {ALERT_TIMEOUT} from '../../../app.module';
import {UtilityService} from 'src/app/services/common/utility.service'
import {TokenInterceptorService} from 'src/app/services/token-interceptor/token-interceptor.service';
import { constants } from 'buffer';
import * as moment from 'moment';
import {StorageKeys} from '../../../services/common/constants/storage-keys';
declare const appConfig: any;
declare const $:any;

@Component({
  selector: 'app-analytics-dashboard-all',
  templateUrl: './analytics-dashboard-all.component.html',
  styleUrls: ['./analytics-dashboard-all.component.css']
})

export class AnalyticsDashboardAllComponent implements OnInit {
  constructor(private storageHelperService: StorageHelperService,
    private titleService: Title,
    private logger: NGXLogger,
    private router: Router,
    private planService: PlanService,
    private storageService: WebStorageService,
    private campaignListService: CampaignListService,
    private createAdService: CreateAdService,
    private paginationService: PaginationService,
    private TokenInterceptorService: TokenInterceptorService,
     public util: UtilityService,
    @Inject(ALERT_TIMEOUT) private alertTimeout: number,
    ) { }
  private maxPage = 5;
  public searchnew = new  UtilityService(this.TokenInterceptorService,this.logger)
  criteriaList=[
    new  UtilityService(this.TokenInterceptorService,this.logger).SearchCriteria('name', 'Campaign Name Contains', 'campaignName',''),
    new  UtilityService(this.TokenInterceptorService,this.logger).SearchCriteria('id', 'Campaign Id Equals', 'campaignId',''),
  ];
  selectedCriteria =  new  UtilityService(this.TokenInterceptorService,this.logger).SearchCriteria('name', 'Campaign Name Contains', 'campaignName','');

 isValid(){
  let startDate = moment(this.customStartDate);
  let endDate = moment(this.customEndDate);
  return (startDate.diff(endDate) <= 0);
}
constants = {
  last7days:"Last 7 Days",
  alltimes:"All Times",
  customdate:"Custom Date",
  max:moment().format('YYYY-MM-DD'),
}
customStartDate=moment().format('YYYY-MM-DD'); 
customEndDate=moment().format('YYYY-MM-DD');

selectedRangeOption = this.constants.last7days 
 public filterBy={
  "campaignStatus":[],
  "startDate": this.getLast7thDate(),
  "endDate": moment().format("YYYY-MM-DD"),
  "campaignName":[],
  "campaignId":[]
 };

 

 public search: any;
  limitOptions: number[];
  limit = 10;
  start = 0;
  totalPages = 0;
  currentPage = 1;
  sortOrder='desc';
  sortBy = "createdate";

  
  pages = new Array<number>();
  campaignStatuses = [
    {value: -1, label: 'All'},
    {value: 1, label: 'Active'},
    {value: 2, label: 'Cancel'},
    {value: 3, label: 'Unpaid'},
    {value: 4, label: 'Finished'},
    {value: 5, label: 'Pending'},
  ];
  dashboardFilters = {
    selectedCampaignStatusFilterValue : -1
  }

  campaignsResp: CampaignListResponse;
  plansMap: PlansMap;
  currentUrl: string;
  appDisplayName: string;
  summaryStats ={totalClicks:0,totalReach:0,totalViews:0,ctr:0}


  

  ngOnInit(): void {
    this.appDisplayName = appConfig.appDisplayName;
    this.titleService.setTitle(`${appConfig.appDisplayName}: Dashboard`);
    const ob$limitOptions = this.campaignListService.getLimitOptions();
    const ob$campaigns = this.campaignListService.fetchCampaignsV2(this.start, this.limit,this.sortBy,this.sortOrder,this.filterBy);
    const ob$plansMap = this.planService.getPlansMap();
    const ob$summarystats = this.campaignListService.summarystats(this.filterBy);
    forkJoin([ob$limitOptions, ob$plansMap, ob$campaigns,ob$summarystats])
      .subscribe(([limitOptions, plansMap, campaignsResp ,summarystatsResp]) => {
      this.limitOptions = limitOptions;
      this.plansMap = plansMap;
      this.handleCampaignData(campaignsResp);
      this.handleSummryStats(summarystatsResp);
    });
    this.currentUrl = this.router.url;
  }

  private getLast7thDate(){  
    // current date's milliseconds - 1,000 ms  60 s  60 mins  24 hrs  (# of days beyond one to go back)
    let epochMillies=Number(moment().format('x'))
    var lastweekdate = moment(epochMillies - 1000*60*60*24*6).format("YYYY-MM-DD")
    return lastweekdate
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

  campaignStatusClr(campaignStatus){
    if (typeof campaignStatus !== 'undefined') {
      if (campaignStatus === CAMPAIGN_STATUS.NEW) {
        return '#2CC05E';
      }else if (campaignStatus === CAMPAIGN_STATUS.CANCELLED) {
        return '#A02727';
      }else if (campaignStatus === CAMPAIGN_STATUS.ACTIVE) {
        return '#2CC05E';
      }else if (campaignStatus === CAMPAIGN_STATUS.UNPAID) {
        return '#E60505';
      }else if (campaignStatus === CAMPAIGN_STATUS.PREPAID) {
        return '#BCBCBC';
      }else if (campaignStatus === CAMPAIGN_STATUS.FINISHED) {
        return '#239436';
      }else if (campaignStatus === CAMPAIGN_STATUS.PROCESSING) {
        return '#6CB174';
      }else if (campaignStatus === CAMPAIGN_STATUS.PENDING) {
        return '#F19409';
      }else {
        return '#0000FF' ;
      }
    }
    return '#0000FF';

  }

  sortColumn(elem) {
    var asc=$(elem).hasClass('asc');
    var desc=$(elem).hasClass('desc');
    var sortBy=$(elem).data('sortBy');
    var sortOrder='none';
    $(elem).siblings('.sortable').removeClass('asc').removeClass('desc');
    if(!asc && !desc) {
      $(elem).addClass('asc');
      sortOrder='asc';
    }else if(asc && !desc) {
      $(elem).removeClass('asc').addClass('desc');
      sortOrder='desc';
    }else if(!asc && desc) {
      $(elem).removeClass('desc').addClass('asc');
      sortOrder='asc';
    }
    this.sortBy=sortBy;
    this.sortOrder=sortOrder;
    this.changeLimit();
  }
  
  changeLimit() {
    this.resetPagination();
    this.fetchCampaignsV2();
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
      this.fetchCampaignsV2();
    }
  }

  nextPage(){
    if (this.currentPage !== this.totalPages){
      this.navigatePage(this.currentPage + 1);
    }
  }

  fetchCampaignsV2(){
    this.filtersHandler();
    this.campaignListService.fetchCampaignsV2(this.start, this.limit,this.sortBy,this.sortOrder,this.filterBy)
      .subscribe((campaignsResp) => this.handleCampaignData(campaignsResp));
      this.campaignListService.summarystats(this.filterBy).subscribe((summaryresp) => this.handleSummryStats(summaryresp))
  }

  handleSummryStats (summaryresp){
   if(summaryresp !== null){
   this.summaryStats = summaryresp;
   this.summaryStats.totalReach = summaryresp.reach?summaryresp.reach:0;
   this.summaryStats.totalViews = summaryresp.impressions?summaryresp.impressions:0;
   this.summaryStats.totalClicks = summaryresp.clicks?summaryresp.clicks:0;
   this.summaryStats.ctr = this.summaryStats.totalClicks&&this.summaryStats.totalViews?(this.summaryStats.totalClicks/this.summaryStats.totalViews)*100:0;
   } 
  }

  viewCampaignReport(campaignId) {
    this.storageService.set(StorageKeys.DASHBOARD_ROUTE,`/${RouteConstants.CAMPAIGN_LIST}/${RouteConstants.MY}/${RouteConstants.DASHBOARD}`); //for handling window.location.forward() case we are saving route detail in localstorage
    this.storageHelperService.clearCampaignKeys();
    this.logger.info(`viewCampaignReport(${campaignId})`);
    this.router.navigate([RouteConstants.CAMPAIGN_LIST, RouteConstants.CAMPAIGNS, campaignId, RouteConstants.ANALYTICS]);
  }

  filterCampaigns() {
    this.filtersHandler();
    this.changeLimit();
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
  onSearchUpdate(search) {
    if(search && search.length > 0) {
      this.filterBy  = search.reduce(function (prevVal, currVal) {
        if(prevVal[currVal.field]) {
          var fieldVals = prevVal[currVal.field];
          fieldVals.push(currVal.value);
          prevVal[currVal.field] = fieldVals;
        }else{
          prevVal[currVal.field] = [currVal.value];
        }
        console.log("prevVal",prevVal)
        return prevVal;
      },{});
    }else{
      this.filterBy.campaignName  = [];
      this.filterBy.campaignId  = [];
    }
    this.filterCampaigns();
  }

  filtersHandler(){
    // case 1 : drop down for campaign status filter
    if(this.dashboardFilters.selectedCampaignStatusFilterValue!==-1) {
      let campaignFilter = this.campaignStatuses.filter((item) => {return this.dashboardFilters.selectedCampaignStatusFilterValue == item.value});
      this.filterBy.campaignStatus = []
      campaignFilter.forEach((item)=>{
        this.filterBy.campaignStatus.push(item.label);
      });
    }else if(this.filterBy && this.filterBy.campaignStatus) {
      this.filterBy.campaignStatus =[];
    }
    // case 2 : left date range filter
    if(this.selectedRangeOption==this.constants.last7days){
      this.filterBy.startDate = this.getLast7thDate();
      this.filterBy.endDate = moment().format("YYYY-MM-DD");
    }else if (this.selectedRangeOption==this.constants.customdate){     
      this.filterBy.startDate = this.customStartDate+"".length?moment(this.customStartDate).format("YYYY-MM-DD"):console.log("Error in custom date")+""
      this.filterBy.endDate =  this.customEndDate+"".length?moment(this.customEndDate).format("YYYY-MM-DD"):console.log("Error in custom date")+""
    }
    else if (this.selectedRangeOption==this.constants.alltimes){       
      this.filterBy.startDate  = null;
      this.filterBy.endDate  =  null;
    }

  }
  
}
