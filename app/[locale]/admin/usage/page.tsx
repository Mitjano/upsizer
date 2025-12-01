import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllUsage, getAllUsers } from "@/lib/db";
import UsageClient from "./UsageClient";

export default async function UsagePage() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/admin");
  }

  const allUsage = await getAllUsage();
  const allUsers = await getAllUsers();

  // Calculate usage stats
  const totalUsage = allUsage.length;
  const totalCreditsUsed = allUsage.reduce((sum, u) => sum + u.creditsUsed, 0);

  // Group by type
  const usageByType = allUsage.reduce((acc, u) => {
    acc[u.type] = (acc[u.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group by date for chart
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return date.toISOString().split('T')[0];
  });

  const usageByDate = last30Days.map(date => {
    const count = allUsage.filter(u => u.createdAt.startsWith(date)).length;
    return { date, count };
  });

  // Top users by usage
  const userUsageMap = allUsage.reduce((acc, u) => {
    acc[u.userId] = (acc[u.userId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topUsers = Object.entries(userUsageMap)
    .map(([userId, count]) => {
      const user = allUsers.find(u => u.id === userId);
      return {
        userId,
        name: user?.name || user?.email || 'Unknown',
        email: user?.email || '',
        count,
        credits: user?.credits || 0,
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Recent usage
  const recentUsage = allUsage
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20)
    .map(u => {
      const user = allUsers.find(usr => usr.id === u.userId);
      return {
        ...u,
        userName: user?.name || user?.email || 'Unknown',
        userEmail: user?.email || '',
      };
    });

  const stats = {
    totalUsage,
    totalCreditsUsed,
    usageByType,
    avgCreditsPerUse: totalUsage > 0 ? (totalCreditsUsed / totalUsage).toFixed(2) : '0',
  };

  return <UsageClient stats={stats} usageByDate={usageByDate} topUsers={topUsers} recentUsage={recentUsage} />;
}
