import {AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {AnalyticsService, LocationStats} from '../analytics.service';

@Component({
  selector: 'app-analytics-reach',
  templateUrl: './analytics-reach.component.html',
  styleUrls: ['./analytics-reach.component.css']
})
export class AnalyticsReachComponent implements OnInit, AfterViewInit {
  @Input() locationStats: Array<LocationStats>;
  @ViewChild('mapContainer') mapContainer: ElementRef;

  private mapObj: any;
  private reachMap: any;

  constructor(private analyticsService: AnalyticsService, ) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.mapObj = this.analyticsService.initGoogleMap(this.mapContainer.nativeElement);
    if (this.reachMap) {
      this.reachMap.impressionReachData.setMap(null);
      this.reachMap.clicksReachData.setMap(null);
    }
    this.reachMap = this.analyticsService.getReachMapLayer(this.locationStats);
    if (this.reachMap) {
      this.reachMap.impressionReachData.setMap(this.mapObj);
      this.reachMap.clicksReachData.setMap(this.mapObj);
      this.mapObj.fitBounds(this.reachMap.impressionBounds);
    }
  }

}
