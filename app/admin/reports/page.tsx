import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllReports } from "@/lib/db";
import ReportsClient from "./ReportsClient";

export const dynamic = 'force-dynamic';

export default async function ReportsPage() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/admin");
  }

  const reports = getAllReports();

  // Sort by creation date (newest first)
  reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const stats = {
    total: reports.length,
    users: reports.filter(r => r.type === 'users').length,
    usage: reports.filter(r => r.type === 'usage').length,
    revenue: reports.filter(r => r.type === 'revenue').length,
    campaigns: reports.filter(r => r.type === 'campaigns').length,
    totalDownloads: reports.reduce((sum, r) => sum + r.downloadCount, 0),
  };

  return <ReportsClient reports={reports} stats={stats} />;
}
