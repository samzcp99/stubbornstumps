import { CTASection } from "@/components/cta-section";
import { GalleryGrid } from "@/components/gallery-grid";
import { HeroSection } from "@/components/hero-section";
import { ServiceCard } from "@/components/service-card";
import { TestimonialCard } from "@/components/testimonial-card";

const services = [
  {
    title: "Residential Stump Grinding",
    description: "Safe and clean stump removal for yards, gardens, and driveways.",
  },
  {
    title: "Commercial Site Clearing",
    description: "Efficient stump grinding for builders, landscapers, and property managers.",
  },
  {
    title: "Root & Surface Cleanup",
    description: "Optional cleanup to leave your site tidy and ready for the next step.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-12">
      <HeroSection />

      <section>
        <h2 className="text-2xl font-semibold">Our Services</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.title} title={service.title} description={service.description} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">Recent Jobs</h2>
        <p className="mt-2 text-slate-700">Examples of stump grinding projects across Southland.</p>
        <div className="mt-4">
          <GalleryGrid />
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold">What Customers Say</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <TestimonialCard quote="Quick response and the site was spotless when finished." author="Invercargill Homeowner" />
          <TestimonialCard quote="Reliable team and fair pricing. Highly recommended." author="Southland Property Manager" />
        </div>
      </section>

      <CTASection />
    </div>
  );
}
