type TestimonialCardProps = {
  quote: string;
  author: string;
};

export function TestimonialCard({ quote, author }: TestimonialCardProps) {
  return (
    <article className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <p className="text-slate-700">“{quote}”</p>
      <p className="mt-3 font-medium text-foreground">— {author}</p>
    </article>
  );
}
