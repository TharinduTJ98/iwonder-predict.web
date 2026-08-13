import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';
import {
    ApexAxisChartSeries,
    ApexChart,
    ApexFill,
    ApexLegend,
    ApexStroke,
    ApexTooltip,
    ApexXAxis,
    ChartComponent
} from 'ng-apexcharts';
import { ForecastService } from '../../services/forecast-service';
import { Forecast } from '../../models/forecast';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface MetricCard {
    label: string;
    value: string | number;
    changePercent?: number;
    priorValue?: string | number;
    trend?: 'up' | 'down' | 'neutral';
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, ChartComponent, FormsModule],
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit{
    constructor(private cdr: ChangeDetectorRef){

    }
    private service = inject(ForecastService);

    forecast: Forecast[] = [];
    totalPrediction = 0;
    chartSeries: ApexAxisChartSeries = [];
    
    // Filter properties
    currentYear: number = 0;
    lastYear: number = 0;
    selectedPredictionType: 'M' | 'W' = 'M';
    comparisonMode: 'compare' | 'single' = 'compare';
    forecastThisYear: Forecast[] = [];
    forecastLastYear: Forecast[] = [];
    availableYears: number[] = [];
    
    // Selected filters
    selectedProducts: string[] = [];
    selectedChannels: string[] = [];
    
    // Filter options
    products = ['Breakdown', 'Taxi', 'Tourer', 'Static'];
    channels = ['Confused.com', 'GoCompare', 'InsuranceCloud', 'Comparethemarket'];
    
    // Metric cards
    metricCards: MetricCard[] = [];
    
    // Chart colors configuration - customize line colors here
    chartColors = ['#1f77b4', '#aec7e8', '#ff7f0e', '#ffbb78'];

    chart: ApexChart = {
        type: 'line',
        height: 400,
        zoom: {
            enabled: true,
            type: 'x',
            autoScaleYaxis: true
        },
        toolbar: {
            show: true,
            tools: {
                download: true,
                selection: true,
                zoom: true,
                zoomin: true,
                zoomout: true,
                pan: true,
                reset: true
            },
            autoSelected: 'zoom'
        },
        sparkline: {
            enabled: false
        }
    };

    stroke: ApexStroke = {
        curve: 'smooth',
        width: [2, 2, 2, 2],
        dashArray: [0, 5, 0, 5]
    };

    fill: ApexFill = {
        type: 'solid',
        opacity: [1.8, 1.2, 1.8, 1.2]
    };

    legend: ApexLegend = {
        position: 'top',
        horizontalAlign: 'left'
    };

    tooltip: ApexTooltip = {
        shared: true,
        intersect: false,
        y: {
            formatter: (value: number) => value != null ? Math.round(value).toString() : ''
        }
    };

    xaxis: ApexXAxis = {
        type: 'category',
        categories: [],
        crosshairs: {
            show: true,
            width: 1,
            position: 'back'
        }
    };

    ngOnInit() {
        this.currentYear = this.service.getCurrentYear();
        this.lastYear = this.service.getLastYear();
        this.availableYears = [this.lastYear, this.currentYear];
        
        this.loadComparisonData();
        this.cdr.detectChanges();
    }

    toggleProduct(product: string) {
        const index = this.selectedProducts.indexOf(product);
        if (index > -1) {
            this.selectedProducts.splice(index, 1);
        } else {
            this.selectedProducts.push(product);
        }
        this.loadComparisonData();
    }

    toggleChannel(channel: string) {
        const index = this.selectedChannels.indexOf(channel);
        if (index > -1) {
            this.selectedChannels.splice(index, 1);
        } else {
            this.selectedChannels.push(channel);
        }
        this.loadComparisonData();
    }

    resetFilters() {
        this.selectedProducts = [];
        this.selectedChannels = [];
        this.loadComparisonData();
    }

    onPredictionTypeChange() {
        this.loadComparisonData();
    }

    onComparisonModeChange() {
        this.loadComparisonData();
    }

    // Helper function to get week number from date
    getWeekNumber(date: Date): number {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    }

    // Format x-axis label based on prediction type
    formatAxisLabel(dateString: string): string {
        const date = new Date(dateString);
        if (this.selectedPredictionType === 'W') {
            return `W${this.getWeekNumber(date).toString().padStart(2, '0')}`;
        }

        return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);   
    }

    private getAxisKey(dateString: string): string {
        const date = new Date(dateString);

        if (this.selectedPredictionType === 'W') {
            return `W${this.getWeekNumber(date).toString().padStart(2, '0')}`;
        }

        return new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date);
    }

    private getSharedAxisLabels(year1: Forecast[], year2: Forecast[]): string[] {
        const labels = Array.from(new Set([
            ...year1.map(x => this.getAxisKey(x.forecastDate)),
            ...year2.map(x => this.getAxisKey(x.forecastDate))
        ]));

        if (this.selectedPredictionType === 'W') {
            return labels.sort((a, b) => Number(a.replace('W', '')) - Number(b.replace('W', '')));
        }

        const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return labels.sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
    }

    private getSingleYearAxisLabels(data: Forecast[]): string[] {
        const labels = data.map(x => this.getAxisKey(x.forecastDate));

        if (this.selectedPredictionType === 'W') {
            return labels.sort((a, b) => Number(a.replace('W', '')) - Number(b.replace('W', '')));
        }

        const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return labels.sort((a, b) => monthOrder.indexOf(a) - monthOrder.indexOf(b));
    }

    private getAlignedSeriesData(data: Forecast[], axisLabels: string[], valueSelector: (item: Forecast) => number): Array<number | null> {
        const dataByAxisKey = new Map(data.map(item => [this.getAxisKey(item.forecastDate), valueSelector(item)]));

        return axisLabels.map(label => {
            const value = dataByAxisKey.get(label);
            return value !== undefined ? value : null;
        });
    }

    loadComparisonData() {
        if (this.comparisonMode === 'compare') {
            this.loadYearComparison();
        } else {
            this.loadSingleYear();
        }
    }

    loadYearComparison() {
        this.service.getForecastComparison(this.currentYear, this.lastYear, this.selectedPredictionType).subscribe(
            result => {
                this.forecastThisYear = result.year1;
                this.forecastLastYear = result.year2;

                this.updateMetricsForComparison(result.year1, result.year2);

                const axisLabels = this.getSharedAxisLabels(result.year1, result.year2);

                this.chartSeries = [
                    {
                        name: `Predicted Quotes ${this.currentYear}`,
                        data: this.getAlignedSeriesData(result.year1, axisLabels, x => Math.round(x.predictedQuotes))
                    },
                    {
                        name: `Actual Quotes ${this.currentYear}`,
                        data: this.getAlignedSeriesData(result.year1, axisLabels, x => Math.round(x.actualQuotes || 0))
                    },
                    {
                        name: `Predicted Quotes ${this.lastYear}`,
                        data: this.getAlignedSeriesData(result.year2, axisLabels, x => Math.round(x.predictedQuotes))
                    },
                    {
                        name: `Actual Quotes ${this.lastYear}`,
                        data: this.getAlignedSeriesData(result.year2, axisLabels, x => Math.round(x.actualQuotes || 0))
                    }
                ];

                this.xaxis = {
                    ...this.xaxis,
                    type: 'category',
                    categories: axisLabels.map(label => label)
                };

                this.cdr.detectChanges();
            },
            error => {
                console.error('Error loading comparison data:', error);
                this.cdr.detectChanges();
            }
        );
    }

    loadSingleYear() {
        this.service.getForecastByYear(this.currentYear, this.selectedPredictionType).subscribe(
            result => {
                this.forecastThisYear = result;
                this.forecastLastYear = [];

                this.updateMetricsForSingleYear(result);

                const axisLabels = this.getSingleYearAxisLabels(result);

                this.chartSeries = [
                    {
                        name: `Predicted Quotes ${this.currentYear}`,
                        data: this.getAlignedSeriesData(result, axisLabels, x => Math.round(x.predictedQuotes))
                    },
                    {
                        name: `Actual Quotes ${this.currentYear}`,
                        data: this.getAlignedSeriesData(result, axisLabels, x => Math.round(x.actualQuotes || 0))
                    }
                ];

                this.xaxis = {
                    ...this.xaxis,
                    type: 'category',
                    categories: axisLabels.map(label => label)
                };

                this.cdr.detectChanges();
            },
            error => {
                console.error('Error loading single year data:', error);
                this.cdr.detectChanges();
            }
        );
    }

    updateMetricsForComparison(dataThisYear: Forecast[], dataLastYear: Forecast[]) {
        const totalThisYear = dataThisYear.reduce((a, b) => a + b.predictedQuotes, 0);
        const totalLastYear = dataLastYear.reduce((a, b) => a + b.predictedQuotes, 0);
        const actualThisYear = dataThisYear.reduce((a, b) => a + (b.actualQuotes || 0), 0);
        const actualLastYear = dataLastYear.reduce((a, b) => a + (b.actualQuotes || 0), 0);
        const yearToDatePredictedQuotes = dataThisYear.filter(data => data.actualQuotes !== null) 
                                                    .reduce((a, b) => a + b.predictedQuotes, 0);

        const percentChangeTotal = ((totalThisYear - totalLastYear) / totalLastYear) * 100;
        const percentChangeActual = ((actualThisYear - actualLastYear) / actualLastYear) * 100;
        const accuracyThisYear = (actualThisYear / yearToDatePredictedQuotes) * 100;
        const accuracyLastYear = (actualLastYear / totalLastYear) * 100;
        const percentChangeAccuracy = accuracyThisYear - accuracyLastYear;

        this.totalPrediction = totalThisYear + totalLastYear;

        this.metricCards = [
            {
                label: 'Total Predicted Quotes',
                value: totalThisYear.toLocaleString(),
                changePercent: percentChangeTotal,
                priorValue: totalLastYear.toLocaleString(),
                trend: percentChangeTotal >= 0 ? 'up' : 'down'
            },
            {
                label: 'Total Actual Quotes',
                value: actualThisYear.toLocaleString(),
                changePercent: percentChangeActual,
                priorValue: actualLastYear.toLocaleString(),
                trend: percentChangeActual >= 0 ? 'up' : 'down'
            },
            {
                label: 'Accuracy Rate',
                value: accuracyThisYear.toFixed(1) + '%',
                changePercent: percentChangeAccuracy,
                priorValue: accuracyLastYear.toFixed(1) + '%',
                trend: percentChangeAccuracy >= 0 ? 'up' : 'down'
            },
            {
                label: 'Avg. Predicted Quotes',
                value: (totalThisYear / dataThisYear.length).toFixed(0),
                changePercent: ((totalThisYear / dataThisYear.length) - (totalLastYear / dataLastYear.length)) / (totalLastYear / dataLastYear.length) * 100,
                priorValue: (totalLastYear / dataLastYear.length).toFixed(0),
                trend: (totalThisYear / dataThisYear.length) >= (totalLastYear / dataLastYear.length) ? 'up' : 'down'
            }
        ];
    }

    updateMetricsForSingleYear(data: Forecast[]) {
        const totalThisYear = data.reduce((a, b) => a + b.predictedQuotes, 0);
        const actualThisYear = data.reduce((a, b) => a + (b.actualQuotes || 0), 0);
        
        const accuracyThisYear = data.length > 0 ? (actualThisYear / totalThisYear) * 100 : 0;

        this.totalPrediction = totalThisYear;

        this.metricCards = [
            {
                label: 'Total Predicted Quotes',
                value: totalThisYear.toLocaleString(),
                changePercent: undefined,
                priorValue: undefined,
                trend: 'neutral'
            },
            {
                label: 'Total Actual Quotes',
                value: actualThisYear.toLocaleString(),
                changePercent: undefined,
                priorValue: undefined,
                trend: 'neutral'
            },
            {
                label: 'Accuracy Rate',
                value: accuracyThisYear.toFixed(1) + '%',
                changePercent: undefined,
                priorValue: undefined,
                trend: 'neutral'
            },
            {
                label: 'Avg. Predicted Quotes',
                value: data.length > 0 ? (totalThisYear / data.length).toFixed(0) : '0',
                changePercent: undefined,
                priorValue: undefined,
                trend: 'neutral'
            }
        ];
    }
}
