import {ChangeDetectorRef, Component, HostListener, Inject, OnInit} from '@angular/core';
import {CREATE_AD_STEPS, NavigationStep, StepNavService} from '../step-nav/step-nav.service';
import {GALLERY_TYPES, MediaInformation, MediaInformationFactory, MediaService, VideoGallery} from './media.service';
import {NGXLogger} from 'ngx-logger';
import {WebStorageService} from '../../services/web-storage.service';
import {StorageKeys} from '../../services/common/constants/storage-keys';
import {CreateAdService} from '../create-ad.service';
import {Router} from '@angular/router';
import {DomSanitizer, Title} from '@angular/platform-browser';
import {UtilityService} from '../../services/common/utility.service';
import {Observable, throwError} from 'rxjs';
import {map, mergeMap} from 'rxjs/operators';
import {ALERT_TIMEOUT} from '../../app.module';
import {DialogComponent, DialogData, DialogEvent, DialogEventType} from '../../shared/dialog/dialog.component';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TemplateService} from '../../template/template.service';
import {TemplateData, TemplateItem} from '../../template/template-component';
import {AGENT_INFO_FIELDS, AuthService} from '../../auth/auth.service';
import { TranslateService } from '../../services/translate';
import { AppConstant } from '../../services/common/constants/app-constant';


declare const appConfig: any;
@Component({
  selector: 'app-media',
  templateUrl: './media.component.html',
  styleUrls: ['./media.component.css']
})
export class MediaComponent implements OnInit {

  mediaJSON: MediaInformation = MediaInformationFactory.create();
  videoUploadDialogData: DialogData;
  videoUploadDialog: DialogComponent;
  companyVideoUploadDialogData: DialogData;
  companyVideoUploadDialog: DialogComponent;
  disableNext = false;
  isMarketingDirectorRole = false;
  videoUploadForm: FormGroup;
  companyVideoUploadForm: FormGroup;
  httpRequestSubscriber = {
    urlExitCallSubscriber: null,
  };
  errors = {
    publishAlertTimer: null,
    publish: ''
  };
  domainTimer: any;
  private campaignStatus = -1;
  private campaignId = -1;
  private loginAsData = {'bhhsRole':[]};
  constructor(
    private stepNavService: StepNavService,
    public util: UtilityService,
    public mediaService: MediaService,
    private logger: NGXLogger,
    private storageService: WebStorageService,
    public createAdService: CreateAdService,
    private router: Router,
    private titleService: Title,
    private formBuilder: FormBuilder,
    @Inject(ALERT_TIMEOUT) private alertTimeout: number,
    private sanitizer: DomSanitizer,
    private templateService: TemplateService,
    private authService: AuthService,
    private changeDetectorRef: ChangeDetectorRef,
    private _translate: TranslateService
  ) { }

  ngOnInit(): void {
    this._translate.use(localStorage.getItem('language'));
    if (this.storageService.get(StorageKeys.CAMPAIGN_ID)) {
      this.campaignId = this.storageService.get(StorageKeys.CAMPAIGN_ID);
    }
    if (this.storageService.get(StorageKeys.CAMPAIGN_STATUS)) {
      this.campaignStatus = this.storageService.get(StorageKeys.CAMPAIGN_STATUS);
    }

    if (this.storageService.get(StorageKeys.LOGGED_AS)) {
        this.loginAsData = this.storageService.get(StorageKeys.LOGGED_AS);
       let bhhsRole = this.loginAsData.bhhsRole;
        this.logger.info("BhhsRole ", bhhsRole);
       bhhsRole.forEach(role => {
          this.logger.info("Role is ["+role.role+"]");
         if(role.role === 'Marketing Director') {

           this.isMarketingDirectorRole = true;
           this.logger.info("IsMarketingDirector ["+this.isMarketingDirectorRole+"]");
         }
        });
    }



    this.stepNavService.initSteps(CREATE_AD_STEPS.MEDIA, this.campaignStatus);
    this.titleService.setTitle(`${appConfig.appDisplayName}: Media`);
    this.restoreMediaData();
  }

  stepChanged(step) {
    if (this.stepNavService.isPreviousFromCurrent(step.id)) {
      this.handlePrevious(step);
    } else if (step.id === CREATE_AD_STEPS.FOOTER_BANNER) {
      this.handleNext(step);
    }
  }

