import {AfterViewInit, Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {CREATE_AD_STEPS, NavigationStep, StepNavService} from '../step-nav/step-nav.service';
import {Title} from '@angular/platform-browser';
import {Router} from '@angular/router';
import {StorageKeys} from '../../services/common/constants/storage-keys';
import {WebStorageService} from '../../services/web-storage.service';
import {CreateAdService} from '../create-ad.service';
import {NGXLogger} from 'ngx-logger';
import {TemplateData, TemplateItem} from '../../template/template-component';
import {TemplateService} from '../../template/template.service';
import {MediaService} from '../media/media.service';
import {mergeMap} from 'rxjs/operators';
import {AGENT_INFO_FIELDS, AuthService} from '../../auth/auth.service';
import { TranslateService } from '../../services/translate';

import { AppConstant } from '../../services/common/constants/app-constant';

declare const appConfig: any;
declare const $: any;

@Component({
  selector: 'app-banner',
  templateUrl: './banner.component.html',
  styleUrls: ['./banner.component.css']
})
export class BannerComponent implements OnInit, AfterViewInit {
  campaign = {overlaybanner: true,breNumber: true} as any;
  disableNext: boolean;
  nextButtonLabel = 'Next';

  officeLogoUrl: string;

  templates: TemplateItem[] = [];
  selectedTemplate: TemplateItem;
  playerBannerTemplate: TemplateItem;

  @ViewChild('templateGallery') templateGallery: ElementRef<HTMLDivElement>;

  private campaignStatus = -1;
  private campaignId = -1;
  private caraousel: any;

  private scaleFactor = 2;
  private playerScaleFactor = 2.5;

  constructor(
    private titleService: Title,
    private stepNavService: StepNavService,
    private storageService: WebStorageService,
    private createAdService: CreateAdService,
    private router: Router,
    private logger: NGXLogger,
    private templateService: TemplateService,
    private mediaService: MediaService,
    private authService: AuthService,
    private window: Window,
    private _translate: TranslateService
  ) { }

  ngOnInit(): void {
    this._translate.use(localStorage.getItem('language'));
    this.titleService.setTitle(`${appConfig.appDisplayName}: Template`);
    if (this.storageService.get(StorageKeys.CAMPAIGN_ID)) {
      this.campaignId = this.storageService.get<number>(StorageKeys.CAMPAIGN_ID);
    }
    if (this.storageService.get(StorageKeys.CAMPAIGN_STATUS)) {
      this.campaignStatus = this.storageService.get(StorageKeys.CAMPAIGN_STATUS);
    }
    this.createAdService.summaryData().pipe(mergeMap(campaign => {
      this.campaign = campaign;
      return this.templateService.getAllTemplates();
    })).subscribe(templates => {
      if (templates && templates.length > 0){
        this.templates = templates;
        this.templates.forEach(function (t) {
          let data = this.mediaService.getOfficeLogoV1(t['data'].templateId+"-m1x");
          data.subscribe((data: any) => {
              this.logger.info("Response got ["+JSON.stringify(data)+"] templateId ["+t['data'].templateId+"-m1x"+"]");
              t['data'].officeLogoUrl = data;
              this.syncTemplateData(storedTemplateId);

          });
        }.bind(this));
        const storedTemplateId = this.storageService.get<string>(StorageKeys.TEMPLATE_ID) || this.templates[0].data.templateId;
        this.syncTemplateData(storedTemplateId);
      }
    });
    this.stepNavService.initSteps(CREATE_AD_STEPS.FOOTER_BANNER, this.campaignStatus);
  }

  private syncTemplateData(templateId: string): void {
    const result = this.templates.filter(template => template.data.templateId === templateId);
    if (result.length > 0) {
      const template = result[0];
      const templateData: TemplateData = this.storageService.get<TemplateData>(StorageKeys.TEMPLATE_DATA) || {};
      if (template.data.templateId === templateData.templateId) {
        template.data.headlineText = templateData.headlineText;
      }
      var profileText = this.storageService.get(StorageKeys.PROFILE_TEXT);
      if (profileText === AppConstant.PERSONAL_PROFILE_TEXT_MENU_ITEM) {
        var teamProfile = this.storageService.get(AppConstant.TEAM_PROFILE);
        var teamMembers = this.storageService.get(AppConstant.TEAM_MEMBERS);
        var breNumber = '';
        teamMembers.forEach(function (member, i){
          if(member['role'] === AppConstant.TEAM_ADMIN) {
            breNumber = member['licenseNumber'];
          }
        });
        template.data.agentName = teamProfile['teamName'];
        template.data.agentImage = teamProfile['imageUrl'];
        template.data.email = teamProfile['contactEmail'];
        template.data.phone = teamProfile['contactPhone'];
        template.data.breNumber = breNumber;
      } else {
        template.data.website = templateData.website;
        template.data.agentName = `${(this.authService.getAgentInfo(AGENT_INFO_FIELDS.FIRST_NAME) || '').trim()} ${(this.authService.getAgentInfo(AGENT_INFO_FIELDS.LAST_NAME) || '').trim()}`;
        template.data.agentImage = this.authService.getAgentInfo(AGENT_INFO_FIELDS.PHOTO);
        template.data.email = templateData.email || this.authService.getAgentInfo(AGENT_INFO_FIELDS.EMAIL);
        template.data.phone = templateData.phone || this.authService.getAgentInfo(AGENT_INFO_FIELDS.CELL);
        template.data.breNumber = templateData.breNumber || this.authService.getAgentInfo(AGENT_INFO_FIELDS.BRENUMBER);
      }
      template.data.visibility.breNumber = this.campaign.breNumber;
      const playerBannerTemplate = template;
      playerBannerTemplate.data.scaleFactor = this.playerScaleFactor;
      this.selectedTemplate = template;
      this.playerBannerTemplate = playerBannerTemplate;
      this.syncOfficeLogoUrl(template.data.officeLogoUrl);
      this.adjustScaleFactor();
    }
  }

  @HostListener('window:resize')
  adjustScaleFactor() {
    if (this.window.matchMedia('(max-width: 991px)').matches){
      this.scaleFactor = 1;
      this.playerScaleFactor = 1.5;
    }else{
      this.scaleFactor = 2;
      this.playerScaleFactor = 2.6;
    }
    this.selectedTemplate.data.scaleFactor = this.scaleFactor;
    this.playerBannerTemplate.data.scaleFactor = this.playerScaleFactor;
  }

  private syncOfficeLogoUrl(defaultOfficeLogoUrl): void {
    this.selectedTemplate.data.officeLogoUrl = this.officeLogoUrl || defaultOfficeLogoUrl;
    this.playerBannerTemplate.data.officeLogoUrl = this.officeLogoUrl || defaultOfficeLogoUrl;
  }

  ngAfterViewInit(): void {
    this.caraousel = $(this.templateGallery.nativeElement).carousel({interval: 0});
    this.caraousel.on('slid.bs.carousel', (event) => {
      this.slideChanged(event.relatedTarget, event.to + 1);
    });
  }

  slideChanged(activeSlide, slideNo) {
    this.campaign.templateId = activeSlide.dataset.templateId;
    this.syncTemplateData(this.campaign.templateId);
  }

  stepChanged(step) {
    if (this.stepNavService.isPreviousFromCurrent(step.id)) {
      this.handlePrevious(step);
    } else if (step.id === CREATE_AD_STEPS.SUMMARY) {
      this.handleNext(step);
    }
  }

  handlePrevious(step: NavigationStep) {
    this.storeCampaignInfo();
    this.router.navigate(step.routeCommand);
  }

  handleNext(step: NavigationStep) {
    this.templateService
      .uploadCreative(this.selectedTemplate.data, this.selectedTemplate.data['officeLogoUrl'])
      .subscribe(resp => {
      if (resp && resp.ecode === 0) {
        this.storageService.set(StorageKeys.FOOTER_BANNER, resp.url);
      }
      this.storageService.set(StorageKeys.TEMPLATE_ID, this.selectedTemplate.data.templateId);
      this.storageService.set(StorageKeys.TEMPLATE_DATA, this.selectedTemplate.data);
      this.storeCampaignInfo();
      this.router.navigate(step.routeCommand);
    });
  }

  private storeCampaignInfo() {
    const campaignInfo = {
      campaignName: this.campaign.campaignName,
      landingPageUrl: this.campaign.landingPage,
      videoUrl: this.campaign.videoUrl,
      mediaTitle: this.campaign.mediaTitle,
      overlaybanner: this.campaign.overlaybanner,
      breNumber: this.campaign.breNumber
    };
    this.storageService.set(StorageKeys.CAMPAIGN_INFO, campaignInfo);
  }

  slide(direction: number) {
    this.storageService.set(StorageKeys.TEMPLATE_DATA, this.selectedTemplate.data);
    if ( direction === -1 && typeof this.caraousel !== 'undefined') {
      this.caraousel.carousel('prev');
    }
    if ( direction === 1 && typeof this.caraousel !== 'undefined') {
      this.caraousel.carousel('next');
    }
  }

  onTextInput(inputSource: HTMLInputElement, fieldName) {
    const maxLength = parseInt(inputSource.dataset.maxLength, 10);
    const maxSize = parseInt(inputSource.dataset.maxSize, 10);
    const minSize = parseInt(inputSource.dataset.minSize, 10);
    const currentCharCount = inputSource.value.length;
    const ratio = maxSize / maxLength;
    const size = currentCharCount * ratio;
    const finalSize = (size <= minSize) ? minSize : size;
    this.selectedTemplate.data.fontSizeFactor[fieldName] = finalSize;
  }
}
