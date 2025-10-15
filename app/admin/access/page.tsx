// app/admin/page.tsx
import AdminUsers from "./users";

export default function AdminHome() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Admin</h1>
      <AdminUsers />
    </main>
  );
}
