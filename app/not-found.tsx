import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <html lang="nb">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-8 text-center text-foreground">
        <h1 className="text-4xl font-light">404</h1>
        <p className="text-muted-foreground">
          Siden finnes ikke / Page not found
        </p>
        <Link
          href="/nb"
          className={buttonVariants({ variant: "outline" })}
        >
          Til forsiden
        </Link>
      </body>
    </html>
  );
}
