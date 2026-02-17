import { QuoteForm } from "@/components/quote-form";

export default function QuotePage() {
  return (
    <section className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">Get a Free Quote</h1>
      <p className="mt-2 text-slate-700">Tell us about your stump grinding job and we’ll get back to you promptly.</p>
      <div className="mt-6">
        <QuoteForm />
      </div>
    </section>
  );
}
