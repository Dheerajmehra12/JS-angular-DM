import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {NGXLogger} from 'ngx-logger';
import {WebStorageService} from '../services/web-storage.service';
import {StorageKeys} from '../services/common/constants/storage-keys';
import {Plan, PlanService} from './plan.service';
import {Title} from '@angular/platform-browser';
import { TranslateService } from '../services/translate';
import {RouteConstants} from '../services/common/constants/route-constants';
import { AppConstant } from '../services/common/constants/app-constant';


declare const appConfig: any;
@Component({
  selector: 'app-select-plan',
  templateUrl: './select-plan.component.html',
  styleUrls: ['./select-plan.component.css'],
})
export class SelectPlanComponent implements OnInit {
  selectPlanArray: Array<Plan>;
  selectedPlan: Plan;
  note: string;
  appDisplayName: string;
  buttonText : string;

  constructor(
    private router: Router,
    private logger: NGXLogger,
    private storageService: WebStorageService,
    private planService: PlanService,
    private titleService: Title,
    private _translate: TranslateService
  ) { }

  private formatNote() {
    const originalValue = this.note;
    try {
      if (this.note && this.note.indexOf('(') !== -1) {
        this.note = this.note.substring(this.note.indexOf('(') + 1);
        this.note = this.note.trim();
        if (this.note.indexOf(')') !== -1) {
          this.note = this.note.substring(0, this.note.lastIndexOf(')'));
          this.note = this.note.trim();
          this.note = this.note.charAt(0).toUpperCase() + this.note.substring(1);
        }
      }
    }catch (e) {
      this.note = originalValue;
    }
  }

  ngOnInit() {
    this._translate.use(localStorage.getItem('language'));
    this.planService.getPlans().subscribe((ctvPlans) => {
      this.selectPlanArray = ctvPlans;
      if (ctvPlans && ctvPlans.length > 0) {
        this.note = ctvPlans[0].line1;
        this.formatNote();
      }
    });
    this.selectedPlan = this.storageService.get(StorageKeys.SELECTED_PLAN);
    this.titleService.setTitle(`${appConfig.appDisplayName}: Select Plan`);
    this.appDisplayName = appConfig.appDisplayName;
    this.getButtonText();
  }

  getButtonText() {
    var profileText = this.storageService.get(StorageKeys.PROFILE_TEXT);
    if (profileText === AppConstant.PERSONAL_PROFILE_TEXT_MENU_ITEM) {
        this.buttonText = this._translate.translate('header.teamCampaigns');
    } else {
      this.buttonText = this._translate.translate('header.myCampaigns');
    }
  }
  selectPlan(plan: Plan) {
    this.selectedPlan = plan;
    this.logger.info(this.selectedPlan);
    this.storageService.set(StorageKeys.SELECTED_PLAN, this.selectedPlan);
    this.router.navigate(['/', RouteConstants.CREATE_AD]);
  }

}
