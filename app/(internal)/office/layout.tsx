import AppLayout from "@/components/layout/AppLayout";

export default function OfficeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppLayout>{children}</AppLayout>;
}
