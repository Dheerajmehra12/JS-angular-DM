import { Component, OnInit } from '@angular/core';
import {NGXLogger} from 'ngx-logger';
import {Router} from '@angular/router';
@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html'
})
export class FooterComponent implements OnInit {
  currentUrl: string;

  constructor(private logger: NGXLogger, private router: Router) { }

  ngOnInit() {
    this.currentUrl = this.router.url;
  }

  contactUs() {
  }

}
