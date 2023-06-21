import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {TagInputModule} from 'ngx-chips';
import {CampaignStatusPipe} from './campaign-status.pipe';
import { TargetLocationFormatPipe } from './target-location-format.pipe';
import {DailogModule} from '../shared/dialog/dialog.module'
@NgModule({
  declarations: [
    CampaignStatusPipe,
    TargetLocationFormatPipe,
    // DialogComponent
  ],
    imports: [
        TagInputModule,
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        DailogModule
    ],
  exports: [
    CampaignStatusPipe,
    TargetLocationFormatPipe,
    DailogModule
  ],
  entryComponents: [
  ]
})
export class CreateAdSharedModule { }

