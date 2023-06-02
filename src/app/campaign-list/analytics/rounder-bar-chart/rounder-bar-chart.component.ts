import {AfterViewInit, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {ChartHelper} from '../chart-helper';
import {BarChartType, DailyStats} from '../analytics.service';
import {NGXLogger} from 'ngx-logger';

@Component({
  selector: 'app-rounder-bar-chart',
  templateUrl: './rounder-bar-chart.component.html',
  styleUrls: ['./rounder-bar-chart.component.css']
})
export class RounderBarChartComponent implements OnInit, AfterViewInit {
  @Input() chartTitle: string;
  @Input() canvasElementId: string;
  @Input() barChartColor: string;
  @Input() chartData: Array<DailyStats>;
  @Input() chartType: BarChartType;
  @ViewChild('chartCanvas') chartCanvas: ElementRef<HTMLCanvasElement>;
  private roundedBarChartObj: any;
  constructor(private logger: NGXLogger, private chartHelper: ChartHelper) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    const ctx: any = this.chartCanvas.nativeElement.getContext('2d');
    this.roundedBarChartObj = this.chartHelper.createRounderBarChart(ctx);
    this.logger.info(Object.values(BarChartType)[this.chartType], ' chartData = ', this.chartData);
    this.chartHelper.updateRoundedBarChartData(this.roundedBarChartObj,
      { backgroundColor: this.barChartColor }, this.chartData, this.chartType);
  }

}
