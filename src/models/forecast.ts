export interface Forecast {
    forecastDate: string;
    predictedQuotes: number;
    lowerBound: number;
    upperBound: number;
    actualQuotes: number;
}