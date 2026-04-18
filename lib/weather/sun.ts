import type { SunTimes } from "./types";

export function isDaytime(sun: SunTimes, at: Date = new Date()): boolean {
  if (!sun.sunrise || !sun.sunset) {
    const hour = at.getHours();
    return hour >= 6 && hour < 20;
  }

  const now = at.getTime();
  const sunrise = new Date(sun.sunrise).getTime();
  const sunset = new Date(sun.sunset).getTime();

  return now >= sunrise && now < sunset;
}

export function formatTime(
  iso: string | null,
  locale: string,
): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Oslo",
  });
}
