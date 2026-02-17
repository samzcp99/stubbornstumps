import Link from "next/link";

import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="rounded-2xl bg-primary p-8 text-primary-foreground">
      <h2 className="text-2xl font-semibold">Need stump removal done right?</h2>
      <p className="mt-2 text-sm/6 opacity-95">
        Fast, reliable and affordable stump grinding for residential and commercial properties.
      </p>
      <Link href="/quote" className="mt-5 inline-flex">
        <Button variant="outline" className="border-white bg-white text-primary hover:bg-slate-100">
          Get Free Quote
        </Button>
      </Link>
    </section>
  );
}
