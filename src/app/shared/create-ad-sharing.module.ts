import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {AuthModule} from '../auth/auth.module';
import {RouterModule} from '@angular/router';
import { TargetingComponent } from '../create-ad/targeting/targeting.component';
// import {LocationComponent} from '../create-ad/targeting/location/location.component';
import { MediaComponent } from '../create-ad/media/media.component';
import { PayAndPublishComponent } from '../create-ad/pay-and-publish/pay-and-publish.component';
import { CreateAdFooterComponent } from '../create-ad/shared/create-ad-footer/create-ad-footer.component';
import {TagInputModule} from 'ngx-chips';
import {PlayerComponent} from '../create-ad/player/player.component';
import {StepNavComponent} from '../create-ad/step-nav/step-nav.component';
import {CampaignStatusPipe} from './campaign-status.pipe';
import { TargetLocationFormatPipe } from './target-location-format.pipe';
import {TemplateModule} from "../template/template.module";
import {DailogModule} from '../shared/dialog/dialog.module'
@NgModule({
  declarations: [
    CreateAdFooterComponent,
    TargetingComponent,
    MediaComponent,
    PayAndPublishComponent,
    PlayerComponent,
    StepNavComponent,
    CampaignStatusPipe,
    TargetLocationFormatPipe,
    // DialogComponent
  ],
    imports: [
        TagInputModule,
        RouterModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        AuthModule,
        TemplateModule,
        DailogModule
    ],
  exports: [
    TargetingComponent,
    CreateAdFooterComponent,
    PlayerComponent,
    StepNavComponent,
    CampaignStatusPipe,
    TargetLocationFormatPipe,
    DailogModule
  ],
  entryComponents: [
    CreateAdFooterComponent,
    TargetingComponent,
    MediaComponent,
    PayAndPublishComponent
  ]
})
export class CreateAdSharedModule { }

