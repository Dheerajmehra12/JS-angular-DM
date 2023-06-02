import {AfterViewInit, Component, ElementRef, Inject, Input, OnInit, ViewChild} from '@angular/core';
import {AnalyticsService, HeatMapType, LocationStats} from '../analytics.service';
import {NGXLogger} from 'ngx-logger';
import {DOCUMENT} from '@angular/common';
import { TranslateService } from '../../../services/translate';

@Component({
  selector: 'app-views-clicks-map',
  templateUrl: './views-clicks-map.component.html',
  styleUrls: ['./views-clicks-map.component.css']
})
export class ViewsClicksMapComponent implements OnInit, AfterViewInit {
  @Input() mapTitle: string;
  @Input() mapContainerId: string;
  @Input() mapData: Array<LocationStats>;
  @Input() mapType: HeatMapType;

  @ViewChild('mapContainer') mapContainer: ElementRef;

  private mapObj: any;
  private heatMap: any;
  private heatMapData: any;

  constructor(private analyticsService: AnalyticsService,
              private logger: NGXLogger,
              private _translate: TranslateService,
              @Inject(DOCUMENT) private document: Document, ) { }

  ngOnInit(): void {
    this._translate.use(localStorage.getItem('language'));
  }

  ngAfterViewInit(): void {
    this.mapObj = this.analyticsService.initGoogleMap(this.mapContainer.nativeElement);
    if (this.heatMap) {
      this.heatMap.setMap(null);
    }
    this.heatMapData = this.analyticsService.covertToHeatMapData(this.mapData);
    if (this.mapType === HeatMapType.IMPRESSIONS) {
      this.heatMap = this.analyticsService.getImpressionHeatMapLayer(this.heatMapData);
      if (this.heatMap) {
        this.heatMap.setMap(this.mapObj);
        this.mapObj.fitBounds(this.heatMapData.impressionBounds);
      }
    }
    if (this.mapType === HeatMapType.CLICKS) {
      this.heatMap = this.analyticsService.getClicksHeatMapLayer(this.heatMapData);
      if (this.heatMap) {
        this.heatMap.setMap(this.mapObj);
        this.mapObj.fitBounds(this.heatMapData.clicksBounds);
      }
    }
  }
}