  handleNext(step: NavigationStep) {
    this.logger.info('handleNext', step);
    if (this.mediaValidationCheckEvent()) {
      this.router.navigate(step.routeCommand);
    }
  }

  handlePrevious(step: NavigationStep) {
    this.logger.info('handlePrevious', step);
    this.router.navigate(step.routeCommand);
  }

  loadGallery(galleryType: string) {
    this.restoreMediaData(galleryType);
  }

  get galleryTypes(): typeof GALLERY_TYPES {
    return GALLERY_TYPES;
  }

  uploadVideo(videoUploadDialog: DialogComponent, companyVideoUploadDialog: DialogComponent, galleryTabs: HTMLUListElement) {
    if (this.mediaJSON.galleryType === GALLERY_TYPES.USER) {
      this.videoUploadDialog = videoUploadDialog;
      this.videoUploadDialogData = {
        title: `Upload Video to <strong class="text-cms-primary">'My Videos'</strong>`,
        options: {
          submitButton: true,
          cancelButton: true,
          submitButtonLabel: 'Upload',
          cancelButtonLabel: 'Cancel',
        },
        galleryTabs
      };
      this.videoUploadForm = this.formBuilder.group({video: [null, Validators.required], videoTitle: ['', Validators.required]});
      this.videoUploadForm.get('videoTitle').setValue('');
      this.checkVideoFormValidity();
      this.videoUploadDialog.show();
      setTimeout(() => {
        this.clearVideo();
        this.clearErrors();
      });
    }
    if (this.mediaJSON.galleryType === GALLERY_TYPES.COMPANY) {
      this.companyVideoUploadDialog = companyVideoUploadDialog;
      if(this.isMarketingDirectorRole) {
        this.companyVideoUploadDialogData = {
          title: `Add Video to <strong class="text-cms-primary">'My Company Videos'</strong>`,
          options: {
            submitButton: true,
            cancelButton: true,
            submitButtonLabel: 'Upload',
            cancelButtonLabel: 'Cancel',
          },
          galleryTabs
        };
      } else {
        this.companyVideoUploadDialogData = {
          title: `Add Video to <strong class="text-cms-primary">'My Company Videos'</strong>`,
          options: {
            submitButton: false,
            cancelButton: true,
            cancelButtonLabel: 'Cancel',
          },
          galleryTabs
        };
      }
      this.companyVideoUploadForm = this.formBuilder.group({video: [null, Validators.required], companyVideoTitle: ['', Validators.required]});
      this.companyVideoUploadForm.get('companyVideoTitle').setValue('');
      this.checkCompanyVideoFormValidity();
      this.companyVideoUploadDialog.show();
      setTimeout(() => {
        this.clearCompanyVideo();
        this.clearCompanyVideoErrors();
      });
    }


  }

  private clearCompanyVideo() {
    this.companyVideoUploadDialogData.showVideo = false;
    this.companyVideoUploadDialogData.videoFile = null;
    this.companyVideoUploadDialogData.videoSrc = null;
    this.companyVideoUploadDialogData.videoDuration = 0;
    this.companyVideoUploadDialogData.videoWidth = 0;
    this.companyVideoUploadDialogData.videoHeight = 0;
  }
  private clearVideo() {
    this.videoUploadDialogData.showVideo = false;
    this.videoUploadDialogData.videoFile = null;
    this.videoUploadDialogData.videoSrc = null;
    this.videoUploadDialogData.videoDuration = 0;
    this.videoUploadDialogData.videoWidth = 0;
    this.videoUploadDialogData.videoHeight = 0;
  }

  private checkVideoFormValidity() {
    if (this.videoUploadDialog && this.videoUploadForm) {
      if (!this.videoUploadForm.valid) {
        this.videoUploadDialog.disableSubmitButton();
      }else{
        this.videoUploadDialog.enableSubmitButton();
      }
    }
  }

  private checkCompanyVideoFormValidity() {
    if (this.companyVideoUploadDialog && this.companyVideoUploadForm) {
      if (!this.companyVideoUploadForm.valid) {
        this.companyVideoUploadDialog.disableSubmitButton();
      }else{
        this.companyVideoUploadDialog.enableSubmitButton();
      }
    }
  }

  onVideoUploadDialogEvent($event: DialogEvent){
    this.logger.info(`videoUploadDialogEvent(${JSON.stringify($event)})`);
    if ($event.eventType === DialogEventType.SUBMIT){
      this.onSubmitVideoUploadForm();
    }
  }

