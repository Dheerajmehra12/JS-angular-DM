import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import {AuthService} from '../auth/auth.service';
import {Router} from '@angular/router';
import {NGXLogger} from 'ngx-logger';
import {WebStorageService} from '../services/web-storage.service';
import {StorageKeys} from '../services/common/constants/storage-keys';
import { TranslateService } from '../services/translate';
import {ThemingService} from '../services/theming.service';
import {RouteConstants} from '../services/common/constants/route-constants';
import {Location} from '@angular/common';
import {CampaignListService} from '../campaign-list/campaign-list.service';
import { AppConstant } from '../services/common/constants/app-constant';
import {DialogComponent, DialogData, DialogEvent, DialogEventType} from '../shared/dialog/dialog.component';
declare var $: any;
declare const appConfig: any;
import {environment} from '../../environments/environment';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html'
})


export class HeaderComponent implements OnInit, AfterViewInit {

  menuEnabled = false;
  hideLanguageOptionFromMenu=false;
  agentInfo: any = {};
  theme: any = {};
  loggedInTitleText : string='';
  campaignMenuText : string='';

  private campaignCount = 0;

  // @ViewChild('confirmSwitchDialog') confirmSwitchDialog: DialogComponent;
  confirmSwitchProfileDialogData: DialogData;
  languages = [
    {Name: 'header.english',languagekey: 'en'},
    {Name: 'header.portugal',languagekey: 'pt'},
    {Name: 'header.greece',languagekey: 'gr' },
    {Name: 'header.italy',languagekey: 'it' } ]

  @ViewChild('profileDropdown') profileDropDown: ElementRef;
  @Output() profileDropdownVisibilityChange: EventEmitter<{elem: ElementRef, visible: boolean}>
    = new EventEmitter<{elem: ElementRef, visible: boolean}>();

  constructor(private authService: AuthService,
              private router: Router,
              private logger: NGXLogger,
              private storageService: WebStorageService,
              private themingService: ThemingService,
              private location: Location,
              private campaignListService: CampaignListService,
              private _translate: TranslateService) {
  }

  ngOnInit() {
    this._translate.use(localStorage.getItem('language'));
    if (this.router.url.includes(RouteConstants.SWITCH_APP)) {
      this.menuEnabled = false;
    }else {
      this.menuEnabled = this.authService.loggedIn;
    }
    this.hideLanguageOptionFromMenu = environment.hideLanguageOptionFromMenu;
    this.setAgentInfo();
    this.authService.onLoginStatusChange().subscribe((loggedIn) => {
      this.menuEnabled = loggedIn;
      this.setAgentInfo();
    });
    this.themingService.getTheme().subscribe((theme) => this.theme = theme);
    this.campaignListService.getCampaignsCount().subscribe((campaignCount) => this.campaignCount = campaignCount);
    this.getLoggedInTitleText();
    var title = this._translate.translate('targeting.continueMsg');
    this.confirmSwitchProfileDialogData = {
        title: `<div class="col-12">`+title+`</div>`,
        options: {
          submitButton: true,
          cancelButton: true,
          submitButtonLabel: 'Yes',
          cancelButtonLabel: 'No',
        }
    };
  }

  ngAfterViewInit(): void {
    $(this.profileDropDown.nativeElement).on('show.bs.dropdown', (event) => this.onDropDownVisible(event));
    $(this.profileDropDown.nativeElement).on('hide.bs.dropdown', (event) => this.onDropDownHidden(event));
  }

  onDropDownVisible(event) {
    this.profileDropdownVisibilityChange.emit({elem: event.currentTarget, visible: true});
  }

  onDropDownHidden(event) {
    this.profileDropdownVisibilityChange.emit({elem: event.currentTarget, visible: false});
  }

  confirmSwitchDialogEvent($event: DialogEvent) {
      this.logger.info(`DialogEvent(${$event.dialogId}) = `, $event.eventType);
      if ($event.eventType == DialogEventType.SUBMIT) {
        this.clickProfile(false);

        this.storageService.set(StorageKeys.TEMPLATE_ID, '');
        this.storageService.set(StorageKeys.TEMPLATE_DATA, '');
        this.storageService.set(StorageKeys.FOOTER_BANNER, '');

        window.location.href = '/select-plan';

      }
      // this.confirmSwitchDialog.hide();
  }
  private setAgentInfo() {
    if (this.menuEnabled) {
      const loginInfo = this.storageService.get(StorageKeys.LOGIN_DATA);
      this.agentInfo = loginInfo.agentInfo;
    }
  }

