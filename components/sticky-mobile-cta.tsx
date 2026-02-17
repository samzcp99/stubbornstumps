import Link from "next/link";

import { Button } from "@/components/ui/button";

export function StickyMobileCTA() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white p-3 md:hidden">
      <div className="mx-auto flex max-w-6xl gap-2">
        <Link href="/quote" className="flex-1">
          <Button className="w-full" size="lg">
            Get Free Quote
          </Button>
        </Link>
        <a href="tel:+64000000000" className="flex-1">
          <Button className="w-full" size="lg" variant="accent">
            Call Now
          </Button>
        </a>
      </div>
    </div>
  );
}
