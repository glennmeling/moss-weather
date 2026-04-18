import {
  CloudRain,
  Droplets,
  Gauge,
  Sunrise,
  Sunset,
  Thermometer,
  Wind,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Card } from "@/components/ui/card";
import { formatTime } from "@/lib/weather/sun";
import { degreesToCompass } from "@/lib/weather/symbol-label";
import type { CurrentWeather, SunTimes } from "@/lib/weather/types";

type Props = {
  current: CurrentWeather;
  sun: SunTimes;
  locale: string;
};

export async function WeatherDetails({ current, sun, locale }: Props) {
  const t = await getTranslations();
  const compass = degreesToCompass(current.windDirection);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const directionLabel = t((`directions.${compass}`) as any);

  const items = [
    {
      icon: Thermometer,
      label: t("labels.feelsLike"),
      value: `${Math.round(current.feelsLike)}°`,
    },
    {
      icon: Wind,
      label: t("labels.wind"),
      value: `${current.windSpeed.toFixed(1)} ${t("units.mps")} ${directionLabel}`,
    },
    {
      icon: Droplets,
      label: t("labels.humidity"),
      value: `${current.humidity}${t("units.percent")}`,
    },
    {
      icon: Gauge,
      label: t("labels.pressure"),
      value: `${current.pressure} ${t("units.hpa")}`,
    },
    {
      icon: CloudRain,
      label: t("labels.precipitationNext1h"),
      value: `${current.precipitationNext1h.toFixed(1)} ${t("units.mm")}`,
    },
    {
      icon: Sunrise,
      label: t("labels.sunrise"),
      value: formatTime(sun.sunrise, locale) ?? "—",
    },
    {
      icon: Sunset,
      label: t("labels.sunset"),
      value: formatTime(sun.sunset, locale) ?? "—",
    },
  ];

  return (
    <Card className="p-6">
      <h2 className="mb-5 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {t("sections.details")}
      </h2>
      <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-start gap-3">
            <item.icon
              className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="truncate text-lg font-medium tabular-nums">
                {item.value}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
