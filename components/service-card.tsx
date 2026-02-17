type ServiceCardProps = {
  title: string;
  description: string;
};

export function ServiceCard({ title, description }: ServiceCardProps) {
  return (
    <article className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-slate-700">{description}</p>
    </article>
  );
}
