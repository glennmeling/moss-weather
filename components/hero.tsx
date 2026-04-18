import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { WeatherIcon } from "@/components/weather-icon";
import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { isDaytime } from "@/lib/weather/sun";
import { symbolKey } from "@/lib/weather/symbol-label";
import type { CurrentWeather, SunTimes } from "@/lib/weather/types";

function gradientFor(symbol: string, isDay: boolean): string {
  const base = symbolKey(symbol);

  if (base === "clearsky" || base === "fair") {
    return isDay
      ? "from-sky-300 via-sky-400 to-blue-600"
      : "from-indigo-900 via-slate-900 to-black";
  }
  if (base === "partlycloudy") {
    return isDay
      ? "from-sky-300 via-slate-400 to-slate-600"
      : "from-indigo-900 via-slate-800 to-slate-950";
  }
  if (base.includes("thunder")) {
    return "from-slate-600 via-slate-800 to-slate-950";
  }
  if (base.includes("rain") || base.includes("sleet")) {
    return isDay
      ? "from-slate-400 via-slate-500 to-slate-700"
      : "from-slate-700 via-slate-800 to-slate-950";
  }
  if (base.includes("snow")) {
    return isDay
      ? "from-slate-200 via-slate-300 to-slate-500"
      : "from-slate-600 via-slate-700 to-slate-900";
  }
  if (base === "fog") {
    return "from-slate-300 via-slate-400 to-slate-600";
  }
  if (base === "cloudy") {
    return isDay
      ? "from-slate-400 via-slate-500 to-slate-700"
      : "from-slate-700 via-slate-800 to-slate-950";
  }
  return "from-slate-400 via-slate-500 to-slate-700";
}

type Props = {
  current: CurrentWeather;
  sun: SunTimes;
  locale: string;
};

export async function Hero({ current, sun, locale }: Props) {
  const t = await getTranslations();
  const isDay = isDaytime(sun);
  const gradient = gradientFor(current.symbol, isDay);
  const weatherLabel = t(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (`weather.${symbolKey(current.symbol)}`) as any,
  );

  const updatedTime = new Date(current.updatedAt).toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Oslo",
  });

  return (
    <section
      className={`relative isolate overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} text-white shadow-2xl`}
    >
      <div className="absolute inset-0 opacity-40 mix-blend-overlay">
        <Image
          src="/images/moss-hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

      <div className="relative z-10 flex min-h-[60vh] flex-col gap-8 p-6 sm:p-10 md:p-14">
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-white/80">
              {t("hero.city")}
            </p>
            <p className="mt-1 text-[11px] text-white/60">
              {t("hero.updatedAt", { time: updatedTime })}
            </p>
          </div>
          <div className="flex gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </header>

        <div className="mt-auto flex flex-col gap-6">
          <div className="flex flex-wrap items-end gap-4 sm:gap-8">
            <WeatherIcon
              symbol={current.symbol}
              size={160}
              alt={weatherLabel}
              priority
              className="-ml-4 drop-shadow-2xl sm:-ml-6"
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-start">
                <span className="text-[7rem] font-light leading-none tabular-nums sm:text-[9rem] md:text-[11rem]">
                  {Math.round(current.temperature)}
                </span>
                <span className="mt-4 text-5xl font-light sm:mt-6 sm:text-6xl md:mt-8 md:text-7xl">
                  °
                </span>
              </div>
              <p className="mt-2 text-xl font-light text-white/95 sm:text-2xl md:text-3xl">
                {t("labels.nowDescription", {
                  weather: weatherLabel,
                  city: t("hero.city"),
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
