export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-slate-700 md:grid-cols-2">
        <div>
          <h3 className="mb-2 font-semibold text-foreground">Service Area</h3>
          <p>Invercargill & Southland, New Zealand</p>
        </div>
        <div>
          <h3 className="mb-2 font-semibold text-foreground">Contact</h3>
          <p>Phone and email details available on request.</p>
        </div>
      </div>
    </footer>
  );
}
