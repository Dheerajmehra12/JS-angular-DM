import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import {CreateAdRoutingModule} from './create-ad-routing.module';
import { CreateAdSharedModule } from '../shared/create-ad-sharing.module';
import {CreateAdComponent} from './create-ad.component';
import { AuthModule } from '../auth/auth.module';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {NGXLogger} from 'ngx-logger';
import {TagInputModule} from 'ngx-chips';
import { SummaryComponent } from './summary/summary.component';
import { BannerComponent } from './banner/banner.component';
import {TemplateModule} from '../template/template.module';
@NgModule({
    imports: [
        TagInputModule,
        CommonModule,
        RouterModule,
        FormsModule,
        ReactiveFormsModule,
        CreateAdSharedModule,
        AuthModule,
        CreateAdRoutingModule,
        TemplateModule,
    ],
  declarations: [CreateAdComponent, SummaryComponent, BannerComponent],
  exports: [
  ],
  schemas: [
    CUSTOM_ELEMENTS_SCHEMA
  ]
})
export class CreateAdModule {
  constructor(private logger: NGXLogger) {
    this.logger.debug('create Ad module');
  }

}
