import { getTranslations } from "next-intl/server";

import { Card } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { WeatherIcon } from "@/components/weather-icon";
import type { HourlyForecast as HourlyForecastType } from "@/lib/weather/types";

type Props = {
  hourly: HourlyForecastType[];
  locale: string;
};

export async function HourlyForecast({ hourly, locale }: Props) {
  const t = await getTranslations();

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {t("sections.hourly")}
      </h2>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-3 pb-4">
          {hourly.map((hour) => {
            const time = new Date(hour.time).toLocaleTimeString(locale, {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Europe/Oslo",
            });
            return (
              <div
                key={hour.time}
                className="flex min-w-[80px] flex-col items-center gap-2 rounded-2xl border border-border/50 bg-muted/30 px-3 py-4"
              >
                <span className="text-xs text-muted-foreground tabular-nums">
                  {time}
                </span>
                <WeatherIcon symbol={hour.symbol} size={44} />
                <span className="text-lg font-medium tabular-nums">
                  {Math.round(hour.temperature)}°
                </span>
                {hour.precipitation > 0.05 ? (
                  <span className="text-xs font-medium tabular-nums text-sky-600 dark:text-sky-400">
                    {hour.precipitation.toFixed(1)} {t("units.mm")}
                  </span>
                ) : (
                  <span className="h-4" />
                )}
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </Card>
  );
}
