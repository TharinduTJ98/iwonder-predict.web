import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Forecast } from '../models/forecast';
import { Observable } from 'rxjs';

@Service()
export class ForecastService {
    private http = inject(HttpClient);
    private api = 'https://iwonder-gzewb3d3hwafhma7.indiasouthcentral-01.azurewebsites.net/api/Forecast';

    getForecast(): Observable<Forecast[]> {
        return this.http.get<Forecast[]>(this.api);
    }

    getForecastByYear(year: number, panelName: string, productName: string, predictionType: 'M' | 'W'): Observable<Forecast[]> {
        const params = new HttpParams()
            .set('panelName', panelName)
            .set('productName', productName)
            .set('predictionType', predictionType);

        return this.http.get<Forecast[]>(`${this.api}/year/${year}`, { params });
    }

    getFutureForecast(year1: number, year2: number, panelName: string, productName: string, predictionType: 'M' | 'W'): Observable<{
        year1: Forecast[];
        year2: Forecast[];
    }> {
        const params = new HttpParams()
            .set('year1', year1)
            .set('year2', year2)
            .set('panelName', panelName)
            .set('productName', productName)
            .set('predictionType', predictionType);

        return this.http.get<{
            year1: Forecast[];
            year2: Forecast[];
        }>(`${this.api}/ForecastComparison`, { params });
    }

    // Get current year and last year
    getCurrentYear(): number {
        return new Date().getFullYear();
    }

    getLastYear(): number {
        return this.getCurrentYear() - 1;
    }
}