  getHomePage() {
    if (this.menuEnabled) {
      if (this.location.path().includes(RouteConstants.SWITCH_APP)){
        return [`/${RouteConstants.SWITCH_APP}`];
      } else if (this.campaignCount === 0) {
        return [`/${RouteConstants.SELECT_PLAN}`];
      } else{
        return [`/${RouteConstants.CAMPAIGN_LIST}/${RouteConstants.CAMPAIGNS}`];
      }
    }
    return ['/'];
  }

  lang() {
    document.getElementById("myDropdown").classList.toggle("show");
    event.stopPropagation();
  }

  hidelanguageDropdown(){
    document.getElementById("myDropdown") ? document.getElementById("myDropdown").classList.remove("show"):"";
  }

  langSelected(language) {
    localStorage.setItem('language', language);
    document.getElementById("myDropdown").classList.remove("show");
    this.getHomePage();
    window.location.reload();
  }

  defaultlanguage(languageKey){
    if(localStorage.getItem('language').toLowerCase()===languageKey){
      return true;
    }
    return false;
  }

   getBhhsOneUrl() {
      var loginResponse = this.storageService.get(StorageKeys.LOGIN_DATA);
     const sourcePortal = this.storageService.get(StorageKeys.SOURCE_PORTAL);
     const languagekey = localStorage.getItem('language')?localStorage.getItem('language'):AppConstant.LANGUAGE ;
     console.log(languagekey,"LANG");
      if(loginResponse !== '' || loginResponse !== undefined) {
        var url = appConfig.switchAppUrl.replace('TOKEN', loginResponse.token);
        url = url.replace("CODE", loginResponse.logininfo.code);
        url = url.replace("PORTAL", sourcePortal);
        url = url.replace("LANG",languagekey)
        window.location.href = url;
      }
  }

    public displayProfileMenu() {
       const loginResponse = this.storageService.get(StorageKeys.LOGIN_DATA);
       if(loginResponse) {
           var teamId = loginResponse['teamId'];
           if(teamId == null || teamId == '') {
               return false;
           }
       }
       return true;
     }

    public showProfile() {
      if(window.location.href.indexOf('/create-ad') != -1 || window.location.href.indexOf("/payment-done") != -1) {
        // this.confirmSwitchDialog.show();
      } else {
        return this.clickProfile(true);
      }
    }

    public clickProfile(reload) {
        var profileText = this.storageService.get(StorageKeys.PROFILE_TEXT);

        if(profileText === AppConstant.TEAM_PROFILE_TEXT_MENU_ITEM) {
            this.storageService.set(StorageKeys.PROFILE_TEXT, AppConstant.PERSONAL_PROFILE_TEXT_MENU_ITEM);
        } else if (profileText === AppConstant.PERSONAL_PROFILE_TEXT_MENU_ITEM) {
            this.storageService.set(StorageKeys.PROFILE_TEXT, AppConstant.TEAM_PROFILE_TEXT_MENU_ITEM);
        }
        if(reload) {
          window.location.reload();
        }
        return false;
    }

    public getMenuText() {
      if(this.displayProfileMenu()) {
          var profileText = this.storageService.get(StorageKeys.PROFILE_TEXT);
          if((profileText === '' || profileText === null)) {
              profileText = this._translate.translate("header.team");
              this.storageService.set(StorageKeys.PROFILE_TEXT, AppConstant.TEAM_PROFILE_TEXT_MENU_ITEM);
          }
          return profileText;
      }
    }


    public getLoggedInTitleText() {
      if(this.displayProfileMenu()) {
        var profileText = this.storageService.get(StorageKeys.PROFILE_TEXT);
        if(profileText === AppConstant.PERSONAL_PROFILE_TEXT_MENU_ITEM) {
          this.campaignListService.fetchTeamByContactId().subscribe((teamData) => {
            if(teamData['team_members'].length > 0 && Object.keys(teamData['team_profile']).length > 0) {
               this.storageService.set("team_members", teamData['team_members']);
               this.storageService.set("team_profile", teamData['team_profile']);
               this.loggedInTitleText = this._translate.translate("header.loggedInto") +" "+teamData['team_profile'].teamName;
               this.campaignMenuText = this._translate.translate('header.teamCampaigns');
               this.agentInfo.agentPhoto = teamData['team_profile'].imageUrl;
            } else {
              this.storageService.set("team_members", '');
              this.storageService.set("team_profile", '');
              this.loggedInTitleText = '';
              this.campaignMenuText = this._translate.translate('header.myCampaigns');
            }
          });
        } else {
          this.loggedInTitleText = '';
          this.campaignMenuText = this._translate.translate('header.myCampaigns');
        }
      }
    }
}
