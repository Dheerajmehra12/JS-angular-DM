import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {map} from 'rxjs/operators';
import {CampaignListService} from '../campaign-list.service';
import {NGXLogger} from 'ngx-logger';
import {PlanService, PlansMap} from '../../select-plan/plan.service';
import {forkJoin} from 'rxjs';
import {DistanceUnit} from '../../create-ad/create-ad.service';
import { TranslateService } from '../../services/translate';


@Component({
  selector: 'app-campaign-details',
  templateUrl: './campaign-details.component.html',
  styleUrls: ['./campaign-details.component.css']
})
export class CampaignDetailsComponent implements OnInit {
  campaignId: string;
  campaign: any;
  plansMap: PlansMap;
  constructor(private route: ActivatedRoute,
              private planService: PlanService,
              private campaignListService: CampaignListService,
              private logger: NGXLogger,
              private _translate: TranslateService,
              ) { }

  ngOnInit(): void {
    this._translate.use(localStorage.getItem('language'));
    this.route.paramMap.pipe(map((params: ParamMap) => params.get('campaignId')))
      .subscribe((campaignId) => {
      this.campaignId = campaignId;
      const ob$campaignDetails = this.campaignListService.getCampaignDetails(this.campaignId);
      const ob$plansMap = this.planService.getPlansMap();
      forkJoin([ob$plansMap, ob$campaignDetails]).subscribe(([plansMap, campaignDetails]) => {
        this.plansMap = plansMap;
        this.campaign = campaignDetails;
      });
    });
  }
  get distanceUnits() {
    return DistanceUnit;
  }
}
