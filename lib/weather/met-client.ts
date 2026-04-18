import type {
  MetForecastResponse,
  MetSunResponse,
  SunTimes,
  WeatherData,
} from "./types";
import { transformWeather } from "./transform";

const MOSS_LAT = 59.4369;
const MOSS_LON = 10.6596;
const MOSS_ALT = 20;

const USER_AGENT = "MossWeather/1.0 mail@glennmeling.com";
const REVALIDATE_SECONDS = 600;

const FORECAST_URL = `https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=${MOSS_LAT}&lon=${MOSS_LON}&altitude=${MOSS_ALT}`;

function sunUrl(date: string): string {
  return `https://api.met.no/weatherapi/sunrise/3.0/sun?lat=${MOSS_LAT}&lon=${MOSS_LON}&date=${date}&offset=+01:00`;
}

async function fetchForecast(): Promise<MetForecastResponse> {
  const res = await fetch(FORECAST_URL, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
    next: {
      revalidate: REVALIDATE_SECONDS,
      tags: ["weather-moss"],
    },
  });

  if (!res.ok) {
    throw new Error(`MET forecast failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

async function fetchSunTimes(): Promise<SunTimes> {
  const today = new Date().toISOString().slice(0, 10);

  try {
    const res = await fetch(sunUrl(today), {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      },
      next: {
        revalidate: 3600,
        tags: ["sun-moss"],
      },
    });

    if (!res.ok) {
      return { sunrise: null, sunset: null };
    }

    const data: MetSunResponse = await res.json();
    return {
      sunrise: data.properties.sunrise?.time ?? null,
      sunset: data.properties.sunset?.time ?? null,
    };
  } catch {
    return { sunrise: null, sunset: null };
  }
}

export async function fetchMossWeather(): Promise<WeatherData> {
  const [forecast, sun] = await Promise.all([fetchForecast(), fetchSunTimes()]);
  return transformWeather(forecast, sun);
}

export { MOSS_LAT, MOSS_LON };
