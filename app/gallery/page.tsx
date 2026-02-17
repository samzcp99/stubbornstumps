import { GalleryGrid } from "@/components/gallery-grid";

export default function GalleryPage() {
  return (
    <section>
      <h1 className="text-3xl font-bold">Gallery</h1>
      <p className="mt-2 text-slate-700">A look at recent stump grinding work around Southland.</p>
      <div className="mt-6">
        <GalleryGrid />
      </div>
    </section>
  );
}
