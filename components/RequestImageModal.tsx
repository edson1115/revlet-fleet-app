"use client";

export function RequestImageModal({
  url,
  onClose,
}: {
  url: string;
  onClose: () => void;
}) {
  if (!url) return null;

  return (
    <div
      className="fixed inset-0 z-[999] bg-black/80 flex items-center justify-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <img
        src={url}
        className="max-w-[90%] max-h-[90%] rounded-lg shadow-2xl"
        alt="Preview"
      />
    </div>
  );
}
