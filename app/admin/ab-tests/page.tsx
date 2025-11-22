import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllABTests } from "@/lib/db";
import ABTestsClient from "./ABTestsClient";

export const dynamic = 'force-dynamic';

export default async function ABTestsPage() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/admin");
  }

  const tests = getAllABTests();

  // Sort by creation date (newest first)
  tests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const stats = {
    total: tests.length,
    running: tests.filter(t => t.status === 'running').length,
    completed: tests.filter(t => t.status === 'completed').length,
    draft: tests.filter(t => t.status === 'draft').length,
    paused: tests.filter(t => t.status === 'paused').length,
  };

  return <ABTestsClient tests={tests} stats={stats} />;
}
