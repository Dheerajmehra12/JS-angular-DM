import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {FooterTemplateComponent} from './footer-template/footer-template.component';
import {RouteConstants} from '../services/common/constants/route-constants';

const routes: Routes = [
  {path: `${RouteConstants.TEMPLATES}/:templateId`, component: FooterTemplateComponent, data: {auth: false}},
];
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TemplateRoutingModule { }
