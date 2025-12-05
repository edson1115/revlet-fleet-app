// components/PhotoGrid.tsx
export function PhotoGrid({
  photos,
  onDelete,
  showDelete = false,
}: {
  photos: { id: string; url: string; kind: string }[];
  onDelete?: (p: any) => void;
  showDelete?: boolean;
}) {
  if (!photos.length) {
    return (
      <div className="text-sm text-gray-500">
        No photos uploaded.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {photos.map((p) => (
        <div key={p.id} className="relative">
          <img
            src={p.url}
            className="w-full h-40 object-cover rounded-xl border cursor-pointer"
            onClick={() => window.open(p.url, "_blank")}
          />
          
          {showDelete && onDelete && (
            <button
              className="absolute top-2 right-2 text-xs bg-red-600 text-white px-2 py-1 rounded"
              onClick={() => onDelete(p)}
            >
              Delete
            </button>
          )}

          <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded">
            {p.kind.toUpperCase()}
          </span>
        </div>
      ))}
    </div>
  );
}



