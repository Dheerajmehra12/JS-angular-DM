import {Component, Input} from '@angular/core';
import {TemplateComponent, TemplateData} from '../../template-component';

@Component({
  selector: 'app-atv-ls0003-m1x',
  templateUrl: './atv-ls0003-m1x.component.html',
  styleUrls: ['./atv-ls0003-m1x.component.css']
})
export class AtvLs0003M1xComponent implements TemplateComponent {

  constructor() { }

  @Input() data: TemplateData;

}
