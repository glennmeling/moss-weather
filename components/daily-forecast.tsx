import { getTranslations } from "next-intl/server";

import { Card } from "@/components/ui/card";
import { WeatherIcon } from "@/components/weather-icon";
import type { DailyForecast as DailyForecastType } from "@/lib/weather/types";

type Props = {
  daily: DailyForecastType[];
  locale: string;
};

export async function DailyForecast({ daily, locale }: Props) {
  const t = await getTranslations();

  const today = new Date().toISOString().slice(0, 10);
  const maxRange = Math.max(
    ...daily.map((d) => d.tempMax - d.tempMin),
    1,
  );

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {t("sections.daily")}
      </h2>
      <div className="space-y-1">
        {daily.map((day) => {
          const date = new Date(day.date);
          const isToday = day.date === today;
          const weekday = date.toLocaleDateString(locale, {
            weekday: "long",
          });
          const dateLabel = date.toLocaleDateString(locale, {
            day: "numeric",
            month: "short",
          });
          const rangePct = ((day.tempMax - day.tempMin) / maxRange) * 100;

          return (
            <div
              key={day.date}
              className="grid grid-cols-[minmax(0,1.5fr)_auto_minmax(0,1fr)_auto] items-center gap-4 border-b border-border/40 py-3 last:border-0 sm:grid-cols-[minmax(0,1.5fr)_auto_minmax(0,1.5fr)_auto]"
            >
              <div className="min-w-0">
                <p className="truncate font-medium capitalize">
                  {isToday ? t("sections.now") : weekday}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {dateLabel}
                </p>
              </div>
              <WeatherIcon symbol={day.symbol} size={40} />
              <div className="flex items-center gap-2">
                <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">
                  {Math.round(day.tempMin)}°
                </span>
                <div
                  className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
                  aria-hidden
                >
                  <div
                    className="absolute top-0 h-full rounded-full bg-gradient-to-r from-sky-400 via-amber-400 to-rose-500"
                    style={{
                      width: `${Math.max(rangePct, 15)}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-medium tabular-nums w-8">
                  {Math.round(day.tempMax)}°
                </span>
              </div>
              <span className="tabular-nums text-xs text-sky-600 dark:text-sky-400 w-14 text-right">
                {day.precipitation > 0.05
                  ? `${day.precipitation.toFixed(1)} ${t("units.mm")}`
                  : ""}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
