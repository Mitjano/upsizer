import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import ToolStatusClient from "./ToolStatusClient";

export const dynamic = 'force-dynamic';

export default async function ToolStatusPage() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/admin");
  }

  return <ToolStatusClient />;
}
