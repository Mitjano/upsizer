import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllModerationRules, getAllModerationQueue } from "@/lib/db";
import ModerationClient from "./ModerationClient";

export const dynamic = 'force-dynamic';

export default async function ModerationPage() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/admin");
  }

  const rules = getAllModerationRules();
  const queue = getAllModerationQueue();

  // Sort rules by creation date (newest first)
  rules.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const stats = {
    totalRules: rules.length,
    activeRules: rules.filter(r => r.enabled).length,
    totalQueue: queue.length,
    pending: queue.filter(q => q.status === 'pending').length,
    flagged: queue.filter(q => q.status === 'flagged').length,
    approved: queue.filter(q => q.status === 'approved').length,
    rejected: queue.filter(q => q.status === 'rejected').length,
  };

  return <ModerationClient rules={rules} queue={queue} stats={stats} />;
}
