import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Forecast } from '../models/forecast';
import { Observable } from 'rxjs';

@Service()
export class ForecastService {
    private http = inject(HttpClient);
    private api = 'https://localhost:7081/api/forecast';

    getForecast(): Observable<Forecast[]> {
        return this.http.get<Forecast[]>(this.api);
    }

    getForecastByYear(year: number, predictionType: 'M' | 'W'): Observable<Forecast[]> {
        return this.http.get<Forecast[]>(`${this.api}/year/${year}?predictionType=${predictionType}`);
    }

    getForecastComparison(year1: number, year2: number, predictionType: 'M' | 'W'): Observable<{
        year1: Forecast[];
        year2: Forecast[];
    }> {
        return this.http.get<{
            year1: Forecast[];
            year2: Forecast[];
        }>(`${this.api}/comparison?year1=${year1}&year2=${year2}&predictionType=${predictionType}`);
    }

    // Get current year and last year
    getCurrentYear(): number {
        return new Date().getFullYear();
    }

    getLastYear(): number {
        return this.getCurrentYear() - 1;
    }
}
