import {Component, Input} from '@angular/core';
import {TemplateComponent, TemplateData} from '../../template-component';

@Component({
  selector: 'app-atv-ls0002-m1x',
  templateUrl: './atv-ls0002-m1x.component.html',
  styleUrls: ['./atv-ls0002-m1x.component.css']
})
export class AtvLs0002M1xComponent implements TemplateComponent {

  constructor() { }

  @Input() data: TemplateData;

}
