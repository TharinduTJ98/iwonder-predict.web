export interface Forecast {
    forecastDate: string;
    predictedQuotes: number;
    lowerBound: number;
    upperBound: number;
    actualQuotes: number;
    predictedPremiumGbp: number;
    premiumLowerBound: number;
    premiumUpperBound: number;
    actualPremiumGbp: number;
    isForecast: boolean;
}