  onCompanyVideoUploadDialogEvent($event: DialogEvent){
    this.logger.info(`onCompanyVideoUploadDialogEvent(${JSON.stringify($event)})`);
    if ($event.eventType === DialogEventType.SUBMIT){
        this.onSubmitCompanyVideoUploadForm();
    }
  }

  uploadVideoFile(event) {
    this.checkVideoFormValidity();
  }
  uploadCompanyVideoFile(event) {
    this.checkCompanyVideoFormValidity();
  }

  previewVideo(event: Event, videoElement: HTMLVideoElement) {
    const videoElem = videoElement;
    const videoFile = (event.target as HTMLInputElement).files[0];
    this.videoUploadDialogData.showVideo = true;
    this.videoUploadDialogData.videoFile = videoFile;
    this.videoUploadDialogData.videoSrc = this.sanitizer
      .bypassSecurityTrustUrl(URL.createObjectURL(videoFile));
    videoElem.load();
  }
  previewCompanyVideo(event: Event, videoElement: HTMLVideoElement) {
    const videoElem = videoElement;
    const videoFile = (event.target as HTMLInputElement).files[0];
    this.companyVideoUploadDialogData.showVideo = true;
    this.companyVideoUploadDialogData.videoFile = videoFile;
    this.companyVideoUploadDialogData.videoSrc = this.sanitizer
      .bypassSecurityTrustUrl(URL.createObjectURL(videoFile));
    videoElem.load();
  }

  onVideoMetaDataLoaded(videoElement: HTMLVideoElement, thumbCanvas: HTMLCanvasElement){
    this.logger.info(`canPlayType: ${videoElement.canPlayType('video/mp4')}`);
    const videoDuration = Math.floor(videoElement.duration);
    this.videoUploadDialogData.videoDuration = videoDuration;
    this.videoUploadDialogData.videoWidth = videoElement.videoWidth;
    this.videoUploadDialogData.videoHeight = videoElement.videoHeight;
    this.videoUploadDialogData.thumbCanvas = thumbCanvas;
    this.videoUploadDialogData.videoElement = videoElement;
    const validDuration: Array<number> = [90, 60, 30, 15, 6];
    const validResolution: Array<{width: number, height: number}> = [{width: 1920, height: 1080}];
    const strValidResolution: string = validResolution.map(size => `${size.width}x${size.height}`).reduce((acc, val) => ((acc) ? `${acc}, ${val}` : val), '');
    const invalidDuration = !validDuration.includes(videoDuration) || videoDuration === 0;
    const invalidResolution = validResolution
      .findIndex(size => size.width === videoElement.videoWidth
        && size.height === videoElement.videoHeight) === -1;
    this.videoUploadDialogData.hasInvalidVideo = false;
    if (invalidDuration) {
      this.videoUploadDialogData.hasInvalidVideo = true;
      this.videoUploadDialogData.errorVideoMessage = 'Invalid video duration. Must be one of [' + validDuration.join(', ') + ']  exact duration in seconds';
    } else if (invalidResolution) {
      this.videoUploadDialogData.hasInvalidVideo = true;
      this.videoUploadDialogData.errorVideoMessage = 'Invalid video resolution. Must be one of [' + strValidResolution + ']';
    }
    if (this.videoUploadDialogData.hasInvalidVideo) {
      this.videoUploadForm.get('video').setValue(null);
    }
    this.checkVideoFormValidity();
  }

