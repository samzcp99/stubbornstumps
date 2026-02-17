import { ServiceCard } from "@/components/service-card";

const services = [
  {
    title: "Single Stump Removal",
    description: "Perfect for backyard stumps causing safety or landscaping issues.",
  },
  {
    title: "Multi-Stump Jobs",
    description: "Efficient grinding for larger sections or full property cleanups.",
  },
  {
    title: "Commercial & Rural",
    description: "Durable equipment for commercial sites and lifestyle blocks.",
  },
];

export default function ServicesPage() {
  return (
    <section>
      <h1 className="text-3xl font-bold">Services</h1>
      <p className="mt-2 text-slate-700">Professional stump grinding services in Invercargill and Southland.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {services.map((service) => (
          <ServiceCard key={service.title} title={service.title} description={service.description} />
        ))}
      </div>
    </section>
  );
}
