import { AdminAuthProvider } from "@/context/AdminAuthContext";
import AdminLayout from "@/components/AdminLayout";

export default function AdminRouteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AdminAuthProvider>
      <AdminLayout>
        {children}
      </AdminLayout>
    </AdminAuthProvider>
  );
}
