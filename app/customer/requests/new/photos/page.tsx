"use client";

import { useRouter } from "next/navigation";
import { TeslaStepper } from "@/components/tesla/TeslaStepper";
import { TeslaPhotoUploader } from "@/components/tesla/TeslaPhotoUploader";
import { useNewRequest } from "@/hooks/useNewRequest";

export default function NewRequestPhotosPage() {
  const router = useRouter();
  const { data, addPhoto } = useNewRequest(); // ⭐ Global Wizard State

  function handleNext() {
    if (!data.photos || data.photos.length === 0) {
      alert("Please upload at least 1 photo.");
      return;
    }

    router.push("/customer/requests/new/review");
  }

  return (
    <div className="px-6 py-12 space-y-10">
      {/* TESLA STEPPER */}
      <TeslaStepper steps={["Photos", "AI Review", "Submit"]} current={1} />

      {/* UPLOAD BLOCK */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h2 className="text-lg font-semibold">Upload Photos</h2>
        <p className="text-gray-500 text-sm mt-1">
          Take clear photos of the vehicle issue or damage.
        </p>

        <div className="mt-5">
          <TeslaPhotoUploader
            onUploaded={(url: string) => addPhoto(url)} // ⭐ Save to global state
          />
        </div>

        {/* PREVIEW */}
        {data.photos.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mt-6">
            {data.photos.map((url, i) => (
              <img
                key={i}
                src={url}
                alt="uploaded"
                className="rounded-xl border object-cover w-full h-32"
              />
            ))}
          </div>
        )}
      </div>

      {/* NEXT BUTTON */}
      <button
        onClick={handleNext}
        className="w-full py-3 rounded-xl bg-black text-white font-medium hover:bg-gray-900 transition"
      >
        Continue to AI Review →
      </button>
    </div>
  );
}
