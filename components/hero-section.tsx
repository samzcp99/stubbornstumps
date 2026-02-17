import Link from "next/link";

import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100 md:p-10">
      <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-5xl">Stubborn Stumps</h1>
      <p className="mt-4 max-w-2xl text-lg text-slate-700">
        Professional stump grinding service in Invercargill & Southland.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/quote">
          <Button size="lg">Get Free Quote</Button>
        </Link>
        <a href="tel:+64000000000">
          <Button variant="accent" size="lg">
            Call Now
          </Button>
        </a>
      </div>
    </section>
  );
}