  onCompanyVideoMetaDataLoaded(videoElement: HTMLVideoElement, thumbCanvas: HTMLCanvasElement){
    this.logger.info(`canPlayType: ${videoElement.canPlayType('video/mp4')}`);
    const videoDuration = Math.floor(videoElement.duration);
    this.companyVideoUploadDialogData.videoDuration = videoDuration;
    this.companyVideoUploadDialogData.videoWidth = videoElement.videoWidth;
    this.companyVideoUploadDialogData.videoHeight = videoElement.videoHeight;
    this.companyVideoUploadDialogData.thumbCanvas = thumbCanvas;
    this.companyVideoUploadDialogData.videoElement = videoElement;
    const validDuration: Array<number> = [90, 60, 30, 15, 6];
    const validResolution: Array<{width: number, height: number}> = [{width: 1920, height: 1080}];
    const strValidResolution: string = validResolution.map(size => `${size.width}x${size.height}`).reduce((acc, val) => ((acc) ? `${acc}, ${val}` : val), '');
    const invalidDuration = !validDuration.includes(videoDuration) || videoDuration === 0;
    const invalidResolution = validResolution
      .findIndex(size => size.width === videoElement.videoWidth
        && size.height === videoElement.videoHeight) === -1;
    this.companyVideoUploadDialogData.hasInvalidVideo = false;
    if (invalidDuration) {
      this.companyVideoUploadDialogData.hasInvalidVideo = true;
      this.companyVideoUploadDialogData.errorVideoMessage = 'Invalid video duration. Must be one of [' + validDuration.join(', ') + ']  exact duration in seconds';
    } else if (invalidResolution) {
      this.companyVideoUploadDialogData.hasInvalidVideo = true;
      this.companyVideoUploadDialogData.errorVideoMessage = 'Invalid video resolution. Must be one of [' + strValidResolution + ']';
    }
    if (this.companyVideoUploadDialogData.hasInvalidVideo) {
      this.companyVideoUploadForm.get('video').setValue(null);
    }
    this.checkCompanyVideoFormValidity();
  }

  private clearErrors(){
    this.videoUploadDialogData.hasInvalidVideo = false;
    this.videoUploadDialogData.errorVideoMessage = '';
  }

  private clearCompanyVideoErrors(){
    this.companyVideoUploadDialogData.hasInvalidVideo = false;
    this.companyVideoUploadDialogData.errorVideoMessage = '';
  }

  onSourceError(event, mediaSource: HTMLSourceElement){
    this.logger.info(`onSourceError(${JSON.stringify(event)}),mediaSource: ${JSON.stringify(mediaSource)}`);
    this.logger.info(`onSourceError(videoUploadDialogData.videoSrc) => ${this.videoUploadDialogData.videoSrc}`);
    if (this.videoUploadDialogData.videoSrc !== null) {
      this.videoUploadDialogData.hasInvalidVideo = true;
      this.videoUploadDialogData.errorVideoMessage = 'Unable to read video';
      this.videoUploadForm.get('video').setValue(null);
      this.checkVideoFormValidity();
    }
  }

  onCompanyVideoSourceError(event, mediaSource: HTMLSourceElement){
    this.logger.info(`onSourceError(${JSON.stringify(event)}),mediaSource: ${JSON.stringify(mediaSource)}`);
    this.logger.info(`onSourceError(companyVideoUploadDialogData.videoSrc) => ${this.companyVideoUploadDialogData.videoSrc}`);
    if (this.videoUploadDialogData.videoSrc !== null) {
      this.videoUploadDialogData.hasInvalidVideo = true;
      this.companyVideoUploadDialogData.errorVideoMessage = 'Unable to read video';
      this.companyVideoUploadForm.get('video').setValue(null);
      this.checkCompanyVideoFormValidity();
    }
  }

  setCompanyVideoTitle(event) {
    const videoTitle = (event.target as HTMLInputElement);
    this.companyVideoUploadForm.patchValue({
      companyVideoTitle: videoTitle.value
    });
    this.companyVideoUploadForm.get('companyVideoTitle').updateValueAndValidity();
    this.checkCompanyVideoFormValidity();
  }
  setVideoTitle(event) {
    const videoTitle = (event.target as HTMLInputElement);
    this.videoUploadForm.patchValue({
      videoTitle: videoTitle.value
    });
    this.videoUploadForm.get('videoTitle').updateValueAndValidity();
    this.checkVideoFormValidity();
  }

