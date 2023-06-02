import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { TemplateRoutingModule } from './template-routing.module';
import { FooterTemplateComponent } from './footer-template/footer-template.component';
import { TemplateHostDirective } from './template-host.directive';
import { AtvLs0001M1xComponent } from './footer-template/atv-ls0001-m1x/atv-ls0001-m1x.component';
import { AtvLs0002M1xComponent } from './footer-template/atv-ls0002-m1x/atv-ls0002-m1x.component';
import { AtvLs0003M1xComponent } from './footer-template/atv-ls0003-m1x/atv-ls0003-m1x.component';
import { AtvLs0000M1xComponent } from './footer-template/atv-ls0000-m1x/atv-ls0000-m1x.component';


@NgModule({
  declarations: [
    FooterTemplateComponent,
    TemplateHostDirective,
    AtvLs0001M1xComponent,
    AtvLs0002M1xComponent,
    AtvLs0003M1xComponent,
    AtvLs0000M1xComponent
  ],
  exports: [
    TemplateHostDirective,
    FooterTemplateComponent
  ],
  imports: [
    CommonModule,
    TemplateRoutingModule
  ]
})
export class TemplateModule { }
