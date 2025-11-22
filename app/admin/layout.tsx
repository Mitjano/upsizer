import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

export const metadata = {
  title: "Admin Panel - Pixelift",
  description: "Pixelift Admin Dashboard",
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const adminCheck = await isAdmin();

  if (!adminCheck) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <div className="container mx-auto px-4 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
