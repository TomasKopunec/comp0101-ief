type ResponseData = {
    location: string;
    time: string;
    rating: number;
};

type Timeframe = {
    from: string;
    to: string;
};

type ForecastData = {
    generatedAt: string;
    requestedAt: string;
    location: string;
    dataStartAt: string;
    dataEndAt: string;
    windowSize: number;
    optimalDataPoints: OptimalDataPoint[];
    forecastData: ForecastDataPoint[];
}

type OptimalDataPoint = {
    location: string;
    timestamp: string;
    duration: number;
    value: number;
}

type ForecastDataPoint = {
    location: string;
    timestamp: string;
    duration: number;
    value: number;
}

interface ApiResponse {
    location: string;
    time: string;
    rating: number;
    duration: string;
}