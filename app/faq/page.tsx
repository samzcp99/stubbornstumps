const faqs = [
  {
    question: "How much does stump grinding cost?",
    answer: "Pricing depends on stump size, quantity, and access. Request a free quote for accurate pricing.",
  },
  {
    question: "Do you service all of Southland?",
    answer: "Yes, we service Invercargill and wider Southland locations.",
  },
  {
    question: "How soon can you do the job?",
    answer: "We aim for fast turnaround and will confirm availability when you contact us.",
  },
];

export default function FaqPage() {
  return (
    <section>
      <h1 className="text-3xl font-bold">FAQ</h1>
      <div className="mt-6 space-y-4">
        {faqs.map((faq) => (
          <article key={faq.question} className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
            <h2 className="font-semibold">{faq.question}</h2>
            <p className="mt-2 text-slate-700">{faq.answer}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
