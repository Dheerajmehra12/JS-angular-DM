import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import {NGXLogger} from 'ngx-logger';
import {TemplateItem} from '../../template/template-component';
import { TranslateService } from '../../services/translate';

@Component({
  selector: 'app-player',
  templateUrl: './player.component.html',
  styleUrls: ['./player.component.css']
})
export class PlayerComponent implements OnInit, OnChanges {
  videoLoading = true;

  @Input() videoUrl: string;
  @Input() footerBannerUrl: string;
  @Input() showFooterBanner = true;

  @Input() useHtml = false;
  @Input() bannerTemplate: TemplateItem;

  @ViewChild('videoElement') videoElement: ElementRef;
  @ViewChild('playBtn') playBtn: ElementRef;
  @ViewChild('pauseBtn') pauseBtn: ElementRef;
  @ViewChild('footerBanner') footerBanner: ElementRef;
  constructor(private logger: NGXLogger,private _translate: TranslateService) { }

  ngOnInit(): void {
    this._translate.use(localStorage.getItem('language'));
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.logger.debug('ngOnChanges(PlayerComponent) = ', changes);
    if (changes.hasOwnProperty('videoUrl')) {
      if (this.videoElement) {
        if (this.playBtn) {
          this.playBtn.nativeElement.style.display = 'inline';
        }
        if (this.pauseBtn) {
          this.pauseBtn.nativeElement.style.display = 'none';
        }
        if (this.showFooterBanner && this.footerBanner) {
          this.footerBanner.nativeElement.style.display = 'inline';
        }
        this.videoElement.nativeElement.load();
        this.onVideoLoadStart();
      }
    }
  }

  playVideo(){
    if (this.videoElement) {
      if (this.playBtn) {
        this.playBtn.nativeElement.style.display = 'none';
      }
      if (this.pauseBtn) {
        this.pauseBtn.nativeElement.style.display = 'inline';
      }
      if (this.showFooterBanner && this.footerBanner) {
        this.footerBanner.nativeElement.style.display = 'inline';
      }
      this.videoElement.nativeElement.play();
    }
  }

  onVideoEnd() {
    if (this.playBtn) {
      this.playBtn.nativeElement.style.display = 'inline';
    }
    if (this.pauseBtn) {
      this.pauseBtn.nativeElement.style.display = 'none';
    }
    if (this.showFooterBanner && this.footerBanner) {
      this.footerBanner.nativeElement.style.display = 'inline';
    }
  }

  pauseVideo(){
    if (this.videoElement) {
      this.videoElement.nativeElement.pause();
      if (this.playBtn) {
        this.playBtn.nativeElement.style.display = 'inline';
      }
      if (this.pauseBtn) {
        this.pauseBtn.nativeElement.style.display = 'none';
      }
      if (this.showFooterBanner && this.footerBanner) {
        this.footerBanner.nativeElement.style.display = 'inline';
      }
    }
  }

  onVideoLoadStart() {
    if (this.playBtn) {
      this.playBtn.nativeElement.style.display = 'none';
    }
    if (this.pauseBtn) {
      this.pauseBtn.nativeElement.style.display = 'none';
    }
    if (this.showFooterBanner && this.footerBanner) {
      this.footerBanner.nativeElement.style.display = 'none';
    }
    this.videoLoading = true;
  }

  onVideoLoadEnd() {
    if (this.playBtn) {
      this.playBtn.nativeElement.style.display = 'inline';
    }
    if (this.pauseBtn) {
      this.pauseBtn.nativeElement.style.display = 'none';
    }
    if (this.showFooterBanner && this.footerBanner) {
      this.footerBanner.nativeElement.style.display = 'inline';
    }
    this.videoLoading = false;
  }
}
