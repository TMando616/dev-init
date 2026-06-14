import { AuthProvider } from "@/context/AuthContext";
import MainLayout from "@/components/MainLayout";

export default function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <MainLayout>
        {children}
      </MainLayout>
    </AuthProvider>
  );
}
