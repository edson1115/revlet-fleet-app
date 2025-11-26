// components/UploadPhotoButton.tsx
"use client";

export function UploadPhotoButton({
  label,
  kind,
  onUpload,
}: {
  label: string;
  kind: "before" | "after" | "other";
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex flex-col space-y-1">
      <label className="text-sm font-medium">{label}</label>
      <input
        type="file"
        accept="image/*"
        className="border rounded p-2"
        onChange={(e) => onUpload(e)}
      />
    </div>
  );
}
