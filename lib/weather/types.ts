export type WeatherSymbol = string;

export type CurrentWeather = {
  temperature: number;
  feelsLike: number;
  symbol: WeatherSymbol;
  windSpeed: number;
  windDirection: number;
  humidity: number;
  pressure: number;
  precipitationNext1h: number;
  precipitationNext6h: number;
  updatedAt: string;
};

export type HourlyForecast = {
  time: string;
  temperature: number;
  symbol: WeatherSymbol;
  precipitation: number;
  windSpeed: number;
};

export type DailyForecast = {
  date: string;
  tempMin: number;
  tempMax: number;
  symbol: WeatherSymbol;
  precipitation: number;
};

export type SunTimes = {
  sunrise: string | null;
  sunset: string | null;
};

export type WeatherData = {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  sun: SunTimes;
};

export type MetInstantDetails = {
  air_temperature: number;
  wind_speed: number;
  wind_from_direction: number;
  relative_humidity: number;
  air_pressure_at_sea_level: number;
  cloud_area_fraction?: number;
};

export type MetPeriodSummary = {
  symbol_code: string;
};

export type MetPeriodDetails = {
  precipitation_amount?: number;
  air_temperature_max?: number;
  air_temperature_min?: number;
};

export type MetTimeseriesEntry = {
  time: string;
  data: {
    instant: {
      details: MetInstantDetails;
    };
    next_1_hours?: {
      summary: MetPeriodSummary;
      details: MetPeriodDetails;
    };
    next_6_hours?: {
      summary: MetPeriodSummary;
      details: MetPeriodDetails;
    };
    next_12_hours?: {
      summary: MetPeriodSummary;
      details: MetPeriodDetails;
    };
  };
};

export type MetForecastResponse = {
  properties: {
    meta: {
      updated_at: string;
      units: Record<string, string>;
    };
    timeseries: MetTimeseriesEntry[];
  };
};

export type MetSunResponse = {
  properties: {
    sunrise?: {
      time: string;
    };
    sunset?: {
      time: string;
    };
  };
};
