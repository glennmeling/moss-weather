import { getTranslations, setRequestLocale } from "next-intl/server";

import { DailyForecast } from "@/components/daily-forecast";
import { Hero } from "@/components/hero";
import { HourlyForecast } from "@/components/hourly-forecast";
import { WeatherDetails } from "@/components/weather-details";
import { fetchMossWeather } from "@/lib/weather/met-client";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const weather = await fetchMossWeather();
  const t = await getTranslations();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-4 sm:p-6 md:p-8">
      <Hero
        current={weather.current}
        sun={weather.sun}
        locale={locale}
      />
      <WeatherDetails
        current={weather.current}
        sun={weather.sun}
        locale={locale}
      />
      <HourlyForecast hourly={weather.hourly} locale={locale} />
      <DailyForecast daily={weather.daily} locale={locale} />

      <footer className="mt-4 flex items-center justify-between pb-2 text-xs text-muted-foreground">
        <span>
          {t("labels.source")}:{" "}
          <a
            href="https://api.met.no"
            className="underline underline-offset-2 transition-colors hover:text-foreground"
            target="_blank"
            rel="noreferrer"
          >
            MET Norway
          </a>
        </span>
        <span aria-hidden>📍 59.44°N, 10.66°E</span>
      </footer>
    </main>
  );
}
