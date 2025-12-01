import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getAllApiKeys, getAllUsers } from "@/lib/db";
import ApiKeysClient from "./ApiKeysClient";

export default async function ApiKeysPage() {
  const session = await auth();

  if (!session?.user?.isAdmin) {
    redirect("/admin");
  }

  const allApiKeys = await getAllApiKeys();
  const allUsers = await getAllUsers();

  const apiKeysWithUsers = allApiKeys.map(key => {
    const user = allUsers.find(u => u.id === key.userId);
    return {
      ...key,
      userName: user?.name || user?.email || 'Unknown',
      userEmail: user?.email || '',
    };
  });

  const stats = {
    total: allApiKeys.length,
    active: allApiKeys.filter(k => k.status === 'active').length,
    revoked: allApiKeys.filter(k => k.status === 'revoked').length,
    totalUsage: allApiKeys.reduce((sum, k) => sum + k.usageCount, 0),
  };

  return <ApiKeysClient apiKeys={apiKeysWithUsers} stats={stats} users={allUsers} />;
}
