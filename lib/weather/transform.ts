import type {
  CurrentWeather,
  DailyForecast,
  HourlyForecast,
  MetForecastResponse,
  WeatherData,
  SunTimes,
} from "./types";

function calculateFeelsLike(tempC: number, windSpeedMs: number): number {
  if (tempC > 10 || windSpeedMs < 1.34) return tempC;
  const windKmh = windSpeedMs * 3.6;
  const feels =
    13.12 +
    0.6215 * tempC -
    11.37 * Math.pow(windKmh, 0.16) +
    0.3965 * tempC * Math.pow(windKmh, 0.16);
  return Math.round(feels * 10) / 10;
}

function baseSymbol(symbol: string): string {
  return symbol.replace(/_(day|night|polartwilight)$/, "");
}

export function transformCurrent(
  forecast: MetForecastResponse,
): CurrentWeather {
  const first = forecast.properties.timeseries[0];
  const instant = first.data.instant.details;
  const next1h = first.data.next_1_hours;
  const next6h = first.data.next_6_hours;

  const symbol =
    next1h?.summary.symbol_code ||
    next6h?.summary.symbol_code ||
    "cloudy";

  return {
    temperature: Math.round(instant.air_temperature * 10) / 10,
    feelsLike: calculateFeelsLike(instant.air_temperature, instant.wind_speed),
    symbol,
    windSpeed: Math.round(instant.wind_speed * 10) / 10,
    windDirection: Math.round(instant.wind_from_direction),
    humidity: Math.round(instant.relative_humidity),
    pressure: Math.round(instant.air_pressure_at_sea_level),
    precipitationNext1h: next1h?.details.precipitation_amount ?? 0,
    precipitationNext6h: next6h?.details.precipitation_amount ?? 0,
    updatedAt: forecast.properties.meta.updated_at,
  };
}

export function transformHourly(
  forecast: MetForecastResponse,
  hours = 24,
): HourlyForecast[] {
  return forecast.properties.timeseries.slice(1, hours + 1).map((entry) => {
    const next1h = entry.data.next_1_hours;
    const symbol = next1h?.summary.symbol_code || "cloudy";

    return {
      time: entry.time,
      temperature: Math.round(entry.data.instant.details.air_temperature * 10) / 10,
      symbol,
      precipitation: next1h?.details.precipitation_amount ?? 0,
      windSpeed: Math.round(entry.data.instant.details.wind_speed * 10) / 10,
    };
  });
}

export function transformDaily(
  forecast: MetForecastResponse,
  days = 7,
): DailyForecast[] {
  const byDate = new Map<
    string,
    {
      temps: number[];
      symbols: { time: string; code: string }[];
      precipitation: number;
    }
  >();

  for (const entry of forecast.properties.timeseries) {
    const date = entry.time.slice(0, 10);
    if (!byDate.has(date)) {
      byDate.set(date, { temps: [], symbols: [], precipitation: 0 });
    }
    const agg = byDate.get(date)!;
    agg.temps.push(entry.data.instant.details.air_temperature);

    const symbol6h = entry.data.next_6_hours?.summary.symbol_code;
    if (symbol6h) {
      agg.symbols.push({ time: entry.time, code: symbol6h });
    }

    const precip =
      entry.data.next_1_hours?.details.precipitation_amount ??
      entry.data.next_6_hours?.details.precipitation_amount ??
      0;
    agg.precipitation += precip;
  }

  const result: DailyForecast[] = [];
  const sortedDates = Array.from(byDate.keys()).sort();

  for (const date of sortedDates.slice(0, days)) {
    const agg = byDate.get(date)!;
    if (agg.temps.length === 0) continue;

    const noonSymbol = agg.symbols.find((s) => {
      const hour = new Date(s.time).getUTCHours();
      return hour >= 10 && hour <= 14;
    });
    const symbol = noonSymbol?.code || agg.symbols[0]?.code || "cloudy";

    result.push({
      date,
      tempMin: Math.round(Math.min(...agg.temps) * 10) / 10,
      tempMax: Math.round(Math.max(...agg.temps) * 10) / 10,
      symbol,
      precipitation: Math.round(agg.precipitation * 10) / 10,
    });
  }

  return result;
}

export function transformWeather(
  forecast: MetForecastResponse,
  sun: SunTimes,
): WeatherData {
  return {
    current: transformCurrent(forecast),
    hourly: transformHourly(forecast, 24),
    daily: transformDaily(forecast, 7),
    sun,
  };
}

export { baseSymbol };
