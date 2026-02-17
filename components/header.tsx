import Image from "next/image";
import Link from "next/link";
import { Phone } from "lucide-react";

import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/gallery", label: "Gallery" },
  { href: "/quote", label: "Quote" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center" aria-label="Stubborn Stumps home">
          <Image
            src="/logo.png"
            alt="Stubborn Stumps logo"
            width={160}
            height={40}
            className="h-8 w-auto md:h-10"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-5 text-sm md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="text-slate-700 transition hover:text-primary">
              {item.label}
            </Link>
          ))}
        </nav>

        <a href="tel:+64000000000" className="hidden md:inline-flex">
          <Button variant="accent" size="sm">
            <Phone className="mr-2 h-4 w-4" />
            Call Now
          </Button>
        </a>
      </div>
    </header>
  );
}
