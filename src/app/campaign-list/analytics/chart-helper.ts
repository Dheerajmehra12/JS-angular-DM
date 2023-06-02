import {BarChartType, DailyStats} from './analytics.service';
import {Injectable} from '@angular/core';
import * as moment from 'moment';

declare const Chart: any;

export function prepareChartJsHelpers() {
  const randomScalingFactor = () => {
    return (Math.random() > 0.5 ? 1.0 : 1.0) * Math.round(Math.random() * 100);
  };

  // draws a rectangle with a rounded top
  Chart.helpers.drawRoundedTopRectangle = (ctx, x, y, width, height, radius) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    // top right corner
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    // bottom right	corner
    ctx.lineTo(x + width, y + height);
    // bottom left corner
    ctx.lineTo(x, y + height);
    // top left
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  Chart.elements.RoundedTopRectangle = Chart.elements.Rectangle.extend({
    draw(){
      const ctx = this._chart.ctx;
      const vm = this._view;
      let left;
      let right;
      let top;
      let bottom;
      let signX;
      let signY;
      let borderSkipped;
      let borderWidth = vm.borderWidth;

      if (!vm.horizontal) {
        // bar
        left = vm.x - vm.width / 2;
        right = vm.x + vm.width / 2;
        top = vm.y;
        bottom = vm.base;
        signX = 1;
        signY = bottom > top ? 1 : -1;
        borderSkipped = vm.borderSkipped || 'bottom';
      } else {
        // horizontal bar
        left = vm.base;
        right = vm.x;
        top = vm.y - vm.height / 2;
        bottom = vm.y + vm.height / 2;
        signX = right > left ? 1 : -1;
        signY = 1;
        borderSkipped = vm.borderSkipped || 'left';
      }
      // Canvas doesn't allow us to stroke inside the width so we can
      // adjust the sizes to fit if we're setting a stroke on the line
      if (borderWidth) {
        // borderWidth shold be less than bar width and bar height.
        const barSize = Math.min(Math.abs(left - right), Math.abs(top - bottom));
        borderWidth = borderWidth > barSize ? barSize : borderWidth;
        const halfStroke = borderWidth / 2;
        // Adjust borderWidth when bar top position is near vm.base(zero).
        const borderLeft = left + (borderSkipped !== 'left' ? halfStroke * signX : 0);
        const borderRight = right + (borderSkipped !== 'right' ? -halfStroke * signX : 0);
        const borderTop = top + (borderSkipped !== 'top' ? halfStroke * signY : 0);
        const borderBottom = bottom + (borderSkipped !== 'bottom' ? -halfStroke * signY : 0);
        // not become a vertical line?
        if (borderLeft !== borderRight) {
          top = borderTop;
          bottom = borderBottom;
        }
        // not become a horizontal line?
        if (borderTop !== borderBottom) {
          left = borderLeft;
          right = borderRight;
        }
      }

      // calculate the bar width and roundess
      const barWidth = Math.abs(left - right);
      const roundness = this._chart.config.options.barRoundness || 0.5;
      const radius = barWidth * roundness * 0.5;

      // keep track of the original top of the bar
      const prevTop = top;

      // move the top down so there is room to draw the rounded top
      top = prevTop + radius;
      const barRadius = top - prevTop;

      ctx.beginPath();
      ctx.fillStyle = vm.backgroundColor;
      ctx.strokeStyle = vm.borderColor;
      ctx.lineWidth = borderWidth;

      // draw the rounded top rectangle
      Chart.helpers.drawRoundedTopRectangle(ctx, left, (top - barRadius + 1), barWidth, bottom - prevTop, barRadius);

      ctx.fill();
      if (borderWidth) {
        ctx.stroke();
      }

      // restore the original top value so tooltips and scales still work
      top = prevTop;
    },
  });
}

export function setupChartJsDefaults() {
  Chart.defaults.roundedBar = Chart.helpers.clone(Chart.defaults.bar);
  Chart.defaults.global.barShowStroke = true;
  Chart.defaults.global.defaultFontSize = 9;
  Chart.defaults.scale.gridLines.display = true;
  Chart.defaults.scale.gridLines.drawBorder = false;
  Chart.defaults.scale.ticks.display = true;
  Chart.defaults.scale.maxBarThickness = 80;
  Chart.defaults.global.legend.display = false;
  Chart.defaults.scale.ticks.beginAtZero = true;
  Chart.defaults.scale.ticks.autoSkip = false;
  Chart.defaults.scale.ticks.maxRotation = 0;
  Chart.defaults.global.tooltips.backgroundColor = 'rgba(0, 0, 0, 1)';
  Chart.controllers.roundedBar = Chart.controllers.bar.extend({
    dataElementType: Chart.elements.RoundedTopRectangle
  });
}

export function disableScaleTicksBeginAtZero() {
  Chart.defaults.scale.ticks.beginAtZero = false;
}

export interface RoundedBarChartDataSet {
  data: Array<number>;
  backgroundColor: Array<string>;
  borderWidth: number;
  [key: string]: any;
}

export interface RoundedBarChartData {
  labels: Array<string>;
  datasets: Array<RoundedBarChartDataSet>;
}

export interface StyleOptions {
  backgroundColor: string;
  borderWidth?: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class ChartHelper {
  constructor() {
  }

  createRounderBarChart(canvas2dContext, chartData: RoundedBarChartData = this.emptyRoundedBarChartDataCreator()) {
    prepareChartJsHelpers();
    setupChartJsDefaults();
    const chartObj =  new Chart(canvas2dContext, {
      type: 'roundedBar',
      data: chartData,
      options: {
        barRoundness: 0.4,
        animation: false
      }
    });
    disableScaleTicksBeginAtZero();
    return chartObj;
  }

  emptyRoundedBarChartDataCreator() {
    return {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [],
        borderWidth: 0
      }] as Array<RoundedBarChartDataSet>
    } as RoundedBarChartData;
  }

  updateRoundedBarChartData(chartObj: any, styleOptions: StyleOptions, dailyStats: Array<DailyStats>, chartType: BarChartType) {
    if (chartObj && chartObj.data && dailyStats && dailyStats.length > 0) {
      dailyStats.forEach((dataItem) => {
        const campMonth = moment(dataItem.date, 'YYYY-MM-DD').format('MMM');
        chartObj.data.labels.push(dataItem.daterange + ' ' + campMonth);
        chartObj.data.datasets.forEach((dataset) => {
          if (chartType === BarChartType.IMPRESSION) {
            dataset.data.push(dataItem.impressions);
          }
          if (chartType === BarChartType.CLICKS) {
            dataset.data.push(dataItem.clicks);
          }
          if (chartType === BarChartType.CTR) {
            dataset.data.push(dataItem.ctr);
          }
          dataset.backgroundColor.push(styleOptions.backgroundColor);
          dataset.borderWidth = styleOptions.borderWidth || 1;
          dataset.barThickness = styleOptions.barThickness || 'flex';
          dataset.categoryPercentage = styleOptions.categoryPercentage || 'flex';
        });
      });
      chartObj.update();
    }
  }
}
