import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Forecast } from '../models/forecast';
import { Observable } from 'rxjs';

@Service()
export class ForecastService {
    private http = inject(HttpClient);
    private api = 'iwonder-gzewb3d3hwafhma7.indiasouthcentral-01.azurewebsites.net/api/Forecast';

    getForecast(): Observable<Forecast[]> {
        return this.http.get<Forecast[]>(this.api);
    }

    getForecastByYear(year: number, panelName: string, productName: string, predictionType: 'M' | 'W'): Observable<Forecast[]> {
        return this.http.get<Forecast[]>(`${this.api}/year/${year}?panelName=${panelName}&productName=${productName}&predictionType=${predictionType}`);
    }

    getFutureForecast(year1: number, year2: number, panelName: string, productName: string, predictionType: 'M' | 'W'): Observable<{
        year1: Forecast[];
        year2: Forecast[];
    }> {
        return this.http.get<{
            year1: Forecast[];
            year2: Forecast[];
        }>(`${this.api}/ForecastComparison?year1=${year1}&year2=${year2}&panelName=${panelName}&productName=${productName}&predictionType=${predictionType}`);
    }

    // Get current year and last year
    getCurrentYear(): number {
        return new Date().getFullYear();
    }

    getLastYear(): number {
        return this.getCurrentYear() - 1;
    }
}
