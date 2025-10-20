// app/fm/requests/new/page.tsx
import ClassicCreateRequest from "./ui/ClassicCreateRequest";

export default function NewRequestPage() {
  return (
    <div className="mx-auto max-w-4xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Create Service Request</h1>
      <ClassicCreateRequest />
    </div>
  );
}
