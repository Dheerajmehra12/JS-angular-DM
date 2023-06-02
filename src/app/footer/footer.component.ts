import { Component, OnInit } from '@angular/core';
import {NGXLogger} from 'ngx-logger';
import {Router} from '@angular/router';
import { TranslateService } from '../services/translate';
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html'
})
export class FooterComponent implements OnInit {
  currentUrl: string;

  constructor(private logger: NGXLogger, private router: Router,private _translate: TranslateService) { }

  ngOnInit() {
    this._translate.use(localStorage.getItem('language'));
    this.currentUrl = this.router.url;
  }

  contactUs() {
  }

}
