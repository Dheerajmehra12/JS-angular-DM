import {Injectable} from '@angular/core';
import {TemplateData, TemplateItem} from './template-component';
import {BehaviorSubject, Observable} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {AtvLs0001M1xComponent} from './footer-template/atv-ls0001-m1x/atv-ls0001-m1x.component';
import {AtvLs0002M1xComponent} from './footer-template/atv-ls0002-m1x/atv-ls0002-m1x.component';
import {AtvLs0003M1xComponent} from './footer-template/atv-ls0003-m1x/atv-ls0003-m1x.component';
import {HttpClient, HttpContext} from '@angular/common/http';
import {NGXLogger} from 'ngx-logger';
import {AGENT_INFO_FIELDS, AuthService} from '../auth/auth.service';
import {AUTH_REQUIRED} from '../services/token-interceptor/http-client-interceptor.service';
import {AtvLs0000M1xComponent} from './footer-template/atv-ls0000-m1x/atv-ls0000-m1x.component';
import {MediaService} from '../create-ad/media/media.service';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  private scaleChange: BehaviorSubject<number> = new BehaviorSubject<number>(1);

  constructor(private http: HttpClient,
              private authService: AuthService,
              private mediaService: MediaService,
              private logger: NGXLogger) { }
  getAllTemplates(): Observable<TemplateItem[]> {
    const templates: TemplateItem[] = [];
    const defaultOfficeLogoUrl = 'https://cdn.cmcd1.com/alm/assets/images/bhhs_global_white.png';
    const defaultMaxlength = {
      headlineText: 33,
      website: 62,
      phone: 24,
    };
    const defaultVisibility = {
      email: false,
      agentName: false
    };
    const defaultFontSizeFactor = {
      agentDetails: {max: 64, min: 54},
      headlineText: {max: 38, min: 28}
    };

    let officeLogoMap = [
      {templateId:'atv-ls0000-m1x', logoUrl:'https://cdn.cmcd1.com/alm/assets/images/bhhs_global_white.png'},
      {templateId:'atv-ls0001-m1x', logoUrl:'https://cdn.cmcd1.com/alm/assets/images/bhhs_global_white.png'},
      {templateId:'atv-ls0002-m1x', logoUrl:'https://cdn.cmcd1.com/alm/assets/images/bhhs_global_white.png'},
      {templateId:'atv-ls0003-m1x', logoUrl:'https://cdn.cmcd1.com/alm/assets/images/bhhs_global_white.png'}
    ];

//       let tempObj = officeLogoMap[0];
//       let logoUrl : string;
//       let data = this.mediaService.getOfficeLogoV1(tempObj.templateId);
//       data.subscribe((data: any) => {
//           this.logger.info("Response got ["+JSON.stringify(data)+"]");
//           officeLogoMap[0].logoUrl = data;
//           templates[0]['data'].officeLogoUrl = data;
//       });
//
//       tempObj = officeLogoMap[1];
//       data = this.mediaService.getOfficeLogoV1(tempObj.templateId);
//       data.subscribe((data: any) => {
//           this.logger.info("Response got ["+JSON.stringify(data)+"]");
//           officeLogoMap[1].logoUrl = data;
//           templates[1]['data'].officeLogoUrl = data;
//       });
//
//       tempObj = officeLogoMap[2];
//       data = this.mediaService.getOfficeLogoV1(tempObj.templateId);
//       data.subscribe((data: any) => {
//           this.logger.info("Response got ["+JSON.stringify(data)+"]");
//           officeLogoMap[2].logoUrl = data;
//           templates[2]['data'].officeLogoUrl = data;
//       });
//       tempObj = officeLogoMap[3];
//       data = this.mediaService.getOfficeLogoV1(tempObj.templateId);
//       data.subscribe((data: any) => {
//           this.logger.info("Response got ["+JSON.stringify(data)+"]");
//           officeLogoMap[3].logoUrl = data;
//           templates[3]['data'].officeLogoUrl = data;
//       });
    templates.push(new TemplateItem(AtvLs0000M1xComponent, {
      templateId: 'atv-ls0000',
      headlineText: 'To find your dream home call today.',
      officeLogoUrl: officeLogoMap[0].logoUrl,
      fontSizeFactorConfig: {...defaultFontSizeFactor, agentDetails: { max: 38, min: 38}},
      fontSizeFactor: {agentDetails: 38, headlineText: 38},
      scaleFactor: 1,
      visibility: {...defaultVisibility, website: false, email: false, agentName: true},
      maxlength: {...defaultMaxlength, headlineText: 43}
    }));
    templates.push(new TemplateItem(AtvLs0001M1xComponent, {
      templateId: 'atv-ls0001',
      headlineText: 'Be known for the company you keep',
      officeLogoUrl: officeLogoMap[1].logoUrl,
      fontSizeFactorConfig: {...defaultFontSizeFactor, headlineText: {max: 32, min: 22}, agentDetails: {max: 50, min: 40}},
      fontSizeFactor: {agentDetails: 40, headlineText: 32},
      scaleFactor: 1,
      visibility: defaultVisibility,
      maxlength: defaultMaxlength
    }));
    templates.push(new TemplateItem(AtvLs0002M1xComponent, {
      templateId: 'atv-ls0002',
      headlineText: 'Put the berkshire hathaway homeservices name behind yours',
      officeLogoUrl: officeLogoMap[2].logoUrl,
      fontSizeFactorConfig: {...defaultFontSizeFactor, headlineText: {max: 45, min: 26}, agentDetails: {max: 62, min: 52}},
      fontSizeFactor: {agentDetails: 54, headlineText: 50},
      scaleFactor: 1,
      visibility: {...defaultVisibility , email: true, website: false},
      maxlength: {...defaultMaxlength , headlineText: 57, email: 62}
    }));
    templates.push(new TemplateItem(AtvLs0003M1xComponent, {
      templateId: 'atv-ls0003',
      headlineText: 'Relationships over transactions',
      officeLogoUrl: officeLogoMap[3].logoUrl,
      fontSizeFactorConfig: {...defaultFontSizeFactor, headlineText: {max: 32, min: 22}, agentDetails: {max: 64, min: 54}},
      fontSizeFactor: {agentDetails: 54, headlineText: 38},
      scaleFactor: 1,
      visibility: {...defaultVisibility , email: true, website: false},
      maxlength: {...defaultMaxlength , headlineText: 31, email: 62}
    }));
    return Observable.of(templates);
  }


  onScaleChange(){
    return this.scaleChange.asObservable();
  }

  notifyScaleChange(scale: number) {
    this.scaleChange.next(scale);
  }

  uploadCreative(data: TemplateData, logoUrl='https://cdn.cmcd1.com/alm/assets/images/bhhs_global_white.png') {
    const templateData = {... data, scaleFactor: 1, officeLogoUrl: logoUrl};
    return this.http.post<any>(`/api/creatives?templateId=${templateData.templateId}&size=m1x`, {
      templateData,
      agentId: this.authService.getAgentInfo(AGENT_INFO_FIELDS.AGENT_ID)
    });
  }

  parseTemplateDataUrl(s3Url: string) {
    if (typeof s3Url !== 'undefined' && s3Url.trim() !== '') {
      return this.http.get<TemplateItem>(`/api/readJsonUrl`, {
        context: new HttpContext().set(AUTH_REQUIRED, false),
        params: {jsonUrl: s3Url}
      }).catch(error => {
        this.logger.error(error.error || error.message);
        return Observable.of({} as TemplateItem);
      });
    } else {
      return Observable.of({} as TemplateItem);
    }
  }

}
