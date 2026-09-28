import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Forecast } from '../../models/forecast';
import { ForecastService } from '../../services/forecast-service';

@Component({
    selector: 'app-panel-comparison',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './panel-comparison.html',
    styleUrl: './panel-comparison.css'
})
export class PanelComparison {
    private service = inject(ForecastService);

    readonly panels = ['Confused.com', 'GoCompare', 'InsuranceCloude', 'Comparethemarket'];
    readonly products = ['Breakdown', 'Motorbike', 'Cycle', 'Gap'];
    readonly currentYear = this.service.getCurrentYear();
    readonly lastYear = this.currentYear - 1;
    predictionType: 'M' | 'W' = 'M';
    selectedPanel = '';
    selectedProduct = '';
    selectedPeriod: number | null = null;
    periods: number[] = [];
    currentForecast: Forecast | undefined;
    priorForecast: Forecast | undefined;
    private currentYearData: Forecast[] = [];
    private lastYearData: Forecast[] = [];
    isLoading = signal(false);
    errorMessage = '';

    selectPanel(panel: string) {
        this.selectedPanel = panel;
        this.selectedProduct = '';
        this.clearComparison();
    }

    loadComparison() {
        if (!this.selectedPanel || !this.selectedProduct) {
            this.clearComparison();
            return;
        }

        this.isLoading.set(true);
        this.errorMessage = '';
        this.service.getFutureForecast(
            this.currentYear,
            this.lastYear,
            this.selectedPanel,
            this.selectedProduct,
            this.predictionType
        ).subscribe({
            next: result => {
                this.currentYearData = result.year1;
                this.lastYearData = result.year2;
                this.periods = this.getPeriods([...result.year1, ...result.year2]);
                if (!this.periods.includes(this.selectedPeriod ?? -1)) {
                    this.selectedPeriod = this.periods[0] ?? null;
                }
                this.updateSelectedPeriod();
                this.isLoading.set(false);
            },
            error: () => {
                this.currentYearData = [];
                this.lastYearData = [];
                this.periods = [];
                this.currentForecast = undefined;
                this.priorForecast = undefined;
                this.errorMessage = 'Forecast data could not be loaded. Please try again.';
                this.isLoading.set(false);
            }
        });
    }

    onPeriodChange() {
        this.updateSelectedPeriod();
    }

    formatPeriod(period: number): string {
        return this.predictionType === 'M'
            ? new Intl.DateTimeFormat('en-GB', { month: 'long' }).format(new Date(2020, period, 1))
            : `Week ${String(period).padStart(2, '0')}`;
    }

    get periodLabel(): string {
        return this.selectedPeriod === null ? '' : this.formatPeriod(this.selectedPeriod);
    }

    formatPounds(value: number | undefined): string {
        return value === undefined
            ? '—'
            : new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(value);
    }

    formatCount(value: number): string {
        return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 0 }).format(value);
    }

    percentageChange(current: number, prior: number): number | null {
        return prior === 0 ? null : ((current - prior) / Math.abs(prior)) * 100;
    }

    changeDirection(current: number, prior: number): 'up' | 'down' | 'neutral' {
        return current > prior ? 'up' : current < prior ? 'down' : 'neutral';
    }

    formatPercentageChange(current: number, prior: number): string {
        const percentage = this.percentageChange(current, prior);
        if (percentage === null) {
            return '—';
        }
        return `${percentage > 0 ? '+' : ''}${percentage.toFixed(1)}%`;
    }

    private updateSelectedPeriod() {
        this.currentForecast = this.findPeriod(this.currentYearData, this.selectedPeriod);
        this.priorForecast = this.findPeriod(this.lastYearData, this.selectedPeriod);
    }

    private getPeriods(data: Forecast[]): number[] {
        return [...new Set(data.map(item => this.getPeriod(item.forecastDate)))].sort((a, b) => a - b);
    }

    private findPeriod(data: Forecast[], period: number | null): Forecast | undefined {
        return period === null ? undefined : data.find(item => this.getPeriod(item.forecastDate) === period);
    }

    private getPeriod(dateString: string): number {
        const date = new Date(dateString);
        if (this.predictionType === 'M') {
            return date.getMonth();
        }

        const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNumber = utcDate.getUTCDay() || 7;
        utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNumber);
        const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
        return Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    }

    private clearComparison() {
        this.selectedPeriod = null;
        this.periods = [];
        this.currentForecast = undefined;
        this.priorForecast = undefined;
        this.currentYearData = [];
        this.lastYearData = [];
        this.errorMessage = '';
    }
}