  private onSubmitVideoUploadForm() {
    this.videoUploadDialogData.submitted = true;
    const thumbCanvas: HTMLCanvasElement = this.videoUploadDialogData.thumbCanvas;
    const videoElement: HTMLVideoElement = this.videoUploadDialogData.videoElement;
    thumbCanvas.width = videoElement.videoWidth;
    thumbCanvas.height = videoElement.videoHeight;
    const imageType = 'jpeg';

    videoElement.currentTime = 0;
    const ctx: CanvasRenderingContext2D = thumbCanvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, videoElement.videoWidth, videoElement.videoHeight);
    const frame = ctx.getImageData(0, 0, videoElement.videoWidth, videoElement.videoHeight);
    ctx.putImageData(frame, 0, 0);
    thumbCanvas.toBlob(blob => {
      this.mediaService.uploadVideoThumbnail(blob, `${this.videoUploadDialogData.videoFile.name}_thumbnail.${imageType}`)
        .pipe(map(res => {
          if (res.ecode === 200 && res.response !== null && res.response.url) {
            return res.response.url;
          } else {
            throwError(new Error(`Error during video thumbnail generation. ${res.edesc}`));
          }
        }), mergeMap(thumbnail => {
          return this.mediaService
            .uploadVideo(this.videoUploadDialogData.videoFile, this.videoUploadForm.get('videoTitle').value)
            .pipe(map(res => {
              if (res.ecode === 200 && res.response !== null && res.response.url) {
                return {thumbnail, videoUrl: res.response.url};
              } else {
                throwError(new Error(`Error during video url generation. ${res.edesc}`));
              }
            }));
        }), mergeMap(res => {
        const videoTitle = this.videoUploadForm.get('videoTitle').value;
        return this.mediaService.addMyVideo(videoTitle, res.videoUrl, res.thumbnail, false, false).pipe(map(upResp => {
          if (upResp.status === 0 && upResp.response !== null) {
            return upResp.response;
          } else {
            throwError(new Error(`Error during adding video to my videos. ${upResp.edesc}`));
          }
        }));
      }), mergeMap(res => {
          return this.mediaService.getThumbnailArray(GALLERY_TYPES.USER);
        })).subscribe(gallery => {
        /*const handler$VideoGallery = this.videoGalleryHandler(GALLERY_TYPES.USER);
        handler$VideoGallery(gallery);*/
        const tabLink: HTMLAnchorElement  = this.videoUploadDialogData.galleryTabs.querySelector(`li.nav-item[data-gallery-type="${GALLERY_TYPES.USER}"] a.nav-link`);
        tabLink.click();
      }, error => this.logger.info(error), () => {
        this.videoUploadDialog.hide();
        // setTimeout(() => this.changeDetectorRef.detectChanges(), 0);
      });
    }, `image/${imageType}`);
  }

  private onSubmitCompanyVideoUploadForm() {
    this.companyVideoUploadDialogData.submitted = true;
    const thumbCanvas: HTMLCanvasElement = this.companyVideoUploadDialogData.thumbCanvas;
    const videoElement: HTMLVideoElement = this.companyVideoUploadDialogData.videoElement;
    thumbCanvas.width = videoElement.videoWidth;
    thumbCanvas.height = videoElement.videoHeight;
    const imageType = 'jpeg';

    videoElement.currentTime = 0;
    const ctx: CanvasRenderingContext2D = thumbCanvas.getContext('2d');
    ctx.drawImage(videoElement, 0, 0, videoElement.videoWidth, videoElement.videoHeight);
    const frame = ctx.getImageData(0, 0, videoElement.videoWidth, videoElement.videoHeight);
    ctx.putImageData(frame, 0, 0);
    thumbCanvas.toBlob(blob => {
      this.mediaService.uploadVideoThumbnail(blob, `${this.companyVideoUploadDialogData.videoFile.name}_thumbnail.${imageType}`)
        .pipe(map(res => {
          if (res.ecode === 200 && res.response !== null && res.response.url) {
            return res.response.url;
          } else {
            throwError(new Error(`Error during video thumbnail generation. ${res.edesc}`));
          }
        }), mergeMap(thumbnail => {
          return this.mediaService
            .uploadVideo(this.companyVideoUploadDialogData.videoFile, this.companyVideoUploadForm.get('companyVideoTitle').value)
            .pipe(map(res => {
              if (res.ecode === 200 && res.response !== null && res.response.url) {
                return {thumbnail, videoUrl: res.response.url};
              } else {
                throwError(new Error(`Error during video url generation. ${res.edesc}`));
              }
            }));
        }), mergeMap(res => {
        const videoTitle = this.companyVideoUploadForm.get('companyVideoTitle').value;
        return this.mediaService.addMyVideo(videoTitle, res.videoUrl, res.thumbnail, false, true).pipe(map(upResp => {
          if (upResp.status === 0 && upResp.response !== null) {
            return upResp.response;
          } else {
            throwError(new Error(`Error during adding video to my videos. ${upResp.edesc}`));
          }
        }));
      }), mergeMap(res => {
          return this.mediaService.getThumbnailArray(GALLERY_TYPES.COMPANY);
        })).subscribe(gallery => {
        /*const handler$VideoGallery = this.videoGalleryHandler(GALLERY_TYPES.COMPANY);
        handler$VideoGallery(gallery);*/
        const tabLink: HTMLAnchorElement  = this.companyVideoUploadDialogData.galleryTabs.querySelector(`li.nav-item[data-gallery-type="${GALLERY_TYPES.COMPANY}"] a.nav-link`);
        tabLink.click();
      }, error => this.logger.info(error), () => {
        this.companyVideoUploadDialog.hide();
        // setTimeout(() => this.changeDetectorRef.detectChanges(), 0);
      });
    }, `image/${imageType}`);
  }

  private videoGalleryHandler(galleryType: string = GALLERY_TYPES.ALL) {
    return (gallery) => {
      this.mediaJSON.galleryType = galleryType;
      this.mediaJSON.thumbnailArray = gallery;
      const mediaData = this.storageService.get(StorageKeys.CAMPAIGN_INFO);
      if (!this.util.isVoid(mediaData)) {
        this.mediaJSON.campaignName = mediaData.campaignName;
        this.mediaJSON.overlayBanner = mediaData.overlaybanner;
        this.mediaJSON.lpUrl = mediaData.landingPageUrl;
        this.urlAndDomainValidation(this.mediaJSON.lpUrl);
        if (mediaData.videoUrl) {
          const resultIndex = this.mediaJSON.thumbnailArray
            .findIndex((mediaObj) => mediaObj.url === mediaData.videoUrl);
          if (resultIndex !== -1) {
            this.mediaJSON.selectedVideoIndex = resultIndex;
          }
        }
      }

      if (this.mediaJSON.thumbnailArray.length > this.mediaJSON.selectedVideoIndex) {
        const selectedVideo = this.mediaJSON.thumbnailArray[this.mediaJSON.selectedVideoIndex];
        this.mediaJSON.selectedVideoUrl = selectedVideo.url;
        this.mediaJSON.mediaTitle = selectedVideo.name;
        this.mediaJSON.bgImg = selectedVideo.thumbnail;
        this.mediaJSON.showFooterBanner = selectedVideo.overlaybanner;
        this.mediaJSON.showBreNumber = selectedVideo.breNumber?selectedVideo.breNumber:(mediaData?mediaData.breNumber:true);
        this.fetchAllBanners(selectedVideo);
      }

      this.mediaValidationCheckEvent();
    };
  }

  restoreMediaData(galleryType: string = GALLERY_TYPES.ALL) {
    const $handleVideoGallery = this.videoGalleryHandler(galleryType);
    return this.mediaService.getThumbnailArray(galleryType).subscribe($handleVideoGallery);
  }

  mediaValidationCheckEvent() {
    const validate = this.validateMediaData();
    this.storeCampaignInfo();
    this.createAdService.setValidated(validate);
    this.disableNext = !validate;
    return validate;
  }

  validateMediaData() {
    if (this.util.isVoid(this.mediaJSON.lpUrl) && this.util.isVoid(this.mediaJSON.campaignName)) {
      this.mediaJSON.landingPageErrorMessage = 1;
    } /*else{
      this.mediaJSON.landingPageErrorMessage = 0;
    }*/
    if (this.util.isVoid(this.mediaJSON.campaignName)) {
      // this.mediaJSON.landingPageErrorMessage = 1;
      this.mediaJSON.cNameRequired = true;
      return false;
    }
    if (this.mediaJSON.campaignName.length < 4) {
      this.mediaJSON.cNameRequired = false;
      this.mediaJSON.cNameError = true;
      return false;
    }
    if (this.mediaJSON.landingPageErrorMessage !== 0) {
      return false;
    }
    return true;
  }

  fetchAllBanners(selectedVideo: VideoGallery) {
    const ob$fetchAllBanners: Observable<string> = this.mediaService.getOfficeLogo()
      .pipe(mergeMap((officeLogo) => {
      this.mediaJSON.officeLogo = officeLogo;
      let ob$footerBanner: Observable<string> = null;
      if (this.storageService.get<string>(StorageKeys.FOOTER_BANNER)) {
          ob$footerBanner = Observable.of(this.storageService.get<string>(StorageKeys.FOOTER_BANNER));
        }else{
          ob$footerBanner = this.templateService.getAllTemplates().pipe(mergeMap((templates) => {
            if (templates && templates.length > 0) {
              const storedTemplateId = this.storageService.get<string>(StorageKeys.TEMPLATE_ID) || templates[0].data.templateId;
              const result = templates.filter(template => template.data.templateId === storedTemplateId);
              if (result.length > 0) {
                const template = result[0];
                const templateData: TemplateData = this.storageService.get<TemplateData>(StorageKeys.TEMPLATE_DATA) || {};
                if (template.data.templateId === templateData.templateId) {
                  template.data.headlineText = templateData.headlineText;
                }
                template.data.website = templateData.website;

                var profileText = this.storageService.get(StorageKeys.PROFILE_TEXT);
                if (profileText === AppConstant.PERSONAL_PROFILE_TEXT_MENU_ITEM) {
                  var teamProfile = this.storageService.get(AppConstant.TEAM_PROFILE);
                  var teamMembers = this.storageService.get(AppConstant.TEAM_MEMBERS);
                  var breNumber = '';
                  if(teamProfile) {
                    this.mediaJSON.lpUrl = teamProfile['bhhsWebUrl'];
                  }
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
                  template.data.agentName = `${(this.authService.getAgentInfo(AGENT_INFO_FIELDS.FIRST_NAME) || '').trim()} ${(this.authService.getAgentInfo(AGENT_INFO_FIELDS.LAST_NAME) || '').trim()}`;
                  template.data.agentImage = this.authService.getAgentInfo(AGENT_INFO_FIELDS.PHOTO);
                  template.data.email = templateData.email || this.authService.getAgentInfo(AGENT_INFO_FIELDS.EMAIL);
                  template.data.phone = templateData.phone || this.authService.getAgentInfo(AGENT_INFO_FIELDS.CELL);
                  template.data.breNumber = templateData.breNumber || this.authService.getAgentInfo(AGENT_INFO_FIELDS.BRENUMBER);
                }
//                 template.data.officeLogoUrl = this.mediaJSON.officeLogo || template.data.officeLogoUrl;
                this.storageService.set(StorageKeys.TEMPLATE_ID, storedTemplateId);
                this.storageService.set(StorageKeys.TEMPLATE_DATA, template.data);
                return this.mediaService.getOfficeLogoV1(template['data'].templateId+"-m1x").pipe(
                                                                                mergeMap(logo =>  this.templateService.uploadCreative(template.data, logo).pipe(map( resp => {
                                                                                                                      if (resp && resp.ecode === 0) {
                                                                                                                        return resp.url;
                                                                                                                      }else {
                                                                                                                        return '';
                                                                                                                      }
                                                                                                                    }))));
              }
            }else{
              return Observable.of('');
            }
          }));
        }
      return ob$footerBanner;
    }));

    ob$fetchAllBanners.subscribe((footerBanner) => {
      this.mediaJSON.footerBanner = footerBanner;
      this.mediaJSON.defaultFooterBanner = footerBanner;
      if (selectedVideo && selectedVideo.overlaybannerurl != null) {
        this.mediaJSON.footerBanner = selectedVideo.overlaybannerurl;
      }
      this.storageService.set(StorageKeys.FOOTER_BANNER, this.mediaJSON.footerBanner);
    });
  }

  private storeCampaignInfo() {
    let overlayBanner = true;
    let openedForEdit = this.storageService.get(StorageKeys.CAMPAIGN_EDIT)?this.storageService.get(StorageKeys.CAMPAIGN_EDIT):false; 
    if(openedForEdit && this.mediaJSON.overlayBanner !== undefined){
      overlayBanner = this.mediaJSON.overlayBanner; 
      this.mediaJSON.showFooterBanner = this.mediaJSON.overlayBanner;  /** set overlayBanner value in Campaign Edit flow / by defalut is based on  @param {VideoGallery} videoObj */
    }
    else {
      overlayBanner = this.mediaJSON.showFooterBanner;
    }

    const campaignInfo = {
      campaignName: this.mediaJSON.campaignName,
      landingPageUrl: this.mediaJSON.lpUrl,
      videoUrl: this.mediaJSON.selectedVideoUrl,
      mediaTitle: this.mediaJSON.mediaTitle,
      overlaybanner: overlayBanner,
      breNumber: this.mediaJSON.showBreNumber
    };
    this.storageService.set(StorageKeys.CAMPAIGN_INFO, campaignInfo);
  }

  selectVideo(videoObj: VideoGallery, index) {
    this.logger.info(videoObj);
    this.mediaJSON.selectedVideoUrl = videoObj.url;
    this.mediaJSON.mediaTitle = videoObj.name;
    this.mediaJSON.bgImg = videoObj.thumbnail;
    this.mediaJSON.selectedVideoIndex = index;
    this.mediaJSON.showFooterBanner = videoObj.overlaybanner;
    this.mediaJSON.showBreNumber = videoObj.breNumber;
    if (videoObj.overlaybannerurl != null) {
      this.mediaJSON.footerBanner = videoObj.overlaybannerurl;
    }else{
      this.mediaJSON.footerBanner = this.mediaJSON.defaultFooterBanner;
    }
    this.storageService.set(StorageKeys.FOOTER_BANNER, this.mediaJSON.footerBanner);
    this.storeCampaignInfo();
  }

  saveCampaignInfo(key, event) {
    this.mediaJSON.landingPageErrorMessage = 0;
    if (key === 'cName') {
      this.mediaJSON.campaignName = event;
      this.mediaJSON.campaignName.length > 0 ? this.mediaJSON.cNameRequired = false : this.mediaJSON.cNameRequired = true;
      this.mediaJSON.campaignName.length < 4 ? this.mediaJSON.cNameError = true : this.mediaJSON.cNameError = false;
      this.mediaValidationCheckEvent();
    }
    if (key === 'lpUrl') {
      this.mediaJSON.lpUrl = event;
      this.mediaValidationCheckEvent();
      this.urlAndDomainValidation(this.mediaJSON.lpUrl);
    }
  }

  urlAndDomainValidation(event: any) {
    if (this.util.isVoid(this.mediaJSON.lpUrl)) {
      this.mediaValidationCheckEvent();
    }else{
      if (!this.validateBeforeCall(this.mediaJSON.lpUrl)) {
        this.domainTimer = setTimeout(() => {
          this.unsubscribeHttpRequest();
          this.checkIfDomainExists(this.mediaJSON.lpUrl);
        }, 500);
      } else {
        this.mediaJSON.landingPageErrorMessage = 2;
        this.mediaValidationCheckEvent();
      }
    }
  }

  unsubscribeHttpRequest() {
    if (this.httpRequestSubscriber.urlExitCallSubscriber) {
      this.httpRequestSubscriber.urlExitCallSubscriber.unsubscribe();
    }
  }

  clearDomainTimeout() {
    clearTimeout(this.domainTimer);
  }

  checkIfDomainExists(domain) {
    if (this.mediaJSON.lpUrl.startsWith('tel://')) {
      return true;
    }
    if (this.mediaJSON.lpUrl.startsWith('www.')) {
      domain = this.mediaJSON.lpUrl.split('www.')[1];
      domain = 'http://' + domain;
    }
    const regexp = /^((?:http|ftp)s?:\/\/)(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::\d+)?(?:\/?|[\/?]\S+)$/i;
    if (!regexp.test(domain)) {
      domain = 'http://' + domain;
    }
    domain = domain.trim();
    if (!this.util.isVoid(domain)) {
      this.httpRequestSubscriber.urlExitCallSubscriber = this.createAdService.checkIfDomainExists(domain, true)
        .subscribe(
          jsondata => {
            if ( jsondata.status === 0) {
              this.removeErrorMessage();
            } else {
              this.mediaJSON.landingPageErrorMessage = 3;
            }
            this.mediaValidationCheckEvent();
          },
          error => {
            this.logger.info('failure');
          });
    }
  }
  removeErrorMessage() {
    this.mediaJSON.landingPageErrorMessage = 0;
    this.mediaValidationCheckEvent();
  }

  validateBeforeCall(url) {
    if (!this.util.isVoid(url)) {
      url = url.toLowerCase();
    }
    if (this.mediaJSON.lpUrl.startsWith('tel://')) {
      return false;
    }
    const regexp = /^((?:http|ftp)s?:\/\/)(?:(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+(?:[A-Z]{2,6}\.?|[A-Z0-9-]{2,}\.?)|localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(?::\d+)?(?:\/?|[\/?]\S+)$/i;
    const regexp2 = /^(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,}))\.?)(?::\d{2,5})?(?:[/?#]\S*)?$/;
    if (!regexp2.test(url)) {
      if (!regexp.test(url) && !(/^.+\s$/.test(url))) {
        return true; // Invalid Url
      }
      else {
        return false;
      }
    } else {
      return false;
    }
  }

}
