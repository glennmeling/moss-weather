import Image from "next/image";

import { cn } from "@/lib/utils";

type Props = {
  symbol: string;
  size?: number;
  alt?: string;
  className?: string;
  priority?: boolean;
};

export function WeatherIcon({
  symbol,
  size = 64,
  alt,
  className,
  priority,
}: Props) {
  return (
    <Image
      src={`/weather-icons/${symbol}.svg`}
      alt={alt ?? symbol}
      width={size}
      height={size}
      priority={priority}
      className={cn("select-none", className)}
      draggable={false}
    />
  );
}
