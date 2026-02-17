import Image from "next/image";

const gallery = [
  "/logo.png",
  "/logo.png",
  "/logo.png",
  "/logo.png",
  "/logo.png",
  "/logo.png",
];

export function GalleryGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {gallery.map((src, index) => (
        <div key={`${src}-${index}`} className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-100">
          <Image
            src={src}
            alt={`Stump grinding work ${index + 1}`}
            width={600}
            height={400}
            className="h-52 w-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}
