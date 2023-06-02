import {Component, Input, OnInit} from '@angular/core';
import {
  getDeviceStatsLabel,
  DeviceStatsRecord,
  ALL_STATS_DEVICES,
  DailyStats,
  StatsRecord,
  LocationStats, BarChartType, HeatMapType
} from '../analytics.service';
import { TranslateService } from '../../../services/translate';

@Component({
  selector: 'app-analytics-dashboard',
  templateUrl: './analytics-dashboard.component.html',
  styleUrls: ['./analytics-dashboard.component.css']
})
export class AnalyticsDashboardComponent implements OnInit {
  @Input() deviceStats: DeviceStatsRecord;
  @Input() dailyStats: Array<DailyStats>;
  @Input() overallStats: StatsRecord;
  @Input() locationStats: Array<LocationStats>;

  constructor(private _translate: TranslateService) { }

  ngOnInit(): void {
    this._translate.use(localStorage.getItem('language'));
  }

  get allDevices() {
    return ALL_STATS_DEVICES;
  }

  get barChartType() {
    return BarChartType;
  }

  get heatMapTypes() {
    return HeatMapType;
  }

  getLabelForDeviceName(device: string) {
    return getDeviceStatsLabel(device);
  }

}
