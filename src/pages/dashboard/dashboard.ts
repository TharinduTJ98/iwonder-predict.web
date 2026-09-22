import { ChangeDetectorRef, Component, HostListener, inject, OnInit, signal } from '@angular/core';
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

type ChartMetric = 'quotes' | 'premium';

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
    chartMetric: ChartMetric = 'quotes';
    forecastThisYear: Forecast[] = [];
    forecastLastYear: Forecast[] = [];
    availableYears: number[] = [];
    
    // Selected filters
    selectedProducts: string[] = [];
    selectedPanels: string[] = [];
    openDropdown: 'product' | 'panel' | null = null;
    isLoading = signal(false);
    
    // Filter options
    products = ['Breakdown', 'Motorbike', 'Cycle', 'Gap'];
    panels = ['Confused.com', 'GoCompare', 'InsuranceCloude', 'Comparethemarket'];
    
    // Metric cards
    metricCards: MetricCard[] = [];
    private allMetricCards: MetricCard[] = [];
    
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
        custom: (options: any) => this.buildChartTooltip(options)
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
        
        this.cdr.detectChanges();
    }

    selectProduct(product: string) {
        this.selectedProducts = [product];
        this.openDropdown = null;
        this.loadComparisonData();
        this.cdr.detectChanges();
    }

    selectPanel(panel: string) {
        this.selectedPanels = [panel];
        this.openDropdown = null;
        this.loadComparisonData();
        this.cdr.detectChanges();
    }

    toggleDropdown(dropdown: 'product' | 'panel') {
        this.openDropdown = this.openDropdown === dropdown ? null : dropdown;
    }

    @HostListener('document:click', ['$event'])
    closeDropdowns(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest('.multi-select')) {
            this.openDropdown = null;
        }
    }

    resetFilters() {
        this.selectedProducts = [];
        this.selectedPanels = [];
        this.openDropdown = null;
        this.loadComparisonData();
    }

    onPredictionTypeChange() {
        this.loadComparisonData();
    }

    onComparisonModeChange() {
        this.loadComparisonData();
    }

    onChartMetricChange(metric: ChartMetric) {
        this.chartMetric = metric;
        this.applyMetricCardSelection();
        this.updateChartSeries(this.forecastThisYear, this.forecastLastYear);
    }

    private applyMetricCardSelection() {
        const premiumSelected = this.chartMetric === 'premium';
        this.metricCards = this.allMetricCards.filter(metric =>
            premiumSelected ? metric.label.includes('Premium') : !metric.label.includes('Premium')
        );
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

    private buildChartTooltip(options: any): string {
        const dataPointIndex = options.dataPointIndex as number;
        const categories = options.w.globals.categoryLabels as string[];
        const category = categories?.[dataPointIndex] ?? '';
        const series = options.w.globals.series as Array<Array<number | null>>;
        const isComparison = this.comparisonMode === 'compare';
        const predictedThisYear = series[0]?.[dataPointIndex];
        const actualThisYear = series[1]?.[dataPointIndex];
        const predictedLastYear = isComparison ? series[2]?.[dataPointIndex] : null;
        const actualLastYear = isComparison ? series[3]?.[dataPointIndex] : null;

        const metricLabel = this.chartMetric === 'premium' ? 'PREMIUM' : 'QUOTES';

        return `
            <div class="forecast-tooltip">
                <div class="forecast-tooltip-title">${this.formatTooltipDate(category)}</div>
                ${this.buildTooltipMetric(
                    `PREDICTED ${metricLabel}`,
                    '#1f77b4',
                    predictedThisYear,
                    predictedLastYear,
                    isComparison ? 'vs prior year' : 'current forecast'
                )}
                ${this.buildTooltipMetric(
                    `ACTUAL ${metricLabel}`,
                    '#ff7f0e',
                    actualThisYear,
                    actualLastYear,
                    isComparison ? 'vs prior year' : 'vs forecast'
                )}
            </div>
        `;
    }

    private buildTooltipMetric(
        label: string,
        color: string,
        currentValue: number | null | undefined,
        priorValue: number | null | undefined,
        changeLabel: string
    ): string {
        const change = currentValue != null && priorValue != null && priorValue !== 0
            ? ((currentValue - priorValue) / priorValue) * 100
            : null;
        const changeClass = change != null && change >= 0 ? 'positive' : 'negative';
        const changeIcon = change != null && change >= 0 ? '↗' : '↘';
        const priorRow = priorValue != null
            ? `<div class="forecast-tooltip-row"><span>LY: </span><strong>${this.formatTooltipValue(priorValue)}</strong></div>`
            : '';
        const changeRow = change != null
            ? `<div class="forecast-tooltip-change ${changeClass}">${changeIcon} ${Math.abs(change).toFixed(2)}% <span>${changeLabel}</span></div>`
            : '';

        return `
            <div class="forecast-tooltip-metric">
                <div class="forecast-tooltip-label"><span class="forecast-tooltip-dot" style="background:${color}"></span>${label}</div>
                <div class="forecast-tooltip-row"><span>TY: </span><strong>${this.formatTooltipValue(currentValue)}</strong></div>
                ${priorRow}
                ${changeRow}
            </div>
        `;
    }

    private formatTooltipValue(value: number | null | undefined): string {
        return value == null
            ? '—'
            : `${this.chartMetric === 'premium' ? '£' : ''}${Math.round(value).toLocaleString('en-GB')}`;
    }

    private formatTooltipDate(category: string): string {
        if (!category) {
            return '';
        }

        return this.selectedPredictionType === 'W'
            ? `${category}, ${this.currentYear}`
            : `${category} ${this.currentYear}`;
    }

    loadComparisonData() {
        if (this.selectedProducts.length === 0 || this.selectedPanels.length === 0) {
            this.isLoading.set(false);
            this.forecastThisYear = [];
            this.forecastLastYear = [];
            this.metricCards = [];
            this.chartSeries = [];
            this.xaxis = { ...this.xaxis, categories: [] };
            this.cdr.detectChanges();
            return;
        }

        this.isLoading.set(true);
        if (this.comparisonMode === 'compare') {
            this.loadYearComparison();
        } else {
            this.loadSingleYear();
        }
    }

    loadYearComparison() {
        const comparisonRequest = this.service.getFutureForecast(
            this.currentYear,
            this.lastYear,
            this.selectedPanels[0],
            this.selectedProducts[0],
            this.selectedPredictionType
        );

        comparisonRequest.subscribe(
            result => {
                this.forecastThisYear = result.year1;
                this.forecastLastYear = result.year2;

                this.updateMetricsForComparison(result.year1, result.year2);

                const axisLabels = this.getSharedAxisLabels(result.year1, result.year2);

                this.updateChartSeries(result.year1, result.year2, axisLabels);

                this.xaxis = {
                    ...this.xaxis,
                    type: 'category',
                    categories: axisLabels.map(label => label)
                };

                this.isLoading.set(false);
            },
            error => {
                console.error('Error loading comparison data:', error);
                this.isLoading.set(false);
            }
        );
    }

    loadSingleYear() {
        this.service.getForecastByYear(this.currentYear, this.selectedPanels[0], this.selectedProducts[0], this.selectedPredictionType).subscribe(
            result => {
                this.forecastThisYear = result;
                this.forecastLastYear = [];

                this.updateMetricsForSingleYear(result);

                const axisLabels = this.getSingleYearAxisLabels(result);

                this.updateChartSeries(result, [], axisLabels);

                this.xaxis = {
                    ...this.xaxis,
                    type: 'category',
                    categories: axisLabels.map(label => label)
                };

                this.isLoading.set(false);
            },
            error => {
                console.error('Error loading single year data:', error);
                this.isLoading.set(false);
            }
        );
    }

    private updateChartSeries(dataThisYear: Forecast[], dataLastYear: Forecast[], axisLabels?: string[]) {
        const labels = axisLabels ?? (this.comparisonMode === 'compare'
            ? this.getSharedAxisLabels(dataThisYear, dataLastYear)
            : this.getSingleYearAxisLabels(dataThisYear));
        const isPremium = this.chartMetric === 'premium';
        const metricLabel = isPremium ? 'Premium' : 'Quotes';
        const predictedValue = (item: Forecast) => isPremium ? item.predictedPremiumGbp : item.predictedQuotes;
        const actualValue = (item: Forecast) => isPremium ? item.actualPremiumGbp : item.actualQuotes;

        this.chartSeries = [
            {
                name: `Predicted ${metricLabel} ${this.currentYear}`,
                data: this.getAlignedSeriesData(dataThisYear, labels, x => Math.round(predictedValue(x)))
            },
            {
                name: `Actual ${metricLabel} ${this.currentYear}`,
                data: this.getAlignedSeriesData(dataThisYear, labels, x => Math.round(actualValue(x) || 0))
            },
            ...(this.comparisonMode === 'compare' ? [
                {
                    name: `Predicted ${metricLabel} ${this.lastYear}`,
                    data: this.getAlignedSeriesData(dataLastYear, labels, x => Math.round(predictedValue(x)))
                },
                {
                    name: `Actual ${metricLabel} ${this.lastYear}`,
                    data: this.getAlignedSeriesData(dataLastYear, labels, x => Math.round(actualValue(x) || 0))
                }
            ] : [])
        ];
    }

    updateMetricsForComparison(dataThisYear: Forecast[], dataLastYear: Forecast[]) {
        const totalThisYear = dataThisYear.reduce((a, b) => a + b.predictedQuotes, 0);
        const totalLastYear = dataLastYear.reduce((a, b) => a + b.predictedQuotes, 0);
        const actualThisYear = dataThisYear.reduce((a, b) => a + (b.actualQuotes || 0), 0);
        const actualLastYear = dataLastYear.reduce((a, b) => a + (b.actualQuotes || 0), 0);
        const totalPremiumThisYear = dataThisYear.reduce((a, b) => a + b.predictedPremiumGbp, 0);
        const totalPremiumLastYear = dataLastYear.reduce((a, b) => a + b.predictedPremiumGbp, 0);
        const actualPremiumThisYear = dataThisYear.reduce((a, b) => a + (b.actualPremiumGbp || 0), 0);
        const actualPremiumLastYear = dataLastYear.reduce((a, b) => a + (b.actualPremiumGbp || 0), 0);

        const percentChangeTotal = this.getPercentChange(totalThisYear, totalLastYear);
        const percentChangeActual = this.getPercentChange(actualThisYear, actualLastYear);

        const today = new Date();
        const currentYear = today.getFullYear();
        const nextMonth = today.getMonth() + 2; 

        const nextMonthQuote = dataThisYear.find(data => {
            const forecastDate = new Date(data.forecastDate);

            return (
                forecastDate.getFullYear() === currentYear &&
                forecastDate.getMonth() + 1 === nextMonth
            );
        });

        const lastYearMonthQuote = dataLastYear.find(data => {
            const forecastDate = new Date(data.forecastDate);

            return (
                forecastDate.getFullYear() === currentYear - 1 &&
                forecastDate.getMonth() + 1 === nextMonth
            );
        });

        const thisYearQuotes = nextMonthQuote?.predictedQuotes ?? 0;
        const lastYearQuotes = lastYearMonthQuote?.predictedQuotes ?? 0;
        const thisYearPremium = nextMonthQuote?.predictedPremiumGbp ?? 0;
        const lastYearPremium = lastYearMonthQuote?.predictedPremiumGbp ?? 0;

        const growthPercentage = this.getPercentChange(thisYearQuotes, lastYearQuotes);
        const premiumGrowthPercentage = this.getPercentChange(thisYearPremium, lastYearPremium);

        this.totalPrediction = totalThisYear + totalLastYear;
        const nextMonthDate = new Date(
            currentYear,
            new Date().getMonth() + 1,
            1
        );

        const nextMonthName = nextMonthDate.toLocaleString('default', {
            month: 'long'
        });
        this.allMetricCards = [
            {
                label: `${nextMonthName} Quote Growth (%)`,
                value: nextMonthQuote?.predictedQuotes ?? 0,
                changePercent: growthPercentage,
                priorValue: lastYearMonthQuote?.predictedQuotes ?? 0,
                trend: growthPercentage >= 0 ? 'up' : 'down'
            },
            {
                label: `${nextMonthName} Premium Growth (%)`,
                value: this.formatCurrency(thisYearPremium),
                changePercent: premiumGrowthPercentage,
                priorValue: this.formatCurrency(lastYearPremium),
                trend: premiumGrowthPercentage >= 0 ? 'up' : 'down'
            },
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
                label: 'Avg. Predicted Quotes',
                value: (totalThisYear / dataThisYear.length).toFixed(0),
                changePercent: this.getPercentChange(totalThisYear / dataThisYear.length, totalLastYear / dataLastYear.length),
                priorValue: (totalLastYear / dataLastYear.length).toFixed(0),
                trend: (totalThisYear / dataThisYear.length) >= (totalLastYear / dataLastYear.length) ? 'up' : 'down'
            },
            {
                label: 'Total Predicted Premium',
                value: this.formatCurrency(totalPremiumThisYear),
                changePercent: this.getPercentChange(totalPremiumThisYear, totalPremiumLastYear),
                priorValue: this.formatCurrency(totalPremiumLastYear),
                trend: totalPremiumThisYear >= totalPremiumLastYear ? 'up' : 'down'
            },
            {
                label: 'Total Actual Premium',
                value: this.formatCurrency(actualPremiumThisYear),
                changePercent: this.getPercentChange(actualPremiumThisYear, actualPremiumLastYear),
                priorValue: this.formatCurrency(actualPremiumLastYear),
                trend: actualPremiumThisYear >= actualPremiumLastYear ? 'up' : 'down'
            },
            {
                label: 'Avg. Predicted Premium',
                value: this.formatCurrency(totalPremiumThisYear / dataThisYear.length),
                changePercent: this.getPercentChange(totalPremiumThisYear / dataThisYear.length, totalPremiumLastYear / dataLastYear.length),
                priorValue: this.formatCurrency(totalPremiumLastYear / dataLastYear.length),
                trend: totalPremiumThisYear >= totalPremiumLastYear ? 'up' : 'down'
            }
        ];
        this.applyMetricCardSelection();
    }

    updateMetricsForSingleYear(data: Forecast[]) {
        const totalThisYear = data.reduce((a, b) => a + b.predictedQuotes, 0);
        const actualThisYear = data.reduce((a, b) => a + (b.actualQuotes || 0), 0);
        const totalPremiumThisYear = data.reduce((a, b) => a + b.predictedPremiumGbp, 0);
        const actualPremiumThisYear = data.reduce((a, b) => a + (b.actualPremiumGbp || 0), 0);
        
        const accuracyThisYear = data.length > 0 ? (actualThisYear / totalThisYear) * 100 : 0;

        this.totalPrediction = totalThisYear;
        const today = new Date();
        const currentYear = today.getFullYear();
        const nextMonth = today.getMonth() + 2; 

        const nextMonthQuote = data.find(data => {
            const forecastDate = new Date(data.forecastDate);

            return (
                forecastDate.getFullYear() === currentYear &&
                forecastDate.getMonth() + 1 === nextMonth
            );
        });
        const nextMonthDate = new Date(
            currentYear,
            new Date().getMonth() + 1,
            1
        );

        const nextMonthName = nextMonthDate.toLocaleString('default', {
            month: 'long'
        });
        this.allMetricCards = [
            {
                label: `${nextMonthName} Quote Growth`,
                value: nextMonthQuote?.predictedQuotes ?? 0,
                changePercent: undefined,
                priorValue: undefined,
                trend: 'neutral'
            },
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
                label: 'Avg. Predicted Quotes',
                value: data.length > 0 ? (totalThisYear / data.length).toFixed(0) : '0',
                changePercent: undefined,
                priorValue: undefined,
                trend: 'neutral'
            },
            {
                label: 'Total Predicted Premium',
                value: this.formatCurrency(totalPremiumThisYear),
                trend: 'neutral'
            },
            {
                label: 'Total Actual Premium',
                value: this.formatCurrency(actualPremiumThisYear),
                trend: 'neutral'
            },
            {
                label: 'Avg. Predicted Premium',
                value: this.formatCurrency(data.length > 0 ? totalPremiumThisYear / data.length : 0),
                trend: 'neutral'
            }
        ];
        this.applyMetricCardSelection();
    }

    private getPercentChange(current: number, prior: number): number {
        return prior !== 0 ? ((current - prior) / prior) * 100 : 0;
    }

    private formatCurrency(value: number): string {
        return `£${Math.round(value).toLocaleString('en-GB')}`;
    }
}
