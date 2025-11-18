// components/auto-integrate/AiPhotoChecker.tsx
"use client";

export default function AiPhotoChecker({ photos }: { photos: any[] }) {
  const beforePhotos = photos.filter((p) => p.type === "before");
  const afterPhotos = photos.filter((p) => p.type === "after");
  const damagePhotos = photos.filter((p) => p.type === "damage");

  const issues: string[] = [];

  // Required photo logic
  if (beforePhotos.length < 2) {
    issues.push(`Missing Before Photos: ${2 - beforePhotos.length} more required`);
  }

  if (afterPhotos.length < 1) {
    issues.push("Missing After Photo: At least 1 required");
  }

  if (damagePhotos.length < 1) {
    issues.push("Missing Concern/Damage Photo");
  }

  const hasIssues = issues.length > 0;

  return (
    <div className={`border rounded-lg p-4 shadow-sm ${hasIssues ? "bg-red-50 border-red-300" : "bg-green-50 border-green-300"}`}>
      <h2 className="font-semibold text-lg mb-2 flex items-center">
        {hasIssues ? (
          <span className="text-red-600">Photo Completeness Check ⚠️</span>
        ) : (
          <span className="text-green-700">All Required Photos Present ✔</span>
        )}
      </h2>

      {hasIssues ? (
        <ul className="list-disc ml-5 text-red-700 space-y-1">
          {issues.map((issue, i) => (
            <li key={i}>{issue}</li>
          ))}
        </ul>
      ) : (
        <p className="text-green-700">All required photos have been uploaded.</p>
      )}
    </div>
  );
}
