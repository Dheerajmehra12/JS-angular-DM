import {
  AfterViewInit,
  Component,
  ComponentFactoryResolver,
  Input, OnChanges, OnInit, SimpleChanges, ViewChild
} from '@angular/core';
import {TemplateComponent, TemplateItem} from '../template-component';
import {TemplateHostDirective} from '../template-host.directive';
import {combineLatest, Observable, throwError} from 'rxjs';
import {ActivatedRoute, ParamMap} from '@angular/router';
import {NGXLogger} from 'ngx-logger';
import {map, mergeMap} from 'rxjs/operators';
import {TemplateService} from '../template.service';

@Component({
  selector: 'app-footer-template',
  templateUrl: './footer-template.component.html',
  styleUrls: ['./footer-template.component.css']
})
export class FooterTemplateComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() template: TemplateItem;
  @ViewChild(TemplateHostDirective, {static: true}) templateContainerRef!: TemplateHostDirective;
  private viewInit = false;

  constructor(private componentFactoryResolver: ComponentFactoryResolver,
              private route: ActivatedRoute,
              private templateService: TemplateService,
              private logger: NGXLogger) { }

  ngAfterViewInit(): void {
        this.viewInit = true;
    }

  private safeLoadComponent(): void {
    if (typeof this.template !== 'undefined') {
      this.loadComponent();
    }
  }

  ngOnInit(): void {
    const ob$param = this.route.paramMap.pipe(map((params: ParamMap) => params.get('templateId')));
    const ob$queryParam = this.route.queryParamMap.pipe(map( queryParam => queryParam.get('data')));
    const ob$templateData = combineLatest([ob$param, ob$queryParam])
      .pipe(mergeMap(([templateId, templateData]) => {
        this.logger.info(`Request Data: [templateData = ${templateData}, templateId: ${templateId}]`);
        return this.templateService.getAllTemplates().pipe(mergeMap(templates => {
          const result = (typeof templateId !== 'undefined' && templateId !== null) ?
            templates.filter(template => template.data.templateId === templateId) : [];
          if (result.length > 0) {
            templateId = result[0].data.templateId;
            const template = result[0];
            let data = {};
            try {
              data = JSON.parse(templateData);
              template.data = {...template.data, ...data};
              ['email', 'website'].forEach( inputName => {
                const inputValue = template.data[inputName];
                const inputGroup = 'agentDetails';
                this.adjustFontSizeFactor(inputName, inputValue, inputGroup);
              });
              this.adjustFontSizeFactor('headlineText', template.data.headlineText, 'headlineText');
            }catch (e) {
              this.logger.warn(`Unable to parse templateData ${e.message}`);
            }
            return Observable.of(template);
            /*return this.templateService.parseTemplateDataUrl(templateData).pipe(map( data => {
              const template = result[0];
              if (typeof data !== 'undefined') {
                template.data = {...template.data, ...data};
              }
              return template;
            }));*/
          }else {
            return throwError(`Unable to load template configuration for templateId: ${templateId}`);
          }
        }));
    }));

    ob$templateData.finally(() => this.safeLoadComponent()).subscribe(template => {
      this.template = template;
      this.safeLoadComponent();
    }, error => {
      this.logger.warn(`warning: ${error}`);
    });
  }

  private adjustFontSizeFactor(inputName, inputValue, inputGroup) {
    if ( inputName && inputValue && inputGroup) {
      const maxLength = this.template.data.maxlength[inputName];
      const maxSize = this.template.data.fontSizeFactorConfig.inputGroup.max;
      const minSize = this.template.data.fontSizeFactorConfig.inputGroup.min;
      const currentCharCount = inputValue.length;
      const ratio = maxSize / maxLength;
      const size = currentCharCount * ratio;
      const finalSize = (size <= minSize) ? minSize : size;
      this.template.data.fontSizeFactor[inputGroup] = finalSize;
    }
  }

  loadComponent() {
    const viewContainerRef = this.templateContainerRef.viewContainerRef;
    viewContainerRef.clear();
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(this.template.component);
    const componentRef = viewContainerRef.createComponent<TemplateComponent>(componentFactory);
    componentRef.instance.data = this.template.data;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.viewInit) {
      this.safeLoadComponent();
    }
  }
}
