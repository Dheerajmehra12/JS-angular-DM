import {Directive, ViewContainerRef} from '@angular/core';

@Directive({
  selector: '[appTemplateHost]'
})
export class TemplateHostDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }

}
