"use client";

export function TeslaPhotoGallery({
  photos,
}: {
  photos?: string[] | null;
}) {
  if (!photos || photos.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500">
        No photos provided by customer.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
      {photos.map((src, i) => (
        <a
          key={i}
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          className="group"
        >
          <img
            src={src}
            alt={`Customer photo ${i + 1}`}
            className="rounded-xl border border-gray-200 object-cover h-32 w-full group-hover:opacity-90 transition"
          />
        </a>
      ))}
    </div>
  );
}
